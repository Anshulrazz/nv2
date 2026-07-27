"use client";

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import katex from "katex";
import "katex/dist/katex.min.css";

interface BlogContentRendererProps {
  content: unknown;
  className?: string;
}

const LATEX_COMMAND_RE = /\\(tau|theta|alpha|beta|gamma|delta|epsilon|zeta|eta|kappa|lambda|mu|nu|xi|pi|rho|sigma|phi|chi|psi|omega|Delta|Gamma|Lambda|Sigma|Phi|Psi|Omega|hbar|text|frac|sqrt|int|sum|prod|lim|hat|vec|bar|tilde|dot|partial|nabla|infty|approx|le|ge|neq|in|notin|subset|cup|cap|times|cdot|pm|mp|div|log|exp|sin|cos|tan|forall|exists|rightarrow|Rightarrow)\b/;

/**
 * Preprocesses HTML content to render LaTeX math formulas ($...$, $$...$$, <code>\text{...}</code>, and raw \Delta x \cdot \Delta p \ge \frac{\hbar}{2} expressions) using KaTeX.
 */
function preprocessLatexInHtml(html: string): string {
  if (!html || typeof html !== "string") return html;

  // Unescape HTML entities in TeX expressions (&lt; -> <, &gt; -> >)
  let processed = html.replace(/&lt;/g, "<").replace(/&gt;/g, ">");

  // Fix broken/stray $ inside TeX expressions (e.g. \Delta x \cdot $\Delta$ p \ge \frac{\hbar}{2})
  processed = processed.replace(/(\\[a-zA-Z]+[^$\n`]*?)\$([^\$\n`]+?)\$([^$\n`]*?\\[a-zA-Z]+[^$\n`]*)/g, (match, before, inside, after) => {
    return `${before}${inside}${after}`;
  });

  // 1. Replace <code> containing LaTeX math expressions
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

  // 2. Replace $$...$$ block math
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, mathContent) => {
    try {
      const cleanContent = mathContent.replace(/\$/g, "").trim();
      return katex.renderToString(cleanContent, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return match;
    }
  });

  // 3. Replace $...$ inline math (ignoring plain currency numbers)
  processed = processed.replace(/(^|[^\\])\$([^\$\n]+?)\$/g, (match, prefix, mathContent) => {
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

  // 4. Replace raw un-wrapped TeX math expressions like \Delta x \cdot \Delta p \ge \frac{\hbar}{2} outside HTML tags
  processed = processed.replace(/(?<![="'>])\\(tau|theta|alpha|beta|gamma|delta|epsilon|zeta|eta|kappa|lambda|mu|nu|xi|pi|rho|sigma|phi|chi|psi|omega|Delta|Gamma|Lambda|Sigma|Phi|Psi|Omega|hbar|text|frac|sqrt|int|sum|partial|nabla|infty)\b([^<\n]*?)(?=[,.;:\s<]|$)/g, (match) => {
    try {
      const cleanMatch = match.replace(/\$/g, "").trim();
      return katex.renderToString(cleanMatch, { displayMode: false, throwOnError: false });
    } catch {
      return match;
    }
  });

  return processed;
}

/**
 * Universal content renderer for blogs, notes and research papers.
 *
 * Routing logic:
 *   - HTML string  (starts with "<" or contains "</") → dangerouslySetInnerHTML with full prose styling & KaTeX preprocessor
 *   - Markdown / plain string                         → MarkdownRenderer (react-markdown + KaTeX pipeline)
 *   - TipTap JSON object                              → JSON→Markdown text → MarkdownRenderer
 */
export function BlogContentRenderer({ content, className = "" }: BlogContentRendererProps) {
  if (!content) return null;

  if (typeof content === "string") {
    // Only treat as HTML if it genuinely opens with a block-level HTML tag.
    // Type hints like Dict[str, str] and markdown with < > chars are NOT HTML.
    const HTML_BLOCK_RE = /^\s*<(h[1-6]|p|div|section|article|figure|ul|ol|table|blockquote|pre|hr|br|img)\b/i;
    const isHtml = HTML_BLOCK_RE.test(content);

    if (isHtml) {
      const processedHtml = preprocessLatexInHtml(content);
      return (
        <div
          className={`
            max-w-none leading-[1.85] font-sans text-zinc-200

            [&_h1]:text-3xl [&_h1]:font-black [&_h1]:text-white [&_h1]:mt-10 [&_h1]:mb-5 [&_h1]:pb-3 [&_h1]:border-b [&_h1]:border-white/10 [&_h1]:tracking-tight [&_h1]:leading-tight
            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:tracking-tight
            [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-cyan-300 [&_h3]:mt-7 [&_h3]:mb-3
            [&_h4]:text-lg [&_h4]:font-bold [&_h4]:text-zinc-200 [&_h4]:mt-5 [&_h4]:mb-2

            [&_p]:text-[15px] [&_p]:text-zinc-300 [&_p]:leading-[1.85] [&_p]:my-4

            [&_ul]:my-5 [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:text-zinc-300
            [&_ol]:my-5 [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:list-decimal [&_ol]:text-zinc-300
            [&_li]:text-[15px] [&_li]:leading-[1.75] [&_li]:my-1 [&_li]:text-zinc-300

            [&_strong]:font-extrabold [&_strong]:text-white
            [&_em]:italic [&_em]:text-zinc-200

            [&_a]:text-cyan-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-semibold [&_a:hover]:text-cyan-300

            [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-400 [&_blockquote]:bg-cyan-400/5 [&_blockquote]:pl-5 [&_blockquote]:pr-4 [&_blockquote]:py-3 [&_blockquote]:my-6 [&_blockquote]:rounded-r-xl [&_blockquote]:text-zinc-300 [&_blockquote]:not-italic

            [&_hr]:my-8 [&_hr]:border-white/10

            [&_pre]:my-6 [&_pre]:bg-[#0d0d12] [&_pre]:border [&_pre]:border-white/[0.12] [&_pre]:rounded-2xl [&_pre]:p-5 [&_pre]:overflow-x-auto [&_pre]:leading-[1.75] [&_pre]:text-[13px] [&_pre]:font-mono [&_pre]:shadow-[0_4px_32px_rgba(0,0,0,0.5)]
            [&_pre_code]:!bg-transparent [&_pre_code]:!border-0 [&_pre_code]:!rounded-none [&_pre_code]:!p-0 [&_pre_code]:!px-0 [&_pre_code]:!py-0 [&_pre_code]:!m-0 [&_pre_code]:!text-emerald-300 [&_pre_code]:!font-mono [&_pre_code]:!text-[13px] [&_pre_code]:!leading-[1.75] [&_pre_code]:!whitespace-pre [&_pre_code]:!block [&_pre_code]:!shadow-none [&_pre_code]:!outline-none [&_pre_code]:!ring-0
            [&_code]:text-cyan-300 [&_code]:font-mono [&_code]:bg-zinc-800/80 [&_code]:border [&_code]:border-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[12px] [&_code]:leading-none

            [&_.katex]:text-base [&_.katex]:text-zinc-100
            [&_.katex-display]:my-5 [&_.katex-display]:py-3.5 [&_.katex-display]:px-5 [&_.katex-display]:bg-[#0d0d12]/90 [&_.katex-display]:border [&_.katex-display]:border-cyan-500/30 [&_.katex-display]:rounded-xl [&_.katex-display]:shadow-lg [&_.katex-display_.katex]:text-cyan-300

            [&_figure]:my-8 [&_figure]:rounded-2xl [&_figure]:overflow-hidden [&_figure]:border [&_figure]:border-white/10 [&_figure]:bg-zinc-950/80 [&_figure]:shadow-2xl
            [&_figure_img]:w-full [&_figure_img]:max-h-[600px] [&_figure_img]:object-cover [&_figure_img]:block
            [&_figcaption]:px-5 [&_figcaption]:py-3 [&_figcaption]:text-xs [&_figcaption]:font-mono [&_figcaption]:text-cyan-400 [&_figcaption]:border-t [&_figcaption]:border-white/10 [&_figcaption]:bg-zinc-900/60
            [&_img]:max-h-[600px] [&_img]:w-full [&_img]:object-contain [&_img]:rounded-xl [&_img]:mx-auto [&_img]:my-6 [&_img]:border [&_img]:border-white/5

            [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse [&_table]:border [&_table]:border-white/10 [&_table]:rounded-xl [&_table]:overflow-hidden [&_table]:text-sm
            [&_thead]:bg-zinc-900/80
            [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-xs [&_th]:font-mono [&_th]:font-bold [&_th]:text-zinc-200 [&_th]:uppercase [&_th]:tracking-wider [&_th]:border-b [&_th]:border-white/10
            [&_td]:px-4 [&_td]:py-3 [&_td]:text-zinc-300 [&_td]:border-b [&_td]:border-white/5 [&_td]:align-top
            [&_tbody_tr:hover_td]:bg-white/[0.03]
            [&_tbody_tr:last-child_td]:border-b-0

            ${className}
          `}
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
      );
    }

    // Markdown / plain text
    return <MarkdownRenderer content={content} className={className} />;
  }

  // TipTap JSON object → extract to Markdown → render
  if (typeof content === "object" && content !== null) {
    const text = extractTextFromTipTap(content as TipTapNode);
    return <MarkdownRenderer content={text} className={className} />;
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
