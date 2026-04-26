import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

/**
 * Convertit du markdown GFM en HTML avec coloration syntaxique.
 * Server-only — utilise unified + rehype-pretty-code.
 *
 * Pré-traitement : transforme les blocs custom (:::callout, :::video, :::image, :::steps)
 * en HTML brut conservé via allowDangerousHtml.
 */
export async function renderMarkdown(source: string): Promise<string> {
  const preprocessed = preprocessCustomBlocks(source);

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypePrettyCode, {
      theme: { dark: "github-dark-dimmed", light: "github-light" },
      keepBackground: false,
      defaultLang: "plaintext",
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(preprocessed);

  return String(file);
}

// ============================================================================
// PRÉ-TRAITEMENT BLOCS CUSTOM
// ============================================================================

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(\w+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(raw))) out[m[1]] = m[2];
  return out;
}

function preprocessCustomBlocks(src: string): string {
  let s = src;

  // ─── :::video src="ID" title="..." /:::  (self-closing) ────────────────
  s = s.replace(
    /:::video\s+([^/]+?)\s*\/:::/g,
    (_match, attrsRaw: string) => {
      const attrs = parseAttrs(attrsRaw);
      const id = attrs.src || "";
      const title = attrs.title || "Vidéo";
      if (!id) return "";
      const safeId = encodeURIComponent(id);
      const safeTitle = escapeHtml(title);
      return `\n<div class="doc-video">
  <div class="doc-video-frame">
    <iframe
      src="https://www.youtube-nocookie.com/embed/${safeId}?rel=0&modestbranding=1"
      title="${safeTitle}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
      loading="lazy"
    ></iframe>
  </div>
  <p class="doc-video-caption">${safeTitle}</p>
</div>\n`;
    }
  );

  // ─── :::image src="..." alt="..." caption="..." /:::  ───────────────────
  s = s.replace(
    /:::image\s+([^/]+?)\s*\/:::/g,
    (_match, attrsRaw: string) => {
      const attrs = parseAttrs(attrsRaw);
      const src = attrs.src || "";
      const alt = attrs.alt || "";
      const caption = attrs.caption || "";
      if (!src) return "";
      return `\n<figure class="doc-image">
  <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" />
  ${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}
</figure>\n`;
    }
  );

  // ─── :::callout type="info|tip|warning|success" title="..."
  //     contenu
  //     ::: ───────────────────────────────────────────────────────────────
  s = s.replace(
    /:::callout\s+([^\n]+?)\n([\s\S]*?)\n:::/g,
    (_match, attrsRaw: string, body: string) => {
      const attrs = parseAttrs(attrsRaw);
      const type = (attrs.type || "info").toLowerCase();
      const title = attrs.title || "";
      const validType = ["info", "tip", "warning", "success"].includes(type)
        ? type
        : "info";
      // Le body est du markdown — on le réinjecte indenté pour qu'il soit reparsé
      return `\n<aside class="doc-callout doc-callout-${validType}">
  ${title ? `<p class="doc-callout-title">${escapeHtml(title)}</p>` : ""}
  <div class="doc-callout-body">

${body}

  </div>
</aside>\n`;
    }
  );

  // ─── :::steps
  //     1. Étape 1
  //     2. Étape 2
  //     ::: ───────────────────────────────────────────────────────────────
  s = s.replace(
    /:::steps\n([\s\S]*?)\n:::/g,
    (_match, body: string) => {
      // Capture les items "N. texte" et conserve le contenu indenté qui suit
      const lines = body.split("\n");
      const items: string[] = [];
      let current: string[] = [];
      const flush = () => {
        if (current.length === 0) return;
        items.push(current.join("\n").trim());
        current = [];
      };
      for (const line of lines) {
        if (/^\d+\.\s+/.test(line)) {
          flush();
          current.push(line.replace(/^\d+\.\s+/, ""));
        } else {
          current.push(line);
        }
      }
      flush();

      const html = items
        .map(
          (item, i) => `<li class="doc-step">
  <span class="doc-step-num">${i + 1}</span>
  <div class="doc-step-body">

${item}

  </div>
</li>`
        )
        .join("\n");

      return `\n<ol class="doc-steps">\n${html}\n</ol>\n`;
    }
  );

  return s;
}

/**
 * Slugify simple pour générer des id de heading stables.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export type TocEntry = {
  id: string;
  text: string;
  level: 2 | 3;
};

/**
 * Extrait les headings H2/H3 du markdown source pour générer la TOC.
 * Les ID sont stables via slugify, à condition d'injecter ces ID côté HTML
 * (post-traitement) ou de styliser via une convention <h2 id="...">.
 *
 * Pour rester simple : on parcourt les lignes commençant par `## ` ou `### `.
 * On ignore les blocs code (entre triple backticks).
 */
export function extractToc(source: string): TocEntry[] {
  const lines = source.split("\n");
  const entries: TocEntry[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const m2 = /^##\s+(.+?)\s*$/.exec(line);
    if (m2) {
      const text = m2[1].trim();
      entries.push({ id: slugify(text), text, level: 2 });
      continue;
    }
    const m3 = /^###\s+(.+?)\s*$/.exec(line);
    if (m3) {
      const text = m3[1].trim();
      entries.push({ id: slugify(text), text, level: 3 });
    }
  }

  return entries;
}

/**
 * Post-traitement HTML : ajoute les `id` sur les <h2>/<h3> à partir du texte.
 * Évite d'avoir besoin de rehype-slug.
 */
export function addHeadingIds(html: string): string {
  return html.replace(
    /<(h[23])>([^<]+)<\/h[23]>/g,
    (_match, tag: string, text: string) => {
      const id = slugify(text);
      return `<${tag} id="${id}"><a href="#${id}" class="doc-heading-anchor">#</a>${text}</${tag}>`;
    }
  );
}
