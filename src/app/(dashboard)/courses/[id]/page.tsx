/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, ChevronLeft, PlayCircle, FileText, CheckCircle, ChevronDown, Presentation, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CourseLesson {
  title: string;
  text?: string;
  videoUrl?: string;
  photoUrl?: string;
  quiz?: Array<{
    question: string;
    options: string[];
    correctOptionIndex: number;
  }>;
}

interface CourseModule {
  title: string;
  lessons: CourseLesson[];
}

interface CourseData {
  _id: string;
  title: string;
  description: string;
  instructor?: {
    name?: string;
    image?: string;
  };
  modules: CourseModule[];
}

interface ProgressData {
  isCompleted?: boolean;
  certificateId?: string;
  completedLessons?: string[];
  quizScores?: Record<string, { score: number }>;
}

export default function CourseViewerPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  
  const [quizAnswers, setQuizAnswers] = useState<Record<string, Record<number, number>>>({});
  const [quizResults, setQuizResults] = useState<Record<string, Record<number, boolean>>>({});
  
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [submittingProgress, setSubmittingProgress] = useState(false);

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (!res.ok) throw new Error("Failed to fetch course details");
        const data = await res.json();
        setCourse(data);

        const resProg = await fetch(`/api/courses/${id}/progress`);
        if (resProg.ok) {
          const dataProg = await resProg.json();
          setProgress(dataProg);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchCourse();
  }, [id]);

  const activeModule = course?.modules?.[activeModuleIdx];
  const activeLesson = activeModule?.lessons?.[activeLessonIdx];

  const handleQuizSubmit = async (lessonId: string, questions: CourseLesson["quiz"]) => {
    if (!questions) return;
    const answers = quizAnswers[lessonId] || {};
    
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === undefined) {
        alert(`Please select an answer for question ${i + 1}`);
        return;
      }
    }

    let correctCount = 0;
    const results: Record<number, boolean> = {};
    questions.forEach((q, idx: number) => {
      const isCorrect = answers[idx] === q.correctOptionIndex;
      results[idx] = isCorrect;
      if (isCorrect) correctCount++;
    });
    setQuizResults((prev) => ({ ...prev, [lessonId]: results }));

    try {
      await fetch(`/api/courses/${id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "quiz",
          lessonId,
          score: correctCount,
        }),
      });
      const resProg = await fetch(`/api/courses/${id}/progress`);
      if (resProg.ok) {
        setProgress(await resProg.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteLesson = async () => {
    if (!course || submittingProgress) return;
    setSubmittingProgress(true);
    try {
      const lessonKey = `${activeModuleIdx}-${activeLessonIdx}`;
      const res = await fetch(`/api/courses/${id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "completeLesson",
          lessonId: lessonKey,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(data);

        // Advance to next lesson
        const currentMod = course.modules[activeModuleIdx];
        if (activeLessonIdx < currentMod.lessons.length - 1) {
          setActiveLessonIdx((prev) => prev + 1);
        } else if (activeModuleIdx < course.modules.length - 1) {
          setActiveModuleIdx((prev) => prev + 1);
          setActiveLessonIdx(0);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 gap-3 bg-[#030305]">
        <Loader2 className="size-8 animate-spin text-amber-400" />
        <span className="font-mono text-xs text-zinc-400 tracking-widest uppercase">Loading course curriculum...</span>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex-1 p-10 flex flex-col items-center justify-center gap-4 bg-[#030305]">
        <AlertCircle className="size-10 text-rose-400" />
        <h2 className="text-xl font-bold text-white">Error Loading Course</h2>
        <p className="text-zinc-400 text-xs font-mono">{error || "Course not found"}</p>
        <Button onClick={() => router.push("/courses")} className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs">
          Back to Courses
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#030305] text-zinc-100 antialiased relative">
      {/* Sidebar Curriculum Drawer */}
      <div className="w-full lg:w-80 border-r border-white/5 bg-zinc-950/60 backdrop-blur-2xl flex flex-col h-[40vh] lg:h-auto overflow-hidden shrink-0">
        <div className="p-6 border-b border-white/5 shrink-0 space-y-3">
          <Link href="/courses" className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-bold uppercase tracking-widest transition-colors">
            <ChevronLeft className="size-4" /> Back to courses
          </Link>
          <h2 className="text-base font-bold text-white line-clamp-2">{course.title}</h2>
          <div className="flex items-center gap-2 pt-1">
            <img 
              src={course.instructor?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80"} 
              alt={course.instructor?.name || "Instructor"} 
              className="size-6 rounded-full object-cover border border-white/10" 
            />
            <span className="text-xs font-mono text-zinc-400">{course.instructor?.name || "Instructor"}</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
          {course.modules?.map((mod, mIdx) => (
            <div key={mIdx} className="space-y-1.5">
              <h3 className="text-xs font-mono font-bold text-white px-3 py-1.5 bg-zinc-900 rounded-xl border border-white/5">
                Module {mIdx + 1}: {mod.title}
              </h3>
              <div className="flex flex-col gap-1.5 pl-3 border-l border-white/5 ml-3 mt-2">
                {mod.lessons?.map((lesson, lIdx) => {
                  const isActive = mIdx === activeModuleIdx && lIdx === activeLessonIdx;
                  const isCompleted = progress?.completedLessons?.includes(`${mIdx}-${lIdx}`);
                  return (
                    <button
                      key={lIdx}
                      onClick={() => {
                        setActiveModuleIdx(mIdx);
                        setActiveLessonIdx(lIdx);
                      }}
                      className={`text-left px-3 py-2 text-xs rounded-xl transition-all ${
                        isActive
                          ? "bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30"
                          : "text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCompleted ? <CheckCircle className="size-3.5 text-emerald-400" /> : lesson.videoUrl ? <PlayCircle className="size-3.5" /> : lesson.quiz?.length ? <CheckCircle className="size-3.5" /> : <FileText className="size-3.5" />}
                        <span className="line-clamp-1">{lesson.title}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Lesson Content */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
        {progress?.isCompleted && (
          <div className="mb-8 p-6 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle className="size-5" /> Course Completed!
              </h3>
              <p className="text-xs text-emerald-300/80 font-light mt-1">Congratulations on finishing {course.title}.</p>
            </div>
            {progress.certificateId && (
              <Link href={`/certificates/${progress.certificateId}`}>
                <Button className="rounded-full bg-emerald-500 text-zinc-950 font-bold text-xs h-10 px-6">
                  View Certificate
                </Button>
              </Link>
            )}
          </div>
        )}

        {activeLesson ? (
          <motion.div
            key={`${activeModuleIdx}-${activeLessonIdx}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto space-y-8 pb-20"
          >
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                {activeModule?.title}
              </span>
              <h1 className="text-3xl font-black text-white tracking-tight">{activeLesson.title}</h1>
            </div>

            {/* Video Player in Doppelrand Frame */}
            {activeLesson.videoUrl && (
              <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl">
                <div className="w-full aspect-video bg-black rounded-[calc(2.5rem-0.75rem)] overflow-hidden border border-white/5 shadow-2xl">
                  {activeLesson.videoUrl.match(/\.(mp4|webm|ogg)$/i) || activeLesson.videoUrl.startsWith("/uploads/") ? (
                    <video
                      src={activeLesson.videoUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <iframe
                      src={activeLesson.videoUrl}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    ></iframe>
                  )}
                </div>
              </div>
            )}

            {activeLesson.photoUrl && (
              <div className="rounded-[2rem] overflow-hidden border border-white/10 shadow-lg">
                <img src={activeLesson.photoUrl} alt="Lesson illustration" className="w-full h-auto object-cover max-h-[500px]" />
              </div>
            )}

            {activeLesson.text && (
              <div className="prose prose-invert max-w-none text-zinc-300 leading-relaxed font-light text-sm"
                   dangerouslySetInnerHTML={{ __html: activeLesson.text }} />
            )}

            {/* Quiz Section */}
            {activeLesson.quiz && activeLesson.quiz.length > 0 && (
              <div className="rounded-[2.5rem] bg-zinc-900/40 border border-white/10 p-2.5 backdrop-blur-3xl space-y-6">
                <div className="rounded-[calc(2.5rem-0.75rem)] bg-[#07070a] border border-white/5 p-6 sm:p-8 space-y-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="size-5 text-amber-400" />
                    Knowledge Check
                  </h3>
                  <div className="space-y-6">
                    {activeLesson.quiz.map((q, qIdx) => {
                      const lessonKey = `${activeModuleIdx}-${activeLessonIdx}`;
                      const selectedOpt = quizAnswers[lessonKey]?.[qIdx];
                      const isSubmitted = !!quizResults[lessonKey];
                      
                      return (
                        <div key={qIdx} className="space-y-3">
                          <p className="font-bold text-white text-sm">{qIdx + 1}. {q.question}</p>
                          <div className="space-y-2 pl-2">
                            {q.options.map((opt, oIdx) => {
                              const isSelected = selectedOpt === oIdx;
                              let style = "bg-zinc-950 border-white/10 hover:border-amber-400/40 text-zinc-300";
                              
                              if (isSubmitted) {
                                if (oIdx === q.correctOptionIndex) {
                                  style = "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold";
                                } else if (isSelected) {
                                  style = "bg-rose-500/10 border-rose-500/40 text-rose-400";
                                } else {
                                  style = "bg-zinc-950 border-white/5 opacity-50 cursor-not-allowed";
                                }
                              } else if (isSelected) {
                                style = "bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold";
                              }

                              return (
                                <button
                                  key={oIdx}
                                  disabled={isSubmitted}
                                  onClick={() => {
                                    setQuizAnswers((prev) => ({
                                      ...prev,
                                      [lessonKey]: {
                                        ...(prev[lessonKey] || {}),
                                        [qIdx]: oIdx,
                                      },
                                    }));
                                  }}
                                  className={`w-full text-left px-4 py-3 rounded-2xl border text-xs transition-all flex items-center justify-between ${style}`}
                                >
                                  <span>{opt}</span>
                                  {isSubmitted && oIdx === q.correctOptionIndex && <CheckCircle className="size-4 text-emerald-400" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {!quizResults[`${activeModuleIdx}-${activeLessonIdx}`] && !progress?.quizScores?.[`${activeModuleIdx}-${activeLessonIdx}`] ? (
                    <Button 
                      onClick={() => handleQuizSubmit(`${activeModuleIdx}-${activeLessonIdx}`, activeLesson.quiz)}
                      className="w-full rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-10 mt-4"
                    >
                      Submit Quiz Answers
                    </Button>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-center font-mono text-xs font-bold">
                      Quiz Score: {progress?.quizScores?.[`${activeModuleIdx}-${activeLessonIdx}`]?.score || 0} / {activeLesson.quiz.length}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Complete & Continue Button */}
            <div className="pt-8 flex justify-end border-t border-white/5 mt-8">
              <Button 
                onClick={handleCompleteLesson} 
                disabled={submittingProgress}
                className="rounded-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs h-11 px-8 flex items-center gap-2"
              >
                {submittingProgress ? <Loader2 className="size-4 animate-spin text-zinc-950" /> : null}
                <span>
                  {activeModuleIdx === (course.modules?.length || 0) - 1 && activeLessonIdx === (activeModule?.lessons?.length || 0) - 1 ? "Complete Course" : "Complete & Continue"}
                </span>
                <ChevronDown className="size-4 -rotate-90 text-zinc-950" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-zinc-500 select-none">
            <Presentation className="size-16 mb-4 opacity-20" />
            <p className="text-xs font-mono">Select a lesson from the curriculum to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
