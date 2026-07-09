import { create } from "zustand";

interface AlertState {
  isOpen: boolean;
  type: "alert" | "confirm";
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  closeAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  isOpen: false,
  type: "alert",
  title: "",
  message: "",
  showAlert: (title, message) =>
    set({
      isOpen: true,
      type: "alert",
      title,
      message,
      onConfirm: undefined,
      onCancel: undefined,
    }),
  showConfirm: (title, message, onConfirm, onCancel) =>
    set({
      isOpen: true,
      type: "confirm",
      title,
      message,
      onConfirm,
      onCancel,
    }),
  closeAlert: () => set({ isOpen: false }),
}));
