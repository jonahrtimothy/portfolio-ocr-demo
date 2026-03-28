import { writeFileSync } from 'fs';

const content = `"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ExternalLink, ChevronRight } from "lucide-react";

export default function LandingPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 600));
    if (password === process.env.NEXT_PUBLIC_DEMO_PASSWORD) {
      sessionStorage.setItem("demo_auth", "true");
      router.push("/demo");
    } else {
      setError("Incorrect password. Contact Jonah for access.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20">

        <div className="mb-8 px-4 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-gray-400 tracking-widest uppercase">
          Healthcare AI · RCM Automation · Document Intelligence
        </div>

        <h1 className="text-6xl font-bold text-center mb-4 tracking-tight">
          Jonah <span className="text-blue-400">Timothy</span>
        </h1>

        <p className="text-xl text-gray-400 text-center mb-3 max-w-xl">
          AI Engineer · Healthcare RCM Automation Specialist
        </p>

        <p className="text-sm text-gray-500 text-center mb-12 max-w-lg leading-relaxed">
          Building intelligent document processing pipelines for healthcare revenue cycle management.
          Specializing in OCR, NLP, and LLM-powered extraction for prior auth, EOB, and clinical documents.
        </p>

        <div className="flex flex-wrap gap-4 justify-center mb-16">
          <a href="mailto:jonah.r.timothy@gmail.com" className="contact-link"><Mail size={14} /><span>jonah.r.timothy@gmail.com</span></a>
          <a href="https://linkedin.com/in/jonahtimothy" target="_blank" rel="noopener noreferrer" className="contact-link"><ExternalLink size={14} /><span>linkedin.com/in/jonahtimothy</span></a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full mb-16">
          {[
            { icon: "🏥", title: "Healthcare RCM OCR", desc: "Upload prior auth, EOB, CMS-1500 or clinical notes. Get ICD-10, CPT, NPI and payer data extracted instantly." },
            { icon: "🧠", title: "Document Intelligence", desc: "Upload any scanned document. AI classifies type, extracts text, identifies key entities." },
            { icon: "⚙️", title: "Pipeline Architecture", desc: "Full layered OCR pipeline: detection, preprocessing, extraction, LLM correction, NER." },
          ].map((item) => (
            <div key={item.title} className="p-5 rounded-xl border border-white/10 bg-white/5">
              <div className="text-2xl mb-3">{item.icon}</div>
              <div className="text-sm font-semibold text-white mb-2">{item.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="w-full max-w-sm">
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Lock size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-gray-300">Request demo access</span>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              This demo is password protected. Contact me at <a href="mailto:jonah.r.timothy@gmail.com" className="text-blue-400">jonah.r.timothy@gmail.com</a> to get access.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter demo password"
                className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition text-sm font-medium"
              >
                {loading ? "Verifying..." : "Enter Demo"}
                {!loading && <ChevronRight size={14} />}
              </button>
            </form>
          </div>
        </div>

      </div>
      <footer className="text-center py-6 text-xs text-gray-600 border-t border-white/5">
        Built with Next.js · Claude AI · EasyOCR · PyMuPDF · FastAPI
        <br /><span className="text-gray-700">2026 Jonah Timothy</span>
      </footer>
    </main>
  );
}
`;

writeFileSync('app/page.tsx', content, 'utf8');
console.log('Written: ' + content.length + ' chars');