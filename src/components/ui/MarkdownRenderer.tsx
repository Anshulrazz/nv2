"use client";

import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let codeLang = "";

  let inList = false;
  let isOrderedList = false;
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length === 0) return;
    const items = listItems.map((item, idx) => (
      <li key={idx} className="text-sm text-neutral-300 leading-relaxed">
        {parseInlineMarkdown(item)}
      </li>
    ));
    elements.push(
      isOrderedList ? (
        <ol key={key} className="list-decimal pl-5 space-y-1.5 my-3 text-neutral-350">
          {items}
        </ol>
      ) : (
        <ul key={key} className="list-disc pl-5 space-y-1.5 my-3 text-neutral-350">
          {items}
        </ul>
      )
    );
    listItems = [];
    inList = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const key = `md-block-${i}`;

    // 1. Code Blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <pre
            key={key}
            className="bg-neutral-900 border border-neutral-850 rounded-xl p-4 font-mono text-xs text-neutral-300 overflow-x-auto my-4 max-w-full"
            style={{ fontFamily: "var(--font-jetbrains-mono)" }}
          >
            <code className={codeLang ? `language-${codeLang}` : ""}>
              {codeContent.join("\n")}
            </code>
          </pre>
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        // Start of code block
        flushList(key);
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // 2. Lists
    const bulletMatch = line.match(/^[\-\*\+]\s+(.*)$/);
    const orderedMatch = line.match(/^(\d+)\.\s+(.*)$/);

    if (bulletMatch) {
      if (inList && isOrderedList) {
        flushList(key);
      }
      inList = true;
      isOrderedList = false;
      listItems.push(bulletMatch[1]);
      continue;
    }

    if (orderedMatch) {
      if (inList && !isOrderedList) {
        flushList(key);
      }
      inList = true;
      isOrderedList = true;
      listItems.push(orderedMatch[2]);
      continue;
    }

    // Not a list item, flush lists if needed
    if (inList) {
      flushList(key);
    }

    // 3. Headings
    if (line.startsWith("#")) {
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        const parsedText = parseInlineMarkdown(headingText);
        if (level === 1) {
          elements.push(
            <h1
              key={key}
              className="text-2xl font-bold text-neutral-100 mt-6 mb-3 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {parsedText}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2
              key={key}
              className="text-xl font-bold text-neutral-100 mt-5 mb-2 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {parsedText}
            </h2>
          );
        } else if (level === 3) {
          elements.push(
            <h3
              key={key}
              className="text-lg font-bold text-neutral-100 mt-4 mb-2 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {parsedText}
            </h3>
          );
        } else {
          elements.push(
            <h4
              key={key}
              className="text-base font-bold text-neutral-200 mt-3 mb-1 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {parsedText}
            </h4>
          );
        }
        continue;
      }
    }

    // 4. Blockquotes
    if (line.startsWith(">")) {
      const quoteText = line.slice(1).trim();
      elements.push(
        <blockquote
          key={key}
          className="border-l-4 border-cyan-400 pl-4 py-2 my-4 italic text-neutral-400 bg-neutral-900/20 rounded-r-lg"
        >
          {parseInlineMarkdown(quoteText)}
        </blockquote>
      );
      continue;
    }

    // 5. Horizontal Rule
    if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
      elements.push(<hr key={key} className="border-neutral-900 my-6" />);
      continue;
    }

    // 6. Blank Line
    if (line.trim() === "") {
      // Add a slight vertical spacing for double-newline breaks
      elements.push(<div key={key} className="h-2" />);
      continue;
    }

    // 7. Regular Paragraph
    elements.push(
      <p key={key} className="text-sm text-neutral-300 leading-relaxed mb-4">
        {parseInlineMarkdown(line)}
      </p>
    );
  }

  // Flush any remaining lists at the end
  if (inList) {
    flushList("md-final-list");
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  // Regex supporting:
  // 1. Images: ! [alt] (url)
  // 2. Links: [text] (url)
  // 3. Bold: **text** or __text__
  // 4. Italic: *text* or _text_
  // 5. Inline Code: `code`
  const regex = /(!?\[.*?\]\(.*?\))|(\*\*.*?\*\*|__.*?__)|(\*.*?\*|_.*?_)|(`.*?`)/g;
  const parts = text.split(regex);

  return parts
    .map((part, idx) => {
      if (!part) return null;

      // Images: ![alt](url)
      if (part.startsWith("![") && part.endsWith(")")) {
        const match = part.match(/^!\[(.*?)\]\((.*?)\)$/);
        if (match) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={idx}
              src={match[2]}
              alt={match[1]}
              className="w-full rounded-xl my-4 border border-neutral-900 max-h-[350px] object-cover inline-block"
            />
          );
        }
      }

      // Links: [text](url)
      if (part.startsWith("[") && part.endsWith(")")) {
        const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (match) {
          return (
            <a
              key={idx}
              href={match[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline transition-colors inline cursor-pointer"
            >
              {match[1]}
            </a>
          );
        }
      }

      // Bold: **text** or __text__
      if (
        (part.startsWith("**") && part.endsWith("**")) ||
        (part.startsWith("__") && part.endsWith("__"))
      ) {
        return (
          <strong key={idx} className="font-extrabold text-neutral-100">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic: *text* or _text_
      if (
        (part.startsWith("*") && part.endsWith("*")) ||
        (part.startsWith("_") && part.endsWith("_"))
      ) {
        return (
          <em key={idx} className="italic text-neutral-200">
            {part.slice(1, -1)}
          </em>
        );
      }

      // Inline Code: `code`
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="bg-neutral-900 border border-neutral-850 px-1.5 py-0.5 rounded font-mono text-[11px] text-cyan-400"
            style={{ fontFamily: "var(--font-jetbrains-mono)" }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Regular Text
      return part;
    })
    .filter(Boolean) as React.ReactNode[];
}
