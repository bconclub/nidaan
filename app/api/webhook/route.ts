import { sendTextMessage, sendAudioMessage, downloadMedia } from "@/lib/whatsapp";
import { speechToText, translate, textToSpeech } from "@/lib/sarvam";
import { analyzeSymptoms } from "@/lib/claude";
import { formatTriageMessage } from "@/lib/triage-engine";
import type { SarvamLanguageCode } from "@/types";

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
 * Simple heuristic: if text contains non-ASCII characters,
 * it's likely Hindi/Kannada/another Indian language.
 */
function isLikelyNonEnglish(text: string): boolean {
  // Match Devanagari, Kannada, Tamil, Telugu, Bengali, Gujarati, etc.
  const nonLatinPattern = /[^\u0000-\u007F]/;
  return nonLatinPattern.test(text);
}

/**
 * POST /api/webhook
 * Incoming WhatsApp message handler.
 *
 * Flow:
 * - Audio: download → STT → translate → triage → translate back → TTS → send audio + text
 * - Text:  detect language → translate → triage → translate back → TTS → send audio + text
 */
export async function POST(request: Request) {
  let sender: string | null = null;

  try {
    const body = await request.json();
    console.log("[webhook] POST received:", JSON.stringify(body).slice(0, 300));

    // Parse Meta webhook payload
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    // Guard: status updates or other non-message events
    if (!message) {
      console.log("[webhook] No message in payload (status update), ignoring");
      return new Response("OK", { status: 200 });
    }

    sender = message.from;
    const messageType: string = message.type;
    console.log("[webhook] Message from:", sender, "type:", messageType);

    if (messageType === "audio") {
      await handleAudioMessage(sender!, message);
    } else if (messageType === "text") {
      await handleTextMessage(sender!, message);
    } else {
      console.log("[webhook] Unsupported message type:", messageType);
      await sendTextMessage(
        sender!,
        "Nidaan AI currently supports text and voice messages. Please send a text or voice note describing your symptoms."
      );
    }
  } catch (error) {
    console.error("[webhook] Error processing message:", error);

    // Try to notify the user about the error
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

  // Always return 200 to Meta to prevent retries
  return new Response("OK", { status: 200 });
}

/**
 * Handle an incoming audio message:
 * download → STT → translate to English → triage → translate back → TTS → send
 */
async function handleAudioMessage(
  sender: string,
  message: Record<string, unknown>
): Promise<void> {
  const audio = message.audio as Record<string, unknown>;
  const mediaId = audio?.id as string;

  if (!mediaId) {
    console.error("[webhook] No audio media ID found");
    await sendTextMessage(sender, "Could not process your voice message. Please try again.");
    return;
  }

  // Step 1: Download audio from WhatsApp
  console.log("[webhook] Step 1: Downloading audio");
  const audioBuffer = await downloadMedia(mediaId);
  const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/ogg" });

  // Step 2: Speech-to-Text via Sarvam (default Hindi)
  console.log("[webhook] Step 2: Running STT");
  const sttResult = await speechToText({
    audio: audioBlob,
    language_code: "hi-IN",
  });

  if (!sttResult.transcript) {
    await sendTextMessage(
      sender,
      "Could not understand the voice message. Please speak clearly and try again."
    );
    return;
  }

  console.log("[webhook] STT transcript:", sttResult.transcript.slice(0, 100));
  const detectedLang = sttResult.language_code;
  const userLanguage: SarvamLanguageCode = detectedLang;

  // Step 3: Translate to English if not already English
  let englishText = sttResult.transcript;
  if (detectedLang !== "en-IN") {
    console.log("[webhook] Step 3: Translating to English from", detectedLang);
    const translateResult = await translate({
      input: sttResult.transcript,
      source_language_code: detectedLang,
      target_language_code: "en-IN",
    });
    englishText = translateResult.translated_text;
  }
  console.log("[webhook] English text:", englishText.slice(0, 100));

  // Step 4: Analyze symptoms via Claude
  console.log("[webhook] Step 4: Running triage");
  const triageResult = await analyzeSymptoms(englishText);
  const formattedMessage = formatTriageMessage(triageResult);
  console.log("[webhook] Triage:", triageResult.severity, triageResult.condition);

  // Step 5: Translate response back to user's language
  let localizedMessage = formattedMessage;
  if (userLanguage !== "en-IN") {
    console.log("[webhook] Step 5: Translating response to", userLanguage);
    const backTranslate = await translate({
      input: formattedMessage,
      source_language_code: "en-IN",
      target_language_code: userLanguage,
    });
    localizedMessage = backTranslate.translated_text;
  }

  // Step 6: Convert to speech via Sarvam TTS (with fallback)
  console.log("[webhook] Step 6: Generating TTS");
  try {
    const ttsResult = await textToSpeech({
      text: localizedMessage,
      target_language_code: userLanguage,
    });

    if (ttsResult.audios?.[0]) {
      await sendAudioMessage(sender, ttsResult.audios[0]);
      console.log("[webhook] Audio response sent");
    }
  } catch (ttsError) {
    console.error("[webhook] TTS failed, skipping audio response:", ttsError);
  }

  // Step 7: Always send text summary
  console.log("[webhook] Step 7: Sending text response");
  await sendTextMessage(sender, localizedMessage);

  console.log("[webhook] Audio message handled successfully for:", sender);
}

/**
 * Handle an incoming text message:
 * detect language → translate to English → triage → translate back → TTS → send
 */
async function handleTextMessage(
  sender: string,
  message: Record<string, unknown>
): Promise<void> {
  const textObj = message.text as Record<string, unknown>;
  const userText = (textObj?.body as string) || "";

  if (!userText.trim()) {
    await sendTextMessage(sender, "Please describe your symptoms so we can help you.");
    return;
  }

  console.log("[webhook] User text:", userText.slice(0, 100));

  // Step 1: Detect language (simple heuristic)
  const isNonEnglish = isLikelyNonEnglish(userText);
  const userLanguage: SarvamLanguageCode = isNonEnglish ? "hi-IN" : "en-IN";
  console.log("[webhook] Detected language:", userLanguage);

  // Step 2: Translate to English if not English
  let englishText = userText;
  if (isNonEnglish) {
    console.log("[webhook] Step 2: Translating to English");
    const translateResult = await translate({
      input: userText,
      source_language_code: userLanguage,
      target_language_code: "en-IN",
    });
    englishText = translateResult.translated_text;
  }
  console.log("[webhook] English text:", englishText.slice(0, 100));

  // Step 3: Analyze symptoms via Claude
  console.log("[webhook] Step 3: Running triage");
  const triageResult = await analyzeSymptoms(englishText);
  const formattedMessage = formatTriageMessage(triageResult);
  console.log("[webhook] Triage:", triageResult.severity, triageResult.condition);

  // Step 4: Translate response back to user's language
  let localizedMessage = formattedMessage;
  if (isNonEnglish) {
    console.log("[webhook] Step 4: Translating response to", userLanguage);
    const backTranslate = await translate({
      input: formattedMessage,
      source_language_code: "en-IN",
      target_language_code: userLanguage,
    });
    localizedMessage = backTranslate.translated_text;
  }

  // Step 5: Convert to speech via Sarvam TTS (with fallback)
  console.log("[webhook] Step 5: Generating TTS");
  try {
    const ttsResult = await textToSpeech({
      text: localizedMessage,
      target_language_code: userLanguage,
    });

    if (ttsResult.audios?.[0]) {
      await sendAudioMessage(sender, ttsResult.audios[0]);
      console.log("[webhook] Audio response sent");
    }
  } catch (ttsError) {
    console.error("[webhook] TTS failed, skipping audio response:", ttsError);
  }

  // Step 6: Always send text summary
  console.log("[webhook] Step 6: Sending text response");
  await sendTextMessage(sender, localizedMessage);

  console.log("[webhook] Text message handled successfully for:", sender);
}
