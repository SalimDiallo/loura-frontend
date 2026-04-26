import "server-only";

import { promises as fs } from "fs";
import path from "path";

const CONTENT_ROOT = path.join(process.cwd(), "content", "docs");

/**
 * Lit le contenu markdown d'une page.
 * Retourne null si le fichier n'existe pas.
 */
export async function readDocSource(slug: string): Promise<string | null> {
  // Normalise et empêche les remontées de chemin
  const safe = slug.replace(/\\/g, "/").replace(/\.\./g, "");
  const filePath = path.join(CONTENT_ROOT, `${safe}.md`);

  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/**
 * Liste tous les slugs disponibles sous content/docs (pour generateStaticParams).
 */
export async function listAllDocSlugs(): Promise<string[]> {
  const slugs: string[] = [];

  async function walk(dir: string, prefix: string) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full, prefix ? `${prefix}/${entry.name}` : entry.name);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        const base = entry.name.replace(/\.md$/, "");
        slugs.push(prefix ? `${prefix}/${base}` : base);
      }
    }
  }

  await walk(CONTENT_ROOT, "");
  return slugs;
}
