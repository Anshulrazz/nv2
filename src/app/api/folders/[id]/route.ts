import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Folder, IFolder } from "@/models/Folder";
import { Note } from "@/models/Note";
import { isValidObjectId } from "@/lib/validation";

// Recursive folder cascade delete helper to clean up nested folders and notes
async function deleteFolderCascade(folderId: string, userId: string) {
  // 1. Delete all notes inside this folder
  await Note.deleteMany({ folderId, userId });

  // 2. Find and recursively delete all child folders
  const childFolders = await Folder.find({ parentId: folderId, userId });
  for (const child of childFolders) {
    await deleteFolderCascade(child._id.toString(), userId);
  }

  // 3. Delete the folder itself
  await Folder.deleteOne({ _id: folderId, userId });
}

export const PATCH = auth(async function PATCH(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid folder ID format." }, { status: 400 });
    }

    const body = await req.json();
    const { name, color, parentId } = body;

    if (name !== undefined && (typeof name !== "string" || name.trim() === "")) {
      return NextResponse.json({ error: "Folder name cannot be empty and must be a string." }, { status: 400 });
    }

    if (color !== undefined && color !== null && typeof color !== "string") {
      return NextResponse.json({ error: "Color must be a string or null." }, { status: 400 });
    }

    await connectToDatabase();

    // Verify folder ownership
    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found." }, { status: 404 });
    }

    if (name !== undefined) folder.name = name.trim();
    if (color !== undefined) folder.color = color || null;
    
    if (parentId !== undefined) {
      if (parentId === id) {
        return NextResponse.json({ error: "Cannot nest a folder inside itself." }, { status: 400 });
      }
      
      if (parentId !== null) {
        if (!isValidObjectId(parentId)) {
          return NextResponse.json({ error: "Invalid parent folder ID format." }, { status: 400 });
        }
        
        // Verify parent folder exists and is owned by the current user
        const parentFolder = await Folder.findOne({ _id: parentId, userId });
        if (!parentFolder) {
          return NextResponse.json({ error: "Parent folder not found or unauthorized." }, { status: 404 });
        }

        // Cycle check: Traverse up from parentId to check if it hits `id`
        let currentParentId: string | null = parentId;
        while (currentParentId) {
          if (currentParentId === id) {
            return NextResponse.json({ error: "Cannot nest a folder inside its own descendant (creates cycle)." }, { status: 400 });
          }
          const pf = (await Folder.findById(currentParentId)) as IFolder | null;
          if (!pf) break;
          currentParentId = pf.parentId ? pf.parentId.toString() : null;
        }
      }
      folder.parentId = parentId || null;
    }

    await folder.save();
    return NextResponse.json(folder);
  } catch (error) {
    console.error("Update folder error:", error);
    return NextResponse.json({ error: "Failed to update folder." }, { status: 500 });
  }
});

export const DELETE = auth(async function DELETE(req, context) {
  try {
    const userId = req.auth?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await (context?.params as Promise<{ id: string }>);
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid folder ID format." }, { status: 400 });
    }

    await connectToDatabase();

    const isAdmin = req.auth?.user?.role === "admin";
    const query = isAdmin ? { _id: id } : { _id: id, userId };

    // Verify folder ownership
    const folder = await Folder.findOne(query);
    if (!folder) {
      return NextResponse.json({ error: "Folder not found." }, { status: 404 });
    }

    // Execute recursive cascade delete
    await deleteFolderCascade(id, folder.userId.toString());

    return NextResponse.json({ message: "Folder and all its contents deleted successfully." });
  } catch (error) {
    console.error("Delete folder error:", error);
    return NextResponse.json({ error: "Failed to delete folder." }, { status: 500 });
  }
});
