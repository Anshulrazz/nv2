"use client";

import React, { useState, useCallback, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import "highlight.js/styles/github-dark.css";
import { Check, Copy, Link as LinkIcon, ExternalLink } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// ---------- Code block with header + copy button ----------
function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match?.[1] ?? "text";
  const raw = String(children).replace(/\n$/, "");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked (insecure context, permissions) - fail silently
    }
  }, [raw]);

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d12]">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-wide text-zinc-400">
          {lang}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="!m-0 !rounded-none !border-0 overflow-x-auto p-4">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

// ---------- Heading with copy-link anchor ----------
function makeHeading(Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") {
  return function Heading({
    id,
    children,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement> & { id?: string }) {
    const handleClick = () => {
      if (!id) return;
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      navigator.clipboard.writeText(url).catch(() => {});
    };

    return (
      <Tag id={id} className="group scroll-mt-24" {...props}>
        <a
          href={id ? `#${id}` : undefined}
          onClick={handleClick}
          className="inline-flex items-center gap-2 no-underline hover:text-current"
        >
          {children}
          {id && (
            <LinkIcon
              size={14}
              className="opacity-0 text-zinc-500 transition-opacity group-hover:opacity-100"
            />
          )}
        </a>
      </Tag>
    );
  };
}

// ---------- Link: external gets icon + safe attrs ----------
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
      className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 inline-flex items-center gap-1 transition-colors"
    >
      {children}
      {isExternal && <ExternalLink size={12} className="opacity-60" />}
    </a>
  );
}

// ---------- Checkbox (task list) ----------
function TaskCheckbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  if (props.type !== "checkbox") return <input {...props} />;
  return (
    <input
      {...props}
      disabled
      className="mr-2 h-4 w-4 rounded border-white/20 bg-zinc-800 accent-cyan-500 align-middle"
    />
  );
}

function MarkdownRendererImpl({
  content,
  className = "",
}: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div
      className={`
        prose prose-invert max-w-none
        prose-headings:text-white prose-headings:font-semibold
        prose-p:text-zinc-300 prose-p:leading-relaxed
        prose-strong:text-white
        prose-em:text-zinc-200
        prose-li:text-zinc-300
        prose-code:text-cyan-300
        prose-code:bg-zinc-800/70
        prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
        prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-transparent prose-pre:border-0 prose-pre:p-0
        prose-blockquote:border-l-cyan-400 prose-blockquote:border-l-4
        prose-blockquote:bg-cyan-400/5 prose-blockquote:py-1
        prose-blockquote:not-italic prose-blockquote:text-zinc-300
        prose-a:text-cyan-400 prose-a:no-underline
        hover:prose-a:text-cyan-300
        prose-img:rounded-xl prose-img:border prose-img:border-white/10
        prose-hr:border-white/10
        prose-table:w-full
        prose-th:bg-zinc-900 prose-th:text-white
        prose-td:border-white/10
        ${className}
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={{
          h1: makeHeading("h1"),
          h2: makeHeading("h2"),
          h3: makeHeading("h3"),
          h4: makeHeading("h4"),
          h5: makeHeading("h5"),
          h6: makeHeading("h6"),
          a: SmartLink,
          input: TaskCheckbox,
          img({ ...props }) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                {...props}
                loading="lazy"
                className="rounded-xl border border-white/10 my-6"
                alt={props.alt ?? ""}
              />
            );
          },
          table({ children, ...props }) {
            return (
              <div className="my-6 overflow-x-auto rounded-xl border border-white/10">
                <table {...props}>{children}</table>
              </div>
            );
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            if (!match) {
              return (
                <code
                  className="bg-zinc-800 border border-white/10 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Memoized so re-renders in a chat/message list don't re-parse unchanged markdown
export const MarkdownRenderer = memo(MarkdownRendererImpl);