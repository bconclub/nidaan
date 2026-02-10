const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const GRAPH_API_BASE = "https://graph.facebook.com/v18.0";

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
 * 1. Upload base64 audio as media
 * 2. Send audio message referencing the media_id
 */
export async function sendAudioMessage(
  to: string,
  audioBase64: string
): Promise<void> {
  const mimeType = "audio/ogg; codecs=opus";
  const fileName = "response.ogg";

  console.log("[whatsapp] Uploading audio for:", to, "mime:", mimeType, "base64 length:", audioBase64.length);

  // Step 1: Convert base64 OGG/Opus to Buffer and upload as media
  const audioBuffer = Buffer.from(audioBase64, "base64");
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });

  const uploadForm = new FormData();
  uploadForm.append("file", blob, fileName);
  uploadForm.append("type", mimeType);
  uploadForm.append("messaging_product", "whatsapp");

  console.log("[whatsapp] Media upload request:", {
    url: `${GRAPH_API_BASE}/${WHATSAPP_PHONE_NUMBER_ID}/media`,
    mimeType,
    fileName,
    bufferSize: audioBuffer.length,
  });

  const uploadResponse = await fetch(
    `${GRAPH_API_BASE}/${WHATSAPP_PHONE_NUMBER_ID}/media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
      body: uploadForm,
    }
  );

  if (!uploadResponse.ok) {
    const errorBody = await uploadResponse.text();
    console.error("[whatsapp] Media upload FULL error:", {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      errorBody,
      mimeType,
      fileName,
      bufferSize: audioBuffer.length,
    });
    throw new Error(`WhatsApp media upload failed (${uploadResponse.status}): ${errorBody}`);
  }

  const uploadData = await uploadResponse.json();
  const mediaId = uploadData.id;
  console.log("[whatsapp] Media uploaded successfully:", JSON.stringify(uploadData));

  // Step 2: Send audio message referencing the uploaded media
  const sendResponse = await fetch(
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
        type: "audio",
        audio: { id: mediaId },
      }),
    }
  );

  if (!sendResponse.ok) {
    const errorBody = await sendResponse.text();
    console.error("[whatsapp] sendAudioMessage error:", sendResponse.status, errorBody);
    throw new Error(`WhatsApp send audio failed (${sendResponse.status}): ${errorBody}`);
  }

  const sendData = await sendResponse.json();
  console.log("[whatsapp] Audio sent, message_id:", sendData.messages?.[0]?.id);
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
