"use client";

import React, { useEffect, useState } from "react";
import { Bookmark, ExternalLink, Trash2, Tag, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BookmarkData {
  _id: string;
  title: string;
  url: string;
  category: string;
  createdAt: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBookmarks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bookmarks");
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data);
      }
    } catch (e) {
      console.error("fetch bookmarks error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim() || isSubmitting) return;

    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          url: formattedUrl,
          category: category.trim() || "General",
        }),
      });
      if (res.ok) {
        setTitle("");
        setUrl("");
        setCategory("");
        fetchBookmarks();
      }
    } catch (e) {
      console.error("add bookmark error:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bookmark?")) return;
    try {
      const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b._id !== id));
      }
    } catch (e) {
      console.error("delete bookmark error:", e);
    }
  };

  // Extract categories dynamically
  const categoriesList = ["All", ...Array.from(new Set(bookmarks.map((b) => b.category)))];

  const filteredBookmarks = bookmarks.filter(
    (b) => selectedCategory === "All" || b.category === selectedCategory
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll relative">
      {/* Ambient glows */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[250px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Banner */}
      <div className="border-b border-neutral-900 bg-neutral-900/10 px-4 sm:px-8 py-4 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 select-none relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-cyan-400" />
            <h1
              className="text-xl font-bold text-neutral-100 tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Bookmarks
            </h1>
          </div>
          <p className="text-neutral-500 text-xs">Save external study links, blogs references, or documentation binders.</p>
        </div>
      </div>

      {/* Inline Bookmark adding box */}
      <div className="p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-8 relative z-10">
        <form onSubmit={handleAdd} className="bg-neutral-955/40 backdrop-blur-md border border-white/5 hover:border-neutral-800 rounded-xl p-5 space-y-4 hover:shadow-[0_0_25px_rgba(255,255,255,0.02)] transition-all">
          <h2
            className="text-[10px] font-bold text-neutral-350 uppercase tracking-widest select-none"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Quick Save Link
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Input
              placeholder="Title (e.g. Next.js docs)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-neutral-950 border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-700 h-9 text-xs"
            />
            <Input
              placeholder="URL (e.g. nextjs.org)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="bg-neutral-950 border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-700 h-9 text-xs"
            />
            <div className="flex gap-2">
              <Input
                placeholder="Category (e.g. Coding)"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 bg-neutral-950 border-neutral-850 focus:border-cyan-400 text-neutral-100 placeholder-neutral-700 h-9 text-xs"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs h-9 px-4 rounded-lg shrink-0 transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {isSubmitting ? "Saving..." : "Add"}
              </Button>
            </div>
          </div>
        </form>

        {/* Categories Tab selectors */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-900 pb-2 select-none">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
                selectedCategory === cat
                  ? "bg-neutral-900 border border-neutral-800 text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Bookmarks list render */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 text-xs gap-2 select-none font-semibold">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            <span style={{ fontFamily: "var(--font-jetbrains-mono)" }}>RETRIEVING BOOKMARKS...</span>
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-neutral-900 rounded-2xl bg-neutral-900/5 select-none">
            <Link2 className="h-10 w-10 text-neutral-700" />
            <div className="space-y-1">
              <h3 className="text-neutral-300 font-bold text-sm" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                No bookmarks saved
              </h3>
              <p className="text-neutral-505 text-xs max-w-xs leading-normal">
                {selectedCategory === "All"
                  ? "Save your first study link using the bookmark console above!"
                  : `No bookmarks found inside the "${selectedCategory}" category.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredBookmarks.map((b) => (
              <div
                key={b._id}
                className="glass glass-card-hover p-4 flex items-center justify-between gap-4 transition-all duration-300"
              >
                <div className="space-y-1 min-w-0">
                  <h3
                    className="text-xs font-bold text-neutral-150 truncate"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {b.title}
                  </h3>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-neutral-505 hover:text-cyan-400 flex items-center gap-1 hover:underline truncate transition-colors"
                    style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                  >
                    <span>{b.url}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>

                <div className="flex items-center gap-3 shrink-0 select-none">
                  <span
                    className="text-[9px] bg-neutral-950 text-neutral-500 border border-neutral-850 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                    style={{ fontFamily: "var(--font-jetbrains-mono)" }}
                  >
                    <Tag className="h-2.5 w-2.5 text-cyan-400/80" />
                    {b.category}
                  </span>

                  <button
                    onClick={() => handleDelete(b._id)}
                    className="p-1.5 rounded hover:bg-neutral-900 text-neutral-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
