"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
import { GenerateDocumentButton, GroupedInvoiceModal } from "@/components/documents";
import {
    ListPageLayout,
    ListPagination,
    ListSearchFilters,
    ListStat,
    ListTable,
    ListTableColumn,
} from "@/components/layout/ListPageLayout";
import { Can, useOrgPermissions } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import { useCustomers } from "@/lib/hooks/hr";
import {
    usePaginatedSales,
    useProducts,
    useSalesSummary,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    Customer,
    Product,
    SaleOrdering,
    SalePaymentStatus,
    SaleStatus,
    SaleType,
    Warehouse,
} from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaCreditCard,
    FaEye,
    FaFileInvoiceDollar,
    FaMoneyBillWave,
    FaPlus,
    FaReceipt,
    FaTimes,
} from "react-icons/fa";

interface SalesPageProps {
    creditOnly?: boolean;
}

// ─── Presets de période ───────────────────────────────────────────────────
type PeriodPreset =
    | ""
    | "today"
    | "7d"
    | "30d"
    | "this_month"
    | "last_month"
    | "this_quarter"
    | "this_year"
    | "custom";

const PERIOD_LABELS: Record<Exclude<PeriodPreset, "">, string> = {
    today: "Aujourd'hui",
    "7d": "7 jours",
    "30d": "30 jours",
    this_month: "Ce mois-ci",
    last_month: "Mois dernier",
    this_quarter: "Ce trimestre",
    this_year: "Cette année",
    custom: "Personnalisée",
};

function toISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function rangeForPreset(
    preset: PeriodPreset
): { from?: string; to?: string } {
    if (!preset || preset === "custom") return {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (preset) {
        case "today":
            return { from: toISO(today), to: toISO(today) };
        case "7d": {
            const from = new Date(today);
            from.setDate(from.getDate() - 6);
            return { from: toISO(from), to: toISO(today) };
        }
        case "30d": {
            const from = new Date(today);
            from.setDate(from.getDate() - 29);
            return { from: toISO(from), to: toISO(today) };
        }
        case "this_month": {
            const from = new Date(today.getFullYear(), today.getMonth(), 1);
            return { from: toISO(from), to: toISO(today) };
        }
        case "last_month": {
            const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const to = new Date(today.getFullYear(), today.getMonth(), 0);
            return { from: toISO(from), to: toISO(to) };
        }
        case "this_quarter": {
            const q = Math.floor(today.getMonth() / 3);
            const from = new Date(today.getFullYear(), q * 3, 1);
            return { from: toISO(from), to: toISO(today) };
        }
        case "this_year": {
            const from = new Date(today.getFullYear(), 0, 1);
            return { from: toISO(from), to: toISO(today) };
        }
        default:
            return {};
    }
}

const ORDERING_LABELS: Record<SaleOrdering, string> = {
    "-sale_date": "Date (récent)",
    sale_date: "Date (ancien)",
    "-total": "Total (élevé)",
    total: "Total (faible)",
    "-outstanding_amount": "Restant dû (élevé)",
    outstanding_amount: "Restant dû (faible)",
    "-created_at": "Création (récent)",
    created_at: "Création (ancien)",
};

export function SalesPage({ creditOnly = false }: SalesPageProps = {}) {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.SALES.MANAGE);
    const { formatCurrency } = useCurrencyFormatter();

    const [search, setSearch] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);

    // Filtres
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [paymentFilter, setPaymentFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [customerFilter, setCustomerFilter] = useState<string>("");
    const [warehouseFilter, setWarehouseFilter] = useState<string>("");
    const [productFilter, setProductFilter] = useState<string>("");
    const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("");
    const [customFrom, setCustomFrom] = useState<string>("");
    const [customTo, setCustomTo] = useState<string>("");
    const [minTotal, setMinTotal] = useState<string>("");
    const [maxTotal, setMaxTotal] = useState<string>("");
    const [ordering, setOrdering] = useState<SaleOrdering>("-sale_date");
    const [groupedInvoiceOpen, setGroupedInvoiceOpen] = useState(false);

    const { data: customersList = [] } = useCustomers(orgId, {
        page_size: "all",
        is_active: "true",
    });
    const customers = (customersList as unknown as Customer[]) ?? [];

    const { data: warehousesList = [] } = useWarehouses(orgId, {
        page_size: "all",
        is_active: true,
    });
    const warehouses = (warehousesList as unknown as Warehouse[]) ?? [];

    // Produits actifs uniquement, pour filtrer les ventes par produit.
    const { data: productsList = [] } = useProducts(orgId, {
        page_size: "all",
        is_active: true,
    });
    const products = (productsList as unknown as Product[]) ?? [];

    // Période effective : preset ou personnalisée
    const period = useMemo(() => {
        if (periodPreset === "custom") {
            return {
                from: customFrom || undefined,
                to: customTo || undefined,
            };
        }
        return rangeForPreset(periodPreset);
    }, [periodPreset, customFrom, customTo]);

    const effectiveTypeFilter: SaleType | undefined = creditOnly
        ? "credit"
        : (typeFilter as SaleType) || undefined;

    const stableFilters = useMemo(
        () => ({
            search: search || undefined,
            status: (statusFilter as SaleStatus) || undefined,
            payment_status: (paymentFilter as SalePaymentStatus) || undefined,
            customer: customerFilter || undefined,
            warehouse: warehouseFilter || undefined,
            product: productFilter || undefined,
            sale_type: effectiveTypeFilter,
            from: period.from,
            to: period.to,
            min_total: minTotal || undefined,
            max_total: maxTotal || undefined,
            ordering,
        }),
        [
            search,
            statusFilter,
            paymentFilter,
            customerFilter,
            warehouseFilter,
            productFilter,
            effectiveTypeFilter,
            period.from,
            period.to,
            minTotal,
            maxTotal,
            ordering,
        ]
    );

    const {
        data: sales,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedSales(orgId, stableFilters, { pageSize: 15 });

    // Agrégats CA / payé / dû — partagent EXACTEMENT les mêmes filtres
    // que la liste pour rester cohérents. Le backend exclut par défaut
    // les brouillons / annulées du calcul (CA réalisé uniquement).
    const { data: summary, isLoading: summaryLoading } = useSalesSummary(
        orgId,
        stableFilters
    );

    const customerName = (id: string) =>
        customers.find((c) => c.id === id)?.name ?? id;
    const warehouseName = (id: string) =>
        warehouses.find((w) => w.id === id)?.name ?? id;
    const productName = (id: string) =>
        products.find((p) => p.id === id)?.name ?? id;

    const activeFilterChips = useMemo(() => {
        const chips: { key: string; label: string; clear: () => void }[] = [];
        if (statusFilter)
            chips.push({
                key: "status",
                label: `Statut : ${statusFilter}`,
                clear: () => setStatusFilter(""),
            });
        if (paymentFilter)
            chips.push({
                key: "payment",
                label: `Paiement : ${paymentFilter}`,
                clear: () => setPaymentFilter(""),
            });
        if (!creditOnly && typeFilter)
            chips.push({
                key: "type",
                label: `Type : ${typeFilter === "credit" ? "Crédit" : "Comptant"}`,
                clear: () => setTypeFilter(""),
            });
        if (customerFilter)
            chips.push({
                key: "customer",
                label: `Client : ${customerName(customerFilter)}`,
                clear: () => setCustomerFilter(""),
            });
        if (warehouseFilter)
            chips.push({
                key: "warehouse",
                label: `Entrepôt : ${warehouseName(warehouseFilter)}`,
                clear: () => setWarehouseFilter(""),
            });
        if (productFilter)
            chips.push({
                key: "product",
                label: `Produit : ${productName(productFilter)}`,
                clear: () => setProductFilter(""),
            });
        if (periodPreset && periodPreset !== "custom")
            chips.push({
                key: "period",
                label: `Période : ${PERIOD_LABELS[periodPreset]}`,
                clear: () => setPeriodPreset(""),
            });
        if (periodPreset === "custom" && (customFrom || customTo))
            chips.push({
                key: "period",
                label: `Période : ${customFrom || "…"} → ${customTo || "…"}`,
                clear: () => {
                    setPeriodPreset("");
                    setCustomFrom("");
                    setCustomTo("");
                },
            });
        if (minTotal)
            chips.push({
                key: "min",
                label: `Total ≥ ${formatCurrency(Number(minTotal))}`,
                clear: () => setMinTotal(""),
            });
        if (maxTotal)
            chips.push({
                key: "max",
                label: `Total ≤ ${formatCurrency(Number(maxTotal))}`,
                clear: () => setMaxTotal(""),
            });
        if (ordering !== "-sale_date")
            chips.push({
                key: "ordering",
                label: `Tri : ${ORDERING_LABELS[ordering]}`,
                clear: () => setOrdering("-sale_date"),
            });
        return chips;
    }, [
        statusFilter,
        paymentFilter,
        typeFilter,
        customerFilter,
        warehouseFilter,
        productFilter,
        periodPreset,
        customFrom,
        customTo,
        minTotal,
        maxTotal,
        ordering,
        creditOnly,
        customers,
        warehouses,
        products,
        formatCurrency,
    ]);

    const filtersActive = activeFilterChips.length > 0;

    const resetAll = () => {
        setSearch("");
        setStatusFilter("");
        setPaymentFilter("");
        setTypeFilter("");
        setCustomerFilter("");
        setWarehouseFilter("");
        setProductFilter("");
        setPeriodPreset("");
        setCustomFrom("");
        setCustomTo("");
        setMinTotal("");
        setMaxTotal("");
        setOrdering("-sale_date");
    };

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">Erreur : {error.message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Sous-titre humain décrivant les filtres actifs ; sert de rappel
    // dans l'en-tête du modal "Facture groupée".
    const groupedInvoiceSubtitle = useMemo(() => {
        const parts: string[] = [];
        if (customerFilter)
            parts.push(`Client : ${customerName(customerFilter)}`);
        if (productFilter)
            parts.push(`Produit : ${productName(productFilter)}`);
        if (period.from && period.to)
            parts.push(`Du ${period.from} au ${period.to}`);
        else if (period.from) parts.push(`À partir du ${period.from}`);
        else if (period.to) parts.push(`Jusqu'au ${period.to}`);
        return parts.length > 0
            ? parts.join(" · ")
            : "Toutes les ventes finalisées";
    }, [customerFilter, productFilter, period.from, period.to, customers, products]);
    // ``customers``/``products`` ajoutés en deps car ``customerName``/``productName``
    // les capturent (dépendances dynamiques pour resolver les labels).

    // Filtres injectés dans la facture groupée : on **ne propage pas**
    // ``status`` ni ``payment_status`` ; le backend exclut déjà les
    // brouillons et le récap a vocation à inclure toutes les ventes
    // finalisées sur la période/client/produit. Si l'utilisateur veut
    // restreindre par statut, on peut passer ``status: statusFilter``
    // mais il faut être conscient qu'un filtre ``draft`` côté liste
    // ne correspond à aucune vente ici (déjà exclues côté backend).
    const groupedInvoiceFilters = useMemo(
        () => ({
            customer: customerFilter || undefined,
            product: productFilter || undefined,
            warehouse: warehouseFilter || undefined,
            from: period.from,
            to: period.to,
            sale_type: effectiveTypeFilter,
            payment_status:
                (paymentFilter as SalePaymentStatus) || undefined,
        }),
        [
            customerFilter,
            productFilter,
            warehouseFilter,
            period.from,
            period.to,
            effectiveTypeFilter,
            paymentFilter,
        ]
    );

    const headerActionsList = useMemo(() => {
        if (!canManage) return [];
        return [
            {
                label: "Facture groupée",
                icon: FaFileInvoiceDollar,
                variant: "outline" as const,
                onClick: () => setGroupedInvoiceOpen(true),
                // Désactive si aucune vente n'a été chargée (évite un PDF vide).
                disabled: !sales || sales.length === 0,
            },
            {
                label: "Nouvelle vente",
                icon: FaPlus,
                onClick: () =>
                    router.push(
                        `/organisation/${orgId}/inventory/sales/create${creditOnly ? "?mode=credit" : ""}`
                    ),
            },
        ];
    }, [canManage, sales, router, orgId, creditOnly]);

    return (
        <>
        <ListPageLayout
            title={creditOnly ? "Créances clients" : "Ventes"}
            icon={creditOnly ? FaCreditCard : FaReceipt}
            description={
                creditOnly
                    ? "Ventes à crédit et encours clients"
                    : "Ventes au comptant et à crédit"
            }
            headerActions={headerActionsList}
            stats={[
                <ListStat
                    key="count"
                    label={creditOnly ? "Créances" : "Ventes"}
                    value={meta.totalItems}
                    icon={<FaReceipt className="h-4 w-4 text-muted-foreground" />}
                />,
                <ListStat
                    key="revenue"
                    label="CA total"
                    value={
                        summaryLoading ? (
                            <Skeleton className="h-7 w-28" />
                        ) : (
                            <span title="Chiffre d'affaires des ventes finalisées correspondant aux filtres">
                                {formatCurrency(
                                    Number(summary?.total ?? 0)
                                )}
                            </span>
                        )
                    }
                    icon={
                        <FaMoneyBillWave className="h-4 w-4 text-emerald-600" />
                    }
                />,
                <ListStat
                    key="outstanding"
                    label="Reste dû"
                    value={
                        summaryLoading ? (
                            <Skeleton className="h-7 w-28" />
                        ) : (
                            <span
                                className={
                                    Number(summary?.outstanding ?? 0) > 0
                                        ? "text-amber-600"
                                        : ""
                                }
                                title="Total non encore encaissé sur les ventes filtrées"
                            >
                                {formatCurrency(
                                    Number(summary?.outstanding ?? 0)
                                )}
                            </span>
                        )
                    }
                    icon={
                        <FaCreditCard className="h-4 w-4 text-muted-foreground" />
                    }
                />,
            ]}
            searchFilters={
                <div className="space-y-3">
                    <ListSearchFilters
                        searchValue={search}
                        onSearchChange={setSearch}
                        searchPlaceholder="N° de vente, client, notes..."
                        filtersOpen={filterOpen}
                        onFiltersOpenChange={setFilterOpen}
                        filtersAreActive={filtersActive}
                        filters={
                            <div className="space-y-2 mt-2">
                                {/* Période — presets */}
                                <div>
                                    <Label className="text-xs font-medium mb-1 block">
                                        Période
                                    </Label>
                                    <div className="flex flex-wrap gap-1">
                                        {(
                                            [
                                                "today",
                                                "7d",
                                                "30d",
                                                "this_month",
                                                "last_month",
                                                "this_quarter",
                                                "this_year",
                                                "custom",
                                            ] as Exclude<PeriodPreset, "">[]
                                        ).map((p) => {
                                            const active = periodPreset === p;
                                            return (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() =>
                                                        setPeriodPreset(
                                                            active ? "" : p
                                                        )
                                                    }
                                                    className={`text-[10px] px-1.5 py-0.5 border transition-colors ${
                                                        active
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-background hover:bg-muted border-border"
                                                    }`}
                                                    style={{ borderRadius: 0 }}
                                                >
                                                    {PERIOD_LABELS[p]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {periodPreset === "custom" && (
                                        <div className="grid grid-cols-2 gap-1 mt-2">
                                            <div>
                                                <Label
                                                    htmlFor="custom_from"
                                                    className="text-[11px] text-muted-foreground"
                                                >
                                                    Du
                                                </Label>
                                                <Input
                                                    id="custom_from"
                                                    type="date"
                                                    value={customFrom}
                                                    onChange={(e) =>
                                                        setCustomFrom(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="text-xs px-2 py-1 border"
                                                    style={{ borderRadius: 0 }}
                                                />
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor="custom_to"
                                                    className="text-[11px] text-muted-foreground"
                                                >
                                                    Au
                                                </Label>
                                                <Input
                                                    id="custom_to"
                                                    type="date"
                                                    value={customTo}
                                                    onChange={(e) =>
                                                        setCustomTo(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="text-xs px-2 py-1 border"
                                                    style={{ borderRadius: 0 }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Type / Statut / Paiement */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {!creditOnly && (
                                        <div>
                                            <Label className="text-xs font-medium mb-1 block">
                                                Type
                                            </Label>
                                            <select
                                                value={typeFilter}
                                                onChange={(e) =>
                                                    setTypeFilter(
                                                        e.target.value
                                                    )
                                                }
                                                className="flex h-8 w-full border border-input bg-background px-2 text-xs"
                                                style={{ borderRadius: 0 }}
                                            >
                                                <option value="">Tous</option>
                                                <option value="cash">
                                                    Comptant
                                                </option>
                                                <option value="credit">
                                                    Crédit
                                                </option>
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <Label className="text-xs font-medium mb-1 block">
                                            Statut
                                        </Label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) =>
                                                setStatusFilter(e.target.value)
                                            }
                                            className="flex h-8 w-full border border-input bg-background px-2 text-xs"
                                            style={{ borderRadius: 0 }}
                                        >
                                            <option value="">Tous</option>
                                            <option value="draft">
                                                Brouillon
                                            </option>
                                            <option value="completed">
                                                Finalisée
                                            </option>
                                            <option value="cancelled">
                                                Annulée
                                            </option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-medium mb-1 block">
                                            Paiement
                                        </Label>
                                        <select
                                            value={paymentFilter}
                                            onChange={(e) =>
                                                setPaymentFilter(e.target.value)
                                            }
                                            className="flex h-8 w-full border border-input bg-background px-2 text-xs"
                                            style={{ borderRadius: 0 }}
                                        >
                                            <option value="">Tous</option>
                                            <option value="unpaid">
                                                Non payée
                                            </option>
                                            <option value="partial">
                                                Partielle
                                            </option>
                                            <option value="paid">Payée</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Client / Entrepôt */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <Label className="text-xs font-medium mb-1 block">
                                            Client
                                        </Label>
                                        <select
                                            value={customerFilter}
                                            onChange={(e) =>
                                                setCustomerFilter(
                                                    e.target.value
                                                )
                                            }
                                            className="flex h-8 w-full border border-input bg-background px-2 text-xs"
                                            style={{ borderRadius: 0 }}
                                        >
                                            <option value="">Tous</option>
                                            {customers.map((c) => (
                                                <option
                                                    key={c.id}
                                                    value={c.id}
                                                >
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label className="text-xs font-medium mb-1 block">
                                            Entrepôt
                                        </Label>
                                        <select
                                            value={warehouseFilter}
                                            onChange={(e) =>
                                                setWarehouseFilter(
                                                    e.target.value
                                                )
                                            }
                                            className="flex h-8 w-full border border-input bg-background px-2 text-xs"
                                            style={{ borderRadius: 0 }}
                                        >
                                            <option value="">Tous</option>
                                            {warehouses.map((w) => (
                                                <option
                                                    key={w.id}
                                                    value={w.id}
                                                >
                                                    {w.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Produit — filtre les ventes contenant
                                    au moins une ligne avec ce produit. */}
                                <div>
                                    <Label className="text-xs font-medium mb-1 block">
                                        Produit
                                    </Label>
                                    <select
                                        value={productFilter}
                                        onChange={(e) =>
                                            setProductFilter(e.target.value)
                                        }
                                        className="flex h-8 w-full border border-input bg-background px-2 text-xs"
                                        style={{ borderRadius: 0 }}
                                    >
                                        <option value="">Tous les produits</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                                {p.sku ? ` (${p.sku})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Montants */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <Label
                                            htmlFor="min_total"
                                            className="text-xs font-medium mb-1 block"
                                        >
                                            Total min.
                                        </Label>
                                        <Input
                                            id="min_total"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0"
                                            value={minTotal}
                                            onChange={(e) =>
                                                setMinTotal(e.target.value)
                                            }
                                            className="text-xs px-2 py-1 border"
                                            style={{ borderRadius: 0 }}
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="max_total"
                                            className="text-xs font-medium mb-1 block"
                                        >
                                            Total max.
                                        </Label>
                                        <Input
                                            id="max_total"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="—"
                                            value={maxTotal}
                                            onChange={(e) =>
                                                setMaxTotal(e.target.value)
                                            }
                                            className="text-xs px-2 py-1 border"
                                            style={{ borderRadius: 0 }}
                                        />
                                    </div>
                                </div>

                                {/* Tri */}
                                <div>
                                    <Label className="text-xs font-medium mb-1 block">
                                        Tri
                                    </Label>
                                    <select
                                        value={ordering}
                                        onChange={(e) =>
                                            setOrdering(
                                                e.target.value as SaleOrdering
                                            )
                                        }
                                        className="flex h-8 w-full border border-input bg-background px-2 text-xs"
                                        style={{ borderRadius: 0 }}
                                    >
                                        {(
                                            Object.keys(
                                                ORDERING_LABELS
                                            ) as SaleOrdering[]
                                        ).map((o) => (
                                            <option key={o} value={o}>
                                                {ORDERING_LABELS[o]}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Reset */}
                                {filtersActive && (
                                    <div className="pt-1 border-t">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={resetAll}
                                            className="w-full gap-2"
                                            style={{ borderRadius: 0, fontSize: 12, paddingTop: 4, paddingBottom: 4 }}
                                        >
                                            <FaTimes className="h-3 w-3" />
                                            Réinitialiser tous les filtres
                                        </Button>
                                    </div>
                                )}
                            </div>
                   
                        }
                    />

                    {/* Chips de filtres actifs */}
                    {activeFilterChips.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {activeFilterChips.map((c) => (
                                <Badge
                                    key={c.key}
                                    variant="secondary"
                                    className="gap-1.5 pr-1"
                                >
                                    <span>{c.label}</span>
                                    <button
                                        type="button"
                                        onClick={c.clear}
                                        className="hover:bg-muted-foreground/10 rounded-full p-0.5"
                                        aria-label="Retirer ce filtre"
                                    >
                                        <FaTimes className="h-2.5 w-2.5" />
                                    </button>
                                </Badge>
                            ))}
                            <button
                                type="button"
                                onClick={resetAll}
                                className="text-xs text-muted-foreground hover:text-foreground underline"
                            >
                                tout effacer
                            </button>
                        </div>
                    )}
                </div>
            }
            content={
                <>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-14 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : sales.length === 0 ? (
                        <div className="text-center py-16 bg-muted/20 rounded-lg">
                            <FaReceipt className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                            <p className="text-lg font-medium">
                                Aucune {creditOnly ? "créance" : "vente"}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 mb-6">
                                {filtersActive
                                    ? "Aucun résultat avec ces filtres. Essayez d'élargir la recherche."
                                    : "Enregistrez votre première vente pour démarrer."}
                            </p>
                            {filtersActive ? (
                                <Button
                                    variant="outline"
                                    onClick={resetAll}
                                    className="gap-2"
                                >
                                    <FaTimes className="h-3 w-3" />
                                    Réinitialiser les filtres
                                </Button>
                            ) : (
                                <Can permission={PERMISSIONS.SALES.MANAGE}>
                                    <Button
                                        onClick={() =>
                                            router.push(
                                                `/organisation/${orgId}/inventory/sales/create`
                                            )
                                        }
                                    >
                                        <FaPlus className="mr-2" />
                                        Nouvelle vente
                                    </Button>
                                </Can>
                            )}
                        </div>
                    ) : (
                        <>
                            <ListTable
                                columns={[
                                    <ListTableColumn key="number" header="N°">
                                        {({ value: s }) => (
                                            <div>
                                                <div className="font-mono text-sm font-semibold">
                                                    {s.sale_number}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(s.sale_date).toLocaleDateString(
                                                        "fr-FR"
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="customer" header="Client">
                                        {({ value: s }) => (
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {s.customer?.name ?? (
                                                        <span className="italic text-muted-foreground">
                                                            Comptoir
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    {s.sale_type === "credit" ? (
                                                        <>
                                                            <FaCreditCard className="h-2.5 w-2.5" />
                                                            Crédit
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaMoneyBillWave className="h-2.5 w-2.5" />
                                                            Comptant
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="status" header="Statut">
                                        {({ value: s }) => {
                                            const st = s.status as SaleStatus;
                                            return (
                                                <BadgeStatus
                                                  status={st} />
                                            );
                                        }}
                                    </ListTableColumn>,
                                    <ListTableColumn key="payment" header="Paiement">
                                        {({ value: s }) => {
                                            const st = s.payment_status as SalePaymentStatus;
                                            return (
                                                <BadgeStatus status={st} />
                                            );
                                        }}
                                    </ListTableColumn>,
                                    <ListTableColumn key="total" header="Total" align="right">
                                        {({ value: s }) => (
                                            <div className="text-right">
                                                <div className="text-sm font-semibold">
                                                    {formatCurrency(Number(s.total))}
                                                </div>
                                                {Number(s.discount_amount) > 0 && (
                                                    <div className="text-xs text-emerald-600">
                                                        -{formatCurrency(Number(s.discount_amount))}
                                                    </div>
                                                )}
                                                {Number(s.outstanding_amount) > 0 && (
                                                    <div className="text-xs text-red-600">
                                                        Reste{" "}
                                                        {formatCurrency(
                                                            Number(s.outstanding_amount)
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="actions"
                                        header="Actions"
                                        align="right"
                                    >
                                        {({ value: s }) => (
                                            <div className="flex items-center justify-end gap-1">
                                                <GenerateDocumentButton
                                                    orgId={orgId}
                                                    docType="sale_invoice"
                                                    objectId={s.id}
                                                    modalTitle={`Facture · ${s.sale_number}`}
                                                    modalSubtitle={s.customer?.name ?? "Comptoir"}
                                                    variant="ghost"
                                                    size="sm"
                                                    hideIcon
                                                    aria-label="Imprimer la facture"
                                                >
                                                    <FaReceipt className="h-3.5 w-3.5" />
                                                </GenerateDocumentButton>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.push(
                                                            `/organisation/${orgId}/inventory/sales/${s.id}`
                                                        )
                                                    }
                                                >
                                                    <FaEye className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                ]}
                                data={sales}
                            />
                            <div className="mt-4">
                                <ListPagination
                                    meta={meta}
                                    onPageChange={setPage}
                                    onNext={nextPage}
                                    onPrev={prevPage}
                                />
                            </div>
                        </>
                    )}
                </>
            }
        />
        <GroupedInvoiceModal
            open={groupedInvoiceOpen}
            onOpenChange={setGroupedInvoiceOpen}
            orgId={orgId}
            filters={groupedInvoiceFilters}
            subtitle={groupedInvoiceSubtitle}
        />
        </>
    );
}
