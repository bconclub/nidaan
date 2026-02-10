import type { ConversationEntry, TriageAnalysis } from "@/types";

const MAX_MESSAGES = 20;
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/** In-memory conversation store keyed by phone number */
const conversations = new Map<string, ConversationEntry[]>();

/**
 * Get conversation history for a phone number.
 * Auto-expires entries older than 24 hours.
 */
export function getConversation(phoneNumber: string): ConversationEntry[] {
  const entries = conversations.get(phoneNumber);
  if (!entries) return [];

  // Filter out expired entries
  const now = Date.now();
  const valid = entries.filter(
    (e) => now - e.timestamp.getTime() < EXPIRY_MS
  );

  if (valid.length !== entries.length) {
    if (valid.length === 0) {
      conversations.delete(phoneNumber);
    } else {
      conversations.set(phoneNumber, valid);
    }
  }

  return valid;
}

/**
 * Add a message to the conversation.
 * Enforces max 20 messages per conversation (drops oldest).
 */
export function addMessage(
  phoneNumber: string,
  entry: ConversationEntry
): void {
  const existing = getConversation(phoneNumber);
  existing.push(entry);

  // Keep only the last MAX_MESSAGES
  if (existing.length > MAX_MESSAGES) {
    existing.splice(0, existing.length - MAX_MESSAGES);
  }

  conversations.set(phoneNumber, existing);
  console.log("[conversation] Stored message for:", phoneNumber, {
    role: entry.role,
    totalMessages: existing.length,
  });
}

/**
 * Get the last detected language for a user.
 * Returns the most recent language from their conversation entries.
 */
export function getLastLanguage(phoneNumber: string): string | null {
  const entries = getConversation(phoneNumber);
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].language) {
      return entries[i].language!;
    }
  }
  return null;
}

/**
 * Get conversation history formatted for Claude messages API.
 * Returns { role, content }[] for passing as conversation context.
 */
export function getConversationForClaude(
  phoneNumber: string
): { role: "user" | "assistant"; content: string }[] {
  return getConversation(phoneNumber).map((e) => ({
    role: e.role,
    content: e.content,
  }));
}

/**
 * Clear conversation for a phone number.
 */
export function clearConversation(phoneNumber: string): void {
  conversations.delete(phoneNumber);
  console.log("[conversation] Cleared for:", phoneNumber);
}
