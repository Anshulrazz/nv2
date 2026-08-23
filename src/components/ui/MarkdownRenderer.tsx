"use client";

import React, { useState, useCallback, useEffect, useRef, memo } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeSlug from "rehype-slug";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import katex from "katex";
import {
  Check,
  Copy,
  ExternalLink,
  Info,
  Lightbulb,
  AlertTriangle,
  OctagonAlert,
  Link as LinkIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

/* ================================================================
   GitHub-Flavored Markdown Renderer
   ─────────────────────────────────
   Supports: GFM tables, task lists, strikethrough, autolinks,
   footnotes, syntax-highlighted code blocks, KaTeX math ($, $$),
   GitHub alerts (NOTE/TIP/IMPORTANT/WARNING/CAUTION), mermaid
   diagrams, inline HTML, heading anchors, images, and blockquotes.
   ================================================================ */

/* ─── Scoped CSS ─────────────────────────────────────────────── */
const GH_CSS = `
/* ── Base ── */
.gh-md {
  font-family: var(--font-ui), system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  word-wrap: break-word;
  color: #FAFAF8;
}

/* ── Headings ── */
.gh-md h1, .gh-md h2, .gh-md h3, .gh-md h4, .gh-md h5, .gh-md h6 {
  font-family: var(--font-display), "Playfair Display", Georgia, serif;
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 700;
  line-height: 1.3;
  color: #FAFAF8;
}
.gh-md h1 { font-size: 1.85em; padding-bottom: 0.3em; border-bottom: 1px solid #2E2118; }
.gh-md h2 { font-size: 1.45em; padding-bottom: 0.3em; border-bottom: 1px solid #2E2118; }
.gh-md h3 { font-size: 1.2em; color: #F5B429; }
.gh-md h4 { font-size: 1em; }
.gh-md h5 { font-size: 0.875em; }
.gh-md h6 { font-size: 0.85em; color: #8A8078; }

.gh-md h1:first-child, .gh-md h2:first-child, .gh-md h3:first-child {
  margin-top: 0;
}

/* Heading anchor link */
.gh-md .gh-anchor {
  float: left;
  padding-right: 4px;
  margin-left: -20px;
  line-height: 1;
  opacity: 0;
  transition: opacity 0.15s;
}
.gh-md h1:hover .gh-anchor,
.gh-md h2:hover .gh-anchor,
.gh-md h3:hover .gh-anchor,
.gh-md h4:hover .gh-anchor,
.gh-md h5:hover .gh-anchor,
.gh-md h6:hover .gh-anchor {
  opacity: 1;
}
.gh-md .gh-anchor svg { vertical-align: middle; fill: #F5B429; }

/* ── Paragraph ── */
.gh-md p { margin-top: 0; margin-bottom: 16px; color: #E8E6E3; }

/* ── Bold / Italic / Strikethrough ── */
.gh-md strong { font-weight: 700; color: #FAFAF8; }
.gh-md em { font-style: italic; color: #FCD34D; }
.gh-md del { text-decoration: line-through; color: #8A8078; }

/* ── Lists ── */
.gh-md ul, .gh-md ol { padding-left: 2em; margin-top: 0; margin-bottom: 16px; }
.gh-md ul { list-style-type: disc; }
.gh-md ol { list-style-type: decimal; }
.gh-md li { margin-top: 0.25em; color: #E8E6E3; }
.gh-md li > p { margin-top: 16px; }
.gh-md li + li { margin-top: 0.25em; }
.gh-md ul ul, .gh-md ol ol, .gh-md ul ol, .gh-md ol ul { margin-top: 0; margin-bottom: 0; }

/* ── Task list ── */
.gh-md .task-list-item { list-style-type: none; position: relative; }
.gh-md .task-list-item input[type="checkbox"] {
  margin: 0 0.35em 0.25em -1.4em;
  vertical-align: middle;
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid #2E2118;
  border-radius: 4px;
  background: #150F0B;
  cursor: default;
  position: relative;
}
.gh-md .task-list-item input[type="checkbox"]:checked {
  background: #F5B429;
  border-color: #F5B429;
}
.gh-md .task-list-item input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 4.5px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid #150F0B;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* ── Links ── */
.gh-md a { color: #F5B429; text-decoration: underline; text-underline-offset: 3px; }
.gh-md a:hover { color: #FCD34D; }

/* ── Blockquote ── */
.gh-md blockquote {
  margin: 0 0 16px 0;
  padding: 0.5em 1em;
  color: #8A8078;
  border-left: 0.25em solid #F5B429;
  background: rgba(21, 15, 11, 0.6);
  border-radius: 0 8px 8px 0;
}
.gh-md blockquote > :first-child { margin-top: 0; }
.gh-md blockquote > :last-child { margin-bottom: 0; }

/* ── Horizontal rule ── */
.gh-md hr {
  height: 1px;
  padding: 0;
  margin: 24px 0;
  background-color: #2E2118;
  border: 0;
}

/* ── Inline code ── */
.gh-md code {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 85%;
  padding: 0.2em 0.4em;
  margin: 0;
  background-color: #241811;
  border: 1px solid #2E2118;
  border-radius: 6px;
  color: #FCD34D;
}

/* ── Code block ── */
.gh-md pre {
  margin-top: 0;
  margin-bottom: 16px;
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #0A0806;
  border-radius: 12px;
  border: 1px solid #2E2118;
  box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.03), 0 4px 20px rgba(0, 0, 0, 0.5);
}
.gh-md pre code {
  padding: 0;
  margin: 0;
  font-size: 100%;
  word-break: normal;
  white-space: pre;
  background: transparent;
  border: 0;
  border-radius: 0;
  color: inherit;
}

/* ── Tables ── */
.gh-md table {
  border-spacing: 0;
  border-collapse: collapse;
  display: block;
  width: max-content;
  max-width: 100%;
  overflow: auto;
  margin-top: 0;
  margin-bottom: 16px;
  border-radius: 8px;
  border: 1px solid #2E2118;
}
.gh-md table th, .gh-md table td {
  padding: 8px 14px;
  border: 1px solid #2E2118;
}
.gh-md table th {
  font-weight: 700;
  background-color: #150F0B;
  color: #FAFAF8;
}
.gh-md table tr { background-color: #0A0806; border-top: 1px solid #2E2118; }
.gh-md table tr:nth-child(2n) { background-color: #150F0B; }

/* ── Images ── */
.gh-md img {
  max-width: 100%;
  box-sizing: content-box;
  background-color: #150F0B;
  border-radius: 8px;
}

/* ── GitHub Alerts ── */
.gh-alert {
  padding: 10px 16px;
  margin-bottom: 16px;
  border-left: 0.25em solid;
  border-radius: 8px;
  background-color: rgba(21, 15, 11, 0.85);
  box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.5);
}
.gh-alert > :first-child { margin-top: 0; }
.gh-alert > :last-child { margin-bottom: 0; }
.gh-alert p { margin-top: 6px; margin-bottom: 6px; color: #FAFAF8; }

.gh-alert-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 13px;
  margin-bottom: 4px;
  font-family: var(--font-display), "Playfair Display", Georgia, serif;
}

.gh-alert--note    { border-left-color: #F5B429; }
.gh-alert--note .gh-alert-title { color: #F5B429; }

.gh-alert--tip     { border-left-color: #10B981; }
.gh-alert--tip .gh-alert-title { color: #10B981; }

.gh-alert--important { border-left-color: #F5941D; }
.gh-alert--important .gh-alert-title { color: #F5941D; }

.gh-alert--warning { border-left-color: #FCD34D; }
.gh-alert--warning .gh-alert-title { color: #FCD34D; }

.gh-alert--caution { border-left-color: #EF4444; }
.gh-alert--caution .gh-alert-title { color: #EF4444; }

/* ── Mermaid ── */
.gh-mermaid-wrapper {
  margin: 16px 0;
  text-align: center;
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
}
.gh-mermaid-wrapper svg { max-width: 100%; height: auto; }

/* ── Details / Summary ── */
.gh-md details {
  margin-bottom: 16px;
}
.gh-md details summary {
  cursor: pointer;
  font-weight: 600;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 4px;
}
.gh-md details summary::-webkit-details-marker { display: none; }

/* ── Footnotes ── */
.gh-md .footnotes {
  font-size: 0.875em;
  color: #8b949e;
  border-top: 1px solid #30363d;
  margin-top: 24px;
  padding-top: 16px;
}
.gh-md .footnotes ol { padding-left: 1.5em; }
.gh-md sup a { color: #58a6ff; text-decoration: none; font-size: 0.85em; }
.gh-md sup a:hover { text-decoration: underline; }

/* ── KaTeX / Math Formulas ── */
.gh-md .katex { font-size: 1.06em; line-height: 1.2; }
.gh-md .katex-display {
  margin: 20px 0;
  padding: 14px 18px;
  background: rgba(22, 27, 34, 0.65);
  border: 1px solid #30363d;
  border-radius: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  text-align: center;
  -webkit-overflow-scrolling: touch;
}
.gh-md .katex-display .katex { font-size: 1.18em; }

/* ── Keyboard tag ── */
.gh-md kbd {
  display: inline-block;
  padding: 3px 5px;
  font: 11px ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  line-height: 10px;
  color: #e6edf3;
  vertical-align: middle;
  background-color: #161b22;
  border: solid 1px rgba(110,118,129,0.4);
  border-bottom-color: rgba(110,118,129,0.4);
  border-radius: 6px;
  box-shadow: inset 0 -1px 0 rgba(110,118,129,0.4);
}

/* ── Abbreviation ── */
.gh-md abbr[title] {
  border-bottom: 1px dotted #8b949e;
  cursor: help;
  text-decoration: none;
}

/* ── Definition list (via raw HTML) ── */
.gh-md dl { padding: 0; margin-bottom: 16px; }
.gh-md dt { padding: 0; margin-top: 16px; font-size: 1em; font-style: italic; font-weight: 600; }
.gh-md dd { padding: 0 16px; margin-bottom: 16px; }

/* ── Copy button in code blocks ── */
.gh-code-wrapper {
  position: relative;
  margin-bottom: 16px;
}
.gh-code-wrapper .gh-copy-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: #21262d;
  border: 1px solid #30363d;
  border-radius: 6px;
  color: #8b949e;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
}
.gh-code-wrapper:hover .gh-copy-btn { opacity: 1; }
.gh-code-wrapper .gh-copy-btn:hover { color: #e6edf3; background: #30363d; }
.gh-code-wrapper .gh-copy-btn.copied { color: #3fb950; }

/* ── Language label ── */
.gh-code-lang {
  position: absolute;
  top: 0;
  right: 0;
  padding: 2px 8px;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #8b949e;
  background: #21262d;
  border-bottom-left-radius: 6px;
  border-top-right-radius: 5px;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
}
.gh-code-wrapper:hover .gh-code-lang { opacity: 1; }
.gh-code-wrapper:hover .gh-copy-btn ~ .gh-code-lang { top: 0; right: 38px; border-radius: 0 0 6px 6px; border-top-right-radius: 0; }
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.id = "gh-md-styles";
  style.textContent = GH_CSS;
  document.head.appendChild(style);
  cssInjected = true;
}

/* ─── Alert type config ──────────────────────────────────────── */
const ALERT_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  note:      { icon: <Info size={16} />,           label: "Note" },
  tip:       { icon: <Lightbulb size={16} />,      label: "Tip" },
  important: { icon: <AlertTriangle size={16} />,  label: "Important" },
  warning:   { icon: <AlertTriangle size={16} />,  label: "Warning" },
  caution:   { icon: <OctagonAlert size={16} />,   label: "Caution" },
};

/* ─── GitHub Alert parser ────────────────────────────────────── */
function parseAlerts(content: string): string {
  // Convert > [!NOTE]\n> content  →  <div class="gh-alert ..."> HTML
  const lines = content.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Check if this is the start of a blockquote with an alert marker
    const bqMatch = line.match(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*$/i);
    if (bqMatch) {
      const alertType = bqMatch[1].toLowerCase();
      const alertLines: string[] = [];
      i++; // skip the alert marker line

      // Collect all subsequent blockquote lines
      while (i < lines.length && /^>/.test(lines[i])) {
        alertLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }

      const alertContent = alertLines.join("\n").trim();
      // Use a special HTML marker that rehype-raw will parse
      result.push(`<div class="gh-alert gh-alert--${alertType}">`);
      result.push(`<p class="gh-alert-title">${alertType.charAt(0).toUpperCase() + alertType.slice(1)}</p>`);
      result.push("");
      result.push(alertContent);
      result.push("</div>");
      result.push("");
      continue;
    }
    result.push(line);
    i++;
  }
  return result.join("\n");
}

/* ─── Code block with copy + language label ──────────────────── */
function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const lang = /language-(\w+)/.exec(className || "")?.[1] ?? "";
  const raw = String(children).replace(/\n$/, "");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* silent */
    }
  }, [raw]);

  return (
    <div className="gh-code-wrapper">
      <pre
        style={{
          marginBottom: 0,
          borderRadius: "6px",
        }}
      >
        <code className={className}>{children}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className={`gh-copy-btn${copied ? " copied" : ""}`}
        aria-label="Copy code"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      {lang && <span className="gh-code-lang">{lang}</span>}
    </div>
  );
}

/* ─── Mermaid diagram renderer ───────────────────────────────── */
function MermaidBlock({ code }: { code: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          darkMode: true,
          themeVariables: {
            primaryColor: "#21262d",
            primaryTextColor: "#e6edf3",
            primaryBorderColor: "#30363d",
            lineColor: "#58a6ff",
            secondaryColor: "#161b22",
            tertiaryColor: "#0d1117",
          },
        });
        const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code.trim());
        if (!cancelled) setSvg(renderedSvg);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to render diagram"
          );
      }
    }
    render();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <div className="gh-code-wrapper">
        <pre style={{ borderColor: "#f85149" }}>
          <code>{`Mermaid Error: ${error}\n\n${code}`}</code>
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="gh-mermaid-wrapper">
        <div
          style={{
            padding: "24px",
            color: "#8b949e",
            fontSize: "14px",
          }}
        >
          Rendering diagram…
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="gh-mermaid-wrapper"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

/* ─── Details/Summary ────────────────────────────────────────── */
function DetailsBlock({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <details open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === "summary") {
          const summaryProps = child.props as { children?: React.ReactNode };
          return (
            <summary>
              {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {summaryProps.children}
            </summary>
          );
        }
        return child;
      })}
    </details>
  );
}

/* ─── Heading with anchor link ───────────────────────────────── */
function HeadingWithAnchor({
  level,
  id,
  children,
}: {
  level: number;
  id?: string;
  children: React.ReactNode;
}) {
  const headingContent = (
    <>
      {id && (
        <a href={`#${id}`} className="gh-anchor" aria-label="Link to this section">
          <LinkIcon size={16} />
        </a>
      )}
      {children}
    </>
  );

  switch (level) {
    case 1: return <h1 id={id}>{headingContent}</h1>;
    case 2: return <h2 id={id}>{headingContent}</h2>;
    case 3: return <h3 id={id}>{headingContent}</h3>;
    case 4: return <h4 id={id}>{headingContent}</h4>;
    case 5: return <h5 id={id}>{headingContent}</h5>;
    case 6: return <h6 id={id}>{headingContent}</h6>;
    default: return <h3 id={id}>{headingContent}</h3>;
  }
}

