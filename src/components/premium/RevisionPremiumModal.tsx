"use client";

import React from "react";
import {
  FeaturePremiumModal,
  FeaturePremiumModalProps,
} from "./FeaturePremiumModal";

export function RevisionPremiumModal(props: FeaturePremiumModalProps) {
  return (
    <FeaturePremiumModal
      title="Unlock AI Revision Generator"
      badge="PREMIUM EXCLUSIVE"
      errorMessage={
        props.errorMessage ||
        "Revision Generator (Cheat Sheets, Flashcards, Quizzes) is an exclusive Premium feature. Upgrade to Premium to unlock AI Revision!"
      }
      {...props}
    />
  );
}

export { FeaturePremiumModal };
export type { FeaturePremiumModalProps };
