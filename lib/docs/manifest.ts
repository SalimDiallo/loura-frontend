/**
 * Manifest de la documentation.
 *
 * Pour ajouter une page :
 *  1. Créer le fichier markdown sous content/docs/<chemin>.md
 *  2. Ajouter une entrée dans le tableau d'une section ci-dessous
 *
 * Le `slug` correspond au path après /docs/documentation/ (sans extension).
 * Le fichier markdown est lu depuis content/docs/<slug>.md
 */

export type DocPage = {
  slug: string;
  title: string;
  description?: string;
  /** Affiché en gris à droite du titre dans la sidebar */
  badge?: "Nouveau" | "Beta" | "Bientôt";
};

export type DocSection = {
  id: string;
  title: string;
  pages: DocPage[];
};

export const DOCS_MANIFEST: DocSection[] = [
  {
    id: "getting-started",
    title: "Démarrage",
    pages: [
      {
        slug: "introduction",
        title: "Introduction",
        description: "Présentation de LouraTech et concepts clés.",
      },
      {
        slug: "quickstart",
        title: "Démarrage rapide",
        description: "Créez votre première organisation en 5 minutes.",
      },
      {
        slug: "concepts",
        title: "Concepts fondamentaux",
        description: "Organisation, membres, rôles, modules.",
      },
    ],
  },
  {
    id: "hr",
    title: "Ressources humaines",
    pages: [
      {
        slug: "hr/employees",
        title: "Employés",
        description: "Inviter, gérer et organiser votre équipe.",
      },
      {
        slug: "hr/payroll",
        title: "Paie",
        description: "Salaires, primes et avances.",
      },
      {
        slug: "hr/leaves",
        title: "Congés",
        description: "Demandes, soldes et approbations.",
      },
      {
        slug: "hr/contracts",
        title: "Contrats",
        description: "Création et gestion des contrats de travail.",
      },
    ],
  },
  {
    id: "inventory",
    title: "Stocks & ventes",
    pages: [
      {
        slug: "inventory/pos",
        title: "Ventes Rapides (POS)",
        description: "Encaisser des ventes rapidement.",
      },
      {
        slug: "inventory/products",
        title: "Produits",
        description: "Catalogue, prix et catégories.",
      },
      {
        slug: "inventory/warehouses",
        title: "Entrepôts",
        description: "Gestion multi-sites et transferts.",
      },
      {
        slug: "inventory/stock",
        title: "Mouvements de stock",
        description: "Entrées, sorties et ajustements.",
      },
    ],
  },
  {
    id: "api",
    title: "API & Intégrations",
    pages: [
      {
        slug: "api/overview",
        title: "Vue d'ensemble",
        description: "Endpoints, authentification, formats.",
        badge: "Beta",
      },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export function getAllPages(): (DocPage & { sectionId: string; sectionTitle: string })[] {
  return DOCS_MANIFEST.flatMap((section) =>
    section.pages.map((page) => ({
      ...page,
      sectionId: section.id,
      sectionTitle: section.title,
    }))
  );
}

export function getPageBySlug(slug: string) {
  return getAllPages().find((p) => p.slug === slug) ?? null;
}

export function getAdjacentPages(slug: string) {
  const all = getAllPages();
  const idx = all.findIndex((p) => p.slug === slug);
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx >= 0 && idx < all.length - 1 ? all[idx + 1] : null,
  };
}

export function getSectionBySlug(slug: string): DocSection | null {
  for (const section of DOCS_MANIFEST) {
    if (section.pages.some((p) => p.slug === slug)) return section;
  }
  return null;
}
