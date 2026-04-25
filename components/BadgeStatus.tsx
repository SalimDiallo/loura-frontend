import { FaCheck, FaRegEnvelope, FaTimes } from "react-icons/fa";
import { FaClock } from "react-icons/fa6";
import { Badge } from "./ui";

/**
 * BadgeStatus - Affiche un badge de statut avec option d'icône / couleurs améliorées, avec gestion du dark mode.
 * Meilleure palette, comportement plus flexible, accessibilité améliorée.
 */

// Ajoutons "cancelled", "completed", "draft", "paid", "unpaid", "partial"
type BadgeStatusType =
  | "pending"
  | "approved"
  | "rejected"
  | "accepted"
  | "declined"
  | "expired"
  | "active"
  | "inactive"
  | "cancelled"
  | "paid"
  | "unpaid"
  | "partial"
  | "completed"
  | "draft"
  | boolean;

export function BadgeStatus({
  status,
  withIcon = true,
  className = "",
}: {
  status: BadgeStatusType;
  withIcon?: boolean;
  className?: string;
}) {
  // Palette de couleurs optimisée, variantes cohérentes, gestion couleurs dark mode en CSS utilitaires
  const statusConfig: Record<
    Exclude<BadgeStatusType, boolean>,
    {
      label: string;
      icon: React.ElementType;
      variant: "default" | "secondary" | "destructive";
      bgClass: string;
      iconClass: string;
    }
  > = {
    pending: {
      label: "En attente",
      icon: FaClock,
      variant: "secondary",
      bgClass:
        "bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800",
      iconClass: "text-blue-600 dark:text-blue-200",
    },
    approved: {
      label: "Approuvé",
      icon: FaCheck,
      variant: "default",
      bgClass:
        "bg-green-50 text-green-800 border-green-100 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800",
      iconClass: "text-green-600 dark:text-green-200",
    },
    rejected: {
      label: "Rejeté",
      icon: FaTimes,
      variant: "destructive",
      bgClass:
        "bg-red-50 text-red-800 border-red-100 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800",
      iconClass: "text-red-600 dark:text-red-200",
    },
    accepted: {
      label: "Acceptée",
      icon: FaCheck,
      variant: "default",
      bgClass:
        "bg-green-50 text-green-800 border-green-100 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800",
      iconClass: "text-green-600 dark:text-green-200",
    },
    declined: {
      label: "Refusée",
      icon: FaTimes,
      variant: "destructive",
      bgClass:
        "bg-red-50 text-red-800 border-red-100 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800",
      iconClass: "text-red-600 dark:text-red-200",
    },
    expired: {
      label: "Expirée",
      icon: FaRegEnvelope,
      variant: "secondary",
      bgClass:
        "bg-gray-50 text-gray-500 border-gray-100 dark:bg-muted dark:text-gray-400 dark:border-gray-700",
      iconClass: "text-gray-400 dark:text-gray-300",
    },
    active: {
      label: "Actif",
      icon: FaCheck,
      variant: "default",
      bgClass:
        "bg-green-50 text-green-800 border-green-100 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800",
      iconClass: "text-green-600 dark:text-green-200",
    },
    inactive: {
      label: "Inactif",
      icon: FaTimes,
      variant: "secondary",
      bgClass:
        "bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800/80 dark:text-gray-500 dark:border-gray-700",
      iconClass: "text-gray-400 dark:text-gray-500",
    },
    cancelled: {
      label: "Annulé",
      icon: FaTimes,
      variant: "secondary",
      bgClass:
        "bg-yellow-50 text-yellow-800 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-900",
      iconClass: "text-yellow-600 dark:text-yellow-200",
    },
    paid: {
      label: "Payé",
      icon: FaCheck,
      variant: "default",
      bgClass:
        "bg-green-50 text-green-800 border-green-100 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800",
      iconClass: "text-green-600 dark:text-green-200",
    },
    unpaid: {
      label: "Impayé",
      icon: FaTimes,
      variant: "destructive",
      bgClass:
        "bg-red-50 text-red-800 border-red-100 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800",
      iconClass: "text-red-600 dark:text-red-200",
    },
    partial: {
      label: "Partiel",
      icon: FaRegEnvelope,
      variant: "secondary",
      bgClass:
        "bg-yellow-50 text-yellow-800 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-900",
      iconClass: "text-yellow-600 dark:text-yellow-200",
    },
    completed: {
      label: "Terminé",
      icon: FaCheck,
      variant: "default",
      bgClass:
        "bg-blue-50 text-blue-800 border-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800",
      iconClass: "text-blue-600 dark:text-blue-200",
    },
    draft: {
      label: "Brouillon",
      icon: FaRegEnvelope,
      variant: "secondary",
      bgClass:
        "bg-gray-50 text-gray-400 border-gray-100 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800",
      iconClass: "text-gray-400 dark:text-gray-300",
    },
  };

  // Support legacy boolean (true = actif, false = inactif)
  if (typeof status === "boolean") {
    const config = status ? statusConfig.active : statusConfig.inactive;
    const Icon = config.icon;
    return (
      <Badge
        variant={config.variant}
        className={`gap-1 border px-1 ${config.bgClass} ${className}`.trim()}
        aria-label={config.label}
      >
        {withIcon && Icon && (
          <Icon className={`h-3 w-3 mr-1 ${config.iconClass}`} aria-hidden />
        )}
        {config.label}
      </Badge>
    );
  }

  const config = statusConfig[status as Exclude<BadgeStatusType, boolean>];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`gap-1 border px-1 ${config.bgClass} ${className}`.trim()}
      aria-label={config.label}
    >
      {withIcon && Icon && (
        <Icon className={`h-3 w-3 mr-1 ${config.iconClass}`} aria-hidden />
      )}
      {config.label}
    </Badge>
  );
}
