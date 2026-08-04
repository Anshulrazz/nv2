import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Certificate } from "@/models/Certificate";
import { Event } from "@/models/Event";
import { User } from "@/models/User";
import { Award, CheckCircle2, XCircle, Calendar, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  await connectToDatabase();
  const cert = await Certificate.findById(id).lean();
  if (!cert) return { title: "Certificate Not Found — Notexia" };
  return {
    title: `Certificate of Completion — ${cert.displayName} | Notexia`,
    description: `Official verified event certificate issued to ${cert.displayName} on Notexia.`,
  };
}

export default async function CertificateViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectToDatabase();

  const cert = await Certificate.findById(id).lean();
  if (!cert) notFound();

  const [event, user] = await Promise.all([
    Event.findById(cert.eventId).select("name type eventStart eventEnd").lean(),
    User.findById(cert.userId).select("name username image").lean(),
  ]);

  if (!event) notFound();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Verification Card */}
      <div className="w-full max-w-2xl bg-sidebar border border-sidebar-border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Background emblem */}
        <Award className="absolute -bottom-10 -right-10 size-64 text-primary/5 pointer-events-none" />

        {/* Status Badge */}
        <div className="flex justify-between items-center mb-8 border-b border-sidebar-border pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-foreground">
              Official Notexia Verified Certificate
            </span>
          </div>
          {cert.revoked ? (
            <span className="flex items-center gap-1 text-xs font-mono font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full">
              <XCircle className="size-3.5" /> REVOKED
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
              <CheckCircle2 className="size-3.5" /> VERIFIED VALID
            </span>
          )}
        </div>

        {/* Certificate Content */}
        <div className="text-center space-y-6 my-6">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
            This is to certify that
          </p>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {cert.displayName || user?.name || "Participant"}
          </h1>

          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            has successfully participated in and completed{" "}
            <span className="font-semibold text-foreground">{event.name}</span>
            {cert.rank ? ` achieving Rank #${cert.rank}` : ""}.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground border-t border-sidebar-border/60">
            <div className="flex items-center gap-1.5 font-mono">
              <Calendar className="size-4 text-primary" />
              Issued: {new Date(cert.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </div>
            <div className="font-mono">
              Type: <span className="uppercase font-bold text-foreground">{event.type}</span>
            </div>
            <div className="font-mono">
              ID: <span className="text-foreground">{cert._id.toString()}</span>
            </div>
          </div>
        </div>

        {/* Revoked Warning */}
        {cert.revoked && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center text-xs text-red-400">
            <p className="font-bold">Notice: This certificate was revoked by the event host.</p>
            <p className="mt-1 text-muted-foreground">Reason: {cert.revokedReason}</p>
          </div>
        )}

        {/* Footer link */}
        <div className="mt-8 pt-4 text-center">
          <Link href="/events" className="text-xs text-primary hover:underline font-mono">
            ← Explore more events on Notexia
          </Link>
        </div>
      </div>
    </div>
  );
}
