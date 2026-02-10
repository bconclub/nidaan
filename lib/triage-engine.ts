import type {
  Symptom,
  Condition,
  TriageResult,
  Severity,
  ClinicalReasoningResponse,
} from "@/types";
import conditions from "@/data/conditions.json";

/**
 * Match patient symptoms against the conditions database.
 * Returns conditions sorted by match confidence (descending).
 */
export function matchConditions(
  symptoms: Symptom[]
): { condition: Condition; confidence: number }[] {
  // TODO: implement symptom-to-condition matching logic
  console.log("[triage] matchConditions called", {
    symptom_count: symptoms.length,
  });
  return [];
}

/**
 * Compute overall severity based on matched conditions, red flags,
 * and patient context (age, duration, etc.).
 */
export function computeSeverity(
  symptoms: Symptom[],
  matchedConditions: { condition: Condition; confidence: number }[],
  redFlags: string[]
): Severity {
  // TODO: implement severity scoring algorithm
  // - Check for red flags → escalate to high/critical
  // - Evaluate severity rules on each matched condition
  // - Take the maximum severity across all matches
  console.log("[triage] computeSeverity called", {
    conditions: matchedConditions.length,
    red_flags: redFlags.length,
  });
  return "low";
}

/**
 * Determine which medical specialty the patient should be referred to,
 * based on the highest-confidence matched condition.
 */
export function getRecommendedSpecialty(
  matchedConditions: { condition: Condition; confidence: number }[]
): string {
  // TODO: implement specialty routing logic
  console.log("[triage] getRecommendedSpecialty called");
  return "general";
}

/**
 * Run the full triage pipeline:
 * 1. Match symptoms to conditions
 * 2. Detect red flags
 * 3. Compute severity
 * 4. Determine specialty
 * 5. Generate advice
 */
export async function runTriage(
  conversationId: string,
  symptoms: Symptom[],
  clinicalReasoning: ClinicalReasoningResponse
): Promise<TriageResult> {
  // TODO: orchestrate the full triage pipeline
  console.log("[triage] runTriage called", { conversationId });
  return {
    id: "",
    conversation_id: conversationId,
    matched_conditions: [],
    symptoms_extracted: symptoms,
    severity: "low",
    recommended_specialty: "general",
    advice_given: "",
    red_flags_detected: [],
    created_at: new Date().toISOString(),
  };
}

/**
 * Check if any of the extracted symptoms match known red flags
 * that require immediate medical attention.
 */
export function detectRedFlags(
  symptoms: Symptom[],
  matchedConditions: Condition[]
): string[] {
  // TODO: implement red flag detection
  console.log("[triage] detectRedFlags called");
  return [];
}
