import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Folder } from "@/models/Folder";
import { Note } from "@/models/Note";

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
    const body = await req.json();
    const { name, color, parentId } = body;

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

    await connectToDatabase();

    // Verify folder ownership
    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found." }, { status: 404 });
    }

    // Execute recursive cascade delete
    await deleteFolderCascade(id, userId);

    return NextResponse.json({ message: "Folder and all its contents deleted successfully." });
  } catch (error) {
    console.error("Delete folder error:", error);
    return NextResponse.json({ error: "Failed to delete folder." }, { status: 500 });
  }
});
