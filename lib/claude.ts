// lib/claude.ts
// 13 specialized RCM prompts for Coronis/Ajuba document intelligence

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
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: [contentBlock, { type: "text", text: docContext }],
        },
      ],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "Claude API error");
  return data.content?.[0]?.text || "";
}

// ── Step 1: detect document type ─────────────────────────────────────────
export const DETECT_PROMPT = `You are an expert in healthcare RCM documents.
Look at this document and identify what type it is.

Return ONLY a JSON object — no explanation, no markdown:
{
  "doc_type": "one of: cms_1500 | ub_04 | denial_letter | era_remittance | eob | insurance_card | referral_letter | clinical_note | discharge_summary | anesthesia_record | prior_auth_request | prior_auth_response | operative_report | unknown",
  "confidence": 0.95,
  "reason": "one sentence explaining why"
}`;

// ── 1. CMS-1500 ───────────────────────────────────────────────────────────
export const CMS1500_PROMPT = `You are an expert medical billing specialist.
Extract all fields from this CMS-1500 health insurance claim form.

Return ONLY valid JSON — no explanation, no markdown:
{
  "doc_type": "cms_1500",
  "confidence": 0.95,
  "summary": "brief one sentence description",
  "patient": {
    "name": "",
    "date_of_birth": "",
    "sex": "",
    "address": "",
    "phone": ""
  },
  "insurance": {
    "payer_name": "",
    "member_id": "",
    "group_number": "",
    "relationship_to_insured": ""
  },
  "provider": {
    "name": "",
    "npi": "",
    "tax_id": "",
    "address": "",
    "facility_name": "",
    "place_of_service": "",
    "accept_assignment": ""
  },
  "claim": {
    "date_of_service": "",
    "icd10_codes": [],
    "cpt_codes": [],
    "modifiers": [],
    "charges_per_line": [],
    "total_charge": "",
    "prior_auth_number": ""
  },
  "flags": [],
  "raw_text": "full extracted text"
}`;

// ── 2. UB-04 ──────────────────────────────────────────────────────────────
export const UB04_PROMPT = `You are an expert in hospital facility billing.
Extract all fields from this UB-04 claim form.

Return ONLY valid JSON — no explanation, no markdown:
{
  "doc_type": "ub_04",
  "confidence": 0.95,
  "summary": "brief one sentence description",
  "patient": {
    "name": "",
    "date_of_birth": "",
    "address": "",
    "member_id": ""
  },
  "facility": {
    "name": "",
    "npi": "",
    "address": "",
    "type_of_bill": ""
  },
  "payer": {
    "name": "",
    "payer_id": "",
    "group_number": ""
  },
  "claim": {
    "admission_date": "",
    "discharge_date": "",
    "admission_type": "",
    "discharge_status": "",
    "drg_code": "",
    "icd10_primary_diagnosis": "",
    "icd10_additional_codes": [],
    "procedure_codes": [],
    "revenue_codes": [],
    "condition_codes": [],
    "total_charges": "",
    "prior_auth_number": ""
  },
  "flags": [],
  "raw_text": "full extracted text"
}`;

// ── 3. Denial Letter ──────────────────────────────────────────────────────
export const DENIAL_PROMPT = `You are an expert in healthcare claim denials and appeals.
Extract all information from this claim denial letter.

Return ONLY valid JSON — no explanation, no markdown:
{
  "doc_type": "denial_letter",
  "confidence": 0.95,
  "summary": "brief one sentence description",
  "denial_info": {
    "claim_number": "",
    "denial_date": "",
    "date_of_service": "",
    "denied_amount": "",
    "payer_name": "",
    "payer_reference_number": ""
  },
  "patient": {
    "name": "",
    "member_id": ""
  },
  "provider": {
    "name": "",
    "npi": ""
  },
  "denial_reasons": [],
  "carc_codes": [],
  "rarc_codes": [],
  "appeal_info": {
    "appeal_deadline": "",
    "appeal_address": "",
    "appeal_phone": "",
    "appeal_instructions": "",
    "peer_to_peer_available": false
  },
  "recommended_action": "",
  "flags": [],
  "raw_text": "full extracted text"
}`;

