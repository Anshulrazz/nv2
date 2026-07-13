"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CourseForm } from "@/components/courses/CourseForm";
import { BookOpen, Loader2, AlertCircle } from "lucide-react";

export default function EditCoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState<any /* eslint-disable-line @typescript-eslint/no-explicit-any */>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCourse() {
      try {
        const res = await fetch(`/api/courses/${id}`);
        if (!res.ok) throw new Error("Failed to fetch course details");
        const data = await res.json();
        setCourse(data);
      } catch (err: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
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
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex-1 p-10 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <h2 className="text-xl font-bold">Error</h2>
        <p className="text-muted-foreground">{error || "Course not found"}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-transparent max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 border-b border-border/40 pb-8 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
          <BookOpen className="h-6 w-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Course</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Update your curriculum.
          </p>
        </div>
      </div>

      <CourseForm initialData={course} />
    </div>
  );
}
