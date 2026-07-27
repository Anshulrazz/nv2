"use client";

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import katex from "katex";
import "katex/dist/katex.min.css";

interface BlogContentRendererProps {
  content: unknown;
  className?: string;
}

const LATEX_COMMAND_RE = /\\(tau|theta|alpha|beta|gamma|delta|epsilon|zeta|eta|kappa|lambda|mu|nu|xi|pi|rho|sigma|phi|chi|psi|omega|Delta|Gamma|Lambda|Sigma|Phi|Psi|Omega|hbar|text|mathbf|mathbb|mathcal|mathrm|mathit|boldsymbol|frac|sqrt|int|sum|prod|lim|hat|vec|bar|tilde|dot|partial|nabla|infty|approx|le|ge|neq|in|notin|subset|cup|cap|times|cdot|pm|mp|div|log|exp|sin|cos|tan|forall|exists|rightarrow|Rightarrow|leftarrow|leftrightarrow|langle|rangle|ket|bra|begin|end|left|right|quad|qquad|ldots|cdots|vdots|ddots)\b/;

/**
 * Remove stray bare $ signs that appear INSIDE an already-delimited or un-delimited LaTeX expression.
 * e.g. |$\psi\rangle$ = $\alpha$ |0\rangle  →  |\psi\rangle = \alpha |0\rangle
 * We do this by stripping $ that directly wrap a single LaTeX command word.
 */
function removeStrayDollars(s: string): string {
  return s.replace(/\$\\([a-zA-Z]+)(\{[^}]*\})?\$/g, (_m, cmd, arg) =>
    arg ? `\\${cmd}${arg}` : `\\${cmd}`
  );
}

/**
 * Preprocesses HTML content to render LaTeX math formulas ($...$, $$...$$, <code>\text{...}</code>, and raw \Delta x ... expressions) using KaTeX.
 */
function preprocessLatexInHtml(html: string): string {
  if (!html || typeof html !== "string") return html;

  let processed = html.replace(/&lt;/g, "<").replace(/&gt;/g, ">");

  processed = removeStrayDollars(processed);

  processed = processed.replace(/(\\[a-zA-Z]+[^$\n`]*?)\$([^$\n`]+?)\$([^$\n`]*?\\[a-zA-Z]+[^$\n`]*)/g, (_match, before, inside, after) => {
    return `${before}${inside}${after}`;
  });

  processed = processed.replace(/<code>\s*([\s\S]*?)\s*<\/code>/g, (match, innerText) => {
    const cleanText = innerText.replace(/\$/g, "").trim();
    if (LATEX_COMMAND_RE.test(cleanText)) {
      try {
        const isBlock = cleanText.includes("\\int") || cleanText.includes("\\sum") || cleanText.includes("\\frac") || cleanText.length > 35;
        return katex.renderToString(cleanText, {
          displayMode: isBlock,
          throwOnError: false,
        });
      } catch {
        return match;
      }
    }
    return match;
  });

  processed = processed.replace(/\\begin\{([a-z*]+)\}([\s\S]*?)\\end\{\1\}/g, (match, _env, _inner) => {
    try {
      const cleanMatch = removeStrayDollars(match).replace(/\$/g, "");
      return katex.renderToString(cleanMatch, { displayMode: true, throwOnError: false });
    } catch {
      return match;
    }
  });

  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, mathContent) => {
    try {
      const cleanContent = removeStrayDollars(mathContent).replace(/\$/g, "").trim();
      return katex.renderToString(cleanContent, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return match;
    }
  });

  processed = processed.replace(/(^|[^\\])\$([^$\n]+?)\$/g, (match, prefix, mathContent) => {
    if (/^\d+(\.\d+)?$/.test(mathContent.trim())) {
      return match;
    }
    try {
      const rendered = katex.renderToString(mathContent.trim(), {
        displayMode: false,
        throwOnError: false,
      });
      return `${prefix}${rendered}`;
    } catch {
      return match;
    }
  });

  processed = processed.replace(/(?<![="'>\\])(\\(?:mathbf|mathbb|mathcal|mathrm|boldsymbol|text|frac|sqrt|int|sum|partial|nabla|infty|Delta|Gamma|Lambda|Sigma|Phi|Psi|Omega|tau|theta|alpha|beta|gamma|delta|epsilon|zeta|eta|kappa|lambda|mu|nu|xi|pi|rho|sigma|phi|chi|psi|omega|hbar|quad|langle|rangle|left|right)\b[^<\n]*?)(?=[,;:\s<]|$)/g, (match) => {
    try {
      const cleanMatch = removeStrayDollars(match).replace(/\$/g, "").trim();
      return katex.renderToString(cleanMatch, { displayMode: false, throwOnError: false });
    } catch {
      return match;
    }
  });

  return processed;
}

