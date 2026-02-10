import type {
  WhatsAppIncomingMessage,
  WhatsAppOutgoingMessage,
} from "@/types";

const WHATSAPP_API_KEY = process.env.WHATSAPP_API_KEY!;
const GUPSHUP_API_URL = "https://api.gupshup.io/wa/api/v1/msg";

/**
 * Parse an incoming webhook payload from Gupshup into a structured message.
 */
export function parseIncomingMessage(
  payload: Record<string, unknown>
): WhatsAppIncomingMessage | null {
  // TODO: implement Gupshup webhook payload parsing
  console.log("[whatsapp] parseIncomingMessage called");
  return null;
}

/**
 * Send a text message to a WhatsApp user via Gupshup.
 */
export async function sendTextMessage(
  to: string,
  text: string
): Promise<boolean> {
  // TODO: implement Gupshup send text message API call
  console.log("[whatsapp] sendTextMessage called", { to });
  return false;
}

/**
 * Send an audio message to a WhatsApp user via Gupshup.
 */
export async function sendAudioMessage(
  to: string,
  audioUrl: string
): Promise<boolean> {
  // TODO: implement Gupshup send audio message API call
  console.log("[whatsapp] sendAudioMessage called", { to });
  return false;
}

/**
 * Send a structured message (e.g. list of facilities) via Gupshup.
 */
export async function sendListMessage(
  to: string,
  header: string,
  body: string,
  items: { title: string; description: string }[]
): Promise<boolean> {
  // TODO: implement Gupshup interactive list message API call
  console.log("[whatsapp] sendListMessage called", {
    to,
    item_count: items.length,
  });
  return false;
}

/**
 * Verify the webhook signature from Gupshup for security.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  // TODO: implement HMAC signature verification
  console.log("[whatsapp] verifyWebhookSignature called");
  return true;
}
