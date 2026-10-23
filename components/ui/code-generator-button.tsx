"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Wand2 } from "lucide-react";

/**
 * Petit bouton « Générer » à poser à côté d'un champ code (SKU, code interne,
 * code-barres…). Appelle `onGenerate` qui calcule puis applique la valeur.
 * Se place typiquement dans un conteneur `flex gap-2` avec l'`Input`.
 */
export function CodeGeneratorButton({
  onGenerate,
  title = "Générer automatiquement",
  disabled,
}: {
  onGenerate: () => void;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onGenerate}
            disabled={disabled}
            aria-label={title}
            className="shrink-0"
          >
            <Wand2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
