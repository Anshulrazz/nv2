"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, ChevronLeft, PlayCircle, FileText, CheckCircle, ChevronDown, Presentation } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";


export default function CourseViewerPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  
  const [quizAnswers, setQuizAnswers] = useState<Record<string, Record<number, number>>>({});
  const [quizResults, setQuizResults] = useState<Record<string, Record<number, boolean>>>({});
  
  const [progress, setProgress] = useState<any>(null);
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
          
          // Pre-populate quiz results if any
          if (dataProg.quizScores) {
             // We don't have the exact answers they chose in progress, but we can 
             // just rely on our backend validation or show the final score they got.
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchCourse();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading course content...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex-1 p-10 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-bold">Error Loading Course</h2>
        <p className="text-muted-foreground">{error || "Course not found"}</p>
        <Button onClick={() => router.push("/courses")} variant="outline">
          Back to Courses
        </Button>
      </div>
    );
  }

  const activeModule = course.modules?.[activeModuleIdx];
  const activeLesson = activeModule?.lessons?.[activeLessonIdx];

  const handleQuizSubmit = async (lessonId: string, questions: any[]) => {
    const answers = quizAnswers[lessonId] || {};
    
    // Validate that all questions have an answer selected
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === undefined) {
        alert(`Please select an answer for question ${i + 1}`);
        return;
      }
    }

    let correctCount = 0;
    const results: Record<number, boolean> = {};
    questions.forEach((q: any, idx: number) => {
      const isCorrect = answers[idx] === q.correctOptionIndex;
      results[idx] = isCorrect;
      if (isCorrect) correctCount++;
    });
    setQuizResults(prev => ({ ...prev, [lessonId]: results }));

    // Save to progress API
    try {
      const res = await fetch(`/api/courses/${id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          submitQuiz: { lessonKey: lessonId, score: correctCount, total: questions.length }
        })
      });
      if (res.ok) {
        const p = await res.json();
        setProgress(p);
      }
    } catch (e) {
      console.error("Failed to save quiz progress");
    }
  };

  const handleCompleteLesson = async () => {
    const lessonKey = `${activeModuleIdx}-${activeLessonIdx}`;
    setSubmittingProgress(true);
    
    const isLastModule = activeModuleIdx === (course.modules?.length || 0) - 1;
    const isLastLesson = activeLessonIdx === (activeModule.lessons?.length || 0) - 1;
    const isLast = isLastModule && isLastLesson;

    try {
      const res = await fetch(`/api/courses/${id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isLast ? { completeCourse: true } : { completedLesson: lessonKey })
      });
      if (res.ok) {
        const p = await res.json();
        setProgress(p);
        
        if (!isLast) {
          if (!isLastLesson) {
             setActiveLessonIdx(activeLessonIdx + 1);
          } else {
             setActiveModuleIdx(activeModuleIdx + 1);
             setActiveLessonIdx(0);
          }
        }
      }
    } catch (e) {
      console.error("Failed to update progress");
    } finally {
      setSubmittingProgress(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-background">
      {/* Sidebar: Course Curriculum */}
      <div className="w-full lg:w-80 border-r border-border/40 bg-sidebar/30 flex flex-col h-[40vh] lg:h-auto overflow-hidden">
        <div className="p-6 border-b border-border/40 shrink-0">
          <Link href="/courses" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 transition-colors">
            <ChevronLeft className="h-3 w-3" /> Back to courses
          </Link>
          <h2 className="text-lg font-bold text-foreground line-clamp-2">{course.title}</h2>
          <div className="flex items-center gap-2 mt-3">
            <img 
              src={course.instructor?.image || "/default-avatar.png"} 
              alt={course.instructor?.name || "Instructor"} 
              className="h-6 w-6 rounded-full object-cover" 
            />
            <span className="text-xs text-muted-foreground">{course.instructor?.name}</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scroll p-4 space-y-4">
          {course.modules?.map((mod: any, mIdx: number) => (
            <div key={mIdx} className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground px-2 py-1 bg-background/50 rounded-md border border-border/20">
                Module {mIdx + 1}: {mod.title}
              </h3>
              <div className="flex flex-col gap-1 pl-2 border-l border-border/40 ml-3 mt-2">
                {mod.lessons?.map((lesson: any, lIdx: number) => {
                  const isActive = mIdx === activeModuleIdx && lIdx === activeLessonIdx;
                  const isCompleted = progress?.completedLessons?.includes(`${mIdx}-${lIdx}`);
                  return (
                    <button
                      key={lIdx}
                      onClick={() => {
                        setActiveModuleIdx(mIdx);
                        setActiveLessonIdx(lIdx);
                      }}
                      className={`text-left px-3 py-2 text-sm rounded-lg transition-all ${
                        isActive
                          ? "bg-violet-500/10 text-violet-400 font-medium border border-violet-500/20"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCompleted ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : lesson.videoUrl ? <PlayCircle className="h-3.5 w-3.5" /> : lesson.quiz?.length > 0 ? <CheckCircle className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
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

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-transparent relative">
        {progress?.isCompleted && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-green-400 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" /> Course Completed!
              </h3>
              <p className="text-sm text-green-500/80">Congratulations on finishing {course.title}.</p>
            </div>
            {progress.certificateId && (
              <Link href={`/certificates/${progress.certificateId}`}>
                <Button className="bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-500/20">
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
              <h4 className="text-violet-400 font-medium text-sm tracking-wide uppercase">
                {activeModule?.title}
              </h4>
              <h1 className="text-3xl font-bold text-foreground">{activeLesson.title}</h1>
            </div>

            {/* Video Player */}
            {activeLesson.videoUrl && (
              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden border border-border/40 shadow-xl shadow-black/20">
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
            )}

            {/* Photo */}
            {activeLesson.photoUrl && (
              <div className="w-full rounded-2xl overflow-hidden border border-border/40 shadow-lg">
                <img src={activeLesson.photoUrl} alt="Lesson illustration" className="w-full h-auto object-cover max-h-[500px]" />
              </div>
            )}

            {/* Text Content */}
            {activeLesson.text && (
              <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: activeLesson.text }} />
            )}

            {/* Quiz Section */}
            {activeLesson.quiz && activeLesson.quiz.length > 0 && (
              <div className="mt-12 space-y-6 bg-sidebar/30 p-6 lg:p-8 rounded-3xl border border-border/40">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-violet-500" />
                  Knowledge Check
                </h3>
                <div className="space-y-8">
                  {activeLesson.quiz.map((q: any, qIdx: number) => {
                    const lessonKey = `${activeModuleIdx}-${activeLessonIdx}`;
                    const selectedOpt = quizAnswers[lessonKey]?.[qIdx];
                    const isSubmitted = !!quizResults[lessonKey];
                    
                    return (
                      <div key={qIdx} className="space-y-4">
                        <p className="font-medium text-foreground text-lg">{qIdx + 1}. {q.question}</p>
                        <div className="space-y-2 pl-4">
                          {q.options.map((opt: string, oIdx: number) => {
                            const isSelected = selectedOpt === oIdx;
                            let style = "bg-background border-border/40 hover:border-violet-500/40 hover:bg-violet-500/5 text-muted-foreground";
                            
                            if (isSubmitted) {
                              if (oIdx === q.correctOptionIndex) {
                                style = "bg-green-500/10 border-green-500/40 text-green-400";
                              } else if (isSelected) {
                                style = "bg-red-500/10 border-red-500/40 text-red-400";
                              } else {
                                style = "bg-background border-border/40 opacity-50 cursor-not-allowed";
                              }
                            } else if (isSelected) {
                              style = "bg-violet-500/10 border-violet-500/40 text-violet-300";
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={isSubmitted}
                                onClick={() => {
                                  setQuizAnswers(prev => ({
                                    ...prev,
                                    [lessonKey]: {
                                      ...(prev[lessonKey] || {}),
                                      [qIdx]: oIdx
                                    }
                                  }));
                                }}
                                className={`w-full text-left px-5 py-3 rounded-xl border transition-all duration-200 flex items-center justify-between ${style}`}
                              >
                                <span>{opt}</span>
                                {isSubmitted && oIdx === q.correctOptionIndex && <CheckCircle className="h-4 w-4 text-green-500" />}
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
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-xl mt-4"
                  >
                    Submit Answers
                  </Button>
                ) : (
                  <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-center font-medium">
                    Quiz Score: {progress?.quizScores?.[`${activeModuleIdx}-${activeLessonIdx}`]?.score || 0} / {activeLesson.quiz.length}
                  </div>
                )}
              </div>
            )}
            
            {/* Next Lesson Navigation */}
            <div className="pt-10 flex justify-end border-t border-border/20 mt-10">
               <Button 
                 onClick={handleCompleteLesson} 
                 disabled={submittingProgress}
                 variant={activeModuleIdx === (course.modules?.length || 0) - 1 && activeLessonIdx === (activeModule?.lessons?.length || 0) - 1 ? "default" : "outline"} 
                 className={`gap-2 ${activeModuleIdx === (course.modules?.length || 0) - 1 && activeLessonIdx === (activeModule?.lessons?.length || 0) - 1 ? "bg-green-600 hover:bg-green-700 text-white rounded-xl" : ""}`}
               >
                 {submittingProgress ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                 {activeModuleIdx === (course.modules?.length || 0) - 1 && activeLessonIdx === (activeModule?.lessons?.length || 0) - 1 ? "Complete Course" : "Complete & Continue"} 
                 <ChevronDown className="h-4 w-4 -rotate-90" />
               </Button>
            </div>
            
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Presentation className="h-16 w-16 mb-4 opacity-20" />
            <p>Select a lesson from the curriculum to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
