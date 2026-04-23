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
import {
    useCreatePhysicalInventory,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { Warehouse } from "@/lib/types";
import { Loader2, Save, Warehouse as WarehouseIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaClipboardCheck } from "react-icons/fa";
import { toast } from "sonner";

export default function CreatePhysicalInventoryPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.STOCK.MANAGE}>
            <CreatePhysicalInventoryPage />
        </PermissionGuard>
    );
}

function CreatePhysicalInventoryPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;

    const today = new Date().toISOString().split("T")[0];

    const [warehouseId, setWarehouseId] = useState<string>("");
    const [countDate, setCountDate] = useState<string>(today);
    const [notes, setNotes] = useState<string>("");

    const { data: warehousesList = [] } = useWarehouses(orgId, {
        page_size: "all",
        is_active: "true",
    });
    const warehouses = useMemo(
        () => (warehousesList as unknown as Warehouse[]) ?? [],
        [warehousesList]
    );

    const createMutation = useCreatePhysicalInventory();

    const canSubmit = !!warehouseId && !!countDate && !createMutation.isPending;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        try {
            const result = await createMutation.mutateAsync({
                orgId,
                data: {
                    warehouse_id: warehouseId,
                    count_date: countDate,
                    notes: notes || undefined,
                },
            });
            toast.success(result.message ?? "Inventaire créé.");
            router.push(
                `/organisation/${orgId}/inventory/physical-inventories/${result.data.id}`
            );
        } catch (err: any) {
            toast.error(
                err?.response?.data?.error ??
                    err?.message ??
                    "Impossible de créer l'inventaire."
            );
        }
    };

    return (
        <FormPageLayout
            title="Nouvel inventaire physique"
            subtitle="Démarrer une session de comptage pour un entrepôt"
            backLink={`/organisation/${orgId}/inventory/physical-inventories`}
        >
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FaClipboardCheck className="h-5 w-5" />
                        Informations générales
                    </CardTitle>
                    <CardDescription>
                        Sélectionnez l'entrepôt à inventorier. Les produits seront
                        chargés automatiquement depuis le stock après la création.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="warehouse">
                                    Entrepôt <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <WarehouseIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <select
                                        id="warehouse"
                                        value={warehouseId}
                                        onChange={(e) =>
                                            setWarehouseId(e.target.value)
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
                                        required
                                    >
                                        <option value="">Sélectionner…</option>
                                        {warehouses.map((w) => (
                                            <option key={w.id} value={w.id}>
                                                {w.name}
                                                {w.code ? ` (${w.code})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="count_date">
                                    Date du comptage{" "}
                                    <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="count_date"
                                    type="date"
                                    value={countDate}
                                    onChange={(e) =>
                                        setCountDate(e.target.value)
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (optionnel)</Label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Contexte, raison, équipe de comptage…"
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.push(
                                        `/organisation/${orgId}/inventory/physical-inventories`
                                    )
                                }
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={!canSubmit}>
                                {createMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                Créer l'inventaire
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </FormPageLayout>
    );
}
