"use client";

import React, { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Wand2,
  FileText,
  CheckSquare,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopicGeneratorModal } from "@/components/notes/TopicGeneratorModal";

interface EditorProps {
  noteId: string;
  initialTitle: string;
  initialContent: JSONContent;
  onSave: (updates: { title?: string; content?: JSONContent }) => Promise<void>;
}

export function Editor({ noteId, initialTitle, initialContent, onSave }: EditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiWriting, setIsAiWriting] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);

  // Initialise TipTap instance
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: true }),
    ],
    content: initialContent || {},
    onUpdate: ({ editor }) => {
      triggerAutosave(title, editor.getJSON());
    },
  });

  // Keep editor content in sync when switching notes
  useEffect(() => {
    if (editor && noteId) {
      editor.commands.setContent(initialContent || {});
      setTitle(initialTitle);
    }
  }, [noteId, initialContent, initialTitle, editor]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const triggerAutosave = (newTitle: string, newContent: JSONContent) => {
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSave({ title: newTitle, content: newContent });
        if (isMountedRef.current) setIsSaving(false);
      } catch (err) {
        console.error("Autosave failed:", err);
      }
    }, 1000); // 1-second debounce window
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutosave(val, editor?.getJSON());
  };

  const addImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        editor.chain().focus().setImage({ src: url }).run();
        triggerAutosave(title, editor.getJSON());
      } else {
        alert("Failed to upload image.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image.");
    }
  };

  const handleAiAction = async (action: "continue" | "summarize" | "improve" | "action_items") => {
    if (!editor || isAiWriting) return;
    const textContent = editor.getText();
    if (!textContent || textContent.trim() === "") {
      toast.error("Please add some text to your note before using Smart AI Writer.");
      return;
    }

    setIsAiWriting(true);
    setShowAiMenu(false);
    const toastId = toast.loading("Gemini AI Smart Writer working...");

    try {
      const res = await fetch("/api/notes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text: textContent, title }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isPremiumRequired) {
          toast.error(data.error || "Premium membership required.", { id: toastId });
        } else {
          toast.error(data.error || "AI Writing request failed.", { id: toastId });
        }
        return;
      }

      if (data.result) {
        if (action === "continue") {
          editor.chain().focus().insertContent(`\n\n${data.result}`).run();
        } else {
          editor.chain().focus().insertContent(`\n\n<hr /><p><strong>AI ${action.toUpperCase()}:</strong></p><p>${data.result.replace(/\n/g, "<br/>")}</p>`).run();
        }
        triggerAutosave(title, editor.getJSON());
        toast.success("AI Writing generated successfully!", { id: toastId });
      }
    } catch (err) {
      console.error(err);
      toast.error("Error generating AI content.", { id: toastId });
    } finally {
      setIsAiWriting(false);
    }
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = prompt("Enter URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    triggerAutosave(title, editor.getJSON());
  };

  if (!editor) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 text-white">
      {/* Editor Header / Title & Status */}
      <div className="h-16 border-b border-zinc-900 px-6 flex items-center justify-between shrink-0 bg-zinc-900/10">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="text-lg font-bold bg-transparent text-white focus:outline-none flex-1 placeholder-zinc-700 min-w-0"
          placeholder="Untitled Note"
        />

        <div className="flex items-center gap-3 ml-4 select-none shrink-0">
          {isSaving ? (
            <div className="flex items-center gap-1.5 text-[#8A8078] text-xs font-semibold">
              <Loader2 className="h-3 w-3 animate-spin text-[#F5B429]" />
              <span>Saving...</span>
            </div>
          ) : (
            <span className="text-[#8A8078] text-xs font-semibold">Saved</span>
          )}
        </div>
      </div>

      {/* Rich Text Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-3 border-b border-[#2E2118] bg-[#150F0B]/40 shrink-0 select-none relative">
        {/* Smart AI Writer Menu Button */}
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAiMenu(!showAiMenu)}
            disabled={isAiWriting}
            className="h-8 px-2.5 bg-[#F5B429]/10 border border-[#F5B429]/20 hover:bg-[#F5B429]/20 text-[#FCD34D] font-bold text-xs gap-1.5 rounded-full transition-all"
          >
            {isAiWriting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F5B429]" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-[#F5B429]" />
            )}
            <span>AI Writer</span>
            <ChevronDown className="h-3 w-3 text-[#F5B429]" />
          </Button>

          {showAiMenu && (
            <div className="absolute top-10 left-0 z-50 w-64 bg-[#150F0B] border border-[#2E2118] rounded-2xl p-1.5 shadow-2xl space-y-1">
              <button
                type="button"
                onClick={() => {
                  setShowAiMenu(false);
                  setShowTopicModal(true);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold bg-[#F5B429]/15 border border-[#F5B429]/30 text-[#FCD34D] hover:bg-[#F5B429]/25 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Wand2 className="h-3.5 w-3.5 text-[#F5B429]" />
                  <span>Generate Topic Note</span>
                </div>
                <span className="text-[9px] font-mono bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] px-1.5 py-0.5 rounded font-bold">2,000+ words</span>
              </button>
              <button
                type="button"
                onClick={() => handleAiAction("continue")}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#B8AFA6] hover:text-[#FAFAF8] hover:bg-[#241811] transition-colors text-left"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#F5B429]" />
                <span>Continue Writing</span>
              </button>
              <button
                type="button"
                onClick={() => handleAiAction("summarize")}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#B8AFA6] hover:text-[#FAFAF8] hover:bg-[#241811] transition-colors text-left"
              >
                <FileText className="h-3.5 w-3.5 text-[#F5941D]" />
                <span>Summarize Note</span>
              </button>
              <button
                type="button"
                onClick={() => handleAiAction("improve")}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Improve & Polish</span>
              </button>
              <button
                type="button"
                onClick={() => handleAiAction("action_items")}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left"
              >
                <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                <span>Extract Action Items</span>
              </button>
            </div>
          )}
        </div>

        <div className="w-[1px] h-5 bg-zinc-800 mx-1" />
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 ${editor.isActive("bold") ? "bg-zinc-800 text-white" : ""}`}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 ${editor.isActive("italic") ? "bg-zinc-800 text-white" : ""}`}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 ${editor.isActive("underline") ? "bg-zinc-800 text-white" : ""}`}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <div className="w-[1px] h-5 bg-zinc-800 mx-1" />

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 ${editor.isActive("heading", { level: 1 }) ? "bg-zinc-800 text-white" : ""}`}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 ${editor.isActive("heading", { level: 2 }) ? "bg-zinc-800 text-white" : ""}`}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 ${editor.isActive("heading", { level: 3 }) ? "bg-zinc-800 text-white" : ""}`}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-[1px] h-5 bg-zinc-800 mx-1" />

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 ${editor.isActive("bulletList") ? "bg-zinc-800 text-white" : ""}`}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 ${editor.isActive("orderedList") ? "bg-zinc-800 text-white" : ""}`}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 ${editor.isActive("codeBlock") ? "bg-zinc-800 text-white" : ""}`}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 ${editor.isActive("blockquote") ? "bg-zinc-800 text-white" : ""}`}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="w-[1px] h-5 bg-zinc-800 mx-1" />

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={setLink}
          className={`h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900 ${editor.isActive("link") ? "bg-zinc-800 text-white" : ""}`}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <label className="h-8 w-8 flex items-center justify-center cursor-pointer text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors">
          <ImageIcon className="h-4 w-4" />
          <input type="file" accept="image/*" onChange={addImage} className="hidden" />
        </label>

        <div className="w-[1px] h-5 bg-zinc-800 mx-1" />

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-900"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto px-10 py-8 pb-28 max-w-none focus:outline-none">
        <EditorContent editor={editor} className="h-full focus:outline-none min-h-[400px]" />
      </div>

      {/* Topic Generator Modal */}
      <TopicGeneratorModal
        isOpen={showTopicModal}
        onClose={() => setShowTopicModal(false)}
        onGenerate={async (newTopic, contentHtml) => {
          if (editor) {
            editor.commands.setContent(contentHtml);
            let updatedTitle = title;
            if (!title || title.trim() === "" || title === "Untitled Note") {
              updatedTitle = newTopic;
              setTitle(newTopic);
            }
            triggerAutosave(updatedTitle, editor.getJSON());
          }
        }}
      />
    </div>
  );
}
