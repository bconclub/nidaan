/**
 * In-memory audio store for serving TTS audio to WhatsApp via URL.
 *
 * WhatsApp requires audio to be fetched from a public URL.
 * We store the audio buffer temporarily and serve it via /api/audio/[id].
 * Entries auto-expire after 5 minutes.
 */

interface AudioEntry {
  buffer: Buffer;
  mimeType: string;
  createdAt: number;
}

const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const store = new Map<string, AudioEntry>();

/** Generate a random ID */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Clean up expired entries */
function cleanup(): void {
  const now = Date.now();
  const ids = Array.from(store.keys());
  for (const id of ids) {
    const entry = store.get(id);
    if (entry && now - entry.createdAt > EXPIRY_MS) {
      store.delete(id);
    }
  }
}

/**
 * Store an audio buffer and return its ID.
 */
export function storeAudio(buffer: Buffer, mimeType: string = "audio/ogg"): string {
  cleanup();
  const id = generateId();
  store.set(id, { buffer, mimeType, createdAt: Date.now() });
  console.log("[audio-store] Stored audio:", { id, size: buffer.length, mimeType, totalEntries: store.size });
  return id;
}

/**
 * Retrieve an audio entry by ID. Returns null if expired or not found.
 */
export function getAudio(id: string): AudioEntry | null {
  cleanup();
  const entry = store.get(id);
  if (!entry) {
    console.log("[audio-store] Audio not found:", id);
    return null;
  }
  console.log("[audio-store] Serving audio:", { id, size: entry.buffer.length, mimeType: entry.mimeType });
  return entry;
}
