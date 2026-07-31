import React from "react";
import Link from "next/link";
import { Users, ShieldCheck, HeartHandshake, Flag, MessageSquare } from "lucide-react";
import { TrustHeader } from "@/components/public/TrustHeader";
import { TrustFooter } from "@/components/public/TrustFooter";

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-[#16261D] text-[#F3F0E4] font-sans selection:bg-[#F0C93B]/30 flex flex-col antialiased">
      <TrustHeader title="COMMUNITY GUIDELINES" />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10 flex-1">
        {/* Header Hero Section */}
        <div className="space-y-4 border-b border-[#F3F0E4]/15 pb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#8FC3DE]/15 border border-[#8FC3DE]/30 text-[#8FC3DE] text-xs font-mono font-bold uppercase tracking-wider">
            <Users className="size-3.5" /> ACADEMIC CODE OF CONDUCT
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Community Standards &amp; Peer Conduct
          </h1>
          <p className="text-[#9FAEA1] text-sm sm:text-base leading-relaxed max-w-3xl font-light">
            Notexia is built to cultivate a collaborative, supportive environment where students share knowledge, answer academic doubts, and excel together. These Community Guidelines set expectations for all member interactions across blogs, forums, and chat groups.
          </p>
          <div className="text-[11px] font-mono text-[#9FAEA1]/80">
            Last Updated: July 30, 2026 • Effective Date: January 1, 2026
          </div>
        </div>

        {/* Guidelines Content Cards */}
        <div className="space-y-8 text-sm leading-relaxed">
          {/* Section 1: Academic Integrity */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <ShieldCheck className="size-5 text-[#8FC3DE]" /> 1. Academic Integrity &amp; Anti-Cheating
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Notexia stands firmly for genuine learning. Content shared on the platform must respect academic honesty:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>
                  <strong className="text-white font-bold">No Exam Paper Leaks:</strong> Sharing live or leaked question papers during ongoing competitive exams (JEE, NEET, CBSE, GATE, UPSC) is strictly prohibited.
                </li>
                <li>
                  <strong className="text-white font-bold">No Plagiarism:</strong> Give credit when summarizing research papers or referencing external educational creators.
                </li>
                <li>
                  <strong className="text-white font-bold">No Deceptive Notes:</strong> Do not intentionally post false formulas or misleading study sheets designed to sabotage peers.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2: Respectful Peer Conduct */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <HeartHandshake className="size-5 text-[#F0C93B]" /> 2. Respectful Peer Interaction
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Our community thrives on constructive feedback and mutual respect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Be patient with peers who ask basic or beginner-level academic questions.</li>
                <li>Harassment, bullying, hate speech, body-shaming, or discrimination of any kind in forums or DMs will result in instant account suspension.</li>
                <li>Keep forum discussions relevant to study topics, exam strategy, and subject learning.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Anti-Spam & Links */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <MessageSquare className="size-5 text-[#F28B6E]" /> 3. Spam &amp; Unauthorized Commercial Ads
              </h2>
              <p className="text-[#9FAEA1] font-light">
                Notexia forums and blog comments must remain clean and clutter-free:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-[#F3F0E4] font-light">
                <li>Do not post referral links, telegram group spam, crypto schemes, or paid assignment solicitation.</li>
                <li>Do not create multiple duplicate posts or bot accounts to artificially farm activity coins or leaderboard ranks.</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Moderation & Strike System */}
          <section className="rounded-[2rem] bg-[#1A2D23]/90 border border-[#F3F0E4]/15 p-2 shadow-xl">
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#121F18] p-6 sm:p-8 space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 font-heading">
                <Flag className="size-5 text-[#C9A9E0]" /> 4. Content Reporting &amp; Account Strike System
              </h2>
              <p className="text-[#9FAEA1] font-light">
                We enforce community safety using both peer reporting tools and automated moderation filters:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <div className="text-xs font-bold text-[#8FC3DE]">Strike 1: Warning</div>
                  <p className="text-[11px] text-[#9FAEA1]">Content removed &amp; official warning issued to account holder.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <div className="text-xs font-bold text-[#F0C93B]">Strike 2: Mute</div>
                  <p className="text-[11px] text-[#9FAEA1]">7-day temporary restriction on forum posting and comments.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#16261D] border border-[#F3F0E4]/10 space-y-1">
                  <div className="text-xs font-bold text-[#F28B6E]">Strike 3: Ban</div>
                  <p className="text-[11px] text-[#9FAEA1]">Permanent account suspension and revocation of coins.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Report Violation Notice */}
          <div className="rounded-2xl border border-[#F3F0E4]/15 bg-[#1A2D23] p-6 text-center space-y-2 shadow-lg">
            <h3 className="text-base font-bold text-white font-heading">Need to Report a Guideline Violation?</h3>
            <p className="text-xs text-[#9FAEA1]">
              Flag the post directly in the app or contact our Moderation Team at{" "}
              <a href="mailto:support@notexia.cloud" className="text-[#8FC3DE] font-bold hover:underline">
                support@notexia.cloud
              </a>{" "}
              or via our{" "}
              <Link href="/contact" className="text-[#F0C93B] font-bold hover:underline">
                Contact Form
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      <TrustFooter />
    </div>
  );
}
