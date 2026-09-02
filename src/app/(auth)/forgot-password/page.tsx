import { Metadata } from "next";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Reset Password (2FA) | Notexia",
  description: "Secure two-factor password reset for your Notexia account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
