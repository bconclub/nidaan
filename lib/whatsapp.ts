import { storeAudio } from "@/lib/audio-store";

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const GRAPH_API_BASE = "https://graph.facebook.com/v18.0";
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://nidaanai.vercel.app";

/**
 * Send a text message to a WhatsApp user via Meta Graph API.
 */
export async function sendTextMessage(
  to: string,
  text: string
): Promise<void> {
  console.log("[whatsapp] Sending text to:", to, "length:", text.length);

  const response = await fetch(
    `${GRAPH_API_BASE}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[whatsapp] sendTextMessage error:", response.status, errorBody);
    throw new Error(`WhatsApp send text failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  console.log("[whatsapp] Text sent, message_id:", data.messages?.[0]?.id);
}

/**
 * Send an audio message to a WhatsApp user via Meta Graph API.
 *
 * Strategy: Store audio in memory, serve via /api/audio/[id], send URL to WhatsApp.
 * This avoids media upload format issues — WhatsApp fetches the audio from our server.
 */
export async function sendAudioMessage(
  to: string,
  audioBase64: string
): Promise<void> {
  console.log("[whatsapp] Preparing audio for:", to, "base64 length:", audioBase64.length);

  // Step 1: Store audio buffer and get a public URL
  const audioBuffer = Buffer.from(audioBase64, "base64");
  const audioId = storeAudio(audioBuffer, "audio/ogg");
  const audioUrl = `${APP_BASE_URL}/api/audio/${audioId}`;

  console.log("[whatsapp] Audio stored, serving at:", audioUrl, "buffer size:", audioBuffer.length);

  // Step 2: Send audio message with link
  const messageBody = {
    messaging_product: "whatsapp",
    to,
    type: "audio",
    audio: { link: audioUrl },
  };

  console.log("[whatsapp] Sending audio message:", JSON.stringify(messageBody, null, 2));

  const sendResponse = await fetch(
    `${GRAPH_API_BASE}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageBody),
    }
  );

  if (!sendResponse.ok) {
    const errorBody = await sendResponse.text();
    console.error("[whatsapp] sendAudioMessage FULL error:", {
      status: sendResponse.status,
      statusText: sendResponse.statusText,
      errorBody,
      audioUrl,
      bufferSize: audioBuffer.length,
    });
    throw new Error(`WhatsApp send audio failed (${sendResponse.status}): ${errorBody}`);
  }

  const sendData = await sendResponse.json();
  console.log("[whatsapp] Audio sent successfully:", JSON.stringify(sendData));
}

/**
 * Download media from WhatsApp via Meta Graph API.
 *
 * 1. GET media metadata to obtain the download URL
 * 2. GET the actual file content as a Buffer
 */
export async function downloadMedia(mediaId: string): Promise<Buffer> {
  console.log("[whatsapp] Downloading media:", mediaId);

  // Step 1: Get the media URL
  const metaResponse = await fetch(`${GRAPH_API_BASE}/${mediaId}`, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    },
  });

  if (!metaResponse.ok) {
    const errorBody = await metaResponse.text();
    console.error("[whatsapp] Media metadata error:", metaResponse.status, errorBody);
    throw new Error(`WhatsApp media metadata failed (${metaResponse.status}): ${errorBody}`);
  }

  const metaData = await metaResponse.json();
  const mediaUrl = metaData.url;
  console.log("[whatsapp] Media URL obtained");

  // Step 2: Download the actual file
  const fileResponse = await fetch(mediaUrl, {
    headers: {
      Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    },
  });

  if (!fileResponse.ok) {
    const errorBody = await fileResponse.text();
    console.error("[whatsapp] Media download error:", fileResponse.status, errorBody);
    throw new Error(`WhatsApp media download failed (${fileResponse.status}): ${errorBody}`);
  }

  const arrayBuffer = await fileResponse.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log("[whatsapp] Media downloaded, size:", buffer.length);

  return buffer;
}
