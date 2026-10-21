"use client";

import { GenerateDocumentButton } from "@/components/documents";
import { ConfirmDeleteDialog } from "@/components/layout/ConfirmDeleteDialog";
import {
    ListPageLayout,
    ListPagination,
    ListSearchFilters,
    ListStat,
    ListTable,
    ListTableColumn,
} from "@/components/layout/ListPageLayout";
import { ListSelectionBar } from "@/components/layout/ListSelectionBar";
import { Can, PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ShortcutsHelpModal } from "@/components/ui/shortcuts-help";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useCurrencyFormatter } from "@/lib/hooks";
import { useBulkSelection } from "@/lib/hooks/use-bulk-selection";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
    type KeyboardShortcut,
    useKeyboardShortcuts,
} from "@/lib/hooks/use-keyboard-shortcuts";
import { useCustomers } from "@/lib/hooks/hr";
import {
    useDeleteQuote,
    usePaginatedQuotes,
    useRestoreQuote,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { Customer, Quote, QuoteStatus, QuoteType } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    FaCheckCircle,
    FaClock,
    FaEdit,
    FaEye,
    FaFileAlt,
    FaFileInvoice,
    FaHourglassEnd,
    FaPaperPlane,
    FaPlus,
    FaReceipt,
    FaRegHandshake,
    FaTimes,
    FaTrashRestore,
    FaUndo,
} from "react-icons/fa";
import { toast } from "sonner";

export default function QuotesPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.SALES.VIEW}>
            <QuotesPage />
        </PermissionGuard>
    );
}

const STATUS_STYLES: Record<
    QuoteStatus,
    { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
    draft: {
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: FaEdit,
    },
    sent: {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: FaPaperPlane,
    },
    accepted: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: FaRegHandshake,
    },
    rejected: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: FaTimes,
    },
    expired: {
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: FaHourglassEnd,
    },
    converted: {
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: FaCheckCircle,
    },
};

function QuotesPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.SALES.MANAGE);
    const { formatCurrency } = useCurrencyFormatter();

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search, 300);
    const [filterOpen, setFilterOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("");
    const [customerFilter, setCustomerFilter] = useState<string>("");
    const [showTrash, setShowTrash] = useState(false);
    const [toDelete, setToDelete] = useState<Quote | null>(null);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data: customersList = [] } = useCustomers(orgId, {
        page_size: "all",
        is_active: "true",
    });
    const customers = (customersList as unknown as Customer[]) ?? [];

    const stableFilters = useMemo(
        () => ({
            search: debouncedSearch || undefined,
            status: (statusFilter as QuoteStatus) || undefined,
            quote_type: (typeFilter as QuoteType) || undefined,
            customer: customerFilter || undefined,
            deleted: showTrash ? "true" : undefined,
        }),
        [debouncedSearch, statusFilter, typeFilter, customerFilter, showTrash]
    );

    const restoreQuote = useRestoreQuote();
    const deleteQuote = useDeleteQuote();

    const {
        data: quotes,
        meta,
        setPage,
        nextPage,
        prevPage,
        isLoading,
        error,
    } = usePaginatedQuotes(orgId, stableFilters, { pageSize: 15 });

    // Un devis converti (devenu une vente) ne peut pas être supprimé.
    const selectableIds = quotes
        .filter((q) => q.status !== "converted")
        .map((q) => q.id);
    const selection = useBulkSelection(selectableIds);
    useEffect(() => {
        selection.clear();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, statusFilter, typeFilter, customerFilter, showTrash, meta.currentPage]);

    const handleRestore = (id: string) => {
        restoreQuote.mutate(
            { orgId, id },
            {
                onSuccess: () => toast.success("Devis restauré."),
                onError: (err) =>
                    toast.error("Restauration impossible", {
                        description: getApiErrorMessage(err),
                    }),
            }
        );
    };

    const handleConfirmDelete = () => {
        if (!toDelete) return;
        deleteQuote.mutate(
            { orgId, id: toDelete.id },
            {
                onSuccess: () => {
                    toast.success("Document déplacé dans la corbeille.");
                    setToDelete(null);
                },
                onError: (err) =>
                    toast.error("Suppression impossible", {
                        description: getApiErrorMessage(err),
                    }),
            }
        );
    };

    const handleBulkDelete = async () => {
        const ids = selection.ids;
        if (ids.length === 0) return;
        setBulkDeleting(true);
        const results: PromiseSettledResult<unknown>[] = [];
        for (const id of ids) {
            try {
                await deleteQuote.mutateAsync({ orgId, id });
                results.push({ status: "fulfilled", value: undefined });
            } catch (e) {
                results.push({ status: "rejected", reason: e });
            }
        }
        const ok = results.filter((r) => r.status === "fulfilled").length;
        const failed = results.length - ok;
        setBulkDeleting(false);
        setBulkOpen(false);
        selection.clear();
        if (failed === 0) {
            toast.success(
                `${ok} document${ok > 1 ? "s" : ""} déplacé${ok > 1 ? "s" : ""} dans la corbeille.`
            );
        } else {
            toast.error(`${ok} supprimé${ok > 1 ? "s" : ""}, ${failed} en échec.`, {
                description: "Réessayez pour les éléments restants.",
            });
        }
    };

    const shortcuts = useMemo<KeyboardShortcut[]>(() => {
        const list: KeyboardShortcut[] = [
            {
                key: "/",
                description: "Aller à la recherche",
                handler: () => searchInputRef.current?.focus(),
            },
            {
                key: "?",
                shift: true,
                description: "Afficher l'aide des raccourcis",
                handler: () => setShowShortcuts((v) => !v),
            },
        ];
        if (canManage && !showTrash) {
            list.unshift({
                key: "n",
                description: "Nouveau document",
                handler: () =>
                    router.push(`/organisation/${orgId}/inventory/quotes/create`),
            });
        }
        return list;
    }, [canManage, showTrash, orgId, router]);

    useKeyboardShortcuts(shortcuts);

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

    const filtersActive = !!statusFilter || !!typeFilter || !!customerFilter;
    const showSelection = canManage && !showTrash;

    return (
        <>
        <ListPageLayout
            title={showTrash ? "Devis — Corbeille" : "Devis & Pro forma"}
            icon={showTrash ? FaTrashRestore : FaFileInvoice}
            description={
                showTrash
                    ? "Devis supprimés — restaurez-les si besoin"
                    : "Offres commerciales, conversion en vente 1-clic"
            }
            headerActions={[
                {
                    label: showTrash ? "Voir les actifs" : "Corbeille",
                    icon: showTrash ? FaFileInvoice : FaTrashRestore,
                    variant: "outline" as const,
                    onClick: () => setShowTrash((v) => !v),
                },
                ...(canManage && !showTrash
                    ? [
                          {
                              label: "Nouveau document",
                              icon: FaPlus,
                              onClick: () =>
                                  router.push(
                                      `/organisation/${orgId}/inventory/quotes/create`
                                  ),
                          },
                      ]
                    : []),
            ]}
            stats={[
                <ListStat
                    key="total"
                    label="Documents"
                    value={meta.totalItems}
                    icon={
                        <FaFileAlt className="h-4 w-4 text-muted-foreground" />
                    }
                />,
            ]}
            searchFilters={
                <ListSearchFilters
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchInputRef={searchInputRef}
                    searchPlaceholder="N°, client, notes…"
                    filtersOpen={filterOpen}
                    onFiltersOpenChange={setFilterOpen}
                    filtersAreActive={filtersActive}
                    filters={
                        <div className="space-y-4 mt-4">
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Type
                                </label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Tous</option>
                                    <option value="quote">Devis</option>
                                    <option value="proforma">Pro forma</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Statut
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value)
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Tous</option>
                                    <option value="draft">Brouillon</option>
                                    <option value="sent">Envoyé</option>
                                    <option value="accepted">Accepté</option>
                                    <option value="rejected">Refusé</option>
                                    <option value="expired">Expiré</option>
                                    <option value="converted">Converti</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Client
                                </label>
                                <select
                                    value={customerFilter}
                                    onChange={(e) =>
                                        setCustomerFilter(e.target.value)
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Tous</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    }
                />
            }
            content={
                <>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton
                                    key={i}
                                    className="h-14 w-full rounded-lg"
                                />
                            ))}
                        </div>
                    ) : quotes.length === 0 ? (
                        showTrash ? (
                            <div className="text-center py-16 bg-muted/20 rounded-lg">
                                <FaTrashRestore className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <p className="text-lg font-medium">Corbeille vide</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Aucun devis supprimé.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-muted/20 rounded-lg">
                                <FaFileInvoice className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <p className="text-lg font-medium">Aucun document</p>
                                <p className="text-sm text-muted-foreground mt-1 mb-6">
                                    Créez votre premier devis ou pro forma.
                                </p>
                                <Can permission={PERMISSIONS.SALES.MANAGE}>
                                    <Button
                                        onClick={() =>
                                            router.push(
                                                `/organisation/${orgId}/inventory/quotes/create`
                                            )
                                        }
                                    >
                                        <FaPlus className="mr-2" />
                                        Nouveau document
                                    </Button>
                                </Can>
                            </div>
                        )
                    ) : (
                        <>
                            {showSelection && (
                                <ListSelectionBar
                                    count={selection.count}
                                    label={`${selection.count} document${selection.count > 1 ? "s" : ""} sélectionné${selection.count > 1 ? "s" : ""}`}
                                    onClear={selection.clear}
                                    onDelete={() => setBulkOpen(true)}
                                />
                            )}
                            <ListTable
                                columns={[
                                    ...(showSelection
                                        ? [
                                            <ListTableColumn
                                                key="select"
                                                header={
                                                    <Checkbox
                                                        checked={selection.allSelected}
                                                        onCheckedChange={selection.toggleAll}
                                                        aria-label="Tout sélectionner"
                                                    />
                                                }
                                            >
                                                {({ value: q }) =>
                                                    q.status === "converted" ? (
                                                        <span className="inline-block w-4.5" />
                                                    ) : (
                                                        <Checkbox
                                                            checked={selection.selected.has(q.id)}
                                                            onCheckedChange={() =>
                                                                selection.toggleOne(q.id)
                                                            }
                                                            aria-label={`Sélectionner ${q.quote_number}`}
                                                        />
                                                    )
                                                }
                                            </ListTableColumn>,
                                          ]
                                        : []),
                                    <ListTableColumn key="num" header="N°">
                                        {({ value: q }) => (
                                            <div>
                                                <div className="font-mono text-sm font-semibold">
                                                    {q.quote_number}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {new Date(
                                                        q.issue_date
                                                    ).toLocaleDateString(
                                                        "fr-FR"
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn key="type" header="Type">
                                        {({ value: q }) => (
                                            <Badge variant="outline">
                                                {q.quote_type_display}
                                            </Badge>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="customer"
                                        header="Client"
                                    >
                                        {({ value: q }) => (
                                            <div>
                                                <div className="text-sm font-medium">
                                                    {q.customer?.name ??
                                                        q.customer_name_snapshot ??
                                                        "—"}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {q.warehouse.name}
                                                </div>
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="status"
                                        header="Statut"
                                    >
                                        {({ value: q }) => {
                                            const st = q.status as QuoteStatus;
                                            const Icon = STATUS_STYLES[st].icon;
                                            return (
                                                <Badge
                                                    variant="outline"
                                                    className={`gap-1.5 ${STATUS_STYLES[st].color}`}
                                                >
                                                    <Icon className="h-3 w-3" />
                                                    {q.status_display}
                                                </Badge>
                                            );
                                        }}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="valid"
                                        header="Validité"
                                    >
                                        {({ value: q }) =>
                                            q.valid_until ? (
                                                <span
                                                    className={`text-xs ${
                                                        q.is_expired_by_date
                                                            ? "text-red-600"
                                                            : "text-muted-foreground"
                                                    }`}
                                                >
                                                    <FaClock className="inline h-3 w-3 mr-1" />
                                                    {new Date(
                                                        q.valid_until
                                                    ).toLocaleDateString(
                                                        "fr-FR"
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    —
                                                </span>
                                            )
                                        }
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="total"
                                        header="Total"
                                        align="right"
                                    >
                                        {({ value: q }) => (
                                            <div className="text-sm font-semibold">
                                                {formatCurrency(
                                                    Number(q.total)
                                                )}
                                            </div>
                                        )}
                                    </ListTableColumn>,
                                    <ListTableColumn
                                        key="actions"
                                        header=""
                                        align="right"
                                    >
                                        {({ value: q }) =>
                                            showTrash ? (
                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="text-xs text-right">
                                                        <div className="font-medium">
                                                            {q.deleted_by_info?.name ||
                                                                q.deleted_by_info?.email ||
                                                                "—"}
                                                        </div>
                                                        {q.deleted_at && (
                                                            <div className="text-muted-foreground">
                                                                {new Date(
                                                                    q.deleted_at
                                                                ).toLocaleDateString("fr-FR")}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {canManage && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={restoreQuote.isPending}
                                                            onClick={() => handleRestore(q.id)}
                                                        >
                                                            <FaUndo className="h-3.5 w-3.5 mr-1.5" />
                                                            Restaurer
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1">
                                                    <GenerateDocumentButton
                                                        orgId={orgId}
                                                        docType={
                                                            q.quote_type ===
                                                            "proforma"
                                                                ? "proforma"
                                                                : "quote"
                                                        }
                                                        objectId={q.id}
                                                        modalTitle={`${q.quote_type_display} · ${q.quote_number}`}
                                                        modalSubtitle={
                                                            q.customer?.name ??
                                                            q.customer_name_snapshot
                                                        }
                                                        variant="ghost"
                                                        size="sm"
                                                        hideIcon
                                                        aria-label="Imprimer le document"
                                                    >
                                                        <FaReceipt className="h-3.5 w-3.5" />
                                                    </GenerateDocumentButton>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                        title="Ouvrir le document"
                                                        aria-label="Ouvrir le document"
                                                        onClick={() =>
                                                            router.push(
                                                                `/organisation/${orgId}/inventory/quotes/${q.id}`
                                                            )
                                                        }
                                                    >
                                                        <FaEye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    {canManage &&
                                                        q.status !== "converted" && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                title="Supprimer le document"
                                                                aria-label="Supprimer le document"
                                                                onClick={() => setToDelete(q)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        )}
                                                </div>
                                            )
                                        }
                                    </ListTableColumn>,
                                ]}
                                data={quotes}
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

        <ConfirmDeleteDialog
            open={!!toDelete}
            onOpenChange={() => setToDelete(null)}
            title="Supprimer le document ?"
            description={
                <>
                    «&nbsp;{toDelete?.quote_number}&nbsp;» sera déplacé dans la
                    corbeille. Vous pourrez le restaurer à tout moment.
                </>
            }
            pending={deleteQuote.isPending}
            onConfirm={handleConfirmDelete}
        />

        <ConfirmDeleteDialog
            open={bulkOpen}
            onOpenChange={setBulkOpen}
            title={`Supprimer ${selection.count} document${selection.count > 1 ? "s" : ""} ?`}
            description="Les documents sélectionnés seront déplacés dans la corbeille. Vous pourrez les restaurer à tout moment."
            pending={bulkDeleting}
            onConfirm={handleBulkDelete}
        />

        <ShortcutsHelpModal
            isOpen={showShortcuts}
            onClose={() => setShowShortcuts(false)}
            shortcuts={shortcuts}
            title="Raccourcis — Devis"
        />
        </>
    );
}
