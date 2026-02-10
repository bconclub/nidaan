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
 * Speech-to-Text (Saaras): convert audio to text.
 *
 * POST https://api.sarvam.ai/speech-to-text
 * Body: multipart/form-data with `file` (audio) + `language_code`
 */
export async function speechToText(
  request: SarvamSTTRequest
): Promise<SarvamSTTResponse> {
  const formData = new FormData();
  formData.append("file", request.audio, "audio.wav");
  formData.append("language_code", request.language_code);

  console.log("[sarvam] STT request:", {
    language_code: request.language_code,
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
  });

  return {
    transcript: data.transcript,
    language_code: data.language_code ?? request.language_code,
  };
}

/**
 * Text-to-Speech (Bulbul V3): convert text to base64 audio.
 *
 * POST https://api.sarvam.ai/text-to-speech
 * Body: JSON with `inputs`, `target_language_code`, `speaker`, `model`
 */
export async function textToSpeech(
  request: SarvamTTSRequest
): Promise<SarvamTTSResponse> {
  const body = {
    inputs: request.inputs,
    target_language_code: request.target_language_code,
    speaker: request.speaker ?? "meera",
    model: request.model ?? "bulbul:v3",
  };

  console.log("[sarvam] TTS request:", {
    target_language_code: body.target_language_code,
    speaker: body.speaker,
    inputLength: request.inputs.reduce((sum, t) => sum + t.length, 0),
  });

  const response = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[sarvam] TTS error:", response.status, errorBody);
    throw new Error(
      `Sarvam TTS failed (${response.status}): ${errorBody}`
    );
  }

  const data = await response.json();
  console.log("[sarvam] TTS response:", {
    audioChunks: data.audios?.length,
  });

  return {
    audios: data.audios,
  };
}

/**
 * Translate text between supported Indian languages.
 *
 * POST https://api.sarvam.ai/translate
 * Body: JSON with `input`, `source_language_code`, `target_language_code`
 */
export async function translate(
  request: SarvamTranslateRequest
): Promise<SarvamTranslateResponse> {
  const body = {
    input: request.input,
    source_language_code: request.source_language_code,
    target_language_code: request.target_language_code,
  };

  console.log("[sarvam] Translate request:", {
    source: body.source_language_code,
    target: body.target_language_code,
    inputLength: request.input.length,
  });

  const response = await fetch(`${SARVAM_BASE_URL}/translate`, {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[sarvam] Translate error:", response.status, errorBody);
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
