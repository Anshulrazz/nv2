"use client";

import React, { useEffect, useState } from "react";
import { FolderData, useWorkspaceStore } from "@/stores/workspaceStore";
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

  const closeMobileSidebar = () => {
    const checkbox = document.getElementById("sidebar-toggle") as HTMLInputElement | null;
    if (checkbox) {
      checkbox.checked = false;
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
      await createNote(title.trim(), folderId);
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
          onClick={() => setSelectedFolderId(folder._id)}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
          className={`group flex items-center justify-between py-1.5 pr-2 rounded-lg cursor-pointer transition-all duration-150 select-none ${
            isSelected
              ? "bg-cyan-500/10 text-neutral-100 border-l-2 border-cyan-400"
              : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/50"
          }`}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <button
              onClick={(e) => toggleExpand(folder._id, e)}
              className="p-0.5 rounded hover:bg-neutral-800 text-neutral-600 hover:text-neutral-400"
            >
              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            <Folder className={`h-4 w-4 shrink-0 ${isSelected ? "text-cyan-400" : "text-neutral-600"}`} />

            {isEditing ? (
              <input
                type="text"
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-950 border border-neutral-800 rounded px-1 text-xs text-neutral-100 max-w-[100px] focus:outline-none focus:border-cyan-400"
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
                  onClick={(e) => handleSaveRename(folder._id, e)}
                  className="p-1 rounded hover:bg-neutral-800 text-emerald-400"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolderId(null);
                  }}
                  className="p-1 rounded hover:bg-neutral-800 text-red-400"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => handleCreateNote(folder._id, e)}
                  title="Create note"
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-600 hover:text-neutral-100"
                >
                  <FilePlus className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => openNewFolderDialog(folder._id, e)}
                  title="Create subfolder"
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-600 hover:text-neutral-100"
                >
                  <FolderPlus className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => handleStartRename(folder, e)}
                  title="Rename"
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-600 hover:text-neutral-100"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => handleDeleteFolder(folder._id, e)}
                  title="Delete"
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-600 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
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
                  onClick={() => {
                    setActiveNoteId(note._id);
                    closeMobileSidebar();
                  }}
                  style={{ paddingLeft: `${(level + 1) * 12 + 18}px` }}
                  className={`group flex items-center justify-between py-1 pr-2 rounded-lg cursor-pointer transition-all duration-150 select-none ${
                    isNoteActive
                      ? "bg-neutral-800 text-neutral-100 font-medium"
                      : "text-neutral-600 hover:text-neutral-300 hover:bg-neutral-900/30"
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <FileText className={`h-3.5 w-3.5 shrink-0 ${isNoteActive ? "text-cyan-400" : "text-neutral-700"}`} />
                    <span className="text-[11px] truncate">{note.title}</span>
                    {note.assetUrl && <Paperclip className="h-3 w-3 text-cyan-500 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />}
                  </div>
                  <button
                    onClick={(e) => handleDeleteNote(note._id, e)}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
            {childFolders.length === 0 && folderNotes.length === 0 && (
              <div
                style={{ paddingLeft: `${(level + 1) * 12 + 18}px` }}
                className="py-1 text-[10px] text-neutral-700 italic select-none"
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
    <div className="w-full flex flex-col space-y-3">
      <div className="px-3 flex items-center justify-between select-none">
        <span
          className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Folders &amp; Notes
        </span>
        <button
          onClick={() => openNewFolderDialog(null)}
          title="Create root folder"
          className="p-1 rounded hover:bg-neutral-900 text-neutral-600 hover:text-cyan-400 transition-colors"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="space-y-0.5 overflow-y-auto max-h-[280px] custom-scroll pr-1">
        {rootFolders.map((folder) => renderFolderNode(folder, 0))}

        {rootNotes.map((note) => {
          const isNoteActive = activeNoteId === note._id;
          return (
            <div
              key={note._id}
              onClick={() => {
                setActiveNoteId(note._id);
                closeMobileSidebar();
              }}
              className={`group flex items-center justify-between py-1.5 px-3 rounded-lg cursor-pointer transition-all duration-150 select-none ${
                isNoteActive
                  ? "bg-neutral-800 text-neutral-100 font-medium"
                  : "text-neutral-505 hover:text-neutral-350 hover:bg-neutral-900/50"
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <FileText className={`h-4 w-4 shrink-0 ${isNoteActive ? "text-cyan-400" : "text-neutral-700"}`} />
                <span className="text-xs truncate">{note.title}</span>
                {note.assetUrl && <Paperclip className="h-3.5 w-3.5 text-cyan-500 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />}
              </div>
              <button
                onClick={(e) => handleDeleteNote(note._id, e)}
                className="p-1 rounded hover:bg-neutral-800 text-neutral-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}

        {rootFolders.length === 0 && rootNotes.length === 0 && (
          <div className="text-center py-4 text-[10px] text-neutral-700 border border-dashed border-neutral-900 rounded-xl">
            No folders or notes yet.
          </div>
        )}
      </div>

      {/* Create folder dialog */}
      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 max-w-sm cyber-panel">
          <DialogHeader>
            <DialogTitle
              className="text-sm font-bold text-neutral-100"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {activeParentId ? "Create Subfolder" : "Create Root Folder"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Folder Name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="bg-neutral-950 border-neutral-800 focus:border-cyan-400 text-neutral-100 placeholder-neutral-600 h-10 text-xs"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsNewFolderOpen(false)}
              className="border-neutral-800 text-neutral-400 hover:text-neutral-100 bg-neutral-950 hover:bg-neutral-900 text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs h-9 px-4 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
