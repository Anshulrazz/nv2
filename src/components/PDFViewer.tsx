"use client";

import React, { useState, useRef } from "react";
import { FileText, Upload, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFViewerProps {
  note: {
    _id: string;
    title: string;
    assetUrl?: string;
    assetName?: string;
  };
  onUpdate: (updates: { assetUrl: string; assetName: string }) => Promise<void>;
}

export function PDFViewer({ note, onUpdate }: PDFViewerProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please upload a PDF file only.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        await onUpdate({
          assetUrl: data.url,
          assetName: file.name,
        });
      } else {
        alert("Failed to upload PDF file.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading PDF.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleRemove = async () => {
    if (confirm("Are you sure you want to remove this PDF from the note?")) {
      await onUpdate({
        assetUrl: "",
        assetName: "",
      });
    }
  };

  if (note.assetUrl) {
    return (
      <div className="flex flex-col h-full bg-[#05070F] text-white overflow-hidden">
        {/* PDF Top Bar Controls */}
        <div className="h-12 border-b border-white/[0.08] bg-white/[0.02] backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2.5 text-xs text-neutral-400 min-w-0">
            <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
            <span
              className="font-bold text-neutral-200 truncate max-w-[120px] sm:max-w-[240px]"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {note.assetName || "Attached PDF"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(note.assetUrl, "_blank")}
              className="h-8 text-[11px] gap-1.5 text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-all px-2 sm:px-3"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Open in New Tab</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 text-[11px] gap-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all px-2 sm:px-3"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Remove</span>
            </Button>
          </div>
        </div>

        {/* PDF Render Area */}
        <div className="flex-1 w-full bg-[#05070F] relative">
          <iframe
            src={`${note.assetUrl}#toolbar=1`}
            className="w-full h-full border-none"
            title={note.assetName || "PDF Viewer"}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#05070F] text-white p-8 items-center justify-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative z-10 w-full max-w-lg border border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? "border-cyan-400 bg-cyan-500/[0.04] shadow-[0_0_20px_rgba(6,182,212,0.15)]"
            : "border-white/[0.08] bg-white/[0.02] hover:border-cyan-500/50 hover:bg-cyan-500/[0.02]"
        }`}
      >
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-cyan-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-200" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Uploading PDF...
              </h3>
              <p className="text-xs text-neutral-500">Processing file and attaching to note</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="h-14 w-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto shadow-inner group-hover:border-cyan-500/30 transition-colors">
              <Upload className="h-6 w-6 text-cyan-400" />
            </div>

            <div className="space-y-2">
              <h3
                className="text-base font-bold text-neutral-200 tracking-tight"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Attach PDF to Note
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto leading-relaxed">
                Drag and drop a PDF document here, or click anywhere inside this area to select from your files.
              </p>
            </div>

            <div
              className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest inline-block border border-cyan-500/20 bg-cyan-500/5 rounded-full px-4 py-1"
              style={{ fontFamily: "var(--font-jetbrains-mono)" }}
            >
              PDF documents only
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
