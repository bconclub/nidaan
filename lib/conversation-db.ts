/**
 * Persist conversations to Supabase for the live dashboard.
 *
 * Each phone number gets one row in the conversations table.
 * Messages are stored as a JSONB array and appended on each interaction.
 */

import { supabase } from "@/lib/supabase";

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  language?: string;
}

interface TriageData {
  condition: string;
  severity: string;
  confidence: number;
  recommended_action: string;
  specialist_needed: string;
  red_flags: string[];
  home_care: string;
}

interface ConversationRow {
  id: string;
  phone_number: string;
  contact_name: string;
  messages: ConversationMessage[];
  status: "active" | "completed";
  detected_language: string;
  last_triage: TriageData | null;
  created_at: string;
  updated_at: string;
}

/**
 * Upsert a conversation: add a new message and update metadata.
 * Creates the row if it doesn't exist for this phone number.
 */
export async function upsertConversation(params: {
  phoneNumber: string;
  contactName?: string;
  message: ConversationMessage;
  detectedLanguage?: string;
  triage?: TriageData | null;
  status?: "active" | "completed";
}): Promise<void> {
  const { phoneNumber, contactName, message, detectedLanguage, triage, status } = params;

  try {
    // Check if conversation exists for this phone number
    const { data: existing, error: fetchError } = await supabase
      .from("conversations")
      .select("id, messages, contact_name")
      .eq("phone_number", phoneNumber)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      // PGRST116 = no rows found (that's OK, we'll insert)
      console.error("[conversation-db] Fetch error:", fetchError);
    }

    if (existing) {
      // Update existing conversation: append message
      const messages = [...(existing.messages as ConversationMessage[]), message];

      const updateData: Record<string, unknown> = { messages };
      if (contactName && (!existing.contact_name || existing.contact_name === "Unknown")) {
        updateData.contact_name = contactName;
      }
      if (detectedLanguage) updateData.detected_language = detectedLanguage;
      if (triage) updateData.last_triage = triage;
      if (status) updateData.status = status;

      const { error: updateError } = await supabase
        .from("conversations")
        .update(updateData)
        .eq("id", existing.id);

      if (updateError) {
        console.error("[conversation-db] Update error:", updateError);
      } else {
        console.log("[conversation-db] Updated conversation:", existing.id, "messages:", messages.length);
      }
    } else {
      // Insert new conversation
      const insertData = {
        phone_number: phoneNumber,
        contact_name: contactName || "Unknown",
        messages: [message],
        status: status || "active",
        detected_language: detectedLanguage || "en-IN",
        last_triage: triage || null,
      };

      const { error: insertError } = await supabase
        .from("conversations")
        .insert(insertData);

      if (insertError) {
        console.error("[conversation-db] Insert error:", insertError);
      } else {
        console.log("[conversation-db] Created new conversation for:", phoneNumber);
      }
    }
  } catch (error) {
    // Don't throw — DB errors should never block the WhatsApp response
    console.error("[conversation-db] Unexpected error:", error);
  }
}

/**
 * Fetch all conversations for the dashboard, sorted by most recent.
 */
export async function getConversations(params?: {
  status?: string;
  limit?: number;
}): Promise<ConversationRow[]> {
  const limit = params?.limit || 50;

  let query = supabase
    .from("conversations")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (params?.status) {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[conversation-db] getConversations error:", error);
    return [];
  }

  return (data || []) as ConversationRow[];
}

/**
 * Get a single conversation by ID.
 */
export async function getConversationById(id: string): Promise<ConversationRow | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[conversation-db] getConversationById error:", error);
    return null;
  }

  return data as ConversationRow;
}
