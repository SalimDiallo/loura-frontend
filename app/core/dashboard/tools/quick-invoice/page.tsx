"use client";

/**
 * Outil "Facture rapide".
 *
 * Permet de composer une facture **ad-hoc** sans créer de produit ni
 * de vente persistante. Drag-and-drop HTML5 natif pour réordonner les
 * lignes. Le rendu final passe par le backend pour récupérer le
 * branding de l'organisation (logo, couleurs, footer).
 *
 * Cycle :
 * 1. Choisir l'organisation émettrice.
 * 2. Saisir les coordonnées du client (texte libre — pas de FK).
 * 3. Ajouter / réordonner / supprimer les lignes via drag-and-drop.
 * 4. Définir une remise globale optionnelle, des notes.
 * 5. Cliquer "Aperçu / PDF" → modal iframe avec HTML rendu, prêt à
 *    imprimer ou enregistrer en PDF via la boîte d'impression du
 *    navigateur.
 */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useOrganizations } from "@/lib/hooks/core";
import {
    documentsService,
    type QuickDiscountType,
    type QuickInvoiceItem,
    type QuickInvoicePayload,
} from "@/lib/services/core";
import {
    AlertTriangle,
    ArrowLeft,
    Eye,
    GripVertical,
    Loader2,
    Plus,
    Printer,
    Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Helpers de calcul (miroir de _compute_line côté backend) ──────────────
// On les redonne ici pour afficher les totaux en temps réel sans aller-retour
// serveur. La source de vérité reste le backend pour le rendu final.

interface LineState extends QuickInvoiceItem {
    id: string; // requis localement pour le drag-and-drop
}

function toNumber(v: string | undefined): number {
    if (!v) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function computeLine(item: LineState) {
    const qty = toNumber(item.quantity);
    const unit = toNumber(item.unit_price);
    const discountType = item.discount_type ?? "none";
    const discountValue = toNumber(item.discount_value);
    const taxRate = toNumber(item.tax_rate);

    const subtotal = qty * unit;
    let discount = 0;
    if (discountType === "percentage") discount = (subtotal * discountValue) / 100;
    else if (discountType === "fixed") discount = discountValue;
    if (discount > subtotal) discount = subtotal;

    const afterDiscount = subtotal - discount;
    const tax = (afterDiscount * taxRate) / 100;
    return {
        subtotal,
        discount,
        afterDiscount,
        tax,
        total: afterDiscount + tax,
    };
}

function newEmptyLine(): LineState {
    return {
        id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        description: "",
        quantity: "1",
        unit_price: "",
        discount_type: "none",
        discount_value: "",
        tax_rate: "0",
    };
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function QuickInvoicePage() {
    const { data: orgsList, isLoading: orgsLoading } = useOrganizations();
    // ``useOrganizations`` retourne un objet paginé ou un tableau direct
    // selon le composant — on normalise. Cast minimal car c'est déjà
    // typé Organization[] au niveau utile (id, name).
    const organizations = useMemo(() => {
        const raw = orgsList as unknown;
        if (Array.isArray(raw)) return raw as { id: string; name: string }[];
        if (raw && typeof raw === "object" && "data" in raw) {
            const data = (raw as { data: unknown }).data;
            if (Array.isArray(data))
                return data as { id: string; name: string }[];
        }
        return [];
    }, [orgsList]);

    const [orgId, setOrgId] = useState<string>("");
    useEffect(() => {
        if (!orgId && organizations.length > 0) setOrgId(organizations[0].id);
    }, [organizations, orgId]);

    // Bloc client
    const [customer, setCustomer] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        tax_id: "",
    });

    // Méta facture
    const today = new Date().toISOString().slice(0, 10);
    const [invoiceMeta, setInvoiceMeta] = useState({
        number: "",
        date: today,
        due_date: "",
        notes: "",
    });

    // Lignes
    const [lines, setLines] = useState<LineState[]>([newEmptyLine()]);

    // Remise globale
    const [globalDiscountType, setGlobalDiscountType] =
        useState<QuickDiscountType>("none");
    const [globalDiscountValue, setGlobalDiscountValue] = useState("");

    // Modal preview
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const iframeRef = useRef<HTMLIFrameElement | null>(null);

    // ── Drag-and-drop natif ──────────────────────────────────────────────
    const dragIndex = useRef<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (idx: number) => (e: React.DragEvent) => {
        dragIndex.current = idx;
        e.dataTransfer.effectAllowed = "move";
        // Astuce Firefox : sans data, le drag ne s'initie pas.
        e.dataTransfer.setData("text/plain", String(idx));
    };
    const handleDragOver = (idx: number) => (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverIndex(idx);
    };
    const handleDragLeave = () => setDragOverIndex(null);
    const handleDrop = (idx: number) => (e: React.DragEvent) => {
        e.preventDefault();
        const from = dragIndex.current;
        dragIndex.current = null;
        setDragOverIndex(null);
        if (from === null || from === idx) return;
        setLines((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(idx, 0, moved);
            return next;
        });
    };

    // ── Édition des lignes ───────────────────────────────────────────────
    const updateLine = (id: string, patch: Partial<LineState>) => {
        setLines((prev) =>
            prev.map((l) => (l.id === id ? { ...l, ...patch } : l))
        );
    };
    const removeLine = (id: string) => {
        setLines((prev) =>
            prev.length === 1 ? prev : prev.filter((l) => l.id !== id)
        );
    };
    const addLine = () => setLines((prev) => [...prev, newEmptyLine()]);

    // ── Totaux temps réel ────────────────────────────────────────────────
    const totals = useMemo(() => {
        let subtotal = 0;
        let totalTax = 0;
        for (const l of lines) {
            const c = computeLine(l);
            subtotal += c.afterDiscount;
            totalTax += c.tax;
        }
        let globalDiscount = 0;
        const gv = toNumber(globalDiscountValue);
        if (globalDiscountType === "percentage") globalDiscount = (subtotal * gv) / 100;
        else if (globalDiscountType === "fixed") globalDiscount = gv;
        if (globalDiscount > subtotal) globalDiscount = subtotal;
        const total = subtotal - globalDiscount + totalTax;
        return { subtotal, globalDiscount, totalTax, total };
    }, [lines, globalDiscountType, globalDiscountValue]);

    // ── Validation avant render ──────────────────────────────────────────
    const validationError = useMemo(() => {
        if (!orgId) return "Choisissez une organisation émettrice.";
        const validLines = lines.filter(
            (l) => l.description.trim() && toNumber(l.quantity) > 0
        );
        if (validLines.length === 0)
            return "Ajoutez au moins une ligne avec une description et une quantité.";
        return null;
    }, [orgId, lines]);

    // ── Génération du PDF ────────────────────────────────────────────────
    const handlePreview = useCallback(async () => {
        if (validationError) {
            toast.error(validationError);
            return;
        }
        const payload: QuickInvoicePayload = {
            customer,
            invoice: invoiceMeta,
            // On nettoie les ``id`` locaux (purement UI).
            items: lines
                .filter((l) => l.description.trim() && toNumber(l.quantity) > 0)
                .map(({ id: _id, ...rest }) => rest),
            discount_type: globalDiscountType,
            discount_value: globalDiscountValue || undefined,
        };
        setPreviewOpen(true);
        setPreviewLoading(true);
        setPreviewError(null);
        setPreviewHtml(null);
        try {
            const html = await documentsService.renderQuickInvoice(orgId, payload);
            setPreviewHtml(html);
        } catch (e) {
            const message =
                e instanceof Error
                    ? e.message
                    : "Impossible de générer la facture.";
            setPreviewError(message);
        } finally {
            setPreviewLoading(false);
        }
    }, [
        validationError,
        customer,
        invoiceMeta,
        lines,
        globalDiscountType,
        globalDiscountValue,
        orgId,
    ]);

    const handlePrint = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe?.contentWindow) {
            toast.error("Aperçu non prêt.");
            return;
        }
        try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        } catch {
            toast.error("Utilisez Ctrl/Cmd + P pour imprimer.");
        }
    }, []);

    // ── Format pour l'affichage des totaux ───────────────────────────────
    const fmt = (n: number) =>
        new Intl.NumberFormat("fr-GN").format(Math.round(n * 100) / 100);

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
            <Button variant="ghost" size="sm" asChild className="mb-2">
                <Link href="/core/dashboard/tools">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retour aux outils
                </Link>
            </Button>

            <header>
                <h1 className="text-2xl font-bold tracking-tight">
                    Facture rapide
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Composez une facture ad-hoc sans créer de produit ni de
                    vente. Glissez-déposez les lignes pour les réordonner.
                </p>
            </header>

            {/* ── Organisation ────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Organisation émettrice
                    </CardTitle>
                    <CardDescription>
                        Le branding (logo, couleurs, mentions) sera repris depuis
                        cette organisation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {orgsLoading ? (
                        <Skeleton className="h-10 w-full" />
                    ) : organizations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Aucune organisation. Créez-en une depuis le
                            dashboard avant d&apos;utiliser cet outil.
                        </p>
                    ) : (
                        <select
                            value={orgId}
                            onChange={(e) => setOrgId(e.target.value)}
                            className="flex h-10 w-full border border-input bg-background px-3 text-sm"
                        >
                            {organizations.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.name}
                                </option>
                            ))}
                        </select>
                    )}
                </CardContent>
            </Card>

            {/* ── Client ──────────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Facturé à</CardTitle>
                    <CardDescription>
                        Saisie libre — aucun lien avec un client enregistré.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="cust-name">
                            Nom / raison sociale *
                        </Label>
                        <Input
                            id="cust-name"
                            value={customer.name}
                            onChange={(e) =>
                                setCustomer({ ...customer, name: e.target.value })
                            }
                            placeholder="Ex : Diallo SARL"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="cust-email">Email</Label>
                        <Input
                            id="cust-email"
                            type="email"
                            value={customer.email}
                            onChange={(e) =>
                                setCustomer({ ...customer, email: e.target.value })
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="cust-phone">Téléphone</Label>
                        <Input
                            id="cust-phone"
                            value={customer.phone}
                            onChange={(e) =>
                                setCustomer({ ...customer, phone: e.target.value })
                            }
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="cust-address">Adresse</Label>
                        <Textarea
                            id="cust-address"
                            rows={2}
                            value={customer.address}
                            onChange={(e) =>
                                setCustomer({
                                    ...customer,
                                    address: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="cust-city">Ville</Label>
                        <Input
                            id="cust-city"
                            value={customer.city}
                            onChange={(e) =>
                                setCustomer({ ...customer, city: e.target.value })
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="cust-country">Pays</Label>
                        <Input
                            id="cust-country"
                            value={customer.country}
                            onChange={(e) =>
                                setCustomer({
                                    ...customer,
                                    country: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <Label htmlFor="cust-tax">ID fiscal / NIF</Label>
                        <Input
                            id="cust-tax"
                            value={customer.tax_id}
                            onChange={(e) =>
                                setCustomer({
                                    ...customer,
                                    tax_id: e.target.value,
                                })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ── Métadonnées facture ─────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        Détails de la facture
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="inv-number">Numéro</Label>
                        <Input
                            id="inv-number"
                            value={invoiceMeta.number}
                            onChange={(e) =>
                                setInvoiceMeta({
                                    ...invoiceMeta,
                                    number: e.target.value,
                                })
                            }
                            placeholder="(automatique)"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="inv-date">Date *</Label>
                        <Input
                            id="inv-date"
                            type="date"
                            value={invoiceMeta.date}
                            onChange={(e) =>
                                setInvoiceMeta({
                                    ...invoiceMeta,
                                    date: e.target.value,
                                })
                            }
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="inv-due">Échéance</Label>
                        <Input
                            id="inv-due"
                            type="date"
                            value={invoiceMeta.due_date}
                            onChange={(e) =>
                                setInvoiceMeta({
                                    ...invoiceMeta,
                                    due_date: e.target.value,
                                })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ── Lignes (drag-and-drop) ──────────────────────────────── */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Articles</CardTitle>
                            <CardDescription>
                                Glissez la poignée à gauche pour réordonner.
                            </CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addLine}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Ajouter
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {lines.map((line, idx) => {
                        const calc = computeLine(line);
                        return (
                            <div
                                key={line.id}
                                draggable
                                onDragStart={handleDragStart(idx)}
                                onDragOver={handleDragOver(idx)}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop(idx)}
                                className={`grid grid-cols-12 gap-2 items-start p-2 border transition-colors ${
                                    dragOverIndex === idx
                                        ? "border-primary bg-primary/5"
                                        : "border-border bg-background hover:border-muted-foreground/30"
                                }`}
                            >
                                <div className="col-span-12 sm:col-span-1 flex sm:items-center justify-start sm:justify-center pt-2 sm:pt-0">
                                    <span
                                        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                                        title="Glisser pour réordonner"
                                    >
                                        <GripVertical className="h-4 w-4" />
                                    </span>
                                </div>
                                <div className="col-span-12 sm:col-span-4 space-y-1">
                                    <Label
                                        htmlFor={`desc-${line.id}`}
                                        className="text-xs sm:hidden"
                                    >
                                        Description
                                    </Label>
                                    <Input
                                        id={`desc-${line.id}`}
                                        value={line.description}
                                        placeholder="Description"
                                        onChange={(e) =>
                                            updateLine(line.id, {
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="col-span-4 sm:col-span-1">
                                    <Label
                                        htmlFor={`qty-${line.id}`}
                                        className="text-xs sm:hidden"
                                    >
                                        Qté
                                    </Label>
                                    <Input
                                        id={`qty-${line.id}`}
                                        inputMode="decimal"
                                        value={line.quantity}
                                        placeholder="Qté"
                                        onChange={(e) =>
                                            updateLine(line.id, {
                                                quantity: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="col-span-8 sm:col-span-2">
                                    <Label
                                        htmlFor={`pu-${line.id}`}
                                        className="text-xs sm:hidden"
                                    >
                                        Prix unitaire
                                    </Label>
                                    <MoneyInput
                                        id={`pu-${line.id}`}
                                        value={line.unit_price}
                                        onChange={(v) =>
                                            updateLine(line.id, { unit_price: v })
                                        }
                                        hideStepButtons
                                        currency=""
                                        placeholder="PU"
                                    />
                                </div>
                                <div className="col-span-6 sm:col-span-2">
                                    <Label
                                        htmlFor={`disc-${line.id}`}
                                        className="text-xs sm:hidden"
                                    >
                                        Remise
                                    </Label>
                                    <div className="flex">
                                        <Input
                                            id={`disc-${line.id}`}
                                            inputMode="decimal"
                                            value={line.discount_value || ""}
                                            placeholder="0"
                                            onChange={(e) =>
                                                updateLine(line.id, {
                                                    discount_value: e.target.value,
                                                    discount_type:
                                                        line.discount_type ===
                                                        "none"
                                                            ? "percentage"
                                                            : line.discount_type,
                                                })
                                            }
                                        />
                                        <select
                                            value={line.discount_type ?? "none"}
                                            onChange={(e) =>
                                                updateLine(line.id, {
                                                    discount_type: e.target
                                                        .value as QuickDiscountType,
                                                })
                                            }
                                            className="border border-l-0 border-input bg-background px-1 text-xs"
                                            aria-label="Type de remise ligne"
                                        >
                                            <option value="none">—</option>
                                            <option value="percentage">%</option>
                                            <option value="fixed">F</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-span-3 sm:col-span-1">
                                    <Label
                                        htmlFor={`tva-${line.id}`}
                                        className="text-xs sm:hidden"
                                    >
                                        TVA %
                                    </Label>
                                    <Input
                                        id={`tva-${line.id}`}
                                        inputMode="decimal"
                                        value={line.tax_rate || ""}
                                        placeholder="0"
                                        onChange={(e) =>
                                            updateLine(line.id, {
                                                tax_rate: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="col-span-9 sm:col-span-1 flex items-center justify-end gap-2">
                                    <span className="text-sm font-semibold tabular-nums">
                                        {fmt(calc.total)}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeLine(line.id)}
                                        disabled={lines.length === 1}
                                        className="text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                                        aria-label="Supprimer la ligne"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* ── Remise globale + notes + totaux ─────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Remise globale & notes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <Label className="text-xs">Type</Label>
                                <select
                                    value={globalDiscountType}
                                    onChange={(e) =>
                                        setGlobalDiscountType(
                                            e.target.value as QuickDiscountType
                                        )
                                    }
                                    className="flex h-10 w-full border border-input bg-background px-3 text-sm"
                                >
                                    <option value="none">Aucune</option>
                                    <option value="percentage">Pourcentage</option>
                                    <option value="fixed">Montant fixe</option>
                                </select>
                            </div>
                            <div>
                                <Label className="text-xs">Valeur</Label>
                                <Input
                                    inputMode="decimal"
                                    value={globalDiscountValue}
                                    onChange={(e) =>
                                        setGlobalDiscountValue(e.target.value)
                                    }
                                    disabled={globalDiscountType === "none"}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="notes" className="text-xs">
                                Notes / mentions
                            </Label>
                            <Textarea
                                id="notes"
                                rows={3}
                                value={invoiceMeta.notes}
                                onChange={(e) =>
                                    setInvoiceMeta({
                                        ...invoiceMeta,
                                        notes: e.target.value,
                                    })
                                }
                                placeholder="Ex : Paiement à 30 jours, conditions de retour…"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Totaux</CardTitle>
                        <CardDescription>
                            Calculés en temps réel à partir de vos lignes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 font-mono text-sm">
                        <Row label="Sous-total HT" value={fmt(totals.subtotal)} />
                        {totals.globalDiscount > 0 && (
                            <Row
                                label="Remise globale"
                                value={`−${fmt(totals.globalDiscount)}`}
                                muted
                            />
                        )}
                        <Row label="TVA" value={fmt(totals.totalTax)} />
                        <div className="h-px bg-border my-2" />
                        <Row
                            label="Total TTC"
                            value={fmt(totals.total)}
                            bold
                        />
                    </CardContent>
                </Card>
            </div>

            {/* ── Action principale ───────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end items-stretch sm:items-center">
                {validationError && (
                    <p className="text-xs text-amber-700 flex items-center gap-1 mr-auto">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {validationError}
                    </p>
                )}
                <Button
                    onClick={handlePreview}
                    disabled={!!validationError || previewLoading}
                    size="lg"
                    className="gap-2"
                >
                    {previewLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                    Aperçu / PDF
                </Button>
            </div>

            {/* ── Modal aperçu ────────────────────────────────────────── */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="w-[100vw] max-h-[92vh] h-[92vh] flex flex-col gap-0 p-0 overflow-hidden sm:max-w-none rounded-none border-0 shadow-2xl">
                    <DialogHeader className="px-6 py-4 border-b bg-muted/40">
                        <DialogTitle>Aperçu de la facture</DialogTitle>
                        <DialogDescription>
                            Utilisez « Imprimer » puis « Enregistrer au format
                            PDF » pour télécharger.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 bg-neutral-200 dark:bg-neutral-800 overflow-hidden relative">
                        {previewLoading && (
                            <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/70 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span className="text-sm">
                                        Génération…
                                    </span>
                                </div>
                            </div>
                        )}
                        {previewError && !previewLoading && (
                            <div className="absolute inset-0 flex items-center justify-center p-6">
                                <div className="max-w-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive flex gap-3">
                                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <div className="space-y-2">
                                        <p className="font-medium">
                                            Erreur de génération
                                        </p>
                                        <p className="text-destructive/90">
                                            {previewError}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {previewHtml && !previewError && (
                            <iframe
                                ref={iframeRef}
                                title="Aperçu facture rapide"
                                srcDoc={previewHtml}
                                className="w-full h-full border-0 bg-neutral-200 dark:bg-neutral-800"
                                sandbox="allow-same-origin allow-modals allow-popups"
                            />
                        )}
                    </div>
                    <DialogFooter className="px-6 py-3 border-t bg-background flex-row justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setPreviewOpen(false)}
                        >
                            Fermer
                        </Button>
                        <Button
                            onClick={handlePrint}
                            disabled={
                                !previewHtml || previewLoading || !!previewError
                            }
                            className="gap-2"
                        >
                            <Printer className="h-4 w-4" />
                            Imprimer / PDF
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function Row({
    label,
    value,
    muted,
    bold,
}: {
    label: string;
    value: string;
    muted?: boolean;
    bold?: boolean;
}) {
    return (
        <div
            className={`flex items-center justify-between ${
                muted ? "text-muted-foreground" : ""
            } ${bold ? "text-base font-bold" : ""}`}
        >
            <span>{label}</span>
            <span className="tabular-nums">{value}</span>
        </div>
    );
}
