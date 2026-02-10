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
 * Incoming WhatsApp message handler (placeholder).
 */
export async function POST(request: Request) {
  // placeholder for now
  console.log("[webhook] POST received");
  return new Response("OK", { status: 200 });
}
