import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up & Earn 50 Coins",
  description: "Create your free Notexia account and get 50 bonus coins when you join! Invite friends to earn 100 coins for each successful referral.",
  alternates: { canonical: "https://notexia.in/signup" },
  openGraph: {
    title: "Sign Up & Earn 50 Coins | Notexia",
    description: "Join Notexia today and get 50 coins instantly! Refer your friends and earn 100 coins for each friend who joins.",
    url: "https://notexia.in/signup",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
