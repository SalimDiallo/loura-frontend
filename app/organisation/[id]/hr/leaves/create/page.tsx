"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { useOrgPermissions } from "@/components/permissions";
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
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import {
    useCreateLeaveRequest,
    useMemberLeaveBalances,
    useMembers,
} from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import type { LeaveType } from "@/lib/types";
import { CalendarDays, FileText, Loader2, Save, UserCheck } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const LEAVE_TYPES: { id: LeaveType; label: string }[] = [
    { id: "annual", label: "Congés annuels" },
    { id: "sick", label: "Maladie" },
    { id: "unpaid", label: "Sans solde" },
    { id: "other", label: "Autre" },
];

/**
 * Calcule le nombre de jours (inclusifs) entre deux dates, en ignorant week-ends.
 * Retourne 0 si les dates sont invalides.
 */
function countWorkingDays(start: string, end: string): number {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0;
    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
        const day = cur.getDay();
        if (day !== 0 && day !== 6) count += 1;
        cur.setDate(cur.getDate() + 1);
    }
    return count;
}

export default function CreateLeavePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const orgId = params.id as string;
    const prefilledMember = searchParams.get("member");
    const { can, membershipId: myMembershipId, isOwner } = useOrgPermissions();
    // Toute personne ayant un membership peut demander un congé pour elle-même.
    // Créer pour autrui nécessite `hr.review_leaves` (ou d'être owner).
    const canReviewForOthers = can(PERMISSIONS.LEAVES.REVIEW) || isOwner;

    const [membershipId, setMembershipId] = useState(prefilledMember || "");
    const [leaveType, setLeaveType] = useState<LeaveType>("annual");
    const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [daysCount, setDaysCount] = useState("1");
    const [reason, setReason] = useState("");
    const [autoDays, setAutoDays] = useState(true);

    const { data: membersData } = useMembers(orgId, { page_size: 100 });
    const allMembers = (membersData as any)?.results || [];

    const members = useMemo(() => {
        if (canReviewForOthers) return allMembers;
        return allMembers.filter((m: any) => m.id === myMembershipId);
    }, [allMembers, canReviewForOthers, myMembershipId]);

    useEffect(() => {
        if (!canReviewForOthers && myMembershipId && !membershipId) {
            setMembershipId(myMembershipId);
        }
    }, [canReviewForOthers, myMembershipId, membershipId]);

    // Auto-compute working days
    useEffect(() => {
        if (autoDays) {
            const d = countWorkingDays(startDate, endDate);
            setDaysCount(d > 0 ? String(d) : "0");
        }
    }, [startDate, endDate, autoDays]);

    const createLeave = useCreateLeaveRequest();

    // Fetch balances for selected member
    const { data: memberBalances } = useMemberLeaveBalances(orgId, membershipId);
    const currentYear = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();
    const currentBalance = memberBalances?.find((b) => b.year === currentYear);

    const memberItems: SmartSelectorItem[] = useMemo(
        () =>
            members.map((m: any) => ({
                id: m.id,
                name:
                    `${m.employee?.user?.first_name || ""} ${m.employee?.user?.last_name || ""}`.trim() ||
                    m.employee?.user?.email,
                subtitle: m.employee?.user?.email,
                icon: UserCheck,
            })),
        [members],
    );

    const selectedMember = members.find((m: any) => m.id === membershipId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!membershipId) {
            toast.error("Sélectionnez un membre.");
            return;
        }
        if (!startDate || !endDate) {
            toast.error("Les dates de début et de fin sont requises.");
            return;
        }
        if (new Date(endDate) < new Date(startDate)) {
            toast.error("La date de fin doit être postérieure à la date de début.");
            return;
        }
        const days = Number(daysCount);
        if (!days || days <= 0) {
            toast.error("Le nombre de jours doit être supérieur à 0.");
            return;
        }

        try {
            await createLeave.mutateAsync({
                orgId,
                data: {
                    membership_id: membershipId,
                    leave_type: leaveType,
                    start_date: startDate,
                    end_date: endDate,
                    days_count: daysCount,
                    reason,
                },
            });
            toast.success("Demande de congé créée avec succès !");
            router.push(`/organisation/${orgId}/hr/leaves`);
        } catch (error: any) {
            const payload = error?.data;
            let msg = error.message || "Impossible de créer la demande";
            if (payload) {
                if (typeof payload === "string") msg = payload;
                else if (payload.detail) msg = payload.detail;
                else if (payload.days_count)
                    msg = Array.isArray(payload.days_count)
                        ? payload.days_count.join(", ")
                        : String(payload.days_count);
                else msg = JSON.stringify(payload);
            }
            toast.error("Erreur", { description: msg });
        }
    };

    return (
        <FormPageLayout
            title="Nouvelle demande de congé"
            subtitle="Soumettez une demande de congé pour un membre"
            backLink={`/organisation/${orgId}/hr/leaves`}
            sidebar={
                <Card>
                    <CardHeader>
                        <CardTitle>Aperçu</CardTitle>
                        <CardDescription>Résumé de la demande</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                                Membre
                            </p>
                            <p className="text-sm font-medium">
                                {selectedMember
                                    ? `${selectedMember.employee?.user?.first_name || ""} ${selectedMember.employee?.user?.last_name || ""}`.trim()
                                    : "—"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                                Type
                            </p>
                            <p className="text-sm">
                                {LEAVE_TYPES.find((t) => t.id === leaveType)?.label}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                                Période
                            </p>
                            <p className="text-sm">
                                {startDate} → {endDate}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                                Jours demandés
                            </p>
                            <p className="text-lg font-bold">{daysCount || "—"}</p>
                        </div>
                        {currentBalance && leaveType !== "unpaid" && (
                            <div className="pt-3 border-t space-y-1">
                                <p className="text-xs font-medium uppercase text-muted-foreground">
                                    Solde {currentYear}
                                </p>
                                <p className="text-sm">
                                    {Number(currentBalance.remaining_days).toFixed(1)} /{" "}
                                    {Number(currentBalance.total_days).toFixed(1)} jour(s) restant(s)
                                </p>
                                {Number(daysCount) > Number(currentBalance.remaining_days) && (
                                    <p className="text-xs text-destructive">
                                        ⚠ Solde insuffisant
                                    </p>
                                )}
                            </div>
                        )}
                        {leaveType === "unpaid" && (
                            <p className="text-xs text-muted-foreground italic">
                                Les congés sans solde ne consomment pas le solde annuel.
                            </p>
                        )}
                        <div className="pt-3 border-t">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                                En attente de validation
                            </span>
                        </div>
                    </CardContent>
                </Card>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Détails de la demande</CardTitle>
                    <CardDescription>
                        La demande sera créée avec le statut « En attente ». Un administrateur
                        devra l'approuver ou la rejeter.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Membre demandeur *</Label>
                            <SmartSelector
                                items={memberItems}
                                selectedIds={membershipId ? [membershipId] : []}
                                onChange={(ids) => setMembershipId(ids[0] || "")}
                                placeholder="Sélectionner un membre"
                                accentColor="primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="leave_type">Type de congé *</Label>
                            <select
                                id="leave_type"
                                className="flex w-full border rounded-md border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={leaveType}
                                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                            >
                                {LEAVE_TYPES.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="start_date">Date de début *</Label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end_date">Date de fin *</Label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="days_count">Nombre de jours *</Label>
                                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={autoDays}
                                        onChange={(e) => setAutoDays(e.target.checked)}
                                    />
                                    Calcul automatique (hors week-ends)
                                </label>
                            </div>
                            <Input
                                id="days_count"
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={daysCount}
                                onChange={(e) => setDaysCount(e.target.value)}
                                disabled={autoDays}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Motif</Label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <textarea
                                    id="reason"
                                    rows={3}
                                    placeholder="Motif de la demande (optionnel)..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="flex w-full border rounded-md border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-10"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 justify-end border-t">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={createLeave.isPending}
                                className="gap-2"
                            >
                                {createLeave.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Soumettre la demande
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </FormPageLayout>
    );
}
