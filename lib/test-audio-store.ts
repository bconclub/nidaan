/**
 * Stores the latest TTS audio buffer for debugging via /api/test-play.
 * This lets us open the URL in a browser to verify the audio actually plays.
 */

let latestAudio: Buffer | null = null;
let storedAt: number = 0;

export function setLatestAudio(buffer: Buffer): void {
  latestAudio = buffer;
  storedAt = Date.now();
  console.log("[test-audio-store] Stored latest audio:", buffer.length, "bytes");
}

export function getLatestAudio(): { buffer: Buffer; storedAt: number } | null {
  if (!latestAudio) return null;
  return { buffer: latestAudio, storedAt };
}
