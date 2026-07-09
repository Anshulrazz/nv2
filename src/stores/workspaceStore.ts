import { create } from "zustand";
import { JSONContent } from "@tiptap/react";

export interface FolderData {
  _id: string;
  name: string;
  color?: string | null;
  parentId?: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteData {
  _id: string;
  title: string;
  content: JSONContent;
  folderId?: string | null;
  userId: string;
  isFavorite: boolean;
  isTrashed: boolean;
  published?: boolean;
  slug?: string;
  tags?: string[];
  category?: string;
  coverImage?: string;
  readingTime?: string;
  wordCount?: number;
  seoTitle?: string;
  seoDescription?: string;
  scheduledAt?: string;
  isPinned?: boolean;
  isFlagged?: boolean;
  assetUrl?: string;
  assetName?: string;
  createdAt: string;
  updatedAt: string;
}

interface WorkspaceState {
  folders: FolderData[];
  notes: NoteData[];
  selectedFolderId: string | null;
  activeNoteId: string | null;
  isLoading: boolean;

  fetchFolders: () => Promise<void>;
  fetchNotes: (folderId?: string | null) => Promise<void>;
  createFolder: (name: string, parentId?: string | null, color?: string | null) => Promise<FolderData | null>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;

  createNote: (title: string, folderId?: string | null) => Promise<NoteData | null>;
  deleteNote: (id: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<NoteData>) => Promise<void>;

  setSelectedFolderId: (id: string | null) => void;
  setActiveNoteId: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  folders: [],
  notes: [],
  selectedFolderId: null,
  activeNoteId: null,
  isLoading: false,

  fetchFolders: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/folders");
      if (res.ok) {
        const folders = await res.json();
        set({ folders });
      }
    } catch (e) {
      console.error("fetch folders error", e);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchNotes: async (folderId = null) => {
    try {
      let url = "/api/notes";
      if (folderId) {
        url += `?folderId=${folderId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const notes = await res.json();
        set({ notes });
      }
    } catch (e) {
      console.error("fetch notes error", e);
    }
  },

  createFolder: async (name, parentId = null, color = null) => {
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, parentId, color }),
      });
      if (res.ok) {
        const folder = await res.json();
        set((state) => ({ folders: [...state.folders, folder] }));
        return folder;
      }
    } catch (e) {
      console.error("create folder error", e);
    }
    return null;
  },

  renameFolder: async (id, name) => {
    try {
      const res = await fetch(`/api/folders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          folders: state.folders.map((f) => (f._id === id ? updated : f)),
        }));
      }
    } catch (e) {
      console.error("rename folder error", e);
    }
  },

  deleteFolder: async (id) => {
    try {
      const res = await fetch(`/api/folders/${id}`, { method: "DELETE" });
      if (res.ok) {
        set((state) => ({
          folders: state.folders.filter((f) => f._id !== id),
          selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
        }));
        // Reload notes to refresh layout lists
        get().fetchNotes(get().selectedFolderId);
      }
    } catch (e) {
      console.error("delete folder error", e);
    }
  },

  createNote: async (title, folderId = null) => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, folderId }),
      });
      if (res.ok) {
        const note = await res.json();
        set((state) => ({
          notes: [note, ...state.notes],
          activeNoteId: note._id,
        }));
        return note;
      }
    } catch (e) {
      console.error("create note error", e);
    }
    return null;
  },

  deleteNote: async (id) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        set((state) => ({
          notes: state.notes.filter((n) => n._id !== id),
          activeNoteId: state.activeNoteId === id ? null : state.activeNoteId,
        }));
      }
    } catch (e) {
      console.error("delete note error", e);
    }
  },

  updateNote: async (id, updates) => {
    // Optimistic state updates locally
    set((state) => ({
      notes: state.notes.map((n) => (n._id === id ? { ...n, ...updates } : n)),
    }));
    try {
      await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    } catch (e) {
      console.error("update note error", e);
    }
  },

  setSelectedFolderId: (selectedFolderId) => {
    set({ selectedFolderId });
    get().fetchNotes(selectedFolderId);
  },

  setActiveNoteId: (activeNoteId) => {
    set({ activeNoteId });
  },
}));
