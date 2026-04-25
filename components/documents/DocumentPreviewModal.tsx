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
import { documentsService, type DocumentType } from "@/lib/services/core";
import {
    AlertTriangle,
    Download,
    Loader2,
    Printer,
    RefreshCcw,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// 
// La consigne demande que la sidebar prenne un grand espace. 
// Cela n'affecte PAS ce composant directement, mais bien le composant Sidebar dans @components/ui/sidebar.tsx.
// Aucun changement spécifique ici, car aucun élément "Sidebar" n'est utilisé ou stylé ici.
// Pour référence, ajustez la largeur de la sidebar à un espace plus grand dans components/ui/sidebar.tsx (voir style ou variable --sidebar-width).
// 

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  // HR
  contract: "Contrat",
  payment: "Reçu de paiement",
  advance: "Demande d'avance",
  // Inventory
  sale_invoice: "Facture de vente",
  sale_payment_receipt: "Reçu de paiement",
  purchase_order: "Bon de commande",
  purchase_payment_receipt: "Reçu de paiement fournisseur",
  physical_inventory: "Rapport d'inventaire physique",
  quote: "Devis",
  proforma: "Facture pro forma",
};

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  docType: DocumentType;
  objectId: string;
  title?: string;
  subtitle?: string;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  orgId,
  docType,
  objectId,
  title,
  subtitle,
}: DocumentPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDoc = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await documentsService.getHtml(orgId, docType, objectId);
      setHtml(result);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Impossible de générer le document";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orgId, docType, objectId]);

  useEffect(() => {
    if (open) {
      fetchDoc();
    } else {
      setHtml(null);
      setError(null);
    }
  }, [open, fetchDoc]);

  const handlePrint = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) {
      toast.error("La prévisualisation n'est pas encore prête.");
      return;
    }
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch {
      toast.error(
        "Impossible de déclencher l'impression. Utilisez Ctrl/Cmd + P."
      );
    }
  }, []);

  const resolvedTitle = title || DOC_TYPE_LABELS[docType] || "Document";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[100vw] max-h-[92vh] h-[92vh] flex flex-col gap-0 p-0 overflow-hidden sm:max-w-none rounded-none border-0 shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b bg-muted/40">
          <DialogTitle className="flex items-center gap-2">
            {resolvedTitle}
          </DialogTitle>
          {subtitle && (
            <DialogDescription>{subtitle}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm">Génération du document…</span>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="max-w-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive flex gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-medium">Erreur de génération</p>
                  <p className="text-destructive/90">{error}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchDoc}
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
              ref={iframeRef}
              title={resolvedTitle}
              srcDoc={html}
              className="w-full h-full border-0 bg-neutral-200 dark:bg-neutral-800"
              sandbox="allow-same-origin allow-modals allow-popups"
            />
          )}
        </div>

        <DialogFooter className="px-6 py-3 border-t bg-background flex-row justify-between gap-2 sm:justify-between">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Download className="h-3 w-3" />
            Utilisez « Imprimer » puis « Enregistrer au format PDF » pour
            télécharger.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <Button
              onClick={handlePrint}
              disabled={!html || loading || !!error}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimer / PDF
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
