import { NextRequest, NextResponse } from "next/server";
import { processDocumentWithClaude, HEALTHCARE_PROMPT, DOCUMENT_INTELLIGENCE_PROMPT } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file     = formData.get("file") as File;
    const mode     = formData.get("mode") as string || "healthcare";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes     = await file.arrayBuffer();
    const buffer    = Buffer.from(bytes);
    const base64    = buffer.toString("base64");
    const mediaType = file.type || "image/jpeg";

    const prompt = mode === "healthcare"
      ? HEALTHCARE_PROMPT
      : DOCUMENT_INTELLIGENCE_PROMPT;

    const rawResult = await processDocumentWithClaude(base64, mediaType, prompt);

    let parsed;
    try {
      const cleaned = rawResult.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        raw_text        : rawResult,
        doc_type        : "unknown",
        error           : "parse_failed",
        debug_response  : rawResult.slice(0, 500),
      };
    }

    return NextResponse.json({
      success  : true,
      result   : parsed,
      filename : file.name,
      filesize : file.size,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}