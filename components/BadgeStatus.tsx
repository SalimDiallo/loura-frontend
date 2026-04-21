import { FaCheck, FaRegClock, FaRegEnvelope, FaTimes } from "react-icons/fa";
import { Badge } from "./ui";

/**
 * BadgeStatus - affiche un badge de statut, avec ou sans icône selon configuration.
 * Par défaut ("default"), affiche l'icône si disponible.
 * On peut préciser si on veut afficher l'icône via une prop optionnelle "withIcon".
 */
export function BadgeStatus({
  status,
  withIcon = true, // clé de contrôle globale
}: {
  status:
    | "pending"
    | "accepted"
    | "declined"
    | "expired"
    | "active"
    | "inactive" | boolean;
  withIcon?: boolean;
}) {
  const statusConfig = {
    pending: {
      label: "En attente",
      icon: FaRegClock,
      variant: "default" as const,
      className: "bg-blue-600",
      showIcon: true,
    },
    accepted: {
      label: "Acceptée",
      icon: FaCheck,
      variant: "default" as const,
      className: "bg-green-600",
      showIcon: true,
    },
    declined: {
      label: "Refusée",
      icon: FaTimes,
      variant: "destructive" as const,
      className: "",
      showIcon: true,
    },
    expired: {
      label: "Expirée",
      icon: FaRegEnvelope,
      variant: "secondary" as const,
      className: "",
      showIcon: true,
    },
    active: {
      label: "Actif",
      icon: FaCheck,
      variant: "default" as const,
      className: "bg-green-600",
      showIcon: true,
    },
    inactive: {
      label: "Inactif",
      icon: FaTimes,
      variant: "secondary" as const,
      className: "",
      showIcon: true,
    },
  };

  if (typeof status === "boolean") {
    if (status) {
      return (
        <Badge variant="default" className="bg-green-600 gap-1">
          {withIcon && <FaCheck className="h-3 w-3" />}
     
          Actif
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="gap-1">
          {withIcon && <FaTimes className="h-3 w-3" />}
          Inactif
        </Badge>
      );
    }
  }

  const config = statusConfig[status];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      {withIcon && config.showIcon && Icon ? (
        <Icon className="h-3 w-3 mr-1 inline" />
      ) : null}
      {config.label}
    </Badge>
  );
}
