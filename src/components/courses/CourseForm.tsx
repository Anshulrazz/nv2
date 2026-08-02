/* eslint-disable */
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
  FileText,
  Layers,
  ArrowRight,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export function CourseForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || "");
  const [price, setPrice] = useState<number>(initialData?.price || 0);
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false);
  const [modules, setModules] = useState<any[]>(initialData?.modules || []);

  // AI Course Generator Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLevel, setAiLevel] = useState("Intermediate");
  const [aiTargetAudience, setAiTargetAudience] = useState("Students & Developers");
  const [aiPrice, setAiPrice] = useState(0);
  const [aiInstructions, setAiInstructions] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);

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
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "AI Course Generation failed.");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleAddModule = () => {
    setModules([...modules, { title: "", lessons: [] }]);
  };

  const handleUpdateModule = (mIdx: number, key: string, value: any) => {
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

  const handleUpdateLesson = (mIdx: number, lIdx: number, key: string, value: any) => {
    const updated = [...modules];
    updated[mIdx].lessons[lIdx][key] = value;
    setModules(updated);
  };

  const handleRemoveLesson = (mIdx: number, lIdx: number) => {
    const updated = [...modules];
    updated[mIdx].lessons = updated[mIdx].lessons.filter((_: any, i: number) => i !== lIdx);
    setModules(updated);
  };

  const handleAddQuiz = (mIdx: number, lIdx: number) => {
    const updated = [...modules];
    updated[mIdx].lessons[lIdx].quiz.push({
      question: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
    });
    setModules(updated);
  };

  const handleUpdateQuiz = (mIdx: number, lIdx: number, qIdx: number, key: string, value: any) => {
    const updated = [...modules];
    updated[mIdx].lessons[lIdx].quiz[qIdx][key] = value;
    setModules(updated);
  };

  const handleUpdateQuizOption = (mIdx: number, lIdx: number, qIdx: number, oIdx: number, value: string) => {
    const updated = [...modules];
    updated[mIdx].lessons[lIdx].quiz[qIdx].options[oIdx] = value;
    setModules(updated);
  };

  const handleRemoveQuiz = (mIdx: number, lIdx: number, qIdx: number) => {
    const updated = [...modules];
    updated[mIdx].lessons[lIdx].quiz = updated[mIdx].lessons[lIdx].quiz.filter((_: any, i: number) => i !== qIdx);
    setModules(updated);
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
    } catch (err: any) {
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const creatorShare = Math.floor(price * 0.7);

  return (
    <form onSubmit={handleSubmit} className="space-y-10 pb-24">
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs font-medium flex items-center gap-3">
          <X className="size-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Course Generator Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-violet-600/10 to-amber-500/15 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                <Sparkles className="size-3.5 animate-pulse" /> AI GENERATOR (GEMINI & OPENROUTER)
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Auto-Generate 5000+ Word Course
            </h3>
            <p className="text-xs text-zinc-300 font-light max-w-xl leading-relaxed">
              Generate a complete multi-module curriculum, deep-dive lecture guides (5,000+ words), code examples, and practice quizzes in seconds.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setShowAIModal(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs h-12 px-7 rounded-2xl shadow-xl shadow-amber-500/25 shrink-0 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Wand2 className="size-4" />
            <span>Generate with AI</span>
          </Button>
        </div>
      </div>

      {/* AI Course Generator Modal */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="w-full max-w-xl bg-[#0b0b12] border border-amber-500/30 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Curriculum Builder</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">Gemini AI with OpenRouter Fallback</p>
                </div>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setShowAIModal(false)}
                disabled={generatingAI}
                className="size-9 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="size-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  Course Topic / Title *
                </label>
                <input
                  required
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Full Stack Next.js 15 & AI Web Development"
                  className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Target Difficulty Level
                  </label>
                  <select
                    value={aiLevel}
                    onChange={(e) => setAiLevel(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                    Course Price (Coins)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={aiPrice}
                    onChange={(e) => setAiPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0 for Free"
                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white font-mono outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  Target Audience
                </label>
                <input
                  value={aiTargetAudience}
                  onChange={(e) => setAiTargetAudience(e.target.value)}
                  placeholder="e.g. College Students, Web Developers"
                  className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
                  Special Focus / Instructions (Optional)
                </label>
                <textarea
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="e.g. Include code snippets in TypeScript, practice quizzes, and real-world project tasks..."
                  className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-amber-500 min-h-[90px] transition-colors"
                />
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  type="button"
                  onClick={(e: React.MouseEvent) => handleGenerateAICourse(e)}
                  disabled={generatingAI || !aiTopic.trim()}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-extrabold text-xs h-12 rounded-2xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  {generatingAI ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-zinc-950" />
                      <span>Generating 5000+ Word Course (Gemini & OpenRouter)...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="size-4" />
                      <span>Generate 5,000+ Word Course</span>
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-zinc-500 font-mono text-center">
                  Will generate 4-6 Modules, 12-20 detailed Lectures with Markdown notes & quizzes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Basic Course Details */}
      <div className="bg-zinc-950/60 p-6 sm:p-8 rounded-[2rem] border border-white/10 space-y-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="size-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold">
            <BookOpen className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Course Overview</h2>
            <p className="text-xs text-zinc-400 font-light">Title, description, thumbnail, and coin pricing.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Course Title *
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-violet-500 transition-colors"
              placeholder="e.g. Master Next.js 15 & AI Engineering"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
              Course Description *
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-violet-500 min-h-[110px] leading-relaxed transition-colors"
              placeholder="Provide a compelling course summary for students..."
            />
          </div>

          {/* Pricing & Creator Revenue Share Split */}
          <div className="space-y-3 p-5 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="size-4 text-emerald-400" /> Course Price (in Coins)
              </label>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                70% Creator / 30% Platform Split
              </span>
            </div>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-xs font-mono text-emerald-300 font-bold"
              placeholder="0 for Free Course"
            />
            <p className="text-[11px] text-zinc-400 leading-normal">
              Set to <strong>0</strong> for a free course. If set to paid (e.g. 200 coins), students unlock it using coins.
              <span className="text-emerald-400 font-semibold ml-1">
                You receive 70% ({creatorShare} coins)
              </span> on every enrollment!
            </p>
          </div>

          {/* Thumbnail Image URL or Upload */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="size-3.5 text-cyan-400" /> Thumbnail Cover Image
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                className="flex-1 bg-zinc-900/80 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                placeholder="https://example.com/cover.jpg"
              />
              <label className="bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-2xl px-4 py-2.5 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0">
                <UploadCloud className="size-4 text-cyan-400" /> Upload File
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, setThumbnail)}
                  className="hidden"
                />
              </label>
            </div>
            {thumbnail && (
              <div className="mt-2 h-32 w-full max-w-xs rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 relative">
                <img src={thumbnail} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-zinc-900 text-amber-500 focus:ring-amber-500/30"
            />
            <label htmlFor="isPublished" className="text-xs font-bold text-white cursor-pointer select-none">
              Publish this course instantly (make visible to all students in directory)
            </label>
          </div>
        </div>
      </div>

      {/* Curriculum & Modules */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              <Layers className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Course Curriculum</h2>
              <p className="text-xs text-zinc-400 font-light">Structure modules, lessons, and student quizzes.</p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAddModule}
            variant="outline"
            className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs font-bold rounded-2xl h-10 px-5 flex items-center gap-2"
          >
            <Plus className="size-4" /> Add Module
          </Button>
        </div>

        {modules.length === 0 && (
          <div className="p-10 text-center border border-dashed border-white/10 rounded-[2rem] bg-zinc-950/40 space-y-3">
            <BookOpen className="size-10 text-zinc-600 mx-auto" />
            <h3 className="text-sm font-bold text-white">No curriculum modules yet</h3>
            <p className="text-xs text-zinc-400 font-light max-w-sm mx-auto">
              Click &quot;Add Module&quot; above to build lessons manually, or use the &quot;Generate with AI&quot; banner at top!
            </p>
          </div>
        )}

        {modules.map((module, mIdx) => (
          <div
            key={mIdx}
            className="bg-zinc-950/80 p-6 sm:p-8 rounded-[2rem] border border-white/10 space-y-6 shadow-xl backdrop-blur-xl relative"
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-3 py-0.5 rounded-full border border-amber-500/30">
                    MODULE {mIdx + 1 < 10 ? `0${mIdx + 1}` : mIdx + 1}
                  </span>
                </div>
                <input
                  required
                  value={module.title}
                  onChange={(e) => handleUpdateModule(mIdx, "title", e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white font-bold outline-none focus:border-amber-500"
                  placeholder="Module Title (e.g. Introduction & Setup)"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleRemoveModule(mIdx)}
                className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl size-9 p-0 mt-6"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {/* Lessons List */}
            <div className="pl-2 sm:pl-4 border-l-2 border-amber-500/20 space-y-5 pt-2">
              {module.lessons?.map((lesson: any, lIdx: number) => (
                <div
                  key={lIdx}
                  className="bg-zinc-900/60 p-5 rounded-2xl border border-white/10 space-y-4 shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-mono font-bold text-cyan-400">
                        LESSON {lIdx + 1}
                      </span>
                      <input
                        required
                        value={lesson.title}
                        onChange={(e) => handleUpdateLesson(mIdx, lIdx, "title", e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-semibold outline-none focus:border-cyan-400"
                        placeholder="Lesson title"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleRemoveLesson(mIdx, lIdx)}
                      className="text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl size-8 p-0 mt-5"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>

                  {/* Text Notes Content (Markdown formatted) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Lesson Text Guide (Markdown supported)</span>
                      <span className="text-zinc-500 lowercase"># headers, ```code, KaTeX math</span>
                    </label>
                    <textarea
                      value={lesson.text}
                      onChange={(e) => handleUpdateLesson(mIdx, lIdx, "text", e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-cyan-400 min-h-[120px] font-mono leading-relaxed"
                      placeholder="Write detailed lesson content in Markdown..."
                    />
                  </div>

                  {/* Video & Photo Assets */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <Video className="size-3 text-cyan-400" /> Video URL or Upload (MP4)
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={lesson.videoUrl}
                          onChange={(e) => handleUpdateLesson(mIdx, lIdx, "videoUrl", e.target.value)}
                          className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
                          placeholder="https://example.com/video.mp4"
                        />
                        <label className="bg-zinc-950 hover:bg-zinc-800 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer shrink-0">
                          <UploadCloud className="size-3.5 text-cyan-400" />
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

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                        <ImageIcon className="size-3 text-violet-400" /> Photo Illustration URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={lesson.photoUrl}
                          onChange={(e) => handleUpdateLesson(mIdx, lIdx, "photoUrl", e.target.value)}
                          className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-violet-400"
                          placeholder="https://example.com/diagram.png"
                        />
                        <label className="bg-zinc-950 hover:bg-zinc-800 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer shrink-0">
                          <UploadCloud className="size-3.5 text-violet-400" />
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
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <HelpCircle className="size-3.5 text-emerald-400" /> Knowledge Check (Quiz)
                      </span>
                      <Button
                        type="button"
                        onClick={() => handleAddQuiz(mIdx, lIdx)}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-xl px-3"
                      >
                        <Plus className="size-3 mr-1" /> Add Question
                      </Button>
                    </div>

                    {lesson.quiz?.map((q: any, qIdx: number) => (
                      <div
                        key={qIdx}
                        className="bg-zinc-950/80 p-4 rounded-xl border border-white/10 space-y-3 relative"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleRemoveQuiz(mIdx, lIdx, qIdx)}
                          className="absolute top-3 right-3 size-7 p-0 text-zinc-500 hover:text-rose-400"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                        <div className="space-y-1 pr-8">
                          <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
                            Question {qIdx + 1}
                          </label>
                          <input
                            required
                            value={q.question}
                            onChange={(e) => handleUpdateQuiz(mIdx, lIdx, qIdx, "question", e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                            placeholder="Enter quiz question..."
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt: string, oIdx: number) => (
                            <div
                              key={oIdx}
                              className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                                q.correctOptionIndex === oIdx
                                  ? "bg-emerald-500/10 border-emerald-500/40"
                                  : "bg-zinc-900/60 border-white/5"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`correct-${mIdx}-${lIdx}-${qIdx}`}
                                checked={q.correctOptionIndex === oIdx}
                                onChange={() => handleUpdateQuiz(mIdx, lIdx, qIdx, "correctOptionIndex", oIdx)}
                                className="h-3.5 w-3.5 accent-emerald-500 cursor-pointer"
                              />
                              <input
                                required
                                value={opt}
                                onChange={(e) => handleUpdateQuizOption(mIdx, lIdx, qIdx, oIdx, e.target.value)}
                                className="w-full bg-transparent text-xs text-white outline-none"
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
                className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 rounded-xl text-xs font-bold h-9 px-4"
              >
                <Plus className="size-3.5 mr-1.5" /> Add Lesson
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/teacher/courses")}
          className="text-xs font-mono text-zinc-400 hover:text-white"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs h-12 px-8 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin text-zinc-950" />
          ) : (
            <>
              <CheckCircle className="size-4 text-zinc-950" />
              <span>{initialData ? "Update Course" : "Create & Publish Course"}</span>
              <ArrowRight className="size-4 text-zinc-950" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
