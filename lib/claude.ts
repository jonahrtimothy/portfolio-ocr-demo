export async function processDocumentWithClaude(
  base64Data: string,
  mediaType: string,
  docContext: string
): Promise<string> {
  const isPDF = mediaType === "application/pdf";

  const contentBlock = isPDF
    ? {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64Data,
        },
      }
    : {
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: base64Data,
        },
      };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "pdfs-2024-09-25",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            contentBlock,
            {
              type: "text",
              text: docContext,
            },
          ],
        },
      ],
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "Claude API error");
  }

  return data.content?.[0]?.text || "";
}

export const HEALTHCARE_PROMPT = `You are a healthcare RCM document intelligence expert.
Analyze this document and extract all relevant information.

Return a JSON object with exactly this structure:
{
  "doc_type": "one of: cms_1500 | prior_auth | eob | clinical_note | referral | denial_letter | unknown",
  "confidence": 0.95,
  "summary": "one sentence description of what this document is",
  "entities": {
    "patient_name": "",
    "date_of_birth": "",
    "member_id": "",
    "group_number": "",
    "payer_name": "",
    "provider_name": "",
    "provider_npi": "",
    "date_of_service": "",
    "icd10_codes": [],
    "cpt_codes": [],
    "dollar_amounts": [],
    "pa_number": "",
    "claim_number": "",
    "eob_number": "",
    "denial_reason": "",
    "auth_status": ""
  },
  "raw_text": "full extracted text from the document",
  "key_findings": ["finding 1", "finding 2", "finding 3"]
}

Return ONLY valid JSON. No explanation, no markdown, no code blocks.`;

export const DOCUMENT_INTELLIGENCE_PROMPT = `You are a document classification and extraction expert.
Analyze this scanned document and extract all information.

Return a JSON object with exactly this structure:
{
  "doc_type": "one of: form | letter | email | report | note | resume | memo | news | scientific | advertisement | unknown",
  "confidence": 0.95,
  "summary": "one sentence description of what this document is",
  "language": "english",
  "is_handwritten": false,
  "is_scanned": true,
  "quality": "one of: excellent | good | fair | poor",
  "raw_text": "full extracted text from the document",
  "key_entities": {
    "names": [],
    "dates": [],
    "organizations": [],
    "locations": [],
    "amounts": []
  },
  "key_findings": ["finding 1", "finding 2", "finding 3"]
}

Return ONLY valid JSON. No explanation, no markdown, no code blocks.`;