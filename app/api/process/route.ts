import { NextRequest, NextResponse } from "next/server";
import { processDocumentWithClaude, HEALTHCARE_PROMPT, DOCUMENT_INTELLIGENCE_PROMPT } from "@/lib/claude";
import sharp from "sharp";

async function convertToSupportedFormat(
  buffer: Buffer,
  mediaType: string
): Promise<{ buffer: Buffer; mediaType: string }> {
  // convert TIFF to PNG
  if (mediaType === "image/tiff" || mediaType === "image/tif") {
    const converted = await sharp(buffer).png().toBuffer();
    return { buffer: converted, mediaType: "image/png" };
  }
  // convert BMP to PNG
  if (mediaType === "image/bmp") {
    const converted = await sharp(buffer).png().toBuffer();
    return { buffer: converted, mediaType: "image/png" };
  }
  return { buffer, mediaType };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file     = formData.get("file") as File;
    const mode     = formData.get("mode") as string || "healthcare";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes    = await file.arrayBuffer();
    let buffer     = Buffer.from(bytes);
    let mediaType  = file.type || "application/octet-stream";

    // detect TIFF by filename if mime type is wrong
    const fname = file.name.toLowerCase();
    if (fname.endsWith(".tiff") || fname.endsWith(".tif")) {
      mediaType = "image/tiff";
    }

    // convert unsupported formats
    const converted = await convertToSupportedFormat(buffer, mediaType);
    buffer    = Buffer.from(converted.buffer);
    mediaType = converted.mediaType;

    const base64 = buffer.toString("base64");

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
        raw_text       : rawResult,
        doc_type       : "unknown",
        error          : "parse_failed",
        debug_response : rawResult.slice(0, 500),
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