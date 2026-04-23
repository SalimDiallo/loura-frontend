"use client";

import { GenerateDocumentButton } from "@/components/documents";
import { Can, PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { AuditFootprint } from "@/components/services/AuditBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
    useCancelPhysicalInventory,
    useCompletePhysicalInventory,
    useDeletePhysicalInventory,
    usePhysicalInventory,
    usePopulatePhysicalInventory,
    useUpdatePhysicalInventory,
    useUpdatePhysicalInventoryItems,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { PhysicalInventoryItem } from "@/lib/types";
import {
    CheckCircle2,
    ClipboardCheck,
    Loader2,
    RefreshCw,
    Save,
    Trash2,
    XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaReceipt } from "react-icons/fa";
import { toast } from "sonner";

export default function PhysicalInventoryDetailPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.STOCK.VIEW}>
            <PhysicalInventoryDetailPage />
        </PermissionGuard>
    );
}

function PhysicalInventoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const inventoryId = params.physicalInventoryId as string;
    const { formatCurrency } = useCurrencyFormatter();
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.STOCK.MANAGE);

    const { data: inventory, isLoading, error } = usePhysicalInventory(
        orgId,
        inventoryId
    );

    // State local pour la saisie
    const [counts, setCounts] = useState<Record<string, string>>({});
    const [notesMap, setNotesMap] = useState<Record<string, string>>({});
    const [headerNotes, setHeaderNotes] = useState<string>("");
    const [showOnlyDiff, setShowOnlyDiff] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!inventory) return;
        const nextCounts: Record<string, string> = {};
        const nextNotes: Record<string, string> = {};
        inventory.items.forEach((it) => {
            nextCounts[it.id] =
                it.counted_quantity != null ? String(it.counted_quantity) : "";
            nextNotes[it.id] = it.notes ?? "";
        });
        setCounts(nextCounts);
        setNotesMap(nextNotes);
        setHeaderNotes(inventory.notes ?? "");
    }, [inventory?.id, inventory?.updated_at]);

    const populateMutation = usePopulatePhysicalInventory();
    const updateItemsMutation = useUpdatePhysicalInventoryItems();
    const updateMutation = useUpdatePhysicalInventory();
    const completeMutation = useCompletePhysicalInventory();
    const cancelMutation = useCancelPhysicalInventory();
    const deleteMutation = useDeletePhysicalInventory();

    const filteredItems = useMemo(() => {
        if (!inventory) return [] as PhysicalInventoryItem[];
        let items = [...inventory.items];
        if (search) {
            const q = search.toLowerCase();
            items = items.filter(
                (it) =>
                    it.product.name.toLowerCase().includes(q) ||
                    (it.product.sku ?? "").toLowerCase().includes(q)
            );
        }
        if (showOnlyDiff) {
            items = items.filter((it) => {
                const c = counts[it.id];
                if (c === "" || c == null) return false;
                return Number(c) !== Number(it.expected_quantity);
            });
        }
        return items;
    }, [inventory, search, showOnlyDiff, counts]);

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error || !inventory) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">
                            {error?.message ?? "Inventaire introuvable."}
                        </p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={() =>
                                router.push(
                                    `/organisation/${orgId}/inventory/physical-inventories`
                                )
                            }
                        >
                            Retour à la liste
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isDraft = inventory.status === "draft";
    const totals = inventory.totals;

    // Dérivations pour l'UI basées sur les valeurs saisies localement
    const localCountedCount = filteredItems.length; // purely for display, real totals from backend
    const hasUnsavedChanges = inventory.items.some((it) => {
        const localCount = counts[it.id] ?? "";
        const originalCount =
            it.counted_quantity != null ? String(it.counted_quantity) : "";
        const localNote = notesMap[it.id] ?? "";
        const originalNote = it.notes ?? "";
        return localCount !== originalCount || localNote !== originalNote;
    });
    const headerNotesChanged = headerNotes !== (inventory.notes ?? "");

    const handlePopulate = async () => {
        try {
            const res = await populateMutation.mutateAsync({
                orgId,
                id: inventory.id,
                data: { include_zero: true },
            });
            toast.success(res.message ?? "Inventaire peuplé.");
        } catch (e: any) {
            toast.error(
                e?.response?.data?.error ??
                    e?.message ??
                    "Impossible de peupler l'inventaire."
            );
        }
    };

    const handleSaveCounts = async () => {
        if (!hasUnsavedChanges && !headerNotesChanged) return;
        try {
            if (hasUnsavedChanges) {
                const items = inventory.items
                    .map((it) => {
                        const localCount = counts[it.id] ?? "";
                        const originalCount =
                            it.counted_quantity != null
                                ? String(it.counted_quantity)
                                : "";
                        const localNote = notesMap[it.id] ?? "";
                        const originalNote = it.notes ?? "";
                        const changed =
                            localCount !== originalCount ||
                            localNote !== originalNote;
                        if (!changed) return null;
                        return {
                            id: it.id,
                            counted_quantity:
                                localCount === ""
                                    ? null
                                    : (localCount as string),
                            notes: localNote,
                        };
                    })
                    .filter(Boolean) as {
                    id: string;
                    counted_quantity: string | null;
                    notes: string;
                }[];

                if (items.length > 0) {
                    await updateItemsMutation.mutateAsync({
                        orgId,
                        id: inventory.id,
                        data: { items },
                    });
                }
            }

            if (headerNotesChanged) {
                await updateMutation.mutateAsync({
                    orgId,
                    id: inventory.id,
                    data: { notes: headerNotes },
                });
            }
            toast.success("Modifications enregistrées.");
        } catch (e: any) {
            toast.error(
                e?.response?.data?.error ??
                    e?.message ??
                    "Échec de l'enregistrement."
            );
        }
    };

    const handleComplete = async () => {
        if (hasUnsavedChanges || headerNotesChanged) {
            const proceed = window.confirm(
                "Des modifications ne sont pas enregistrées. Valider maintenant annulera ces changements. Continuer ?"
            );
            if (!proceed) return;
        } else {
            const proceed = window.confirm(
                "Confirmer la clôture ? Les écarts seront appliqués au stock (mouvements d'ajustement)."
            );
            if (!proceed) return;
        }
        try {
            const res = await completeMutation.mutateAsync({
                orgId,
                id: inventory.id,
            });
            toast.success(res.message ?? "Inventaire clôturé.");
        } catch (e: any) {
            toast.error(
                e?.response?.data?.error ??
                    e?.message ??
                    "Impossible de clôturer l'inventaire."
            );
        }
    };

    const handleCancel = async () => {
        const proceed = window.confirm(
            "Annuler cet inventaire ? Aucune correction de stock ne sera appliquée."
        );
        if (!proceed) return;
        try {
            const res = await cancelMutation.mutateAsync({
                orgId,
                id: inventory.id,
            });
            toast.success(res.message ?? "Inventaire annulé.");
        } catch (e: any) {
            toast.error(
                e?.response?.data?.error ??
                    e?.message ??
                    "Impossible d'annuler."
            );
        }
    };

    const handleDelete = async () => {
        const proceed = window.confirm(
            "Supprimer définitivement ce brouillon d'inventaire ?"
        );
        if (!proceed) return;
        try {
            await deleteMutation.mutateAsync({ orgId, id: inventory.id });
            toast.success("Inventaire supprimé.");
            router.push(`/organisation/${orgId}/inventory/physical-inventories`);
        } catch (e: any) {
            toast.error(
                e?.response?.data?.error ??
                    e?.message ??
                    "Impossible de supprimer."
            );
        }
    };

    const statusBadge = (
        <Badge
            variant="outline"
            className={
                inventory.status === "completed"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : inventory.status === "cancelled"
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "bg-gray-100 text-gray-700 border-gray-200"
            }
        >
            {inventory.status_display}
        </Badge>
    );

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <PageHeader
                    title={`Inventaire ${inventory.reference}`}
                    subtitle={`${inventory.warehouse.name} · ${new Date(
                        inventory.count_date
                    ).toLocaleDateString("fr-FR")}`}
                    backLink={`/organisation/${orgId}/inventory/physical-inventories`}
                />
                {inventory.status !== "draft" && (
                    <GenerateDocumentButton
                        orgId={orgId}
                        docType="physical_inventory"
                        objectId={inventory.id}
                        modalTitle={`Inventaire · ${inventory.reference}`}
                        modalSubtitle={inventory.warehouse.name}
                        variant="outline"
                        size="sm"
                    >
                        <FaReceipt className="mr-2 h-3.5 w-3.5" />
                        Rapport
                    </GenerateDocumentButton>
                )}
            </div>
            <div className="space-y-6">
                {/* Bandeau synthèse */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <ClipboardCheck className="h-6 w-6 text-muted-foreground" />
                                <div>
                                    <div className="text-sm text-muted-foreground">
                                        Statut
                                    </div>
                                    <div className="mt-1">{statusBadge}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-sm">
                                <div>
                                    <div className="text-muted-foreground">
                                        Produits
                                    </div>
                                    <div className="text-xl font-bold">
                                        {totals.total_items}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">
                                        Comptés
                                    </div>
                                    <div className="text-xl font-bold">
                                        {totals.counted_items}
                                        <span className="text-sm font-normal text-muted-foreground">
                                            {" "}
                                            / {totals.total_items}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">
                                        Écarts
                                    </div>
                                    <div
                                        className={`text-xl font-bold ${
                                            totals.discrepancy_items > 0
                                                ? "text-amber-600"
                                                : ""
                                        }`}
                                    >
                                        {totals.discrepancy_items}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">
                                        Delta total
                                    </div>
                                    <div
                                        className={`text-xl font-bold ${
                                            Number(totals.delta_total) < 0
                                                ? "text-red-600"
                                                : Number(totals.delta_total) > 0
                                                ? "text-green-600"
                                                : ""
                                        }`}
                                    >
                                        {Number(totals.delta_total) > 0
                                            ? "+"
                                            : ""}
                                        {totals.delta_total}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t pt-3">
                            <AuditFootprint
                                created_at={inventory.created_at}
                                updated_at={inventory.updated_at}
                                created_by_info={inventory.created_by_info ?? null}
                                updated_by_info={inventory.updated_by_info ?? null}
                            />
                            {inventory.completed_at && (
                                <span className="inline-flex items-center gap-1">
                                    <CheckCircle2 className="size-3 text-green-600" />
                                    Validé le{" "}
                                    <span className="font-medium text-foreground">
                                        {new Date(
                                            inventory.completed_at
                                        ).toLocaleString("fr-FR", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </span>
                            )}
                            {inventory.cancelled_at && (
                                <span className="inline-flex items-center gap-1">
                                    <XCircle className="size-3 text-red-600" />
                                    Annulé le{" "}
                                    <span className="font-medium text-foreground">
                                        {new Date(
                                            inventory.cancelled_at
                                        ).toLocaleString("fr-FR", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Actions principales */}
                {canManage && isDraft && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={handlePopulate}
                            disabled={populateMutation.isPending}
                        >
                            {populateMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            {inventory.items.length === 0
                                ? "Charger les produits du stock"
                                : "Rafraîchir depuis le stock"}
                        </Button>
                        <Button
                            onClick={handleSaveCounts}
                            disabled={
                                (!hasUnsavedChanges && !headerNotesChanged) ||
                                updateItemsMutation.isPending ||
                                updateMutation.isPending
                            }
                        >
                            {updateItemsMutation.isPending ||
                            updateMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Enregistrer
                        </Button>
                        <Button
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleComplete}
                            disabled={
                                completeMutation.isPending ||
                                totals.counted_items === 0
                            }
                        >
                            {completeMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                            )}
                            Valider & appliquer
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                            disabled={cancelMutation.isPending}
                        >
                            <XCircle className="mr-2 h-4 w-4" />
                            Annuler
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </Button>
                    </div>
                )}

                {/* Notes globales */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            Observations
                        </CardTitle>
                        <CardDescription>
                            Contexte, équipe, conditions de comptage…
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <textarea
                            value={headerNotes}
                            onChange={(e) => setHeaderNotes(e.target.value)}
                            readOnly={!isDraft || !canManage}
                            rows={2}
                            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </CardContent>
                </Card>

                {/* Tableau de comptage */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-base">
                                    Lignes de comptage
                                </CardTitle>
                                <CardDescription>
                                    {localCountedCount} / {totals.total_items}{" "}
                                    affichées
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Rechercher un produit…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="h-9 w-56"
                                />
                                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <input
                                        type="checkbox"
                                        checked={showOnlyDiff}
                                        onChange={(e) =>
                                            setShowOnlyDiff(e.target.checked)
                                        }
                                    />
                                    Écarts uniquement
                                </label>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {inventory.items.length === 0 ? (
                            <div className="text-center py-12 px-6">
                                <p className="text-sm text-muted-foreground">
                                    Aucune ligne pour l'instant.
                                </p>
                                <Can permission={PERMISSIONS.STOCK.MANAGE}>
                                    {isDraft && (
                                        <Button
                                            variant="outline"
                                            className="mt-4"
                                            onClick={handlePopulate}
                                            disabled={populateMutation.isPending}
                                        >
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Charger les produits du stock
                                        </Button>
                                    )}
                                </Can>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                                        <tr>
                                            <th className="text-left px-4 py-2">
                                                Produit
                                            </th>
                                            <th className="text-right px-4 py-2">
                                                Attendu
                                            </th>
                                            <th className="text-right px-4 py-2 w-36">
                                                Compté
                                            </th>
                                            <th className="text-right px-4 py-2">
                                                Écart
                                            </th>
                                            <th className="text-right px-4 py-2">
                                                Valorisation
                                            </th>
                                            <th className="text-left px-4 py-2 w-56">
                                                Notes
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredItems.map((it) => {
                                            const localCount = counts[it.id] ?? "";
                                            const localNote =
                                                notesMap[it.id] ?? "";
                                            const expected = Number(
                                                it.expected_quantity
                                            );
                                            const counted =
                                                localCount === ""
                                                    ? null
                                                    : Number(localCount);
                                            const delta =
                                                counted == null
                                                    ? null
                                                    : counted - expected;
                                            const deltaValue =
                                                delta == null
                                                    ? null
                                                    : delta *
                                                      Number(it.unit_cost ?? 0);
                                            const rowClass =
                                                counted == null
                                                    ? ""
                                                    : delta === 0
                                                    ? ""
                                                    : "bg-amber-50/40";
                                            return (
                                                <tr
                                                    key={it.id}
                                                    className={`border-t ${rowClass}`}
                                                >
                                                    <td className="px-4 py-2">
                                                        <div className="font-medium">
                                                            {it.product.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground font-mono">
                                                            {it.product.sku}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right tabular-nums">
                                                        {it.expected_quantity}
                                                    </td>
                                                    <td className="px-4 py-2 text-right">
                                                        <Input
                                                            type="number"
                                                            step="0.001"
                                                            min="0"
                                                            value={localCount}
                                                            onChange={(e) =>
                                                                setCounts(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [it.id]:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            readOnly={
                                                                !isDraft ||
                                                                !canManage
                                                            }
                                                            className="h-8 w-28 ml-auto text-right"
                                                            placeholder="—"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2 text-right tabular-nums">
                                                        {delta == null ? (
                                                            <span className="text-muted-foreground">
                                                                —
                                                            </span>
                                                        ) : delta === 0 ? (
                                                            <span className="text-green-600">
                                                                0
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className={
                                                                    delta < 0
                                                                        ? "text-red-600 font-semibold"
                                                                        : "text-amber-600 font-semibold"
                                                                }
                                                            >
                                                                {delta > 0
                                                                    ? "+"
                                                                    : ""}
                                                                {delta.toLocaleString(
                                                                    undefined,
                                                                    {
                                                                        maximumFractionDigits: 3,
                                                                    }
                                                                )}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2 text-right tabular-nums">
                                                        {deltaValue == null ||
                                                        deltaValue === 0 ? (
                                                            <span className="text-muted-foreground">
                                                                —
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className={
                                                                    deltaValue < 0
                                                                        ? "text-red-600"
                                                                        : "text-green-600"
                                                                }
                                                            >
                                                                {formatCurrency(
                                                                    deltaValue
                                                                )}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <Input
                                                            value={localNote}
                                                            onChange={(e) =>
                                                                setNotesMap(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [it.id]:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    })
                                                                )
                                                            }
                                                            readOnly={
                                                                !isDraft ||
                                                                !canManage
                                                            }
                                                            placeholder="Observation…"
                                                            className="h-8 text-xs"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredItems.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="text-center py-8 text-muted-foreground text-sm"
                                                >
                                                    Aucun produit ne correspond.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
