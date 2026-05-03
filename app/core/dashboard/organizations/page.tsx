"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    useOrganizations,
    useToggleOrganization,
} from "@/lib/hooks/core";
import type { Organization } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    ArrowRight,
    Blocks,
    Building2,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Power,
    PowerOff,
    Search,
    Settings,
    X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function formatRelative(iso: string): string {
    const then = new Date(iso).getTime();
    if (!Number.isFinite(then)) return "—";
    const diffMs = Date.now() - then;
    const days = Math.floor(diffMs / 86_400_000);
    if (days < 1) return "aujourd'hui";
    if (days < 2) return "hier";
    if (days < 30) return `il y a ${days} j`;
    const months = Math.floor(days / 30);
    if (months < 12) return `il y a ${months} mois`;
    const years = Math.floor(months / 12);
    return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

type StatusFilter = "all" | "active" | "inactive";

// ─── Page ───────────────────────────────────────────────────────────────────

export default function OrganizationsPage() {
    const router = useRouter();
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    // ── Toggle confirmation state ──
    const [pendingToggle, setPendingToggle] = useState<Organization | null>(null);

    // Debounce search (300ms)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Stable filters object
    const filters = useMemo(
        () => (debouncedSearch ? { search: debouncedSearch } : undefined),
        [debouncedSearch],
    );

    const {
        data: organizations,
        meta,
        page,
        setPage,
        isLoading,
        isFetching,
    } = useOrganizations(filters);

    const toggleMutation = useToggleOrganization();

    // ── Compteurs status (sur la page courante uniquement) ──
    const activeCount = useMemo(
        () => organizations.filter((o) => o.is_active).length,
        [organizations],
    );
    const inactiveCount = organizations.length - activeCount;

    // Filtrage local par status (le backend filtre par search)
    const filteredOrgs = useMemo(() => {
        if (statusFilter === "active") return organizations.filter((o) => o.is_active);
        if (statusFilter === "inactive") return organizations.filter((o) => !o.is_active);
        return organizations;
    }, [organizations, statusFilter]);

    // ── Handlers ──
    const requestToggle = (org: Organization) => {
        // Réactivation : pas de confirmation (action positive)
        if (!org.is_active) {
            toggleMutation.mutate(
                { id: org.id, isActive: org.is_active },
                {
                    onSuccess: () => toast.success(`${org.name} réactivée.`),
                    onError: () => toast.error("Action impossible."),
                },
            );
            return;
        }
        // Désactivation : on ouvre le dialog de confirmation
        setPendingToggle(org);
    };

    const confirmToggle = useCallback(() => {
        if (!pendingToggle) return;
        toggleMutation.mutate(
            { id: pendingToggle.id, isActive: pendingToggle.is_active },
            {
                onSuccess: () => {
                    toast.success(`${pendingToggle.name} désactivée.`);
                    setPendingToggle(null);
                },
                onError: () => {
                    toast.error("Action impossible.");
                    setPendingToggle(null);
                },
            },
        );
    }, [pendingToggle, toggleMutation]);

    // ── Pagination compacte avec ellipsis ──
    const pageNumbers = useMemo(() => {
        const total = meta.totalPages;
        const current = meta.currentPage;
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
        if (current >= total - 3)
            return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
        return [1, "…", current - 1, current, current + 1, "…", total];
    }, [meta.totalPages, meta.currentPage]);

    // ─── LOADING ──────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="px-4 py-6 sm:py-8 max-w-5xl mx-auto space-y-5">
                <Skeleton className="h-4 w-32" />
                <div className="flex justify-between items-end pb-2">
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-9 w-36 rounded-lg" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-8 w-64 rounded-lg" />
                <Card className="p-0 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex items-center gap-3.5 p-4 border-b last:border-0">
                            <Skeleton className="h-10 w-10 rounded-lg" />
                            <div className="space-y-1.5 flex-1">
                                <Skeleton className="h-4 w-44" />
                                <Skeleton className="h-3 w-28" />
                            </div>
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                    ))}
                </Card>
            </div>
        );
    }

    const isFiltered = debouncedSearch || statusFilter !== "all";
    const isEmptyResult = filteredOrgs.length === 0;

    // ─── RENDER ───────────────────────────────────────────────────────────
    return (
        <div className="px-4 py-6 sm:py-8 max-w-5xl mx-auto space-y-5">
            {/* Back link discret */}
            <Link
                href="/core/dashboard"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-3.5 w-3.5" />
                Tableau de bord
            </Link>

            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                        Organisations
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {meta.totalItems} espace{meta.totalItems !== 1 ? "s" : ""} de travail
                        {meta.totalItems > 0 && (
                            <span className="text-muted-foreground/60">
                                {" "}
                                — {activeCount} {activeCount > 1 ? "actives" : "active"}
                                {inactiveCount > 0 && `, ${inactiveCount} ${inactiveCount > 1 ? "inactives" : "inactive"}`}
                            </span>
                        )}
                    </p>
                </div>
                <Button
                    onClick={() => router.push("/core/dashboard/organizations/create")}
                    size="sm"
                    className="h-9 text-xs font-medium shrink-0"
                >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Nouvelle organisation
                </Button>
            </header>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher par nom..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-10 pr-10 h-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {searchInput && !isFetching && (
                        <button
                            type="button"
                            onClick={() => setSearchInput("")}
                            className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                            aria-label="Effacer la recherche"
                        >
                            <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                    )}
                    {isFetching && (
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                    )}
                </div>
            </div>

            {/* Filtres rapides — visibles uniquement s'il y a au moins une org */}
            {organizations.length > 0 && (
                <div className="inline-flex bg-muted/50 p-0.5 rounded-md">
                    <FilterTab
                        active={statusFilter === "all"}
                        onClick={() => setStatusFilter("all")}
                        label="Toutes"
                        count={organizations.length}
                    />
                    <FilterTab
                        active={statusFilter === "active"}
                        onClick={() => setStatusFilter("active")}
                        label="Actives"
                        count={activeCount}
                        tone="emerald"
                    />
                    {inactiveCount > 0 && (
                        <FilterTab
                            active={statusFilter === "inactive"}
                            onClick={() => setStatusFilter("inactive")}
                            label="Inactives"
                            count={inactiveCount}
                            tone="muted"
                        />
                    )}
                </div>
            )}

            {/* Liste */}
            <Card className="overflow-hidden p-0">
                {isEmptyResult ? (
                    <EmptyState
                        isFiltered={!!isFiltered}
                        searchTerm={debouncedSearch}
                        onClearFilters={() => {
                            setSearchInput("");
                            setStatusFilter("all");
                        }}
                        onCreate={() => router.push("/core/dashboard/organizations/create")}
                    />
                ) : (
                    <ul className="divide-y">
                        {filteredOrgs.map((org) => (
                            <OrganizationRow
                                key={org.id}
                                org={org}
                                onOpen={() => router.push(`/organisation/${org.id}/dashboard`)}
                                onEdit={() => router.push(`/core/dashboard/organizations/${org.id}/edit`)}
                                onSettings={() => router.push(`/core/dashboard/organizations/${org.id}/settings`)}
                                onModules={() => router.push(`/core/dashboard/organizations/${org.id}/modules`)}
                                onToggle={() => requestToggle(org)}
                                isToggling={
                                    toggleMutation.isPending &&
                                    toggleMutation.variables?.id === org.id
                                }
                            />
                        ))}
                    </ul>
                )}
            </Card>

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div className="flex items-center justify-between gap-2 pt-1">
                    <p className="text-xs text-muted-foreground hidden sm:block">
                        Page {meta.currentPage} / {meta.totalPages}
                    </p>
                    <div className="flex items-center gap-1 mx-auto sm:mx-0 sm:ml-auto">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={!meta.hasPreviousPage}
                            onClick={() => setPage(page - 1)}
                            aria-label="Page précédente"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {pageNumbers.map((p, idx) =>
                            p === "…" ? (
                                <span
                                    key={`ellipsis-${idx}`}
                                    className="px-1.5 text-xs text-muted-foreground"
                                >
                                    …
                                </span>
                            ) : (
                                <Button
                                    key={p}
                                    variant={p === meta.currentPage ? "default" : "ghost"}
                                    size="icon"
                                    className={cn(
                                        "h-8 w-8 text-xs",
                                        p === meta.currentPage && "pointer-events-none",
                                    )}
                                    onClick={() => setPage(p as number)}
                                >
                                    {p}
                                </Button>
                            ),
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            disabled={!meta.hasNextPage}
                            onClick={() => setPage(page + 1)}
                            aria-label="Page suivante"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* AlertDialog : confirmation désactivation */}
            <AlertDialog
                open={!!pendingToggle}
                onOpenChange={(open) => {
                    if (!open && !toggleMutation.isPending) setPendingToggle(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="h-9 w-9 shrink-0 rounded-full bg-destructive/10 flex items-center justify-center">
                                <PowerOff className="h-4 w-4 text-destructive" />
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-0">
                                <AlertDialogTitle>
                                    Désactiver{" "}
                                    <span className="font-semibold">
                                        {pendingToggle?.name}
                                    </span>{" "}
                                    ?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Les membres ne pourront plus accéder à cette organisation.
                                    Les données sont conservées et l&apos;organisation peut être
                                    réactivée à tout moment.
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={toggleMutation.isPending}>
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmToggle();
                            }}
                            disabled={toggleMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90 text-white"
                        >
                            {toggleMutation.isPending ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    Désactivation…
                                </>
                            ) : (
                                <>
                                    <PowerOff className="h-3.5 w-3.5 mr-1.5" />
                                    Désactiver
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ─── Filter tab ─────────────────────────────────────────────────────────────

function FilterTab({
    active,
    onClick,
    label,
    count,
    tone = "primary",
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    count: number;
    tone?: "primary" | "emerald" | "muted";
}) {
    const accentColor = {
        primary: "text-primary",
        emerald: "text-emerald-600",
        muted: "text-muted-foreground",
    }[tone];
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all",
                active
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground",
            )}
        >
            <span>{label}</span>
            <span
                className={cn(
                    "text-[10px] font-mono",
                    active ? accentColor : "text-muted-foreground/70",
                )}
            >
                {count}
            </span>
        </button>
    );
}

// ─── Row ────────────────────────────────────────────────────────────────────

function OrganizationRow({
    org,
    onOpen,
    onEdit,
    onSettings,
    onModules,
    onToggle,
    isToggling,
}: {
    org: Organization;
    onOpen: () => void;
    onEdit: () => void;
    onSettings: () => void;
    onModules: () => void;
    onToggle: () => void;
    isToggling: boolean;
}) {
    const moduleCount = org.module_codes?.length ?? 0;
    return (
        <li
            className={cn(
                "flex items-center justify-between gap-3 p-4 transition-colors group",
                org.is_active
                    ? "hover:bg-muted/40 cursor-pointer"
                    : "bg-muted/20 opacity-80 cursor-pointer hover:bg-muted/30",
            )}
            onClick={onOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    onOpen();
                }
            }}
        >
            {/* Left: Avatar + Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                    className={cn(
                        "h-10 w-10 shrink-0 rounded-lg flex items-center justify-center overflow-hidden ring-1",
                        org.is_active
                            ? "bg-primary/8 ring-primary/15"
                            : "bg-muted ring-border",
                    )}
                >
                    {org.logo ? (
                        <img
                            src={org.logo}
                            alt={org.name}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span
                            className={cn(
                                "font-bold text-xs tracking-wide",
                                org.is_active ? "text-primary" : "text-muted-foreground",
                            )}
                        >
                            {getInitials(org.name)}
                        </span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {org.name}
                        </h3>
                        {!org.is_active && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-px text-[9px] uppercase font-bold tracking-wider bg-muted text-muted-foreground rounded shrink-0">
                                Inactive
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground flex-wrap">
                        {org.category?.name && (
                            <span className="font-medium truncate max-w-[120px]">
                                {org.category.name}
                            </span>
                        )}
                        {org.category?.name && (org.country || org.currency) && (
                            <span className="text-muted-foreground/40">·</span>
                        )}
                        {org.country && <span>{org.country}</span>}
                        {org.country && org.currency && (
                            <span className="text-muted-foreground/40">·</span>
                        )}
                        {org.currency && <span>{org.currency}</span>}
                        <span className="text-muted-foreground/40">·</span>
                        <span className="inline-flex items-center gap-1">
                            <Blocks className="h-2.5 w-2.5" />
                            {moduleCount} module{moduleCount > 1 ? "s" : ""}
                        </span>
                        <span className="text-muted-foreground/40">·</span>
                        <span>créée {formatRelative(org.created_at)}</span>
                    </div>
                </div>
            </div>

            {/* Right: Actions (toujours visibles, pas de hover-only) */}
            <div
                className="flex items-center gap-1 shrink-0"
                onClick={(e) => e.stopPropagation()}
            >
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                    className="h-8 px-2 text-xs hidden sm:inline-flex"
                >
                    <Pencil className="h-3 w-3 mr-1.5" />
                    Modifier
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
                            aria-label="Plus d'actions"
                            disabled={isToggling}
                        >
                            {isToggling ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <MoreHorizontal className="h-4 w-4" />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem
                            className="cursor-pointer text-xs"
                            onClick={onOpen}
                        >
                            <ExternalLink className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            Ouvrir l&apos;espace
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="cursor-pointer text-xs sm:hidden"
                            onClick={onEdit}
                        >
                            <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer text-xs"
                            onClick={onSettings}
                        >
                            <Settings className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            Paramètres
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer text-xs"
                            onClick={onModules}
                        >
                            <Blocks className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                            Modules & forfait
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className={cn(
                                "cursor-pointer text-xs",
                                org.is_active
                                    ? "text-destructive focus:text-destructive focus:bg-destructive/10"
                                    : "text-emerald-600 focus:text-emerald-600 focus:bg-emerald-500/10",
                            )}
                            onClick={onToggle}
                        >
                            {org.is_active ? (
                                <PowerOff className="mr-2 h-3.5 w-3.5" />
                            ) : (
                                <Power className="mr-2 h-3.5 w-3.5" />
                            )}
                            {org.is_active ? "Désactiver" : "Réactiver"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors hidden sm:block" />
            </div>
        </li>
    );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function EmptyState({
    isFiltered,
    searchTerm,
    onClearFilters,
    onCreate,
}: {
    isFiltered: boolean;
    searchTerm: string;
    onClearFilters: () => void;
    onCreate: () => void;
}) {
    if (isFiltered) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4">
                    <Search className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                    Aucun résultat
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-[260px] leading-relaxed">
                    {searchTerm
                        ? `Aucune organisation ne correspond à « ${searchTerm} ».`
                        : "Aucune organisation ne correspond à ce filtre."}
                </p>
                <Button
                    onClick={onClearFilters}
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs mt-4"
                >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    Effacer les filtres
                </Button>
            </div>
        );
    }
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/8 flex items-center justify-center mb-4 ring-1 ring-primary/15">
                <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
                Créez votre premier espace de travail
            </h3>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-[300px] leading-relaxed">
                Une organisation regroupe vos équipes, vos modules métier et vos
                données. Vous pourrez ensuite inviter des collaborateurs.
            </p>
            <Button onClick={onCreate} size="sm" className="h-9 text-xs mt-5">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Créer une organisation
            </Button>
        </div>
    );
}
