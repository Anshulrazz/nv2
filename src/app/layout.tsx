/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";
import MetaPixelRouteTracker from "@/components/MetaPixelRouteTracker";
import { RouteLoadingProgress } from "@/components/common/RouteLoadingProgress";
import { FB_PIXEL_ID } from "@/lib/metaPixel";
import "./globals.css";

import { buildOrganizationSchema, buildWebSiteSchema } from "@/lib/seo/jsonld";

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
  other: {
    "google-adsense-account": "ca-pub-1957290146491296",
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
  const adClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || "ca-pub-1957290146491296";

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="google-adsense-account" content={adClientId} />
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClientId}`}
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildOrganizationSchema()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebSiteSchema()) }}
        />
      </head>
      <body className="antialiased bg-background text-foreground">
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
        <Script
          id="razorpay-checkout"
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        <Suspense fallback={null}>
          <MetaPixelRouteTracker />
          <RouteLoadingProgress />
        </Suspense>
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