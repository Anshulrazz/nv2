"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

export function CourseForm({ initialData = null }: { initialData?: any }) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || "");
  const [isPublished, setIsPublished] = useState(initialData?.isPublished || false);
  const [modules, setModules] = useState<any[]>(initialData?.modules || []);

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
      correctOptionIndex: 0
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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = { title, description, thumbnail, isPublished, modules };
      
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

      router.push("/teacher/courses");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-sidebar/30 p-6 rounded-2xl border border-border/40 space-y-4">
        <h2 className="text-xl font-bold">Course Details</h2>
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Title *</label>
          <input
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-violet-500"
            placeholder="e.g. Advanced TypeScript"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Description *</label>
          <textarea
            required
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-violet-500 min-h-[100px]"
            placeholder="Course description..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-foreground">Thumbnail URL or Upload</label>
          <div className="flex gap-2">
            <input
              value={thumbnail}
              onChange={e => setThumbnail(e.target.value)}
              className="flex-1 bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-violet-500"
              placeholder="https://example.com/image.jpg"
            />
            <input 
              type="file" 
              accept="image/*"
              onChange={e => handleUpload(e, setThumbnail)}
              className="bg-background border border-border rounded-lg px-2 py-2 text-sm max-w-[200px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isPublished"
            checked={isPublished}
            onChange={e => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded border-border bg-background"
          />
          <label htmlFor="isPublished" className="text-sm font-medium text-foreground cursor-pointer">
            Publish this course (make it visible to users)
          </label>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Curriculum</h2>
          <Button type="button" onClick={handleAddModule} variant="outline" className="border-violet-500/30 text-violet-400 hover:bg-violet-500/10">
            <Plus className="h-4 w-4 mr-2" /> Add Module
          </Button>
        </div>

        {modules.length === 0 && (
          <div className="p-8 text-center text-muted-foreground border border-dashed border-border/40 rounded-xl bg-sidebar/10">
            No modules added yet. Add a module to start building your curriculum.
          </div>
        )}

        {modules.map((module, mIdx) => (
          <div key={mIdx} className="bg-sidebar/20 p-6 rounded-2xl border border-border/40 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-violet-400">Module {mIdx + 1} Title</label>
                <input
                  required
                  value={module.title}
                  onChange={e => handleUpdateModule(mIdx, "title", e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 outline-none focus:border-violet-500"
                  placeholder="e.g. Introduction"
                />
              </div>
              <Button type="button" variant="ghost" onClick={() => handleRemoveModule(mIdx)} className="text-muted-foreground hover:text-red-500 mt-6">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Lessons */}
            <div className="pl-4 ml-2 border-l-2 border-border/30 space-y-4 pt-4">
              {module.lessons.map((lesson: any, lIdx: number) => (
                <div key={lIdx} className="bg-background/50 p-4 rounded-xl border border-border/30 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <label className="text-sm font-medium text-blue-400">Lesson {lIdx + 1} Title</label>
                      <input
                        required
                        value={lesson.title}
                        onChange={e => handleUpdateLesson(mIdx, lIdx, "title", e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 text-sm"
                        placeholder="Lesson title"
                      />
                    </div>
                    <Button type="button" variant="ghost" onClick={() => handleRemoveLesson(mIdx, lIdx)} className="text-muted-foreground hover:text-red-500 mt-6 h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Text Content (HTML allowed)</label>
                    <textarea
                      value={lesson.text}
                      onChange={e => handleUpdateLesson(mIdx, lIdx, "text", e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 text-sm min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Video URL or Upload (MP4)</label>
                      <div className="flex flex-col gap-2">
                        <input
                          value={lesson.videoUrl}
                          onChange={e => handleUpdateLesson(mIdx, lIdx, "videoUrl", e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 text-sm"
                          placeholder="Video URL"
                        />
                        <input 
                          type="file" 
                          accept="video/*"
                          onChange={e => handleUpload(e, (url) => handleUpdateLesson(mIdx, lIdx, "videoUrl", url))}
                          className="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Photo URL or Upload</label>
                      <div className="flex flex-col gap-2">
                        <input
                          value={lesson.photoUrl}
                          onChange={e => handleUpdateLesson(mIdx, lIdx, "photoUrl", e.target.value)}
                          className="w-full bg-background border border-border rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 text-sm"
                          placeholder="Photo URL"
                        />
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={e => handleUpload(e, (url) => handleUpdateLesson(mIdx, lIdx, "photoUrl", url))}
                          className="w-full bg-background border border-border rounded-lg px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quizzes */}
                  <div className="pt-2 border-t border-border/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-green-400">Knowledge Checks (Quiz)</span>
                      <Button type="button" onClick={() => handleAddQuiz(mIdx, lIdx)} variant="outline" size="sm" className="h-7 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10">
                        <Plus className="h-3 w-3 mr-1" /> Add Question
                      </Button>
                    </div>

                    {lesson.quiz?.map((q: any, qIdx: number) => (
                      <div key={qIdx} className="bg-sidebar/50 p-3 rounded-lg border border-border/20 space-y-3 relative">
                        <Button type="button" variant="ghost" onClick={() => handleRemoveQuiz(mIdx, lIdx, qIdx)} className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-red-500">
                           <Trash2 className="h-3 w-3" />
                        </Button>
                        <div className="space-y-1 pr-8">
                          <label className="text-xs text-muted-foreground">Question</label>
                          <input
                            required
                            value={q.question}
                            onChange={e => handleUpdateQuiz(mIdx, lIdx, qIdx, "question", e.target.value)}
                            className="w-full bg-background border border-border rounded md px-2 py-1 outline-none focus:border-green-500 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt: string, oIdx: number) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${mIdx}-${lIdx}-${qIdx}`}
                                checked={q.correctOptionIndex === oIdx}
                                onChange={() => handleUpdateQuiz(mIdx, lIdx, qIdx, "correctOptionIndex", oIdx)}
                                className="h-3 w-3"
                              />
                              <input
                                required
                                value={opt}
                                onChange={e => handleUpdateQuizOption(mIdx, lIdx, qIdx, oIdx, e.target.value)}
                                className="w-full bg-background border border-border rounded px-2 py-1 outline-none focus:border-green-500 text-xs"
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
              
              <Button type="button" onClick={() => handleAddLesson(mIdx)} variant="outline" size="sm" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                <Plus className="h-4 w-4 mr-2" /> Add Lesson
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-border/40 flex justify-end">
        <Button type="submit" disabled={loading} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-500/20 px-8">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
          {initialData ? "Update Course" : "Create Course"}
        </Button>
      </div>
    </form>
  );
}