// ── 4. ERA / Remittance ───────────────────────────────────────────────────
export const ERA_PROMPT = `You are an expert in healthcare payment reconciliation.
Extract all payment information from this ERA or remittance advice document.

Return ONLY valid JSON — no explanation, no markdown:
{
  "doc_type": "era_remittance",
  "confidence": 0.95,
  "summary": "brief one sentence description",
  "payment": {
    "payer_name": "",
    "check_number": "",
    "payment_date": "",
    "total_payment": "",
    "payment_method": ""
  },
  "provider": {
    "name": "",
    "npi": "",
    "tax_id": ""
  },
  "claims": [
    {
      "claim_number": "",
      "member_id": "",
      "patient_name": "",
      "date_of_service": "",
      "billed_amount": "",
      "allowed_amount": "",
      "paid_amount": "",
      "adjustment_amount": "",
      "carc_codes": [],
      "rarc_codes": [],
      "service_lines": []
    }
  ],
  "flags": [],
  "raw_text": "full extracted text"
}`;

// ── 5. EOB ────────────────────────────────────────────────────────────────
export const EOB_PROMPT = `You are an expert in healthcare explanation of benefits documents.
Extract all information from this EOB document.

Return ONLY valid JSON — no explanation, no markdown:
{
  "doc_type": "eob",
  "confidence": 0.95,
  "summary": "brief one sentence description",
  "header": {
    "eob_number": "",
    "process_date": "",
    "payer_name": "",
    "claim_number": ""
  },
  "member": {
    "name": "",
    "member_id": "",
    "group_number": "",
    "plan_name": ""
  },
  "provider": {
    "name": "",
    "npi": ""
  },
  "services": [
    {
      "date_of_service": "",
      "cpt_code": "",
      "description": "",
      "billed": "",
      "allowed": "",
      "deductible": "",
      "copay": "",
      "coinsurance": "",
      "plan_paid": "",
      "member_responsibility": "",
      "carc_codes": []
    }
  ],
  "summary": {
    "total_billed": "",
    "total_allowed": "",
    "total_deductible": "",
    "total_copay": "",
    "total_plan_paid": "",
    "total_member_responsibility": ""
  },
  "flags": [],
  "raw_text": "full extracted text"
}`;

// ── 6. Insurance Card ─────────────────────────────────────────────────────
export const INSURANCE_CARD_PROMPT = `You are an expert in insurance eligibility verification.
Extract all information from this insurance card.

Return ONLY valid JSON — no explanation, no markdown:
{
  "doc_type": "insurance_card",
  "confidence": 0.95,
  "summary": "brief one sentence description",
  "member": {
    "name": "",
    "member_id": "",
    "group_number": "",
    "date_of_birth": ""
  },
  "plan": {
    "payer_name": "",
    "plan_name": "",
    "plan_type": "",
    "effective_date": "",
    "termination_date": ""
  },
  "copays": {
    "primary_care": "",
    "specialist": "",
    "urgent_care": "",
    "emergency": "",
    "inpatient": ""
  },
  "pharmacy": {
    "rx_bin": "",
    "rx_pcn": "",
    "rx_group": "",
    "generic_copay": "",
    "brand_copay": ""
  },
  "contacts": {
    "member_services": "",
    "provider_services": "",
    "website": ""
  },
  "flags": [],
  "raw_text": "full extracted text"
}`;

// ── 7. Referral Letter ────────────────────────────────────────────────────
export const REFERRAL_PROMPT = `You are an expert in healthcare referral processing.
Extract all information from this referral letter or referral form.

Return ONLY valid JSON — no explanation, no markdown:
{
  "doc_type": "referral_letter",
  "confidence": 0.95,
  "summary": "brief one sentence description",
  "patient": {
    "name": "",
    "date_of_birth": "",
    "member_id": "",
    "phone": ""
  },
  "referring_provider": {
    "name": "",
    "npi": "",
    "specialty": "",
    "practice_name": "",
    "phone": "",
    "fax": ""
  },
  "referred_to": {
    "specialty": "",
    "provider_name": "",
    "practice_name": "",
    "phone": ""
  },
  "referral": {
    "date": "",
    "urgency": "",
    "reason": "",
    "icd10_codes": [],
    "cpt_codes": [],
    "auth_required": false,
    "auth_number": "",
    "visits_approved": "",
    "valid_from": "",
    "valid_to": ""
  },
  "clinical_summary": "",
  "flags": [],
  "raw_text": "full extracted text"
}`;

