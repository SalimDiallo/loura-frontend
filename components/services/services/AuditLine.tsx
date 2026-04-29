"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UserMiniInfo } from "@/lib/types";
import type { ReactNode } from "react";

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

/**
 * Ligne d'audit compacte : "<verb> par <user> · <date>".
 *
 * - Renvoie ``null`` si aucun user n'est connu (rien à afficher).
 * - Au survol : email complet + date complète.
 */
export function AuditLine({
  verb,
  user,
  at,
  icon,
  className = "",
}: {
  /** Verbe au passé : « Démarré », « Validée par »… */
  verb: string;
  user: UserMiniInfo | null | undefined;
  at?: string | null;
  icon?: ReactNode;
  className?: string;
}) {
  if (!user && !at) return null;
  const pretty = formatDateTime(at);
  const userName = user?.name || "—";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={[
              "inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-help",
              className,
            ].join(" ")}
          >
            {icon}
            <span>
              {verb}{" "}
              {user ? (
                <strong className="text-foreground font-medium">
                  {userName}
                </strong>
              ) : (
                <span className="italic">utilisateur inconnu</span>
              )}
              {pretty && <span> · {pretty}</span>}
            </span>
          </span>
        </TooltipTrigger>
        <TooltipContent className="flex flex-col gap-0.5 text-left">
          {user && (
            <>
              <span className="font-semibold leading-tight">{userName}</span>
              {user.email && (
                <span className="text-[11px] opacity-80 leading-tight">
                  {user.email}
                </span>
              )}
            </>
          )}
          {pretty && (
            <span className="text-[11px] opacity-80 leading-tight">
              {verb} le {pretty}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
