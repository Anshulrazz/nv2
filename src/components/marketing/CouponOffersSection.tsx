"use client";

import React, { useState, useEffect } from "react";
import { Tag, Copy, Check, Percent, Gift } from "lucide-react";

interface CouponItem {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  applicableFor: string;
  validUntil: string;
}

const fallbackOffers: CouponItem[] = [
  {
    code: "STUDENT50",
    description: "50% OFF Notexia Premium Subscriptions for University Students",
    discountType: "percentage",
    discountValue: 50,
    applicableFor: "subscription",
    validUntil: "2026-12-31",
  },
  {
    code: "WELCOME100",
    description: "Get 100 Free Activity Coins & AI Tokens on Upgrade",
    discountType: "fixed",
    discountValue: 100,
    applicableFor: "coins",
    validUntil: "2026-12-31",
  },
  {
    code: "JEE2026",
    description: "40% Flat Discount for JEE & NEET Competitive Exam Scholars",
    discountType: "percentage",
    discountValue: 40,
    applicableFor: "all",
    validUntil: "2026-12-31",
  },
  {
    code: "VTUPRO",
    description: "35% OFF Annual Engineering Research & Formula Pass",
    discountType: "percentage",
    discountValue: 35,
    applicableFor: "subscription",
    validUntil: "2026-12-31",
  },
];

export function CouponOffersSection() {
  const [coupons, setCoupons] = useState<CouponItem[]>(fallbackOffers);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/coupons")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.coupons) && data.coupons.length > 0) {
          setCoupons(data.coupons);
        }
      })
      .catch(() => {});
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <section id="offers" className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10 space-y-12">
      {/* SECTION HEADER */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F5B429]/15 border border-[#F5B429]/30 text-[#F5B429] text-xs font-mono font-bold uppercase tracking-wider">
          <Tag className="size-3.5" /> STUDENT DISCOUNTS &amp; OFFERS
        </div>
        <h2 className="text-3xl sm:text-5xl font-bold text-[#FAFAF8] font-display">
          Exclusive Student Promo Codes
        </h2>
        <p className="text-sm sm:text-base text-[#8A8078] font-light leading-relaxed">
          Copy an active promotional discount code below to apply flat savings on Notexia Premium subscriptions and AI token packages.
        </p>
      </div>

      {/* OFFERS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {coupons.map((c, idx) => (
          <div
            key={idx}
            className="rounded-[2rem] bg-[#150F0B]/85 border border-[#2E2118] p-2 shadow-[0_0_30px_-10px_rgba(245,148,29,0.15)] hover:border-[#F5B429]/50 transition-all backdrop-blur-xl flex flex-col justify-between"
          >
            <div className="rounded-[calc(2rem-0.5rem)] bg-[#0A0806] p-6 space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="size-9 rounded-xl bg-[#F5B429]/10 border border-[#F5B429]/30 flex items-center justify-center text-[#F5B429] font-bold">
                    {c.discountType === "percentage" ? <Percent className="size-4" /> : <Gift className="size-4" />}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#FCD34D] bg-[#FCD34D]/10 px-2.5 py-0.5 rounded-full border border-[#FCD34D]/20 uppercase">
                    {c.discountType === "percentage" ? `${c.discountValue}% OFF` : `+${c.discountValue} BONUS`}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-lg font-bold text-[#F5B429] tracking-wider">
                    {c.code}
                  </div>
                  <p className="text-xs text-[#8A8078] font-light leading-relaxed min-h-[40px]">
                    {c.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#2E2118] space-y-2">
                <button
                  onClick={() => handleCopyCode(c.code)}
                  className="w-full rounded-full bg-[#150F0B] hover:bg-gradient-to-r hover:from-[#F5B429] hover:to-[#F5941D] text-[#FAFAF8] hover:text-[#150F0B] border border-[#2E2118] font-bold text-xs py-2.5 px-4 inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                >
                  {copiedCode === c.code ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      <span>Code Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
