"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { PermissionGuard } from "@/components/permissions";
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
import { useCurrencyFormatter } from "@/lib/hooks";
import {
    useCategories,
    useDeleteProduct,
    useDeleteProductImage,
    useProduct,
    useUpdateProduct,
    useUploadProductImage,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { ProductUnit, UpdateProductData } from "@/lib/types";
import { PRODUCT_UNITS } from "@/lib/types/inventory";
import {
    Barcode,
    Box,
    DollarSign,
    FileText,
    ImageIcon,
    Loader2,
    Percent,
    Save,
    Tags,
    Trash2,
    TrendingDown,
    Upload,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export default function ProductDetailPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.PRODUCTS.MANAGE}>
            <ProductDetailPage />
        </PermissionGuard>
    );
}

function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const productId = params.productId as string;
    const { formatCurrency } = useCurrencyFormatter();
    const imageInputRef = useRef<HTMLInputElement>(null);

    const { data: product, isLoading } = useProduct(orgId, productId);
    const { data: allCategories = [] } = useCategories(orgId, {
        page_size: "all",
    });
    const updateProduct = useUpdateProduct();
    const deleteProduct = useDeleteProduct();
    const uploadImage = useUploadProductImage();
    const deleteImage = useDeleteProductImage();

    const [formData, setFormData] = useState<UpdateProductData>({});
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                sku: product.sku,
                barcode: product.barcode,
                category_id: product.category?.id ?? null,
                description: product.description,
                unit: product.unit,
                purchase_price: product.purchase_price,
                selling_price: product.selling_price,
                tax_rate: product.tax_rate,
                min_stock_level: product.min_stock_level,
                track_stock: product.track_stock,
                is_active: product.is_active,
            });
        }
    }, [product]);

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
        try {
            await updateProduct.mutateAsync({ orgId, productId, data: formData });
            toast.success("Produit mis à jour.");
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.sku?.[0] ||
                    error?.data?.detail ||
                    error?.message ||
                    "Impossible de mettre à jour",
            });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteProduct.mutateAsync({ orgId, productId });
            toast.success("Produit supprimé.");
            router.push(`/organisation/${orgId}/inventory/products`);
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.detail ||
                    error?.message ||
                    "Impossible de supprimer",
            });
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await uploadImage.mutateAsync({ orgId, productId, file });
            toast.success("Image mise à jour.");
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.message || "Upload impossible",
            });
        } finally {
            if (imageInputRef.current) imageInputRef.current.value = "";
        }
    };

    const handleImageDelete = async () => {
        try {
            await deleteImage.mutateAsync({ orgId, productId });
            toast.success("Image supprimée.");
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.message || "Suppression impossible",
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

    if (!product) {
        return (
            <div className="container mx-auto p-6">
                <p className="text-destructive">Produit introuvable.</p>
            </div>
        );
    }

    return (
        <FormPageLayout
            title={`Produit — ${product.name}`}
            subtitle={`SKU: ${product.sku}`}
            backLink={`/organisation/${orgId}/inventory/products`}
            sidebar={
                <div className="space-y-4">
                    {/* Image */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <ImageIcon className="h-4 w-4" />
                                Image du produit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {product.image_url ? (
                                <div className="relative">
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-full aspect-square object-cover rounded-md border"
                                    />
                                </div>
                            ) : (
                                <div className="w-full aspect-square bg-muted flex items-center justify-center rounded-md">
                                    <Box className="h-12 w-12 text-muted-foreground/50" />
                                </div>
                            )}
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                            />
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 gap-2"
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={uploadImage.isPending}
                                >
                                    {uploadImage.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Upload className="h-4 w-4" />
                                    )}
                                    {product.image_url ? "Remplacer" : "Ajouter"}
                                </Button>
                                {product.image_url && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleImageDelete}
                                        disabled={deleteImage.isPending}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Infos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Informations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {product.category && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Catégorie</p>
                                    <Badge variant="outline" className="font-normal mt-1">
                                        {product.category.name}
                                    </Badge>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-muted-foreground">Prix de vente</p>
                                <p className="text-lg font-bold">
                                    {formatCurrency(Number(product.selling_price))}
                                    <span className="text-xs text-muted-foreground ml-1 font-normal">
                                        / {product.unit_display.toLowerCase()}
                                    </span>
                                </p>
                            </div>
                            {Number(product.purchase_price) > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground">Marge brute</p>
                                    <p className="font-medium">
                                        {formatCurrency(Number(product.margin))}
                                        {product.margin_rate && (
                                            <span className="text-xs text-muted-foreground ml-2">
                                                ({product.margin_rate}%)
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                            <AuditFootprint
                                created_at={product.created_at}
                                updated_at={product.updated_at}
                                created_by_info={product.created_by_info ?? null}
                                updated_by_info={product.updated_by_info ?? null}
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
                            >
                                <Trash2 className="h-4 w-4" /> Supprimer le produit
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Modifier le produit</CardTitle>
                    <CardDescription>
                        Caractéristiques, prix et stock
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">Nom *</Label>
                                <div className="relative">
                                    <Box className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                                <Label htmlFor="sku">SKU *</Label>
                                <Input
                                    id="sku"
                                    value={formData.sku || ""}
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
                                        value={formData.unit || "piece"}
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
                                        placeholder="Aucune catégorie"
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
                                        Taxe (%)
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
                                            Désactiver pour les services.
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
                                        Un produit inactif n'est plus proposé.
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
                                disabled={updateProduct.isPending}
                                className="gap-2"
                            >
                                {updateProduct.isPending ? (
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
                        <DialogTitle>Supprimer le produit</DialogTitle>
                        <DialogDescription>
                            Voulez-vous supprimer{" "}
                            <span className="font-semibold">{product.name}</span> ? Cette
                            action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDelete(false)}>
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteProduct.isPending}
                            className="gap-2"
                        >
                            {deleteProduct.isPending && (
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
