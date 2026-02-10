import { NextResponse } from "next/server";
import { getLatestAudio } from "@/lib/test-audio-store";

/**
 * GET /api/test-play
 *
 * Serves the most recent TTS audio so you can verify it plays in a browser.
 * Open https://nidaanai.vercel.app/api/test-play after sending a voice note.
 *
 * Returns audio/mpeg since Sarvam is configured to output MP3.
 */
export async function GET(): Promise<NextResponse> {
  const audio = getLatestAudio();

  if (!audio) {
    return NextResponse.json(
      { error: "No audio stored yet. Send a voice note first." },
      { status: 404 }
    );
  }

  const ageSeconds = Math.round((Date.now() - audio.storedAt) / 1000);

  // Check magic bytes to determine actual format
  const firstBytes = Array.from(audio.buffer.slice(0, 4));
  let contentType = "audio/mpeg"; // default assume MP3
  let formatName = "unknown";

  if (firstBytes[0] === 0xFF && (firstBytes[1] & 0xE0) === 0xE0) {
    contentType = "audio/mpeg";
    formatName = "MP3 (sync)";
  } else if (firstBytes[0] === 0x49 && firstBytes[1] === 0x44) {
    contentType = "audio/mpeg";
    formatName = "MP3 (ID3)";
  } else if (firstBytes[0] === 0x52 && firstBytes[1] === 0x49) {
    contentType = "audio/wav";
    formatName = "WAV (RIFF)";
  } else if (firstBytes[0] === 0x4F && firstBytes[1] === 0x67) {
    contentType = "audio/ogg";
    formatName = "OGG";
  }

  console.log("[test-play] Serving audio:", {
    size: audio.buffer.length,
    ageSeconds,
    firstBytes,
    formatName,
    contentType,
  });

  return new NextResponse(new Uint8Array(audio.buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": audio.buffer.length.toString(),
      "X-Audio-Format": formatName,
      "X-Audio-Age-Seconds": ageSeconds.toString(),
      "X-Audio-Size-Bytes": audio.buffer.length.toString(),
      "Cache-Control": "no-cache",
    },
  });
}