// ── 8. Clinical Note ──────────────────────────────────────────────────────
export const CLINICAL_NOTE_PROMPT = `You are an expert medical coder and clinical documentation specialist.
Extract all clinically and billing-relevant information from this clinical note or SOAP note.

Return ONLY valid JSON — no explanation, no markdown:
{
  "doc_type": "clinical_note",
  "confidence": 0.95,
  "summary": "brief one sentence description",
  "patient": {
    "name": "",
    "date_of_birth": "",
    "date_of_service": ""
  },
  "provider": {
    "name": "",
    "npi": "",
    "specialty": ""
  },
  "clinical": {
    "chief_complaint": "",
    "history_of_present_illness": "",
    "past_medical_history": [],
    "medications": [],
    "allergies": [],
    "review_of_systems": "",
    "physical_exam_findings": "",
    "assessment": "",
    "plan": "",
    "follow_up": ""
  },
  "coding": {
    "diagnosis": [],
    "icd10_codes": [],
    "procedures_performed": [],
    "cpt_codes": [],
    "em_level": "",
    "modifiers": []
  },
  "flags": [],
  "raw_text": "full extracted text"
}`;

// ── 9. Discharge Summary ──────────────────────────────────────────────────
export const DISCHARGE_PROMPT = `You are an expert in hospital clinical documentation and DRG coding.
Extract all information from this discharge summary.

Return ONLY valid JSON — no explanation, no markdown:
{
  "doc_type": "discharge_summary",
  "confidence": 0.95,
  "summary": "brief one sentence description",
  "patient": {
    "name": "",
    "date_of_birth": "",
    "mrn": ""
  },
  "encounter": {
    "admission_date": "",
    "discharge_date": "",
    "length_of_stay": "",
    "admission_type": "",
    "discharge_disposition": ""
  },
  "provider": {
    "attending_physician": "",
    "npi": "",
    "consulting_physicians": []
  },
  "clinical": {
    "admitting_diagnosis": "",
    "principal_diagnosis": "",
    "secondary_diagnoses": [],
    "icd10_codes": [],
    "procedures_performed": [],
    "procedure_codes": [],
    "drg_code": "",
    "drg_description": ""
  },
  "discharge": {
    "condition_at_discharge": "",
    "medications_at_discharge": [],
    "follow_up_instructions": "",
    "follow_up_provider": ""
  },
  "flags": [],
  "raw_text": "full extracted text"
}`;

// ── 10. Anesthesia Record ─────────────────────────────────────────────────
export const ANESTHESIA_PROMPT = `You are an expert in anesthesia billing and coding.
Extract all information from this anesthesia record.
Note: Anesthesia billing uses base units + time units + qualifying units.
Modifiers AA, QK, QX, QY, QZ determine provider billing rights.

Return ONLY valid JSON — no explanation, no markdown:
{
  "doc_type": "anesthesia_record",
  "confidence": 0.95,
  "summary": "brief one sentence description",
  "patient": {
    "name": "",
    "date_of_birth": "",
    "age": "",
    "weight": "",
    "asa_physical_status": ""
  },
  "procedure": {
    "date_of_surgery": "",
    "procedure_name": "",
    "surgeon_name": "",
    "surgeon_npi": "",
    "facility": ""
  },
  "anesthesia": {
    "type": "",
    "start_time": "",
    "end_time": "",
    "total_minutes": "",
    "anesthesiologist_name": "",
    "anesthesiologist_npi": "",
    "crna_name": "",
    "crna_npi": ""
  },
  "billing": {
    "cpt_code": "",
    "base_units": "",
    "time_units": "",
    "qualifying_units": "",
    "total_units": "",
    "modifiers": [],
    "emergency_indicator": false,
    "icd10_codes": []
  },
  "clinical": {
    "complications": [],
    "medications_given": [],
    "monitoring": []
  },
  "flags": [],
  "raw_text": "full extracted text"
}`;

