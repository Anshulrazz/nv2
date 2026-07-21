"use client";

import React, { useEffect, useState } from "react";
import {
  Loader2,
  Coins,
  Plus,
  Lock,
  Eye,
  Sparkles,
  AlertCircle,
  X,
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Upload,
  Check,
  Shield,
  BookOpen,
  Copy,
  Edit3,
  Trash2,
  Camera,
  Image as ImageIcon,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import JSZip from "jszip";

interface ProjectOwner {
  id: string;
  name: string;
  email: string;
}

interface ProjectFile {
  path: string;
  content: string;
}

interface ProjectData {
  id: string;
  title: string;
  description: string;
  content: string;
  files: ProjectFile[];
  productionImages: string[];
  isPremium: boolean;
  cost: number;
  owner: ProjectOwner;
  isLocked: boolean;
  isOwner: boolean;
  createdAt: string;
}

// Tree view types
interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: Record<string, TreeNode>;
  file?: ProjectFile;
}

function buildFileTree(files: ProjectFile[]): TreeNode {
  const root: TreeNode = { name: "root", path: "", isFolder: true, children: {} };

  files.forEach((file) => {
    const parts = file.path.split("/");
    let current = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      if (!part) return;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = index === parts.length - 1;

      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: currentPath,
          isFolder: !isLast,
          children: {},
          file: isLast ? file : undefined,
        };
      }
      current = current.children[part];
    });
  });

  return root;
}

interface FileTreeProps {
  node: TreeNode;
  onSelectFile: (file: ProjectFile) => void;
  selectedPath: string;
  expandedFolders: Record<string, boolean>;
  toggleFolder: (path: string) => void;
}

