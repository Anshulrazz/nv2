"use client";

import React from "react";
import { useAlertStore } from "@/stores/alertStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function CustomAlertDialog() {
  const { isOpen, type, title, message, onConfirm, onCancel, closeAlert } = useAlertStore();

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeAlert();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeAlert();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeAlert(); }}>
      <DialogContent className="bg-[#150F0B]/95 border border-[#2E2118] text-[#FAFAF8] max-w-sm backdrop-blur-2xl shadow-[0_0_50px_-10px_rgba(245,148,29,0.25)] rounded-[2rem] z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-[#FAFAF8] font-bold text-sm tracking-wide font-display">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[#8A8078] text-xs mt-1 leading-normal">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 flex justify-end">
          {type === "confirm" && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-[#2E2118] text-[#8A8078] hover:text-[#FAFAF8] bg-[#0A0806] hover:bg-[#150F0B] text-xs h-8 rounded-full"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            className="btn-premium-primary text-xs h-8 px-4 font-bold font-display"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