/* ─── Smart link with external icon ──────────────────────────── */
function SmartLink({
  href = "",
  children,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = /^https?:\/\//.test(href);
  return (
    <a
      href={href}
      {...props}
      {...(isExternal
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
      {isExternal && (
        <ExternalLink
          size={12}
          style={{
            display: "inline-block",
            marginLeft: 3,
            opacity: 0.5,
            verticalAlign: "text-top",
          }}
        />
      )}
    </a>
  );
}

/* ─── Alert wrapper component ────────────────────────────────── */
function AlertWrapper({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  // Extract alert type from class
  const typeMatch = className?.match(/gh-alert--(\w+)/);
  const alertType = typeMatch?.[1] || "note";
  const config = ALERT_CONFIG[alertType] || ALERT_CONFIG.note;

  return (
    <div className={className}>
      <p className="gh-alert-title">
        {config.icon}
        {config.label}
      </p>
      {React.Children.map(children, (child) => {
        // Skip the original title <p> we injected in parseAlerts
        if (React.isValidElement(child)) {
          const childProps = child.props as Record<string, unknown>;
          if (childProps?.className === "gh-alert-title") {
            return null;
          }
        }
        return child;
      })}
    </div>
  );
}

/* ─── LaTeX command detection ────────────────────────────────── */
const LATEX_COMMAND_RE =
  /\\(tau|theta|alpha|beta|gamma|delta|epsilon|zeta|eta|kappa|lambda|mu|nu|xi|pi|rho|sigma|phi|chi|psi|omega|Delta|Gamma|Lambda|Sigma|Phi|Psi|Omega|hbar|text|frac|sqrt|int|sum|prod|lim|hat|vec|bar|tilde|dot|partial|nabla|infty|approx|le|ge|neq|in|notin|subset|cup|cap|times|cdot|pm|mp|div|log|exp|sin|cos|tan|forall|exists|rightarrow|Rightarrow)\b/;

/* ─── Pre-processor ──────────────────────────────────────────── */

/** LaTeX environments that must not be split by stray $ */
const LATEX_ENVIRONMENTS = [
  "pmatrix", "bmatrix", "vmatrix", "Bmatrix", "Vmatrix",
  "matrix", "cases", "align", "aligned", "gather", "gathered",
  "equation", "array", "split", "multline",
];
const ENV_NAMES = LATEX_ENVIRONMENTS.join("|");

/** Regex for LaTeX commands that indicate a math expression */
const LATEX_INDICATOR_RE = /\\(?:frac|sqrt|sum|prod|int|lim|begin|end|otimes|oplus|circ|cdot|times|pm|mp|div|nabla|partial|infty|approx|le|ge|neq|in|notin|subset|cup|cap|forall|exists|rightarrow|Rightarrow|leftarrow|Leftarrow|hat|vec|bar|tilde|dot|tau|theta|alpha|beta|gamma|delta|epsilon|zeta|eta|kappa|lambda|mu|nu|xi|pi|rho|sigma|phi|chi|psi|omega|Delta|Gamma|Lambda|Sigma|Phi|Psi|Omega|hbar|text|log|exp|sin|cos|tan|det|max|min|sup|inf|binom|overset|underset|mathbf|mathrm|mathbb|mathcal|boldsymbol)\b/;

/**
 * Fix broken LaTeX in AI-generated markdown.
 *
 * Common problems:
 *  1. Stray `$` splitting a single expression:
 *     `$\frac{1}{\sqrt{2}}\begin{pmatrix}$ 1 & 0 \\ ... \end{pmatrix}`
 *  2. `\begin{env}...\end{env}` without any `$`/`$$` wrapper
 *  3. Bare LaTeX commands (`\otimes`, `\alpha`) outside math mode
 *  4. Mixed `$` and bare LaTeX on the same line
 */
function fixBrokenLatex(text: string): string {
  // ── Step 1: Fix environments split by stray $ ──
  // Match: $...\begin{env}$ ... \end{env}  →  $$...\begin{env} ... \end{env}$$
  // Or:   \begin{env} ... $\end{env}$      →  $$\begin{env} ... \end{env}$$
  const envRe = new RegExp(
    `\\$?([^$]*?\\\\begin\\{(?:${ENV_NAMES})\\})\\$([\\s\\S]*?)\\\\end\\{(?:${ENV_NAMES})\\}\\$?`,
    "g"
  );
  text = text.replace(envRe, (_m, before, inner) => {
    const cleanBefore = before.replace(/^\$/, "").replace(/\$$/, "");
    const cleanInner = inner.replace(/^\$/, "").replace(/\$$/, "");
    // Find the matching \end
    const endMatch = _m.match(/\\end\{(\w+)\}/);
    const envName = endMatch ? endMatch[1] : "pmatrix";
    return `$$${cleanBefore}${cleanInner}\\end{${envName}}$$`;
  });

  // ── Step 2: Wrap bare \begin{env}...\end{env} in $$ ──
  // If there's a \begin{env}...\end{env} not already inside $...$
  for (const env of LATEX_ENVIRONMENTS) {
    const bareEnvRe = new RegExp(
      `(?<!\\$)((?:[^$\\n]*?\\\\[a-zA-Z]+[^$\\n]*?)?\\\\begin\\{${env}\\}[\\s\\S]*?\\\\end\\{${env}\\})(?!\\$)`,
      "g"
    );
    text = text.replace(bareEnvRe, (match) => {
      // Don't double-wrap if already inside $$
      const before2 = text.substring(0, text.indexOf(match));
      const dollarCount = (before2.match(/\$/g) || []).length;
      if (dollarCount % 2 === 1) return match; // already inside $ scope
      // Strip any stray $ inside the expression
      const cleaned = match.replace(/\$/g, "");
      return `$$${cleaned}$$`;
    });
  }

  // ── Step 3: Fix lines with mixed bare LaTeX + stray $ ──
  // e.g., `H \otimes I_2 = $\frac{1}{\sqrt{2}}\begin{pmatrix}$ 1 & 0 ...`
  // Strategy: if a line has bare LaTeX commands outside $ AND $ fragments, 
  // strip all $ and wrap the whole expression
  const lines = text.split("\n");
  const fixedLines = lines.map((line) => {
    // Skip lines already wrapped in $$ or inside HTML/code blocks
    if (line.trim().startsWith("$$") || line.trim().startsWith("```") || line.trim().startsWith("<")) {
      return line;
    }

    // Check if line has LaTeX indicators
    if (!LATEX_INDICATOR_RE.test(line)) return line;

    // Count $ signs
    const dollarMatches = line.match(/\$/g);
    const dollarCount = dollarMatches ? dollarMatches.length : 0;

    if (dollarCount === 0) {
      // Bare LaTeX with no $ at all — check if it looks like a full math line
      // (contains operators, fractions, environments, etc.)
      const hasMathOps = /\\(?:frac|sqrt|begin|sum|prod|int|otimes|oplus|cdot|times)/.test(line);
      const hasEquals = /=/.test(line);
      if (hasMathOps && hasEquals) {
        // Full math line like: H \otimes I_2 = \frac{1}{\sqrt{2}}\begin{pmatrix}...
        return `$$${line.trim()}$$`;
      }
      // Single command on a line or inline — wrap in single $
      if (/^\s*\\[a-zA-Z]/.test(line)) {
        return `$${line.trim()}$`;
      }
      return line;
    }

    // Odd number of $ → broken delimiters
    if (dollarCount % 2 !== 0) {
      // Has bare LaTeX outside the $ regions → strip $ and wrap whole line
      const stripped = line.replace(/\$/g, "");
      if (LATEX_INDICATOR_RE.test(stripped)) {
        return `$$${stripped.trim()}$$`;
      }
      return line;
    }

    // Even $ count but has bare LaTeX outside $ regions
    // Check if there's LaTeX outside the $ pairs
    const outsideDollar = line.replace(/\$[^$]*\$/g, "");
    if (LATEX_INDICATOR_RE.test(outsideDollar)) {
      // Strip all $ and wrap everything
      const stripped = line.replace(/\$/g, "");
      return `$$${stripped.trim()}$$`;
    }

    return line;
  });

  return fixedLines.join("\n");
}

function preprocessContent(raw: string): string {
  let content = (raw || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

  // Parse GitHub alerts before markdown processing
  content = parseAlerts(content);

  // Fix broken LaTeX (stray $, bare environments, split matrices)
  content = fixBrokenLatex(content);

  // Auto-wrap remaining bare LaTeX commands in $...$
  content = content.replace(
    /(?<![\$`\\])(\\(?:tau|theta|alpha|beta|gamma|delta|epsilon|zeta|eta|kappa|lambda|mu|nu|xi|pi|rho|sigma|phi|chi|psi|omega|Delta|Gamma|Lambda|Sigma|Phi|Psi|Omega|hbar|text|frac|sqrt|int|sum|prod|lim|hat|vec|bar|tilde|dot|partial|nabla|infty|approx|le|ge|neq|in|notin|subset|cup|cap|times|cdot|pm|mp|div|log|exp|sin|cos|tan|forall|exists|rightarrow|Rightarrow)\b(?:[^$\n`]*?))(?=[\s,.;:!?)]|$)/g,
    (match) => {
      const clean = match.replace(/\$/g, "").trim();
      return `$${clean}$`;
    }
  );

  return content;
}

/* ═══════════════════════════════════════════════════════════════
   Main Renderer
   ═══════════════════════════════════════════════════════════════ */

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function MarkdownRendererImpl({
  content,
  className = "",
}: MarkdownRendererProps) {
  if (typeof window !== "undefined") injectCSS();
  if (!content) return null;

  const processed = preprocessContent(content);

  return (
    <div className={`gh-md ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[
          rehypeSlug,
          rehypeKatex,
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
          rehypeRaw,
        ]}
        components={{
          /* ── Code ── */
          code({ className: cls, children, ...props }) {
            const isBlock = /language-\w+/.test(cls || "");
            const isMermaid = cls === "language-mermaid";
            const codeStr = String(children).replace(/\n$/, "");

            if (isMermaid) {
              return <MermaidBlock code={codeStr} />;
            }

            if (isBlock) {
              return (
                <CodeBlock className={cls}>{children}</CodeBlock>
              );
            }

            // Inline code — check for LaTeX
            const childrenStr = (
              Array.isArray(children) ? children.join("") : String(children ?? "")
            )
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">");

            if (LATEX_COMMAND_RE.test(childrenStr)) {
              try {
                const cleanMath = childrenStr.replace(/\$/g, "").trim();
                const isDisplay =
                  cleanMath.includes("\\int") ||
                  cleanMath.includes("\\sum") ||
                  cleanMath.includes("\\frac") ||
                  cleanMath.length > 35;
                const html = katex.renderToString(cleanMath, {
                  displayMode: isDisplay,
                  throwOnError: false,
                });
                return (
                  <span
                    className={
                      isDisplay
                        ? "katex-display-wrapper block my-4 text-center"
                        : "inline-block"
                    }
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
              } catch {
                // fall through to regular inline code
              }
            }

            return (
              <code {...props} className={cls}>
                {children}
              </code>
            );
          },

          /* ── Pre — unwrap since CodeBlock handles its own <pre> ── */
          pre({ children }) {
            // Check if child is a mermaid CodeBlock — if so, don't wrap in pre
            const child = React.Children.toArray(children)[0];
            if (
              React.isValidElement(child) &&
              typeof child.props === "object" &&
              child.props !== null &&
              "className" in child.props &&
              child.props.className === "language-mermaid"
            ) {
              return <>{children}</>;
            }
            return <>{children}</>;
          },

          /* ── Headings with anchor links ── */
          h1({ id, children }) {
            return <HeadingWithAnchor level={1} id={id}>{children}</HeadingWithAnchor>;
          },
          h2({ id, children }) {
            return <HeadingWithAnchor level={2} id={id}>{children}</HeadingWithAnchor>;
          },
          h3({ id, children }) {
            return <HeadingWithAnchor level={3} id={id}>{children}</HeadingWithAnchor>;
          },
          h4({ id, children }) {
            return <HeadingWithAnchor level={4} id={id}>{children}</HeadingWithAnchor>;
          },
          h5({ id, children }) {
            return <HeadingWithAnchor level={5} id={id}>{children}</HeadingWithAnchor>;
          },
          h6({ id, children }) {
            return <HeadingWithAnchor level={6} id={id}>{children}</HeadingWithAnchor>;
          },

          /* ── Images ── */
          img({ src, alt }) {
            if (!src) return null;
            const imageSrc =
              typeof src === "string" ? src : URL.createObjectURL(src);
            return (
              <Image
                src={imageSrc}
                alt={alt ?? "Image"}
                width={800}
                height={450}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 800px"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: "6px",
                  margin: "16px 0",
                }}
                loading="lazy"
                unoptimized
              />
            );
          },

          /* ── Table wrapper for horizontal scroll ── */
          table({ children, ...props }) {
            return (
              <div style={{ overflowX: "auto", margin: "0 0 16px 0" }}>
                <table {...props}>{children}</table>
              </div>
            );
          },

          /* ── Links ── */
          a: SmartLink,

          /* ── Task list checkboxes ── */
          input(props) {
            if (props.type !== "checkbox") return <input {...props} />;
            return <input {...props} disabled className="task-checkbox" />;
          },

          /* ── List items (detect task-list) ── */
          li({ children, className: cls, ...props }) {
            const isTask = cls?.includes("task-list-item");
            return (
              <li className={isTask ? "task-list-item" : undefined} {...props}>
                {children}
              </li>
            );
          },

          /* ── Details/Summary ── */
          details({ children }) {
            return <DetailsBlock>{children}</DetailsBlock>;
          },

          /* ── GitHub alert divs ── */
          div({ className: cls, children, ...props }) {
            if (cls?.includes("gh-alert")) {
              return (
                <AlertWrapper className={cls}>
                  {children}
                </AlertWrapper>
              );
            }
            return <div className={cls} {...props}>{children}</div>;
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

export const MarkdownRenderer = memo(MarkdownRendererImpl);