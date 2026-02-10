// ── Severity & Status Enums ──────────────────────────────────────────

export type Severity = "low" | "moderate" | "high" | "critical";

export type ConversationStatus =
  | "active"
  | "awaiting_input"
  | "triaged"
  | "referred"
  | "closed";

export type MessageRole = "user" | "assistant" | "system";

export type MessageType = "text" | "audio" | "image";

export type Language =
  | "en"
  | "hi"
  | "bn"
  | "ta"
  | "te"
  | "mr"
  | "gu"
  | "kn"
  | "ml"
  | "pa";

// ── Patient ─────────────────────────────────────────────────────────

export interface Patient {
  id: string;
  phone_number: string;
  name?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  language: Language;
  location?: {
    latitude: number;
    longitude: number;
    district?: string;
    state?: string;
  };
  created_at: string;
  updated_at: string;
}

// ── Conversation ────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  patient_id: string;
  status: ConversationStatus;
  language: Language;
  chief_complaint?: string;
  started_at: string;
  updated_at: string;
  closed_at?: string;
}

// ── Message ─────────────────────────────────────────────────────────

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  type: MessageType;
  content: string;
  audio_url?: string;
  translated_content?: string;
  created_at: string;
}

// ── Symptom & Condition ─────────────────────────────────────────────

export interface Symptom {
  name: string;
  duration_days?: number;
  intensity?: "mild" | "moderate" | "severe";
  notes?: string;
}

export interface SeverityRule {
  condition: string; // e.g. "duration_days > 7"
  escalate_to: Severity;
}

export interface Condition {
  id: string;
  name: string;
  synonyms: string[];
  symptoms: string[];
  red_flags: string[];
  severity_rules: SeverityRule[];
  default_severity: Severity;
  specialty: string;
  advice: string;
  requires_emergency: boolean;
}

// ── Triage Result ───────────────────────────────────────────────────

export interface TriageResult {
  id: string;
  conversation_id: string;
  matched_conditions: {
    condition_id: string;
    condition_name: string;
    confidence: number; // 0–1
  }[];
  symptoms_extracted: Symptom[];
  severity: Severity;
  recommended_specialty: string;
  recommended_facility_id?: string;
  advice_given: string;
  red_flags_detected: string[];
  created_at: string;
}

// ── Facility (ABDM HFR) ────────────────────────────────────────────

export interface Facility {
  id: string;
  hfr_id: string; // ABDM Health Facility Registry ID
  name: string;
  type: "PHC" | "CHC" | "DH" | "SDH" | "clinic" | "hospital";
  specialties: string[];
  address: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  phone?: string;
  distance_km?: number;
  cached_at: string;
}

// ── WhatsApp / Gupshup ─────────────────────────────────────────────

export interface WhatsAppIncomingMessage {
  message_id: string;
  from: string; // phone number
  timestamp: string;
  type: MessageType;
  text?: string;
  audio_url?: string;
}

export interface WhatsAppOutgoingMessage {
  to: string;
  type: MessageType;
  text?: string;
  audio_url?: string;
}

// ── Sarvam AI ───────────────────────────────────────────────────────

/** Maps our Language codes to Sarvam's BCP-47 language codes */
export type SarvamLanguageCode =
  | "hi-IN"
  | "en-IN"
  | "bn-IN"
  | "ta-IN"
  | "te-IN"
  | "mr-IN"
  | "gu-IN"
  | "kn-IN"
  | "ml-IN"
  | "pa-IN";

export interface SarvamSTTRequest {
  audio: Blob | File;
  language_code: SarvamLanguageCode;
}

export interface SarvamSTTResponse {
  transcript: string;
  language_code: SarvamLanguageCode;
}

export interface SarvamTTSRequest {
  text: string;
  target_language_code: SarvamLanguageCode;
  speaker?: string;
  model?: string;
}

export interface SarvamTTSResponse {
  audios: string[]; // base64-encoded audio chunks
}

/** Max characters for Sarvam TTS Bulbul V3 */
export const SARVAM_TTS_MAX_CHARS = 2500;

export interface SarvamTranslateRequest {
  input: string;
  source_language_code: SarvamLanguageCode;
  target_language_code: SarvamLanguageCode;
}

export interface SarvamTranslateResponse {
  translated_text: string;
}

// ── Claude Triage Analysis ──────────────────────────────────────────

export type TriageSeverity = "emergency" | "urgent" | "routine";

export interface TriageAnalysis {
  condition: string;
  severity: TriageSeverity;
  confidence: number;
  explanation: string;
  recommended_action: string;
  specialist_needed: string;
  red_flags: string[];
  home_care: string;
}

// ── Claude Clinical Reasoning ───────────────────────────────────────

export interface ClinicalReasoningRequest {
  symptoms: Symptom[];
  patient_context: {
    age?: number;
    gender?: string;
    location?: string;
  };
  conversation_history: Pick<Message, "role" | "content">[];
}

export interface ClinicalReasoningResponse {
  follow_up_questions: string[];
  preliminary_assessment: string;
  matched_conditions: {
    condition_name: string;
    confidence: number;
  }[];
  severity: Severity;
  recommended_specialty: string;
  red_flags: string[];
  advice: string;
}

// ── Dashboard Metrics ───────────────────────────────────────────────

export interface DashboardMetrics {
  total_conversations: number;
  active_conversations: number;
  triaged_today: number;
  severity_distribution: Record<Severity, number>;
  top_conditions: { name: string; count: number }[];
  avg_triage_time_seconds: number;
  language_distribution: Record<Language, number>;
}
