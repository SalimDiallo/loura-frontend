"use client";

import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { PermissionGuard } from "@/components/permissions";
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
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import { Switch } from "@/components/ui/switch";
import {
    useCategories,
    useCategory,
    useDeleteCategory,
    useUpdateCategory,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { UpdateCategoryData } from "@/lib/types";
import { FileText, Loader2, Palette, Save, Tag, Tags, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function CategoryDetailPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.PRODUCT_CATEGORIES.MANAGE}>
            <CategoryDetailPage />
        </PermissionGuard>
    );
}

function CategoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const categoryId = params.categoryId as string;

    const { data: category, isLoading } = useCategory(orgId, categoryId);
    const { data: allCategories = [] } = useCategories(orgId, {
        page_size: "all",
    });
    const updateCategory = useUpdateCategory();
    const deleteCategory = useDeleteCategory();

    const [formData, setFormData] = useState<UpdateCategoryData>({
        name: "",
        description: "",
        parent_id: null,
        icon: "",
        color: "",
        is_active: true,
    });
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                description: category.description,
                parent_id: category.parent,
                icon: category.icon,
                color: category.color,
                is_active: category.is_active,
            });
        }
    }, [category]);

    const parentItems: SmartSelectorItem[] = useMemo(
        () =>
            (allCategories as any[])
                .filter((c) => c.id !== categoryId)
                .map((c) => ({
                    id: c.id,
                    name: c.name,
                    subtitle: c.full_path,
                    icon: Tags,
                })),
        [allCategories, categoryId]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            toast("Nom requis", { description: "Le nom est obligatoire." });
            return;
        }
        try {
            await updateCategory.mutateAsync({
                orgId,
                categoryId,
                data: formData,
            });
            toast.success("Catégorie mise à jour.");
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.name?.[0] ||
                    error?.data?.detail ||
                    error?.message ||
                    "Impossible de mettre à jour la catégorie",
            });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteCategory.mutateAsync({ orgId, categoryId });
            toast.success("Catégorie supprimée.");
            router.push(`/organisation/${orgId}/inventory/categories`);
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.error ||
                    error?.message ||
                    "Impossible de supprimer la catégorie",
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

    if (!category) {
        return (
            <div className="container mx-auto p-6">
                <p className="text-destructive">Catégorie introuvable.</p>
            </div>
        );
    }

    return (
        <FormPageLayout
            title={`Catégorie — ${category.name}`}
            subtitle={category.full_path}
            backLink={`/organisation/${orgId}/inventory/categories`}
            sidebar={
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations</CardTitle>
                            <CardDescription>
                                {category.products_count} produit
                                {category.products_count > 1 ? "s" : ""} ·{" "}
                                {category.children_count} sous-catégorie
                                {category.children_count > 1 ? "s" : ""}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">
                                    Chemin hiérarchique
                                </p>
                                <p className="font-medium">{category.full_path}</p>
                            </div>
                            <AuditFootprint
                                created_at={category.created_at}
                                updated_at={category.updated_at}
                                created_by_info={category.created_by_info ?? null}
                                updated_by_info={category.updated_by_info ?? null}
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
                                <Trash2 className="h-4 w-4" /> Supprimer la catégorie
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Modifier la catégorie</CardTitle>
                    <CardDescription>
                        Ajustez les informations de la catégorie
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">Nom *</Label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <textarea
                                        id="description"
                                        rows={3}
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
                            <div className="space-y-2">
                                <Label htmlFor="icon">Icône Lucide</Label>
                                <Input
                                    id="icon"
                                    value={formData.icon || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, icon: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="color">Couleur</Label>
                                <div className="relative">
                                    <Palette className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="color"
                                        value={formData.color || ""}
                                        onChange={(e) =>
                                            setFormData({ ...formData, color: e.target.value })
                                        }
                                        className="pl-10"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>Catégorie Parente</Label>
                                <SmartSelector
                                    items={parentItems}
                                    selectedIds={
                                        formData.parent_id ? [formData.parent_id] : []
                                    }
                                    onChange={(ids) =>
                                        setFormData({
                                            ...formData,
                                            parent_id: ids[0] || null,
                                        })
                                    }
                                    placeholder="Aucune (racine)"
                                    accentColor="primary"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex flex-row items-center justify-between border p-4 rounded-md">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Active</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Si désactivée, cette catégorie ne sera plus proposée.
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
                                disabled={updateCategory.isPending}
                                className="gap-2"
                            >
                                {updateCategory.isPending ? (
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
                        <DialogTitle>Supprimer la catégorie</DialogTitle>
                        <DialogDescription>
                            Voulez-vous supprimer la catégorie{" "}
                            <span className="font-semibold">{category.name}</span> ?
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
                            disabled={deleteCategory.isPending}
                            className="gap-2"
                        >
                            {deleteCategory.isPending && (
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
