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
import { Switch } from "@/components/ui/switch";
import { usePaginatedMembers } from "@/lib/hooks/hr";
import { useCreateWarehouse } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { CreateWarehouseData } from "@/lib/types";
import {
    Building,
    FileText,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    User,
    Warehouse as WarehouseIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function CreateWarehousePageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.WAREHOUSES.MANAGE}>
            <CreateWarehousePage />
        </PermissionGuard>
    );
}

function CreateWarehousePage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;

    const [formData, setFormData] = useState<CreateWarehouseData>({
        name: "",
        code: "",
        manager_id: null,
        description: "",
        address: "",
        city: "",
        country: "",
        phone: "",
        email: "",
        is_default: false,
        is_active: true,
    });

    const { data: membersList = [] } = usePaginatedMembers(orgId, {}, {
        pageSize: 100,
    });
    const createWarehouse = useCreateWarehouse();

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
        if (!formData.name || !formData.code) {
            toast("Champs manquants", {
                description: "Le nom et le code sont obligatoires.",
            });
            return;
        }
        try {
            await createWarehouse.mutateAsync({ orgId, data: formData });
            toast.success("Entrepôt créé avec succès !");
            router.push(`/organisation/${orgId}/inventory/warehouses`);
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.code?.[0] ||
                    error?.data?.name?.[0] ||
                    error?.data?.detail ||
                    error?.message ||
                    "Impossible de créer l'entrepôt",
            });
        }
    };

    return (
        <FormPageLayout
            title="Créer un entrepôt"
            subtitle="Configurez un nouvel emplacement physique de stockage"
            backLink={`/organisation/${orgId}/inventory/warehouses`}
            sidebar={
                <Card>
                    <CardHeader>
                        <CardTitle>Aperçu</CardTitle>
                        <CardDescription>Résumé de l'entrepôt</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Identité</p>
                            <p className="text-sm text-primary font-medium flex items-center gap-2">
                                <WarehouseIcon className="h-4 w-4" />
                                {formData.name || "Nouvel entrepôt"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formData.code || "Code…"}
                            </p>
                        </div>
                        <div className="space-y-2 pt-4 border-t">
                            <p className="text-sm font-medium">Localisation</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {[formData.city, formData.country]
                                    .filter(Boolean)
                                    .join(", ") || "—"}
                            </p>
                        </div>
                        <div className="space-y-2 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Statut</p>
                                <span
                                    className={`text-xs px-2 py-0.5 ${formData.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                                >
                                    {formData.is_active ? "Actif" : "Inactif"}
                                </span>
                            </div>
                            {formData.is_default && (
                                <p className="text-xs text-primary mt-1">
                                    Cet entrepôt sera utilisé par défaut.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Détails de l'entrepôt</CardTitle>
                    <CardDescription>
                        Renseignez les informations logistiques
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
                                        placeholder="Ex: Entrepôt Central"
                                        value={formData.name}
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
                                    placeholder="WH-001"
                                    value={formData.code}
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
                                    <Label htmlFor="city">Ville</Label>
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
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            value={formData.phone || ""}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phone: e.target.value })
                                            }
                                            className="pl-10"
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
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>Manager (optionnel)</Label>
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
                                    placeholder="Rechercher un membre"
                                    accentColor="blue"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex flex-row items-center justify-between border p-4 rounded-md">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Entrepôt par défaut</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Utilisé automatiquement pour les opérations (vente
                                        rapide, approvisionnement).
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
                                        Un entrepôt inactif n'est pas proposé dans les sélections.
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
                                disabled={createWarehouse.isPending}
                                className="gap-2"
                            >
                                {createWarehouse.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Créer l'entrepôt
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </FormPageLayout>
    );
}
