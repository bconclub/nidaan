import { NextRequest, NextResponse } from "next/server";
import { analyzeSymptoms, toTriageAnalysis } from "@/lib/claude";
import { formatTriageMessage } from "@/lib/triage-engine";

/**
 * POST /api/triage
 *
 * Accepts patient symptoms (free text), optional context, and optional
 * conversation history. Returns either a follow-up question or a full
 * triage diagnosis.
 *
 * Body:
 * {
 *   symptoms: string;
 *   patient_context?: { age?: number; gender?: string };
 *   conversation_history?: { role: string; content: string }[];
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symptoms, patient_context, conversation_history } = body;

    if (!symptoms || typeof symptoms !== "string" || !symptoms.trim()) {
      return NextResponse.json(
        { error: "symptoms (string) is required" },
        { status: 400 }
      );
    }

    console.log("[api/triage] Analyzing:", {
      symptomsLength: symptoms.length,
      hasContext: !!patient_context,
      historyLength: conversation_history?.length ?? 0,
    });

    const nidaanResponse = await analyzeSymptoms(
      symptoms,
      patient_context,
      conversation_history
    );

    if (nidaanResponse.type === "question") {
      return NextResponse.json({
        type: "question",
        message: nidaanResponse.message,
      });
    }

    // Type is "diagnosis"
    const triageAnalysis = toTriageAnalysis(nidaanResponse);
    const message = formatTriageMessage(triageAnalysis);

    console.log("[api/triage] Diagnosis:", {
      condition: nidaanResponse.condition,
      severity: nidaanResponse.severity,
    });

    return NextResponse.json({
      type: "diagnosis",
      analysis: triageAnalysis,
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
