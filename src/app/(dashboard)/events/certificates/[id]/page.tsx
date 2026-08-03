"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, AlertCircle, Download, Trophy, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CTFCertificateData {
  certificateId: string;
  displayName: string;
  eventTitle: string;
  category: string;
  rank: number;
  issuedAt: string;
  certificateUrl: string;
}

export default function DedicatedCTFCertificatePage() {
  const params = useParams();
  const id = params.id as string;

  const [cert, setCert] = useState<CTFCertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCert() {
      try {
        const res = await fetch(`/api/events/certificates/${id}`);
        if (!res.ok) {
          throw new Error("CTF Certificate not found.");
        }
        const data = await res.json();
        setCert(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchCert();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E12] text-[#E0E6ED] flex flex-col items-center justify-center p-8 space-y-4 font-mono">
        <Loader2 className="size-8 text-amber-400 animate-spin" />
        <p className="text-xs text-amber-400 animate-pulse">Rendering CTF Champion Credential...</p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-[#0A0E12] text-[#E0E6ED] p-8 flex flex-col items-center justify-center space-y-4 font-mono">
        <AlertCircle className="size-10 text-red-400" />
        <h2 className="text-xl font-bold text-red-400">CTF Certificate Error</h2>
        <p className="text-xs text-zinc-400">{error}</p>
        <Link href="/events">
          <Button variant="outline" size="sm" className="text-xs text-amber-400 border-amber-500/40">
            <ArrowLeft className="size-4 mr-1.5" /> Back to Events Hub
          </Button>
        </Link>
      </div>
    );
  }

  const rankBadgeText =
    cert.rank === 1
      ? "Rank #1 Gold Champion 🏆"
      : cert.rank === 2
      ? "Rank #2 Silver Winner 🥈"
      : cert.rank === 3
      ? "Rank #3 Bronze Winner 🥉"
      : `Rank #${cert.rank} Finisher`;

  return (
    <div className="min-h-screen bg-[#0A0E12] text-[#E0E6ED] flex flex-col items-center justify-start py-10 px-4 sm:px-6 relative overflow-y-auto overflow-x-hidden font-sans">
      {/* Background cyber glow flourishes */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full filter blur-[140px] pointer-events-none" />

      {/* Action Bar */}
      <div className="w-full max-w-3xl flex justify-between items-center mb-6 relative z-10 print:hidden font-mono">
        <Link href="/events">
          <Button variant="ghost" size="sm" className="text-xs text-amber-400 hover:bg-amber-500/10 gap-2">
            <ArrowLeft className="size-4" /> Back to Events Hub
          </Button>
        </Link>

        <Button
          onClick={() => window.print()}
          className="bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs h-10 px-5 rounded-xl gap-2 shadow-lg shadow-amber-500/20"
        >
          <Download className="size-4" /> Print / Save PDF
        </Button>
      </div>

      {/* Dedicated CTF Certificate Frame Container */}
      <div
        id="ctf-certificate-container"
        className="relative z-10 w-full max-w-3xl aspect-[1.414/1] bg-[#0E1318] text-[#E0E6ED] rounded-2xl shadow-2xl p-6 sm:p-10 border-2 border-amber-500/60 print:shadow-none print:p-0 mx-auto overflow-hidden font-mono"
      >
        <div className="w-full h-full border border-amber-500/30 p-6 sm:p-8 flex flex-col items-center justify-between bg-gradient-to-b from-[#121820] to-[#0A0E12] relative rounded-xl shadow-inner">
          {/* Cyber Corner Ornaments */}
          <div className="absolute top-3 left-3 size-5 border-t-2 border-l-2 border-amber-400" />
          <div className="absolute top-3 right-3 size-5 border-t-2 border-r-2 border-amber-400" />
          <div className="absolute bottom-3 left-3 size-5 border-b-2 border-l-2 border-amber-400" />
          <div className="absolute bottom-3 right-3 size-5 border-b-2 border-r-2 border-amber-400" />

          {/* Certificate Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-bold border border-amber-500/30">
              <Shield className="size-4" /> NOTEXIA CYBER DEFENSE CTF
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-wider text-white uppercase" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Certificate of Achievement
            </h1>
            <p className="text-xs text-zinc-400 tracking-widest uppercase">
              Official Flag-Based Cyber Security Competition Credential
            </p>
          </div>

          {/* Competitor Name & Rank */}
          <div className="text-center space-y-3 my-4">
            <span className="text-xs text-zinc-400">This certificate is proudly awarded to</span>

            <h2 className="text-3xl sm:text-5xl font-black text-amber-400 tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              {cert.displayName}
            </h2>

            <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500 text-black font-extrabold text-xs shadow-lg">
              {rankBadgeText}
            </div>

            <p className="text-xs text-zinc-300 max-w-lg mx-auto leading-relaxed pt-2">
              Demonstrating technical excellence in penetration testing, security analysis, and flag exfiltration during the{" "}
              <strong className="text-white font-bold">{cert.eventTitle}</strong> ({cert.category}).
            </p>
          </div>

          {/* Footer Area */}
          <div className="w-full flex items-end justify-between pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-400">
            <div className="space-y-0.5">
              <div className="text-white font-bold">Notexia CTF Organizing Committee</div>
              <div className="text-[10px] text-zinc-500">Issued on {new Date(cert.issuedAt).toLocaleDateString()}</div>
            </div>

            {/* Gold Seal Icon */}
            <div className="size-12 rounded-full bg-amber-500/20 border border-amber-500/60 flex items-center justify-center text-amber-400 shadow-lg shrink-0">
              <Trophy className="size-6" />
            </div>

            <div className="text-right space-y-0.5">
              <div className="text-[10px] text-zinc-500">Verification Hash</div>
              <div className="font-mono text-amber-400/90 text-[10px]">{cert.certificateId.slice(0, 16)}...</div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { size: landscape; margin: 0; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: #0A0E12 !important; }
          body * { visibility: hidden; }
          #ctf-certificate-container, #ctf-certificate-container * { visibility: visible; }
          #ctf-certificate-container { position: absolute; left: 0; top: 0; width: 100vw; height: 100vh; margin: 0; border: none; }
        }
      `}} />
    </div>
  );
}