/**
 * GitHub-flavored "markdown-body" dark-theme class string.
 * Mirrors GitHub's actual README rendering: 16px base, 1.5 line-height,
 * bordered h1/h2, GitHub code/table/blockquote treatment.
 */
const GITHUB_MARKDOWN_BODY = `
  max-w-none font-sans text-[16px] leading-[1.5] text-[#c9d1d9]

  [&_h1]:text-[2em] [&_h1]:font-semibold [&_h1]:text-white [&_h1]:pb-[0.3em] [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:border-b [&_h1]:border-[#21262d] [&_h1]:leading-tight
  [&_h2]:text-[1.5em] [&_h2]:font-semibold [&_h2]:text-white [&_h2]:pb-[0.3em] [&_h2]:mt-6 [&_h2]:mb-4 [&_h2]:border-b [&_h2]:border-[#21262d] [&_h2]:leading-tight
  [&_h3]:text-[1.25em] [&_h3]:font-semibold [&_h3]:text-white [&_h3]:mt-6 [&_h3]:mb-4
  [&_h4]:text-[1em] [&_h4]:font-semibold [&_h4]:text-white [&_h4]:mt-6 [&_h4]:mb-4
  [&_h5]:text-[0.875em] [&_h5]:font-semibold [&_h5]:text-white [&_h5]:mt-6 [&_h5]:mb-4
  [&_h6]:text-[0.85em] [&_h6]:font-semibold [&_h6]:text-[#8b949e] [&_h6]:mt-6 [&_h6]:mb-4

  [&_p]:mt-0 [&_p]:mb-4 [&_p]:text-[#c9d1d9] [&_p]:leading-[1.5]

  [&_ul]:mt-0 [&_ul]:mb-4 [&_ul]:pl-8 [&_ul]:list-disc [&_ul]:text-[#c9d1d9]
  [&_ol]:mt-0 [&_ol]:mb-4 [&_ol]:pl-8 [&_ol]:list-decimal [&_ol]:text-[#c9d1d9]
  [&_li]:mt-1 [&_li]:leading-[1.5]
  [&_li_ul]:mt-1 [&_li_ol]:mt-1

  [&_strong]:font-semibold [&_strong]:text-white
  [&_em]:italic

  [&_a]:text-[#58a6ff] [&_a]:no-underline hover:[&_a]:underline

  [&_blockquote]:pl-4 [&_blockquote]:pr-2 [&_blockquote]:py-0 [&_blockquote]:my-4 [&_blockquote]:border-l-[0.25em] [&_blockquote]:border-[#3b434b] [&_blockquote]:text-[#8b949e] [&_blockquote]:not-italic
  [&_blockquote_p]:text-[#8b949e]

  [&_hr]:h-[0.25em] [&_hr]:p-0 [&_hr]:my-6 [&_hr]:bg-[#21262d] [&_hr]:border-0 [&_hr]:rounded-full

  [&_pre]:my-4 [&_pre]:bg-[#161b22] [&_pre]:border [&_pre]:border-[#30363d] [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:leading-[1.45] [&_pre]:text-[85%] [&_pre]:font-mono
  [&_pre_code]:!bg-transparent [&_pre_code]:!border-0 [&_pre_code]:!p-0 [&_pre_code]:!m-0 [&_pre_code]:!text-[#c9d1d9] [&_pre_code]:!font-mono [&_pre_code]:!text-[85%] [&_pre_code]:!leading-[1.45] [&_pre_code]:!whitespace-pre [&_pre_code]:!block
  [&_code]:text-[#c9d1d9] [&_code]:font-mono [&_code]:bg-[rgba(110,118,129,0.4)] [&_code]:px-[0.4em] [&_code]:py-[0.2em] [&_code]:rounded-md [&_code]:text-[85%]

  [&_.katex]:text-[1.05em] [&_.katex]:text-[#c9d1d9]
  [&_.katex-display]:my-4 [&_.katex-display]:py-3 [&_.katex-display]:px-4 [&_.katex-display]:bg-[#161b22] [&_.katex-display]:border [&_.katex-display]:border-[#30363d] [&_.katex-display]:rounded-md [&_.katex-display]:overflow-x-auto

  [&_img]:max-w-full [&_img]:my-4 [&_img]:rounded-md [&_img]:box-border [&_img]:bg-[#0d1117]
  [&_figure]:my-4
  [&_figcaption]:text-[13px] [&_figcaption]:text-[#8b949e] [&_figcaption]:mt-2 [&_figcaption]:text-center

  [&_table]:block [&_table]:w-max [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:my-4 [&_table]:border-collapse
  [&_thead]:bg-[#161b22]
  [&_th]:border [&_th]:border-[#30363d] [&_th]:px-[13px] [&_th]:py-[6px] [&_th]:font-semibold [&_th]:text-white [&_th]:text-left
  [&_td]:border [&_td]:border-[#30363d] [&_td]:px-[13px] [&_td]:py-[6px] [&_td]:text-[#c9d1d9]
  [&_tr]:bg-[#0d1117] [&_tr]:border-t [&_tr]:border-[#21262d]
  [&_tr:nth-child(2n)]:bg-[#161b22]
`;

