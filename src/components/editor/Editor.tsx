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
import { FeaturePremiumModal } from "@/components/premium/FeaturePremiumModal";
import { PremiumUpgradeModal } from "@/components/premium/PremiumUpgradeModal";
import { Pen, Brain, FileCheck } from "lucide-react";

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
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isUpgradeCheckoutOpen, setIsUpgradeCheckoutOpen] = useState(false);
  const [premiumErrorMessage, setPremiumErrorMessage] = useState("");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);

  // Initialise TipTap instance
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false,
        underline: false,
      }),
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

  const triggerAutosave = (newTitle: string, newContent?: JSONContent) => {
    setIsSaving(true);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onSave({
          title: newTitle,
          ...(newContent !== undefined ? { content: newContent } : {}),
        });
        if (isMountedRef.current) setIsSaving(false);
      } catch (err) {
        console.error("Autosave failed:", err);
      }
    }, 1000);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutosave(val, editor?.getJSON());
  };

  const addImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const toastId = toast.loading("Uploading image...");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      editor.chain().focus().setImage({ src: data.url }).run();
      toast.success("Image inserted!", { id: toastId });
      triggerAutosave(title, editor.getJSON());
    } catch {
      toast.error("Failed to upload image", { id: toastId });
    }
  };

  const handleAiAction = async (action: "continue" | "summary" | "format") => {
    if (!editor || isAiWriting) return;
    setIsAiWriting(true);
    setShowAiMenu(false);

    const fullContent = editor.getText();
    const actionDescriptions = {
      continue: "Generating next section...",
      summary: "Drafting study summary...",
      format: "Polishing academic notes...",
    };

    const toastId = toast.loading(actionDescriptions[action]);

    try {
      const res = await fetch("/api/notes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          prompt: fullContent,
          title,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isPremiumRequired || res.status === 403) {
          setPremiumErrorMessage(data.error || "Smart AI Notes Writing is an exclusive Premium feature. Upgrade to unlock AI Superpowers!");
          setIsPremiumModalOpen(true);
          toast.dismiss(toastId);
          return;
        }
        throw new Error(data.error || "AI generation failed");
      }

      if (action === "continue") {
        editor.chain().focus().insertContent(`<p>${data.result}</p>`).run();
      } else if (action === "summary") {
        editor
          .chain()
          .focus()
          .insertContent(`<h3>Key Study Summary</h3><p>${data.result}</p>`)
          .run();
      } else if (action === "format") {
        editor.commands.setContent(data.result);
      }

      toast.success("AI draft completed!", { id: toastId });
      triggerAutosave(title, editor.getJSON());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to run AI action";
      toast.error(msg, { id: toastId });
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
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-bg-base text-text-primary">
      {/* Editor Header / Title & Status */}
      <div className="h-14 border-b border-border-subtle px-4 sm:px-6 flex items-center justify-between shrink-0 bg-bg-surface">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="text-base sm:text-lg font-bold bg-transparent text-text-primary focus:outline-none flex-1 placeholder:text-text-muted min-w-0 font-display"
          placeholder="Untitled Note"
        />

        <div className="flex items-center gap-2 ml-4 select-none shrink-0 font-mono text-[11px]">
          {isSaving ? (
            <div className="flex items-center gap-1.5 text-accent-primary">
              <Loader2 className="size-3 animate-spin" />
              <span>Saving</span>
            </div>
          ) : (
            <span className="text-text-muted">Saved</span>
          )}
        </div>
      </div>

      {/* Rich Text Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 px-4 sm:px-6 border-b border-border-subtle bg-bg-surface/50 shrink-0 select-none relative">
        {/* Smart AI Writer Menu Button */}
        <div className="relative mr-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAiMenu(!showAiMenu)}
            disabled={isAiWriting}
            className="h-8 px-2.5 bg-accent-primary/10 border border-accent-primary/25 hover:bg-accent-primary/20 text-accent-primary font-semibold text-xs gap-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {isAiWriting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            <span>AI Writer</span>
            <ChevronDown className="size-3" />
          </Button>

          {showAiMenu && (
            <div className="absolute top-9 left-0 z-50 w-56 bg-bg-surface border border-border-subtle rounded-xl p-1 shadow-2xl space-y-0.5 animate-in fade-in duration-100">
              <button
                type="button"
                onClick={() => {
                  setShowAiMenu(false);
                  setShowTopicModal(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-accent-primary hover:bg-bg-elevated transition-colors text-left cursor-pointer"
              >
                <Wand2 className="size-3.5 shrink-0" />
                <span>Generate Deep Note</span>
              </button>

              <button
                type="button"
                onClick={() => handleAiAction("continue")}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors text-left cursor-pointer"
              >
                <FileText className="size-3.5 shrink-0" />
                <span>Continue Writing</span>
              </button>

              <button
                type="button"
                onClick={() => handleAiAction("summary")}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors text-left cursor-pointer"
              >
                <CheckSquare className="size-3.5 shrink-0" />
                <span>Add Study Summary</span>
              </button>

              <button
                type="button"
                onClick={() => handleAiAction("format")}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors text-left cursor-pointer"
              >
                <Sparkles className="size-3.5 shrink-0" />
                <span>Format &amp; Polish Note</span>
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        {/* Formatting Actions */}
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`size-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer ${
            editor.isActive("bold") ? "bg-bg-elevated text-accent-primary font-bold" : ""
          }`}
          aria-label="Bold"
        >
          <Bold className="size-3.5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`size-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer ${
            editor.isActive("italic") ? "bg-bg-elevated text-accent-primary font-bold" : ""
          }`}
          aria-label="Italic"
        >
          <Italic className="size-3.5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`size-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer ${
            editor.isActive("underline") ? "bg-bg-elevated text-accent-primary font-bold" : ""
          }`}
          aria-label="Underline"
        >
          <UnderlineIcon className="size-3.5" />
        </Button>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`size-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer ${
            editor.isActive("heading", { level: 1 }) ? "bg-bg-elevated text-accent-primary font-bold" : ""
          }`}
          aria-label="Heading 1"
        >
          <Heading1 className="size-3.5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`size-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer ${
            editor.isActive("heading", { level: 2 }) ? "bg-bg-elevated text-accent-primary font-bold" : ""
          }`}
          aria-label="Heading 2"
        >
          <Heading2 className="size-3.5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`size-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer ${
            editor.isActive("heading", { level: 3 }) ? "bg-bg-elevated text-accent-primary font-bold" : ""
          }`}
          aria-label="Heading 3"
        >
          <Heading3 className="size-3.5" />
        </Button>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`size-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer ${
            editor.isActive("bulletList") ? "bg-bg-elevated text-accent-primary font-bold" : ""
          }`}
          aria-label="Bullet list"
        >
          <List className="size-3.5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`size-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer ${
            editor.isActive("orderedList") ? "bg-bg-elevated text-accent-primary font-bold" : ""
          }`}
          aria-label="Numbered list"
        >
          <ListOrdered className="size-3.5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`size-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer ${
            editor.isActive("codeBlock") ? "bg-bg-elevated text-accent-primary font-bold" : ""
          }`}
          aria-label="Code block"
        >
          <Code className="size-3.5" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`size-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer ${
            editor.isActive("blockquote") ? "bg-bg-elevated text-accent-primary font-bold" : ""
          }`}
          aria-label="Quote"
        >
          <Quote className="size-3.5" />
        </Button>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={setLink}
          className={`size-8 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer ${
            editor.isActive("link") ? "bg-bg-elevated text-accent-primary font-bold" : ""
          }`}
          aria-label="Link"
        >
          <LinkIcon className="size-3.5" />
        </Button>

        <label className="size-8 flex items-center justify-center cursor-pointer text-text-secondary hover:text-text-primary hover:bg-bg-elevated rounded-lg transition-colors">
          <ImageIcon className="size-3.5" />
          <input type="file" accept="image/*" onChange={addImage} className="hidden" />
        </label>

        <div className="w-px h-4 bg-border-subtle mx-1" />

        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="size-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated cursor-pointer"
          aria-label="Undo"
        >
          <Undo className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="size-8 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated cursor-pointer"
          aria-label="Redo"
        >
          <Redo className="size-3.5" />
        </Button>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-12 lg:px-16 py-8 pb-32 max-w-4xl mx-auto w-full focus:outline-none custom-scroll">
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

      {/* Premium Upgrade Modal for AI Notes */}
      <FeaturePremiumModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        onUpgrade={() => {
          setIsPremiumModalOpen(false);
          setIsUpgradeCheckoutOpen(true);
        }}
        title="Unlock Smart AI Notes"
        badge="PREMIUM EXCLUSIVE"
        errorMessage={premiumErrorMessage}
        features={[
          {
            title: "AI Continue Writing",
            desc: "Let AI draft the next section of your notes based on context.",
            icon: Pen,
            badge: "Auto-Draft",
            color: "from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-500/30",
          },
          {
            title: "Smart Summaries",
            desc: "Generate concise key-study summaries from your full notes.",
            icon: Brain,
            badge: "Quick Recall",
            color: "from-yellow-500/20 to-amber-500/10 text-yellow-400 border-yellow-500/30",
          },
          {
            title: "Academic Formatter",
            desc: "Auto-format notes with proper headings, structure, and citations.",
            icon: FileCheck,
            badge: "Polish",
            color: "from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30",
          },
        ]}
      />

      <PremiumUpgradeModal
        isOpen={isUpgradeCheckoutOpen}
        onClose={() => setIsUpgradeCheckoutOpen(false)}
        onSuccess={() => {
          setIsUpgradeCheckoutOpen(false);
          toast.success("🎉 Premium active! AI Notes features unlocked.");
        }}
      />
    </div>
  );
}
