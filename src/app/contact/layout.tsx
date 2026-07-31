import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Support & Inquiries | Notexia",
  description:
    "Get in touch with the Notexia team. Contact us for technical support, account help, privacy inquiries, billing, or platform feedback.",
  alternates: { canonical: "https://notexia.in/contact" },
  openGraph: {
    title: "Contact Us | Notexia Support",
    description:
      "Get in touch with the Notexia team for technical support, privacy inquiries, or billing assistance.",
    url: "https://notexia.in/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
