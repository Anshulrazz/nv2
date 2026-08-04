"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Loader2, Award, CheckCircle2, AlertCircle, Ban, RefreshCw, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface CertificateItem {
  _id: string;
  userId: string;
  displayName: string;
  rank: number | null;
  issuedAt: string;
  revoked: boolean;
  revokedReason: string | null;
}

export default function HostCertificatesPage() {
  const { id } = useParams<{ id: string }>();

  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCertificates = async () => {
    try {
      const res = await fetch(`/api/events/${id}/certificates/list`);
      if (!res.ok) throw new Error("Failed to load certificates.");
      const data = await res.json();
      setCertificates(data.certificates ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading certificates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleGenerateAll = async () => {
    setGenerating(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch(`/api/events/${id}/certificates/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed.");
      setMessage(data.message || "Certificates generated successfully!");
      loadCertificates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (userId: string) => {
    try {
      const res = await fetch(`/api/events/${id}/certificates/${userId}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: revokeReason || "Revoked by host." }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Revocation failed.");
      setRevokingId(null);
      setRevokeReason("");
      loadCertificates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Revocation failed.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/host/events/${id}/edit`}
          className="p-2 rounded-xl hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Certificates Management</h1>
          <p className="text-xs text-muted-foreground">Generate, view, and revoke certificates for this event.</p>
        </div>
        <button
          onClick={handleGenerateAll}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {generating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Generate / Update Certificates
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="size-4" />
          {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="size-4" />
          {error}
        </div>
      )}

      {certificates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 border border-dashed border-sidebar-border rounded-2xl">
          <Award className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No certificates generated yet.</p>
          <button
            onClick={handleGenerateAll}
            disabled={generating}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl"
          >
            Generate Now
          </button>
        </div>
      ) : (
        <div className="bg-sidebar border border-sidebar-border rounded-2xl overflow-hidden divide-y divide-sidebar-border">
          {certificates.map((cert) => (
            <div key={cert._id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{cert.displayName}</span>
                  {cert.rank && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      Rank #{cert.rank}
                    </span>
                  )}
                  {cert.revoked ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      REVOKED: {cert.revokedReason}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      VALID
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                  Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                </p>
              </div>

              {!cert.revoked && (
                <div>
                  {revokingId === cert.userId ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Reason for revocation..."
                        value={revokeReason}
                        onChange={(e) => setRevokeReason(e.target.value)}
                        className="bg-background border border-sidebar-border rounded-lg px-3 py-1 text-xs text-foreground focus:outline-none"
                      />
                      <button
                        onClick={() => handleRevoke(cert.userId)}
                        className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700"
                      >
                        Confirm Revoke
                      </button>
                      <button
                        onClick={() => setRevokingId(null)}
                        className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setRevokingId(cert.userId)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Ban className="size-3.5" />
                      Revoke
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
