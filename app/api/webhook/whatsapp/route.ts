import { NextRequest, NextResponse } from "next/server";
import {
  parseIncomingMessage,
  verifyWebhookSignature,
  sendTextMessage,
} from "@/lib/whatsapp";

/**
 * POST /api/webhook/whatsapp
 * Incoming WhatsApp message handler via Gupshup webhook.
 *
 * Flow:
 * 1. Verify webhook signature
 * 2. Parse incoming message
 * 3. Look up or create conversation
 * 4. If audio → STT via Sarvam
 * 5. Translate to English if needed
 * 6. Feed to triage engine / Claude
 * 7. Respond in patient's language via WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-gupshup-signature") ?? "";

    // Step 1: Verify webhook authenticity
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Step 2: Parse the incoming message
    const payload = JSON.parse(body);
    const message = parseIncomingMessage(payload);

    if (!message) {
      return NextResponse.json(
        { error: "Unable to parse message" },
        { status: 400 }
      );
    }

    // TODO: Step 3 — Look up or create conversation in Supabase
    // TODO: Step 4 — If audio message, convert to text via Sarvam STT
    // TODO: Step 5 — Translate to English if not already
    // TODO: Step 6 — Run through triage engine / Claude reasoning
    // TODO: Step 7 — Translate response back and send via WhatsApp

    // Placeholder acknowledgement
    await sendTextMessage(
      message.from,
      "Thank you for your message. Nidaan AI is processing your request."
    );

    return NextResponse.json({ status: "received" });
  } catch (error) {
    console.error("[webhook/whatsapp] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhook/whatsapp
 * Webhook verification endpoint (used during Gupshup setup).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("hub.challenge");

  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: "webhook active" });
}
