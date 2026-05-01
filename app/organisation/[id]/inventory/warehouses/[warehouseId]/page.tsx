"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { PermissionGuard, useOrgPermissions } from "@/components/permissions";
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
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import { Switch } from "@/components/ui/switch";
import { usePaginatedMembers } from "@/lib/hooks/hr";
import {
    useDeleteWarehouse,
    useUpdateWarehouse,
    useWarehouse,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { UpdateWarehouseData } from "@/lib/types";
import {
    Building,
    CheckCircle2,
    FileText,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    Trash2,
    User,
    Warehouse as WarehouseIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function WarehouseDetailPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.WAREHOUSES.MANAGE}>
            <WarehouseDetailPage />
        </PermissionGuard>
    );
}

function WarehouseDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const warehouseId = params.warehouseId as string;

    const { data: warehouse, isLoading } = useWarehouse(orgId, warehouseId);
    const { data: membersList = [] } = usePaginatedMembers(orgId, {}, {
        pageSize: 100,
    });
    const updateWarehouse = useUpdateWarehouse();
    const deleteWarehouse = useDeleteWarehouse();

    const [formData, setFormData] = useState<UpdateWarehouseData>({});
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (warehouse) {
            setFormData({
                name: warehouse.name,
                code: warehouse.code,
                manager_id: warehouse.manager?.id ?? null,
                description: warehouse.description,
                address: warehouse.address,
                city: warehouse.city,
                country: warehouse.country,
                phone: warehouse.phone,
                email: warehouse.email,
                is_default: warehouse.is_default,
                is_active: warehouse.is_active,
            });
        }
    }, [warehouse]);

    const managerItems: SmartSelectorItem[] = useMemo(
        () =>
            (membersList as any[]).map((m) => ({
                id: m.id,
                name: `${m.employee.user.first_name} ${m.employee.user.last_name}`,
                subtitle: m.employee.user.email,
                icon: User,
            })),
        [membersList]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateWarehouse.mutateAsync({
                orgId,
                warehouseId,
                data: formData,
            });
            toast.success("Entrepôt mis à jour.");
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.detail ||
                    error?.message ||
                    "Impossible de mettre à jour l'entrepôt",
            });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteWarehouse.mutateAsync({ orgId, warehouseId });
            toast.success("Entrepôt supprimé.");
            router.push(`/organisation/${orgId}/inventory/warehouses`);
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.error ||
                    error?.message ||
                    "Impossible de supprimer l'entrepôt",
            });
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto p-6 space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!warehouse) {
        return (
            <div className="container mx-auto p-6">
                <p className="text-destructive">Entrepôt introuvable.</p>
            </div>
        );
    }

    return (
        <FormPageLayout
            title={`Entrepôt — ${warehouse.name}`}
            subtitle={warehouse.code}
            backLink={`/organisation/${orgId}/inventory/warehouses`}
            sidebar={
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <WarehouseIcon className="h-4 w-4" />
                                Informations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {warehouse.is_default && (
                                <Badge variant="secondary" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Entrepôt par défaut
                                </Badge>
                            )}
                            <div>
                                <p className="text-xs text-muted-foreground">Code</p>
                                <p className="font-medium">{warehouse.code}</p>
                            </div>
                            {(warehouse.city || warehouse.country) && (
                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Localisation
                                    </p>
                                    <p>
                                        {[warehouse.city, warehouse.country]
                                            .filter(Boolean)
                                            .join(", ")}
                                    </p>
                                </div>
                            )}
                            {warehouse.manager && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Manager</p>
                                    <p>
                                        {warehouse.manager.first_name}{" "}
                                        {warehouse.manager.last_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {warehouse.manager.email}
                                    </p>
                                </div>
                            )}
                            <AuditFootprint
                                created_at={warehouse.created_at}
                                updated_at={warehouse.updated_at}
                                created_by_info={warehouse.created_by_info ?? null}
                                updated_by_info={warehouse.updated_by_info ?? null}
                                className="pt-3 border-t"
                            />
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/30">
                        <CardHeader>
                            <CardTitle className="text-sm text-destructive">
                                Zone de danger
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="w-full gap-2"
                                onClick={() => setShowDelete(true)}
                                disabled={warehouse.is_default}
                            >
                                <Trash2 className="h-4 w-4" /> Supprimer l'entrepôt
                            </Button>
                            {warehouse.is_default && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Désignez un autre entrepôt par défaut avant de supprimer
                                    celui-ci.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Modifier l'entrepôt</CardTitle>
                    <CardDescription>
                        Ajustez les informations et coordonnées
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom *</Label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        value={formData.name || ""}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Code *</Label>
                                <Input
                                    id="code"
                                    value={formData.code || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            code: e.target.value.toUpperCase(),
                                        })
                                    }
                                    required
                                    maxLength={20}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <textarea
                                        id="description"
                                        rows={2}
                                        value={formData.description || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        className="flex w-full border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-10 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <p className="text-sm font-semibold">Coordonnées</p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Adresse</Label>
                                    <Input
                                        id="address"
                                        value={formData.address || ""}
                                        onChange={(e) =>
                                            setFormData({ ...formData, address: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">
                                        <MapPin className="inline h-3.5 w-3.5 mr-1" /> Ville
                                    </Label>
                                    <Input
                                        id="city"
                                        value={formData.city || ""}
                                        onChange={(e) =>
                                            setFormData({ ...formData, city: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country">Pays</Label>
                                    <Input
                                        id="country"
                                        value={formData.country || ""}
                                        onChange={(e) =>
                                            setFormData({ ...formData, country: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                        <Phone className="inline h-3.5 w-3.5 mr-1" /> Téléphone
                                    </Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone || ""}
                                        onChange={(e) =>
                                            setFormData({ ...formData, phone: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        <Mail className="inline h-3.5 w-3.5 mr-1" /> Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email || ""}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>Manager</Label>
                                <SmartSelector
                                    items={managerItems}
                                    selectedIds={
                                        formData.manager_id ? [formData.manager_id] : []
                                    }
                                    onChange={(ids) =>
                                        setFormData({
                                            ...formData,
                                            manager_id: ids[0] || null,
                                        })
                                    }
                                    placeholder="Aucun manager"
                                    accentColor="blue"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex flex-row items-center justify-between border p-4 rounded-md">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Entrepôt par défaut</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Utilisé automatiquement pour les opérations.
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.is_default ?? false}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_default: checked })
                                    }
                                />
                            </div>
                            <div className="flex flex-row items-center justify-between border p-4 rounded-md">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Actif</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Un entrepôt inactif n'est plus proposé dans les sélections.
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.is_active ?? true}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_active: checked })
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateWarehouse.isPending}
                                className="gap-2"
                            >
                                {updateWarehouse.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Enregistrer
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer l'entrepôt</DialogTitle>
                        <DialogDescription>
                            Voulez-vous supprimer l'entrepôt{" "}
                            <span className="font-semibold">{warehouse.name}</span> ?
                            Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDelete(false)}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteWarehouse.isPending}
                            className="gap-2"
                        >
                            {deleteWarehouse.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </FormPageLayout>
    );
}
