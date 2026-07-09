import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your free Notexia account and join a growing community of learners, writers, and researchers.",
  alternates: { canonical: "https://notexia.in/signup" },
  openGraph: {
    title: "Sign Up | Notexia",
    description: "Create your free Notexia account and start your learning journey.",
    url: "https://notexia.in/signup",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
