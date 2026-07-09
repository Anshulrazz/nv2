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
      <DialogContent className="bg-neutral-900 border border-neutral-800 text-neutral-100 max-w-sm cyber-panel z-[9999]">
        <DialogHeader>
          <DialogTitle className="text-neutral-105 font-bold text-sm tracking-wide font-space-grotesk">
            {title}
          </DialogTitle>
          <DialogDescription className="text-neutral-400 text-xs mt-1 leading-normal">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 flex justify-end">
          {type === "confirm" && (
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-neutral-800 text-neutral-400 hover:text-white bg-neutral-950 hover:bg-neutral-900 text-xs h-8"
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            className="bg-cyan-500 hover:bg-cyan-400 text-neutral-955 font-bold text-xs h-8 px-4 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
