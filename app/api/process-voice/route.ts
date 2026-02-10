import { NextRequest, NextResponse } from "next/server";
import { speechToText, translate, fromSarvamCode } from "@/lib/sarvam";
import type { SarvamLanguageCode } from "@/types";

const SUPPORTED_LANGUAGES: SarvamLanguageCode[] = [
  "hi-IN",
  "bn-IN",
  "ta-IN",
  "te-IN",
  "mr-IN",
  "gu-IN",
  "kn-IN",
  "ml-IN",
  "pa-IN",
  "en-IN",
];

/**
 * POST /api/process-voice
 *
 * Accepts an audio blob from the frontend, runs Sarvam STT,
 * and translates to English if the detected language isn't English.
 *
 * Body: multipart/form-data
 *   - audio: Blob (required) — the recorded audio
 *   - language_code: string (optional) — BCP-47 hint, defaults to "hi-IN"
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio");
    const languageHint = formData.get("language_code");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing or invalid 'audio' field. Send a Blob/File." },
        { status: 400 }
      );
    }

    const languageCode = (
      typeof languageHint === "string" &&
      SUPPORTED_LANGUAGES.includes(languageHint as SarvamLanguageCode)
        ? languageHint
        : "hi-IN"
    ) as SarvamLanguageCode;

    console.log("[process-voice] Received audio:", {
      size: audioFile.size,
      type: audioFile.type,
      languageCode,
    });

    // Step 1: Speech-to-Text
    const sttResult = await speechToText({
      audio: audioFile,
      language_code: languageCode,
    });

    if (!sttResult.transcript) {
      return NextResponse.json(
        { error: "STT returned empty transcript. Audio may be silent or too short." },
        { status: 422 }
      );
    }

    const detectedLang = sttResult.language_code;
    let englishTranslation: string | null = null;

    // Step 2: Translate to English if not already English
    if (detectedLang !== "en-IN") {
      console.log(
        `[process-voice] Translating from ${detectedLang} to en-IN`
      );
      const translateResult = await translate({
        input: sttResult.transcript,
        source_language_code: detectedLang,
        target_language_code: "en-IN",
      });
      englishTranslation = translateResult.translated_text;
    }

    const result = {
      transcript: sttResult.transcript,
      english_translation: englishTranslation ?? sttResult.transcript,
      detected_language: fromSarvamCode(detectedLang),
      detected_language_code: detectedLang,
    };

    console.log("[process-voice] Result:", {
      transcript: result.transcript.slice(0, 80),
      english: result.english_translation.slice(0, 80),
      language: result.detected_language,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[process-voice] Error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Voice processing failed: ${message}` },
      { status: 500 }
    );
  }
}
