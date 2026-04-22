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
import { Switch } from "@/components/ui/switch";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
    useCustomer,
    useDeleteCustomer,
    useUpdateCustomer,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { CustomerType, UpdateCustomerData } from "@/lib/types";
import {
    Building,
    DollarSign,
    FileText,
    Hash,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    Trash2,
    User,
    UserCheck,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ClientDetailPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.CUSTOMERS.VIEW}>
            <ClientDetailPage />
        </PermissionGuard>
    );
}

function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const clientId = params.clientId as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.CUSTOMERS.MANAGE);
    const { formatCurrency } = useCurrencyFormatter();

    const { data: customer, isLoading } = useCustomer(orgId, clientId);
    const updateCustomer = useUpdateCustomer();
    const deleteCustomer = useDeleteCustomer();

    const [formData, setFormData] = useState<UpdateCustomerData>({});
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({
                customer_type: customer.customer_type,
                name: customer.name,
                code: customer.code,
                contact_name: customer.contact_name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                city: customer.city,
                country: customer.country,
                tax_id: customer.tax_id,
                credit_limit: customer.credit_limit,
                payment_terms_days: customer.payment_terms_days,
                notes: customer.notes,
                is_active: customer.is_active,
            });
        }
    }, [customer]);

    const handleActiveSwitch = useCallback((checked: boolean) => {
        setFormData((prev) => ({ ...prev, is_active: checked }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateCustomer.mutateAsync({
                orgId,
                id: clientId,
                data: formData,
            });
            toast.success("Client mis à jour.");
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.name?.[0] ||
                    error?.data?.code?.[0] ||
                    error?.data?.detail ||
                    error?.message,
            });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteCustomer.mutateAsync({ orgId, id: clientId });
            toast.success("Client supprimé.");
            router.push(`/organisation/${orgId}/inventory/clients`);
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.data?.detail || error?.message,
            });
        }
    };

    if (isLoading || !customer) {
        return (
            <div className="container mx-auto p-6 space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        );
    }

    const isCompany = formData.customer_type === "company";
    const creditLimit = Number(formData.credit_limit || 0);

    return (
        <>
            <FormPageLayout
                title={customer.name}
                subtitle={customer.customer_type_display}
                backLink={`/organisation/${orgId}/inventory/clients`}
                sidebar={
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Identité</p>
                                <p className="text-sm text-primary font-medium flex items-center gap-2">
                                    {customer.customer_type === "company" ? (
                                        <Building className="h-4 w-4" />
                                    ) : (
                                        <User className="h-4 w-4" />
                                    )}
                                    {customer.name}
                                </p>
                                <Badge
                                    variant="outline"
                                    className={
                                        customer.customer_type === "company"
                                            ? "bg-blue-50 text-blue-700 border-blue-200"
                                            : "bg-violet-50 text-violet-700 border-violet-200"
                                    }
                                >
                                    {customer.customer_type_display}
                                </Badge>
                                {customer.code && (
                                    <p className="text-xs text-muted-foreground">
                                        {customer.code}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1 pt-4 border-t">
                                <p className="text-sm font-medium">Activité</p>
                                <p className="text-xs text-muted-foreground">
                                    {customer.sales_count} vente(s)
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Encours :{" "}
                                    {formatCurrency(Number(customer.outstanding_amount))}
                                </p>
                            </div>
                            <AuditFootprint
                                created_at={customer.created_at}
                                updated_at={customer.updated_at}
                                created_by_info={customer.created_by_info ?? null}
                                updated_by_info={customer.updated_by_info ?? null}
                                className="pt-3 border-t"
                            />
                        </CardContent>
                    </Card>
                }
            >
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Modifier le client</CardTitle>
                            <CardDescription>
                                Coordonnées et conditions commerciales
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
                            {/* Type */}
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <div className="grid gap-3 md:grid-cols-2">
                                    {[
                                        {
                                            value: "individual" as CustomerType,
                                            label: "Particulier",
                                            icon: User,
                                        },
                                        {
                                            value: "company" as CustomerType,
                                            label: "Entreprise",
                                            icon: Building,
                                        },
                                    ].map((opt) => {
                                        const Icon = opt.icon;
                                        const selected = formData.customer_type === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                disabled={!canManage}
                                                onClick={() =>
                                                    setFormData({
                                                        ...formData,
                                                        customer_type: opt.value,
                                                    })
                                                }
                                                className={`p-3 border-2 rounded-md text-left flex items-center gap-3 ${
                                                    selected
                                                        ? "border-primary bg-primary/5"
                                                        : "border-border hover:border-primary/50"
                                                } disabled:opacity-60`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                <span className="text-sm font-medium">
                                                    {opt.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="name">
                                        {isCompany ? "Raison sociale" : "Nom complet"} *
                                    </Label>
                                    <div className="relative">
                                        <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                                {isCompany && (
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
                                )}
                            </div>

                            {/* Contact */}
                            <div className="space-y-4 pt-4 border-t">
                                <p className="text-sm font-semibold">Contact</p>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {isCompany && (
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="contact_name">Contact principal</Label>
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
                                    )}
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

                            {/* Adresse */}
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

                            {/* Crédit */}
                            <div className="space-y-4 pt-4 border-t">
                                <p className="text-sm font-semibold">
                                    Conditions commerciales
                                </p>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="credit_limit">
                                            Crédit maximum autorisé
                                        </Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="credit_limit"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={String(formData.credit_limit ?? "0")}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        credit_limit: e.target.value,
                                                    })
                                                }
                                                className="pl-10"
                                                disabled={!canManage}
                                            />
                                        </div>
                                        {creditLimit === 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                0 = ventes au comptant uniquement
                                            </p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="payment_terms_days">
                                            Délai de paiement (jours)
                                        </Label>
                                        <Input
                                            id="payment_terms_days"
                                            type="number"
                                            min="0"
                                            value={formData.payment_terms_days ?? 0}
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
                                        Désactivez pour masquer ce client dans les sélections.
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
                                        disabled={updateCustomer.isPending}
                                        className="gap-2"
                                    >
                                        {updateCustomer.isPending ? (
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
                        <DialogTitle>Supprimer ce client ?</DialogTitle>
                        <DialogDescription>
                            Cette action est irréversible. Le client «{" "}
                            <span className="font-semibold">{customer.name}</span> » sera
                            retiré de votre portefeuille.
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
                            disabled={deleteCustomer.isPending}
                            className="gap-2"
                        >
                            {deleteCustomer.isPending ? (
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
