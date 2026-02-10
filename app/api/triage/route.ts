import { NextRequest, NextResponse } from "next/server";
import { analyzeSymptoms } from "@/lib/claude";
import { formatTriageMessage } from "@/lib/triage-engine";

/**
 * POST /api/triage
 *
 * Accepts patient symptoms (free text) and optional context,
 * runs Claude-powered triage analysis, and returns a structured result
 * with a patient-friendly message.
 *
 * Body:
 * {
 *   symptoms: string;
 *   patient_context?: { age?: number; gender?: string };
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symptoms, patient_context } = body;

    if (!symptoms || typeof symptoms !== "string" || !symptoms.trim()) {
      return NextResponse.json(
        { error: "symptoms (string) is required" },
        { status: 400 }
      );
    }

    console.log("[api/triage] Analyzing:", {
      symptomsLength: symptoms.length,
      hasContext: !!patient_context,
    });

    const analysis = await analyzeSymptoms(symptoms, patient_context);
    const message = formatTriageMessage(analysis);

    console.log("[api/triage] Done:", {
      condition: analysis.condition,
      severity: analysis.severity,
    });

    return NextResponse.json({
      analysis,
      message,
    });
  } catch (error) {
    console.error("[api/triage] Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Triage failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
