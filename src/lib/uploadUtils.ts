import fs from "fs/promises";
import path from "path";

/**
 * Returns the absolute path of the uploads directory, creating it if needed.
 */
export async function getUploadsDir(subDir?: string): Promise<string> {
  const base = path.join(process.cwd(), "public", "uploads");
  const dir = subDir ? path.join(base, subDir) : base;
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Sanitise a filename for safe filesystem storage.
 */
export function sanitiseFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

/**
 * Generate a unique upload filename with timestamp prefix.
 */
export function uniqueFilename(originalName: string): string {
  return `${Date.now()}-${sanitiseFilename(originalName)}`;
}
