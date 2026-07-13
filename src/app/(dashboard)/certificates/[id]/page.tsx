"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, AlertCircle, Download, Award, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CertificatePage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCert() {
      try {
        const res = await fetch(`/api/certificates/${id}`);
        if (!res.ok) {
          throw new Error("Certificate not found or invalid.");
        }
        const data = await res.json();
        setCert(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchCert();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 gap-4 h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading Certificate...</p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="flex-1 p-10 flex flex-col items-center justify-center gap-4 h-screen">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-bold">Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.push("/courses")} variant="outline">
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start py-10 px-4 sm:px-6 relative overflow-y-auto overflow-x-hidden">
      
      {/* Background flourishes */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-500/10 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Action Bar */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-6 relative z-10 print:hidden mt-10 md:mt-0">
        <Button variant="ghost" onClick={() => router.push("/courses")} className="text-muted-foreground hover:text-foreground">
          &larr; Back to Courses
        </Button>
        <Button 
          onClick={() => window.print()}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2 shadow-lg shadow-violet-500/20"
        >
          <Download className="h-4 w-4" /> Download
        </Button>
      </div>

      {/* Certificate Card */}
      <div id="certificate-container" className="relative z-10 w-full max-w-2xl aspect-[1/1.414] bg-white text-slate-900 rounded-sm shadow-2xl p-4 md:p-6 print:shadow-none print:p-0 mx-auto">
        <div className="w-full h-full border-[1px] border-amber-600/30 p-2 md:p-3 flex flex-col bg-[#FDFBF7] shadow-inner relative">
          
          {/* Elegant thin double border */}
          <div className="absolute inset-2 md:inset-3 border-[1px] border-amber-700/40 pointer-events-none"></div>
          <div className="absolute inset-[12px] md:inset-[16px] border-[1px] border-amber-700/20 pointer-events-none"></div>
          
          {/* Delicate Corner Accents */}
          <div className="absolute top-2 left-2 w-4 h-4 md:w-6 md:h-6 border-t-[2px] border-l-[2px] border-amber-600"></div>
          <div className="absolute top-2 right-2 w-4 h-4 md:w-6 md:h-6 border-t-[2px] border-r-[2px] border-amber-600"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 md:w-6 md:h-6 border-b-[2px] border-l-[2px] border-amber-600"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 md:w-6 md:h-6 border-b-[2px] border-r-[2px] border-amber-600"></div>

          <div className="w-full h-full flex flex-col items-center justify-center relative z-10 text-center px-4 md:px-8">
            
            {/* Header / Logo */}
            <div className="mb-6 md:mb-10 mt-4 md:mt-6 flex flex-col items-center">
              <img src="/logo.png" alt="Nottexia Logo" className="h-10 md:h-12 w-auto object-contain mb-3" onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }} />
              <h2 className="text-[9px] md:text-[11px] text-amber-800/80 uppercase tracking-[0.25em] font-medium text-center" style={{ fontFamily: "'Cinzel', serif" }}>
                Notexia, The Ultimate Learning Platform
              </h2>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl text-slate-800 mb-4 tracking-[0.2em] uppercase font-light text-center" style={{ fontFamily: "'Cinzel', serif" }}>
              Certificate
            </h1>

            {/* Elegant Subtitle Divider */}
            <div className="flex items-center gap-4 mb-10 w-full max-w-[200px] mx-auto">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-amber-600/50"></div>
              <span className="text-[10px] md:text-xs tracking-[0.3em] text-amber-700 font-semibold uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
                Of Completion
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-amber-600/50"></div>
            </div>

            <p className="text-slate-600 text-sm md:text-lg mb-4 md:mb-6 text-center italic" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              This certificate is proudly presented to
            </p>
            
            <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-[84px] text-amber-600 mb-8 md:mb-12 px-4 text-center line-clamp-1 leading-tight" style={{ fontFamily: "'Great Vibes', cursive" }}>
              {cert.studentName}
            </h2>

            <p className="text-slate-700 text-sm md:text-lg lg:text-xl max-w-md leading-relaxed mb-16 md:mb-20 px-4 text-center" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Awarded in appreciation of your participation and commitment shown during the <strong className="whitespace-nowrap text-slate-900 font-semibold">{cert.courseName}</strong> course, demonstrating cooperation, enthusiasm, and a positive spirit in every activity.
            </p>

            {/* Footer Area */}
            <div className="w-full flex justify-between items-end mt-auto px-4 md:px-8 pb-4 relative z-10">
              
              <div className="flex flex-col items-center w-24 md:w-36">
                <div className="w-full border-t-[1px] border-slate-400 mb-2"></div>
                <span className="text-[9px] md:text-[11px] font-semibold tracking-widest text-slate-800 uppercase text-center line-clamp-1" style={{ fontFamily: "'Cinzel', serif" }}>
                  {cert.instructorName}
                </span>
                <span className="text-[8px] md:text-[10px] text-amber-700/80 text-center mt-1 tracking-widest" style={{ fontFamily: "'Cinzel', serif" }}>
                  Instructor
                </span>
              </div>
              
              {/* Minimalist Elegant Seal */}
              <div className="absolute left-1/2 bottom-[-10px] md:bottom-0 -translate-x-1/2 flex flex-col items-center">
                 <div className="relative flex justify-center w-20 h-20 md:w-28 md:h-28">
                   {/* Golden Circle */}
                   <div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-[1px] border-amber-600/40 shadow-sm flex items-center justify-center relative z-10 bg-white" style={{ background: 'radial-gradient(circle, #FFF 40%, #fef3c7 100%)' }}>
                     <div className="w-12 h-12 md:w-20 md:h-20 rounded-full border-[1px] border-amber-600/20 flex items-center justify-center">
                       <Award className="h-6 w-6 md:h-10 md:w-10 text-amber-600/60" strokeWidth={1} />
                     </div>
                   </div>
                 </div>
              </div>

              <div className="flex flex-col items-center w-24 md:w-36">
                <div className="w-full border-t-[1px] border-slate-400 mb-2"></div>
                <span className="text-[9px] md:text-[11px] font-semibold tracking-widest text-slate-800 uppercase text-center line-clamp-1" style={{ fontFamily: "'Cinzel', serif" }}>
                  Notexia Admin
                </span>
                <span className="text-[8px] md:text-[10px] text-amber-700/80 text-center mt-1 tracking-widest" style={{ fontFamily: "'Cinzel', serif" }}>
                  {new Date(cert.completedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Certificate ID */}
            <div className="absolute top-4 left-4 md:top-6 md:left-6 text-[6px] md:text-[8px] text-slate-400 font-mono tracking-widest uppercase">
              ID: {cert.certificateId}
            </div>

          </div>
        </div>
      </div>

      {/* Import the elegant fonts */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Great+Vibes&display=swap');
        @media print {
          @page { size: portrait; margin: 0; }
          body { 
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
            background: white !important; 
          }
          
          /* Hide everything initially */
          body * {
            visibility: hidden;
          }
          
          /* Show only the certificate and its children */
          #certificate-container, #certificate-container * {
            visibility: visible;
          }
          
          /* Position the certificate perfectly on the printed page */
          #certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            transform: scale(1) !important;
          }
        }
      `}} />
    </div>
  );
}
