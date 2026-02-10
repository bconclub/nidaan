import type {
  SarvamSTTRequest,
  SarvamSTTResponse,
  SarvamTTSRequest,
  SarvamTTSResponse,
  SarvamTranslateRequest,
  SarvamTranslateResponse,
  SarvamLanguageCode,
  Language,
} from "@/types";
import { SARVAM_TTS_MAX_CHARS } from "@/types";

const SARVAM_API_KEY = process.env.SARVAM_API_KEY!;
const SARVAM_BASE_URL = "https://api.sarvam.ai";

/** Map our short Language codes to Sarvam's BCP-47 codes */
const LANGUAGE_TO_SARVAM: Record<Language, SarvamLanguageCode> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
};

/** Reverse map: Sarvam BCP-47 code back to our Language code */
const SARVAM_TO_LANGUAGE: Record<SarvamLanguageCode, Language> = {
  "en-IN": "en",
  "hi-IN": "hi",
  "bn-IN": "bn",
  "ta-IN": "ta",
  "te-IN": "te",
  "mr-IN": "mr",
  "gu-IN": "gu",
  "kn-IN": "kn",
  "ml-IN": "ml",
  "pa-IN": "pa",
};

export function toSarvamCode(lang: Language): SarvamLanguageCode {
  return LANGUAGE_TO_SARVAM[lang];
}

export function fromSarvamCode(code: SarvamLanguageCode): Language {
  return SARVAM_TO_LANGUAGE[code];
}

/**
 * Speech-to-Text (Saarika v2.5): convert audio to text.
 *
 * POST https://api.sarvam.ai/speech-to-text
 * Body: multipart/form-data with `file` (audio) + optional `language_code`
 *
 * When language_code is omitted, Sarvam auto-detects the language
 * and returns language_code + language_probability in the response.
 */
export async function speechToText(
  request: SarvamSTTRequest
): Promise<SarvamSTTResponse> {
  const formData = new FormData();
  formData.append("file", request.audio, "audio.wav");

  // Only add language_code if explicitly provided (omit for auto-detect)
  if (request.language_code) {
    formData.append("language_code", request.language_code);
  }

  console.log("[sarvam] STT request:", {
    language_code: request.language_code ?? "auto-detect",
    audioSize: request.audio.size,
  });

  const response = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[sarvam] STT error:", response.status, errorBody);
    throw new Error(
      `Sarvam STT failed (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();
  console.log("[sarvam] STT response:", {
    transcript: data.transcript?.slice(0, 80),
    language_code: data.language_code,
    language_probability: data.language_probability,
  });

  return {
    transcript: data.transcript,
    language_code: data.language_code ?? request.language_code ?? "hi-IN",
    language_probability: data.language_probability,
  };
}

/**
 * Text-to-Speech (Bulbul V2): convert text to base64 audio.
 *
 * POST https://api.sarvam.ai/text-to-speech
 * Body: JSON with `text`, `target_language_code`, `speaker`, `model`, etc.
 *
 * Bulbul V2 max: 1500 chars. Text is auto-truncated if longer.
 */
export async function textToSpeech(
  request: SarvamTTSRequest
): Promise<SarvamTTSResponse> {
  // Truncate to max chars to avoid 400 errors
  const truncatedText = request.text.length > SARVAM_TTS_MAX_CHARS
    ? request.text.slice(0, SARVAM_TTS_MAX_CHARS)
    : request.text;

  const requestBody = {
    text: truncatedText,
    target_language_code: request.target_language_code,
    speaker: request.speaker ?? "meera",
    model: request.model ?? "bulbul:v2",
    pitch: request.pitch ?? 0,
    pace: request.pace ?? 1.0,
    loudness: request.loudness ?? 1.0,
    speech_sample_rate: request.speech_sample_rate ?? 22050,
    enable_preprocessing: request.enable_preprocessing ?? true,
  };

  console.log("[sarvam] TTS request body:", JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[sarvam] TTS error:", {
      status: response.status,
      statusText: response.statusText,
      errorBody,
      requestBody: JSON.stringify(requestBody),
    });
    throw new Error(
      `Sarvam TTS failed (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();
  console.log("[sarvam] TTS response:", {
    audioChunks: data.audios?.length,
    firstChunkLength: data.audios?.[0]?.length,
  });

  return {
    audios: data.audios,
  };
}

/**
 * Translate text between supported Indian languages.
 *
 * POST https://api.sarvam.ai/translate
 * Body: JSON with `input`, `source_language_code`, `target_language_code`, `model`
 *
 * Use source_language_code: "auto" with model: "mayura:v1" for auto-detection.
 */
export async function translate(
  request: SarvamTranslateRequest
): Promise<SarvamTranslateResponse> {
  const requestBody = {
    input: request.input,
    source_language_code: request.source_language_code,
    target_language_code: request.target_language_code,
    model: request.model ?? "mayura:v1",
  };

  console.log("[sarvam] Translate request:", {
    source: requestBody.source_language_code,
    target: requestBody.target_language_code,
    model: requestBody.model,
    inputLength: request.input.length,
  });

  const response = await fetch(`${SARVAM_BASE_URL}/translate`, {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[sarvam] Translate error:", {
      status: response.status,
      errorBody,
      requestBody: JSON.stringify(requestBody),
    });
    throw new Error(
      `Sarvam Translate failed (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();
  console.log("[sarvam] Translate response:", {
    translatedText: data.translated_text?.slice(0, 80),
  });

  return {
    translated_text: data.translated_text,
  };
}
