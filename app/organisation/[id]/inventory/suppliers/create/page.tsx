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
import { Switch } from "@/components/ui/switch";
import { useCreateSupplier } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { CreateSupplierData } from "@/lib/types";
import {
    Building,
    FileText,
    Hash,
    Loader2,
    Mail,
    MapPin,
    Phone,
    Save,
    Truck,
    User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

export default function CreateSupplierPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.SUPPLIERS.MANAGE}>
            <CreateSupplierPage />
        </PermissionGuard>
    );
}

function CreateSupplierPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;

    const [formData, setFormData] = useState<CreateSupplierData>({
        name: "",
        code: "",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        tax_id: "",
        payment_terms_days: 30,
        notes: "",
        is_active: true,
    });

    const createSupplier = useCreateSupplier();

    const handleActiveSwitch = useCallback((checked: boolean) => {
        setFormData((prev) => ({ ...prev, is_active: checked }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast("Champ manquant", {
                description: "Le nom du fournisseur est obligatoire.",
            });
            return;
        }
        try {
            await createSupplier.mutateAsync({ orgId, data: formData });
            toast.success("Fournisseur créé avec succès.");
            router.push(`/organisation/${orgId}/inventory/suppliers`);
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.name?.[0] ||
                    error?.data?.code?.[0] ||
                    error?.data?.detail ||
                    error?.message ||
                    "Impossible de créer le fournisseur",
            });
        }
    };

    return (
        <FormPageLayout
            title="Nouveau fournisseur"
            subtitle="Ajoutez une source d'approvisionnement à votre organisation"
            backLink={`/organisation/${orgId}/inventory/suppliers`}
            sidebar={
                <Card>
                    <CardHeader>
                        <CardTitle>Aperçu</CardTitle>
                        <CardDescription>Résumé du fournisseur</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Identité</p>
                            <p className="text-sm text-primary font-medium flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                {formData.name || "Nouveau fournisseur"}
                            </p>
                            {formData.code && (
                                <p className="text-xs text-muted-foreground">
                                    {formData.code}
                                </p>
                            )}
                        </div>
                        {formData.contact_name && (
                            <div className="space-y-2 pt-4 border-t">
                                <p className="text-sm font-medium">Contact</p>
                                <p className="text-sm text-muted-foreground">
                                    {formData.contact_name}
                                </p>
                            </div>
                        )}
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
                            <p className="text-sm font-medium">Conditions</p>
                            <p className="text-sm text-muted-foreground">
                                Paiement à {formData.payment_terms_days ?? 30} jours
                            </p>
                        </div>
                    </CardContent>
                </Card>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Informations fournisseur</CardTitle>
                    <CardDescription>
                        Renseignez les coordonnées et conditions commerciales
                    </CardDescription>
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
                                        placeholder="Ex: Société Globex"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                name: e.target.value,
                                            })
                                        }
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Code interne</Label>
                                <Input
                                    id="code"
                                    placeholder="FOUR-001 (optionnel)"
                                    value={formData.code || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            code: e.target.value.toUpperCase(),
                                        })
                                    }
                                    maxLength={30}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tax_id">NIF / TVA</Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="tax_id"
                                        placeholder="Identifiant fiscal"
                                        value={formData.tax_id || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                tax_id: e.target.value,
                                            })
                                        }
                                        className="pl-10"
                                        maxLength={50}
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
                                    placeholder="30"
                                    value={formData.payment_terms_days ?? 30}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            payment_terms_days:
                                                parseInt(e.target.value || "0", 10) || 0,
                                        })
                                    }
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
                                    <Input
                                        id="address"
                                        value={formData.address || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                address: e.target.value,
                                            })
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
                                        maxLength={100}
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
                                    placeholder="Particularités commerciales, conditions négociées..."
                                    value={formData.notes || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, notes: e.target.value })
                                    }
                                    className="flex w-full border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-10 rounded-md"
                                />
                            </div>
                        </div>

                        <div className="flex flex-row items-center justify-between border p-4 rounded-md">
                            <div className="space-y-0.5">
                                <Label className="text-base">Actif</Label>
                                <p className="text-sm text-muted-foreground">
                                    Un fournisseur inactif n'apparaît plus dans les sélections.
                                </p>
                            </div>
                            <Switch
                                checked={!!formData.is_active}
                                onCheckedChange={handleActiveSwitch}
                            />
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
                                disabled={createSupplier.isPending}
                                className="gap-2"
                            >
                                {createSupplier.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Créer le fournisseur
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </FormPageLayout>
    );
}
