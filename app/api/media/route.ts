import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/media?url=<whatsapp_media_url>
 *
 * Proxy for WhatsApp media URLs. The Graph API requires an access token
 * to fetch media, so the dashboard uses this proxy to play audio.
 *
 * Flow:
 * 1. Client passes the Graph API media URL (e.g. https://graph.facebook.com/v18.0/{id})
 * 2. We fetch the media URL with the WhatsApp token → get a redirect to CDN
 * 3. We fetch the CDN URL → stream the audio bytes back to the client
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const mediaUrl = request.nextUrl.searchParams.get("url");

  if (!mediaUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Validate it's a Facebook/WhatsApp Graph API URL
  if (!mediaUrl.includes("graph.facebook.com")) {
    return NextResponse.json({ error: "Invalid media URL" }, { status: 400 });
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "WhatsApp token not configured" }, { status: 500 });
  }

  try {
    // Step 1: Fetch the media URL from Graph API (returns CDN redirect URL)
    const metaRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!metaRes.ok) {
      console.error("[media-proxy] Graph API error:", metaRes.status);
      return NextResponse.json({ error: "Failed to fetch media info" }, { status: metaRes.status });
    }

    const metaData = await metaRes.json();
    const cdnUrl = metaData.url;

    if (!cdnUrl) {
      console.error("[media-proxy] No CDN URL in response:", metaData);
      return NextResponse.json({ error: "No media download URL" }, { status: 404 });
    }

    // Step 2: Download the actual audio from CDN
    const audioRes = await fetch(cdnUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!audioRes.ok) {
      console.error("[media-proxy] CDN fetch error:", audioRes.status);
      return NextResponse.json({ error: "Failed to download media" }, { status: audioRes.status });
    }

    const audioBuffer = await audioRes.arrayBuffer();
    const contentType = audioRes.headers.get("content-type") || "audio/ogg";

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(audioBuffer.byteLength),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[media-proxy] Error:", error);
    return NextResponse.json({ error: "Media proxy error" }, { status: 500 });
  }
}
