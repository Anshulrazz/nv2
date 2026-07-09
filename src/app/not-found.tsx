import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found | Notexia",
  description: "The page you are looking for could not be found.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <html lang="en" className="dark">
      <body
        style={{
          margin: 0,
          background: "#0a0c12",
          color: "#f1f5f9",
          fontFamily: "system-ui, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            maxWidth: "480px",
          }}
        >
          {/* Glowing 404 */}
          <div
            style={{
              fontSize: "9rem",
              fontWeight: 900,
              background: "linear-gradient(135deg, #06b6d4, #7c3aed)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1,
              marginBottom: "1.5rem",
              letterSpacing: "-4px",
            }}
          >
            404
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#e2e8f0",
              marginBottom: "0.75rem",
            }}
          >
            Page Not Found
          </h1>
          <p
            style={{
              color: "#64748b",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              marginBottom: "2rem",
            }}
          >
            The page you&#39;re looking for doesn&#39;t exist or has been moved.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <Link
              href="/"
              style={{
                padding: "10px 24px",
                background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                color: "white",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Go Home
            </Link>
            <Link
              href="/dashboard"
              style={{
                padding: "10px 24px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8",
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
