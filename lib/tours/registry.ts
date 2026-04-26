import type { TourStep } from "@/components/GuidedTour";
import {
    Bell,
    Boxes,
    Briefcase,
    Building2,
    Calendar,
    CreditCard,
    FileText,
    Package,
    Receipt,
    Search,
    Settings,
    ShoppingCart,
    Truck,
    UserCheck,
    Users,
    Warehouse,
} from "lucide-react";

export type TourDef = {
  id: string;
  category: "general" | "hr" | "inventory" | "settings";
  title: string;
  description: string;
  icon: React.ElementType;
  /** Page de départ (relative à /organisation/{orgId}). Si différente de la page actuelle, on navigue d'abord. */
  startPath: (orgId: string) => string;
  steps: TourStep[];
};

// ============================================================================
// REGISTRY
// ============================================================================

export const TOUR_REGISTRY: TourDef[] = [
  // ── GÉNÉRAL ────────────────────────────────────────────────────────────
  {
    id: "sidebar-overview",
    category: "general",
    title: "Découvrir l'interface",
    description: "Présentation de la barre latérale et des modules.",
    icon: Building2,
    startPath: (id) => `/organisation/${id}/dashboard`,
    steps: [
      {
        target: "sidebar-header",
        icon: Building2,
        title: "Votre espace de travail",
        description:
          "Vous êtes maintenant dans cette organisation. Le logo et le nom rappellent toujours où vous êtes.",
        placement: "right",
      },
      {
        target: "sidebar-search",
        icon: Search,
        title: "Recherche rapide",
        description:
          "Tapez un mot-clé pour filtrer instantanément le menu — départements, ventes, paie, etc.",
        placement: "right",
      },
      {
        target: "sidebar-group-hr",
        icon: Users,
        title: "Ressources humaines",
        description:
          "Gérez vos collaborateurs : départements, postes, employés, paie, contrats et congés.",
        placement: "right",
      },
      {
        target: "sidebar-group-inventory",
        icon: Package,
        title: "Gestion des stocks",
        description:
          "Tout l'opérationnel : caisse, ventes, produits, fournisseurs, entrepôts, alertes et rapports.",
        placement: "right",
      },
      {
        target: "sidebar-group-org",
        icon: Settings,
        title: "Paramètres & branding",
        description:
          "Personnalisez le logo, les couleurs et les mentions légales qui apparaîtront sur vos documents.",
        placement: "right",
      },
    ],
  },

  // ── RH ─────────────────────────────────────────────────────────────────
  {
    id: "hr-employees",
    category: "hr",
    title: "Gérer vos employés",
    description: "Ajouter, inviter et organiser votre équipe.",
    icon: UserCheck,
    startPath: (id) => `/organisation/${id}/hr/employees`,
    steps: [
      {
        target: "page-header",
        icon: Users,
        title: "Liste des employés",
        description:
          "Tous les membres de l'organisation sont listés ici, avec leur rôle et leur statut.",
        placement: "bottom",
      },
      {
        target: "page-action-create",
        icon: UserCheck,
        title: "Inviter un nouveau membre",
        description:
          "Envoyez une invitation par email. Le membre recevra un lien pour rejoindre l'organisation.",
        placement: "bottom",
      },
      {
        target: "list-table",
        icon: Briefcase,
        title: "Tableau interactif",
        description:
          "Cliquez sur une ligne pour voir le détail du membre, ses contrats, postes et historique.",
        placement: "top",
      },
    ],
  },
  {
    id: "hr-payroll",
    category: "hr",
    title: "Gérer la paie",
    description: "Salaires, avances et bulletins.",
    icon: CreditCard,
    startPath: (id) => `/organisation/${id}/hr/payroll`,
    steps: [
      {
        target: "page-header",
        icon: CreditCard,
        title: "Module paie",
        description:
          "Centralisez les paiements de salaires, primes et avances de votre organisation.",
        placement: "bottom",
      },
      {
        target: "page-action-create",
        icon: Receipt,
        title: "Créer un paiement",
        description:
          "Enregistrez un nouveau paiement de salaire ou une avance pour un employé.",
        placement: "bottom",
      },
    ],
  },
  {
    id: "hr-leaves",
    category: "hr",
    title: "Gérer les congés",
    description: "Demandes, soldes et approbations.",
    icon: Calendar,
    startPath: (id) => `/organisation/${id}/hr/leaves`,
    steps: [
      {
        target: "page-header",
        icon: Calendar,
        title: "Demandes de congés",
        description:
          "Visualisez toutes les demandes en cours et leur statut (en attente, approuvée, refusée).",
        placement: "bottom",
      },
      {
        target: "page-action-create",
        icon: Calendar,
        title: "Nouvelle demande",
        description:
          "Créez une demande de congé pour un employé. Le solde sera automatiquement vérifié.",
        placement: "bottom",
      },
    ],
  },
  {
    id: "hr-contracts",
    category: "hr",
    title: "Gérer les contrats",
    description: "Contrats de travail, périodes d'essai, avenants.",
    icon: FileText,
    startPath: (id) => `/organisation/${id}/hr/contracts`,
    steps: [
      {
        target: "page-header",
        icon: FileText,
        title: "Contrats",
        description:
          "Liste de tous les contrats : actifs, à renouveler, expirés. Téléchargez les PDF à tout moment.",
        placement: "bottom",
      },
      {
        target: "page-action-create",
        icon: FileText,
        title: "Nouveau contrat",
        description:
          "Créez un contrat pour un employé. Le document sera généré automatiquement avec votre branding.",
        placement: "bottom",
      },
    ],
  },

  // ── INVENTAIRE ─────────────────────────────────────────────────────────
  {
    id: "inv-pos",
    category: "inventory",
    title: "Utiliser la caisse",
    description: "Encaisser une vente rapidement.",
    icon: ShoppingCart,
    startPath: (id) => `/organisation/${id}/inventory/pos`,
    steps: [
      {
        target: "pos-warehouse",
        icon: Warehouse,
        title: "Choisir l'entrepôt",
        description:
          "Sélectionnez l'entrepôt depuis lequel les produits seront vendus. Le stock disponible s'affiche par produit.",
        placement: "bottom",
      },
      {
        target: "pos-products",
        icon: Package,
        title: "Catalogue produits",
        description:
          "Cliquez sur un produit pour l'ajouter au panier. Les produits en rupture sont désactivés.",
        placement: "top",
      },
      {
        target: "pos-cart",
        icon: ShoppingCart,
        title: "Panier",
        description:
          "Ajustez les quantités, choisissez le client et la méthode de paiement, puis encaissez.",
        placement: "left",
      },
    ],
  },
  {
    id: "inv-sales",
    category: "inventory",
    title: "Suivre les ventes",
    description: "Historique, paiements et factures.",
    icon: Receipt,
    startPath: (id) => `/organisation/${id}/inventory/sales`,
    steps: [
      {
        target: "page-header",
        icon: Receipt,
        title: "Liste des ventes",
        description:
          "Consultez toutes vos ventes, leur statut de paiement et téléchargez les factures.",
        placement: "bottom",
      },
      {
        target: "list-table",
        icon: Receipt,
        title: "Détail d'une vente",
        description:
          "Cliquez sur une ligne pour voir les articles, enregistrer un paiement ou émettre un avoir.",
        placement: "top",
      },
    ],
  },
  {
    id: "inv-products",
    category: "inventory",
    title: "Gérer les produits",
    description: "Catalogue, prix, catégories.",
    icon: Package,
    startPath: (id) => `/organisation/${id}/inventory/products`,
    steps: [
      {
        target: "page-header",
        icon: Package,
        title: "Catalogue produits",
        description:
          "Tous vos produits avec leurs prix, catégories et niveaux de stock par entrepôt.",
        placement: "bottom",
      },
      {
        target: "page-action-create",
        icon: Package,
        title: "Ajouter un produit",
        description:
          "Créez un produit avec son SKU, ses prix d'achat et de vente, et activez le suivi de stock si besoin.",
        placement: "bottom",
      },
    ],
  },
  {
    id: "inv-warehouses",
    category: "inventory",
    title: "Gérer les entrepôts",
    description: "Sites de stockage et transferts.",
    icon: Warehouse,
    startPath: (id) => `/organisation/${id}/inventory/warehouses`,
    steps: [
      {
        target: "page-header",
        icon: Warehouse,
        title: "Vos entrepôts",
        description:
          "Chaque entrepôt a son propre stock. Les produits peuvent être transférés entre entrepôts.",
        placement: "bottom",
      },
      {
        target: "page-action-create",
        icon: Warehouse,
        title: "Nouvel entrepôt",
        description:
          "Ajoutez un site de stockage (boutique, dépôt, point de vente).",
        placement: "bottom",
      },
    ],
  },
  {
    id: "inv-suppliers",
    category: "inventory",
    title: "Gérer les fournisseurs",
    description: "Carnet d'adresses et achats.",
    icon: Truck,
    startPath: (id) => `/organisation/${id}/inventory/suppliers`,
    steps: [
      {
        target: "page-header",
        icon: Truck,
        title: "Fournisseurs",
        description:
          "Vos fournisseurs avec leurs coordonnées, conditions de paiement et historique d'achats.",
        placement: "bottom",
      },
      {
        target: "page-action-create",
        icon: Truck,
        title: "Nouveau fournisseur",
        description:
          "Ajoutez un fournisseur pour passer des commandes d'approvisionnement.",
        placement: "bottom",
      },
    ],
  },
  {
    id: "inv-stock",
    category: "inventory",
    title: "Inventaire & mouvements",
    description: "Entrées, sorties, ajustements.",
    icon: Boxes,
    startPath: (id) => `/organisation/${id}/inventory/movements`,
    steps: [
      {
        target: "page-header",
        icon: Boxes,
        title: "Mouvements de stock",
        description:
          "Toutes les entrées, sorties et ajustements de stock sont tracés ici, avec leur statut.",
        placement: "bottom",
      },
      {
        target: "page-action-create",
        icon: Boxes,
        title: "Nouveau mouvement",
        description:
          "Enregistrez une entrée (réception fournisseur), une sortie (perte, casse) ou un ajustement.",
        placement: "bottom",
      },
    ],
  },
  {
    id: "inv-alerts",
    category: "inventory",
    title: "Alertes de stock",
    description: "Surveillez les ruptures et seuils bas.",
    icon: Bell,
    startPath: (id) => `/organisation/${id}/inventory/alerts`,
    steps: [
      {
        target: "page-header",
        icon: Bell,
        title: "Centre d'alertes",
        description:
          "Tous les produits sous le seuil minimum ou en rupture s'affichent ici, avec actions rapides.",
        placement: "bottom",
      },
    ],
  },
];

