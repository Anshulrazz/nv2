"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FolderData, useWorkspaceStore } from "@/stores/workspaceStore";
import { useDashboardShell } from "@/components/layout/DashboardShellContext";
import {
  Folder,
  FolderPlus,
  FilePlus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
  FileText,
  Check,
  X,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export function SidebarTree() {
  const router = useRouter();
  const pathname = usePathname();

  let closeMobileNav: (() => void) | undefined;
  try {
    const shell = useDashboardShell();
    closeMobileNav = shell.closeMobileNav;
  } catch {
    // Fallback if rendered outside provider
  }

  const {
    folders,
    notes,
    selectedFolderId,
    activeNoteId,
    fetchFolders,
    fetchNotes,
    createFolder,
    renameFolder,
    deleteFolder,
    createNote,
    deleteNote,
    setSelectedFolderId,
    setActiveNoteId,
  } = useWorkspaceStore();

  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  const handleCloseMobile = () => {
    if (closeMobileNav) {
      closeMobileNav();
    }
  };

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolderId(folderId);
    handleCloseMobile();
    if (pathname !== "/notes") {
      router.push("/notes");
    }
  };

  const handleSelectNote = (noteId: string) => {
    setActiveNoteId(noteId);
    handleCloseMobile();
    if (pathname !== "/notes") {
      router.push("/notes");
    }
  };

  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [activeParentId, setActiveParentId] = useState<string | null>(null);

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  useEffect(() => {
    fetchFolders();
    fetchNotes(null);
  }, [fetchFolders, fetchNotes]);

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName.trim(), activeParentId, null);
    if (activeParentId) {
      setExpandedFolders((prev) => ({ ...prev, [activeParentId]: true }));
    }
    setNewFolderName("");
    setIsNewFolderOpen(false);
  };

  const openNewFolderDialog = (parentId: string | null = null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveParentId(parentId);
    setIsNewFolderOpen(true);
  };

  const handleCreateNote = async (folderId: string | null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const title = prompt("Enter note title:") || "Untitled Note";
    if (title.trim()) {
      const created = await createNote(title.trim(), folderId);
      if (created?._id) {
        handleSelectNote(created._id);
      }
    }
  };

  const handleStartRename = (folder: FolderData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(folder._id);
    setEditingFolderName(folder.name);
  };

  const handleSaveRename = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingFolderName.trim()) {
      await renameFolder(folderId, editingFolderName.trim());
    }
    setEditingFolderId(null);
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this folder and all its contents? This is permanent.")) {
      await deleteFolder(folderId);
    }
  };

  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteNote(noteId);
    }
  };

  const renderFolderNode = (folder: FolderData, level: number = 0) => {
    const childFolders = folders.filter((f) => f.parentId === folder._id);
    const folderNotes = notes.filter((n) => n.folderId === folder._id && !n.isTrashed);
    const isExpanded = !!expandedFolders[folder._id];
    const isSelected = selectedFolderId === folder._id;
    const isEditing = editingFolderId === folder._id;

    return (
      <div key={folder._id} className="space-y-0.5">
        <div
          onClick={() => handleSelectFolder(folder._id)}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          className={`group flex items-center justify-between min-h-[36px] py-1.5 pr-2 rounded-lg cursor-pointer transition-all duration-150 ease-out active:scale-[0.99] select-none ${
            isSelected
              ? "bg-bg-elevated text-text-primary border-l-2 border-accent-primary font-medium"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-surface"
          }`}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={(e) => toggleExpand(folder._id, e)}
              className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary"
              aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
            >
              {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </button>
            <Folder className={`size-4 shrink-0 ${isSelected ? "text-accent-primary" : "text-text-muted"}`} />

            {isEditing ? (
              <input
                type="text"
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="bg-bg-base border border-border-default rounded px-1.5 py-0.5 text-xs text-text-primary max-w-[120px] focus:outline-none focus:border-accent-primary"
              />
            ) : (
              <span className="text-xs font-medium truncate">{folder.name}</span>
            )}
          </div>

          {/* Folder Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={(e) => handleSaveRename(folder._id, e)}
                  className="p-1 rounded hover:bg-bg-elevated text-success"
                  aria-label="Save folder rename"
                >
                  <Check className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolderId(null);
                  }}
                  className="p-1 rounded hover:bg-bg-elevated text-destructive"
                  aria-label="Cancel folder rename"
                >
                  <X className="size-3.5" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={(e) => handleCreateNote(folder._id, e)}
                  title="Create note"
                  className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary"
                  aria-label="Create note in folder"
                >
                  <FilePlus className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => openNewFolderDialog(folder._id, e)}
                  title="Create subfolder"
                  className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary"
                  aria-label="Create subfolder"
                >
                  <FolderPlus className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleStartRename(folder, e)}
                  title="Rename"
                  className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-text-primary"
                  aria-label="Rename folder"
                >
                  <Edit2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteFolder(folder._id, e)}
                  title="Delete"
                  className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-destructive"
                  aria-label="Delete folder"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-0.5">
            {childFolders.map((child) => renderFolderNode(child, level + 1))}
            {folderNotes.map((note) => {
              const isNoteActive = activeNoteId === note._id;
              return (
                <div
                  key={note._id}
                  onClick={() => handleSelectNote(note._id)}
                  style={{ paddingLeft: `${(level + 1) * 12 + 18}px` }}
                  className={`group flex items-center justify-between min-h-[34px] py-1 pr-2 rounded-lg cursor-pointer transition-all duration-150 ease-out active:scale-[0.99] select-none ${
                    isNoteActive
                      ? "bg-bg-elevated text-text-primary font-medium border-l-2 border-accent-primary"
                      : "text-text-secondary hover:text-text-primary hover:bg-bg-surface"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className={`size-3.5 shrink-0 ${isNoteActive ? "text-accent-primary" : "text-text-muted"}`} />
                    <span className="text-xs truncate">{note.title}</span>
                    {note.assetUrl && <Paperclip className="size-3 text-accent-secondary shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteNote(note._id, e)}
                    className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete note"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}
            {childFolders.length === 0 && folderNotes.length === 0 && (
              <div
                style={{ paddingLeft: `${(level + 1) * 12 + 18}px` }}
                className="py-1 text-[10px] text-text-muted italic select-none"
              >
                Empty folder
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const rootFolders = folders.filter((f) => !f.parentId);
  const rootNotes = notes.filter((n) => !n.folderId && !n.isTrashed);

  return (
    <div className="w-full flex flex-col space-y-2.5">
      <div className="px-3 flex items-center justify-between select-none">
        <span
          className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono"
        >
          Folders &amp; Notes
        </span>
        <button
          type="button"
          onClick={() => openNewFolderDialog(null)}
          title="Create root folder"
          className="p-1 rounded-lg hover:bg-bg-surface text-text-muted hover:text-accent-primary transition-colors"
          aria-label="Create root folder"
        >
          <FolderPlus className="size-3.5" />
        </button>
      </div>

      <div className="space-y-0.5 pr-1">
        {rootFolders.map((folder) => renderFolderNode(folder, 0))}

        {rootNotes.map((note) => {
          const isNoteActive = activeNoteId === note._id;
          return (
            <div
              key={note._id}
              onClick={() => handleSelectNote(note._id)}
              className={`group flex items-center justify-between min-h-[34px] py-1.5 px-3 rounded-lg cursor-pointer transition-all duration-150 ease-out active:scale-[0.99] select-none ${
                isNoteActive
                  ? "bg-bg-elevated text-text-primary font-medium border-l-2 border-accent-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-surface"
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className={`size-3.5 shrink-0 ${isNoteActive ? "text-accent-primary" : "text-text-muted"}`} />
                <span className="text-xs truncate">{note.title}</span>
                {note.assetUrl && <Paperclip className="size-3 text-accent-secondary shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />}
              </div>
              <button
                type="button"
                onClick={(e) => handleDeleteNote(note._id, e)}
                className="p-1 rounded hover:bg-bg-elevated text-text-muted hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete note"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          );
        })}

        {rootFolders.length === 0 && rootNotes.length === 0 && (
          <div className="text-center py-4 text-[10px] text-text-muted border border-dashed border-border-subtle rounded-xl">
            No folders or notes yet.
          </div>
        )}
      </div>

      {/* Create folder dialog */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent className="bg-bg-surface border-border-subtle text-text-primary max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle
              className="text-sm font-bold text-text-primary font-display"
            >
              {activeParentId ? "Create Subfolder" : "Create Root Folder"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Folder Name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="bg-bg-base border-border-subtle focus:border-accent-primary text-text-primary placeholder:text-text-muted h-10 text-xs"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsNewFolderOpen(false)}
              className="border-border-subtle text-text-secondary hover:text-text-primary bg-bg-surface hover:bg-bg-elevated text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              className="btn-premium-primary text-xs h-9 px-4"
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
