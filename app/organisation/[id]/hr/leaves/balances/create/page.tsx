"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { PermissionGuard } from "@/components/permissions";
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
import { useCreateLeaveBalance, useMembers } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import { Loader2, Save, UserCheck } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// Valeur de secours côté UI ; le backend renverra max_days via le solde après
// création pour rester la source de vérité. On garde une limite conservatrice.
const DEFAULT_MAX_DAYS = 60;

export default function CreateLeaveBalancePageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.LEAVES.MANAGE_BALANCES}>
            <CreateLeaveBalancePage />
        </PermissionGuard>
    );
}

function CreateLeaveBalancePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const orgId = params.id as string;
    const prefilledMember = searchParams.get("member");

    const [membershipId, setMembershipId] = useState(prefilledMember || "");
    const [year, setYear] = useState(new Date().getFullYear());
    const [totalDays, setTotalDays] = useState("25");

    const { data: membersData } = useMembers(orgId, { page_size: 100 });
    const members = (membersData as any)?.results || [];

    const createBalance = useCreateLeaveBalance();

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
        const days = Number(totalDays);
        if (!days || days <= 0) {
            toast.error("Le nombre de jours doit être supérieur à 0.");
            return;
        }
        if (days > DEFAULT_MAX_DAYS) {
            toast.error(`Le solde ne peut pas dépasser ${DEFAULT_MAX_DAYS} jours.`);
            return;
        }

        try {
            await createBalance.mutateAsync({
                orgId,
                data: { membership_id: membershipId, year, total_days: totalDays },
            });
            toast.success("Solde de congés créé.");
            router.push(`/organisation/${orgId}/hr/leaves`);
        } catch (error: any) {
            const payload = error?.data;
            let msg = error.message || "Impossible de créer le solde";
            if (payload) {
                if (typeof payload === "string") msg = payload;
                else if (payload.detail) msg = payload.detail;
                else msg = JSON.stringify(payload);
            }
            toast.error("Erreur", { description: msg });
        }
    };

    return (
        <FormPageLayout
            title="Nouveau solde de congés"
            subtitle="Allouer des jours de congé à un membre pour une année"
            backLink={`/organisation/${orgId}/hr/leaves`}
            sidebar={
                <Card>
                    <CardHeader>
                        <CardTitle>Aperçu</CardTitle>
                        <CardDescription>Résumé du solde</CardDescription>
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
                                Année
                            </p>
                            <p className="text-sm">{year}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                                Jours alloués
                            </p>
                            <p className="text-lg font-bold">{totalDays || "—"}</p>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                            Limite maximale : {DEFAULT_MAX_DAYS} jours par an.
                        </p>
                    </CardContent>
                </Card>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Détails du solde</CardTitle>
                    <CardDescription>
                        Un seul solde autorisé par membre et par année.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Membre *</Label>
                            <SmartSelector
                                items={memberItems}
                                selectedIds={membershipId ? [membershipId] : []}
                                onChange={(ids) => setMembershipId(ids[0] || "")}
                                placeholder="Sélectionner un membre"
                                accentColor="primary"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="year">Année *</Label>
                                <Input
                                    id="year"
                                    type="number"
                                    min="1900"
                                    max="3000"
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="total_days">Jours alloués *</Label>
                                <Input
                                    id="total_days"
                                    type="number"
                                    min="0"
                                    max={DEFAULT_MAX_DAYS}
                                    step="0.5"
                                    value={totalDays}
                                    onChange={(e) => setTotalDays(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 justify-end border-t">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={createBalance.isPending}
                                className="gap-2"
                            >
                                {createBalance.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Créer le solde
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </FormPageLayout>
    );
}
