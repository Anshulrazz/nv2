"use client";

import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;

  let htmlContent = content;

  // 1. Convert Markdown Code Blocks ```lang ... ``` into HTML code containers
  htmlContent = htmlContent.replace(
    /```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const languageBadge = lang.trim()
        ? `<div class="bg-zinc-900/90 px-4 py-2 border-b border-white/10 flex items-center justify-between text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-widest">
            <span>${escapeHtml(lang.trim())}</span>
            <span class="text-zinc-500 text-[9px]">CODE SNIPPET</span>
           </div>`
        : "";
      return `<div class="my-6 rounded-2xl overflow-hidden border border-white/15 bg-[#0d0d12] shadow-2xl">
        ${languageBadge}
        <pre class="p-4 font-mono text-xs sm:text-sm text-emerald-300 overflow-x-auto leading-relaxed"><code>${escapeHtml(code.trim())}</code></pre>
      </div>`;
    }
  );

  // 2. Convert Markdown Standalone Images ![alt](url) into HTML <figure>
  htmlContent = htmlContent.replace(
    /!\[(.*?)\]\((.*?)\)/g,
    (_, alt, url) => {
      const captionHtml = alt.trim()
        ? `<figcaption class="mt-3 text-xs font-mono text-cyan-400 font-semibold">Figure: ${escapeHtml(alt.trim())}</figcaption>`
        : "";
      return `<figure class="my-6 p-4 bg-zinc-950/90 border border-white/10 rounded-2xl text-center shadow-2xl">
        <img src="${url.trim()}" alt="${escapeHtml(alt.trim())}" class="max-h-[650px] w-full object-contain rounded-xl border border-white/5 mx-auto" />
        ${captionHtml}
      </figure>`;
    }
  );

  // 3. Convert Markdown Headings (# Heading)
  htmlContent = htmlContent.replace(/^>(.*)$/gm, (_, text) => {
    return `<blockquote class="border-l-4 border-cyan-400 pl-4 py-2 my-4 italic text-zinc-300 bg-zinc-950/60 rounded-r-xl border-y border-r border-white/5">${text}</blockquote>`;
  });

  // 4. Convert Markdown Headings (# Heading)
  htmlContent = htmlContent.replace(/^(#{1,6})\s+(.*)$/gm, (_, hashes, text) => {
    const level = hashes.length;
    if (level === 1) return `<h1 class="text-2xl sm:text-3xl font-black text-white mt-8 mb-4 tracking-tight border-b border-white/10 pb-2">${text}</h1>`;
    if (level === 2) return `<h2 class="text-xl sm:text-2xl font-bold text-white mt-6 mb-3 tracking-tight">${text}</h2>`;
    if (level === 3) return `<h3 class="text-lg font-bold text-cyan-300 mt-5 mb-2 tracking-tight">${text}</h3>`;
    return `<h4 class="text-base font-bold text-zinc-200 mt-4 mb-2 tracking-tight">${text}</h4>`;
  });

  // 5. Convert Markdown Links [text](url)
  htmlContent = htmlContent.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline font-bold transition-colors inline cursor-pointer">$1</a>'
  );

  // 6. Convert Markdown Bold (**text** or __text__)
  htmlContent = htmlContent.replace(/(\*\*|__)(.*?)\1/g, '<strong class="font-extrabold text-white">$2</strong>');

  // 7. Convert Markdown Italic (*text* or _text_)
  htmlContent = htmlContent.replace(/(\*|_)(.*?)\1/g, '<em class="italic text-zinc-200">$2</em>');

  // 8. Convert Inline Code (`code`)
  htmlContent = htmlContent.replace(/`([^`]+)`/g, '<code class="bg-zinc-900 border border-white/15 px-2 py-0.5 rounded font-mono text-xs text-cyan-300">$1</code>');

  return (
    <div
      className={`prose prose-invert max-w-none text-zinc-200 text-xs sm:text-sm leading-relaxed space-y-4 font-sans
        [&_figure]:my-6 [&_figure]:p-4 [&_figure]:bg-zinc-950/90 [&_figure]:border [&_figure]:border-white/10 [&_figure]:rounded-2xl [&_figure]:text-center [&_figure]:shadow-2xl
        [&_img]:max-h-[650px] [&_img]:w-full [&_img]:object-contain [&_img]:rounded-xl [&_img]:mx-auto [&_img]:border [&_img]:border-white/5
        [&_figcaption]:mt-3 [&_figcaption]:text-xs [&_figcaption]:font-mono [&_figcaption]:text-cyan-400 [&_figcaption]:font-semibold
        [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse [&_table]:border [&_table]:border-white/10 [&_table]:rounded-xl [&_table]:overflow-hidden
        [&_th]:bg-zinc-900 [&_th]:p-3 [&_th]:text-xs [&_th]:font-mono [&_th]:text-white [&_th]:text-left [&_th]:border-b [&_th]:border-white/10
        [&_td]:p-3 [&_td]:text-xs [&_td]:text-zinc-300 [&_td]:border-b [&_td]:border-white/5 [&_tr:hover]:bg-white/5
        [&_pre]:bg-[#0d0d12] [&_pre]:border [&_pre]:border-white/15 [&_pre]:p-4 [&_pre]:rounded-2xl [&_pre]:text-emerald-300 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:overflow-x-auto
        [&_code]:text-cyan-300 [&_code]:font-mono [&_code]:bg-zinc-900 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
