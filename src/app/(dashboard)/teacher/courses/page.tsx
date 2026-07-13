"use client";

import React, { useEffect, useState } from "react";
import { Plus, BookOpen, Loader2, AlertCircle, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TeacherDashboardPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const res = await fetch("/api/courses?instructorOnly=true");
      if (!res.ok) throw new Error("Failed to fetch your courses");
      const data = await res.json();
      setCourses(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete course");
      fetchCourses();
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-8 bg-transparent">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
            <BookOpen className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage and create your courses here.
            </p>
          </div>
        </div>
        
        <Link href="/teacher/courses/new">
          <Button className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl shadow-lg shadow-yellow-500/20">
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading your courses...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-destructive/5 border border-destructive/20 rounded-2xl">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-sidebar/30 border border-border/40 rounded-3xl">
          <BookOpen className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-foreground">No courses yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm text-center">
            You haven't created any courses. Get started by clicking the "Create Course" button!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 overflow-hidden border border-border/40 rounded-2xl bg-sidebar/50">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-sidebar-accent/50 text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-medium">Course Title</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Modules</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {courses.map((course) => (
                  <tr key={course._id} className="hover:bg-sidebar-accent/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt="" className="w-10 h-10 rounded bg-muted object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <span className="truncate max-w-[200px]">{course.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {course.isPublished ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                          Published
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {course.modules?.length || 0}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link href={`/courses/${course._id}`}>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Link>
                      <Link href={`/teacher/courses/${course._id}/edit`}>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 hover:text-red-500" onClick={() => handleDelete(course._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
