import { NextRequest, NextResponse } from "next/server";
import type { Symptom, ClinicalReasoningRequest } from "@/types";
import { getClinicalReasoning, extractSymptoms } from "@/lib/claude";
import { runTriage } from "@/lib/triage-engine";

/**
 * POST /api/triage
 * Symptom analysis endpoint.
 *
 * Accepts patient symptoms (structured or free-text) and returns
 * a triage result with severity, matched conditions, and recommended action.
 *
 * Body:
 * {
 *   conversation_id: string;
 *   text?: string;             // free-text symptom description
 *   symptoms?: Symptom[];      // pre-extracted symptoms
 *   patient_context?: { age?: number; gender?: string; location?: string };
 *   conversation_history?: { role: string; content: string }[];
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      conversation_id,
      text,
      symptoms: providedSymptoms,
      patient_context,
      conversation_history,
    } = body;

    if (!conversation_id) {
      return NextResponse.json(
        { error: "conversation_id is required" },
        { status: 400 }
      );
    }

    // Step 1: Extract symptoms from text if not already structured
    let symptoms: Symptom[] = providedSymptoms ?? [];
    if (text && symptoms.length === 0) {
      symptoms = await extractSymptoms(text, "en");
    }

    if (symptoms.length === 0) {
      return NextResponse.json(
        { error: "No symptoms provided or extractable" },
        { status: 400 }
      );
    }

    // Step 2: Get clinical reasoning from Claude
    const reasoningRequest: ClinicalReasoningRequest = {
      symptoms,
      patient_context: patient_context ?? {},
      conversation_history: conversation_history ?? [],
    };
    const clinicalReasoning = await getClinicalReasoning(reasoningRequest);

    // Step 3: Run the triage engine
    const triageResult = await runTriage(
      conversation_id,
      symptoms,
      clinicalReasoning
    );

    // TODO: Store triage result in Supabase

    return NextResponse.json({ triage: triageResult });
  } catch (error) {
    console.error("[api/triage] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