// ── 11. Prior Auth Request ────────────────────────────────────────────────
export const PRIOR_AUTH_REQUEST_PROMPT = `You are an expert in healthcare prior authorization.
Extract all information from this prior authorization request form.

Return ONLY valid JSON — no explanation, no markdown:
{
  "doc_type": "prior_auth_request",
  "confidence": 0.95,
  "summary": "brief one sentence description",
  "member": {
    "name": "",
    "date_of_birth": "",
    "member_id": "",
    "group_number": "",
    "payer_name": "",
    "plan_name": ""
  },
  "requesting_provider": {
    "name": "",
    "npi": "",
    "specialty": "",
    "practice_name": "",
    "phone": "",
    "fax": "",
    "tax_id": ""
  },
  "servicing_provider": {
    "name": "",
    "npi": "",
    "specialty": "",
    "facility": ""
  },
  "request": {
    "urgency": "",
    "service_requested": "",
    "cpt_codes": [],
    "icd10_codes": [],
    "place_of_service": "",
    "requested_start_date": "",
    "requested_end_date": "",
    "units_requested": "",
    "clinical_justification": ""
  },
  "flags": [],
  "raw_text": "full extracted text"
}`;

// ── 12. Prior Auth Response ───────────────────────────────────────────────
export const PRIOR_AUTH_RESPONSE_PROMPT = `You are an expert in healthcare prior authorization responses.
Extract all information from this prior authorization approval or denial response.

Return ONLY valid JSON — no explanation, no markdown:
{
  "doc_type": "prior_auth_response",
  "confidence": 0.95,
  "summary": "brief one sentence description",
  "decision": {
    "status": "approved | denied | partially_approved | pending",
    "auth_number": "",
    "decision_date": "",
    "valid_from": "",
    "valid_to": "",
    "approved_units": "",
    "approved_cpt_codes": [],
    "denied_cpt_codes": []
  },
  "member": {
    "name": "",
    "member_id": "",
    "group_number": "",
    "payer_name": ""
  },
  "provider": {
    "name": "",
    "npi": ""
  },
  "denial_info": {
    "denial_reason": "",
    "carc_codes": [],
    "appeal_deadline": "",
    "appeal_instructions": "",
    "peer_to_peer_phone": "",
    "peer_to_peer_deadline": ""
  },
  "recommended_action": "",
  "flags": [],
  "raw_text": "full extracted text"
}`;

// ── 13. Operative Report ──────────────────────────────────────────────────
export const OPERATIVE_REPORT_PROMPT = `You are an expert medical coder specializing in surgical procedure coding.
Extract all information from this operative report for CPT coding and billing purposes.

Return ONLY valid JSON — no explanation, no markdown:
{
  "doc_type": "operative_report",
  "confidence": 0.95,
  "summary": "brief one sentence description",
  "patient": {
    "name": "",
    "date_of_birth": "",
    "mrn": ""
  },
  "procedure": {
    "date": "",
    "facility": "",
    "preoperative_diagnosis": "",
    "postoperative_diagnosis": "",
    "procedure_name": "",
    "approach": "",
    "laterality": ""
  },
  "team": {
    "surgeon": "",
    "surgeon_npi": "",
    "assistant_surgeon": "",
    "anesthesiologist": "",
    "anesthesia_type": ""
  },
  "coding": {
    "primary_cpt": "",
    "additional_cpt_codes": [],
    "modifiers": [],
    "icd10_diagnosis_codes": [],
    "implants_used": [],
    "specimens_sent": []
  },
  "clinical": {
    "indications": "",
    "findings": "",
    "complications": "",
    "estimated_blood_loss": "",
    "tourniquet_time": ""
  },
  "flags": [],
  "raw_text": "full extracted text"
}`;

// ── prompt router ─────────────────────────────────────────────────────────
export const PROMPT_MAP: Record<string, string> = {
  cms_1500           : CMS1500_PROMPT,
  ub_04              : UB04_PROMPT,
  denial_letter      : DENIAL_PROMPT,
  era_remittance     : ERA_PROMPT,
  eob                : EOB_PROMPT,
  insurance_card     : INSURANCE_CARD_PROMPT,
  referral_letter    : REFERRAL_PROMPT,
  clinical_note      : CLINICAL_NOTE_PROMPT,
  discharge_summary  : DISCHARGE_PROMPT,
  anesthesia_record  : ANESTHESIA_PROMPT,
  prior_auth_request : PRIOR_AUTH_REQUEST_PROMPT,
  prior_auth_response: PRIOR_AUTH_RESPONSE_PROMPT,
  operative_report   : OPERATIVE_REPORT_PROMPT,
};

export function getPromptForDocType(docType: string): string {
  return PROMPT_MAP[docType] || CMS1500_PROMPT;
}

// legacy exports for compatibility
export const HEALTHCARE_PROMPT = DETECT_PROMPT;
export const DOCUMENT_INTELLIGENCE_PROMPT = DETECT_PROMPT;