export function getTourById(id: string): TourDef | undefined {
  return TOUR_REGISTRY.find((t) => t.id === id);
}

export function getToursByCategory(category: TourDef["category"]): TourDef[] {
  return TOUR_REGISTRY.filter((t) => t.category === category);
}

/**
 * Retourne les tours pertinents pour la page courante.
 * - Tour exact match : le tour dont startPath === pathname
 * - Tours du même module (hr/inventory) sont aussi suggérés
 * - "sidebar-overview" est toujours proposé en dernier
 */
export function getToursForPath(pathname: string, orgId: string): {
  primary: TourDef[];
  related: TourDef[];
} {
  if (!orgId) return { primary: [], related: [] };

  const exact = TOUR_REGISTRY.filter((t) => t.startPath(orgId) === pathname);

  const module = pathname.includes(`/organisation/${orgId}/hr`)
    ? "hr"
    : pathname.includes(`/organisation/${orgId}/inventory`)
      ? "inventory"
      : null;

  const related = module
    ? TOUR_REGISTRY.filter(
        (t) => t.category === module && !exact.includes(t)
      )
    : [];

  // Toujours proposer la découverte générale en dernier si pas déjà incluse
  const overview = TOUR_REGISTRY.find((t) => t.id === "sidebar-overview");
  if (overview && !exact.includes(overview) && !related.includes(overview)) {
    related.push(overview);
  }

  return { primary: exact, related };
}
