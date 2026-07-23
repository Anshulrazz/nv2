"use client";

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle2, Circle, Clock, Trash2, Plus, Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
          // Notify if due in less than 10 mins (600,000 ms) and greater than 0
          if (timeDiff > 0 && timeDiff <= 600000) {
            if (Notification.permission === "granted") {
              new Notification("Task Reminder", {
                body: `${todo.title} is due soon!`,
                icon: "/logo.png",
                badge: "/logo.png",
              } as NotificationOptions & { vibrate?: number[] });
            }
            // Mark as sent in DB
            updateTodo(todo._id, { reminderSent: true }, false);
          }
        }
      });
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
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
        setTodos([newTodo, ...todos]);
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
      setTodos((prev) => prev.map((t) => (t._id === id ? { ...t, ...updates } : t)));
    }
    try {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!optimistic) {
        setTodos((prev) => prev.map((t) => (t._id === id ? { ...t, ...updates } : t)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTodo = async (id: string) => {
    setTodos((prev) => prev.filter((t) => t._id !== id));
    try {
      await fetch(`/api/todos/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-4 bg-neutral-900/60 border border-neutral-800/80 backdrop-blur-xl rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      {/* Decorative gradient orb */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-[40px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-5 relative z-10">
        <h3 className="text-sm font-extrabold text-neutral-100 tracking-wider flex items-center gap-2" style={{ fontFamily: "var(--font-space-grotesk)" }}>
          <CheckCircle2 className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          QUICK TASKS
        </h3>
        {isLoading && <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />}
      </div>

      <form onSubmit={handleAddTodo} className="mb-5 space-y-3 relative z-10">
        <div className="flex items-center gap-2 bg-neutral-950/80 border border-neutral-800 rounded-xl p-1.5 focus-within:border-cyan-500/60 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all shadow-inner">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="What needs to be done?"
            className="bg-transparent border-none focus-visible:ring-0 h-10 text-sm text-neutral-100 placeholder-neutral-600 px-3 w-full font-medium"
            autoComplete="off"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowReminder(!showReminder)}
            className={`p-2 rounded-lg transition-all shrink-0 ${showReminder ? "bg-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800"}`}
            title="Set Reminder"
          >
            <Bell className="h-4.5 w-4.5" />
          </button>
          <Button
            type="submit"
            size="icon"
            disabled={isSubmitting || !newTask.trim()}
            className="h-10 w-10 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 rounded-lg shrink-0 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.25)]"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-5 w-5" />}
          </Button>
        </div>
        
        {showReminder && (
          <div className="flex flex-col gap-2 p-3 bg-neutral-950/50 border border-neutral-800/80 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Set Reminder Time
            </label>
            <Input
              type="datetime-local"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="bg-neutral-900 border-neutral-800 h-10 text-xs text-neutral-200 px-3 w-full rounded-lg focus:border-cyan-500/50 transition-colors"
            />
          </div>
        )}
      </form>

      <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scroll pr-2 relative z-10">
        {!isLoading && todos.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-neutral-800/60 rounded-xl bg-neutral-950/20 flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800">
              <CheckCircle2 className="h-5 w-5 text-neutral-600" />
            </div>
            <p className="text-xs text-neutral-500 font-medium">No tasks pending.<br/>You're all caught up!</p>
          </div>
        ) : (
          todos.map((todo) => (
            <div
              key={todo._id}
              className={`group flex items-start gap-3 p-3 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                todo.isCompleted 
                  ? "bg-neutral-950/30 border-neutral-900/50 opacity-50 hover:opacity-100" 
                  : "bg-neutral-900/50 border-neutral-800/80 hover:border-cyan-500/30 shadow-sm hover:shadow-[0_4px_20px_rgba(6,182,212,0.05)] hover:-translate-y-0.5"
              }`}
            >
              <button
                onClick={() => updateTodo(todo._id, { isCompleted: !todo.isCompleted })}
                className={`mt-0.5 shrink-0 transition-colors ${todo.isCompleted ? "text-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "text-neutral-500 hover:text-cyan-400"}`}
              >
                {todo.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
              </button>
              
              <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[24px]">
                <p className={`text-sm leading-snug break-words transition-colors ${todo.isCompleted ? "text-neutral-500 line-through" : "text-neutral-200 font-medium"}`}>
                  {todo.title}
                </p>
                {todo.reminderAt && !todo.isCompleted && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-cyan-400/90 font-mono bg-cyan-950/30 w-fit px-2 py-0.5 rounded-md border border-cyan-900/50">
                    <Clock className="h-3 w-3" />
                    {new Date(todo.reminderAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => deleteTodo(todo._id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 shrink-0 text-neutral-600 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-all"
                title="Delete task"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
