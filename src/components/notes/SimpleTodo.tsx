"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, Circle, Clock, Trash2, Plus, Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TodoItem {
  _id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  reminderAt?: string | null;
  reminderSent: boolean;
}

export function SimpleTodo() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTask, setNewTask] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [showReminder, setShowReminder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todosRef = useRef(todos);
  useEffect(() => {
    todosRef.current = todos;
  }, [todos]);

  const fetchTodos = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/todos");
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // Reminder interval
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const currentTodos = todosRef.current;

      currentTodos.forEach((todo) => {
        if (!todo.isCompleted && todo.reminderAt && !todo.reminderSent) {
          const reminderTime = new Date(todo.reminderAt).getTime();
          const timeDiff = reminderTime - now;
          if (timeDiff > 0 && timeDiff <= 600000) {
            if (Notification.permission === "granted") {
              new Notification("Task Reminder", {
                body: `${todo.title} is due soon!`,
                icon: "/logo.png",
                badge: "/logo.png",
              } as NotificationOptions & { vibrate?: number[] });
            }
            updateTodo(todo._id, { reminderSent: true }, false);
          }
        }
      });
    }, 60000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTask.trim(),
          reminderAt: showReminder && reminderTime ? reminderTime : null,
        }),
      });

      if (res.ok) {
        const newTodo = await res.json();
        setTodos((prev) => [newTodo, ...prev]);
        setNewTask("");
        setReminderTime("");
        setShowReminder(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTodo = async (id: string, updates: Partial<TodoItem>, optimistic = true) => {
    if (optimistic) {
      setTodos((prev) =>
        prev.map((t) => (t._id === id ? { ...t, ...updates } : t))
      );
    }

    try {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.error(e);
      if (optimistic) fetchTodos();
    }
  };

  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t._id !== id));
    try {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error(e);
      fetchTodos();
    }
  };

  const pendingCount = todos.filter((t) => !t.isCompleted).length;

  return (
    <Card className="border-border-subtle bg-bg-surface flex flex-col h-full shadow-sm">
      <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-border-subtle">
        <div className="space-y-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
            Daily Planner
          </span>
          <CardTitle className="text-sm font-bold text-text-primary flex items-center gap-2">
            <span>Study Tasks</span>
            {pendingCount > 0 && (
              <span className="text-[10px] font-mono font-bold bg-accent-primary/15 text-accent-primary px-2 py-0.5 rounded-full border border-accent-primary/20">
                {pendingCount} due
              </span>
            )}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        {/* Task input form */}
        <form onSubmit={handleAddTodo} className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Add a new study task..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              className="flex-1 bg-bg-base border-border-subtle focus-visible:ring-accent-primary text-xs h-9 rounded-xl placeholder:text-text-muted text-text-primary"
              autoComplete="off"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowReminder(!showReminder)}
              className={`p-2 rounded-xl transition-colors shrink-0 outline-none focus-visible:ring-1 focus-visible:ring-accent-primary ${
                showReminder
                  ? "bg-accent-primary/15 text-accent-primary border border-accent-primary/30"
                  : "text-text-muted hover:text-text-primary hover:bg-bg-elevated border border-transparent"
              }`}
              title="Set Reminder"
              aria-label="Set reminder time"
            >
              <Bell className="size-4" />
            </button>
            <Button
              type="submit"
              size="icon"
              disabled={isSubmitting || !newTask.trim()}
              className="size-9 bg-accent-primary hover:bg-accent-primary-hover text-bg-base rounded-xl shrink-0 transition-transform active:scale-95 disabled:opacity-40"
              aria-label="Add task"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4 stroke-[2.5]" />
              )}
            </Button>
          </div>

          {showReminder && (
            <div className="flex flex-col gap-1.5 p-3 bg-bg-elevated border border-border-subtle rounded-xl animate-in fade-in duration-150">
              <label className="text-[10px] font-mono font-bold text-accent-primary uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="size-3" />
                Reminder Time
              </label>
              <Input
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="bg-bg-base border-border-subtle h-8 text-xs text-text-primary px-2.5 w-full rounded-lg"
              />
            </div>
          )}
        </form>

        {/* Task list container */}
        <div className="space-y-1.5 max-h-[300px] overflow-y-auto custom-scroll pr-1 flex-1">
          {!isLoading && todos.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border-subtle rounded-xl bg-bg-base/40 flex flex-col items-center gap-2 select-none">
              <div className="size-8 rounded-full bg-bg-elevated flex items-center justify-center border border-border-subtle text-text-muted">
                <CheckCircle2 className="size-4" />
              </div>
              <p className="text-xs text-text-muted font-medium">All study tasks complete!</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo._id}
                className={`group flex items-start gap-2.5 p-2.5 rounded-xl border transition-all duration-150 ${
                  todo.isCompleted
                    ? "bg-bg-base/30 border-border-subtle/50 opacity-60 hover:opacity-100"
                    : "bg-bg-elevated/40 border-border-subtle hover:border-border-default hover:bg-bg-elevated"
                }`}
              >
                <button
                  type="button"
                  onClick={() => updateTodo(todo._id, { isCompleted: !todo.isCompleted })}
                  className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${
                    todo.isCompleted
                      ? "text-success"
                      : "text-text-muted hover:text-accent-primary"
                  }`}
                  aria-label={todo.isCompleted ? "Mark incomplete" : "Mark complete"}
                >
                  {todo.isCompleted ? (
                    <CheckCircle2 className="size-4" />
                  ) : (
                    <Circle className="size-4" />
                  )}
                </button>

                <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[20px]">
                  <p
                    className={`text-xs leading-snug break-words transition-colors ${
                      todo.isCompleted
                        ? "text-text-muted line-through"
                        : "text-text-primary font-medium"
                    }`}
                  >
                    {todo.title}
                  </p>
                  {todo.reminderAt && !todo.isCompleted && (
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-accent-primary font-mono bg-accent-primary/10 w-fit px-1.5 py-0.5 rounded border border-accent-primary/20">
                      <Clock className="size-3" />
                      <span>
                        {new Date(todo.reminderAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => deleteTodo(todo._id)}
                  className="opacity-0 group-hover:opacity-100 p-1 shrink-0 text-text-muted hover:text-destructive hover:bg-bg-surface rounded-lg transition-opacity cursor-pointer"
                  title="Delete task"
                  aria-label="Delete task"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
