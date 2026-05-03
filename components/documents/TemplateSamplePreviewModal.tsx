"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { documentsService } from "@/lib/services/core";
import type { DocumentTemplate } from "@/lib/types/core";
import { AlertTriangle, Loader2, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface TemplateSamplePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  template: DocumentTemplate | null;
  templateName?: string;
  /** Callback déclenché si l'utilisateur clique « Choisir ce modèle ». */
  onSelect?: (template: DocumentTemplate) => void;
}

const TEMPLATE_LABELS: Record<DocumentTemplate, string> = {
  classic: "Classique",
  modern: "Moderne",
  minimal: "Minimal",
  corporate: "Corporate",
};

/**
 * Modal qui affiche un *devis fictif* rendu avec le modèle de document
 * sélectionné, pour permettre à l'utilisateur de comparer visuellement
 * les modèles disponibles avant de choisir.
 */
export function TemplateSamplePreviewModal({
  open,
  onOpenChange,
  orgId,
  template,
  templateName,
  onSelect,
}: TemplateSamplePreviewModalProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSample = useCallback(async () => {
    if (!template) return;
    setLoading(true);
    setError(null);
    try {
      const result = await documentsService.getSampleHtml(orgId, template);
      setHtml(result);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Impossible de générer la prévisualisation";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orgId, template]);

  useEffect(() => {
    if (open && template) {
      fetchSample();
    } else {
      setHtml(null);
      setError(null);
    }
  }, [open, template, fetchSample]);

  const resolvedName =
    templateName ?? (template ? TEMPLATE_LABELS[template] : "Modèle");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[100vw] max-h-[92vh] h-[92vh] flex flex-col gap-0 p-0 overflow-hidden sm:max-w-none rounded-none border-0 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b bg-muted/40">
          <DialogTitle>Aperçu — {resolvedName}</DialogTitle>
          <DialogDescription>
            Devis fictif rendu avec votre marque et le modèle sélectionné.
            Les chiffres et le client présentés ici sont uniquement
            illustratifs.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Génération de l&apos;aperçu…</span>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="max-w-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive flex gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium">Erreur</p>
                  <p className="text-destructive/90">{error}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchSample}
                    className="gap-1.5"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Réessayer
                  </Button>
                </div>
              </div>
            </div>
          )}

          {html && !error && (
            <iframe
              title={`Aperçu ${resolvedName}`}
              srcDoc={html}
              className="w-full h-full border-0 bg-neutral-200 dark:bg-neutral-800"
              sandbox="allow-same-origin allow-modals allow-popups"
            />
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-background flex-row justify-between gap-2 sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Modèle visualisé : <strong>{resolvedName}</strong>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            {onSelect && template && (
              <Button
                onClick={() => {
                  onSelect(template);
                  onOpenChange(false);
                }}
                disabled={loading || !!error}
              >
                Choisir ce modèle
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
