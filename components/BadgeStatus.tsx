import { FaCheck, FaRegClock, FaRegEnvelope, FaTimes } from "react-icons/fa";
import { Badge } from "./ui";

/**
 * BadgeStatus - Affiche un badge de statut avec option d'icône / couleurs améliorées.
 * Meilleure palette, comportement plus flexible, accessibilité améliorée.
 */
export function BadgeStatus({
  status,
  withIcon = true,
  className = "",
}: {
  status:
    | "pending"
    | "accepted"
    | "declined"
    | "expired"
    | "active"
    | "inactive"
    | boolean;
  withIcon?: boolean;
  className?: string;
}) {
  // Palette de couleurs optimisée et variantes cohérentes
  const statusConfig = {
    pending: {
      label: "En attente",
      icon: FaRegClock,
      variant: "secondary" as const,
      bgClass: "bg-blue-50 text-blue-800 border-blue-100",
      iconClass: "text-blue-600",
    },
    accepted: {
      label: "Acceptée",
      icon: FaCheck,
      variant: "default" as const,
      bgClass: "bg-green-50 text-green-800 border-green-100",
      iconClass: "text-green-600",
    },
    declined: {
      label: "Refusée",
      icon: FaTimes,
      variant: "destructive" as const,
      bgClass: "bg-red-50 text-red-800 border-red-100",
      iconClass: "text-red-600",
    },
    expired: {
      label: "Expirée",
      icon: FaRegEnvelope,
      variant: "secondary" as const,
      bgClass: "bg-gray-50 text-gray-500 border-gray-100",
      iconClass: "text-gray-400",
    },
    active: {
      label: "Actif",
      icon: FaCheck,
      variant: "default" as const,
      bgClass: "bg-green-50 text-green-800 border-green-100",
      iconClass: "text-green-600",
    },
    inactive: {
      label: "Inactif",
      icon: FaTimes,
      variant: "secondary" as const,
      bgClass: "bg-gray-100 text-gray-400 border-gray-200",
      iconClass: "text-gray-400",
    },
  };

  // Support legacy boolean (true = actif, false = inactif)
  if (typeof status === "boolean") {
    const config = status
      ? statusConfig.active
      : statusConfig.inactive;
    const Icon = config.icon;
    return (
      <Badge
        variant={config.variant}
        className={`gap-1 border ${config.bgClass} ${className}`.trim()}
        aria-label={config.label}
      >
        {withIcon && Icon && (
          <Icon className={`h-3 w-3 mr-1 ${config.iconClass}`} aria-hidden />
        )}
        {config.label}
      </Badge>
    );
  }

  const config = statusConfig[status as keyof typeof statusConfig];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`gap-1 border ${config.bgClass} ${className}`.trim()}
      aria-label={config.label}
    >
      {withIcon && Icon && (
        <Icon className={`h-3 w-3 mr-1 ${config.iconClass}`} aria-hidden />
      )}
      {config.label}
    </Badge>
  );
}
