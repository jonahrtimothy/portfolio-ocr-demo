import { NextRequest, NextResponse } from "next/server";
import {
  processDocumentWithClaude,
  DETECT_PROMPT,
  getPromptForDocType,
  DOCUMENT_INTELLIGENCE_PROMPT,
} from "@/lib/claude";
import sharp from "sharp";

async function convertToSupportedFormat(
  buffer: Buffer,
  mediaType: string
): Promise<{ buffer: Buffer; mediaType: string }> {
  if (mediaType === "image/tiff" || mediaType === "image/tif") {
    const converted = await sharp(buffer).png().toBuffer();
    return { buffer: converted, mediaType: "image/png" };
  }
  if (mediaType === "image/bmp") {
    const converted = await sharp(buffer).png().toBuffer();
    return { buffer: converted, mediaType: "image/png" };
  }
  return { buffer, mediaType };
}

function parseJSON(raw: string) {
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file     = formData.get("file") as File;
    const mode     = formData.get("mode") as string || "healthcare";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes   = await file.arrayBuffer();
    let buffer    = Buffer.from(bytes);
    let mediaType = file.type || "application/octet-stream";

    const fname = file.name.toLowerCase();
    if (fname.endsWith(".tiff") || fname.endsWith(".tif")) mediaType = "image/tiff";

    const converted = await convertToSupportedFormat(buffer, mediaType);
    buffer    = Buffer.from(converted.buffer);
    mediaType = converted.mediaType;

    const base64 = buffer.toString("base64");

    let result;

    if (mode === "healthcare") {

      // step 1 — detect doc type
      const detectRaw = await processDocumentWithClaude(base64, mediaType, DETECT_PROMPT);
      const detected  = parseJSON(detectRaw);
      const docType   = detected?.doc_type || "unknown";
      const detConf   = detected?.confidence || 0;

      console.log("Step 1 detected:", docType, detConf);

      // step 2 — extract with specialist prompt
      const extractPrompt = getPromptForDocType(docType);
      console.log("Step 2 using prompt for:", docType);

      const extractRaw = await processDocumentWithClaude(base64, mediaType, extractPrompt);
      console.log("Step 2 raw length:", extractRaw.length);
      console.log("Step 2 raw preview:", extractRaw.slice(0, 200));

      const extractParsed = parseJSON(extractRaw);
      console.log("Step 2 parsed:", extractParsed ? "OK" : "FAILED");

      result = extractParsed
        ? { ...extractParsed, detection_confidence: detConf }
        : {
            raw_text : extractRaw.slice(0, 500),
            doc_type : docType,
            error    : "step2_parse_failed",
          };

    } else {

      // document intelligence mode — single pass
      const raw = await processDocumentWithClaude(
        base64,
        mediaType,
        DOCUMENT_INTELLIGENCE_PROMPT
      );
      result = parseJSON(raw) || {
        raw_text : raw,
        doc_type : "unknown",
        error    : "parse_failed",
      };
    }

    return NextResponse.json({
      success  : true,
      result,
      filename : file.name,
      filesize : file.size,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}