import type { Metadata } from "next";
import SignupClient from "./SignupClient";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const hasRef = !!resolvedParams.ref;

  if (hasRef) {
    return {
      title: "Sign Up & Earn 50 Coins",
      description: "Join Notexia today and get 50 coins instantly! Refer your friends and earn 100 coins for each friend who joins.",
      openGraph: {
        title: "Sign Up & Earn 50 Coins | Notexia",
        description: "Join Notexia today and get 50 coins instantly! Refer your friends and earn 100 coins for each friend who joins.",
      },
    };
  }

  return {
    title: "Sign Up & Earn 50 Coins",
    description: "Create your free Notexia account and get 50 bonus coins when you join! Invite friends to earn 100 coins for each successful referral.",
    openGraph: {
      title: "Sign Up & Earn 50 Coins | Notexia",
      description: "Join Notexia today and get 50 coins instantly! Refer your friends and earn 100 coins for each friend who joins.",
    },
  };
}

export default function SignupPage() {
  return <SignupClient />;
}
