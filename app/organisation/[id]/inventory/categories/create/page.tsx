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
import { useCategories, useCreateCategory } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { CreateCategoryData } from "@/lib/types";
import { FileText, Loader2, Palette, Save, Tag, Tags } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function CreateCategoryPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.PRODUCT_CATEGORIES.MANAGE}>
            <CreateCategoryPage />
        </PermissionGuard>
    );
}

function CreateCategoryPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;

    const [formData, setFormData] = useState<CreateCategoryData>({
        name: "",
        description: "",
        parent_id: null,
        icon: "",
        color: "",
        is_active: true,
    });

    const { data: allCategories = [] } = useCategories(orgId, {
        page_size: "all",
    });
    const createCategory = useCreateCategory();

    const parentItems: SmartSelectorItem[] = useMemo(
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
        if (!formData.name) {
            toast("Nom requis", { description: "Le nom est obligatoire." });
            return;
        }
        try {
            await createCategory.mutateAsync({ orgId, data: formData });
            toast.success("Catégorie créée avec succès !");
            router.push(`/organisation/${orgId}/inventory/categories`);
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.name?.[0] ||
                    error?.data?.detail ||
                    error?.message ||
                    "Impossible de créer la catégorie",
            });
        }
    };

    return (
        <FormPageLayout
            title="Créer une catégorie"
            subtitle="Ajoutez une catégorie pour organiser vos produits"
            backLink={`/organisation/${orgId}/inventory/categories`}
            sidebar={
                <Card>
                    <CardHeader>
                        <CardTitle>Aperçu</CardTitle>
                        <CardDescription>
                            Aperçu en temps réel de votre catégorie
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Nom</p>
                            <p className="text-sm text-primary font-medium flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                {formData.parent_id
                                    ? `${(allCategories as any[]).find((c) => c.id === formData.parent_id)?.name} > ${formData.name || "Nouvelle"}`
                                    : formData.name || "Nouvelle Catégorie"}
                            </p>
                        </div>
                        {formData.color && (
                            <div className="space-y-2">
                                <p className="text-sm font-medium">Couleur</p>
                                <div
                                    className="h-6 w-24 rounded"
                                    style={{ backgroundColor: formData.color }}
                                />
                            </div>
                        )}
                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium">Statut</p>
                                <span
                                    className={`text-xs px-2 py-0.5 ${formData.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                                >
                                    {formData.is_active ? "Actif" : "Inactif"}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Détails de la catégorie</CardTitle>
                    <CardDescription>
                        Renseignez les informations de base
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">Nom de la catégorie *</Label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        placeholder="Ex: Boissons, Alimentation..."
                                        value={formData.name}
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
                                        placeholder="Brève description..."
                                        value={formData.description || ""}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: e.target.value,
                                            })
                                        }
                                        className="flex w-full border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pl-10 rounded-md"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="icon">Icône Lucide <span className="text-muted-foreground font-normal text-xs">(Optionnel)</span></Label>
                                <Input
                                    id="icon"
                                    placeholder="ex: package, tag"
                                    value={formData.icon || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, icon: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="color">Couleur <span className="text-muted-foreground font-normal text-xs">(Optionnel)</span></Label>
                                <div className="relative">
                                    <Palette className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="color"
                                        type="text"
                                        placeholder="#ffd15d"
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
                                <Label>
                                    Catégorie Parente{" "}
                                    <span className="text-muted-foreground font-normal text-xs">
                                        (Optionnel)
                                    </span>
                                </Label>
                                <SmartSelector
                                    items={parentItems}
                                    selectedIds={formData.parent_id ? [formData.parent_id] : []}
                                    onChange={(ids) =>
                                        setFormData({
                                            ...formData,
                                            parent_id: ids[0] || null,
                                        })
                                    }
                                    placeholder="Sélectionner la catégorie parente"
                                    accentColor="primary"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex flex-row items-center justify-between border p-4 rounded-md">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Catégorie Active</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Si désactivée, cette catégorie ne sera plus proposée.
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.is_active}
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
                                disabled={createCategory.isPending}
                                className="gap-2"
                            >
                                {createCategory.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Créer la catégorie
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </FormPageLayout>
    );
}
