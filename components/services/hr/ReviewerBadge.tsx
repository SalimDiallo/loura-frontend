"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ReviewerInfo } from "@/lib/types";
import { Crown, UserRound } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  reviewer: ReviewerInfo | null | undefined;
  /** Fallback affiché si le reviewer n'est pas défini. */
  fallback?: ReactNode;
  /** Classes additionnelles pour le texte. */
  className?: string;
  /** Si ``true``, affiche une icône devant le nom (couronne pour propriétaire). */
  showIcon?: boolean;
}

/**
 * Affichage sobre de l'identité du reviewer / approbateur d'une demande.
 *
 * - Montre toujours le **nom réel** de la personne (membre OU propriétaire).
 * - Au survol : détails (email, rôle, mention "Propriétaire" le cas échéant).
 *
 * Pensé pour être placé en ligne dans une phrase :
 * ``Approuvée par <ReviewerBadge reviewer={x} />``.
 */
export function ReviewerBadge({
  reviewer,
  fallback = null,
  className,
  showIcon = false,
}: Props) {
  if (!reviewer) return <>{fallback}</>;

  const Icon = reviewer.is_owner ? Crown : UserRound;
  const secondaryLabel = reviewer.is_owner
    ? "Propriétaire de l'organisation"
    : reviewer.role || "Membre";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={[
              "inline-flex items-center gap-1 font-medium text-foreground underline decoration-dotted decoration-muted-foreground/60 underline-offset-2 cursor-help",
              className ?? "",
            ].join(" ")}
          >
            {showIcon && <Icon className="size-3.5 shrink-0" aria-hidden />}
            {reviewer.name}
          </span>
        </TooltipTrigger>
        <TooltipContent className="flex flex-col gap-0.5 text-left">
          <span className="font-semibold leading-tight">{reviewer.name}</span>
          <span className="text-[11px] opacity-80 leading-tight">
            {secondaryLabel}
          </span>
          {reviewer.email && (
            <span className="text-[11px] opacity-80 leading-tight">
              {reviewer.email}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
