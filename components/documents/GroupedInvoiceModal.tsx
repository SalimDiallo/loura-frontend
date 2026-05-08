"use client";

/**
 * Modal de prévisualisation d'une **facture groupée** de ventes.
 *
 * Diffère de ``DocumentPreviewModal`` parce qu'on n'a pas un objet
 * unique mais un ensemble de filtres ; on appelle directement
 * ``documentsService.getGroupedSaleInvoiceHtml(orgId, filters)``.
 */

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
import {
    AlertTriangle,
    Download,
    Loader2,
    Printer,
    RefreshCcw,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface GroupedInvoiceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orgId: string;
    /**
     * Filtres pour l'agrégation. Compatibles avec ``ListSalesParams``
     * côté ventes (customer, product, from, to, status, payment_status,
     * sale_type, warehouse). Plus ``include_drafts`` pour le récap
     * interne incluant les brouillons.
     */
    filters: Record<string, string | number | boolean | undefined>;
    /** Sous-titre humain pour rappeler les filtres dans le header. */
    subtitle?: string;
}

export function GroupedInvoiceModal({
    open,
    onOpenChange,
    orgId,
    filters,
    subtitle,
}: GroupedInvoiceModalProps) {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const [html, setHtml] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDoc = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await documentsService.getGroupedSaleInvoiceHtml(
                orgId,
                filters
            );
            setHtml(result);
        } catch (e) {
            const message =
                e instanceof Error
                    ? e.message
                    : "Impossible de générer la facture groupée";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [orgId, filters]);

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[100vw] max-h-[92vh] h-[92vh] flex flex-col gap-0 p-0 overflow-hidden sm:max-w-none rounded-none border-0 shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b bg-muted/40">
                    <DialogTitle>Facture groupée</DialogTitle>
                    {subtitle && (
                        <DialogDescription>{subtitle}</DialogDescription>
                    )}
                </DialogHeader>

                <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/70 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="text-sm">
                                    Génération de la facture groupée…
                                </span>
                            </div>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="absolute inset-0 flex items-center justify-center p-6">
                            <div className="max-w-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive flex gap-3">
                                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                                <div className="space-y-2">
                                    <p className="font-medium">
                                        Erreur de génération
                                    </p>
                                    <p className="text-destructive/90">
                                        {error}
                                    </p>
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
                            title="Facture groupée"
                            srcDoc={html}
                            className="w-full h-full border-0 bg-neutral-200 dark:bg-neutral-800"
                            sandbox="allow-same-origin allow-modals allow-popups"
                        />
                    )}
                </div>

                <DialogFooter className="px-6 py-3 border-t bg-background flex-row justify-between gap-2 sm:justify-between">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        Utilisez « Imprimer » puis « Enregistrer au format PDF
                        » pour télécharger.
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
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
