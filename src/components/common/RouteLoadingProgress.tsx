"use client";

import React, { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function RouteLoadingBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setProgress(30);

    const timer1 = setTimeout(() => setProgress(70), 100);
    const timer2 = setTimeout(() => setProgress(95), 250);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }, 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname, searchParams]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
        >
          <motion.div
            className="h-1 bg-gradient-to-r from-[#F0C93B] via-[#8FC3DE] to-[#F28B6E] shadow-[0_0_15px_rgba(240,201,59,0.8)]"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function RouteLoadingProgress() {
  return (
    <Suspense fallback={null}>
      <RouteLoadingBarContent />
    </Suspense>
  );
}
