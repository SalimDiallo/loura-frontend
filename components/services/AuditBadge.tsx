"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UserMiniInfo } from "@/lib/types";
import { Pencil, UserPlus } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Format lisible d'une date ISO.
 * Renvoie ``null`` si la date est invalide ou manquante.
 */
function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Props {
  /**
   * Type d'événement représenté :
   * - ``"created"`` : création, couplé à ``created_by_info`` + ``created_at``.
   * - ``"updated"`` : dernière modification, couplé à ``updated_by_info`` + ``updated_at``.
   */
  kind: "created" | "updated";
  user: UserMiniInfo | null | undefined;
  at: string | null | undefined;
  /** Fallback si l'info d'audit n'est pas disponible. */
  fallback?: ReactNode;
  /** Classes additionnelles appliquées au texte. */
  className?: string;
  /** Cacher l'icône devant le texte. */
  hideIcon?: boolean;
}

/**
 * Affichage sobre et uniforme d'une trace d'audit ``created_by`` /
 * ``updated_by`` provenant du backend.
 *
 * - Montre le nom réel de l'auteur + date relative formatée.
 * - Au survol : email + date complète + type d'évènement.
 * - S'adapte gracieusement quand l'audit est inconnu (rend ``fallback`` ou rien).
 *
 * Pensé pour être placé en ligne dans un bandeau de détail
 * (``Créé par X • Modifié par Y``).
 */
export function AuditBadge({
  kind,
  user,
  at,
  fallback = null,
  className,
  hideIcon = false,
}: Props) {
  if (!user) return <>{fallback}</>;

  const Icon = kind === "created" ? UserPlus : Pencil;
  const label = kind === "created" ? "Créé par" : "Modifié par";
  const pretty = formatDateTime(at);

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={[
              "inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help",
              className ?? "",
            ].join(" ")}
          >
            {!hideIcon && <Icon className="size-3 shrink-0" aria-hidden />}
            <span className="truncate">
              {label}{" "}
              <span className="font-medium text-foreground">{user.name}</span>
              {pretty ? (
                <span className="text-muted-foreground"> · {pretty}</span>
              ) : null}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="flex flex-col gap-0.5 text-left">
          <span className="font-semibold leading-tight">{user.name}</span>
          {user.email && (
            <span className="text-[11px] opacity-80 leading-tight">
              {user.email}
            </span>
          )}
          {pretty && (
            <span className="text-[11px] opacity-80 leading-tight">
              {label} le {pretty}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Rendu combiné "Créé par … · Modifié par …" à partir d'une entité qui
 * satisfait ``AuditInfo``. Les deux badges ne sont affichés que si la
 * dernière modification n'est pas la création elle-même (même auteur,
 * même timestamp).
 */
export function AuditFootprint({
  created_at,
  updated_at,
  created_by_info,
  updated_by_info,
  className,
}: {
  created_at: string;
  updated_at: string;
  created_by_info: UserMiniInfo | null;
  updated_by_info: UserMiniInfo | null;
  className?: string;
}) {
  const sameEvent =
    created_at === updated_at &&
    (created_by_info?.id ?? null) === (updated_by_info?.id ?? null);

  return (
    <div
      className={[
        "flex flex-wrap items-center gap-x-3 gap-y-1",
        className ?? "",
      ].join(" ")}
    >
      <AuditBadge kind="created" user={created_by_info} at={created_at} />
      {!sameEvent && (
        <AuditBadge kind="updated" user={updated_by_info} at={updated_at} />
      )}
    </div>
  );
}
