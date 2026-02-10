import Anthropic from "@anthropic-ai/sdk";
import type {
  ClinicalReasoningRequest,
  ClinicalReasoningResponse,
  Symptom,
  Severity,
  TriageAnalysis,
  TriageSeverity,
} from "@/types";

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
});

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

const TRIAGE_SYSTEM_PROMPT = `You are Nidaan AI, a clinical triage assistant built for rural India. Given patient symptoms in English, respond ONLY in valid JSON:
{
  "condition": "most likely condition",
  "severity": "emergency" | "urgent" | "routine",
  "confidence": 0.0-1.0,
  "explanation": "simple 2-line explanation a village health worker would understand",
  "recommended_action": "what to do right now",
  "specialist_needed": "type of doctor needed",
  "red_flags": ["any danger signs to watch for"],
  "home_care": "any immediate home care tips if routine"
}
Rules:
- Always recommend consulting a real doctor
- Flag emergencies aggressively (chest pain, breathing difficulty, high fever in children, seizures, bleeding)
- Keep explanation in simple language, no medical jargon
- If symptoms are vague, ask one clarifying question in the response
- Never prescribe medication`;

/**
 * Analyze symptoms using Claude and return a structured triage result.
 */
export async function analyzeSymptoms(
  symptomText: string,
  patientContext?: { age?: number; gender?: string }
): Promise<TriageAnalysis> {
  let userMessage = symptomText;
  if (patientContext?.age || patientContext?.gender) {
    const parts: string[] = [];
    if (patientContext.age) parts.push(`Age: ${patientContext.age}`);
    if (patientContext.gender) parts.push(`Gender: ${patientContext.gender}`);
    userMessage = `Patient: ${parts.join(", ")}\nSymptoms: ${symptomText}`;
  }

  console.log("[claude] analyzeSymptoms called:", {
    inputLength: symptomText.length,
    hasContext: !!patientContext,
  });

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    system: TRIAGE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text response");
  }

  const rawText = textBlock.text.trim();
  console.log("[claude] Raw response:", rawText.slice(0, 200));

  // Extract JSON — handle cases where Claude wraps it in markdown code fences
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
    throw new Error(`Claude returned invalid JSON: ${jsonString.slice(0, 100)}`);
  }

  // Validate and coerce the response into our type
  const validSeverities: TriageSeverity[] = ["emergency", "urgent", "routine"];
  const severity = validSeverities.includes(parsed.severity as TriageSeverity)
    ? (parsed.severity as TriageSeverity)
    : "urgent";

  const confidence = typeof parsed.confidence === "number"
    ? Math.max(0, Math.min(1, parsed.confidence))
    : 0.5;

  const result: TriageAnalysis = {
    condition: String(parsed.condition || "Unknown"),
    severity,
    confidence,
    explanation: String(parsed.explanation || "Please consult a doctor for proper diagnosis."),
    recommended_action: String(parsed.recommended_action || "Visit your nearest health center."),
    specialist_needed: String(parsed.specialist_needed || "General Physician"),
    red_flags: Array.isArray(parsed.red_flags)
      ? parsed.red_flags.map(String)
      : [],
    home_care: String(parsed.home_care || ""),
  };

  console.log("[claude] Triage result:", {
    condition: result.condition,
    severity: result.severity,
    confidence: result.confidence,
  });

  return result;
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
