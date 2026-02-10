import Anthropic from "@anthropic-ai/sdk";
import type {
  ClinicalReasoningRequest,
  ClinicalReasoningResponse,
  Symptom,
  Severity,
  TriageAnalysis,
  TriageSeverity,
  NidaanResponse,
  NidaanResponseType,
} from "@/types";

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
});

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

const TRIAGE_SYSTEM_PROMPT = `You are Nidaan AI, the world's best diagnostic physician. You NEVER rush to a diagnosis. You probe methodically like a top doctor would.

RULES:
1. FIRST 2-3 messages: Ask SHORT, focused follow-up questions. One question at a time. Examples:
   - "How many days has the fever lasted?"
   - "Is the pain sharp or dull?"
   - "Any vomiting or nausea?"
   - "Are you taking any medication?"
   - "How old are you?"

2. Keep responses to 1-2 sentences MAX. No long explanations yet.

3. ONLY after gathering enough information (minimum 3-4 exchanges), provide a triage assessment.

4. When you respond, ALWAYS respond in this JSON format:
{
  "type": "question" | "diagnosis",
  "message": "your short question or explanation",
  "condition": null | "condition name",
  "severity": null | "emergency" | "urgent" | "routine",
  "confidence": null | 0.0-1.0,
  "recommended_action": null | "what to do",
  "specialist_needed": null | "doctor type",
  "red_flags": [],
  "home_care": null | "advice"
}

5. If type is "question" — just ask the follow-up, no diagnosis yet.
6. If type is "diagnosis" — give the full triage.
7. ALWAYS flag emergencies immediately regardless of how many questions asked (chest pain, breathing difficulty, seizures, heavy bleeding).
8. Never prescribe medication.
9. Speak simply — like talking to a village health worker.
10. Be warm, empathetic, but precise.`;

/**
 * Analyze symptoms using Claude with multi-turn conversation support.
 *
 * Returns a NidaanResponse which can be either:
 * - type: "question" — Claude wants more info, message contains the follow-up question
 * - type: "diagnosis" — Claude has enough info, full triage analysis included
 */
export async function analyzeSymptoms(
  symptomText: string,
  patientContext?: { age?: number; gender?: string },
  conversationHistory?: { role: string; content: string }[]
): Promise<NidaanResponse> {
  // Build the messages array with conversation history
  const messages: { role: "user" | "assistant"; content: string }[] = [];

  // Add prior conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }
  }

  // Build current user message
  let userMessage = symptomText;
  if (patientContext?.age || patientContext?.gender) {
    const parts: string[] = [];
    if (patientContext.age) parts.push(`Age: ${patientContext.age}`);
    if (patientContext.gender) parts.push(`Gender: ${patientContext.gender}`);
    userMessage = `Patient: ${parts.join(", ")}\nSymptoms: ${symptomText}`;
  }

  messages.push({ role: "user", content: userMessage });

  console.log("[claude] analyzeSymptoms called:", {
    inputLength: symptomText.length,
    historyLength: conversationHistory?.length ?? 0,
    hasContext: !!patientContext,
  });

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: TRIAGE_SYSTEM_PROMPT,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text response");
  }

  const rawText = textBlock.text.trim();
  console.log("[claude] Raw response:", rawText.slice(0, 300));

  // Extract JSON — handle markdown code fences
  let jsonString = rawText;
  const fenceMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonString = fenceMatch[1].trim();
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    console.error("[claude] Failed to parse JSON:", jsonString.slice(0, 300));
    // If Claude didn't return JSON, treat it as a question
    return {
      type: "question",
      message: rawText,
      condition: null,
      severity: null,
      confidence: null,
      recommended_action: null,
      specialist_needed: null,
      red_flags: [],
      home_care: null,
    };
  }

  const responseType: NidaanResponseType =
    parsed.type === "diagnosis" ? "diagnosis" : "question";

  if (responseType === "question") {
    console.log("[claude] Follow-up question:", parsed.message);
    return {
      type: "question",
      message: String(parsed.message || "Could you tell me more about your symptoms?"),
      condition: null,
      severity: null,
      confidence: null,
      recommended_action: null,
      specialist_needed: null,
      red_flags: [],
      home_care: null,
    };
  }

  // Type is "diagnosis" — validate and coerce
  const validSeverities: TriageSeverity[] = ["emergency", "urgent", "routine"];
  const severity = validSeverities.includes(parsed.severity as TriageSeverity)
    ? (parsed.severity as TriageSeverity)
    : "urgent";

  const confidence = typeof parsed.confidence === "number"
    ? Math.max(0, Math.min(1, parsed.confidence))
    : 0.5;

  const result: NidaanResponse = {
    type: "diagnosis",
    message: String(parsed.message || "Based on the information you provided:"),
    condition: String(parsed.condition || "Unknown"),
    severity,
    confidence,
    recommended_action: String(parsed.recommended_action || "Visit your nearest health center."),
    specialist_needed: String(parsed.specialist_needed || "General Physician"),
    red_flags: Array.isArray(parsed.red_flags)
      ? parsed.red_flags.map(String)
      : [],
    home_care: parsed.home_care ? String(parsed.home_care) : null,
  };

  console.log("[claude] Diagnosis:", {
    condition: result.condition,
    severity: result.severity,
    confidence: result.confidence,
  });

  return result;
}

/**
 * Convert a NidaanResponse diagnosis into a TriageAnalysis
 * (for compatibility with formatTriageMessage).
 */
export function toTriageAnalysis(response: NidaanResponse): TriageAnalysis {
  return {
    condition: response.condition || "Unknown",
    severity: response.severity || "urgent",
    confidence: response.confidence || 0.5,
    explanation: response.message,
    recommended_action: response.recommended_action || "Visit your nearest health center.",
    specialist_needed: response.specialist_needed || "General Physician",
    red_flags: response.red_flags,
    home_care: response.home_care || "",
  };
}

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
