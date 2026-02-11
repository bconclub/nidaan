import { sendTextMessage, downloadMedia } from "@/lib/whatsapp";
import { speechToText, translate, textToSpeech } from "@/lib/sarvam";
import { analyzeSymptoms, toTriageAnalysis } from "@/lib/claude";
import { formatTriageMessage, sanitizeForTTS } from "@/lib/triage-engine";
import {
  addMessage,
  getConversationForClaude,
  getLastLanguage,
} from "@/lib/conversation-store";
import type { SarvamLanguageCode } from "@/types";
import { upsertConversation } from "@/lib/conversation-db";

/**
 * Safety check: extract clean message text from Claude's response.
 * If the response accidentally contains raw JSON, parse it and extract .message.
 * The user should only ever see natural language, never JSON.
 */
function extractCleanMessage(text: string): string {
  // If it doesn't look like JSON, return as-is
  if (!text.includes("{") || !text.includes("message")) {
    return text;
  }

  try {
    // Try to extract JSON from the text (handles code fences too)
    let jsonStr = text;
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed.message === "string") {
      console.log("[webhook] Extracted clean message from JSON leak");
      return parsed.message;
    }
  } catch {
    // Not valid JSON — check if it starts with { and contains "type"
    // This catches partial JSON leaks
    const msgMatch = text.match(/"message"\s*:\s*"([^"]+)"/);
    if (msgMatch) {
      console.log("[webhook] Extracted message via regex from partial JSON");
      return msgMatch[1];
    }
  }

  return text;
}

// Deduplicate: track processed message IDs (Meta sends retries)
const processedMessages = new Set<string>();

/**
 * GET /api/webhook
 * WhatsApp webhook verification (Meta/Facebook webhook handshake).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[webhook] Verification successful");
    return new Response(challenge, { status: 200 });
  }

  console.warn("[webhook] Verification failed:", { mode, token });
  return new Response("Forbidden", { status: 403 });
}

/**
 * POST /api/webhook
 * Incoming WhatsApp message handler with multi-turn conversation.
 *
 * Claude acts as an elite diagnostician:
 * - First 2-3 messages: asks follow-up questions
 * - After gathering enough info: provides full triage diagnosis
 * - Emergencies flagged immediately
 */
export async function POST(request: Request) {
  let sender: string | null = null;

  try {
    const body = await request.json();
    console.log("[webhook] POST received:", JSON.stringify(body).slice(0, 300));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      console.log("[webhook] No message in payload (status update), ignoring");
      return new Response("OK", { status: 200 });
    }

    // Deduplicate: Meta sends retries, skip already-processed messages
    const messageId = message.id as string | undefined;
    if (!messageId || processedMessages.has(messageId)) {
      console.log("[webhook] Duplicate or missing message ID, skipping:", messageId);
      return new Response("OK", { status: 200 });
    }
    processedMessages.add(messageId);

    // Auto-cleanup after 1000 entries
    if (processedMessages.size > 1000) processedMessages.clear();

    sender = message.from;
    const messageType: string = message.type;

    // Extract contact name from webhook payload
    const contacts = value?.contacts;
    const contactName = contacts?.[0]?.profile?.name || "Unknown";

    console.log("[webhook] Message from:", sender, "name:", contactName, "type:", messageType);

    if (messageType === "audio") {
      await handleAudioMessage(sender!, message, contactName);
    } else if (messageType === "text") {
      await handleTextMessage(sender!, message, contactName);
    } else {
      console.log("[webhook] Unsupported message type:", messageType);
      await sendTextMessage(
        sender!,
        "Nidaan AI currently supports text and voice messages. Please send a text or voice note describing your symptoms."
      );
    }
  } catch (error) {
    console.error("[webhook] Error processing message:", error);

    if (sender) {
      try {
        await sendTextMessage(
          sender,
          "Sorry, we encountered an issue processing your message. Please try again."
        );
      } catch {
        console.error("[webhook] Could not send error message to user");
      }
    }
  }

  return new Response("OK", { status: 200 });
}

/**
 * Core response pipeline.
 *
 * 1. Get conversation history for Claude
 * 2. Call analyzeSymptoms with history → get question or diagnosis
 * 3. If question: just send the question (short, translated, with TTS)
 * 4. If diagnosis: format full triage message (translated, with TTS)
 * 5. Store both user message and assistant response in conversation
 */
