"use client";

import {
    ListPageLayout,
    ListPagination,
    ListSearchFilters,
    ListStat,
} from "@/components/layout/ListPageLayout";
import { useOrgPermissions } from "@/components/permissions";
import { ReviewerBadge } from "@/components/services/hr/ReviewerBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    useCancelLeaveRequest,
    useLeaveBalancesPaginated,
    useLeaveRequests,
    useLeaveRequestsPaginated,
    useMemberLeaveBalances,
    useReviewLeaveRequest,
} from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import type { LeaveBalance, LeaveRequest, LeaveRequestStatus } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as fa from "react-icons/fa";
import { FaCheck, FaX } from "react-icons/fa6";
import { toast } from "sonner";

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

const LEAVE_STATUSES: { id: LeaveRequestStatus; label: string }[] = [
    { id: "pending", label: "En attente" },
    { id: "approved", label: "Approuvée" },
    { id: "rejected", label: "Refusée" },
    { id: "cancelled", label: "Annulée" },
];

function statusVariant(
    status: LeaveRequestStatus,
): "default" | "destructive" | "secondary" | "outline" {
    switch (status) {
        case "approved":
            return "default";
        case "pending":
            return "secondary";
        case "rejected":
            return "destructive";
        case "cancelled":
            return "outline";
        default:
            return "outline";
    }
}

function getMemberName(m: any) {
    return `${m?.employee?.user?.first_name || ""} ${m?.employee?.user?.last_name || ""}`.trim();
}

type TabId = "mine" | "review" | "balance" | "balances";

// ════════════════════════════════════════════════════════════════════════════
// Sous-composants : lignes de demandes et soldes
// ════════════════════════════════════════════════════════════════════════════

