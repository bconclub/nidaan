import { NextRequest, NextResponse } from "next/server";
import { getConversations, getConversationById } from "@/lib/conversation-db";

/**
 * GET /api/conversations
 *
 * Fetch conversations for the dashboard.
 * Query params:
 *   ?status=active|completed  — filter by status
 *   ?id=uuid                  — fetch single conversation
 *   ?limit=50                 — max rows
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const status = searchParams.get("status") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  try {
    if (id) {
      // Fetch single conversation
      const conversation = await getConversationById(id);
      if (!conversation) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(conversation);
    }

    // Fetch list
    const conversations = await getConversations({ status, limit });
    return NextResponse.json(conversations);
  } catch (error) {
    console.error("[api/conversations] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