async function processAndRespond(
  sender: string,
  englishText: string,
  userLanguage: SarvamLanguageCode,
  contactName: string = "Unknown",
  originalText?: string,
  audioUrl?: string
): Promise<void> {
  // Store user message in conversation (in-memory for Claude context)
  addMessage(sender, {
    role: "user",
    content: englishText,
    timestamp: new Date(),
    language: userLanguage,
  });

  // Persist user message to Supabase (non-blocking)
  upsertConversation({
    phoneNumber: sender,
    contactName,
    message: {
      role: "user",
      content: englishText,
      original_text: originalText || englishText,
      english_text: englishText,
      timestamp: new Date().toISOString(),
      language: userLanguage,
      audio_url: audioUrl,
    },
    detectedLanguage: userLanguage,
  });

  // Get conversation history for Claude
  const history = getConversationForClaude(sender);
  // Remove the last entry (current message) — analyzeSymptoms will add it
  const priorHistory = history.slice(0, -1);

  console.log("[webhook] Calling Claude with history:", priorHistory.length, "messages");

  // Call Claude with conversation history
  const nidaanResponse = await analyzeSymptoms(englishText, undefined, priorHistory);

  let responseText: string;

  if (nidaanResponse.type === "question") {
    // Claude is asking a follow-up question — extract clean message only
    responseText = extractCleanMessage(nidaanResponse.message);
    console.log("[webhook] Claude asks:", responseText.slice(0, 100));
  } else {
    // Claude gave a diagnosis — format the full triage message
    const triageAnalysis = toTriageAnalysis(nidaanResponse);
    responseText = formatTriageMessage(triageAnalysis);
    console.log("[webhook] Diagnosis:", nidaanResponse.condition, nidaanResponse.severity);
  }

  // Store Claude's response in conversation (in-memory for Claude context)
  addMessage(sender, {
    role: "assistant",
    content: responseText,
    timestamp: new Date(),
    language: userLanguage,
    triage: nidaanResponse.type === "diagnosis"
      ? toTriageAnalysis(nidaanResponse)
      : undefined,
  });

  // Persist assistant response to Supabase (non-blocking)
  const triageData = nidaanResponse.type === "diagnosis"
    ? {
        condition: nidaanResponse.condition || "Unknown",
        severity: nidaanResponse.severity || "urgent",
        confidence: nidaanResponse.confidence || 0.5,
        recommended_action: nidaanResponse.recommended_action || "",
        specialist_needed: nidaanResponse.specialist_needed || "",
        red_flags: nidaanResponse.red_flags || [],
        home_care: nidaanResponse.home_care || "",
      }
    : null;

  // Determine conversation status
  let convStatus: "active" | "completed" | "emergency" = "active";
  if (nidaanResponse.type === "diagnosis") {
    const sev = nidaanResponse.severity;
    convStatus = (sev === "emergency") ? "emergency" : "completed";
  }

  // Translate response to user's language if needed
  let localizedMessage = responseText;
  if (userLanguage !== "en-IN") {
    console.log("[webhook] Translating response to", userLanguage);
    const backTranslate = await translate({
      input: responseText,
      source_language_code: "en-IN",
      target_language_code: userLanguage,
    });
    localizedMessage = backTranslate.translated_text;
  }

  // TTS + audio send (inline — exact same pattern as working test)
  // Sanitize for TTS: remove emojis, symbols, markdown that would be read literally
  const ttsText = sanitizeForTTS(localizedMessage);
  console.log("[webhook] Generating TTS, sanitized text:", ttsText.slice(0, 100));
  let assistantAudioMediaId: string | null = null;
  try {
    const ttsResult = await textToSpeech({
      text: ttsText,
      target_language_code: userLanguage,
    });

    if (ttsResult.audios?.[0]) {
      const ttsAudioBase64 = ttsResult.audios[0];

      // Decode base64 to buffer
      const audioBuffer = Buffer.from(ttsAudioBase64, "base64");
      console.log("[webhook] TTS audio buffer size:", audioBuffer.length);

      // Check audio format magic bytes
      const firstBytes = Array.from(audioBuffer.slice(0, 10));
      console.log("[webhook] Audio buffer first 10 bytes:", firstBytes);

      // Store for /api/test-play so we can verify in browser
      const { setLatestAudio } = await import("@/lib/test-audio-store");
      setLatestAudio(audioBuffer);

      // Auto-detect audio format from magic bytes
      let audioMime = "audio/mpeg";
      let audioFilename = "response.mp3";
      if (firstBytes[0] === 0x52 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46 && firstBytes[3] === 0x46) {
        audioMime = "audio/wav";
        audioFilename = "response.wav";
      } else if (firstBytes[0] === 0x4F && firstBytes[1] === 0x67 && firstBytes[2] === 0x67 && firstBytes[3] === 0x53) {
        audioMime = "audio/ogg";
        audioFilename = "response.ogg";
      } else if ((firstBytes[0] === 0x49 && firstBytes[1] === 0x44 && firstBytes[2] === 0x33) ||
                 (firstBytes[0] === 0xFF && (firstBytes[1] & 0xE0) === 0xE0)) {
        audioMime = "audio/mpeg";
        audioFilename = "response.mp3";
      }
      console.log("[webhook] Upload mime:", audioMime, "filename:", audioFilename);

      // Upload to Meta with auto-detected format
      const formData = new FormData();
      formData.append("messaging_product", "whatsapp");
      formData.append("file", new Blob([audioBuffer], { type: audioMime }), audioFilename);
      formData.append("type", audioMime);

      const uploadRes = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      console.log("[webhook] Media upload response:", JSON.stringify(uploadData));

      if (uploadData.id) {
        assistantAudioMediaId = uploadData.id as string;

        // Send audio — EXACT same way as working test
        const sendRes = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: sender,
            type: "audio",
            audio: { id: uploadData.id }
          })
        });
        const sendData = await sendRes.json();
        console.log("[webhook] Audio send response:", JSON.stringify(sendData));
      } else {
        console.error("[webhook] Media upload failed, no ID returned:", uploadData);
      }
    }
  } catch (ttsError) {
    console.error("[webhook] TTS/audio failed, skipping audio:", ttsError);
  }

  // Persist assistant response to Supabase AFTER TTS
  // so we capture both translated text and audio media ID
  upsertConversation({
    phoneNumber: sender,
    contactName,
    message: {
      role: "assistant",
      content: responseText,
      original_text: localizedMessage,
      english_text: responseText,
      timestamp: new Date().toISOString(),
      language: userLanguage,
      audio_url: assistantAudioMediaId
        ? `https://graph.facebook.com/v18.0/${assistantAudioMediaId}`
        : undefined,
    },
    detectedLanguage: userLanguage,
    triage: triageData,
    status: convStatus,
  });

  // Always send text — final safety: ensure no JSON leaks to user
  const cleanMessage = extractCleanMessage(localizedMessage);
  await sendTextMessage(sender, cleanMessage);
  console.log("[webhook] Response sent to:", sender);
}

