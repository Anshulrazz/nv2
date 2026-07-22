import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono, Kalam } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://notexia.in"),
  title: {
    default: "Notexia — Smart Notes, AI Chat & Study Community",
    template: "%s | Notexia",
  },
  description:
    "Notexia is a premium study platform for students and professionals. Organize notes, publish blogs, discuss doubts, explore forums, and collaborate with a learning community — all in one beautiful workspace.",
  keywords: [
    "notexia",
    "online notes app",
    "ai study assistant",
    "note taking app",
    "student platform",
    "study community",
    "knowledge management",
    "blog platform",
    "forum for students",
    "collaborative learning",
    "rich text editor",
    "pdf notes",
    "research tool",
    "doubts forum",
    "leaderboard students",
  ],
  authors: [{ name: "Notexia Team", url: "https://notexia.in" }],
  creator: "Notexia",
  publisher: "Notexia",
  applicationName: "Notexia",
  category: "Education",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://notexia.in",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://notexia.in",
    siteName: "Notexia",
    title: "Notexia — Smart Notes, AI Chat & Study Community",
    description:
      "Organize your notes, publish blogs, ask doubts, join forums, and grow with a smart student community on Notexia.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Notexia — Smart Notes, AI Chat & Study Community",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Notexia — Smart Notes, AI Chat & Study Community",
    description:
      "Organize your notes, publish blogs, ask doubts, join forums, and grow with a smart student community on Notexia.",
    images: ["/opengraph-image"],
    creator: "@notexia",
  },
  verification: {
    google: "",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} ${jetbrainsMono.variable} ${kalam.variable} antialiased bg-background text-foreground`}
        style={{ fontFamily: "var(--font-jakarta)" }}
      >
        <Providers>{children}</Providers>
        <Toaster
          theme="dark"
          position="top-center"
          richColors
          visibleToasts={5}
        />
      </body>
    </html>
  );
}
