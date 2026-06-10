"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { AuditFootprint } from "@/components/services/AuditBadge";
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
import { Switch } from "@/components/ui/switch";
import {
    useDeleteSupplier,
    useSupplier,
    useUpdateSupplier,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { UpdateSupplierData } from "@/lib/types";
import {
    Building,
    FileText,
    Hash,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    Trash2,
    Truck,
    User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function SupplierDetailPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.SUPPLIERS.VIEW}>
            <SupplierDetailPage />
        </PermissionGuard>
    );
}

function SupplierDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const supplierId = params.supplierId as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.SUPPLIERS.MANAGE);
    const canViewPurchaseOrders = can(PERMISSIONS.PURCHASE_ORDERS.VIEW);

    const { data: supplier, isLoading } = useSupplier(orgId, supplierId);
    const updateSupplier = useUpdateSupplier();
    const deleteSupplier = useDeleteSupplier();

    const [formData, setFormData] = useState<UpdateSupplierData>({});
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name,
                code: supplier.code,
                contact_name: supplier.contact_name,
                email: supplier.email,
                phone: supplier.phone,
                address: supplier.address,
                city: supplier.city,
                country: supplier.country,
                tax_id: supplier.tax_id,
                payment_terms_days: supplier.payment_terms_days,
                notes: supplier.notes,
                is_active: supplier.is_active,
            });
        }
    }, [supplier]);

    const handleActiveSwitch = useCallback((checked: boolean) => {
        setFormData((prev) => ({ ...prev, is_active: checked }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateSupplier.mutateAsync({
                orgId,
                id: supplierId,
                data: formData,
            });
            toast.success("Fournisseur mis à jour.");
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.name?.[0] ||
                    error?.data?.code?.[0] ||
                    error?.data?.detail ||
                    error?.message ||
                    "Impossible de mettre à jour",
            });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteSupplier.mutateAsync({ orgId, id: supplierId });
            toast.success("Fournisseur supprimé.");
            router.push(`/organisation/${orgId}/inventory/suppliers`);
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.detail ||
                    error?.message ||
                    "Impossible de supprimer",
            });
        }
    };

    if (isLoading || !supplier) {
        return (
            <div className="container mx-auto p-6 space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        );
    }

    return (
        <>
            <FormPageLayout
                title={supplier.name}
                subtitle={
                    supplier.code
                        ? `Code : ${supplier.code}`
                        : "Informations fournisseur"
                }
                backLink={`/organisation/${orgId}/inventory/suppliers`}
                sidebar={
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Identité</p>
                                <p className="text-sm text-primary font-medium flex items-center gap-2">
                                    <Truck className="h-4 w-4" />
                                    {supplier.name}
                                </p>
                                {supplier.code && (
                                    <p className="text-xs text-muted-foreground">
                                        {supplier.code}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2 pt-4 border-t">
                                <p className="text-sm font-medium">Conditions</p>
                                <p className="text-sm text-muted-foreground">
                                    Paiement à {supplier.payment_terms_days} jours
                                </p>
                            </div>
                            <div className="space-y-2 pt-4 border-t">
                                <p className="text-sm font-medium">Activité</p>
                                <p className="text-xs text-muted-foreground">
                                    {supplier.purchase_orders_count} commande(s)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Encours : {supplier.outstanding_amount}
                                </p>
                                {canViewPurchaseOrders && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full gap-2 mt-1"
                                        onClick={() =>
                                            router.push(
                                                `/organisation/${orgId}/inventory/suppliers/${supplierId}/purchase-orders`
                                            )
                                        }
                                    >
                                        <Truck className="h-4 w-4" />
                                        Voir les approvisionnements
                                    </Button>
                                )}
                            </div>
                            <AuditFootprint
                                created_at={supplier.created_at}
                                updated_at={supplier.updated_at}
                                created_by_info={supplier.created_by_info ?? null}
                                updated_by_info={supplier.updated_by_info ?? null}
                                className="pt-3 border-t"
                            />
                        </CardContent>
                    </Card>
                }
            >
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Modifier le fournisseur</CardTitle>
                            <CardDescription>
                                Mettez à jour les coordonnées et conditions
                            </CardDescription>
                        </div>
                        {canManage && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setShowDelete(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Raison sociale *</Label>
                                    <div className="relative">
                                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            value={formData.name || ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    name: e.target.value,
                                                })
                                            }
                                            className="pl-10"
                                            disabled={!canManage}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Code interne</Label>
                                    <Input
                                        id="code"
                                        value={formData.code || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                code: e.target.value.toUpperCase(),
                                            })
                                        }
                                        maxLength={30}
                                        disabled={!canManage}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tax_id">NIF / TVA</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="tax_id"
                                            value={formData.tax_id || ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    tax_id: e.target.value,
                                                })
                                            }
                                            className="pl-10"
                                            maxLength={50}
                                            disabled={!canManage}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="payment_terms_days">
                                        Délai de paiement (jours)
                                    </Label>
                                    <Input
                                        id="payment_terms_days"
                                        type="number"
                                        min="0"
                                        value={formData.payment_terms_days ?? 30}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                payment_terms_days:
                                                    parseInt(e.target.value || "0", 10) || 0,
                                            })
                                        }
                                        disabled={!canManage}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <p className="text-sm font-semibold">Contact</p>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="contact_name">Nom du contact</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="contact_name"
                                                value={formData.contact_name || ""}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        contact_name: e.target.value,
                                                    })
                                                }
                                                className="pl-10"
                                                maxLength={150}
                                                disabled={!canManage}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email || ""}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        email: e.target.value,
                                                    })
                                                }
                                                className="pl-10"
                                                disabled={!canManage}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Téléphone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="phone"
                                                value={formData.phone || ""}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        phone: e.target.value,
                                                    })
                                                }
                                                className="pl-10"
                                                maxLength={30}
                                                disabled={!canManage}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <p className="text-sm font-semibold">Adresse</p>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="address">Adresse</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                            <textarea
                                                id="address"
                                                rows={2}
                                                value={formData.address || ""}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        address: e.target.value,
                                                    })
                                                }
                                                className="flex w-full border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-10 rounded-md"
                                                disabled={!canManage}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Ville</Label>
                                        <Input
                                            id="city"
                                            value={formData.city || ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    city: e.target.value,
                                                })
                                            }
                                            maxLength={100}
                                            disabled={!canManage}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="country">Pays</Label>
                                        <Input
                                            id="country"
                                            value={formData.country || ""}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    country: e.target.value,
                                                })
                                            }
                                            maxLength={100}
                                            disabled={!canManage}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t">
                                <Label htmlFor="notes">Notes</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <textarea
                                        id="notes"
                                        rows={3}
                                        value={formData.notes || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                notes: e.target.value,
                                            })
                                        }
                                        className="flex w-full border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-10 rounded-md"
                                        disabled={!canManage}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-row items-center justify-between border p-4 rounded-md">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Actif</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Désactivez pour masquer ce fournisseur dans les
                                        sélections.
                                    </p>
                                </div>
                                <Switch
                                    checked={!!formData.is_active}
                                    onCheckedChange={handleActiveSwitch}
                                    disabled={!canManage}
                                />
                            </div>

                            {canManage && (
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
                                        disabled={updateSupplier.isPending}
                                        className="gap-2"
                                    >
                                        {updateSupplier.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        Enregistrer
                                    </Button>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </FormPageLayout>

            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer ce fournisseur ?</DialogTitle>
                        <DialogDescription>
                            Cette action est irréversible. Le fournisseur «{" "}
                            <span className="font-semibold">{supplier.name}</span> » sera
                            retiré de l'organisation.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDelete(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteSupplier.isPending}
                            className="gap-2"
                        >
                            {deleteSupplier.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
