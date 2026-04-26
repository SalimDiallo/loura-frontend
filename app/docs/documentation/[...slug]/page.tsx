import DocsPagination from "@/components/docs/DocsPagination";
import DocsTOC from "@/components/docs/DocsTOC";
import { listAllDocSlugs, readDocSource } from "@/lib/docs/content";
import {
    DOCS_MANIFEST,
    getAdjacentPages,
    getPageBySlug,
    getSectionBySlug,
} from "@/lib/docs/manifest";
import { addHeadingIds, extractToc, renderMarkdown } from "@/lib/docs/markdown";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Params = { slug: string[] };

// ── Static params ──────────────────────────────────────────────────────────
export async function generateStaticParams() {
  const slugs = await listAllDocSlugs();
  return slugs.map((slug) => ({ slug: slug.split("/") }));
}

// ── SEO ────────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const slugStr = slug.join("/");
  const page = getPageBySlug(slugStr);
  if (!page) return { title: "Documentation" };
  return {
    title: `${page.title} — Documentation LouraTech`,
    description: page.description,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function DocPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const slugStr = slug.join("/");

  const page = getPageBySlug(slugStr);
  const source = await readDocSource(slugStr);
  if (!page || !source) notFound();

  const html = addHeadingIds(await renderMarkdown(source));
  const toc = extractToc(source);
  const section = getSectionBySlug(slugStr);
  const { prev, next } = getAdjacentPages(slugStr);

  return (
    <div className="flex">
      {/* ── Contenu principal ─────────────────────────────────── */}
      <article className="flex-1 min-w-0 px-6 lg:px-12 py-10 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-6"
        >
          <Link
            href="/docs/documentation"
            className="hover:text-foreground transition-colors"
          >
            Documentation
          </Link>
          {section && (
            <>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className="text-muted-foreground">{section.title}</span>
            </>
          )}
          <ChevronRight className="h-3 w-3 opacity-50" />
          <span className="text-foreground font-medium">{page.title}</span>
        </nav>

        {/* Titre */}
        <header className="mb-8 pb-6 border-b border-border">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {page.title}
          </h1>
          {page.description && (
            <p className="text-base text-muted-foreground mt-2 leading-relaxed">
              {page.description}
            </p>
          )}
        </header>

        {/* Markdown rendu */}
        <div
          className="docs-prose"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* Pagination prev/next */}
        <DocsPagination prev={prev} next={next} />
      </article>

      {/* ── TOC droite ────────────────────────────────────────── */}
      <aside className="hidden xl:block w-56 shrink-0 px-6 py-10">
        <div className="sticky top-20">
          <DocsTOC entries={toc} />
        </div>
      </aside>
    </div>
  );
}

// Force la page à être pré-rendue à build (sera incluse dans le manifest)
export const dynamicParams = false;

// (Sécurise contre l'oubli de manifest entry pour un fichier orphelin)
void DOCS_MANIFEST;
