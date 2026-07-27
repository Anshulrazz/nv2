"use client";

import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

interface BlogContentRendererProps {
  content: unknown;
}

/**
 * Client-side blog content renderer.
 * - If content is a Markdown/plain string → rendered via MarkdownRenderer (react-markdown)
 * - If content is a TipTap JSON object → rendered via MarkdownRenderer after JSON→text conversion
 * - Handles both HTML strings (legacy) and Markdown strings (AI-generated)
 */
export function BlogContentRenderer({ content }: BlogContentRendererProps) {
  if (!content) return null;

  if (typeof content === "string") {
    return (
      <MarkdownRenderer
        content={content}
        className="text-sm sm:text-base"
      />
    );
  }

  // TipTap JSON — recursively extract text and render as Markdown
  if (typeof content === "object" && content !== null) {
    const text = extractTextFromTipTap(content as TipTapNode);
    return (
      <MarkdownRenderer
        content={text}
        className="text-sm sm:text-base"
      />
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

  // Text leaf
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
    case "doc":
      return children.join("\n\n");
    case "paragraph":
      return children.join("") || "";
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      return `${"#".repeat(level)} ${children.join("")}`;
    }
    case "bulletList":
      return children.join("\n");
    case "orderedList":
      return children.map((c, i) => `${i + 1}. ${c}`).join("\n");
    case "listItem":
      return `- ${children.join("")}`;
    case "blockquote":
      return children.map((c) => `> ${c}`).join("\n");
    case "codeBlock": {
      const lang = String(node.attrs?.language ?? "");
      return `\`\`\`${lang}\n${children.join("\n")}\n\`\`\``;
    }
    case "image": {
      const src = String(node.attrs?.src ?? "");
      const alt = String(node.attrs?.alt ?? "");
      return `![${alt}](${src})`;
    }
    case "horizontalRule":
      return "---";
    case "hardBreak":
      return "\n";
    default:
      return children.join(" ");
  }
}
