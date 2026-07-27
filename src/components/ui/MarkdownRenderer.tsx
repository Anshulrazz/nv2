"use client";

import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;

  let html = content;

  // ─── 1. Fenced Code Blocks  ```lang\ncode\n``` ───────────────────────────
  // Must run BEFORE inline-code replacement so backticks inside fences aren't mangled.
  html = html.replace(/```([a-zA-Z0-9_+-]*)[ \t]*\r?\n([\s\S]*?)```/g, (_, lang, code) => {
    const langLabel = lang.trim();
    const badge = langLabel
      ? `<div class="flex items-center justify-between px-4 py-2 bg-[#13131a] border-b border-white/10">
           <span class="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">${escapeHtml(langLabel)}</span>
           <span class="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">snippet</span>
         </div>`
      : "";

    return `<div class="code-block my-6 rounded-2xl overflow-hidden border border-white/[0.12] bg-[#0d0d12] shadow-[0_4px_32px_rgba(0,0,0,0.6)]">
  ${badge}
  <pre class="code-pre overflow-x-auto p-5 leading-[1.75] text-[13px] font-mono"><code class="code-inner text-emerald-300 font-mono bg-transparent p-0 rounded-none border-0">${escapeHtml(code.trim())}</code></pre>
</div>`;
  });

  // ─── 2. Markdown Images  ![alt](url) → <figure> ─────────────────────────
  html = html.replace(/!\[(.*?)\]\((.*?)\)/g, (_, alt, url) => {
    const cap = alt.trim()
      ? `<figcaption class="mt-3 text-[11px] font-mono text-cyan-400 font-semibold">▲ ${escapeHtml(alt.trim())}</figcaption>`
      : "";
    return `<figure class="my-6 p-4 bg-zinc-950/80 border border-white/10 rounded-2xl text-center shadow-2xl">
  <img src="${url.trim()}" alt="${escapeHtml(alt.trim())}" class="max-h-[660px] w-full object-contain rounded-xl border border-white/5 mx-auto" loading="lazy" />
  ${cap}
</figure>`;
  });

  // ─── 3. Blockquotes  > text ──────────────────────────────────────────────
  html = html.replace(/^> (.*)$/gm, (_, t) =>
    `<blockquote class="border-l-4 border-cyan-400 pl-4 pr-3 py-2 my-4 italic text-zinc-300 bg-zinc-950/60 rounded-r-xl">${t}</blockquote>`
  );

  // ─── 4. Headings  # ## ### ####  ─────────────────────────────────────────
  html = html.replace(/^(#{1,6}) (.+)$/gm, (_, hashes, text) => {
    const n = hashes.length;
    if (n === 1) return `<h1 class="text-2xl sm:text-3xl font-black text-white mt-8 mb-4 tracking-tight border-b border-white/10 pb-2">${text}</h1>`;
    if (n === 2) return `<h2 class="text-xl sm:text-2xl font-bold text-white mt-6 mb-3 tracking-tight">${text}</h2>`;
    if (n === 3) return `<h3 class="text-lg font-bold text-cyan-300 mt-5 mb-2 tracking-tight">${text}</h3>`;
    return `<h4 class="text-base font-bold text-zinc-200 mt-4 mb-2 tracking-tight">${text}</h4>`;
  });

  // ─── 5. Bold  **text** ───────────────────────────────────────────────────
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-white">$1</strong>');

  // ─── 6. Italic  *text* ───────────────────────────────────────────────────
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-zinc-200">$1</em>');

  // ─── 7. Inline Code  `code`  (after fenced blocks so it doesn't double-hit) ──
  html = html.replace(/`([^`\n]+)`/g,
    '<code class="inline-code bg-zinc-800/80 border border-white/10 px-1.5 py-0.5 rounded text-[12px] font-mono text-cyan-300 leading-none">$1</code>'
  );

  // ─── 8. Markdown Links  [text](url) ──────────────────────────────────────
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-semibold transition-colors">$1</a>'
  );

  // ─── 9. New-line → <br> for plain paragraphs (not inside blocks) ─────────
  // Only do it outside of block-level elements
  html = html.replace(/\n{2,}/g, '</p><p class="text-zinc-300 text-sm leading-relaxed my-2">');
  html = html.replace(/\n/g, "<br/>");

  return (
    <div
      className={`
        markdown-body relative max-w-none font-sans leading-relaxed text-zinc-200 space-y-3
        [&_.code-block]:my-6
        [&_.code-pre]:m-0 [&_.code-pre]:p-5 [&_.code-pre]:overflow-x-auto [&_.code-pre]:bg-transparent [&_.code-pre]:leading-[1.75] [&_.code-pre]:text-[13px]
        [&_.code-inner]:bg-transparent [&_.code-inner]:p-0 [&_.code-inner]:border-0 [&_.code-inner]:rounded-none [&_.code-inner]:text-emerald-300 [&_.code-inner]:font-mono [&_.code-inner]:text-[13px] [&_.code-inner]:leading-[1.75] [&_.code-inner]:whitespace-pre
        [&_.inline-code]:text-cyan-300 [&_.inline-code]:font-mono [&_.inline-code]:text-[12px]
        [&_pre]:!bg-[#0d0d12] [&_pre]:!m-0 [&_pre]:!p-5 [&_pre]:!overflow-x-auto [&_pre]:!leading-[1.75] [&_pre]:!text-[13px] [&_pre]:!font-mono [&_pre]:!border-0 [&_pre]:!rounded-none
        [&_pre_code]:!bg-transparent [&_pre_code]:!p-0 [&_pre_code]:!border-none [&_pre_code]:!rounded-none [&_pre_code]:!text-emerald-300 [&_pre_code]:!font-mono [&_pre_code]:!text-[13px] [&_pre_code]:!leading-[1.75] [&_pre_code]:!whitespace-pre [&_pre_code]:!block [&_pre_code]:!px-0
        [&_figure]:my-6 [&_figure]:p-4 [&_figure]:bg-zinc-950/80 [&_figure]:border [&_figure]:border-white/10 [&_figure]:rounded-2xl [&_figure]:text-center [&_figure]:shadow-2xl
        [&_img]:max-h-[660px] [&_img]:w-full [&_img]:object-contain [&_img]:rounded-xl [&_img]:mx-auto [&_img]:border [&_img]:border-white/5
        [&_figcaption]:mt-3 [&_figcaption]:text-[11px] [&_figcaption]:font-mono [&_figcaption]:text-cyan-400 [&_figcaption]:font-semibold
        [&_table]:w-full [&_table]:my-6 [&_table]:border-collapse [&_table]:border [&_table]:border-white/10 [&_table]:rounded-xl [&_table]:overflow-hidden
        [&_th]:bg-zinc-900 [&_th]:p-3 [&_th]:text-[11px] [&_th]:font-mono [&_th]:text-white [&_th]:text-left [&_th]:border-b [&_th]:border-white/10
        [&_td]:p-3 [&_td]:text-sm [&_td]:text-zinc-300 [&_td]:border-b [&_td]:border-white/5
        [&_tr:hover_td]:bg-white/5
        [&_h1]:text-2xl [&_h1]:sm:text-3xl [&_h1]:font-black [&_h1]:text-white [&_h1]:mt-8 [&_h1]:mb-4 [&_h1]:tracking-tight [&_h1]:border-b [&_h1]:border-white/10 [&_h1]:pb-2
        [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3
        [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-cyan-300 [&_h3]:mt-5 [&_h3]:mb-2
        [&_h4]:text-base [&_h4]:font-bold [&_h4]:text-zinc-200 [&_h4]:mt-4 [&_h4]:mb-2
        [&_p]:text-sm [&_p]:text-zinc-300 [&_p]:leading-relaxed [&_p]:my-2
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:my-3 [&_ul]:text-zinc-300
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:my-3 [&_ol]:text-zinc-300
        [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-zinc-300
        [&_a]:text-cyan-400 [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-semibold [&_a:hover]:text-cyan-300
        [&_blockquote]:border-l-4 [&_blockquote]:border-cyan-400 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-zinc-300 [&_blockquote]:bg-zinc-950/60 [&_blockquote]:rounded-r-xl
        [&_strong]:font-extrabold [&_strong]:text-white
        [&_em]:italic [&_em]:text-zinc-200
        ${className}
      `}
      dangerouslySetInnerHTML={{ __html: html }}
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
