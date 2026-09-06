/* eslint-disable @next/next/no-img-element */
"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { motion } from "framer-motion";
import { PremiumUpgradeModal } from "@/components/premium/PremiumUpgradeModal";

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
                className="flex items-center gap-1.5 py-1 px-1.5 rounded-lg text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#150F0B] cursor-pointer text-xs transition-all font-semibold font-display select-none"
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-[#8A8078] shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-[#8A8078] shrink-0" />}
                <Folder className="h-3.5 w-3.5 text-[#F5B429] fill-[#F5B429]/20 shrink-0" />
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
                  ? "bg-[#F5B429]/15 text-[#FCD34D] font-semibold border-l-2 border-[#F5B429] rounded-l-none"
                  : "text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#150F0B]"
              }`}
            >
              <span className="w-3.5 shrink-0" />
              <File className="h-3.5 w-3.5 text-[#8A8078] shrink-0" />
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

  // Upgrade premium modal state
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
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

  // Premium Code Editor states
  const [isEditingCodeFile, setIsEditingCodeFile] = useState(false);
  const [editedCodeContent, setEditedCodeContent] = useState("");
  const [isSavingCodeFile, setIsSavingCodeFile] = useState(false);

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
        const hasUpgradedProfile = Boolean(
          profile.isPremium ||
          profile.isPremiumUser ||
          (profile.premiumExpiresAt && new Date(profile.premiumExpiresAt) > new Date())
        );
        setIsPremiumUser(hasUpgradedProfile);
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

  const handleUpgradePremium = () => {
    setIsUpgradeModalOpen(true);
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
    setIsEditingCodeFile(false);
    setEditedCodeContent("");
  };

  const handleCopyFileContent = () => {
    if (!viewingSelectedFile) return;
    navigator.clipboard.writeText(viewingSelectedFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const closeProjectViewer = () => {
    setViewingProject(null);
    setViewingSelectedFile(null);
    setIsEditingCodeFile(false);
    setEditedCodeContent("");
  };

  const handleSaveFileContent = async () => {
    if (!viewingProject || !viewingSelectedFile) return;

    try {
      setIsSavingCodeFile(true);
      const updatedFiles = viewingProject.files.map((f) =>
        f.path === viewingSelectedFile.path ? { ...f, content: editedCodeContent } : f
      );

      const res = await fetch(`/api/projects/${viewingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: updatedFiles }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save file contents.");
      }

      // Update state
      const updatedProj = { ...viewingProject, files: updatedFiles };
      setViewingProject(updatedProj);
      setViewingSelectedFile({ ...viewingSelectedFile, content: editedCodeContent });
      setProjects((prev) =>
        prev.map((p) => (p.id === viewingProject.id ? { ...p, files: updatedFiles } : p))
      );
      setIsEditingCodeFile(false);
      setEditedCodeContent("");
      toast.success("File updated successfully!");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error saving file.");
    } finally {
      setIsSavingCodeFile(false);
    }
  };

  const handleCreateNewFile = async () => {
    if (!viewingProject) return;

    const path = prompt("Enter the new file path (e.g., src/components/Header.tsx):");
    if (!path) return;

    const cleanPath = path.trim();
    if (!cleanPath) return;

    // Check duplicates
    if (viewingProject.files.some((f) => f.path.toLowerCase() === cleanPath.toLowerCase())) {
      alert("A file with this path already exists!");
      return;
    }

    // Check limit
    const limit = isPremiumUser ? 150 : 50;
    if (viewingProject.files.length >= limit) {
      alert(`File count limit exceeded! You cannot have more than ${limit} files.`);
      return;
    }

    try {
      const newFile = { path: cleanPath, content: "" };
      const updatedFiles = [...viewingProject.files, newFile];

      const res = await fetch(`/api/projects/${viewingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: updatedFiles }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create new file.");
      }

      const updatedProj = { ...viewingProject, files: updatedFiles };
      setViewingProject(updatedProj);
      setViewingSelectedFile(newFile);
      setProjects((prev) =>
        prev.map((p) => (p.id === viewingProject.id ? { ...p, files: updatedFiles } : p))
      );

      // Auto-expand new file folders in the tree
      const parts = cleanPath.split("/");
      let current = "";
      const newExp = { ...expandedFolders };
      parts.slice(0, -1).forEach((part) => {
        current = current ? `${current}/${part}` : part;
        newExp[current] = true;
      });
      setExpandedFolders(newExp);

      // Auto-enter edit mode
      setEditedCodeContent("");
      setIsEditingCodeFile(true);
      toast.success(`File ${cleanPath} created!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error creating file.");
    }
  };

  const handleDeleteFile = async () => {
    if (!viewingProject || !viewingSelectedFile) return;

    if (!confirm(`Are you sure you want to delete ${viewingSelectedFile.path}?`)) {
      return;
    }

    try {
      const updatedFiles = viewingProject.files.filter((f) => f.path !== viewingSelectedFile.path);

      const res = await fetch(`/api/projects/${viewingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: updatedFiles }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete file.");
      }

      const updatedProj = { ...viewingProject, files: updatedFiles };
      setViewingProject(updatedProj);

      // Find next selected file
      if (updatedFiles.length > 0) {
        const readme = updatedFiles.find((f) => f.path.toLowerCase() === "readme.md");
        setViewingSelectedFile(readme || updatedFiles[0]);
      } else {
        setViewingSelectedFile(null);
      }

      setProjects((prev) =>
        prev.map((p) => (p.id === viewingProject.id ? { ...p, files: updatedFiles } : p))
      );
      setIsEditingCodeFile(false);
      setEditedCodeContent("");
      toast.success("File deleted successfully.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting file.");
    }
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
    <div className="flex-1 flex flex-col h-full bg-transparent text-[#FAFAF8] overflow-y-auto custom-scroll relative selection:bg-[#F5B429]/30 selection:text-[#FAFAF8]">
      {/* Background Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="ambient-glow-orb-1" />
        <div className="ambient-glow-orb-2" />
        <div className="ambient-glow-orb-3" />
      </div>

      {/* Header Banner */}
      <div className="p-4 sm:p-8 lg:p-10 pb-0 shrink-0 select-none relative z-10">
        <div className="border border-[#2E2118] bg-[#150F0B]/85 p-6 sm:p-8 rounded-[2rem] relative z-10 backdrop-blur-2xl shadow-[0_0_35px_-5px_rgba(245,148,29,0.12)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="h-1.5 w-6 rounded-full bg-[#F5B429] shrink-0 animate-pulse shadow-[0_0_8px_#F5B429]" />
                <span className="text-[10px] font-bold text-[#F5B429] uppercase tracking-widest font-mono">
                  Project Terminal
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#FAFAF8] tracking-tight font-display">
                Premium Projects
              </h1>
              <p className="text-[#8A8078] text-xs sm:text-sm font-light max-w-md">
                Publish structured repositories with file trees, or spend Coins to unlock premium project files.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Coins Balance */}
              <div className="bg-[#0A0806] border border-[#2E2118] rounded-xl px-3.5 py-2 sm:px-4 flex items-center gap-2 shadow-lg">
                <Coins className="h-4 w-4 text-[#F5B429] shrink-0" />
                <div className="text-left">
                  <p className="text-[9px] text-[#8A8078] uppercase font-bold font-display">Your Coins</p>
                  <p className="text-sm font-extrabold text-[#FAFAF8] font-mono">{coins} <span className="text-[10px] text-[#F5B429]">Coins</span></p>
                </div>
              </div>

              {/* Premium status indicator */}
              {isPremiumUser ? (
                <div className="bg-[#F5B429]/15 border border-[#F5B429]/30 rounded-xl px-3.5 py-2 sm:px-4 flex items-center gap-2 shadow-lg select-none">
                  <Shield className="h-4 w-4 text-[#F5B429] fill-[#F5B429]/20 shrink-0" />
                  <div className="text-left">
                    <p className="text-[9px] text-[#F5B429] uppercase font-bold font-display">Plan Tier</p>
                    <p className="text-xs font-bold text-[#FAFAF8] uppercase tracking-wider whitespace-nowrap">Upgraded (250 Limit)</p>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleUpgradePremium}
                  className="bg-[#0A0806] border border-[#2E2118] hover:border-[#F5B429]/50 text-[#FAFAF8] font-bold h-11 px-3.5 sm:px-4 rounded-xl flex items-center gap-2 transition-all duration-300 font-display cursor-pointer"
                >
                  <Shield className="h-4 w-4 text-[#F5B429] shrink-0" />
                  <div className="text-left">
                    <p className="text-[8px] text-[#8A8078] uppercase font-bold whitespace-nowrap">Upgrade Profile</p>
                    <p className="text-[10px] font-bold text-[#F5B429] uppercase whitespace-nowrap">Unlock 250 file limit</p>
                  </div>
                </Button>
              )}

              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-br from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold transition-all h-11 px-5 rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center shadow-[0_0_15px_rgba(245,180,41,0.25)] hover:opacity-90 font-display cursor-pointer"
              >
                <Plus className="h-4 w-4 shrink-0 text-[#150F0B]" />
                <span className="whitespace-nowrap">Create Project</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-[#8A8078] space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2 max-w-full">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="break-words">{error}</span>
          </div>
          <Button onClick={fetchProfileAndProjects} variant="outline" className="text-xs h-9 font-bold border-[#2E2118] hover:bg-[#150F0B] text-[#FAFAF8]">
            Refresh Connection
          </Button>
        </div>
      ) : !viewingProject ? (
        <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto flex-1">
          {projects.length === 0 ? (
            <div className="py-14 sm:py-20 px-4 text-center select-none border border-dashed border-[#2E2118] rounded-3xl bg-[#150F0B]/50 flex flex-col items-center justify-center">
              <Sparkles className="h-10 w-10 text-[#8A8078] mb-3 opacity-60" />
              <h3 className="text-sm font-bold text-[#FAFAF8] font-display">No Projects Found</h3>
              <p className="text-xs text-[#8A8078] max-w-sm mt-1 mb-6">
                Be the first to publish a file-structured project! Click &quot;Create Project&quot; to get started.
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="text-xs bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] h-9 rounded-xl font-bold font-display shadow-[0_0_12px_rgba(245,180,41,0.25)]">
                Deploy First Project
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.08 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
            >
              {projects.map((proj) => (
                <motion.div
                  key={proj.id}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 350, damping: 20 }}
                  className={`bg-[#150F0B]/85 border flex flex-col justify-between shadow-[0_0_30px_-5px_rgba(245,148,29,0.1)] relative group transition-all duration-300 rounded-2xl overflow-hidden backdrop-blur-xl ${
                    proj.isLocked
                      ? "border-[#2E2118] hover:border-[#F5B429]/50"
                      : "border-[#2E2118] hover:border-[#F5B429]/50"
                  }`}
                >
                  {/* Production Screenshot Banner or Gradient abstraction */}
                  {proj.productionImages && proj.productionImages.length > 0 ? (
                    <div className="w-full h-32 sm:h-36 relative overflow-hidden border-b border-[#2E2118] shrink-0">
                      <img src={proj.productionImages[0]} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#150F0B] via-transparent to-transparent" />
                    </div>
                  ) : (
                    <div className="w-full h-20 sm:h-24 bg-gradient-to-br from-[#0A0806] via-[#150F0B] to-[#241811] border-b border-[#2E2118] shrink-0 relative">
                      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(245,180,41,0.2),rgba(0,0,0,0))]" />
                    </div>
                  )}

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5 min-w-0">
                          {proj.isPremium ? (
                            <span className="text-[9px] font-bold bg-[#F5B429]/15 border border-[#F5B429]/30 text-[#F5B429] px-2 py-0.5 rounded-lg font-mono uppercase whitespace-nowrap">
                              Premium
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold bg-[#0A0806] border border-[#2E2118] text-[#8A8078] px-2 py-0.5 rounded-lg font-mono uppercase whitespace-nowrap">
                              Free
                            </span>
                          )}
                          {proj.isOwner && (
                            <span className="text-[9px] font-bold bg-[#F5B429]/15 border border-[#F5B429]/30 text-[#F5B429] px-2 py-0.5 rounded-lg font-mono uppercase whitespace-nowrap">
                              Creator
                            </span>
                          )}
                          {!proj.isPremium && (
                            <span className="text-[9px] font-bold bg-[#F5B429]/10 border border-[#F5B429]/20 text-[#FCD34D] px-2 py-0.5 rounded-lg font-mono uppercase whitespace-nowrap">
                              Unlocked
                            </span>
                          )}
                          {proj.isPremium && !proj.isLocked && !proj.isOwner && (
                            <span className="text-[9px] font-bold bg-[#F5B429]/10 border border-[#F5B429]/20 text-[#FCD34D] px-2 py-0.5 rounded-lg font-mono uppercase whitespace-nowrap">
                              Unlocked
                            </span>
                          )}
                          <span className="text-[9px] font-bold bg-[#0A0806] border border-[#2E2118] text-[#8A8078] px-2 py-0.5 rounded-lg font-mono uppercase whitespace-nowrap">
                            {proj.files?.length || 0} Files
                          </span>
                        </div>

                        <span className="text-[9px] text-[#8A8078] font-mono shrink-0 whitespace-nowrap">
                          {new Date(proj.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-[#FAFAF8] group-hover:text-[#F5B429] transition-colors break-words font-display">
                          {proj.title}
                        </h3>
                        <p className="text-xs text-[#8A8078] line-clamp-2 leading-relaxed font-light">
                          {proj.description}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-[#2E2118] pt-3.5 flex flex-wrap items-center justify-between gap-2.5">
                      <span className="text-[10px] text-[#8A8078] truncate min-w-0">
                        By <span className="font-semibold text-[#FAFAF8]">{proj.owner.name}</span>
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {proj.isOwner && (
                          <Button
                            onClick={() => handleOpenEditModal(proj)}
                            variant="ghost"
                            className="h-8 w-8 p-0 text-[#8A8078] hover:text-[#FAFAF8] hover:bg-[#0A0806] border border-[#2E2118] rounded-xl shrink-0"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {proj.isLocked ? (
                          <Button
                            onClick={() => handleUnlockProject(proj.id, proj.title, proj.cost)}
                            disabled={unlockingId === proj.id}
                            className="bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold h-8 text-[11px] px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(245,180,41,0.25)] disabled:opacity-40 font-display cursor-pointer"
                          >
                            {unlockingId === proj.id ? (
                              <Loader2 className="h-3 w-3 animate-spin text-[#150F0B]" />
                            ) : (
                              <Lock className="h-3 w-3 text-[#150F0B]" />
                            )}
                            <span className="whitespace-nowrap">Unlock ({proj.cost} Coins)</span>
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => downloadAsZip(proj)}
                              disabled={downloadingZipId === proj.id}
                              variant="ghost"
                              className="h-8 w-8 p-0 text-[#8A8078] hover:text-[#F5B429] hover:bg-[#0A0806] border border-[#2E2118] rounded-xl shrink-0 flex items-center justify-center transition-all cursor-pointer"
                            >
                              {downloadingZipId === proj.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#F5B429]" />
                              ) : (
                                <Download className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              onClick={() => handleOpenProjectViewer(proj)}
                              className="bg-[#0A0806] border border-[#2E2118] hover:bg-[#150F0B] text-[#FAFAF8] hover:text-[#F5B429] font-semibold h-8 text-[11px] px-3.5 rounded-xl flex items-center gap-1.5 transition-all font-display cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="whitespace-nowrap">Browse Files</span>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      ) : null}

      {/* CREATE DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 lg:left-64 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-[#150F0B] border border-[#2E2118] rounded-[2rem] shadow-[0_0_50px_rgba(245,148,29,0.2)] overflow-hidden relative max-h-[95vh] flex flex-col backdrop-blur-2xl"
          >
            <div className="h-1 bg-gradient-to-r from-[#F7C948] to-[#F5941D] w-full shrink-0" />

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[#2E2118] bg-[#0A0806] shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#F5B429]" />
                <h3 className="text-xs sm:text-sm font-bold text-[#FAFAF8] uppercase tracking-wider truncate font-display">
                  Publish Structured Project
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8A8078] hover:text-[#FAFAF8] p-1.5 rounded-xl hover:bg-[#150F0B] transition-colors shrink-0 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scroll flex-1 min-h-0">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="break-words">{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-bold text-[#8A8078] uppercase tracking-wider font-display">
                    Project Title
                  </label>
                  <Input
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Portfolio Template Node Repo"
                    className="bg-[#0A0806] border-[#2E2118] text-[#FAFAF8] text-xs h-10 placeholder-[#8A8078]/50 w-full focus:border-[#F5B429] rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-bold text-[#8A8078] uppercase tracking-wider font-display">
                    Short Description
                  </label>
                  <Input
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain the purpose of this project."
                    className="bg-[#0A0806] border-[#2E2118] text-[#FAFAF8] text-xs h-10 placeholder-[#8A8078]/50 w-full focus:border-[#F5B429] rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#8A8078] uppercase tracking-wider font-display">
                  Repository Summary / Introduction
                </label>
                <textarea
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={2}
                  placeholder="General project summary, requirements, or readme highlights."
                  className="w-full bg-[#0A0806] border border-[#2E2118] text-[#FAFAF8] text-xs p-3 rounded-xl focus:outline-none focus:border-[#F5B429] placeholder-[#8A8078]/50 custom-scroll resize-none transition-all font-sans"
                />
              </div>

              {/* Upload Screenshots (Production Images) */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8A8078] uppercase tracking-wider block font-display">
                  Production screenshots / Demo Images
                </label>
                
                <div className="flex flex-wrap items-center gap-3">
                  <label className="border border-[#2E2118] hover:border-[#F5B429]/50 bg-[#0A0806] hover:bg-[#150F0B] rounded-xl px-4 py-3 flex items-center gap-2 cursor-pointer transition-all text-[#8A8078] hover:text-[#FAFAF8]">
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#F5B429] shrink-0" />
                    ) : (
                      <Camera className="h-4 w-4 text-[#F5B429] shrink-0" />
                    )}
                    <span className="text-[10px] font-bold uppercase whitespace-nowrap font-display">Add screenshots</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e, false)}
                      className="hidden"
                    />
                  </label>

                  {productionImages.map((img, idx) => (
                    <div key={idx} className="relative group/img h-10 w-16 rounded-xl overflow-hidden border border-[#2E2118] shrink-0">
                      <img src={img} alt="Production" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeProductionImage(img, false)}
                        className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 active:opacity-100 transition-opacity duration-200"
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
                  <label className="text-[10px] font-bold text-[#8A8078] uppercase tracking-wider block font-display">
                    Repository Files Structure ({uploadedFiles.length} / {fileLimit} Files Loaded)
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="border border-[#2E2118] hover:border-[#F5B429]/50 bg-[#0A0806] hover:bg-[#150F0B] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 text-[#FAFAF8] text-center">
                    <Upload className="h-5 w-5 text-[#F5B429] mb-0.5" />
                    <span className="text-[10px] font-bold uppercase font-display">Upload Local Folder</span>
                    <span className="text-[8px] text-[#8A8078] font-mono">Processes .gitignore first</span>
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
                    className="border border-[#2E2118] hover:border-[#F5B429]/50 bg-[#0A0806] hover:bg-[#150F0B] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 text-[#FAFAF8] text-center"
                  >
                    <Sparkles className="h-5 w-5 text-[#F5B429] mb-0.5" />
                    <span className="text-[10px] font-bold uppercase font-display">Preload Template</span>
                    <span className="text-[8px] text-[#8A8078] font-mono">Instant 4-file tree</span>
                  </button>
                </div>

                {/* PREVIEW TREE */}
                {uploadedFiles.length > 0 && (
                  <div className="border border-[#2E2118] rounded-xl bg-[#0A0806] overflow-hidden">
                    <div className="bg-[#150F0B] px-3 sm:px-4 py-2 border-b border-[#2E2118] select-none flex flex-wrap items-center justify-between gap-1 text-[10px] text-[#8A8078] font-display font-semibold uppercase tracking-wider">
                      <span>Repository Preview Tree</span>
                      <span className="hidden sm:inline">Click to preview content</span>
                    </div>

                    <div className="flex flex-col md:flex-row h-64 md:h-48 divide-y md:divide-y-0 md:divide-x divide-[#2E2118]">
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
                      <div className="w-full md:w-1/2 h-1/2 md:h-auto overflow-y-auto p-3 custom-scroll bg-[#0A0806] font-mono text-[10px] leading-normal text-[#FAFAF8]">
                        {createPreviewFile ? (
                          <div className="space-y-2 select-text">
                            <div className="font-semibold text-[#F5B429] border-b border-[#2E2118] pb-1 select-none font-mono text-[9px] uppercase truncate">
                              {"// "}{createPreviewFile.path}
                            </div>
                            <pre className="whitespace-pre-wrap break-words font-mono text-[9px] text-[#8A8078]">
                              {createPreviewFile.content || "// Empty file"}
                            </pre>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center italic text-[#8A8078] text-center px-2">
                            Select a file to preview
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Premium configurations */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#2E2118] pt-4">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="premium-toggle"
                    checked={isPremium}
                    onChange={(e) => setIsPremium(e.target.checked)}
                    className="h-4 w-4 rounded border-[#2E2118] bg-[#0A0806] text-[#F5B429] focus:ring-0 cursor-pointer shrink-0 accent-[#F5B429]"
                  />
                  <label htmlFor="premium-toggle" className="text-xs font-bold text-[#FAFAF8] uppercase tracking-wider cursor-pointer font-display">
                    Make Premium Project
                  </label>
                </div>

                {isPremium && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#8A8078] uppercase tracking-wider whitespace-nowrap font-display">
                      Cost (Coins)
                    </span>
                    <Input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="bg-[#0A0806] border-[#2E2118] text-[#FAFAF8] text-xs h-9 w-20 text-center font-mono shrink-0 focus:border-[#F5B429]"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-[#2E2118] pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
                <Button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  variant="outline"
                  className="h-10 text-xs border-[#2E2118] hover:bg-[#150F0B] text-[#FAFAF8] font-bold w-full sm:w-auto font-display"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || uploadedFiles.length === 0 || uploadedFiles.length > fileLimit}
                  className="bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold h-10 px-5 disabled:opacity-40 w-full sm:w-auto font-display shadow-[0_0_15px_rgba(245,180,41,0.25)] cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-[#150F0B]" /> : "Deploy Repository"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* EDIT DIALOG MODAL */}
      {editingProject && (
        <div className="fixed inset-0 lg:left-64 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-[#150F0B] border border-[#2E2118] rounded-[2rem] shadow-[0_0_50px_rgba(245,148,29,0.2)] overflow-hidden relative max-h-[95vh] flex flex-col backdrop-blur-2xl"
          >
            <div className="h-1 bg-gradient-to-r from-[#F7C948] to-[#F5941D] w-full shrink-0" />

            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[#2E2118] bg-[#0A0806] shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-[#F5B429]" />
                <h3 className="text-xs sm:text-sm font-bold text-[#FAFAF8] uppercase tracking-wider truncate font-display">
                  Edit Repository Details
                </h3>
              </div>
              <button onClick={() => setEditingProject(null)} className="text-[#8A8078] hover:text-[#FAFAF8] p-1.5 rounded-xl hover:bg-[#150F0B] transition-colors shrink-0 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-scroll flex-1 min-h-0">
              {editFormError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="break-words">{editFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-bold text-[#8A8078] uppercase tracking-wider font-display">
                    Project Title
                  </label>
                  <Input
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. Portfolio Template Node Repo"
                    className="bg-[#0A0806] border-[#2E2118] text-[#FAFAF8] text-xs h-10 w-full focus:border-[#F5B429] rounded-xl"
                  />
                </div>

                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-bold text-[#8A8078] uppercase tracking-wider font-display">
                    Short Description
                  </label>
                  <Input
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    data-lpignore="true"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Explain the purpose of this project."
                    className="bg-[#0A0806] border-[#2E2118] text-[#FAFAF8] text-xs h-10 w-full focus:border-[#F5B429] rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#8A8078] uppercase tracking-wider font-display">
                  Repository Summary / Introduction
                </label>
                <textarea
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  data-lpignore="true"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={2}
                  placeholder="General project summary, requirements, or readme highlights."
                  className="w-full bg-[#0A0806] border border-[#2E2118] text-[#FAFAF8] text-xs p-3 rounded-xl focus:outline-none focus:border-[#F5B429] resize-none transition-all font-sans"
                />
              </div>

              {/* Edit screenshots */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8A8078] uppercase tracking-wider block font-display">
                  Production Screenshots ({editImages.length} Screenshots Loaded)
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="border border-[#2E2118] hover:border-[#F5B429]/50 bg-[#0A0806] hover:bg-[#150F0B] rounded-xl px-4 py-3 flex items-center gap-2 cursor-pointer transition-all text-[#8A8078] hover:text-[#FAFAF8]">
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#F5B429] shrink-0" />
                    ) : (
                      <Camera className="h-4 w-4 text-[#F5B429] shrink-0" />
                    )}
                    <span className="text-[10px] font-bold font-display uppercase whitespace-nowrap">Add screenshots</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e, true)}
                      className="hidden"
                    />
                  </label>

                  {editImages.map((img, idx) => (
                    <div key={idx} className="relative group/editimg h-10 w-16 rounded-lg overflow-hidden border border-[#2E2118] shrink-0">
                      <img src={img} alt="Edit Production" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeProductionImage(img, true)}
                        className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover/editimg:opacity-100 active:opacity-100 transition-opacity duration-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Files structure edit */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-bold text-[#8A8078] uppercase tracking-wider block font-display">
                  Update Files List ({editFiles.length} / {fileLimit} Files Loaded)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="border border-[#2E2118] hover:border-[#F5B429]/50 bg-[#0A0806] hover:bg-[#150F0B] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 text-[#FAFAF8] text-center">
                    <Upload className="h-5 w-5 text-[#F5B429] mb-0.5" />
                    <span className="text-[10px] font-bold font-display uppercase">Replace Folder</span>
                    <span className="text-[8px] text-[#8A8078] font-mono">Processes .gitignore first</span>
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
                    className="border border-[#2E2118] hover:border-[#F5B429]/50 bg-[#0A0806] hover:bg-[#150F0B] rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all gap-1 text-[#FAFAF8] text-center"
                  >
                    <Sparkles className="h-5 w-5 text-[#F5B429] mb-0.5" />
                    <span className="text-[10px] font-bold font-display uppercase">Preload Template</span>
                    <span className="text-[8px] text-[#8A8078] font-mono">Instant 4-file tree</span>
                  </button>
                </div>

                {/* EDIT PREVIEW TREE */}
                {editFiles.length > 0 && (
                  <div className="border border-[#2E2118] rounded-xl bg-[#0A0806] overflow-hidden">
                    <div className="bg-[#150F0B] px-3 sm:px-4 py-2 border-b border-[#2E2118] select-none flex flex-wrap items-center justify-between gap-1 text-[10px] text-[#8A8078] font-display font-semibold uppercase tracking-wider">
                      <span>Preview Tree structure</span>
                      <span className="hidden sm:inline">Click to preview content</span>
                    </div>

                    <div className="flex flex-col md:flex-row h-64 md:h-48 divide-y md:divide-y-0 md:divide-x divide-[#2E2118]">
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

                      <div className="w-full md:w-1/2 h-1/2 md:h-auto overflow-y-auto p-3 custom-scroll bg-[#0A0806] font-mono text-[10px] leading-normal text-[#FAFAF8]">
                        {editPreviewFile ? (
                          <div className="space-y-2 select-text">
                            <div className="font-semibold text-[#F5B429] border-b border-[#2E2118] pb-1 select-none font-mono text-[9px] uppercase truncate">
                              {"// "}{editPreviewFile.path}
                            </div>
                            <pre className="whitespace-pre-wrap break-words font-mono text-[9px] text-[#8A8078]">
                              {editPreviewFile.content || "// Empty file"}
                            </pre>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center italic text-[#8A8078] text-center px-2">
                            Select a file to preview
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Premium toggles */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-[#2E2118] pt-4">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="edit-premium-toggle"
                    checked={editIsPremium}
                    onChange={(e) => setEditIsPremium(e.target.checked)}
                    className="h-4 w-4 rounded border-[#2E2118] bg-[#0A0806] text-[#F5B429] focus:ring-0 cursor-pointer shrink-0 accent-[#F5B429]"
                  />
                  <label htmlFor="edit-premium-toggle" className="text-xs font-bold text-[#FAFAF8] uppercase tracking-wider cursor-pointer font-display">
                    Make Premium Project
                  </label>
                </div>

                {editIsPremium && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#8A8078] uppercase tracking-wider whitespace-nowrap font-display">
                      Cost (Coins)
                    </span>
                    <Input
                      type="number"
                      value={editCost}
                      onChange={(e) => setEditCost(e.target.value)}
                      className="bg-[#0A0806] border-[#2E2118] text-[#FAFAF8] text-xs h-9 w-20 text-center font-mono shrink-0 focus:border-[#F5B429]"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-[#2E2118] pt-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0">
                <Button
                  type="button"
                  onClick={() => handleDeleteProject(editingProject.id)}
                  disabled={isSavingEdit}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold h-10 px-4 rounded-xl flex items-center justify-center gap-1.5 order-2 sm:order-1 w-full sm:w-auto font-display cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Project</span>
                </Button>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 order-1 sm:order-2">
                  <Button
                    type="button"
                    onClick={() => setEditingProject(null)}
                    variant="outline"
                    className="h-10 text-xs border-[#2E2118] hover:bg-[#150F0B] text-[#FAFAF8] font-bold w-full sm:w-auto font-display"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSavingEdit || editFiles.length === 0 || editFiles.length > fileLimit}
                    className="bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold h-10 px-5 disabled:opacity-40 w-full sm:w-auto font-display shadow-[0_0_15px_rgba(245,180,41,0.25)] cursor-pointer"
                  >
                    {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-[#150F0B]" /> : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* INLINE GITHUB STYLE REPOSITORY IDE WORKSPACE */}
      {viewingProject && (
        <div className="p-4 sm:p-8 max-w-6xl w-full mx-auto flex-1 select-none z-20 relative">
          <div className="w-full bg-[#150F0B]/95 border border-[#2E2118] rounded-[2.5rem] p-2.5 backdrop-blur-3xl shadow-[0_0_50px_rgba(245,148,29,0.2)] overflow-hidden relative flex flex-col min-h-[700px] h-[80vh]">
            <div className="h-1 bg-gradient-to-r from-[#F7C948] to-[#F5941D] w-full shrink-0" />

            {/* GitHub Header */}
            <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-[#2E2118] shrink-0 bg-[#0A0806]/90">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Button onClick={closeProjectViewer} variant="ghost" className="h-8 text-xs font-mono text-[#F5B429] hover:text-[#FCD34D] font-bold gap-1 px-3 rounded-full border border-[#F5B429]/30 bg-[#F5B429]/10 cursor-pointer">
                  <ChevronLeft className="size-4" /> Back
                </Button>
                <BookOpen className="h-4 w-4 text-[#F5B429] shrink-0 ml-1" />
                <h3 className="text-xs sm:text-sm font-bold text-[#FAFAF8] tracking-tight truncate font-display">
                  {viewingProject.owner.name} / {viewingProject.title.toLowerCase().replace(/\s+/g, "-")}
                </h3>
                {viewingProject.isPremium ? (
                  <span className="text-[8px] bg-[#F5B429]/15 border border-[#F5B429]/30 text-[#F5B429] px-2 py-0.5 rounded-full font-mono font-bold uppercase shrink-0">
                    Premium
                  </span>
                ) : (
                  <span className="text-[8px] bg-[#0A0806] border border-[#2E2118] text-[#8A8078] px-2 py-0.5 rounded-full font-mono font-bold uppercase shrink-0">
                    Free
                  </span>
                )}
              </div>

              <button onClick={closeProjectViewer} className="text-[#8A8078] hover:text-[#FAFAF8] p-1.5 rounded-xl transition-colors shrink-0 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* GitHub Description Panel */}
            <div className="px-4 sm:px-6 py-3.5 bg-[#0A0806]/60 border-b border-[#2E2118] shrink-0 text-xs text-[#8A8078]">
              <p className="font-medium break-words leading-relaxed text-[#FAFAF8]">{viewingProject.description}</p>
              <p className="text-[10px] text-[#8A8078] mt-1 font-mono">
                Project deployed: {new Date(viewingProject.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Git Explorer Layout - RESPONSIVE TABBING ON MOBILE */}
            <div className="flex flex-1 min-h-0 divide-x divide-[#2E2118] bg-[#0A0806]/60 relative">
              {/* Left Side: Folder Tree Explorer (Hidden on mobile if viewing code) */}
              <div className={`w-full md:w-64 shrink-0 overflow-y-auto p-4 custom-scroll space-y-3 select-none ${mobileTab === "files" ? "block" : "hidden md:block"}`}>
                <div className="flex items-center justify-between border-b border-[#2E2118] pb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-bold text-[#F5B429] uppercase tracking-wider font-display">
                      Files Explorer
                    </span>
                    {viewingProject.isOwner && (
                      isPremiumUser ? (
                        <button
                          onClick={handleCreateNewFile}
                          className="text-[#F5B429] hover:text-[#FCD34D] transition-colors p-0.5 rounded hover:bg-[#150F0B] shrink-0 cursor-pointer"
                          title="Create New File"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            alert("Upgrade to Premium to edit, create, and delete files directly in the browser!");
                          }}
                          className="text-[#F5B429]/70 hover:text-[#F5B429] transition-colors p-0.5 rounded hover:bg-[#150F0B] shrink-0 cursor-pointer"
                          title="Premium Feature: Create New File"
                        >
                          <Lock className="h-3 w-3" />
                        </button>
                      )
                    )}
                  </div>
                  <span className="text-[9px] text-[#8A8078] font-mono">
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
                  <p className="text-xs text-[#8A8078] italic text-center py-6">
                    No files found in this repository.
                  </p>
                )}
              </div>

              {/* Right Side: Code Viewer & Readme Preview (Hidden on mobile if viewing tree) */}
              <div className={`flex-1 flex flex-col min-w-0 bg-[#0A0806] ${mobileTab === "code" ? "flex" : "hidden md:flex"}`}>
                {viewingSelectedFile ? (
                  <div className="flex-1 flex flex-col min-h-0">
                    {/* File Header */}
                    <div className="h-10 px-3 sm:px-4 border-b border-[#2E2118] bg-[#150F0B]/80 flex items-center justify-between gap-2 shrink-0 select-none">
                      <div className="flex items-center min-w-0">
                        {/* Mobile Back Button */}
                        <Button
                          onClick={() => setMobileTab("files")}
                          variant="ghost"
                          className="md:hidden h-7 px-2 hover:bg-[#241811] text-[#8A8078] hover:text-[#FAFAF8] transition-colors mr-2 flex items-center gap-1.5 rounded-md shrink-0"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="text-[10px] font-bold font-display uppercase">Tree</span>
                        </Button>

                        <span className="text-xs font-mono font-semibold text-[#FAFAF8] truncate">
                          {viewingSelectedFile.path}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {copiedFile ? (
                          <Button
                            variant="ghost"
                            className="h-7 px-2 hover:bg-[#150F0B] text-emerald-400 transition-colors gap-1 rounded-md cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase font-display hidden sm:inline">Copied</span>
                          </Button>
                        ) : (
                          <Button
                            onClick={handleCopyFileContent}
                            variant="ghost"
                            className="h-7 px-2 hover:bg-[#150F0B] text-[#8A8078] hover:text-[#FAFAF8] transition-colors gap-1 rounded-md cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-bold uppercase font-display hidden sm:inline">Copy</span>
                          </Button>
                        )}

                        {viewingProject.isOwner && (
                          isPremiumUser ? (
                            isEditingCodeFile ? (
                              <>
                                <Button
                                  onClick={handleSaveFileContent}
                                  disabled={isSavingCodeFile}
                                  variant="ghost"
                                  className="h-7 px-2 hover:bg-[#150F0B] text-emerald-400 hover:text-emerald-300 transition-colors gap-1 rounded-md font-bold cursor-pointer"
                                >
                                  {isSavingCodeFile ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Check className="h-3.5 w-3.5" />
                                  )}
                                  <span className="text-[10px] font-bold uppercase font-display">Save</span>
                                </Button>
                                <Button
                                  onClick={() => {
                                    setIsEditingCodeFile(false);
                                    setEditedCodeContent("");
                                  }}
                                  disabled={isSavingCodeFile}
                                  variant="ghost"
                                  className="h-7 px-2 hover:bg-[#150F0B] text-red-400 hover:text-red-300 transition-colors gap-1 rounded-md cursor-pointer"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span className="text-[10px] font-bold uppercase font-display">Cancel</span>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  onClick={() => {
                                    setEditedCodeContent(viewingSelectedFile.content);
                                    setIsEditingCodeFile(true);
                                  }}
                                  variant="ghost"
                                  className="h-7 px-2 hover:bg-[#150F0B] text-[#F5B429] hover:text-[#FCD34D] transition-colors gap-1 rounded-md cursor-pointer"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  <span className="text-[10px] font-bold uppercase font-display">Edit</span>
                                </Button>
                                <Button
                                  onClick={handleDeleteFile}
                                  variant="ghost"
                                  className="h-7 px-2 hover:bg-[#150F0B] text-red-400 hover:text-red-300 transition-colors gap-1 rounded-md cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="text-[10px] font-bold uppercase font-display hidden sm:inline">Delete</span>
                                </Button>
                              </>
                            )
                          ) : (
                            <Button
                              onClick={() => {
                                alert("Upgrade to Premium to edit, create, and delete files directly in the browser!");
                              }}
                              variant="ghost"
                              className="h-7 px-2 hover:bg-[#150F0B] text-[#F5B429] hover:text-[#FCD34D] transition-colors gap-1 rounded-md opacity-70 cursor-pointer"
                            >
                              <Lock className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-bold uppercase font-display">Edit File</span>
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Code Code Block */}
                    <div className="flex-1 overflow-auto custom-scroll p-3 sm:p-4 font-mono text-xs leading-relaxed text-[#FAFAF8] select-text flex">
                      {/* Line Numbers */}
                      <div className="select-none text-[#8A8078] text-right pr-3 sm:pr-4 border-r border-[#2E2118] text-[11px] font-mono leading-relaxed mr-3 sm:mr-4 shrink-0">
                        {(isEditingCodeFile ? editedCodeContent : viewingSelectedFile.content).split("\n").map((_, i) => (
                          <div key={i}>{i + 1}</div>
                        ))}
                      </div>

                      {/* Code Content */}
                      {isEditingCodeFile ? (
                        <textarea
                          value={editedCodeContent}
                          onChange={(e) => setEditedCodeContent(e.target.value)}
                          className="flex-1 bg-transparent text-[#FAFAF8] font-mono text-[11px] leading-relaxed resize-none focus:outline-none overflow-x-auto whitespace-pre outline-none"
                          style={{ fontFamily: "var(--font-jetbrains-mono)", tabSize: 2 }}
                          onKeyDown={(e) => {
                            if (e.key === "Tab") {
                              e.preventDefault();
                              const target = e.currentTarget;
                              const start = target.selectionStart;
                              const end = target.selectionEnd;
                              const val = target.value;
                              const newValue = val.substring(0, start) + "  " + val.substring(end);
                              setEditedCodeContent(newValue);
                              setTimeout(() => {
                                target.selectionStart = target.selectionEnd = start + 2;
                              }, 0);
                            }
                          }}
                        />
                      ) : (
                        <pre className="flex-1 whitespace-pre font-mono text-[11px] leading-relaxed overflow-x-auto">
                          {viewingSelectedFile.content || "// Empty file"}
                        </pre>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
                    <File className="h-8 w-8 text-[#8A8078] mb-2 opacity-50" />
                    <p className="text-xs text-[#8A8078] italic">Select a file from the explorer tree to view content.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Production Screenshots row (if available & viewing files list on mobile) */}
            {viewingProject.productionImages &&
              viewingProject.productionImages.length > 0 &&
              (mobileTab === "files" || viewingSelectedFile === null) && (
                <div className="border-t border-[#2E2118] bg-[#0A0806]/80 p-3 sm:p-4 shrink-0 max-h-[120px] sm:max-h-[140px] overflow-y-auto custom-scroll">
                  <div className="flex items-center gap-1.5 border-b border-[#2E2118] pb-2 mb-2 select-none">
                    <ImageIcon className="h-3.5 w-3.5 text-[#F5B429] shrink-0" />
                    <span className="text-[10px] font-bold text-[#FAFAF8] uppercase tracking-wider font-display">
                      Production Screenshots
                    </span>
                  </div>
                  <div className="flex items-center gap-3 overflow-x-auto py-1 custom-scroll">
                    {viewingProject.productionImages.map((img, idx) => (
                      <a key={idx} href={img} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg overflow-hidden border border-[#2E2118] hover:border-[#F5B429] transition-colors">
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
                <div className="border-t border-[#2E2118] bg-[#0A0806]/80 p-3 sm:p-4 shrink-0 max-h-[120px] sm:max-h-[150px] overflow-y-auto custom-scroll">
                  <div className="flex items-center gap-1.5 border-b border-[#2E2118] pb-2 mb-2 select-none">
                    <BookOpen className="h-3.5 w-3.5 text-[#F5B429] shrink-0" />
                    <span className="text-[10px] font-bold text-[#FAFAF8] uppercase tracking-wider font-display">
                      README.md Preview
                    </span>
                  </div>
                  <pre className="text-xs font-mono text-[#8A8078] whitespace-pre-wrap break-words select-text leading-relaxed">
                    {viewingProject.files.find((f) => f.path.toLowerCase() === "readme.md")?.content}
                  </pre>
                </div>
              )}

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-[#2E2118] shrink-0 bg-[#0A0806] flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between sm:items-center text-[#8A8078] text-[9px] uppercase font-semibold font-display">
              <span className="truncate">Owner: {viewingProject.owner.name} ({viewingProject.owner.email})</span>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => downloadAsZip(viewingProject)}
                  disabled={downloadingZipId === viewingProject.id}
                  className="bg-gradient-to-r from-[#F7C948] to-[#F5941D] text-[#150F0B] font-bold h-8 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 w-full sm:w-auto font-display shadow-[0_0_12px_rgba(245,180,41,0.2)] cursor-pointer"
                >
                  {downloadingZipId === viewingProject.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#150F0B]" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span>Download ZIP</span>
                </Button>
                <Button
                  onClick={closeProjectViewer}
                  className="bg-[#150F0B] border border-[#2E2118] hover:bg-[#241811] text-[#FAFAF8] font-bold h-8 px-4 rounded-xl text-xs w-full sm:w-auto cursor-pointer font-display"
                >
                  Close Repository
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PremiumUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={fetchProfileAndProjects}
      />
    </div>
  );
}