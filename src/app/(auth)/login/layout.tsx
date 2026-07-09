import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
  description: "Sign in to your Notexia account to access your notes, blogs, community, and AI chat workspace.",
  alternates: { canonical: "https://notexia.in/login" },
  openGraph: {
    title: "Log In | Notexia",
    description: "Sign in to your Notexia workspace.",
    url: "https://notexia.in/login",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
