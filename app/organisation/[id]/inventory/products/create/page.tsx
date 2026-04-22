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
import { useCategories, useCreateProduct } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { CreateProductData, ProductUnit } from "@/lib/types";
import { PRODUCT_UNITS } from "@/lib/types/inventory";
import {
    Barcode,
    Box,
    DollarSign,
    FileText,
    Loader2,
    Percent,
    Save,
    Tags,
    TrendingDown,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function CreateProductPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.PRODUCTS.MANAGE}>
            <CreateProductPage />
        </PermissionGuard>
    );
}

function CreateProductPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;

    const [formData, setFormData] = useState<CreateProductData>({
        name: "",
        sku: "",
        barcode: "",
        category_id: null,
        description: "",
        unit: "piece",
        purchase_price: "0.00",
        selling_price: "0.00",
        tax_rate: "0.00",
        min_stock_level: "0.000",
        track_stock: true,
        is_active: true,
    });

    const { data: allCategories = [] } = useCategories(orgId, {
        page_size: "all",
    });
    const createProduct = useCreateProduct();

    const categoryItems: SmartSelectorItem[] = useMemo(
        () =>
            (allCategories as any[]).map((c) => ({
                id: c.id,
                name: c.name,
                subtitle: c.full_path,
                icon: Tags,
            })),
        [allCategories]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.sku) {
            toast("Champs manquants", {
                description: "Nom et SKU sont obligatoires.",
            });
            return;
        }
        try {
            await createProduct.mutateAsync({ orgId, data: formData });
            toast.success("Produit créé avec succès !");
            router.push(`/organisation/${orgId}/inventory/products`);
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.sku?.[0] ||
                    error?.data?.name?.[0] ||
                    error?.data?.detail ||
                    error?.message ||
                    "Impossible de créer le produit",
            });
        }
    };

    return (
        <FormPageLayout
            title="Créer un produit"
            subtitle="Ajoutez une nouvelle référence à votre catalogue"
            backLink={`/organisation/${orgId}/inventory/products`}
            sidebar={
                <Card>
                    <CardHeader>
                        <CardTitle>Aperçu</CardTitle>
                        <CardDescription>Résumé du produit</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-primary flex items-center gap-2">
                                <Box className="h-4 w-4" />
                                {formData.name || "Nouveau produit"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                SKU: {formData.sku || "…"}
                            </p>
                        </div>
                        <div className="pt-3 border-t space-y-1">
                            <p className="text-xs text-muted-foreground">Prix de vente</p>
                            <p className="text-lg font-bold">
                                {Number(formData.selling_price || 0).toLocaleString("fr-FR", {
                                    minimumFractionDigits: 2,
                                })}
                                <span className="text-xs text-muted-foreground ml-1">
                                    / {formData.unit}
                                </span>
                            </p>
                        </div>
                        {Number(formData.purchase_price) > 0 && (
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Marge brute
                                </p>
                                <p className="text-sm font-medium">
                                    {(
                                        Number(formData.selling_price || 0) -
                                        Number(formData.purchase_price || 0)
                                    ).toLocaleString("fr-FR", {
                                        minimumFractionDigits: 2,
                                    })}
                                </p>
                            </div>
                        )}
                        <div className="pt-3 border-t flex items-center justify-between">
                            <p className="text-sm font-medium">Statut</p>
                            <span
                                className={`text-xs px-2 py-0.5 ${formData.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                            >
                                {formData.is_active ? "Actif" : "Inactif"}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Informations produit</CardTitle>
                    <CardDescription>Caractéristiques, prix et stock</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">Nom du produit *</Label>
                                <div className="relative">
                                    <Box className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        placeholder="Ex: Coca-Cola 33cl"
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
                                <Label htmlFor="sku">SKU *</Label>
                                <Input
                                    id="sku"
                                    placeholder="COCA-33"
                                    value={formData.sku}
                                    onChange={(e) =>
                                        setFormData({ ...formData, sku: e.target.value })
                                    }
                                    required
                                    maxLength={64}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="barcode">
                                    <Barcode className="inline h-3.5 w-3.5 mr-1" />
                                    Code-barres
                                </Label>
                                <Input
                                    id="barcode"
                                    value={formData.barcode || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, barcode: e.target.value })
                                    }
                                    maxLength={64}
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
                            <p className="text-sm font-semibold">Classification</p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Unité *</Label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                unit: e.target.value as ProductUnit,
                                            })
                                        }
                                        className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        {PRODUCT_UNITS.map((u) => (
                                            <option key={u.value} value={u.value}>
                                                {u.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Catégorie</Label>
                                    <SmartSelector
                                        items={categoryItems}
                                        selectedIds={
                                            formData.category_id ? [formData.category_id] : []
                                        }
                                        onChange={(ids) =>
                                            setFormData({
                                                ...formData,
                                                category_id: ids[0] || null,
                                            })
                                        }
                                        placeholder="Sélectionner une catégorie"
                                        accentColor="primary"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <p className="text-sm font-semibold">Tarification</p>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="purchase_price">
                                        <DollarSign className="inline h-3.5 w-3.5 mr-1" />
                                        Prix d'achat
                                    </Label>
                                    <Input
                                        id="purchase_price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.purchase_price as string}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                purchase_price: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="selling_price">
                                        <DollarSign className="inline h-3.5 w-3.5 mr-1" />
                                        Prix de vente *
                                    </Label>
                                    <Input
                                        id="selling_price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.selling_price as string}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                selling_price: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tax_rate">
                                        <Percent className="inline h-3.5 w-3.5 mr-1" />
                                        Taux de taxe (%)
                                    </Label>
                                    <Input
                                        id="tax_rate"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={formData.tax_rate as string}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                tax_rate: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <p className="text-sm font-semibold">Stock</p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex flex-row items-center justify-between border p-4 rounded-md">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Suivi de stock</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Si désactivé, le produit ne suit pas de stock
                                            (service…).
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.track_stock ?? true}
                                        onCheckedChange={(checked) =>
                                            setFormData({
                                                ...formData,
                                                track_stock: checked,
                                            })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="min_stock_level">
                                        <TrendingDown className="inline h-3.5 w-3.5 mr-1" />
                                        Seuil d'alerte
                                    </Label>
                                    <Input
                                        id="min_stock_level"
                                        type="number"
                                        min="0"
                                        step="0.001"
                                        value={formData.min_stock_level as string}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                min_stock_level: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex flex-row items-center justify-between border p-4 rounded-md">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Actif</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Un produit inactif n'est plus proposé dans les
                                        sélections.
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
                                disabled={createProduct.isPending}
                                className="gap-2"
                            >
                                {createProduct.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Créer le produit
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </FormPageLayout>
    );
}
