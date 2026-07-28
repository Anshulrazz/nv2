import React from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft, Zap, Code } from "lucide-react";


export default function FormulaSheetsPage() {
  const formulas = [
    {
      unit: "Mechanics & Kinematics",
      items: [
        { name: "Equations of Motion", latex: "v = u + at \\quad | \\quad s = ut + \\frac{1}{2}at^2 \\quad | \\quad v^2 = u^2 + 2as" },
        { name: "Work-Energy Theorem", latex: "W_{\\text{net}} = \\Delta K = K_f - K_i" },
        { name: "Center of Mass", latex: "R_{\\text{cm}} = \\frac{\\sum m_i r_i}{\\sum m_i}" },
        { name: "Moment of Inertia (Disk)", latex: "I = \\frac{1}{2} M R^2" },
      ],
    },
    {
      unit: "Electrodynamics & Magnetism",
      items: [
        { name: "Coulomb's Law", latex: "F = \\frac{1}{4\\pi\\varepsilon_0} \\frac{|q_1 q_2|}{r^2}" },
        { name: "Ohm's Law & Resistance", latex: "V = IR \\quad | \\quad R = \\rho \\frac{L}{A}" },
        { name: "Biot-Savart Law", latex: "dB = \\frac{\\mu_0}{4\\pi} \\frac{I (d\\vec{l} \\times \\hat{r})}{r^2}" },
        { name: "Faraday's Law of Induction", latex: "\\varepsilon = -\\frac{d\\Phi_B}{dt}" },
      ],
    },
    {
      unit: "Modern Physics & Quantum Mechanics",
      items: [
        { name: "Photoelectric Effect", latex: "E = h\\nu = W_0 + K_{\\text{max}}" },
        { name: "de Broglie Wavelength", latex: "\\lambda = \\frac{h}{p} = \\frac{h}{\\sqrt{2mK}}" },
        { name: "Bohr Atom Radius", latex: "r_n = \\frac{n^2 h^2 \\varepsilon_0}{\\pi m e^2} \\approx 0.529 n^2 \\text{ \\AA}" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans selection:bg-[#58a6ff]/30 flex flex-col antialiased">
      <header className="border-b border-[#21262d] bg-[#161b22]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/feed" className="text-[#8b949e] hover:text-white flex items-center gap-2 text-xs font-semibold transition-colors">
            <ArrowLeft className="size-4 text-[#58a6ff]" /> Back to Notexia
          </Link>
          <span className="text-sm font-bold tracking-widest text-[#58a6ff]" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            NOTEXIA FORMULA HUB
          </span>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto px-6 py-10 space-y-10 flex-1">
        <div className="space-y-4 border-b border-[#21262d] pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#388bfd]/10 border border-[#388bfd]/30 text-[#58a6ff] text-xs font-mono font-bold uppercase tracking-wider">
            <BookOpen className="size-3.5" /> DEFINITIVE REFERENCE
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            JEE Main &amp; NEET Physics Formula Sheet &amp; Revision Notes
          </h1>
          <p className="text-[#8b949e] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            Comprehensive, chapter-wise Physics formula cheat sheet for JEE Main, JEE Advanced, NEET UG, and CBSE Class 11/12. Includes key equations for Mechanics, Electrodynamics, Modern Physics, and Thermodynamics.
          </p>
        </div>

        <div className="space-y-8">
          {formulas.map((section) => (
            <div key={section.unit} className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6 space-y-4 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading border-b border-[#21262d] pb-3">
                <Zap className="size-4 text-[#F0C93B]" /> {section.unit}
              </h2>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.name} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold text-[#58a6ff] font-mono">{item.name}</span>
                    <code className="text-xs font-mono text-[#3fb950] bg-[#161b22] px-3 py-1.5 rounded-lg border border-[#30363d]">
                      {item.latex}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Backlink Embed Attribution Section */}
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Code className="size-4 text-[#a371f7]" />
            <h2 className="text-base font-bold text-white">Cite or Embed This Formula Sheet</h2>
          </div>
          <p className="text-xs text-[#8b949e]">
            Use this attribution link to cite Notexia Physics Formula Sheets in your blog or study notes:
          </p>
          <pre className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 text-xs font-mono text-[#3fb950] overflow-x-auto">
            <code>{`<a href="https://notexia.in/tools/formula-sheets" target="_blank">Notexia JEE & NEET Physics Formula Sheet</a>`}</code>
          </pre>
        </div>
      </main>
    </div>
  );
}
