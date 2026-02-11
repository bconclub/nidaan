import { NextRequest, NextResponse } from "next/server";
import { getConversations, getConversationById } from "@/lib/conversation-db";

/**
 * GET /api/dashboard
 *
 * Fetch dashboard data: all conversations with messages, sorted by updated_at desc.
 * Query params:
 *   ?id=uuid     — get single conversation with all messages
 *   ?status=...  — filter by status (active, completed, emergency)
 *   ?limit=50    — max rows returned
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const status = searchParams.get("status") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  try {
    if (id) {
      const conversation = await getConversationById(id);
      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
      return NextResponse.json(conversation);
    }

    const conversations = await getConversations({ status, limit });

    // Compute summary stats
    const stats = {
      total: conversations.length,
      active: conversations.filter((c) => c.status === "active").length,
      completed: conversations.filter((c) => c.status === "completed").length,
      emergency: conversations.filter((c) => c.status === "emergency").length,
      total_messages: conversations.reduce((sum, c) => sum + c.messages.length, 0),
    };

    return NextResponse.json({ conversations, stats });
  } catch (error) {
    console.error("[api/dashboard] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
