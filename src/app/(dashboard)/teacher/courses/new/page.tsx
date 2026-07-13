import React from "react";
import { CourseForm } from "@/components/courses/CourseForm";
import { BookOpen } from "lucide-react";

export default function NewCoursePage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-transparent max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-3 border-b border-border/40 pb-8 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
          <BookOpen className="h-6 w-6 text-violet-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Course</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Build your curriculum and publish it to the community.
          </p>
        </div>
      </div>

      <CourseForm />
    </div>
  );
}
