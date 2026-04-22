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
import {
    SmartSelector,
    type SmartSelectorItem,
} from "@/components/ui/smart-selector";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
    useCreatePurchaseOrder,
    useProducts,
    useSuppliers,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    CreatePurchaseOrderData,
    CreatePurchaseOrderItemData,
    Product,
    Supplier,
    Warehouse,
} from "@/lib/types";
import {
    Box,
    FileText,
    Loader2,
    Save,
    Trash2,
    Truck,
    Warehouse as WarehouseIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { toast } from "sonner";

export default function CreatePurchaseOrderPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.PURCHASE_ORDERS.MANAGE}>
            <CreatePurchaseOrderPage />
        </PermissionGuard>
    );
}

type FormItem = CreatePurchaseOrderItemData & { _key: string };

let itemKey = 0;
const nextKey = () => `item-${++itemKey}`;

function CreatePurchaseOrderPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { formatCurrency } = useCurrencyFormatter();

    const today = new Date().toISOString().split("T")[0];

    const [supplierId, setSupplierId] = useState<string>("");
    const [warehouseId, setWarehouseId] = useState<string>("");
    const [orderDate, setOrderDate] = useState<string>(today);
    const [expectedDate, setExpectedDate] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [items, setItems] = useState<FormItem[]>([
        { _key: nextKey(), product_id: "", quantity_ordered: "", unit_cost: "", tax_rate: "0" },
    ]);

    const { data: suppliersList = [] } = useSuppliers(orgId, {
        page_size: "all",
        is_active: "true",
    });
    const { data: warehousesList = [] } = useWarehouses(orgId, {
        page_size: "all",
        is_active: true,
    });
    const { data: productsList = [] } = useProducts(orgId, {
        page_size: "all",
        is_active: true,
    });

    const suppliers = suppliersList as unknown as Supplier[];
    const warehouses = warehousesList as unknown as Warehouse[];
    const products = productsList as unknown as Product[];

    const createPO = useCreatePurchaseOrder();

    const supplierItems: SmartSelectorItem[] = useMemo(
        () =>
            suppliers.map((s) => ({
                id: s.id,
                name: s.name,
                subtitle: s.code || "Fournisseur",
                icon: Truck,
            })),
        [suppliers]
    );

    const warehouseItems: SmartSelectorItem[] = useMemo(
        () =>
            warehouses.map((w) => ({
                id: w.id,
                name: w.name,
                subtitle: w.code,
                icon: WarehouseIcon,
            })),
        [warehouses]
    );

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

    // Totaux en temps réel
    const totals = useMemo(() => {
        let subtotal = 0;
        let tax = 0;
        for (const it of items) {
            const qty = parseFloat(String(it.quantity_ordered || 0));
            const cost = parseFloat(String(it.unit_cost || 0));
            const rate = parseFloat(String(it.tax_rate || 0));
            if (Number.isFinite(qty) && Number.isFinite(cost)) {
                const line = qty * cost;
                subtotal += line;
                tax += (line * (Number.isFinite(rate) ? rate : 0)) / 100;
            }
        }
        return {
            subtotal,
            tax,
            total: subtotal + tax,
        };
    }, [items]);

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            { _key: nextKey(), product_id: "", quantity_ordered: "", unit_cost: "", tax_rate: "0" },
        ]);
    };

    const removeItem = (key: string) => {
        setItems((prev) =>
            prev.length > 1 ? prev.filter((i) => i._key !== key) : prev
        );
    };

    const updateItem = (key: string, patch: Partial<FormItem>) => {
        setItems((prev) =>
            prev.map((i) => (i._key === key ? { ...i, ...patch } : i))
        );
    };

    // Pré-remplir unit_cost à partir du produit choisi
    const handleProductChange = (key: string, productId: string) => {
        const product = products.find((p) => p.id === productId);
        updateItem(key, {
            product_id: productId,
            unit_cost: product?.purchase_price ?? "",
            tax_rate: product?.tax_rate ?? "0",
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || !warehouseId || !orderDate) {
            toast("Champs manquants", {
                description: "Fournisseur, entrepôt et date de commande sont obligatoires.",
            });
            return;
        }

        const validItems = items.filter(
            (it) =>
                it.product_id &&
                parseFloat(String(it.quantity_ordered || 0)) > 0 &&
                parseFloat(String(it.unit_cost || 0)) >= 0
        );
        if (validItems.length === 0) {
            toast("Aucune ligne valide", {
                description: "Ajoutez au moins un produit avec quantité et coût.",
            });
            return;
        }

        const payload: CreatePurchaseOrderData = {
            supplier_id: supplierId,
            warehouse_id: warehouseId,
            order_date: orderDate,
            expected_date: expectedDate || null,
            notes,
            items: validItems.map(({ _key, ...rest }) => rest),
        };

        try {
            const response = await createPO.mutateAsync({ orgId, data: payload });
            toast.success("Commande créée en brouillon.");
            router.push(
                `/organisation/${orgId}/inventory/purchase-orders/${response.data.id}`
            );
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.detail ||
                    error?.data?.items?.[0] ||
                    error?.message ||
                    "Impossible de créer la commande",
            });
        }
    };

    const selectedSupplier = suppliers.find((s) => s.id === supplierId);
    const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);

    return (
        <FormPageLayout
            title="Nouvelle commande fournisseur"
            subtitle="Préparez un bon de commande en brouillon"
            backLink={`/organisation/${orgId}/inventory/purchase-orders`}
            sidebar={
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Totaux</CardTitle>
                        <CardDescription>Recalculés en temps réel</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {selectedSupplier && (
                            <div className="pb-3 border-b">
                                <p className="text-xs text-muted-foreground">Fournisseur</p>
                                <p className="text-sm font-medium">{selectedSupplier.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    Paiement à {selectedSupplier.payment_terms_days} jours
                                </p>
                            </div>
                        )}
                        {selectedWarehouse && (
                            <div className="pb-3 border-b">
                                <p className="text-xs text-muted-foreground">Entrepôt</p>
                                <p className="text-sm font-medium">
                                    {selectedWarehouse.name}
                                </p>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sous-total</span>
                            <span className="font-medium">
                                {formatCurrency(totals.subtotal)}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Taxes</span>
                            <span className="font-medium">
                                {formatCurrency(totals.tax)}
                            </span>
                        </div>
                        <div className="flex justify-between pt-3 border-t">
                            <span className="font-semibold">Total TTC</span>
                            <span className="text-lg font-bold text-primary">
                                {formatCurrency(totals.total)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Informations de commande</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Fournisseur *</Label>
                                <SmartSelector
                                    items={supplierItems}
                                    selectedIds={supplierId ? [supplierId] : []}
                                    onChange={(ids) => setSupplierId(ids[0] || "")}
                                    placeholder="Rechercher un fournisseur"
                                    accentColor="orange"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Entrepôt de livraison *</Label>
                                <SmartSelector
                                    items={warehouseItems}
                                    selectedIds={warehouseId ? [warehouseId] : []}
                                    onChange={(ids) => setWarehouseId(ids[0] || "")}
                                    placeholder="Sélectionner un entrepôt"
                                    accentColor="blue"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="order_date">Date de commande *</Label>
                                <Input
                                    id="order_date"
                                    type="date"
                                    value={orderDate}
                                    onChange={(e) => setOrderDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="expected_date">
                                    Date prévue de réception
                                </Label>
                                <Input
                                    id="expected_date"
                                    type="date"
                                    value={expectedDate}
                                    onChange={(e) => setExpectedDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* ── Lignes ─────────────────────────────── */}
                        <div className="space-y-3 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">Produits commandés</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                    className="gap-2"
                                >
                                    <FaPlus className="h-3 w-3" />
                                    Ajouter une ligne
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {items.map((item) => {
                                    const lineSubtotal =
                                        parseFloat(String(item.quantity_ordered || 0)) *
                                        parseFloat(String(item.unit_cost || 0));
                                    return (
                                        <div
                                            key={item._key}
                                            className="grid grid-cols-12 gap-2 p-3 border rounded-md bg-muted/20"
                                        >
                                            <div className="col-span-12 md:col-span-5">
                                                <Label className="text-xs">Produit</Label>
                                                <SmartSelector
                                                    items={productItems}
                                                    selectedIds={
                                                        item.product_id ? [item.product_id] : []
                                                    }
                                                    onChange={(ids) =>
                                                        handleProductChange(
                                                            item._key,
                                                            ids[0] || ""
                                                        )
                                                    }
                                                    placeholder="Rechercher"
                                                    accentColor="primary"
                                                />
                                            </div>
                                            <div className="col-span-4 md:col-span-2">
                                                <Label className="text-xs">Qté</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.001"
                                                    value={String(item.quantity_ordered)}
                                                    onChange={(e) =>
                                                        updateItem(item._key, {
                                                            quantity_ordered: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="col-span-4 md:col-span-2">
                                                <Label className="text-xs">Coût unit.</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={String(item.unit_cost)}
                                                    onChange={(e) =>
                                                        updateItem(item._key, {
                                                            unit_cost: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="col-span-3 md:col-span-1">
                                                <Label className="text-xs">TVA %</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={String(item.tax_rate ?? "0")}
                                                    onChange={(e) =>
                                                        updateItem(item._key, {
                                                            tax_rate: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div className="col-span-12 md:col-span-2 flex items-end justify-between gap-2">
                                                <div className="text-right flex-1">
                                                    <div className="text-xs text-muted-foreground">
                                                        Sous-total
                                                    </div>
                                                    <div className="text-sm font-semibold">
                                                        {formatCurrency(
                                                            Number.isFinite(lineSubtotal)
                                                                ? lineSubtotal
                                                                : 0
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeItem(item._key)}
                                                    disabled={items.length === 1}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="notes">Notes</Label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <textarea
                                    id="notes"
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
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
                                disabled={createPO.isPending}
                                className="gap-2"
                            >
                                {createPO.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Créer le brouillon
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </FormPageLayout>
    );
}