function LeaveRow({
    leave,
    showActions,
    showCancel,
    showMember,
    onApprove,
    onReject,
    onCancel,
}: {
    leave: LeaveRequest;
    showActions: boolean;
    showCancel: boolean;
    showMember: boolean;
    onApprove: () => void;
    onReject: () => void;
    onCancel: () => void;
}) {
    const FaUserTie = fa.FaUserTie;
    const FaClock = fa.FaClock;
    const FaTrash = fa.FaTrash;

    return (
        <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <FaUserTie className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    {showMember && (
                        <p className="text-sm font-medium">{getMemberName(leave.membership)}</p>
                    )}
                    <Badge variant="secondary" className="text-xs font-normal">
                        {leave.leave_type_display}
                    </Badge>
                    <span className="text-sm font-semibold">
                        {Number(leave.days_count).toFixed(1)} j
                    </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Du {leave.start_date} au {leave.end_date}
                    {leave.reviewer && (
                        <>
                            {" "}
                            • {leave.status === "approved" ? "Approuvée" : "Rejetée"} par{" "}
                            <ReviewerBadge reviewer={leave.reviewer} showIcon />
                        </>
                    )}
                </p>
                {leave.reason && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">
                        « {leave.reason} »
                    </p>
                )}
                {leave.rejection_reason && (
                    <p className="text-xs text-destructive/80 mt-0.5">
                        Motif refus : {leave.rejection_reason}
                    </p>
                )}
            </div>
            <Badge variant={statusVariant(leave.status)} className="shrink-0">
                {leave.status === "pending" && <FaClock className="mr-1 h-3 w-3" />}
                {leave.status === "approved" && <FaCheck className="mr-1 h-3 w-3" />}
                {leave.status === "rejected" && <FaX className="mr-1 h-3 w-3" />}
                {leave.status_display}
            </Badge>
            {showActions && leave.status === "pending" && (
                <div className="flex gap-1 shrink-0">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        title="Approuver"
                        onClick={onApprove}
                    >
                        <FaCheck className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Rejeter"
                        onClick={onReject}
                    >
                        <FaX className="h-4 w-4" />
                    </Button>
                </div>
            )}
            {showCancel && (leave.status === "pending" || leave.status === "approved") && (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    title="Annuler"
                    onClick={onCancel}
                >
                    <FaTrash className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}

function BalanceRow({
    balance,
    canManage,
    onEdit,
}: {
    balance: LeaveBalance;
    canManage: boolean;
    onEdit: () => void;
}) {
    const FaUserTie = fa.FaUserTie;
    const FaPen = fa.FaPen;
    const pct = Math.min(
        100,
        (Number(balance.used_days) / Math.max(1, Number(balance.total_days))) * 100,
    );
    return (
        <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <FaUserTie className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{getMemberName(balance.membership)}</p>
                    <Badge variant="secondary" className="text-xs">
                        Année {balance.year}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {Number(balance.used_days).toFixed(1)} /{" "}
                    {Number(balance.total_days).toFixed(1)} jours utilisés •{" "}
                    <span className="font-medium text-foreground">
                        {Number(balance.remaining_days).toFixed(1)} restant(s)
                    </span>
                </p>
                <div className="mt-2 h-1.5 w-full rounded bg-muted overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
            {canManage && (
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    title="Modifier"
                    onClick={onEdit}
                >
                    <FaPen className="h-4 w-4" />
                </Button>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════════════════════
// Page principale
// ════════════════════════════════════════════════════════════════════════════

export default function LeavesPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { can, membershipId: myMembershipId, isOwner, isLoading: permsLoading } =
        useOrgPermissions();

    // Capacités dérivées des permissions
    // Règle : tout membership peut soumettre sa propre demande, voir ses demandes
    // et son solde sans permission. Les permissions ne gouvernent que la
    // validation et la gestion des soldes des autres.
    const canRequest = !!myMembershipId || isOwner;
    const canReview = can(PERMISSIONS.LEAVES.REVIEW) || isOwner;
    const canManageBalances = can(PERMISSIONS.LEAVES.MANAGE_BALANCES) || isOwner;
    const canViewAll = can(PERMISSIONS.LEAVES.VIEW) || canReview || canManageBalances;

    // Onglet par défaut en fonction des permissions
    const defaultTab: TabId = useMemo(() => {
        if (myMembershipId) return "mine";
        if (canReview) return "review";
        if (canManageBalances) return "balances";
        return "mine";
    }, [myMembershipId, canReview, canManageBalances]);

    const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

    useEffect(() => {
        if (!permsLoading) setActiveTab(defaultTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [permsLoading]);

    // ── Dialogs state ──
    const [reviewAction, setReviewAction] = useState<{
        leave: LeaveRequest;
        action: "approve" | "reject";
    } | null>(null);
    const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    // ── Queries ──

    // Mes demandes
    const { data: mineRaw, isLoading: mineLoading } = useLeaveRequests(
        orgId,
        myMembershipId
            ? { membership: myMembershipId, page_size: "all" as const }
            : undefined,
    );
    const myLeaves: LeaveRequest[] = myMembershipId
        ? Array.isArray(mineRaw)
            ? mineRaw
            : ((mineRaw as any)?.results || [])
        : [];

    // Toutes les demandes (pour reviewers) — paginé côté serveur
    const [reviewSearch, setReviewSearch] = useState("");
    const [debouncedReviewSearch, setDebouncedReviewSearch] = useState("");
    useEffect(() => {
        const id = setTimeout(() => setDebouncedReviewSearch(reviewSearch), 300);
        return () => clearTimeout(id);
    }, [reviewSearch]);
    const [reviewStatus, setReviewStatus] = useState<string | null>("pending");
    const [reviewType, setReviewType] = useState<string | null>(null);
    const [reviewFiltersOpen, setReviewFiltersOpen] = useState(false);
    const reviewFilters = useMemo(
        () => ({
            search: debouncedReviewSearch || undefined,
            status: reviewStatus || undefined,
            leave_type: reviewType || undefined,
            exclude_membership: myMembershipId || undefined,
        }),
        [debouncedReviewSearch, reviewStatus, reviewType, myMembershipId],
    );
    const reviewQuery = useLeaveRequestsPaginated(
        orgId,
        reviewFilters,
        { enabled: canViewAll, pageSize: 10 },
    );
    const othersLeaves = reviewQuery.data;
    const allLeavesLoading = reviewQuery.isLoading;

    // Mon solde (tous les soldes de mon membership)
    const { data: myBalancesData, isLoading: myBalancesLoading } = useMemberLeaveBalances(
        orgId,
        myMembershipId || "",
    );
    const myBalances: LeaveBalance[] = myBalancesData || [];

    // Soldes de l'organisation (gestion) — paginé côté serveur
    const [balanceSearch, setBalanceSearch] = useState("");
    const [debouncedBalanceSearch, setDebouncedBalanceSearch] = useState("");
    useEffect(() => {
        const id = setTimeout(() => setDebouncedBalanceSearch(balanceSearch), 300);
        return () => clearTimeout(id);
    }, [balanceSearch]);
    const [balanceYear, setBalanceYear] = useState<string | null>(null);
    const [balanceFiltersOpen, setBalanceFiltersOpen] = useState(false);
    const balanceFilters = useMemo(
        () => ({
            search: debouncedBalanceSearch || undefined,
            year: balanceYear || undefined,
        }),
        [debouncedBalanceSearch, balanceYear],
    );
    const balancesQuery = useLeaveBalancesPaginated(
        orgId,
        balanceFilters,
        { enabled: canManageBalances, pageSize: 10 },
    );
    const filteredOrgBalances = balancesQuery.data;
    const orgBalancesLoading = balancesQuery.isLoading;

    // ── Mutations ──
    const reviewLeave = useReviewLeaveRequest();
    const cancelLeave = useCancelLeaveRequest();

    // ── Stats ──
    const myPending = myLeaves.filter((l) => l.status === "pending").length;
    const pendingToReview = othersLeaves.filter((l) => l.status === "pending").length;
    // Pour le header : nombre total de demandes visibles sur le serveur
    const othersTotal = reviewQuery.meta.totalItems;
    const myRemaining = myBalances.reduce(
        (sum, b) => sum + Number(b.remaining_days),
        0,
    );

    // ── Handlers ──
    const handleReview = async () => {
        if (!reviewAction) return;
        const { leave, action } = reviewAction;
        try {
            await reviewLeave.mutateAsync({
                orgId,
                leaveId: leave.id,
                data: {
                    action,
                    rejection_reason: action === "reject" ? rejectionReason : undefined,
                },
            });
            toast.success(
                action === "approve" ? "Demande approuvée." : "Demande rejetée.",
            );
            setReviewAction(null);
            setRejectionReason("");
        } catch (error: any) {
            const msg =
                error?.data?.detail ||
                (typeof error?.data === "string" ? error.data : null) ||
                error.message ||
                "Action impossible";
            toast.error("Erreur", { description: String(msg) });
        }
    };

    const handleCancel = async () => {
        if (!cancelTarget) return;
        try {
            await cancelLeave.mutateAsync({ orgId, leaveId: cancelTarget.id });
            toast.success("Demande annulée.");
            setCancelTarget(null);
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.data?.detail || error.message || "Action impossible",
            });
        }
    };

    // ── Icons ──
    const FaUmbrellaBeach = fa.FaUmbrellaBeach;
    const FaCalendarAlt = fa.FaCalendarAlt;
    const FaClock = fa.FaClock;
    const FaPlus = fa.FaPlus;
    const FaCoins = fa.FaCoins;
    const FaCogs = fa.FaCogs;

    // ── Tabs disponibles ──
    const visibleTabs: { id: TabId; label: string; count: number; icon: any }[] = [];
    if (myMembershipId) {
        visibleTabs.push({
            id: "mine",
            label: "Mes demandes",
            count: myLeaves.length,
            icon: FaCalendarAlt,
        });
    }
    if (canViewAll) {
        visibleTabs.push({
            id: "review",
            label: canReview ? "À valider" : "Toutes les demandes",
            count: othersLeaves.length,
            icon: FaCheck,
        });
    }
    if (myMembershipId) {
        visibleTabs.push({
            id: "balance",
            label: "Mon solde",
            count: myBalances.length,
            icon: FaCoins,
        });
    }
    if (canManageBalances) {
        visibleTabs.push({
            id: "balances",
            label: "Soldes (gestion)",
            count: balancesQuery.meta.totalItems,
            icon: FaCogs,
        });
    }

    // Si l'onglet actif n'est plus visible (permissions changées), basculer
    useEffect(() => {
        if (!visibleTabs.some((t) => t.id === activeTab) && visibleTabs.length > 0) {
            setActiveTab(visibleTabs[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visibleTabs.length]);

    return (
        <ListPageLayout
            title="Congés"
            icon={FaUmbrellaBeach}
            description="Soumettez vos demandes, consultez votre solde et gérez celles de votre équipe"
            stats={[
                <ListStat
                    key="my-pending"
                    label="Mes demandes en attente"
                    value={myPending}
                    icon={<FaClock className="h-4 w-4 text-orange-500" />}
                />,
                <ListStat
                    key="my-remaining"
                    label="Mes jours restants"
                    value={myRemaining.toFixed(1)}
                    icon={<FaCoins className="h-4 w-4 text-muted-foreground" />}
                />,
                <ListStat
                    key="to-review"
                    label={canReview ? "À valider" : "Demandes (équipe)"}
                    value={pendingToReview}
                    icon={<FaCheck className="h-4 w-4 text-green-600" />}
                />,
            ]}
            content={
                <>
                    {/* Tabs + action principale */}
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                        <div className="flex gap-2 flex-wrap">
                            {visibleTabs.map((t) => {
                                const Icon = t.icon;
                                return (
                                    <Button
                                        key={t.id}
                                        variant={activeTab === t.id ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setActiveTab(t.id)}
                                    >
                                        <Icon className="mr-2 h-4 w-4" /> {t.label} ({t.count})
                                    </Button>
                                );
                            })}
                        </div>
                        <div className="flex gap-2">
                            {(activeTab === "mine" || activeTab === "review") && canRequest && (
                                <Button
                                    size="sm"
                                    className="gap-2"
                                    onClick={() =>
                                        router.push(`/organisation/${orgId}/hr/leaves/create`)
                                    }
                                >
                                    <FaPlus className="h-4 w-4" /> Nouvelle demande
                                </Button>
                            )}
                            {activeTab === "balances" && canManageBalances && (
                                <Button
                                    size="sm"
                                    className="gap-2"
                                    onClick={() =>
                                        router.push(
                                            `/organisation/${orgId}/hr/leaves/balances/create`,
                                        )
                                    }
                                >
                                    <FaPlus className="h-4 w-4" /> Nouveau solde
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* ═══ MES DEMANDES ═══ */}
                    {activeTab === "mine" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Mes demandes</CardTitle>
                                <CardDescription>
                                    Vos demandes personnelles. Vous ne pouvez pas valider vos
                                    propres demandes — un responsable doit les approuver.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {mineLoading ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map((i) => (
                                            <Skeleton key={i} className="h-14 w-full" />
                                        ))}
                                    </div>
                                ) : myLeaves.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FaUmbrellaBeach className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                        <p className="text-lg font-medium">Aucune demande</p>
                                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                                            Créez votre première demande de congé
                                        </p>
                                        {canRequest && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() =>
                                                    router.push(`/organisation/${orgId}/hr/leaves/create`)
                                                }
                                            >
                                                <FaPlus className="h-4 w-4" /> Nouvelle demande
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {myLeaves.map((l) => (
                                            <LeaveRow
                                                key={l.id}
                                                leave={l}
                                                showActions={false}
                                                showCancel={true}
                                                showMember={false}
                                                onApprove={() => {}}
                                                onReject={() => {}}
                                                onCancel={() => setCancelTarget(l)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ═══ À VALIDER / TOUTES ═══ */}
                    {activeTab === "review" && canViewAll && (
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    {canReview ? "Demandes à valider" : "Demandes de l'équipe"}
                                </CardTitle>
                                <CardDescription>
                                    {canReview
                                        ? "Approuvez ou rejetez les demandes des autres membres."
                                        : "Consultation des demandes soumises par vos collègues."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ListSearchFilters
                                    searchValue={reviewSearch}
                                    onSearchChange={setReviewSearch}
                                    searchPlaceholder="Rechercher par employé..."
                                    filtersOpen={reviewFiltersOpen}
                                    onFiltersOpenChange={setReviewFiltersOpen}
                                    filtersAreActive={!!reviewStatus || !!reviewType}
                                    filters={
                                        <>
                                            <div>
                                                <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                                                    Statut
                                                </div>
                                                <select
                                                    className="w-full text-sm border-border bg-background rounded-md p-2 focus:ring-1 focus:ring-primary outline-none"
                                                    value={reviewStatus || ""}
                                                    onChange={(e) =>
                                                        setReviewStatus(e.target.value || null)
                                                    }
                                                >
                                                    <option value="">Tous</option>
                                                    {LEAVE_STATUSES.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="mt-4">
                                                <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                                                    Type
                                                </div>
                                                <select
                                                    className="w-full text-sm border-border bg-background rounded-md p-2 focus:ring-1 focus:ring-primary outline-none"
                                                    value={reviewType || ""}
                                                    onChange={(e) => setReviewType(e.target.value || null)}
                                                >
                                                    <option value="">Tous</option>
                                                    <option value="annual">Annuels</option>
                                                    <option value="sick">Maladie</option>
                                                    <option value="unpaid">Sans solde</option>
                                                    <option value="other">Autre</option>
                                                </select>
                                            </div>
                                            {(reviewStatus || reviewType) && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-4"
                                                    onClick={() => {
                                                        setReviewStatus(null);
                                                        setReviewType(null);
                                                    }}
                                                >
                                                    Réinitialiser
                                                </Button>
                                            )}
                                        </>
                                    }
                                />

                                {allLeavesLoading ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map((i) => (
                                            <Skeleton key={i} className="h-14 w-full" />
                                        ))}
                                    </div>
                                ) : othersLeaves.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FaCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                        <p className="text-lg font-medium">Aucune demande</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {reviewSearch || reviewStatus || reviewType
                                                ? "Modifiez vos filtres"
                                                : "Aucune demande à afficher pour le moment."}
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            {othersLeaves.map((l) => (
                                                <LeaveRow
                                                    key={l.id}
                                                    leave={l}
                                                    showActions={canReview}
                                                    showCancel={canReview}
                                                    showMember={true}
                                                    onApprove={() =>
                                                        setReviewAction({ leave: l, action: "approve" })
                                                    }
                                                    onReject={() =>
                                                        setReviewAction({ leave: l, action: "reject" })
                                                    }
                                                    onCancel={() => setCancelTarget(l)}
                                                />
                                            ))}
                                        </div>
                                        {reviewQuery.meta.totalPages > 1 && (
                                            <ListPagination
                                                meta={reviewQuery.meta}
                                                onPageChange={reviewQuery.setPage}
                                                onNext={reviewQuery.nextPage}
                                                onPrev={reviewQuery.prevPage}
                                            />
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ═══ MON SOLDE ═══ */}
                    {activeTab === "balance" && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Mon solde de congés</CardTitle>
                                <CardDescription>
                                    Vos soldes annuels. Ils sont gérés par votre responsable.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {myBalancesLoading ? (
                                    <div className="space-y-2">
                                        {[1, 2].map((i) => (
                                            <Skeleton key={i} className="h-14 w-full" />
                                        ))}
                                    </div>
                                ) : myBalances.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FaCoins className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                        <p className="text-lg font-medium">Aucun solde configuré</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Votre responsable n'a pas encore configuré de solde annuel.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {myBalances.map((b) => (
                                            <BalanceRow
                                                key={b.id}
                                                balance={b}
                                                canManage={false}
                                                onEdit={() => {}}
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ═══ GESTION DES SOLDES ═══ */}
                    {activeTab === "balances" && canManageBalances && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Gestion des soldes</CardTitle>
                                <CardDescription>
                                    Allouez et ajustez les soldes annuels des membres.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ListSearchFilters
                                    searchValue={balanceSearch}
                                    onSearchChange={setBalanceSearch}
                                    searchPlaceholder="Rechercher par employé..."
                                    filtersOpen={balanceFiltersOpen}
                                    onFiltersOpenChange={setBalanceFiltersOpen}
                                    filtersAreActive={!!balanceYear}
                                    filters={
                                        <>
                                            <div>
                                                <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                                                    Année
                                                </div>
                                                <select
                                                    className="w-full text-sm border-border bg-background rounded-md p-2 focus:ring-1 focus:ring-primary outline-none"
                                                    value={balanceYear || ""}
                                                    onChange={(e) =>
                                                        setBalanceYear(e.target.value || null)
                                                    }
                                                >
                                                    <option value="">Toutes</option>
                                                    {(() => {
                                                        const currentYear = new Date().getFullYear();
                                                        const years: number[] = [];
                                                        for (let y = currentYear + 1; y >= currentYear - 5; y--) {
                                                            years.push(y);
                                                        }
                                                        return years.map((y) => (
                                                            <option key={y} value={y}>
                                                                {y}
                                                            </option>
                                                        ));
                                                    })()}
                                                </select>
                                            </div>
                                            {balanceYear && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-4"
                                                    onClick={() => setBalanceYear(null)}
                                                >
                                                    Réinitialiser
                                                </Button>
                                            )}
                                        </>
                                    }
                                />

                                {orgBalancesLoading ? (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map((i) => (
                                            <Skeleton key={i} className="h-14 w-full" />
                                        ))}
                                    </div>
                                ) : filteredOrgBalances.length === 0 ? (
                                    <div className="text-center py-12">
                                        <FaCoins className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                        <p className="text-lg font-medium">Aucun solde configuré</p>
                                        <p className="text-sm text-muted-foreground mt-1 mb-4">
                                            Créez un solde annuel pour chaque membre
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() =>
                                                router.push(
                                                    `/organisation/${orgId}/hr/leaves/balances/create`,
                                                )
                                            }
                                        >
                                            <FaPlus className="h-4 w-4" /> Nouveau solde
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredOrgBalances.map((b) => (
                                            <BalanceRow
                                                key={b.id}
                                                balance={b}
                                                canManage={true}
                                                onEdit={() =>
                                                    router.push(
                                                        `/organisation/${orgId}/hr/leaves/balances/${b.id}`,
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ═══ REVIEW DIALOG ═══ */}
                    <Dialog
                        open={!!reviewAction}
                        onOpenChange={() => {
                            setReviewAction(null);
                            setRejectionReason("");
                        }}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {reviewAction?.action === "approve"
                                        ? "Approuver la demande"
                                        : "Rejeter la demande"}
                                </DialogTitle>
                                <DialogDescription>
                                    {reviewAction
                                        ? `Demande de ${getMemberName(reviewAction.leave.membership)} — ${Number(reviewAction.leave.days_count).toFixed(1)} jour(s) du ${reviewAction.leave.start_date} au ${reviewAction.leave.end_date}`
                                        : ""}
                                </DialogDescription>
                            </DialogHeader>

                            {reviewAction?.action === "reject" && (
                                <div className="space-y-2">
                                    <Label htmlFor="rejection_reason">Motif du refus</Label>
                                    <textarea
                                        id="rejection_reason"
                                        rows={3}
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Expliquez le motif du refus..."
                                        className="flex w-full border rounded-md border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                </div>
                            )}

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setReviewAction(null);
                                        setRejectionReason("");
                                    }}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    variant={
                                        reviewAction?.action === "reject" ? "destructive" : "default"
                                    }
                                    onClick={handleReview}
                                    disabled={reviewLeave.isPending}
                                    className="gap-2"
                                >
                                    {reviewLeave.isPending && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    {reviewAction?.action === "approve" ? "Approuver" : "Rejeter"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* ═══ CANCEL DIALOG ═══ */}
                    <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Annuler la demande</DialogTitle>
                                <DialogDescription>
                                    {cancelTarget
                                        ? `Voulez-vous annuler la demande de ${getMemberName(cancelTarget.membership)} du ${cancelTarget.start_date} ?${cancelTarget.status === "approved" ? " Les jours consommés seront restitués." : ""}`
                                        : ""}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCancelTarget(null)}>
                                    Retour
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleCancel}
                                    disabled={cancelLeave.isPending}
                                    className="gap-2"
                                >
                                    {cancelLeave.isPending && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    Confirmer l'annulation
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </>
            }
        />
    );
}
