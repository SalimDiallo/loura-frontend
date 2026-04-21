import type { Invitation } from "@/lib/types/hr";
import { FaCheck, FaRegClock, FaRegEnvelope, FaTimes } from "react-icons/fa";
import { Badge } from "./ui";

/**
 * Badge status d'invitation, versions FontAwesome
 */
function InvitationStatusBadge({ status }: { status: Invitation["status"] }) {
  const statusConfig = {
    pending: {
      label: "En attente",
      icon: FaRegClock,
      variant: "default" as const,
      className: "bg-blue-600",
    },
    accepted: {
      label: "Acceptée",
      icon: FaCheck,
      variant: "default" as const,
      className: "bg-green-600",
    },
    declined: {
      label: "Refusée",
      icon: FaTimes,
      variant: "destructive" as const,
      className: "",
    },
    expired: {
      label: "Expirée",
      icon: FaRegEnvelope,
      variant: "secondary" as const,
      className: "",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="h-3 w-3 mr-1 inline" />
      {config.label}
    </Badge>
  );
}
