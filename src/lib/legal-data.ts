import {
  Shield,
  Scale,
  Cookie,
  HardDrive,
  Lock,
  Cpu,
  FileText,
  Users,
  RefreshCw,
  AlertCircle,
  LucideIcon,
} from "lucide-react";

export interface LegalPageItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const LEGAL_PAGES: LegalPageItem[] = [
  {
    href: "/legal/privacy-policy",
    label: "Privacy Policy",
    icon: Shield,
    description:
      "Learn how Notexia collects, encrypts, and protects your personal credentials, study notes, and AI queries under DPDP Act 2023.",
  },
  {
    href: "/legal/terms",
    label: "Terms of Service",
    icon: Scale,
    description:
      "Review Notexia's Terms of Service and User Agreement. Learn account rules, academic conduct, and platform terms.",
  },
  {
    href: "/legal/cookie-policy",
    label: "Cookie Policy",
    icon: Cookie,
    description:
      "Understand how session cookies and local browser storage maintain security and preferences without 3rd-party ad tracking.",
  },
  {
    href: "/legal/data-retention",
    label: "Data Retention",
    icon: HardDrive,
    description:
      "Review data retention schedules, note backups, AI prompt log deletion timelines, and 30-day account erasure workflows.",
  },
  {
    href: "/legal/security-policy",
    label: "Security Policy",
    icon: Lock,
    description:
      "Explore enterprise security architecture, AES-256 database encryption, TLS 1.3 in transit, and vulnerability disclosure rules.",
  },
  {
    href: "/legal/ai-usage-policy",
    label: "AI Usage Policy",
    icon: Cpu,
    description:
      "Review AI usage guidelines, academic honor code, LLM isolation protocols, and responsible AI study assistance principles.",
  },
  {
    href: "/legal/copyright-dmca",
    label: "Copyright & DMCA",
    icon: FileText,
    description:
      "Submit copyright infringement notices, DMCA takedown requests, and review intellectual property rights.",
  },
  {
    href: "/legal/community-guidelines",
    label: "Community Guidelines",
    icon: Users,
    description:
      "Explore community guidelines, academic honor code, peer behavior rules, forum conduct, and badge moderation rules.",
  },
  {
    href: "/legal/refund-policy",
    label: "Refund Policy",
    icon: RefreshCw,
    description:
      "Review Notexia's refund guarantee, 7-day subscription cancellation policy, Razorpay billing details, and token rules.",
  },
  {
    href: "/legal/grievance-redressal",
    label: "Grievance Redressal",
    icon: AlertCircle,
    description:
      "Designated Grievance Redressal Officer details under Indian IT Intermediary Rules 2021 and DPDP Act 2023.",
  },
];