/**
 * Handle audio: download → STT (auto-detect) → translate → processAndRespond
 */
async function handleAudioMessage(
  sender: string,
  message: Record<string, unknown>,
  contactName: string = "Unknown"
): Promise<void> {
  const audio = message.audio as Record<string, unknown>;
  const mediaId = audio?.id as string;

  if (!mediaId) {
    console.error("[webhook] No audio media ID found");
    await sendTextMessage(sender, "Could not process your voice message. Please try again.");
    return;
  }

  // Download audio
  console.log("[webhook] Downloading audio");
  const audioBuffer = await downloadMedia(mediaId);
  const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/ogg" });

  // STT (auto-detect language)
  console.log("[webhook] Running STT (auto-detect)");
  const sttResult = await speechToText({ audio: audioBlob });

  if (!sttResult.transcript) {
    await sendTextMessage(
      sender,
      "Could not understand the voice message. Please speak clearly and try again."
    );
    return;
  }

  const detectedLang = sttResult.language_code;
  console.log("[webhook] STT:", {
    transcript: sttResult.transcript.slice(0, 100),
    language: detectedLang,
    confidence: sttResult.language_probability,
  });

  // Translate to English if needed
  let englishText = sttResult.transcript;
  if (detectedLang !== "en-IN") {
    console.log("[webhook] Translating to English from", detectedLang);
    const translateResult = await translate({
      input: sttResult.transcript,
      source_language_code: detectedLang,
      target_language_code: "en-IN",
    });
    englishText = translateResult.translated_text;
  }

  // Pass original transcript + audio media URL for Supabase
  const audioMediaUrl = `https://graph.facebook.com/v18.0/${mediaId}`;
  await processAndRespond(sender, englishText, detectedLang, contactName, sttResult.transcript, audioMediaUrl);
}

/**
 * Handle text: auto-detect language → translate → processAndRespond
 *
 * Uses getLastLanguage() to remember returning users' language preference.
 */
async function handleTextMessage(
  sender: string,
  message: Record<string, unknown>,
  contactName: string = "Unknown"
): Promise<void> {
  const textObj = message.text as Record<string, unknown>;
  const userText = (textObj?.body as string) || "";

  if (!userText.trim()) {
    await sendTextMessage(sender, "Please describe your symptoms so we can help you.");
    return;
  }

  console.log("[webhook] User text:", userText.slice(0, 100));

  // Translate to English (auto-detect source language)
  console.log("[webhook] Translating to English (auto-detect)");
  const translateResult = await translate({
    input: userText,
    source_language_code: "auto",
    target_language_code: "en-IN",
  });

  const englishText = translateResult.translated_text;

  // Determine response language:
  // 1. If non-ASCII text → use last known language or default to "hi-IN"
  // 2. If ASCII → English
  const isNonEnglish = /[^\u0000-\u007F]/.test(userText);
  let userLanguage: SarvamLanguageCode;

  if (isNonEnglish) {
    // Use last detected language from conversation history, or default hi-IN
    const lastLang = getLastLanguage(sender);
    userLanguage = (lastLang as SarvamLanguageCode) || "hi-IN";
  } else {
    userLanguage = "en-IN";
  }

  console.log("[webhook] Response language:", userLanguage);
  await processAndRespond(sender, englishText, userLanguage, contactName, userText);
}
