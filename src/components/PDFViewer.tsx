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
    if (confirm("Remove this PDF attachment from the note?")) {
      await onUpdate({
        assetUrl: "",
        assetName: "",
      });
    }
  };

  if (note.assetUrl) {
    return (
      <div className="flex flex-col h-full bg-bg-base text-text-primary">
        {/* PDF Top Bar */}
        <div className="h-12 border-b border-border-subtle bg-bg-surface px-4 sm:px-6 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <FileText className="size-4 text-accent-primary shrink-0" />
            <span className="text-xs font-semibold text-text-primary truncate">
              {note.assetName || "Attached PDF Document"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(note.assetUrl, "_blank")}
              className="h-8 text-[11px] gap-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors px-2 sm:px-3 cursor-pointer"
            >
              <ExternalLink className="size-3.5" />
              <span className="hidden sm:inline">Open in New Tab</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 text-[11px] gap-1.5 text-text-muted hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors px-2 sm:px-3 cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Remove</span>
            </Button>
          </div>
        </div>

        {/* PDF Render Area */}
        <div className="flex-1 w-full bg-bg-base relative">
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
    <div className="flex flex-col h-full bg-bg-base text-text-primary p-8 items-center justify-center relative">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative z-10 w-full max-w-lg border border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
          dragActive
            ? "border-accent-primary bg-accent-primary/5"
            : "border-border-default bg-bg-surface hover:border-accent-primary/50 hover:bg-bg-elevated/50"
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
            <Loader2 className="size-9 animate-spin text-accent-primary mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-text-primary">
                Uploading PDF...
              </h3>
              <p className="text-xs text-text-muted">Attaching PDF file to current note</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="size-12 rounded-xl bg-bg-elevated border border-border-subtle flex items-center justify-center mx-auto text-accent-primary">
              <Upload className="size-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-text-primary tracking-tight font-display">
                Attach PDF Document
              </h3>
              <p className="text-xs text-text-muted max-w-xs mx-auto leading-relaxed">
                Drag and drop a PDF file here, or click to browse files on your device.
              </p>
            </div>

            <div className="text-[10px] text-accent-primary font-mono font-medium inline-block border border-accent-primary/20 bg-accent-primary/10 rounded-full px-3 py-0.5">
              PDF files up to 25MB
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
