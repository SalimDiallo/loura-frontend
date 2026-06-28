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
import {
    AlertTriangle,
    Download,
    Loader2,
    Printer,
    RefreshCcw,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ReportPdfModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    subtitle?: string;
    /** Récupère le HTML brandé du rapport (appel réseau authentifié). */
    fetchHtml: () => Promise<string>;
}

/**
 * Modal générique de prévisualisation d'un état financier (HTML brandé), avec
 * impression native → « Enregistrer en PDF ». Découplé du type d'objet : on lui
 * passe simplement un `fetchHtml`. Même UX que `DocumentPreviewModal`.
 */
export function ReportPdfModal({
    open,
    onOpenChange,
    title,
    subtitle,
    fetchHtml,
}: ReportPdfModalProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [html, setHtml] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        setHtml(null);
        try {
            const result = await fetchHtml();
            setHtml(result);
        } catch (e) {
            setError(
                e instanceof Error ? e.message : "Impossible de générer le rapport."
            );
        } finally {
            setLoading(false);
        }
    }, [fetchHtml]);

    // Déclenche le chargement à l'ouverture, hors du corps synchrone de l'effet
    // (évite `react-hooks/set-state-in-effect`) : on défère via microtask et on
    // ignore le résultat si le composant s'est démonté entre-temps.
    useEffect(() => {
        if (!open) return;
        let active = true;
        queueMicrotask(() => {
            if (active) void load();
        });
        return () => {
            active = false;
        };
    }, [open, load]);

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
            toast.error("Impossible de déclencher l'impression. Utilisez Ctrl/Cmd + P.");
        }
    }, []);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[100vw] max-h-[92vh] h-[92vh] flex flex-col gap-0 p-0 overflow-hidden sm:max-w-none rounded-none border-0 shadow-2xl">
                <DialogHeader className="px-6 py-4 border-b bg-muted/40">
                    <DialogTitle>{title}</DialogTitle>
                    {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
                </DialogHeader>

                <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/70 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin" />
                                <span className="text-sm">Génération du rapport…</span>
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
                                        onClick={load}
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
                            title={title}
                            srcDoc={html}
                            className="w-full h-full border-0 bg-neutral-200 dark:bg-neutral-800"
                            sandbox="allow-same-origin allow-modals allow-popups"
                        />
                    )}
                </div>

                <DialogFooter className="px-6 py-3 border-t bg-background flex-row justify-between gap-2 sm:justify-between">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        Utilisez « Imprimer » puis « Enregistrer au format PDF ».
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

/** Petit bouton qui ouvre la modal PDF. À placer dans une barre d'actions. */
export function ReportPdfButton({
    title,
    subtitle,
    fetchHtml,
}: {
    title: string;
    subtitle?: string;
    fetchHtml: () => Promise<string>;
}) {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setOpen(true)}
                className="gap-1.5 h-8 text-xs"
            >
                <Printer className="h-3.5 w-3.5" />
                PDF
            </Button>
            <ReportPdfModal
                open={open}
                onOpenChange={setOpen}
                title={title}
                subtitle={subtitle}
                fetchHtml={fetchHtml}
            />
        </>
    );
}
