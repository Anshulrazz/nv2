import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Notexia — Smart Notes, AI Chat & Study Community";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0c12 0%, #0d1117 40%, #0a1628 100%)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow orbs */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "-100px",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            right: "-100px",
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(6,182,212,0.1)",
            border: "1px solid rgba(6,182,212,0.3)",
            borderRadius: "100px",
            padding: "8px 20px",
            marginBottom: "28px",
            color: "#06b6d4",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.1em",
          }}
        >
          ✦ STUDY PLATFORM
        </div>

        {/* Logo + Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              background: "linear-gradient(135deg, #06b6d4, #7c3aed)",
              borderRadius: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              color: "white",
              fontWeight: 900,
              boxShadow: "0 0 40px rgba(6,182,212,0.4)",
            }}
          >
            N
          </div>
          <span
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: "#f1f5f9",
              letterSpacing: "-2px",
            }}
          >
            Notexia
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: "26px",
            color: "#94a3b8",
            margin: "0 0 40px 0",
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: 1.4,
          }}
        >
          Smart Notes · AI Chat · Study Community
        </p>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "12px" }}>
          {["📝 Rich Notes", "🤖 AI Chat", "📚 Blogs", "💬 Forums", "🏆 Leaderboard"].map((f) => (
            <div
              key={f}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#cbd5e1",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {/* URL bottom */}
        <div
          style={{
            position: "absolute",
            bottom: "28px",
            color: "rgba(148,163,184,0.5)",
            fontSize: "14px",
            letterSpacing: "0.05em",
          }}
        >
          notexia.in
        </div>
      </div>
    ),
    { ...size }
  );
}
