"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { FAQItem } from "@/lib/seo/jsonld";

export function FAQAccordion({ faqs }: { faqs: FAQItem[] }) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {faqs.map(({ question, answer }, index) => (
        <div
          key={question}
          className="rounded-[2rem] bg-[#1A2D23]/80 border border-[#F3F0E4]/15 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)] overflow-hidden"
        >
          <button
            onClick={() => toggleFaq(index)}
            className="w-full text-left rounded-[calc(2rem-0.5rem)] bg-[#121F18] border border-[#F3F0E4]/10 p-6 flex items-center justify-between gap-4 text-[#F3F0E4] font-bold text-base hover:bg-[#16261D] transition-colors font-heading"
          >
            <span>{question}</span>
            <Plus
              className={`size-5 text-[#F0C93B] shrink-0 transition-transform duration-300 ${
                openFaq === index ? "rotate-45" : ""
              }`}
            />
          </button>
          <AnimatePresence>
            {openFaq === index && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pt-3 text-xs sm:text-sm text-[#9FAEA1] leading-relaxed font-light">
                  {answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
