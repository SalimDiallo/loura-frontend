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
import {
    useProducts,
    useStockTransfer,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { Product, StockTransferData, Warehouse } from "@/lib/types";
import {
    ArrowRight,
    Box,
    FileText,
    Hash,
    Loader2,
    Save,
    Warehouse as WarehouseIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export default function TransferPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.STOCK.MANAGE}>
            <TransferPage />
        </PermissionGuard>
    );
}

function TransferPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;

    const [formData, setFormData] = useState<StockTransferData>({
        product_id: "",
        source_warehouse_id: "",
        target_warehouse_id: "",
        quantity: "",
        unit_cost: "0.00",
        reference: "",
        notes: "",
    });

    const { data: productsList = [] } = useProducts(orgId, {
        page_size: "all",
        is_active: true,
    });
    const { data: warehousesList = [] } = useWarehouses(orgId, {
        page_size: "all",
        is_active: true,
    });
    const products = productsList as unknown as Product[];
    const warehouses = warehousesList as unknown as Warehouse[];

    const transferMutation = useStockTransfer();

    const productItems: SmartSelectorItem[] = useMemo(
        () =>
            products.map((p) => ({
                id: p.id,
                name: p.name,
                subtitle: `${p.sku} · ${p.unit_display}`,
                icon: Box,
            })),
        [products]
    );

    const warehouseItems: SmartSelectorItem[] = useMemo(
        () =>
            warehouses.map((w) => ({
                id: w.id,
                name: w.name,
                subtitle: w.code + (w.city ? ` · ${w.city}` : ""),
                icon: WarehouseIcon,
            })),
        [warehouses]
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            !formData.product_id ||
            !formData.source_warehouse_id ||
            !formData.target_warehouse_id ||
            !formData.quantity
        ) {
            toast("Champs manquants", {
                description: "Tous les champs obligatoires doivent être renseignés.",
            });
            return;
        }
        if (formData.source_warehouse_id === formData.target_warehouse_id) {
            toast("Entrepôts identiques", {
                description: "Source et cible doivent être différents.",
            });
            return;
        }
        try {
            await transferMutation.mutateAsync({ orgId, data: formData });
            toast.success("Transfert effectué.");
            router.push(`/organisation/${orgId}/inventory/inventories`);
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.detail ||
                    error?.message ||
                    "Impossible d'effectuer le transfert",
            });
        }
    };

    const selectedProduct = products.find((p) => p.id === formData.product_id);
    const selectedSource = warehouses.find(
        (w) => w.id === formData.source_warehouse_id
    );
    const selectedTarget = warehouses.find(
        (w) => w.id === formData.target_warehouse_id
    );

    return (
        <FormPageLayout
            title="Transfert entre entrepôts"
            subtitle="Déplacer du stock d'un entrepôt à un autre"
            backLink={`/organisation/${orgId}/inventory/inventories`}
            sidebar={
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Résumé</CardTitle>
                        <CardDescription>
                            Un transfert crée 2 mouvements liés.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {selectedProduct && (
                            <div>
                                <p className="text-xs text-muted-foreground">Produit</p>
                                <p className="font-medium">{selectedProduct.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedProduct.sku}
                                </p>
                            </div>
                        )}
                        {selectedSource && selectedTarget && (
                            <div className="pt-3 border-t">
                                <p className="text-xs text-muted-foreground mb-2">Flux</p>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">
                                        {selectedSource.name}
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-medium">
                                        {selectedTarget.name}
                                    </span>
                                </div>
                            </div>
                        )}
                        {formData.quantity && (
                            <div className="pt-3 border-t">
                                <p className="text-xs text-muted-foreground">Quantité</p>
                                <p className="text-lg font-bold">
                                    {Number(formData.quantity).toLocaleString("fr-FR")}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Détails du transfert</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Produit *</Label>
                            <SmartSelector
                                items={productItems}
                                selectedIds={
                                    formData.product_id ? [formData.product_id] : []
                                }
                                onChange={(ids) =>
                                    setFormData({ ...formData, product_id: ids[0] || "" })
                                }
                                placeholder="Rechercher un produit"
                                accentColor="primary"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>Entrepôt source *</Label>
                                <SmartSelector
                                    items={warehouseItems}
                                    selectedIds={
                                        formData.source_warehouse_id
                                            ? [formData.source_warehouse_id]
                                            : []
                                    }
                                    onChange={(ids) =>
                                        setFormData({
                                            ...formData,
                                            source_warehouse_id: ids[0] || "",
                                        })
                                    }
                                    placeholder="D'où part le stock ?"
                                    accentColor="blue"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Entrepôt cible *</Label>
                                <SmartSelector
                                    items={warehouseItems}
                                    selectedIds={
                                        formData.target_warehouse_id
                                            ? [formData.target_warehouse_id]
                                            : []
                                    }
                                    onChange={(ids) =>
                                        setFormData({
                                            ...formData,
                                            target_warehouse_id: ids[0] || "",
                                        })
                                    }
                                    placeholder="Où va le stock ?"
                                    accentColor="primary"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="quantity">
                                    <Hash className="inline h-3.5 w-3.5 mr-1" />
                                    Quantité *
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={formData.quantity as string}
                                    onChange={(e) =>
                                        setFormData({ ...formData, quantity: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reference">Référence</Label>
                                <Input
                                    id="reference"
                                    placeholder="Bon de transfert…"
                                    value={formData.reference || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            reference: e.target.value,
                                        })
                                    }
                                    maxLength={100}
                                />
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="notes">Notes</Label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <textarea
                                    id="notes"
                                    rows={2}
                                    value={formData.notes || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, notes: e.target.value })
                                    }
                                    className="flex w-full border border-input bg-transparent px-3 py-2 text-sm pl-10 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                                disabled={transferMutation.isPending}
                                className="gap-2"
                            >
                                {transferMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Effectuer le transfert
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </FormPageLayout>
    );
}
