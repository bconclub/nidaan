import { NextRequest, NextResponse } from "next/server";
import { getAudio } from "@/lib/audio-store";

/**
 * GET /api/audio/[id]
 *
 * Serves stored TTS audio files for WhatsApp to fetch.
 * Audio is stored in-memory with 5-minute expiry.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  console.log("[api/audio] Request for audio:", id);

  const entry = getAudio(id);
  if (!entry) {
    console.log("[api/audio] Audio not found or expired:", id);
    return NextResponse.json(
      { error: "Audio not found or expired" },
      { status: 404 }
    );
  }

  return new NextResponse(new Uint8Array(entry.buffer), {
    status: 200,
    headers: {
      "Content-Type": entry.mimeType,
      "Content-Length": entry.buffer.length.toString(),
      "Cache-Control": "public, max-age=300",
    },
  });
}
