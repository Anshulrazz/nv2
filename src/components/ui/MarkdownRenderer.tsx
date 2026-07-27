"use client";

import React, { useState, useCallback, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import katex from "katex";
import "katex/dist/katex.min.css";
import { Check, Copy, ExternalLink } from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   Scoped CSS injected once per page — no Tailwind cascade fights
   ───────────────────────────────────────────────────────────── */
const PROSE_CSS = `
.md-body { font-family: ui-sans-serif, system-ui, sans-serif; color: #d4d4d8; line-height: 1.85; }

/* Headings */
.md-body h1 { font-size: 1.875rem; font-weight: 900; color: #fff; margin: 2.5rem 0 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); letter-spacing: -0.02em; line-height: 1.2; }
.md-body h2 { font-size: 1.5rem;   font-weight: 700; color: #fff; margin: 2rem 0 1rem; letter-spacing: -0.01em; }
.md-body h3 { font-size: 1.25rem;  font-weight: 700; color: #67e8f9; margin: 1.75rem 0 0.75rem; }
.md-body h4 { font-size: 1.125rem; font-weight: 700; color: #e4e4e7; margin: 1.5rem 0 0.5rem; }

/* Paragraph */
.md-body p  { font-size: 0.9375rem; color: #a1a1aa; line-height: 1.85; margin: 1rem 0; }

/* Bold / Italic */
.md-body strong { font-weight: 800; color: #fff; }
.md-body em     { font-style: italic; color: #d4d4d8; }

/* Lists */
.md-body ul  { list-style: disc;    padding-left: 1.5rem; margin: 1.25rem 0; display: flex; flex-direction: column; gap: 0.5rem; }
.md-body ol  { list-style: decimal; padding-left: 1.5rem; margin: 1.25rem 0; display: flex; flex-direction: column; gap: 0.5rem; }
.md-body li  { font-size: 0.9375rem; color: #a1a1aa; line-height: 1.75; }
.md-body li > p { margin: 0; }

/* Links */
.md-body a { color: #22d3ee; text-decoration: underline; text-underline-offset: 3px; font-weight: 600; transition: color 0.15s; }
.md-body a:hover { color: #67e8f9; }

/* Blockquote */
.md-body blockquote { border-left: 4px solid #22d3ee; background: rgba(34,211,238,0.05); padding: 0.75rem 1.25rem; margin: 1.5rem 0; border-radius: 0 0.75rem 0.75rem 0; color: #a1a1aa; }
.md-body blockquote p { margin: 0; color: #a1a1aa; }

/* Horizontal rule */
.md-body hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 2rem 0; }

/* Inline code — cyan pill */
.md-body code {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.8125rem;
  color: #67e8f9;
  background: rgba(39,39,42,0.8);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 0.25rem;
  padding: 0.125rem 0.375rem;
  line-height: 1;
}

/* Block code — ALWAYS reset when inside pre */
.md-body pre code {
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace !important;
  font-size: 0.8125rem !important;
  color: #6ee7b7 !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  line-height: 1.75 !important;
  white-space: pre !important;
  display: block !important;
  box-shadow: none !important;
}

/* Tables */
.md-body table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.875rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 0.75rem; overflow: hidden; }
.md-body thead { background: rgba(24,24,27,0.9); }
.md-body th { padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-family: monospace; font-weight: 700; color: #e4e4e7; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.1); }
.md-body td { padding: 0.75rem 1rem; color: #a1a1aa; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: top; }
.md-body tbody tr:hover td { background: rgba(255,255,255,0.02); }
.md-body tbody tr:last-child td { border-bottom: none; }

/* Images */
.md-body img { max-height: 660px; width: 100%; object-fit: contain; border-radius: 0.75rem; border: 1px solid rgba(255,255,255,0.05); margin: 1.5rem auto; display: block; }

/* Figures */
.md-body figure { margin: 2rem 0; border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; overflow: hidden; background: rgba(9,9,11,0.8); box-shadow: 0 10px 40px rgba(0,0,0,0.4); }
.md-body figure img { margin: 0; border: none; border-radius: 0; max-height: 600px; object-fit: cover; }
.md-body figcaption { padding: 0.625rem 1.25rem; font-size: 0.75rem; font-family: monospace; color: #22d3ee; border-top: 1px solid rgba(255,255,255,0.1); background: rgba(24,24,27,0.6); }

/* KaTeX Math Styling */
.md-body .katex { font-size: 1.05em; color: #f4f4f5; }
.md-body .katex-display { margin: 1.25rem 0; padding: 0.875rem 1.25rem; background: rgba(13, 13, 18, 0.9); border: 1px solid rgba(34, 211, 238, 0.25); border-radius: 0.75rem; overflow-x: auto; overflow-y: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.4); text-align: center; }
.md-body .katex-display .katex { font-size: 1.15em; color: #67e8f9; }
.md-body code .katex { color: #a5f3fc; }
`;

const LATEX_COMMAND_RE = /\\(tau|theta|alpha|beta|gamma|delta|epsilon|zeta|eta|kappa|lambda|mu|nu|xi|pi|rho|sigma|phi|chi|psi|omega|Delta|Gamma|Lambda|Sigma|Phi|Psi|Omega|hbar|text|frac|sqrt|int|sum|prod|lim|hat|vec|bar|tilde|dot|partial|nabla|infty|approx|le|ge|neq|in|notin|subset|cup|cap|times|cdot|pm|mp|div|log|exp|sin|cos|tan|forall|exists|rightarrow|Rightarrow)\b/;

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = PROSE_CSS;
  document.head.appendChild(style);
  cssInjected = true;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/* ─── Code block: dark container + copy button ───────────────── */
function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const lang = /language-(\w+)/.exec(className || "")?.[1] ?? "text";
  const raw = String(children).replace(/\n$/, "");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* silent */ }
  }, [raw]);

  return (
    <div style={{ margin: "1.5rem 0", borderRadius: "1rem", overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", background: "#0d0d12", boxShadow: "0 4px 32px rgba(0,0,0,0.5)" }}>
      {/* Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
        <span style={{ fontFamily: "monospace", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#71717a" }}>{lang}</span>
        <button
          type="button"
          onClick={handleCopy}
          style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.625rem", fontSize: "0.75rem", color: "#71717a", borderRadius: "0.375rem", background: "transparent", border: "none", cursor: "pointer", transition: "background 0.15s, color 0.15s" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#71717a"; }}
        >
          {copied ? <><Check size={12} style={{ color: "#34d399" }} /><span style={{ color: "#34d399" }}>Copied</span></> : <><Copy size={12} />Copy</>}
        </button>
      </div>
      {/* Code area — all styles inline so nothing can override */}
      <pre style={{ margin: 0, padding: "1.25rem", overflowX: "auto", background: "transparent", border: "none", borderRadius: 0 }}>
        <code style={{ fontFamily: "'JetBrains Mono','Fira Code','Cascadia Code',monospace", fontSize: "0.8125rem", color: "#6ee7b7", background: "transparent", border: "none", borderRadius: 0, padding: 0, margin: 0, lineHeight: 1.75, whiteSpace: "pre", display: "block", boxShadow: "none" }}>
          {children}
        </code>
      </pre>
    </div>
  );
}

/* ─── Smart link with external icon ─────────────────────────── */
function SmartLink({ href = "", children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = /^https?:\/\//.test(href);
  return (
    <a href={href} {...props} {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 inline-flex items-center gap-1 transition-colors font-semibold">
      {children}
      {isExternal && <ExternalLink size={12} className="opacity-60" />}
    </a>
  );
}

/* ─── Main renderer ──────────────────────────────────────────── */
function MarkdownRendererImpl({ content, className = "" }: MarkdownRendererProps) {
  // Inject scoped CSS on first render (client only)
  if (typeof window !== "undefined") injectCSS();

  if (!content) return null;

  // Pre-process content: unescape &lt; and &gt;
  let sanitizedContent = (content || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

  // Fix broken/stray $ inside TeX expressions (e.g. \Delta x \cdot $\Delta$ p \ge \frac{\hbar}{2})
  sanitizedContent = sanitizedContent.replace(/(\\[a-zA-Z]+[^$\n`]*?)\$([^\$\n`]+?)\$([^$\n`]*?\\[a-zA-Z]+[^$\n`]*)/g, (match, before, inside, after) => {
    return `${before}${inside}${after}`;
  });

  // Auto-wrap raw TeX math expressions in $...$
  sanitizedContent = sanitizedContent.replace(/(?<![\$`\\])(\\(?:tau|theta|alpha|beta|gamma|delta|epsilon|zeta|eta|kappa|lambda|mu|nu|xi|pi|rho|sigma|phi|chi|psi|omega|Delta|Gamma|Lambda|Sigma|Phi|Psi|Omega|hbar|text|frac|sqrt|int|sum|prod|lim|hat|vec|bar|tilde|dot|partial|nabla|infty|approx|le|ge|neq|in|notin|subset|cup|cap|times|cdot|pm|mp|div|log|exp|sin|cos|tan|forall|exists|rightarrow|Rightarrow)\b(?:[^$\n`]*?))(?=[\s,.;:!?)]|$)/g, (match) => {
    const cleanMath = match.replace(/\$/g, "").trim();
    return `$${cleanMath}$`;
  });

  return (
    <div className={`md-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeSlug, rehypeKatex]}
        components={{
          code({ className: cls, children, ...props }) {
            const childrenStr = (Array.isArray(children) ? children.join("") : String(children ?? ""))
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">");
            const isBlock = /language-\w+/.test(cls || "");
            if (isBlock) return <CodeBlock className={cls}>{children}</CodeBlock>;

            // Check if inline code string contains LaTeX formula notation
            if (LATEX_COMMAND_RE.test(childrenStr)) {
              try {
                const cleanCodeMath = childrenStr.replace(/\$/g, "").trim();
                const isDisplayMode = cleanCodeMath.includes("\\int") || cleanCodeMath.includes("\\sum") || cleanCodeMath.includes("\\frac") || cleanCodeMath.length > 35;
                const html = katex.renderToString(cleanCodeMath, {
                  displayMode: isDisplayMode,
                  throwOnError: false,
                });
                return (
                  <span
                    className={isDisplayMode ? "katex-display-wrapper block my-4 text-center" : "inline-block px-1"}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              } catch {
                // fallback to regular code
              }
            }

            // regular inline code
            return (
              <code style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: "0.8125rem", color: "#67e8f9", background: "rgba(39,39,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.25rem", padding: "0.125rem 0.375rem", lineHeight: 1 }} {...props}>
                {children}
              </code>
            );
          },
          pre({ children }) {
            // Unwrap — CodeBlock handles its own <pre>
            return <>{children}</>;
          },
          img({ ...props }) {
            // eslint-disable-next-line @next/next/no-img-element
            return <img {...props} loading="lazy" alt={props.alt ?? ""} />;
          },
          table({ children, ...props }) {
            return <div style={{ overflowX: "auto", margin: "1.5rem 0" }}><table {...props}>{children}</table></div>;
          },
          a: SmartLink,
          input(props) {
            if (props.type !== "checkbox") return <input {...props} />;
            return <input {...props} disabled style={{ marginRight: "0.5rem", accentColor: "#22d3ee" }} />;
          },
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}

export const MarkdownRenderer = memo(MarkdownRendererImpl);