/**
 * Universal content renderer for blogs, notes and research papers.
 *
 * Routing logic:
 *   - HTML string  (starts with "<" or contains "</") → dangerouslySetInnerHTML with GitHub-README prose styling & KaTeX preprocessor
 *   - Markdown / plain string                         → MarkdownRenderer (react-markdown + KaTeX pipeline)
 *   - TipTap JSON object                              → JSON→Markdown text → MarkdownRenderer
 */
export function BlogContentRenderer({ content, className = "" }: BlogContentRendererProps) {
  if (!content) return null;

  if (typeof content === "string") {
    const HTML_BLOCK_RE = /^\s*<(h[1-6]|p|div|section|article|figure|ul|ol|table|blockquote|pre|hr|br|img)\b/i;
    const isHtml = HTML_BLOCK_RE.test(content);

    if (isHtml) {
      const processedHtml = preprocessLatexInHtml(content);
      return (
        <div
          className={`${GITHUB_MARKDOWN_BODY} ${className}`}
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
      );
    }

    return (
      <div className={`${GITHUB_MARKDOWN_BODY} ${className}`}>
        <MarkdownRenderer content={content} className="" />
      </div>
    );
  }

  if (typeof content === "object" && content !== null) {
    const text = extractTextFromTipTap(content as TipTapNode);
    return (
      <div className={`${GITHUB_MARKDOWN_BODY} ${className}`}>
        <MarkdownRenderer content={text} className="" />
      </div>
    );
  }

  return null;
}

// ── TipTap JSON → Markdown string ──────────────────────────────────────────
interface TipTapNode {
  type?: string;
  text?: string;
  content?: TipTapNode[];
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
}

function extractTextFromTipTap(node: TipTapNode, depth = 0): string {
  if (!node) return "";

  if (node.type === "text" && node.text) {
    let t = node.text;
    if (node.marks) {
      for (const mark of node.marks) {
        if (mark.type === "bold") t = `**${t}**`;
        else if (mark.type === "italic") t = `*${t}*`;
        else if (mark.type === "code") t = `\`${t}\``;
        else if (mark.type === "link") t = `[${t}](${mark.attrs?.href ?? ""})`;
      }
    }
    return t;
  }

  const children = (node.content ?? []).map((c) => extractTextFromTipTap(c, depth + 1));

  switch (node.type) {
    case "doc":        return children.join("\n\n");
    case "paragraph": return children.join("") || "";
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      return `${"#".repeat(level)} ${children.join("")}`;
    }
    case "bulletList":  return children.join("\n");
    case "orderedList": return children.map((c, i) => `${i + 1}. ${c}`).join("\n");
    case "listItem":    return `- ${children.join("")}`;
    case "blockquote":  return children.map((c) => `> ${c}`).join("\n");
    case "codeBlock": {
      const lang = String(node.attrs?.language ?? "");
      return `\`\`\`${lang}\n${children.join("\n")}\n\`\`\``;
    }
    case "image": {
      const src = String(node.attrs?.src ?? "");
      const alt = String(node.attrs?.alt ?? "");
      return `![${alt}](${src})`;
    }
    case "horizontalRule": return "---";
    case "hardBreak":      return "\n";
    default:               return children.join(" ");
  }
}