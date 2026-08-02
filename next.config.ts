import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=*, microphone=*, geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com https://*.razorpay.in https://accounts.google.com https://pagead2.googlesyndication.com https://adservice.google.com https://www.googletagservices.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://*.googlesyndication.com https://*.googleadservices.com https://*.doubleclick.net https://*.google.com https://*.googleservices.com https://js.pusher.com https://static.cloudflareinsights.com https://*.zegocloud.com https://*.zego.im https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.razorpay.com https://*.razorpay.com https://*.razorpay.in https://lumberjack-cx.razorpay.com https://api.anthropic.com https://accounts.google.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.googleadservices.com https://adservice.google.com https://*.pusher.com wss://*.pusher.com https://cloudflareinsights.com https://*.zegocloud.com https://*.zego.im wss: https://www.facebook.com https://connect.facebook.net",
      "frame-src 'self' https://checkout.razorpay.com https://*.razorpay.com https://*.razorpay.in https://api.razorpay.com https://www.facebook.com https://*.facebook.com https://accounts.google.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://*.googlesyndication.com https://*.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://*.google.com https://*.googleadservices.com",
      "object-src 'self'",
      "media-src 'self' data: blob: https: mediastream:",
      "base-uri 'self'",
      "form-action 'self' https://www.facebook.com https://*.facebook.com https://api.razorpay.com https://*.razorpay.com https://*.razorpay.in",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ],
      },
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      // Google OAuth avatars
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "lh4.googleusercontent.com" },
      // Cloudinary
      { protocol: "https", hostname: "res.cloudinary.com" },
      // UploadThing / UTfs
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "uploadthing.com" },
      // GitHub avatars (for dev)
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      // Generic HTTPS images (for user-uploaded content via URL)
      { protocol: "https", hostname: "**" },
    ],
  },

  // Node.js-only CJS/ESM packages — must not be bundled by Webpack/Turbopack
  serverExternalPackages: ["jsonwebtoken", "youtubei.js"],

  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  // Ensure the uploads directory is included when using standalone output
  outputFileTracingIncludes: {
    "/**": ["./public/uploads/**"],
  },
};

export default nextConfig;