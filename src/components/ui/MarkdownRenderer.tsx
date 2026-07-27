"use client";

import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  if (!content) return null;

  // If content contains raw HTML tags (e.g. <figure>, <table, <h1, <p>), render via dangerouslySetInnerHTML
  const hasHtml =
    typeof content === "string" &&
    (content.includes("<figure") ||
      content.includes("<table") ||
      content.includes("<img") ||
      content.includes("<div>") ||
      content.includes("<h1") ||
      content.includes("<h2") ||
      content.includes("<h3") ||
      content.includes("<p>"));

  if (hasHtml) {
    return (
      <div
        className="prose prose-invert max-w-none text-zinc-200 text-xs sm:text-sm leading-relaxed space-y-4 font-sans
          [&_figure]:my-6 [&_figure]:p-4 [&_figure]:bg-zinc-950/80 [&_figure]:border [&_figure]:border-white/10 [&_figure]:rounded-2xl [&_figure]:text-center [&_figure]:shadow-2xl
          [&_img]:max-h-[600px] [&_img]:w-full [&_img]:object-contain [&_img]:rounded-xl [&_img]:mx-auto [&_img]:border [&_img]:border-white/5
          [&_figcaption]:mt-3 [&_figcaption]:text-xs [&_figcaption]:font-mono [&_figcaption]:text-cyan-400 [&_figcaption]:font-semibold
          [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse [&_table]:border [&_table]:border-white/10 [&_table]:rounded-xl [&_table]:overflow-hidden
          [&_th]:bg-zinc-900 [&_th]:p-3 [&_th]:text-xs [&_th]:font-mono [&_th]:text-white [&_th]:text-left [&_th]:border-b [&_th]:border-white/10
          [&_td]:p-3 [&_td]:text-xs [&_td]:text-zinc-300 [&_td]:border-b [&_td]:border-white/5 [&_tr:hover]:bg-white/5
          [&_pre]:bg-[#0d0d12] [&_pre]:border [&_pre]:border-white/15 [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:text-emerald-300 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:overflow-x-auto
          [&_code]:text-cyan-300 [&_code]:font-mono [&_code]:bg-zinc-900 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeContent: string[] = [];
  let codeLang = "";

  let inList = false;
  let isOrderedList = false;
  let listItems: string[] = [];

  let inTable = false;
  let tableRows: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (listItems.length === 0) return;
    const listKey = `${keyPrefix}-list-${elements.length}`;
    const items = listItems.map((item, idx) => (
      <li key={idx} className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
        {parseInlineMarkdown(item)}
      </li>
    ));
    elements.push(
      isOrderedList ? (
        <ol key={listKey} className="list-decimal pl-5 space-y-1.5 my-3 text-zinc-300">
          {items}
        </ol>
      ) : (
        <ul key={listKey} className="list-disc pl-5 space-y-1.5 my-3 text-zinc-300">
          {items}
        </ul>
      )
    );
    listItems = [];
    inList = false;
  };

  const flushTable = (keyPrefix: string) => {
    if (tableRows.length === 0) return;
    const tableKey = `${keyPrefix}-table-${elements.length}`;

    const validRows = tableRows.filter((r) => !r.match(/^\|?\s*:?-+:?\s*\|/));
    if (validRows.length > 0) {
      const headerCells = validRows[0]
        .split("|")
        .map((c) => c.trim())
        .filter((c, i, a) => !(i === 0 && c === "") && !(i === a.length - 1 && c === ""));

      const bodyRows = validRows.slice(1).map((row) =>
        row
          .split("|")
          .map((c) => c.trim())
          .filter((c, i, a) => !(i === 0 && c === "") && !(i === a.length - 1 && c === ""))
      );

      elements.push(
        <div key={tableKey} className="overflow-x-auto my-6 border border-white/10 rounded-2xl bg-zinc-950/80 shadow-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-zinc-900 border-b border-white/10">
                {headerCells.map((cell, idx) => (
                  <th key={idx} className="p-3 font-mono font-bold text-white uppercase tracking-wider">
                    {parseInlineMarkdown(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-3 text-zinc-300 leading-relaxed">
                      {parseInlineMarkdown(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const key = `md-block-${i}-${elements.length}`;

    // 1. Code Blocks
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <div key={key} className="my-4 rounded-2xl overflow-hidden border border-white/15 bg-[#0d0d12] shadow-2xl">
            {codeLang && (
              <div className="bg-zinc-900/90 px-4 py-1.5 border-b border-white/10 flex items-center justify-between text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
                <span>{codeLang}</span>
                <span className="text-zinc-500 text-[9px]">CODE SNIPPET</span>
              </div>
            )}
            <pre className="p-4 font-mono text-xs sm:text-sm text-emerald-300 overflow-x-auto leading-relaxed">
              <code>{codeContent.join("\n")}</code>
            </pre>
          </div>
        );
        codeContent = [];
        inCodeBlock = false;
      } else {
        // Start of code block
        flushList(key);
        flushTable(key);
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // 2. Markdown Tables
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      flushList(key);
      inTable = true;
      tableRows.push(line.trim());
      continue;
    } else if (inTable) {
      flushTable(key);
    }

    // 3. Lists
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

    if (inList) {
      flushList(key);
    }

    // 4. Headings
    if (line.startsWith("#")) {
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        const parsedText = parseInlineMarkdown(headingText);
        if (level === 1) {
          elements.push(
            <h1 key={key} className="text-2xl sm:text-3xl font-black text-white mt-8 mb-4 tracking-tight border-b border-white/10 pb-2">
              {parsedText}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2 key={key} className="text-xl sm:text-2xl font-bold text-white mt-6 mb-3 tracking-tight">
              {parsedText}
            </h2>
          );
        } else if (level === 3) {
          elements.push(
            <h3 key={key} className="text-lg font-bold text-cyan-300 mt-5 mb-2 tracking-tight">
              {parsedText}
            </h3>
          );
        } else {
          elements.push(
            <h4 key={key} className="text-base font-bold text-zinc-200 mt-4 mb-2 tracking-tight">
              {parsedText}
            </h4>
          );
        }
        continue;
      }
    }

    // 5. Blockquotes
    if (line.startsWith(">")) {
      const quoteText = line.slice(1).trim();
      elements.push(
        <blockquote key={key} className="border-l-4 border-cyan-400 pl-4 py-2 my-4 italic text-zinc-300 bg-zinc-950/60 rounded-r-xl border-y border-r border-white/5">
          {parseInlineMarkdown(quoteText)}
        </blockquote>
      );
      continue;
    }

    // 6. Horizontal Rule
    if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
      elements.push(<hr key={key} className="border-white/10 my-6" />);
      continue;
    }

    // 7. Blank Line
    if (line.trim() === "") {
      elements.push(<div key={key} className="h-2" />);
      continue;
    }

    // 8. Regular Paragraph
    elements.push(
      <p key={key} className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-4">
        {parseInlineMarkdown(line)}
      </p>
    );
  }

  if (inList) flushList("md-final-list");
  if (inTable) flushTable("md-final-table");

  return <div className="space-y-1 w-full">{elements}</div>;
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
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
            <figure key={idx} className="my-6 p-3 bg-zinc-950/80 border border-white/10 rounded-2xl text-center shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={match[2]}
                alt={match[1]}
                className="w-full max-h-[600px] object-contain rounded-xl border border-white/5 mx-auto"
              />
              {match[1] && <figcaption className="mt-2 text-xs font-mono text-cyan-400 font-semibold">{match[1]}</figcaption>}
            </figure>
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
              className="text-cyan-400 hover:text-cyan-300 underline font-bold transition-colors inline cursor-pointer"
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
          <strong key={idx} className="font-extrabold text-white">
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
          <em key={idx} className="italic text-zinc-200">
            {part.slice(1, -1)}
          </em>
        );
      }

      // Inline Code: `code`
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="bg-zinc-900 border border-white/15 px-2 py-0.5 rounded font-mono text-xs text-cyan-300"
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
