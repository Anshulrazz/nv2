"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Quote,
} from "lucide-react";

interface SimpleEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function SimpleEditor({ value, onChange, placeholder, className }: SimpleEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "max-w-none focus:outline-none min-h-[250px] p-4 text-xs font-sans text-neutral-300",
      },
    },
  });

  // Keep synced if value is reset from outside (e.g. after publish)
  useEffect(() => {
    if (editor && value === "" && editor.getHTML() !== "<p></p>") {
      editor.commands.setContent("");
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`flex flex-col border border-neutral-855 rounded-xl overflow-hidden bg-neutral-950/80 focus-within:border-cyan-500 transition-colors ${className || ""}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-neutral-855 bg-neutral-900/50 select-none">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors ${editor.isActive("bold") ? "bg-neutral-800 text-neutral-100" : ""}`}
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors ${editor.isActive("italic") ? "bg-neutral-800 text-neutral-100" : ""}`}
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <div className="w-[1px] h-4 bg-neutral-800 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors ${editor.isActive("heading", { level: 1 }) ? "bg-neutral-800 text-neutral-100" : ""}`}
        >
          <Heading1 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-neutral-800 text-neutral-100" : ""}`}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>
        <div className="w-[1px] h-4 bg-neutral-800 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors ${editor.isActive("bulletList") ? "bg-neutral-800 text-neutral-100" : ""}`}
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors ${editor.isActive("orderedList") ? "bg-neutral-800 text-neutral-100" : ""}`}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
        <div className="w-[1px] h-4 bg-neutral-800 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors ${editor.isActive("codeBlock") ? "bg-neutral-800 text-neutral-100" : ""}`}
        >
          <Code className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors ${editor.isActive("blockquote") ? "bg-neutral-800 text-neutral-100" : ""}`}
        >
          <Quote className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="flex-1 bg-transparent cursor-text min-h-[250px]" onClick={() => editor.chain().focus().run()}>
        {value === "" && !editor.isFocused && placeholder && (
          <div className="absolute p-4 text-xs font-sans text-neutral-500 pointer-events-none">
            {placeholder}
          </div>
        )}
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
