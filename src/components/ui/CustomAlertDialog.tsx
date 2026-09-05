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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            {message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-3 gap-2">
          {type === "confirm" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-xs"
            >
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleConfirm}
            className="text-xs font-semibold"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
