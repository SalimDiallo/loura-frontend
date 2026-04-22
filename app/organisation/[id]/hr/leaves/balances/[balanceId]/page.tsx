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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
    useDeleteLeaveBalance,
    useLeaveBalance,
    useUpdateLeaveBalance,
} from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function getMemberName(m: any) {
    return `${m?.employee?.user?.first_name || ""} ${m?.employee?.user?.last_name || ""}`.trim();
}

export default function EditLeaveBalancePageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.LEAVES.MANAGE_BALANCES}>
            <EditLeaveBalancePage />
        </PermissionGuard>
    );
}

function EditLeaveBalancePage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const balanceId = params.balanceId as string;

    const { data: balance, isLoading, error } = useLeaveBalance(orgId, balanceId);
    const updateBalance = useUpdateLeaveBalance();
    const deleteBalance = useDeleteLeaveBalance();

    const [totalDays, setTotalDays] = useState("");
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (balance?.total_days) {
            setTotalDays(balance.total_days);
        }
    }, [balance?.total_days]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!balance) return;
        const days = Number(totalDays);
        if (!days || days <= 0) {
            toast.error("Le nombre de jours doit être supérieur à 0.");
            return;
        }
        if (days > balance.max_days) {
            toast.error(`Le solde ne peut pas dépasser ${balance.max_days} jours.`);
            return;
        }
        if (days < Number(balance.used_days)) {
            toast.error(
                `Impossible : ${Number(balance.used_days).toFixed(1)} jour(s) déjà consommés.`,
            );
            return;
        }

        try {
            await updateBalance.mutateAsync({
                orgId,
                balanceId,
                data: { total_days: totalDays },
            });
            toast.success("Solde mis à jour.");
            router.push(`/organisation/${orgId}/hr/leaves`);
        } catch (error: any) {
            const payload = error?.data;
            let msg = error.message || "Impossible de mettre à jour";
            if (payload) {
                if (typeof payload === "string") msg = payload;
                else if (payload.detail) msg = payload.detail;
                else msg = JSON.stringify(payload);
            }
            toast.error("Erreur", { description: msg });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteBalance.mutateAsync({ orgId, balanceId });
            toast.success("Solde supprimé.");
            router.push(`/organisation/${orgId}/hr/leaves`);
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.data?.detail || error.message || "Action impossible",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (error || !balance) {
        return (
            <div className="container mx-auto p-6">
                <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                    {error?.message || "Solde introuvable"}
                </div>
            </div>
        );
    }

    return (
        <FormPageLayout
            title={`Solde ${balance.year}`}
            subtitle={getMemberName(balance.membership)}
            backLink={`/organisation/${orgId}/hr/leaves`}
            sidebar={
                <Card>
                    <CardHeader>
                        <CardTitle>État du solde</CardTitle>
                        <CardDescription>Consommation actuelle</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                                Total alloué
                            </p>
                            <p className="text-lg font-bold">
                                {Number(balance.total_days).toFixed(1)} j
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                                Consommés
                            </p>
                            <p className="text-sm">{Number(balance.used_days).toFixed(1)} j</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-medium uppercase text-muted-foreground">
                                Restants
                            </p>
                            <p className="text-lg font-semibold text-primary">
                                {Number(balance.remaining_days).toFixed(1)} j
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground italic pt-3 border-t">
                            Limite maximale : {balance.max_days} jours par an.
                        </p>
                    </CardContent>
                </Card>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Modifier le solde</CardTitle>
                    <CardDescription>
                        Seul le total alloué est modifiable. Le nouveau total ne peut pas être
                        inférieur aux jours déjà consommés.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="total_days">Jours alloués *</Label>
                            <Input
                                id="total_days"
                                type="number"
                                min={Number(balance.used_days)}
                                max={balance.max_days}
                                step="0.5"
                                value={totalDays}
                                onChange={(e) => setTotalDays(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Minimum : {Number(balance.used_days).toFixed(1)} (jours déjà utilisés)
                                — Maximum : {balance.max_days}
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4 justify-between border-t">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setShowDelete(true)}
                                className="gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                            </Button>
                            <div className="flex gap-3">
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    Annuler
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={updateBalance.isPending}
                                    className="gap-2"
                                >
                                    {updateBalance.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Enregistrer
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer ce solde ?</DialogTitle>
                        <DialogDescription>
                            Cette action est irréversible. Le solde {balance.year} de{" "}
                            {getMemberName(balance.membership)} sera définitivement supprimé.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDelete(false)}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteBalance.isPending}
                            className="gap-2"
                        >
                            {deleteBalance.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Confirmer la suppression
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </FormPageLayout>
    );
}