function FileTree({ node, onSelectFile, selectedPath, expandedFolders, toggleFolder }: FileTreeProps) {
  const sortedKeys = Object.keys(node.children).sort((a, b) => {
    const nodeA = node.children[a];
    const nodeB = node.children[b];
    if (nodeA.isFolder && !nodeB.isFolder) return -1;
    if (!nodeA.isFolder && nodeB.isFolder) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="pl-3.5 space-y-1">
      {sortedKeys.map((key) => {
        const child = node.children[key];
        if (child.isFolder) {
          const isExpanded = !!expandedFolders[child.path];
          return (
            <div key={child.path} className="space-y-1">
              <div
                onClick={() => toggleFolder(child.path)}
                className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/50 cursor-pointer text-xs transition-all font-semibold font-space select-none"
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-neutral-500 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-neutral-500 shrink-0" />}
                <Folder className="h-3.5 w-3.5 text-cyan-500/80 fill-cyan-500/10 shrink-0" />
                <span className="truncate">{child.name}</span>
              </div>
              {isExpanded && (
                <FileTree
                  node={child}
                  onSelectFile={onSelectFile}
                  selectedPath={selectedPath}
                  expandedFolders={expandedFolders}
                  toggleFolder={toggleFolder}
                />
              )}
            </div>
          );
        } else {
          const isSelected = selectedPath === child.path;
          return (
            <div
              key={child.path}
              onClick={() => child.file && onSelectFile(child.file)}
              className={`flex items-center gap-1.5 py-1 px-1.5 rounded-lg cursor-pointer text-xs transition-all font-mono select-none ${
                isSelected
                  ? "bg-cyan-500/10 text-cyan-400 font-semibold border-l border-cyan-500 rounded-l-none"
                  : "text-neutral-450 hover:text-neutral-200 hover:bg-neutral-900/30"
              }`}
            >
              <span className="w-3.5 shrink-0" />
              <File className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
              <span className="truncate">{child.name}</span>
            </div>
          );
        }
      })}
    </div>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [coins, setCoins] = useState<number>(0);
  const [isPremiumUser, setIsPremiumUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upgrade premium state
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Create Project Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [cost, setCost] = useState("100");
  const [uploadedFiles, setUploadedFiles] = useState<ProjectFile[]>([]);
  const [productionImages, setProductionImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Create Modal preview states
  const [createPreviewFile, setCreatePreviewFile] = useState<ProjectFile | null>(null);
  const [createExpandedFolders, setCreateExpandedFolders] = useState<Record<string, boolean>>({});

  // Edit Project Modal state
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editIsPremium, setEditIsPremium] = useState(false);
  const [editCost, setEditCost] = useState("100");
  const [editFiles, setEditFiles] = useState<ProjectFile[]>([]);
  const [editImages, setEditImages] = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  // Edit preview states
  const [editPreviewFile, setEditPreviewFile] = useState<ProjectFile | null>(null);
  const [editExpandedFolders, setEditExpandedFolders] = useState<Record<string, boolean>>({});

  // View repository explorer state
  const [viewingProject, setViewingProject] = useState<ProjectData | null>(null);
  const [viewingSelectedFile, setViewingSelectedFile] = useState<ProjectFile | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [copiedFile, setCopiedFile] = useState(false);

  // Responsive mobile views toggle
  const [mobileTab, setMobileTab] = useState<"files" | "code">("files");

  // Action states
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [downloadingZipId, setDownloadingZipId] = useState<string | null>(null);

  const downloadAsZip = async (project: ProjectData) => {
    try {
      setDownloadingZipId(project.id);
      
      const zip = new JSZip();
      
      project.files.forEach((file) => {
        zip.file(file.path, file.content);
      });

      const content = await zip.generateAsync({ type: "blob" });
      
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `${project.title.toLowerCase().replace(/\s+/g, "-")}.zip`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      alert("Failed to compress and download project: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setDownloadingZipId(null);
    }
  };

  const fetchProfileAndProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch user profile to get coin balance & premium status
      const profileRes = await fetch("/api/user/profile");
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setCoins(profile.coins || 0);
        setIsPremiumUser(!!profile.isPremiumUser);
      }

      // Fetch projects
      const projectsRes = await fetch("/api/projects");
      if (!projectsRes.ok) {
        throw new Error("Failed to retrieve projects lists.");
      }
      const projData = await projectsRes.json();
      setProjects(projData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error connecting to server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndProjects();
  }, []);

  const handleUpgradePremium = async () => {
    if (coins < 500) {
      alert("You need at least 500 Coins to upgrade to Premium! Refer friends to earn more coins.");
      return;
    }

    if (!confirm("Are you sure you want to spend 500 Coins to upgrade to Premium status?")) {
      return;
    }

    try {
      setIsUpgrading(true);
      const res = await fetch("/api/user/premium", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upgrade failed.");
      }

      setCoins(data.coins);
      setIsPremiumUser(true);
      alert("Congratulations! You are now a Premium user with a 150 file upload limit!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upgrade failed.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>, forEdit: boolean = false) => {
    const filesList = e.target.files;
    if (!filesList) return;

    if (forEdit) setEditFormError(null);
    else setFormError(null);

    // Look for `.gitignore` file first to pre-load rules
    let gitignoreContent = "";
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const path = file.webkitRelativePath || file.name;
      const cleanPath = path.substring(path.indexOf("/") + 1);
      
      if (cleanPath === ".gitignore") {
        gitignoreContent = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve((event.target?.result as string) || "");
          reader.onerror = () => resolve("");
          reader.readAsText(file);
        });
        break;
      }
    }

    // Parse `.gitignore` rules
    const gitignoreRules: string[] = [];
    if (gitignoreContent) {
      gitignoreContent.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          gitignoreRules.push(trimmed);
        }
      });
    }

    // Iterate and filter remaining files
    const readFiles: ProjectFile[] = [];
    const ignoredExtensions = [
      ".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".eot",
      ".mp4", ".mp3", ".zip", ".tar", ".gz", ".pdf", ".db", ".sqlite", ".lock",
      ".tsbuildinfo", ".map"
    ];

    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const path = file.webkitRelativePath || file.name;
      const cleanPath = path.substring(path.indexOf("/") + 1);

      // Default static rules
      if (
        cleanPath.includes("node_modules/") ||
        cleanPath.includes(".git/") ||
        cleanPath.includes(".next/") ||
        cleanPath.includes("dist/") ||
        cleanPath.includes("build/") ||
        cleanPath.includes(".DS_Store") ||
        ignoredExtensions.some((ext) => cleanPath.toLowerCase().endsWith(ext))
      ) {
        continue;
      }

      // Match against `.gitignore` rules
      if (gitignoreRules.length > 0) {
        const isIgnored = gitignoreRules.some((rule) => {
          if (rule.endsWith("/")) {
            const dir = rule.slice(0, -1);
            return cleanPath === dir || cleanPath.startsWith(dir + "/") || cleanPath.includes("/" + dir + "/");
          }
          if (rule.startsWith("*")) {
            const ext = rule.slice(1);
            return cleanPath.endsWith(ext);
          }
          return cleanPath === rule || cleanPath.endsWith("/" + rule);
        });
        if (isIgnored) continue;
      }

      // Read file content
      const contentText = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve((event.target?.result as string) || "");
        reader.onerror = () => resolve("");
        reader.readAsText(file);
      });

      readFiles.push({
        path: cleanPath || file.name,
        content: contentText,
      });
    }

    const currentLimit = isPremiumUser ? 250 : 50;
    if (readFiles.length > currentLimit) {
      const errMsg = `File count limit exceeded! Selected ${readFiles.length} files. Your limit is ${currentLimit}. ${
        !isPremiumUser ? "Upgrade to Premium to upload up to 250 files!" : ""
      }`;
      if (forEdit) setEditFormError(errMsg);
      else setFormError(errMsg);
    }

    const newExp: Record<string, boolean> = {};
    readFiles.forEach((f) => {
      const parts = f.path.split("/");
      let current = "";
      parts.slice(0, -1).forEach((part) => {
        current = current ? `${current}/${part}` : part;
        newExp[current] = true;
      });
    });

    if (forEdit) {
      setEditFiles(readFiles);
      if (readFiles.length > 0) {
        const readme = readFiles.find((f) => f.path.toLowerCase() === "readme.md");
        setEditPreviewFile(readme || readFiles[0]);
        setEditExpandedFolders(newExp);
      } else {
        setEditPreviewFile(null);
      }
    } else {
      setUploadedFiles(readFiles);
      if (readFiles.length > 0) {
        const readme = readFiles.find((f) => f.path.toLowerCase() === "readme.md");
        setCreatePreviewFile(readme || readFiles[0]);
        setCreateExpandedFolders(newExp);
      } else {
        setCreatePreviewFile(null);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, forEdit: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        if (forEdit) {
          setEditImages((prev) => [...prev, data.url]);
        } else {
          setProductionImages((prev) => [...prev, data.url]);
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeProductionImage = (url: string, forEdit: boolean = false) => {
    if (forEdit) {
      setEditImages((prev) => prev.filter((img) => img !== url));
    } else {
      setProductionImages((prev) => prev.filter((img) => img !== url));
    }
  };

  const loadTemplateFiles = (forEdit: boolean = false) => {
    const templates: ProjectFile[] = [
      {
        path: "README.md",
        content: `# sample-node-project\n\nA beautiful sample repository created to demonstrate GitHub-style navigation!\n\n## Getting Started\nRun:\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`,
      },
      {
        path: "src/index.js",
        content: `// Main entry point\nconst express = require('express');\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\napp.get('/', (req, res) => {\n  res.send('Hello from Notexia Repository!');\n});\n\napp.listen(PORT, () => {\n  console.log(\`Server is listening on port \${PORT}\`);\n});\n`,
      },
      {
        path: "src/utils/math.js",
        content: `// Helper functions\nfunction add(a, b) {\n  return a + b;\n}\n\nfunction subtract(a, b) {\n  return a - b;\n}\n\nmodule.exports = { add, subtract };\n`,
      },
      {
        path: "package.json",
        content: `{\n  "name": "sample-node-project",\n  "version": "1.0.0",\n  "main": "src/index.js",\n  "scripts": {\n    "dev": "node src/index.js"\n  },\n  "dependencies": {\n    "express": "^4.19.2"\n  }\n}\n`,
      },
    ];

    const newExp: Record<string, boolean> = {};
    templates.forEach((f) => {
      const parts = f.path.split("/");
      let current = "";
      parts.slice(0, -1).forEach((part) => {
        current = current ? `${current}/${part}` : part;
        newExp[current] = true;
      });
    });

    if (forEdit) {
      setEditFiles(templates);
      setEditFormError(null);
      setEditPreviewFile(templates[0]);
      setEditExpandedFolders(newExp);
    } else {
      setUploadedFiles(templates);
      setFormError(null);
      setCreatePreviewFile(templates[0]);
      setCreateExpandedFolders(newExp);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !description.trim() || !content.trim()) {
      setFormError("All fields are required.");
      return;
    }

    const currentLimit = isPremiumUser ? 250 : 50;
    if (uploadedFiles.length > currentLimit) {
      setFormError(`Cannot publish. You have ${uploadedFiles.length} files but your limit is ${currentLimit}.`);
      return;
    }

    const coinCost = parseInt(cost);
    if (isPremium && (isNaN(coinCost) || coinCost < 0)) {
      setFormError("Please enter a valid positive cost value.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          content: content.trim(),
          isPremium,
          cost: isPremium ? coinCost : 0,
          files: uploadedFiles,
          productionImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create project.");
      }

      await fetchProfileAndProjects();

      // Reset
      setTitle("");
      setDescription("");
      setContent("");
      setIsPremium(false);
      setCost("100");
      setUploadedFiles([]);
      setProductionImages([]);
      setCreatePreviewFile(null);
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (proj: ProjectData) => {
    setEditingProject(proj);
    setEditTitle(proj.title);
    setEditDescription(proj.description);
    setEditContent(proj.content);
    setEditIsPremium(proj.isPremium);
    setEditCost(proj.cost.toString());
    setEditFiles(proj.files || []);
    setEditImages(proj.productionImages || []);
    setEditFormError(null);

    if (proj.files && proj.files.length > 0) {
      const readme = proj.files.find((f) => f.path.toLowerCase() === "readme.md");
      setEditPreviewFile(readme || proj.files[0]);

      const newExp: Record<string, boolean> = {};
      proj.files.forEach((f) => {
        const parts = f.path.split("/");
        let current = "";
        parts.slice(0, -1).forEach((part) => {
          current = current ? `${current}/${part}` : part;
          newExp[current] = true;
        });
      });
      setEditExpandedFolders(newExp);
    } else {
      setEditPreviewFile(null);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setEditFormError(null);

    if (!editTitle.trim() || !editDescription.trim() || !editContent.trim()) {
      setEditFormError("All fields are required.");
      return;
    }

    const currentLimit = isPremiumUser ? 250 : 50;
    if (editFiles.length > currentLimit) {
      setEditFormError(`Cannot save. You have ${editFiles.length} files but your limit is ${currentLimit}.`);
      return;
    }

    const coinCost = parseInt(editCost);
    if (editIsPremium && (isNaN(coinCost) || coinCost < 0)) {
      setEditFormError("Please enter a valid positive cost value.");
      return;
    }

    try {
      setIsSavingEdit(true);
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          content: editContent.trim(),
          isPremium: editIsPremium,
          cost: editIsPremium ? coinCost : 0,
          files: editFiles,
          productionImages: editImages,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update project.");
      }

      await fetchProfileAndProjects();
      setEditingProject(null);
    } catch (err) {
      setEditFormError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to permanently delete this project? This action cannot be undone.")) {
      return;
    }

    try {
      setIsSavingEdit(true);
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete project.");
      }

      await fetchProfileAndProjects();
      setEditingProject(null);
      alert("Project deleted successfully.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleUnlockProject = async (projectId: string, title: string, projectCost: number) => {
    if (coins < projectCost) {
      alert(`Insufficient coins balance! You need ${projectCost} coins to unlock this project.`);
      return;
    }

    if (!confirm(`Are you sure you want to spend ${projectCost} coins to unlock "${title}"?`)) {
      return;
    }

    try {
      setUnlockingId(projectId);
      const res = await fetch(`/api/projects/${projectId}/unlock`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unlock failed.");
      }

      setCoins(data.remainingCoins);
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, isLocked: false, content: data.project.content, files: data.project.files, productionImages: data.project.productionImages }
            : p
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to unlock project.");
    } finally {
      setUnlockingId(null);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const toggleCreateFolder = (path: string) => {
    setCreateExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const toggleEditFolder = (path: string) => {
    setEditExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  // Setup viewer variables on click Project
  const handleOpenProjectViewer = (proj: ProjectData) => {
    setViewingProject(proj);
    setMobileTab("files");
    if (proj.files && proj.files.length > 0) {
      const readme = proj.files.find((f) => f.path.toLowerCase() === "readme.md");
      setViewingSelectedFile(readme || proj.files[0]);

      const newExp: Record<string, boolean> = {};
      proj.files.forEach((f) => {
        const parts = f.path.split("/");
        let current = "";
        parts.slice(0, -1).forEach((part) => {
          current = current ? `${current}/${part}` : part;
          newExp[current] = true;
        });
      });
      setExpandedFolders(newExp);
    } else {
      setViewingSelectedFile(null);
    }
  };

  const handleSelectFile = (file: ProjectFile) => {
    setViewingSelectedFile(file);
    setMobileTab("code");
  };

  const handleCopyFileContent = () => {
    if (!viewingSelectedFile) return;
    navigator.clipboard.writeText(viewingSelectedFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-500 select-none gap-2 px-4 text-center">
        <Loader2 className="h-5 w-5 animate-spin text-cyan-400 shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
          Accessing Project Registries...
        </span>
      </div>
    );
  }

  // Pre-calculate file limits
  const fileLimit = isPremiumUser ? 250 : 50;

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-y-auto custom-scroll relative">
      {/* Header Banner */}
      <div className="border-b border-neutral-900 bg-neutral-900/10 px-4 py-5 sm:px-8 sm:py-8 shrink-0 select-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[200px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[150px] bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-1 w-6 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 shrink-0" />
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest" style={{ fontFamily: "var(--font-jetbrains-mono)" }}>
                Project Terminal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100 tracking-tight" style={{ fontFamily: "var(--font-space-grotesk)" }}>
              Premium Projects
            </h1>
            <p className="text-neutral-500 text-xs max-w-md">
              Publish structured repositories with file trees, or spend Coins to unlock premium project files.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Coins Balance */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 sm:px-4 flex items-center gap-2 shadow-lg">
              <Coins className="h-4 w-4 text-yellow-500 shrink-0" />
              <div className="text-left">
                <p className="text-[9px] text-neutral-500 uppercase font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>Your Coins</p>
                <p className="text-sm font-extrabold text-neutral-100 font-mono">{coins} <span className="text-[10px] text-yellow-500">Coins</span></p>
              </div>
            </div>

            {/* Premium status indicator */}
            {isPremiumUser ? (
              <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/30 rounded-xl px-3.5 py-2 sm:px-4 flex items-center gap-2 shadow-lg select-none">
                <Shield className="h-4 w-4 text-violet-400 fill-violet-500/20 shrink-0" />
                <div className="text-left">
                  <p className="text-[9px] text-violet-400 uppercase font-bold" style={{ fontFamily: "var(--font-space-grotesk)" }}>Plan Tier</p>
                  <p className="text-xs font-bold text-neutral-100 uppercase tracking-wider whitespace-nowrap">Premium (250 Limit)</p>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleUpgradePremium}
                disabled={isUpgrading}
                className="bg-neutral-900 border border-neutral-800 hover:border-violet-500/30 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] text-neutral-300 font-bold h-11 px-3.5 sm:px-4 rounded-xl flex items-center gap-2 transition-all duration-300"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                <Shield className="h-4 w-4 text-violet-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[8px] text-neutral-500 uppercase font-bold whitespace-nowrap">Go Premium (500 Coins)</p>
                  <p className="text-[10px] font-bold text-violet-400 uppercase whitespace-nowrap">Unlock 250 file limit</p>
                </div>
              </Button>
            )}

            <Button
              onClick={() => setIsModalOpen(true)}
              className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all h-11 px-4 sm:px-5 rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Create Project</span>
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-neutral-400 space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2 max-w-full">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
          <Button onClick={fetchProfileAndProjects} variant="outline" className="text-xs h-9 font-bold border-neutral-800">
            Refresh Connection
          </Button>
        </div>
      ) : (
        <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto flex-1">
          {projects.length === 0 ? (
            <div className="py-14 sm:py-20 px-4 text-center select-none border border-dashed border-neutral-900 rounded-3xl bg-neutral-900/10 flex flex-col items-center justify-center">
              <Sparkles className="h-10 w-10 text-neutral-700 mb-3 opacity-60" />
              <h3 className="text-sm font-bold text-neutral-400" style={{ fontFamily: "var(--font-space-grotesk)" }}>No Projects Found</h3>
              <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-6">
                Be the first to publish a file-structured project! Click &quot;Create Project&quot; to get started.
              </p>
              <Button onClick={() => setIsModalOpen(true)} variant="outline" className="text-xs border-neutral-850 h-9 rounded-xl hover:bg-neutral-900 font-bold">
                Deploy First Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className={`glass border flex flex-col justify-between shadow-lg relative group transition-all duration-300 rounded-2xl overflow-hidden ${
                    proj.isLocked
                      ? "border-neutral-900 hover:border-yellow-500/15"
                      : "border-neutral-900 hover:border-cyan-500/15"
                  }`}
                >
                  {/* Production Screenshot Banner or Gradient abstraction */}
                  {proj.productionImages && proj.productionImages.length > 0 ? (
                    <div className="w-full h-32 sm:h-36 relative overflow-hidden border-b border-neutral-900 shrink-0">
                      <img src={proj.productionImages[0]} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
                    </div>
                  ) : (
                    <div className="w-full h-20 sm:h-24 bg-gradient-to-br from-neutral-900 via-neutral-950 to-cyan-950/20 border-b border-neutral-900 shrink-0 relative">
                      <div className="absolute inset-0 opacity-40 mix-blend-color-dodge bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))]" />
                    </div>
                  )}

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5 min-w-0">
                          {proj.isPremium ? (
                            <span className="text-[9px] font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded font-mono uppercase whitespace-nowrap">
                              Premium
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-neutral-800 border border-neutral-750 text-neutral-400 px-2 py-0.5 rounded font-mono uppercase whitespace-nowrap">
                              Free
                            </span>
                          )}
                          {proj.isOwner && (
                            <span className="text-[9px] font-bold bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded font-mono uppercase whitespace-nowrap">
                              Creator
                            </span>
                          )}
                          {!proj.isPremium && (
                            <span className="text-[9px] font-bold bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono uppercase whitespace-nowrap">
                              Unlocked
                            </span>
                          )}
                          {proj.isPremium && !proj.isLocked && !proj.isOwner && (
                            <span className="text-[9px] font-bold bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded font-mono uppercase whitespace-nowrap">
                              Unlocked
                            </span>
                          )}
                          <span className="text-[9px] font-bold bg-neutral-900 border border-neutral-850 text-neutral-500 px-2 py-0.5 rounded font-mono whitespace-nowrap">
                            {proj.files?.length || 0} Files
                          </span>
                        </div>

                        <span className="text-[9px] text-neutral-600 font-mono shrink-0 whitespace-nowrap">
                          {new Date(proj.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-neutral-100 group-hover:text-cyan-400 transition-colors break-words" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                          {proj.title}
                        </h3>
                        <p className="text-xs text-neutral-500 line-clamp-2">
                          {proj.description}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-neutral-900/60 mt-4 pt-4 flex flex-wrap items-center justify-between gap-2.5">
                      <span className="text-[10px] text-neutral-600 truncate min-w-0">
                        By <span className="font-semibold text-neutral-400">{proj.owner.name}</span>
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {proj.isOwner && (
                          <Button
                            onClick={() => handleOpenEditModal(proj)}
                            variant="ghost"
                            className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-900 border border-neutral-850 rounded-lg shrink-0"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {proj.isLocked ? (
                          <Button
                            onClick={() => handleUnlockProject(proj.id, proj.title, proj.cost)}
                            disabled={unlockingId === proj.id}
                            className="bg-yellow-500 hover:bg-yellow-400 text-neutral-950 font-bold h-8 text-[11px] px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(234,179,8,0.15)] disabled:opacity-40"
                            style={{ fontFamily: "var(--font-space-grotesk)" }}
                          >
                            {unlockingId === proj.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Lock className="h-3 w-3" />
                            )}
                            <span className="whitespace-nowrap">Unlock ({proj.cost} Coins)</span>
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => downloadAsZip(proj)}
                              disabled={downloadingZipId === proj.id}
                              variant="ghost"
                              className="h-8 w-8 p-0 text-neutral-500 hover:text-cyan-400 hover:bg-neutral-900 border border-neutral-855 rounded-lg shrink-0 flex items-center justify-center transition-all"
                            >
                              {downloadingZipId === proj.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              onClick={() => handleOpenProjectViewer(proj)}
                              className="bg-neutral-900 border border-neutral-850 hover:bg-neutral-850 text-neutral-300 font-semibold h-8 text-[11px] px-3.5 rounded-lg flex items-center gap-1.5 transition-all"
                              style={{ fontFamily: "var(--font-space-grotesk)" }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="whitespace-nowrap">Browse Files</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATE DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 lg:left-64 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm select-none">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden relative max-h-[95vh] flex flex-col">
            <div className="h-px bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 w-full shrink-0" />

            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-neutral-855 bg-neutral-900 shrink-0">
              <h3 className="text-xs sm:text-sm font-bold text-neutral-200 uppercase tracking-wider truncate" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Publish Structured Project
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-neutral-200 p-1 rounded-lg transition-colors shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scroll flex-1 min-h-0">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="break-words">{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    Project Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Portfolio Template Node Repo"
                    className="bg-neutral-950 border-neutral-850 text-neutral-100 text-xs h-10 placeholder-neutral-700 w-full"
                  />
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    Short Description
                  </label>
                  <Input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain the purpose of this project."
                    className="bg-neutral-950 border-neutral-850 text-neutral-100 text-xs h-10 placeholder-neutral-700 w-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Repository Summary / Introduction
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={2}
                  placeholder="General project summary, requirements, or readme highlights."
                  className="w-full bg-neutral-950 border border-neutral-850 text-neutral-100 text-xs p-3 rounded-xl focus:outline-none focus:border-cyan-500 placeholder-neutral-700 custom-scroll resize-none transition-all"
                />
              </div>

              {/* Upload Screenshots (Production Images) */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Production screenshots / Demo Images
                </label>
                
                <div className="flex flex-wrap items-center gap-3">
                  <label className="border border-neutral-850 hover:border-neutral-750 bg-neutral-950 hover:bg-neutral-900 rounded-xl px-4 py-3 flex items-center gap-2 cursor-pointer transition-all text-neutral-400 hover:text-neutral-200">
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
                    ) : (
                      <Camera className="h-4 w-4 text-cyan-500 shrink-0" />
                    )}
                    <span className="text-[10px] font-bold font-space uppercase whitespace-nowrap">Add screenshots</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e, false)}
                      className="hidden"
                    />
                  </label>

                  {productionImages.map((img, idx) => (
                    <div key={idx} className="relative group/img h-10 w-16 rounded-lg overflow-hidden border border-neutral-850 shrink-0">
                      <img src={img} alt="Production" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeProductionImage(img, false)}
                        className="absolute inset-0 bg-red-650/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 active:opacity-100 transition-opacity duration-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upload Folder / Template Buttons */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    Repository Files Structure ({uploadedFiles.length} / {fileLimit} Files Loaded)
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="border border-neutral-850 hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-900 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 text-neutral-300 text-center">
                    <Upload className="h-5 w-5 text-neutral-500 mb-0.5" />
                    <span className="text-[10px] font-bold font-space uppercase">Upload Local Folder</span>
                    <span className="text-[8px] text-neutral-600 font-mono">Processes .gitignore first</span>
                    <input
                      type="file"
                      id="folder-upload-input"
                      // @ts-expect-error webkitdirectory and directory are non-standard attributes
                      webkitdirectory=""
                      directory=""
                      multiple
                      onChange={(e) => handleFolderUpload(e, false)}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => loadTemplateFiles(false)}
                    className="border border-neutral-850 hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-900 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 text-neutral-300 text-center"
                  >
                    <Sparkles className="h-5 w-5 text-cyan-400 mb-0.5" />
                    <span className="text-[10px] font-bold font-space uppercase">Preload Template</span>
                    <span className="text-[8px] text-neutral-600 font-mono">Instant 4-file tree</span>
                  </button>
                </div>

                {/* PREVIEW TREE */}
                {uploadedFiles.length > 0 && (
                  <div className="border border-neutral-850 rounded-xl bg-neutral-950 overflow-hidden">
                    <div className="bg-neutral-900 px-3 sm:px-4 py-2 border-b border-neutral-855 select-none flex flex-wrap items-center justify-between gap-1 text-[10px] text-neutral-400 font-space font-semibold uppercase tracking-wider">
                      <span>Repository Preview Tree</span>
                      <span className="hidden sm:inline">Click to preview content</span>
                    </div>

                    <div className="flex flex-col md:flex-row h-64 md:h-48 divide-y md:divide-y-0 md:divide-x divide-neutral-850">
                      {/* Left: Tree */}
                      <div className="w-full md:w-1/2 h-1/2 md:h-auto overflow-y-auto p-3 custom-scroll select-none">
                        <div className="-ml-3.5">
                          <FileTree
                            node={buildFileTree(uploadedFiles)}
                            onSelectFile={setCreatePreviewFile}
                            selectedPath={createPreviewFile?.path || ""}
                            expandedFolders={createExpandedFolders}
                            toggleFolder={toggleCreateFolder}
                          />
                        </div>
                      </div>

                      {/* Right: Code Preview */}
                      <div className="w-full md:w-1/2 h-1/2 md:h-auto overflow-y-auto p-3 custom-scroll bg-neutral-955 font-mono text-[10px] leading-normal text-neutral-400">
                        {createPreviewFile ? (
                          <div className="space-y-2 select-text">
                            <div className="font-semibold text-neutral-350 border-b border-neutral-900 pb-1 select-none font-mono text-[9px] uppercase truncate">
                              {"// "}{createPreviewFile.path}
                            </div>
                            <pre className="whitespace-pre-wrap break-words font-mono text-[9px] text-neutral-400">
                              {createPreviewFile.content || "// Empty file"}
                            </pre>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center italic text-neutral-600 text-center px-2">
                            Select a file to preview
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Premium configurations */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-neutral-850/60 pt-4">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="premium-toggle"
                    checked={isPremium}
                    onChange={(e) => setIsPremium(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-800 bg-neutral-950 text-cyan-500 focus:ring-0 cursor-pointer shrink-0"
                  />
                  <label htmlFor="premium-toggle" className="text-xs font-bold text-neutral-300 uppercase tracking-wider cursor-pointer" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    Make Premium Project
                  </label>
                </div>

                {isPremium && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      Cost (Coins)
                    </span>
                    <Input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="bg-neutral-950 border-neutral-850 text-neutral-100 text-xs h-9 w-20 text-center font-mono shrink-0"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-855 pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="outline"
                  className="h-10 text-xs border-neutral-850 hover:bg-neutral-855 font-bold w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || uploadedFiles.length === 0 || uploadedFiles.length > fileLimit}
                  className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold h-10 px-5 disabled:opacity-40 w-full sm:w-auto"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Deploy Repository"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DIALOG MODAL */}
      {editingProject && (
        <div className="fixed inset-0 lg:left-64 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm select-none">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden relative max-h-[95vh] flex flex-col">
            <div className="h-px bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 w-full shrink-0" />

            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-neutral-855 bg-neutral-900 shrink-0">
              <h3 className="text-xs sm:text-sm font-bold text-neutral-200 uppercase tracking-wider truncate" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                Edit Repository Details
              </h3>
              <button onClick={() => setEditingProject(null)} className="text-neutral-500 hover:text-neutral-200 p-1 rounded-lg transition-colors shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scroll flex-1 min-h-0">
              {editFormError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="break-words">{editFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    Project Title
                  </label>
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Portfolio Template Node Repo"
                    className="bg-neutral-950 border-neutral-850 text-neutral-100 text-xs h-10 w-full"
                  />
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    Short Description
                  </label>
                  <Input
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Explain the purpose of this project."
                    className="bg-neutral-950 border-neutral-850 text-neutral-100 text-xs h-10 w-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Repository Summary / Introduction
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={2}
                  placeholder="General project summary, requirements, or readme highlights."
                  className="w-full bg-neutral-955 border border-neutral-850 text-neutral-100 text-xs p-3 rounded-xl focus:outline-none focus:border-cyan-500 resize-none transition-all"
                />
              </div>

              {/* Edit screenshots */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Production Screenshots ({editImages.length} Screenshots Loaded)
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="border border-neutral-850 hover:border-neutral-750 bg-neutral-955 hover:bg-neutral-900 rounded-xl px-4 py-3 flex items-center gap-2 cursor-pointer transition-all text-neutral-450 hover:text-neutral-200">
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400 shrink-0" />
                    ) : (
                      <Camera className="h-4 w-4 text-cyan-500 shrink-0" />
                    )}
                    <span className="text-[10px] font-bold font-space uppercase whitespace-nowrap">Add screenshots</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e, true)}
                      className="hidden"
                    />
                  </label>

                  {editImages.map((img, idx) => (
                    <div key={idx} className="relative group/editimg h-10 w-16 rounded-lg overflow-hidden border border-neutral-850 shrink-0">
                      <img src={img} alt="Edit Production" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeProductionImage(img, true)}
                        className="absolute inset-0 bg-red-650/80 text-white flex items-center justify-center opacity-0 group-hover/editimg:opacity-100 active:opacity-100 transition-opacity duration-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Files structure edit */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  Update Files List ({editFiles.length} / {fileLimit} Files Loaded)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="border border-neutral-850 hover:border-neutral-700 bg-neutral-950 hover:bg-neutral-900 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 text-neutral-350 text-center">
                    <Upload className="h-5 w-5 text-neutral-500 mb-0.5" />
                    <span className="text-[10px] font-bold font-space uppercase">Replace Folder</span>
                    <span className="text-[8px] text-neutral-600 font-mono">Processes .gitignore first</span>
                    <input
                      type="file"
                      id="folder-edit-input"
                      // @ts-expect-error webkitdirectory and directory are non-standard attributes
                      webkitdirectory=""
                      directory=""
                      multiple
                      onChange={(e) => handleFolderUpload(e, true)}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => loadTemplateFiles(true)}
                    className="border border-neutral-850 hover:border-neutral-700 bg-neutral-955 hover:bg-neutral-900 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 text-neutral-355 text-center"
                  >
                    <Sparkles className="h-5 w-5 text-cyan-400 mb-0.5" />
                    <span className="text-[10px] font-bold font-space uppercase">Preload Template</span>
                    <span className="text-[8px] text-neutral-600 font-mono">Instant 4-file tree</span>
                  </button>
                </div>

                {/* EDIT PREVIEW TREE */}
                {editFiles.length > 0 && (
                  <div className="border border-neutral-850 rounded-xl bg-neutral-955 overflow-hidden">
                    <div className="bg-neutral-900 px-3 sm:px-4 py-2 border-b border-neutral-850 select-none flex flex-wrap items-center justify-between gap-1 text-[10px] text-neutral-400 font-space font-semibold uppercase tracking-wider">
                      <span>Preview Tree structure</span>
                      <span className="hidden sm:inline">Click to preview content</span>
                    </div>

                    <div className="flex flex-col md:flex-row h-64 md:h-48 divide-y md:divide-y-0 md:divide-x divide-neutral-850">
                      <div className="w-full md:w-1/2 h-1/2 md:h-auto overflow-y-auto p-3 custom-scroll select-none">
                        <div className="-ml-3.5">
                          <FileTree
                            node={buildFileTree(editFiles)}
                            onSelectFile={setEditPreviewFile}
                            selectedPath={editPreviewFile?.path || ""}
                            expandedFolders={editExpandedFolders}
                            toggleFolder={toggleEditFolder}
                          />
                        </div>
                      </div>

                      <div className="w-full md:w-1/2 h-1/2 md:h-auto overflow-y-auto p-3 custom-scroll bg-neutral-950 font-mono text-[10px] leading-normal text-neutral-450">
                        {editPreviewFile ? (
                          <div className="space-y-2 select-text">
                            <div className="font-semibold text-neutral-350 border-b border-neutral-900 pb-1 select-none font-mono text-[9px] uppercase truncate">
                              {"// "}{editPreviewFile.path}
                            </div>
                            <pre className="whitespace-pre-wrap break-words font-mono text-[9px] text-neutral-400">
                              {editPreviewFile.content || "// Empty file"}
                            </pre>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center italic text-neutral-600 text-center px-2">
                            Select a file to preview
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Premium toggles */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-neutral-850/60 pt-4">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="edit-premium-toggle"
                    checked={editIsPremium}
                    onChange={(e) => setEditIsPremium(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-800 bg-neutral-950 text-cyan-500 focus:ring-0 cursor-pointer shrink-0"
                  />
                  <label htmlFor="edit-premium-toggle" className="text-xs font-bold text-neutral-350 uppercase tracking-wider cursor-pointer" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                    Make Premium Project
                  </label>
                </div>

                {editIsPremium && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                      Cost (Coins)
                    </span>
                    <Input
                      type="number"
                      value={editCost}
                      onChange={(e) => setEditCost(e.target.value)}
                      className="bg-neutral-950 border-neutral-850 text-neutral-100 text-xs h-9 w-20 text-center font-mono shrink-0"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-855 pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0">
                <Button
                  type="button"
                  onClick={() => handleDeleteProject(editingProject.id)}
                  disabled={isSavingEdit}
                  className="bg-red-650 hover:bg-red-600 text-white font-bold h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 order-2 sm:order-1 w-full sm:w-auto"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Project</span>
                </Button>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 order-1 sm:order-2">
                  <Button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    variant="outline"
                    className="h-10 text-xs border-neutral-850 hover:bg-neutral-855 font-bold w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingEdit || editFiles.length === 0 || editFiles.length > fileLimit}
                    className="bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold h-10 px-5 disabled:opacity-40 w-full sm:w-auto"
                  >
                    {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GITHUB STYLE EXPLORER MODAL */}
      {viewingProject && (
        <div className="fixed inset-0 lg:left-64 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
          <div className="w-full max-w-5xl bg-neutral-900 border border-neutral-855 rounded-2xl shadow-2xl overflow-hidden relative flex flex-col h-[95vh] sm:h-[85vh]">
            <div className="h-px bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 w-full shrink-0" />

            {/* GitHub Header */}
            <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-neutral-850 shrink-0 bg-neutral-900">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <BookOpen className="h-4 w-4 text-cyan-400 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-neutral-200 tracking-tight truncate" style={{ fontFamily: "var(--font-space-grotesk)" }}>
                  {viewingProject.owner.name} / {viewingProject.title.toLowerCase().replace(/\s+/g, "-")}
                </h3>
                {viewingProject.isPremium ? (
                  <span className="text-[8px] bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                    Premium
                  </span>
                ) : (
                  <span className="text-[8px] bg-neutral-800 border border-neutral-750 text-neutral-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0">
                    Free
                  </span>
                )}
              </div>

              <button onClick={() => setViewingProject(null)} className="text-neutral-500 hover:text-neutral-200 p-1 rounded-lg transition-colors shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* GitHub Description Panel */}
            <div className="px-4 sm:px-6 py-3.5 bg-neutral-950/20 border-b border-neutral-850 shrink-0 text-xs text-neutral-400">
              <p className="font-medium break-words">{viewingProject.description}</p>
              <p className="text-[10px] text-neutral-600 mt-1 font-mono">
                Project deployed: {new Date(viewingProject.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Git Explorer Layout - RESPONSIVE TABBING ON MOBILE */}
            <div className="flex flex-1 min-h-0 divide-x divide-neutral-850 bg-neutral-950/40 relative">
              {/* Left Side: Folder Tree Explorer (Hidden on mobile if viewing code) */}
              <div className={`w-full md:w-64 shrink-0 overflow-y-auto p-4 custom-scroll space-y-3 select-none ${mobileTab === "files" ? "block" : "hidden md:block"}`}>
                <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-space">
                    Files Explorer
                  </span>
                  <span className="text-[9px] text-neutral-600 font-mono">
                    {viewingProject.files?.length || 0} items
                  </span>
                </div>

                {viewingProject.files && viewingProject.files.length > 0 ? (
                  <div className="-ml-3.5">
                    <FileTree
                      node={buildFileTree(viewingProject.files)}
                      onSelectFile={handleSelectFile}
                      selectedPath={viewingSelectedFile?.path || ""}
                      expandedFolders={expandedFolders}
                      toggleFolder={toggleFolder}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-neutral-600 italic text-center py-6">
                    No files found in this repository.
                  </p>
                )}
              </div>

              {/* Right Side: Code Viewer & Readme Preview (Hidden on mobile if viewing tree) */}
              <div className={`flex-1 flex flex-col min-w-0 bg-neutral-950 ${mobileTab === "code" ? "flex" : "hidden md:flex"}`}>
                {viewingSelectedFile ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* File Header */}
                    <div className="h-10 px-3 sm:px-4 border-b border-neutral-850 bg-neutral-900/60 flex items-center justify-between gap-2 shrink-0 select-none">
                      <div className="flex items-center min-w-0">
                        {/* Mobile Back Button */}
                        <Button
                          onClick={() => setMobileTab("files")}
                          variant="ghost"
                          className="md:hidden h-7 px-2 hover:bg-neutral-800 text-neutral-450 hover:text-neutral-200 transition-colors mr-2 flex items-center gap-1.5 rounded-md shrink-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="text-[10px] font-bold font-space uppercase">Tree</span>
                        </Button>

                        <span className="text-xs font-mono font-semibold text-neutral-300 truncate">
                          {viewingSelectedFile.path}
                        </span>
                      </div>
                      <Button
                        onClick={handleCopyFileContent}
                        variant="ghost"
                        className="h-7 px-2 hover:bg-neutral-800 text-neutral-450 hover:text-neutral-200 transition-colors gap-1 rounded-md shrink-0"
                      >
                        {copiedFile ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span className="text-[10px] font-bold uppercase font-space hidden sm:inline">{copiedFile ? "Copied" : "Copy"}</span>
                      </Button>
                    </div>

                    {/* Code Code Block */}
                    <div className="flex-1 overflow-auto custom-scroll p-3 sm:p-4 font-mono text-xs leading-relaxed text-neutral-300 select-text flex">
                      {/* Line Numbers */}
                      <div className="select-none text-neutral-700 text-right pr-3 sm:pr-4 border-r border-neutral-850 text-[11px] font-mono leading-relaxed mr-3 sm:mr-4 shrink-0">
                        {viewingSelectedFile.content.split("\n").map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>

                      {/* Code Content */}
                      <pre className="flex-1 whitespace-pre font-mono text-[11px] leading-relaxed overflow-x-auto">
                        {viewingSelectedFile.content || "// Empty file"}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
                    <File className="h-8 w-8 text-neutral-700 mb-2 opacity-50" />
                    <p className="text-xs text-neutral-500 italic">Select a file from the explorer tree to view content.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Production Screenshots row (if available & viewing files list on mobile) */}
            {viewingProject.productionImages &&
              viewingProject.productionImages.length > 0 &&
              (mobileTab === "files" || viewingSelectedFile === null) && (
                <div className="border-t border-neutral-850 bg-neutral-900/40 p-3 sm:p-4 shrink-0 max-h-[120px] sm:max-h-[140px] overflow-y-auto custom-scroll">
                  <div className="flex items-center gap-1.5 border-b border-neutral-850 pb-2 mb-2 select-none">
                    <ImageIcon className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-space">
                      Production Screenshots
                    </span>
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto py-1 custom-scroll">
                    {viewingProject.productionImages.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg overflow-hidden border border-neutral-800 hover:border-cyan-500/50 transition-colors">
                        <img src={img} alt={`Production demo screenshot ${idx + 1}`} className="h-14 sm:h-16 w-auto object-cover rounded-lg" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

            {/* README Preview Panel (if README.md is available & viewing files list on mobile) */}
            {viewingProject.files &&
              (mobileTab === "files" || viewingSelectedFile === null) &&
              viewingProject.files.some((f) => f.path.toLowerCase() === "readme.md") && (
                <div className="border-t border-neutral-850 bg-neutral-900/40 p-3 sm:p-4 shrink-0 max-h-[120px] sm:max-h-[150px] overflow-y-auto custom-scroll">
                  <div className="flex items-center gap-1.5 border-b border-neutral-850 pb-2 mb-2 select-none">
                    <BookOpen className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-space">
                      README.md Preview
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-neutral-400 whitespace-pre-wrap break-words select-text leading-relaxed">
                    {viewingProject.files.find((f) => f.path.toLowerCase() === "readme.md")?.content}
                  </pre>
                </div>
              )}

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-neutral-850 shrink-0 bg-neutral-900 flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between sm:items-center text-neutral-500 text-[9px] uppercase font-semibold font-space">
              <span className="truncate">Owner: {viewingProject.owner.name} ({viewingProject.owner.email})</span>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => downloadAsZip(viewingProject)}
                  disabled={downloadingZipId === viewingProject.id}
                  className="bg-neutral-950 border border-neutral-855 hover:bg-neutral-800 text-cyan-400 font-bold h-8 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  {downloadingZipId === viewingProject.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>Download ZIP</span>
                </Button>
                <Button
                  onClick={() => setViewingProject(null)}
                  className="bg-neutral-950 border border-neutral-850 hover:bg-neutral-800 text-neutral-300 font-bold h-8 px-4 rounded-xl text-xs w-full sm:w-auto"
                >
                  Close Repository
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}