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
 * Strategy: Upload media to Meta → send by media ID.
 * FormData matches the exact working pattern from test-upload.
 */
export async function sendAudioMessage(
  to: string,
  audioBase64: string
): Promise<void> {
  console.log("[whatsapp] Preparing audio for:", to, "base64 length:", audioBase64.length);

  // Step 1: Decode base64 to buffer
  const audioBuffer = Buffer.from(audioBase64, "base64");
  console.log("[whatsapp] Audio buffer size:", audioBuffer.length);

  // Step 2: Upload to Meta (exact same FormData as working test)
  const formData = new FormData();
  formData.append("messaging_product", "whatsapp");
  formData.append("file", new Blob([audioBuffer], { type: "audio/mpeg" }), "response.mp3");
  formData.append("type", "audio/mpeg");

  const uploadRes = await fetch(
    `${GRAPH_API_BASE}/${WHATSAPP_PHONE_NUMBER_ID}/media`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
      body: formData,
    }
  );

  const uploadData = await uploadRes.json();
  console.log("[whatsapp] Upload response:", JSON.stringify(uploadData));

  if (!uploadRes.ok || !uploadData.id) {
    console.error("[whatsapp] Media upload failed:", {
      status: uploadRes.status,
      response: uploadData,
      bufferSize: audioBuffer.length,
    });
    throw new Error(`WhatsApp media upload failed (${uploadRes.status}): ${JSON.stringify(uploadData)}`);
  }

  // Step 3: Send audio message using uploaded media ID
  const sendRes = await fetch(
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
        audio: { id: uploadData.id },
      }),
    }
  );

  const sendData = await sendRes.json();
  console.log("[whatsapp] Send response:", JSON.stringify(sendData));

  if (!sendRes.ok) {
    console.error("[whatsapp] sendAudioMessage error:", {
      status: sendRes.status,
      response: sendData,
      mediaId: uploadData.id,
    });
    throw new Error(`WhatsApp send audio failed (${sendRes.status}): ${JSON.stringify(sendData)}`);
  }

  console.log("[whatsapp] Audio sent successfully, message_id:", sendData.messages?.[0]?.id);
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
