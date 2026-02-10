import type {
  ClinicalReasoningRequest,
  ClinicalReasoningResponse,
  Symptom,
  Severity,
} from "@/types";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY!;
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

/**
 * Send symptoms and conversation context to Claude for clinical reasoning.
 * Returns follow-up questions, preliminary assessment, and severity scoring.
 */
export async function getClinicalReasoning(
  request: ClinicalReasoningRequest
): Promise<ClinicalReasoningResponse> {
  // TODO: implement Claude API call with medical system prompt
  console.log("[claude] getClinicalReasoning called", {
    symptom_count: request.symptoms.length,
  });
  return {
    follow_up_questions: [],
    preliminary_assessment: "",
    matched_conditions: [],
    severity: "low",
    recommended_specialty: "general",
    red_flags: [],
    advice: "",
  };
}

/**
 * Generate a patient-friendly explanation of the triage result
 * in simple language, suitable for translation into regional languages.
 */
export async function generatePatientAdvice(
  conditions: string[],
  severity: Severity,
  language_hint: string
): Promise<string> {
  // TODO: implement Claude API call for patient-friendly advice generation
  console.log("[claude] generatePatientAdvice called", {
    conditions,
    severity,
  });
  return "";
}

/**
 * Extract structured symptoms from free-text patient input.
 */
export async function extractSymptoms(
  text: string,
  language: string
): Promise<Symptom[]> {
  // TODO: implement Claude API call for symptom extraction from natural language
  console.log("[claude] extractSymptoms called", { language });
  return [];
}
