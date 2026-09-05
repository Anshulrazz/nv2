/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  Sparkles,
  Wand2,
  X,
  BookOpen,
  Video,
  Image as ImageIcon,
  HelpCircle,
  Coins,
  UploadCloud,
  Layers,
  ArrowRight,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

export interface CourseQuizItem {
  question: string;
  options: string[];
  correctOptionIndex: number;
  [key: string]: unknown;
}

export interface CourseLessonItem {
  title: string;
  text?: string;
  videoUrl?: string;
  photoUrl?: string;
  quiz?: CourseQuizItem[];
  [key: string]: unknown;
}

export interface CourseModuleItem {
  title: string;
  lessons: CourseLessonItem[];
  [key: string]: unknown;
}

export function CourseForm({ initialData = null }: { initialData?: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || "");
  const [price, setPrice] = useState<number>(initialData?.price || 0);
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false);
  const [modules, setModules] = useState<CourseModuleItem[]>(initialData?.modules || []);

  // AI Course Generator Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLevel, setAiLevel] = useState("Intermediate");
  const [aiTargetAudience, setAiTargetAudience] = useState("Students & Developers");
  const [aiPrice, setAiPrice] = useState(0);
  const [aiInstructions, setAiInstructions] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);

  // Mobile preview toggle
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  const handleGenerateAICourse = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!aiTopic.trim()) return;

    setGeneratingAI(true);
    try {
      const res = await fetch("/api/courses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          level: aiLevel,
          targetAudience: aiTargetAudience,
          price: aiPrice,
          additionalInstructions: aiInstructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate course with AI.");

      if (data.course) {
        if (data.course.title) setTitle(data.course.title);
        if (data.course.description) setDescription(data.course.description);
        if (typeof data.course.price === "number") setPrice(data.course.price);
        if (Array.isArray(data.course.modules) && data.course.modules.length > 0) {
          setModules(data.course.modules);
        }
        toast.success("🎉 Course successfully generated with 5,000+ words across modules and quizzes!");
        setShowAIModal(false);
      }
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      console.error(err);
      toast.error(err.message || "AI Course Generation failed.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleAddModule = () => {
    setModules([...modules, { title: "", lessons: [] }]);
  };

  const handleUpdateModule = (mIdx: number, key: string, value: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    const updated = [...modules];
    updated[mIdx][key] = value;
    setModules(updated);
  };

  const handleRemoveModule = (mIdx: number) => {
    setModules(modules.filter((_, i) => i !== mIdx));
  };

  const handleAddLesson = (mIdx: number) => {
    const updated = [...modules];
    updated[mIdx].lessons.push({ title: "", text: "", videoUrl: "", photoUrl: "", quiz: [] });
    setModules(updated);
  };

  const handleUpdateLesson = (mIdx: number, lIdx: number, key: string, value: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    const updated = [...modules];
    updated[mIdx].lessons[lIdx][key] = value;
    setModules(updated);
  };

  const handleRemoveLesson = (mIdx: number, lIdx: number) => {
    const updated = [...modules];
    updated[mIdx].lessons = updated[mIdx].lessons.filter((_, i: number) => i !== lIdx);
    setModules(updated);
  };

  const handleAddQuiz = (mIdx: number, lIdx: number) => {
    const updated = [...modules];
    if (!updated[mIdx].lessons[lIdx].quiz) {
      updated[mIdx].lessons[lIdx].quiz = [];
    }
    updated[mIdx].lessons[lIdx].quiz.push({
      question: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
    });
    setModules(updated);
  };

  const handleUpdateQuiz = (mIdx: number, lIdx: number, qIdx: number, key: string, value: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => {
    const updated = [...modules];
    const quiz = updated[mIdx]?.lessons[lIdx]?.quiz;
    if (quiz && quiz[qIdx]) {
      (quiz[qIdx] as Record<string, unknown>)[key] = value;
      setModules(updated);
    }
  };

  const handleUpdateQuizOption = (mIdx: number, lIdx: number, qIdx: number, oIdx: number, value: string) => {
    const updated = [...modules];
    const quiz = updated[mIdx]?.lessons[lIdx]?.quiz;
    if (quiz && quiz[qIdx]) {
      quiz[qIdx].options[oIdx] = value;
      setModules(updated);
    }
  };

  const handleRemoveQuiz = (mIdx: number, lIdx: number, qIdx: number) => {
    const updated = [...modules];
    if (updated[mIdx].lessons[lIdx].quiz) {
      updated[mIdx].lessons[lIdx].quiz = updated[mIdx].lessons[lIdx].quiz!.filter((_, i: number) => i !== qIdx);
      setModules(updated);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      callback(data.url);
      toast.success("File uploaded successfully!");
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      toast.error(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = { title, description, thumbnail, isPublished, price, modules };

      const url = initialData ? `/api/courses/${initialData._id}` : "/api/courses";
      const method = initialData ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save course");
      }

      toast.success(initialData ? "Course updated!" : "Course created successfully! 🎉");
      router.push("/teacher/courses");
    } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      setError(err.message || "Failed to save course");
      toast.error(err.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  const creatorShare = Math.floor(price * 0.7);
  const totalLessonCount = modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-xs font-medium flex items-center gap-3">
          <X className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Two-Column Creator Layout (8 cols editor + 4 cols live preview on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Editor & Curriculum Builder */}
        <div className="lg:col-span-8 space-y-8 min-w-0">
          {/* AI Course Generator Banner */}
          <div className="rounded-2xl border border-accent-primary/30 bg-bg-surface p-6 sm:p-7 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-accent-primary bg-accent-primary/15 px-2.5 py-0.5 rounded-full border border-accent-primary/25 flex items-center gap-1.5">
                    <Sparkles className="size-3 animate-pulse" /> AI Curriculum Generator
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-text-primary tracking-tight font-display">
                  Auto-Generate 5,000+ Word Course
                </h3>
                <p className="text-xs text-text-muted font-light max-w-xl leading-relaxed">
                  Draft a complete multi-module curriculum, deep-dive lecture notes, code examples, and practice quizzes in seconds using Gemini AI.
                </p>
              </div>

              <Button
                type="button"
                onClick={() => setShowAIModal(true)}
                className="btn-premium-primary text-xs h-10 px-5 rounded-xl shrink-0 flex items-center gap-2 font-bold cursor-pointer"
              >
                <Wand2 className="size-3.5" />
                <span>Generate with AI</span>
              </Button>
            </div>
          </div>

          {/* Section 1: Course Overview */}
          <div className="bg-bg-surface p-6 sm:p-8 rounded-2xl border border-border-subtle space-y-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
              <div className="size-9 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-primary font-bold shrink-0">
                <BookOpen className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary font-display">Course Overview</h2>
                <p className="text-xs text-text-muted">Title, description, pricing, and cover thumbnail.</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider block">
                  Course Title *
                </label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-text-primary outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/25 transition-colors"
                  placeholder="e.g. Advanced Quantum Computing & Algorithms"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider block">
                  Course Description *
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-2.5 text-xs text-text-primary outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/25 min-h-[100px] leading-relaxed transition-colors resize-y"
                  placeholder="Provide a compelling course summary for students..."
                />
              </div>

              {/* Pricing & Creator Revenue Share Split */}
              <div className="space-y-3 p-4 bg-bg-elevated/70 border border-border-subtle rounded-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="size-4 text-accent-primary" /> Course Price (Coins)
                  </label>
                  <span className="text-[10px] font-mono text-success font-bold bg-success/15 px-2.5 py-0.5 rounded-full border border-success/25">
                    70% Creator / 30% Platform Split
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-48 bg-bg-base border border-border-subtle rounded-xl px-4 py-2 outline-none focus:border-accent-primary text-xs font-mono text-text-primary font-bold"
                    placeholder="0 for Free Course"
                  />
                  <span className="text-xs font-mono text-text-muted">
                    {price === 0 ? "Free for all students" : `You earn +${creatorShare} coins per enrollment`}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Set to <strong>0</strong> for a free public course. For paid courses, students unlock with coins and 70% of the coin value is deposited into your withrawable wallet.
                </p>
              </div>

              {/* Thumbnail Image URL or Upload */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="size-3.5 text-accent-primary" /> Thumbnail Cover Image
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    className="flex-1 bg-bg-base border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-text-primary outline-none focus:border-accent-primary"
                    placeholder="https://images.unsplash.com/... or upload image"
                  />
                  <label className="bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle rounded-xl px-3.5 py-2 text-xs font-medium text-text-primary flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0">
                    <UploadCloud className="size-3.5 text-accent-primary" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e, setThumbnail)}
                      className="hidden"
                    />
                  </label>
                </div>
                {thumbnail && (
                  <div className="mt-2 h-28 w-48 rounded-xl overflow-hidden border border-border-subtle bg-bg-base relative">
                    <img src={thumbnail} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Publish Toggle */}
              <div className="flex items-center gap-3 pt-3 border-t border-border-subtle">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="size-4 rounded border-border-subtle bg-bg-base accent-accent-primary cursor-pointer"
                />
                <label htmlFor="isPublished" className="text-xs font-semibold text-text-primary cursor-pointer select-none">
                  Publish instantly to public course catalog
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Curriculum Builder */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-accent-secondary/15 border border-accent-secondary/25 flex items-center justify-center text-accent-secondary font-bold shrink-0">
                  <Layers className="size-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary font-display">Course Curriculum</h2>
                  <p className="text-xs text-text-muted">Structured modules, lessons, notes, and quizzes.</p>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddModule}
                variant="outline"
                className="border-border-subtle hover:bg-bg-elevated text-text-primary text-xs font-mono font-medium rounded-xl h-9 px-3.5 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="size-3.5 text-accent-primary" />
                <span>Add Module</span>
              </Button>
            </div>

            {modules.length === 0 && (
              <div className="p-8 text-center border border-dashed border-border-subtle rounded-2xl bg-bg-surface space-y-2.5">
                <BookOpen className="size-8 text-text-muted mx-auto" />
                <h3 className="text-xs font-bold text-text-primary">No curriculum modules yet</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Click &ldquo;Add Module&rdquo; to build lessons manually, or use the &ldquo;Generate with AI&rdquo; banner above!
                </p>
              </div>
            )}

            {modules.map((module, mIdx) => (
              <div
                key={mIdx}
                className="bg-bg-surface p-5 sm:p-7 rounded-2xl border border-border-subtle space-y-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border-subtle pb-3.5">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-accent-primary/15 text-accent-primary px-2.5 py-0.5 rounded-full border border-accent-primary/25">
                        MODULE {mIdx + 1 < 10 ? `0${mIdx + 1}` : mIdx + 1}
                      </span>
                    </div>
                    <input
                      required
                      value={module.title}
                      onChange={(e) => handleUpdateModule(mIdx, "title", e.target.value)}
                      className="w-full bg-bg-base border border-border-subtle rounded-xl px-3.5 py-2 text-xs text-text-primary font-bold outline-none focus:border-accent-primary"
                      placeholder="Module Title (e.g. Fundamentals & Core Architecture)"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleRemoveModule(mIdx)}
                    className="text-text-muted hover:text-destructive hover:bg-destructive/10 rounded-xl size-8 p-0 mt-5 cursor-pointer"
                    aria-label="Remove Module"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {/* Lessons List within Module */}
                <div className="pl-2 sm:pl-4 border-l-2 border-accent-primary/20 space-y-4 pt-1">
                  {module.lessons?.map((lesson: CourseLessonItem, lIdx: number) => (
                    <div
                      key={lIdx}
                      className="bg-bg-elevated/50 p-4 rounded-xl border border-border-subtle space-y-3.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <span className="text-[10px] font-mono font-bold text-accent-secondary">
                            LESSON {lIdx + 1}
                          </span>
                          <input
                            required
                            value={lesson.title}
                            onChange={(e) => handleUpdateLesson(mIdx, lIdx, "title", e.target.value)}
                            className="w-full bg-bg-base border border-border-subtle rounded-xl px-3 py-1.5 text-xs text-text-primary font-semibold outline-none focus:border-accent-primary"
                            placeholder="Lesson Title"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleRemoveLesson(mIdx, lIdx)}
                          className="text-text-muted hover:text-destructive hover:bg-destructive/10 rounded-lg size-7 p-0 mt-4 cursor-pointer"
                          aria-label="Remove Lesson"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>

                      {/* Text Notes Content (Markdown formatted) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
                          <span>Lecture Notes & Guide (Markdown)</span>
                          <span className="text-text-muted/70 font-normal lowercase">headers, code, lists</span>
                        </label>
                        <textarea
                          value={lesson.text}
                          onChange={(e) => handleUpdateLesson(mIdx, lIdx, "text", e.target.value)}
                          className="w-full bg-bg-base border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-primary outline-none focus:border-accent-primary min-h-[100px] font-mono leading-relaxed"
                          placeholder="Write comprehensive lesson content..."
                        />
                      </div>

                      {/* Video & Photo Assets */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                            <Video className="size-3 text-accent-primary" /> Video Lecture (URL/MP4)
                          </label>
                          <div className="flex gap-2">
                            <input
                              value={lesson.videoUrl}
                              onChange={(e) => handleUpdateLesson(mIdx, lIdx, "videoUrl", e.target.value)}
                              className="flex-1 bg-bg-base border border-border-subtle rounded-xl px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent-primary"
                              placeholder="https://... video link"
                            />
                            <label className="bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-text-primary flex items-center gap-1 cursor-pointer shrink-0">
                              <UploadCloud className="size-3.5 text-accent-primary" />
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) =>
                                  handleUpload(e, (url) => handleUpdateLesson(mIdx, lIdx, "videoUrl", url))
                                }
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
                            <ImageIcon className="size-3 text-accent-secondary" /> Diagram / Graphic
                          </label>
                          <div className="flex gap-2">
                            <input
                              value={lesson.photoUrl}
                              onChange={(e) => handleUpdateLesson(mIdx, lIdx, "photoUrl", e.target.value)}
                              className="flex-1 bg-bg-base border border-border-subtle rounded-xl px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent-primary"
                              placeholder="https://... image link"
                            />
                            <label className="bg-bg-elevated hover:bg-bg-elevated/80 border border-border-subtle rounded-xl px-2.5 py-1.5 text-xs text-text-primary flex items-center gap-1 cursor-pointer shrink-0">
                              <UploadCloud className="size-3.5 text-accent-secondary" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handleUpload(e, (url) => handleUpdateLesson(mIdx, lIdx, "photoUrl", url))
                                }
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Knowledge Checks (Quizzes) */}
                      <div className="pt-2 border-t border-border-subtle space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono font-bold text-text-primary uppercase tracking-wider flex items-center gap-1">
                            <HelpCircle className="size-3 text-accent-primary" /> Knowledge Check (Quiz)
                          </span>
                          <Button
                            type="button"
                            onClick={() => handleAddQuiz(mIdx, lIdx)}
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px] text-accent-primary hover:bg-accent-primary/10 rounded-lg px-2 cursor-pointer font-mono"
                          >
                            <Plus className="size-3 mr-1" /> Add Question
                          </Button>
                        </div>

                        {lesson.quiz?.map((q: CourseQuizItem, qIdx: number) => (
                          <div
                            key={qIdx}
                            className="bg-bg-base p-3.5 rounded-xl border border-border-subtle space-y-2.5 relative"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleRemoveQuiz(mIdx, lIdx, qIdx)}
                              className="absolute top-2.5 right-2.5 size-6 p-0 text-text-muted hover:text-destructive cursor-pointer"
                              aria-label="Remove Question"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                            <div className="space-y-1 pr-7">
                              <label className="text-[10px] font-mono text-text-muted font-bold uppercase">
                                Question {qIdx + 1}
                              </label>
                              <input
                                required
                                value={q.question}
                                onChange={(e) => handleUpdateQuiz(mIdx, lIdx, qIdx, "question", e.target.value)}
                                className="w-full bg-bg-surface border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent-primary"
                                placeholder="Enter question prompt..."
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {q.options.map((opt: string, oIdx: number) => (
                                <div
                                  key={oIdx}
                                  className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                    q.correctOptionIndex === oIdx
                                      ? "bg-accent-primary/10 border-accent-primary/30"
                                      : "bg-bg-surface border-border-subtle"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`correct-${mIdx}-${lIdx}-${qIdx}`}
                                    checked={q.correctOptionIndex === oIdx}
                                    onChange={() => handleUpdateQuiz(mIdx, lIdx, qIdx, "correctOptionIndex", oIdx)}
                                    className="size-3.5 accent-accent-primary cursor-pointer"
                                  />
                                  <input
                                    required
                                    value={opt}
                                    onChange={(e) => handleUpdateQuizOption(mIdx, lIdx, qIdx, oIdx, e.target.value)}
                                    className="w-full bg-transparent text-xs text-text-primary outline-none"
                                    placeholder={`Option ${oIdx + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    onClick={() => handleAddLesson(mIdx)}
                    variant="outline"
                    size="sm"
                    className="border-border-subtle hover:bg-bg-elevated rounded-xl text-xs font-mono h-8 px-3.5 cursor-pointer text-text-secondary"
                  >
                    <Plus className="size-3 mr-1 text-accent-primary" />
                    <span>Add Lesson</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="pt-4 border-t border-border-subtle flex items-center justify-between gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/teacher/courses")}
              className="text-xs font-mono text-text-muted hover:text-text-primary cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="btn-premium-primary text-xs h-11 px-7 flex items-center justify-center gap-2 font-bold cursor-pointer"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="size-4" />
                  <span>{initialData ? "Save & Update Course" : "Publish Course to Catalog"}</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column: Live Student Preview (Sticky on Desktop) */}
        <div className="lg:col-span-4 sticky top-6 space-y-6">
          {/* Preview Header / Toggle for Mobile */}
          <div className="flex items-center justify-between lg:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className="w-full rounded-xl border-border-subtle text-xs font-mono py-2 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eye className="size-3.5 text-accent-primary" />
              <span>{showMobilePreview ? "Hide Student Preview" : "Show Student Preview"}</span>
              {showMobilePreview ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </Button>
          </div>

          <div className={`space-y-6 ${showMobilePreview ? "block" : "hidden lg:block"}`}>
            {/* Live Student Course Card Preview */}
            <div className="rounded-2xl bg-bg-surface border border-border-subtle overflow-hidden shadow-xl space-y-4">
              <div className="px-5 pt-4 pb-1 border-b border-border-subtle flex items-center justify-between text-xs font-mono text-text-muted">
                <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-accent-primary">
                  <Eye className="size-3" /> Student Card Preview
                </span>
                <span className="text-[10px]">Live Catalog Card</span>
              </div>

              <div className="p-5 pt-2 space-y-4">
                {/* Thumbnail Preview */}
                <div className="relative aspect-video rounded-xl bg-bg-base border border-border-subtle overflow-hidden flex items-center justify-center">
                  {thumbnail ? (
                    <img src={thumbnail} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-text-muted">
                      <BookOpen className="size-8 text-border-default" />
                      <span className="text-[10px] font-mono">No cover uploaded</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5">
                    {isPublished ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-success/90 text-bg-base shadow">
                        <CheckCircle2 className="size-2.5" /> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-warning/90 text-bg-base shadow">
                        <Clock className="size-2.5" /> Draft
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Info */}
                <div className="space-y-2">
                  <h3 className="font-bold text-sm text-text-primary line-clamp-2 leading-snug font-display">
                    {title || "Untitled Course Title"}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-2 leading-relaxed font-light">
                    {description || "Course description summary will appear here as students browse the public catalog..."}
                  </p>
                </div>

                {/* Price & Modules summary */}
                <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1 font-bold text-text-primary">
                    <Coins className="size-3.5 text-accent-primary" />
                    <span>{price > 0 ? `${price} Coins` : "Free"}</span>
                  </div>
                  <span className="text-text-muted text-[11px]">
                    {modules.length} {modules.length === 1 ? "Module" : "Modules"} · {totalLessonCount} Lessons
                  </span>
                </div>
              </div>
            </div>

            {/* Creator Earnings Breakdown Card */}
            <div className="rounded-2xl bg-bg-surface border border-border-subtle p-5 space-y-3.5 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-text-primary uppercase tracking-wider">
                <ShieldCheck className="size-4 text-success" />
                <span>Creator Revenue Split</span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-border-subtle/50 text-text-muted">
                  <span>Student Enrollment Price:</span>
                  <span className="text-text-primary font-bold">{price} Coins</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle/50 text-success">
                  <span>Your 70% Share:</span>
                  <span className="font-bold">+{creatorShare} Coins</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle/50 text-text-muted">
                  <span>Cash Value:</span>
                  <span className="text-text-primary">₹{creatorShare}</span>
                </div>
              </div>

              <p className="text-[11px] text-text-muted leading-relaxed font-light">
                Earnings are credited to your creator balance as soon as a student enrolls. Request cash withdrawals to your UPI or bank account anytime.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Course Generator Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-bg-surface border border-border-default rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-accent-primary/15 border border-accent-primary/25 flex items-center justify-center text-accent-primary shrink-0">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary font-display">AI Curriculum Builder</h3>
                  <p className="text-[11px] text-text-muted font-mono">Gemini AI with OpenRouter Fallback</p>
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setShowAIModal(false)}
                disabled={generatingAI}
                className="size-8 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-elevated cursor-pointer"
                aria-label="Close modal"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-mono font-bold text-text-muted uppercase tracking-wider block">
                  Course Topic / Title *
                </label>
                <input
                  required
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Master Next.js 15 & AI Engineering"
                  className="w-full bg-bg-base border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-none focus:border-accent-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="font-mono font-bold text-text-muted uppercase tracking-wider block">
                    Target Difficulty
                  </label>
                  <select
                    value={aiLevel}
                    onChange={(e) => setAiLevel(e.target.value)}
                    className="w-full bg-bg-base border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-none focus:border-accent-primary"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono font-bold text-text-muted uppercase tracking-wider block">
                    Course Price (Coins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={aiPrice}
                    onChange={(e) => setAiPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0 for Free"
                    className="w-full bg-bg-base border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-text-primary font-mono outline-none focus:border-accent-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono font-bold text-text-muted uppercase tracking-wider block">
                  Target Audience
                </label>
                <input
                  value={aiTargetAudience}
                  onChange={(e) => setAiTargetAudience(e.target.value)}
                  placeholder="e.g. Engineering Students, Developers"
                  className="w-full bg-bg-base border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-none focus:border-accent-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono font-bold text-text-muted uppercase tracking-wider block">
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="e.g. Include real-world system architecture diagrams, code walk-throughs, and practice quizzes..."
                  className="w-full bg-bg-base border border-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-text-primary outline-none focus:border-accent-primary min-h-[75px]"
                />
              </div>

              <div className="pt-3 space-y-2">
                <Button
                  type="button"
                  onClick={(e: React.MouseEvent) => handleGenerateAICourse(e)}
                  disabled={generatingAI || !aiTopic.trim()}
                  className="btn-premium-primary w-full text-xs h-11 rounded-xl flex items-center justify-center gap-2 font-bold cursor-pointer"
                >
                  {generatingAI ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Generating 5,000+ Word Course...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-4" />
                      <span>Generate 5,000+ Word Course</span>
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-text-muted font-mono text-center">
                  Will generate 4-6 Modules and multiple detailed Lectures with Markdown notes & quizzes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

