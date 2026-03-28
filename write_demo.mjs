import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('app/demo', { recursive: true });

const content = `"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Activity, GitBranch, ArrowLeft, CheckCircle, AlertCircle, Loader } from "lucide-react";

type Tab = "healthcare" | "intelligence" | "architecture";

interface Result {
  doc_type?: string;
  confidence?: number;
  summary?: string;
  entities?: Record<string, unknown>;
  raw_text?: string;
  key_findings?: string[];
  key_entities?: Record<string, unknown>;
  quality?: string;
  is_handwritten?: boolean;
  is_scanned?: boolean;
  error?: string;
}

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<Tab>("healthcare");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      setResult(null);
      setError("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] },
    maxFiles: 1,
  });

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", activeTab === "healthcare" ? "healthcare" : "intelligence");
      const res = await fetch("/api/process", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) setResult(data.result);
      else setError(data.error || "Processing failed");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "healthcare" as Tab, label: "Healthcare RCM OCR", icon: <Activity size={15} /> },
    { id: "intelligence" as Tab, label: "Document Intelligence", icon: <FileText size={15} /> },
    { id: "architecture" as Tab, label: "Pipeline Architecture", icon: <GitBranch size={15} /> },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-6 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => router.push("/")} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition mb-3">
              <ArrowLeft size={13} /> Back to portfolio
            </button>
            <h1 className="text-2xl font-bold">Document Intelligence Demo</h1>
            <p className="text-sm text-gray-500 mt-1">Powered by Claude Vision AI</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs">Live Demo</div>
        </div>

        <div className="flex gap-2 mb-8 border-b border-white/5 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResult(null); setFile(null); setError(""); }}
              className={"flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition " + (activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5")}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {activeTab !== "architecture" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="space-y-4">
              <div {...getRootProps()} className={"border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition " + (isDragActive ? "border-blue-500 bg-blue-500/5" : "border-white/10 hover:border-white/20")}>
                <input {...getInputProps()} />
                <Upload size={32} className="mx-auto mb-3 text-gray-600" />
                <p className="text-sm text-gray-400 mb-1">Drop a PDF or image here</p>
                <p className="text-xs text-gray-600">PDF, JPG, PNG supported</p>
              </div>

              {file && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                  <FileText size={16} className="text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                </div>
              )}

              {activeTab === "healthcare" && (
                <div className="p-4 rounded-xl bg-white/3 border border-white/5">
                  <p className="text-xs text-gray-500 mb-2 font-medium">Extracts from healthcare docs:</p>
                  <div className="flex flex-wrap gap-2">
                    {["ICD-10 codes","CPT codes","NPI","Member ID","Payer","Dates","Amounts","PA Number","Claim Number"].map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleProcess}
                disabled={!file || loading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition font-medium text-sm flex items-center justify-center gap-2"
              >
                {loading ? <><Loader size={15} className="animate-spin" />Processing...</> : "Process Document"}
              </button>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {!result && !loading && (
                <div className="h-64 flex flex-col items-center justify-center rounded-xl border border-white/5 bg-white/2">
                  <FileText size={32} className="text-gray-700 mb-3" />
                  <p className="text-sm text-gray-600">Results will appear here</p>
                </div>
              )}

              {loading && (
                <div className="h-64 flex flex-col items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/5">
                  <Loader size={32} className="text-blue-500 animate-spin mb-3" />
                  <p className="text-sm text-blue-400">Claude is reading your document...</p>
                  <p className="text-xs text-gray-600 mt-1">Usually takes 2-4 seconds</p>
                </div>
              )}

              {result && !loading && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div>
                      <p className="text-xs text-gray-400 mb-0.5">Document Type</p>
                      <p className="text-sm font-semibold text-green-400 uppercase tracking-wide">{String(result.doc_type || "unknown").replace(/_/g, " ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-0.5">Confidence</p>
                      <p className="text-sm font-semibold text-green-400">{result.confidence ? (Number(result.confidence) * 100).toFixed(0) + "%" : "—"}</p>
                    </div>
                  </div>

                  {result.summary && (
                    <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                      <p className="text-xs text-gray-400 mb-1">Summary</p>
                      <p className="text-sm text-gray-200">{String(result.summary)}</p>
                    </div>
                  )}

                  {result.key_findings && result.key_findings.length > 0 && (
                    <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                      <p className="text-xs text-gray-400 mb-2">Key Findings</p>
                      <ul className="space-y-1">
                        {result.key_findings.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                            <span className="text-blue-400 mt-0.5 flex-shrink-0">·</span>{String(f)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.entities && Object.keys(result.entities).length > 0 && (
                    <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                      <p className="text-xs text-gray-400 mb-2">Extracted Entities</p>
                      <div className="space-y-1.5">
                        {Object.entries(result.entities).map(([key, val]) => {
                          if (!val || (Array.isArray(val) && val.length === 0)) return null;
                          const display = Array.isArray(val) ? val.join(", ") : String(val);
                          return (
                            <div key={key} className="flex justify-between gap-2 text-xs">
                              <span className="text-gray-500 capitalize">{key.replace(/_/g, " ")}</span>
                              <span className="text-gray-200 text-right max-w-[60%] truncate">{display}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {result.raw_text && (
                    <div className="p-3 rounded-xl bg-white/3 border border-white/5">
                      <p className="text-xs text-gray-400 mb-2">Extracted Text Preview</p>
                      <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{String(result.raw_text).slice(0, 400)}...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <ArchitectureTab />
        )}
      </div>
    </main>
  );
}

function ArchitectureTab() {
  const steps = [
    { num: "01", title: "Document Ingestion", desc: "PDF or image uploaded. File type detected — digital native vs scanned vs photographed.", color: "blue" },
    { num: "02", title: "Smart Routing", desc: "Digital PDFs go direct to text extraction via PyMuPDF. Scanned docs route to OCR pipeline.", color: "purple" },
    { num: "03", title: "Preprocessing", desc: "OpenCV pipeline: deskew, denoise, adaptive binarization, contrast enhancement (CLAHE).", color: "cyan" },
    { num: "04", title: "OCR Engine", desc: "EasyOCR for scanned docs. Direct PyMuPDF extraction for digital. 0.05s vs 60s per page.", color: "green" },
    { num: "05", title: "LLM Post-Correction", desc: "Claude API fixes OCR errors using domain-specific prompts. Protects numeric data.", color: "yellow" },
    { num: "06", title: "NER Extraction", desc: "Regex + scispaCy extracts ICD-10, CPT, NPI, dates, amounts, member IDs, payers.", color: "orange" },
    { num: "07", title: "Confidence Scoring", desc: "Every doc scored HIGH/MEDIUM/LOW. Low confidence flagged for human review (HITL).", color: "red" },
    { num: "08", title: "Structured Output", desc: "Clean JSON with doc type, entities, confidence, text. Ready for RCM system integration.", color: "blue" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
    green: "bg-green-500/10 border-green-500/20 text-green-400",
    yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
    orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    red: "bg-red-500/10 border-red-500/20 text-red-400",
  };

  return (
    <div>
      <div className="mb-8 p-5 rounded-xl bg-white/3 border border-white/5">
        <h2 className="text-lg font-semibold mb-2">Layered OCR Pipeline Architecture</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          A production-grade document intelligence system built for healthcare RCM automation.
          Processes 311+ document types at 0.05s per digital doc and 15-25s per scanned doc.
          Achieves 95%+ entity extraction accuracy on structured healthcare documents.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step) => (
          <div key={step.num} className="flex gap-4 p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition">
            <div className={"w-10 h-10 rounded-lg border flex items-center justify-center text-sm font-bold flex-shrink-0 " + (colorMap[step.color] || colorMap.blue)}>
              {step.num}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Documents Processed", value: "311+" },
          { label: "Avg Processing Time", value: "0.05s" },
          { label: "Entity Types Extracted", value: "11" },
          { label: "Pipeline Accuracy", value: "95%+" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-white/3 border border-white/5 text-center">
            <p className="text-2xl font-bold text-blue-400 mb-1">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
`;

writeFileSync('app/demo/page.tsx', content, 'utf8');
console.log('Written: ' + content.length + ' chars');