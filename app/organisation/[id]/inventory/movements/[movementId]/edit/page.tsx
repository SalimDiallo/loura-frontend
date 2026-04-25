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
import { getApiErrorMessage } from "@/lib/api";
import {
    useProducts,
    useStockMovement,
    useUpdateStockMovement,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    Product,
    StockMovementReason,
    UpdateStockMovementData,
    Warehouse,
} from "@/lib/types";
import {
    ArrowDown,
    ArrowUp,
    Box,
    DollarSign,
    FileText,
    Hash,
    Loader2,
    Save,
    Scale,
    Warehouse as WarehouseIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function EditMovementPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.STOCK.MANAGE}>
            <EditMovementPage />
        </PermissionGuard>
    );
}

type SimpleMovementType = "in" | "out" | "adjust";

const TYPE_OPTIONS: {
    value: SimpleMovementType;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}[] = [
    {
        value: "in",
        label: "Entrée",
        description: "Réception, retour client",
        icon: ArrowUp,
        color: "text-green-600 bg-green-50/70 border-green-200 dark:text-green-400 dark:bg-green-900/50 dark:border-green-800",
    },
    {
        value: "out",
        label: "Sortie",
        description: "Vente, perte, retour fournisseur",
        icon: ArrowDown,
        color: "text-red-600 bg-red-50/70 border-red-200 dark:text-red-400 dark:bg-red-900/50 dark:border-red-800",
    },
    {
        value: "adjust",
        label: "Ajustement",
        description: "Inventaire physique, correction",
        icon: Scale,
        color: "text-blue-600 bg-blue-50/70 border-blue-200 dark:text-blue-400 dark:bg-blue-900/50 dark:border-blue-800",
    },
];

const REASON_OPTIONS_BY_TYPE: Record<
    SimpleMovementType,
    { value: StockMovementReason; label: string }[]
> = {
    in: [
        { value: "purchase", label: "Achat / Approvisionnement" },
        { value: "return_customer", label: "Retour client" },
        { value: "correction", label: "Correction" },
        { value: "other", label: "Autre" },
    ],
    out: [
        { value: "sale", label: "Vente" },
        { value: "loss", label: "Perte / Casse" },
        { value: "return_supplier", label: "Retour fournisseur" },
        { value: "other", label: "Autre" },
    ],
    adjust: [
        { value: "inventory", label: "Inventaire physique" },
        { value: "correction", label: "Correction" },
        { value: "other", label: "Autre" },
    ],
};

function EditMovementPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const movementId = params.movementId as string;

    const { data: movement, isLoading, error } = useStockMovement(orgId, movementId);
    const updateMutation = useUpdateStockMovement();

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

    const [movementType, setMovementType] = useState<SimpleMovementType>("in");
    const [formData, setFormData] = useState<UpdateStockMovementData>({});
    const [hydrated, setHydrated] = useState(false);

    // Hydratation
    useEffect(() => {
        if (!movement || hydrated) return;
        const type = movement.movement_type;
        if (type === "transfer") return;
        setMovementType(type as SimpleMovementType);
        setFormData({
            product_id: movement.product.id,
            warehouse_id: movement.warehouse.id,
            movement_type: type as SimpleMovementType,
            reason: movement.reason,
            quantity: Math.abs(Number(movement.quantity)).toString(),
            unit_cost: movement.unit_cost,
            reference: movement.reference,
            notes: movement.notes,
        });
        setHydrated(true);
    }, [movement, hydrated]);

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

    if (isLoading || !movement) {
        return (
            <div className="container mx-auto p-6">
                {error ? (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-destructive">Erreur : {error.message}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <p className="text-muted-foreground">Chargement…</p>
                )}
            </div>
        );
    }

    if (movement.status !== "draft") {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <p className="font-medium">
                            Ce mouvement n'est plus modifiable.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Seuls les mouvements en brouillon peuvent être édités. Pour
                            corriger un mouvement validé, créez un mouvement
                            d'ajustement inverse.
                        </p>
                        <Button
                            onClick={() =>
                                router.push(
                                    `/organisation/${orgId}/inventory/movements/${movementId}`
                                )
                            }
                        >
                            Retour au détail
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (movement.movement_type === "transfer") {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <p className="font-medium">
                            Les transferts ne sont pas éditables.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Pour corriger, créez un nouveau transfert dans l'autre sens.
                        </p>
                        <Button
                            onClick={() =>
                                router.push(
                                    `/organisation/${orgId}/inventory/movements/${movementId}`
                                )
                            }
                        >
                            Retour au détail
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.product_id || !formData.warehouse_id || !formData.quantity) {
            toast("Champs manquants", {
                description: "Produit, entrepôt et quantité sont obligatoires.",
            });
            return;
        }

        let signedQuantity = Number(formData.quantity);
        if (movementType === "out" && signedQuantity > 0)
            signedQuantity = -signedQuantity;
        if (movementType === "in" && signedQuantity < 0)
            signedQuantity = -signedQuantity;

        if (signedQuantity === 0) {
            toast("Quantité invalide", {
                description: "Doit être différente de 0.",
            });
            return;
        }

        try {
            await updateMutation.mutateAsync({
                orgId,
                id: movementId,
                data: {
                    ...formData,
                    movement_type: movementType,
                    quantity: signedQuantity.toString(),
                },
            });
            toast.success("Brouillon mis à jour.");
            router.push(
                `/organisation/${orgId}/inventory/movements/${movementId}`
            );
        } catch (err) {
            toast.error("Erreur", { description: getApiErrorMessage(err) });
        }
    };

    const reasonOptions = REASON_OPTIONS_BY_TYPE[movementType];
    const selectedProduct = products.find(
        (p) => p.id === formData.product_id
    );
    const selectedWarehouse = warehouses.find(
        (w) => w.id === formData.warehouse_id
    );

    return (
        <FormPageLayout
            title="Modifier le brouillon"
            subtitle="Édition libre tant que le mouvement n'est pas validé"
            backLink={`/organisation/${orgId}/inventory/movements/${movementId}`}
            sidebar={
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Récapitulatif</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {selectedProduct ? (
                            <div>
                                <p className="text-xs text-muted-foreground">Produit</p>
                                <p className="font-medium">{selectedProduct.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    SKU: {selectedProduct.sku} ·{" "}
                                    {selectedProduct.unit_display}
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">
                                Sélectionnez un produit…
                            </p>
                        )}
                        {selectedWarehouse && (
                            <div className="pt-3 border-t">
                                <p className="text-xs text-muted-foreground">
                                    Entrepôt
                                </p>
                                <p className="font-medium">{selectedWarehouse.name}</p>
                            </div>
                        )}
                        {formData.quantity ? (
                            <div className="pt-3 border-t">
                                <p className="text-xs text-muted-foreground">
                                    Impact prévu
                                </p>
                                <p
                                    className={`text-lg font-bold ${
                                        movementType === "out"
                                            ? "text-red-600"
                                            : "text-green-600"
                                    }`}
                                >
                                    {movementType === "out" ? "" : "+"}
                                    {Number(formData.quantity).toLocaleString("fr-FR")}
                                </p>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Détails du mouvement</CardTitle>
                    <CardDescription>
                        Le stock ne sera impacté qu'à la validation.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label>Type de mouvement *</Label>
                            <div className="grid gap-3 md:grid-cols-3">
                                {TYPE_OPTIONS.map((opt) => {
                                    const Icon = opt.icon;
                                    const selected = movementType === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() =>
                                                setMovementType(opt.value)
                                            }
                                            className={`p-4 border-2 rounded-md text-left transition-all ${
                                                selected
                                                    ? opt.color
                                                    : "border-border hover:border-primary/50"
                                            }`}
                                        >
                                            <Icon className="h-5 w-5 mb-2" />
                                            <div className="font-semibold text-sm">
                                                {opt.label}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {opt.description}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>Produit *</Label>
                                <SmartSelector
                                    items={productItems}
                                    selectedIds={
                                        formData.product_id
                                            ? [formData.product_id]
                                            : []
                                    }
                                    onChange={(ids) =>
                                        setFormData({
                                            ...formData,
                                            product_id: ids[0] || "",
                                        })
                                    }
                                    placeholder="Rechercher un produit"
                                    accentColor="primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Entrepôt *</Label>
                                <SmartSelector
                                    items={warehouseItems}
                                    selectedIds={
                                        formData.warehouse_id
                                            ? [formData.warehouse_id]
                                            : []
                                    }
                                    onChange={(ids) =>
                                        setFormData({
                                            ...formData,
                                            warehouse_id: ids[0] || "",
                                        })
                                    }
                                    placeholder="Sélectionner un entrepôt"
                                    accentColor="blue"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="reason">Motif *</Label>
                                <select
                                    id="reason"
                                    value={formData.reason || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            reason: e.target
                                                .value as StockMovementReason,
                                        })
                                    }
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    {reasonOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quantity">
                                    <Hash className="inline h-3.5 w-3.5 mr-1" />
                                    Quantité *
                                    <span className="text-muted-foreground font-normal text-xs ml-2">
                                        {movementType === "adjust"
                                            ? "(positif ou négatif)"
                                            : "(valeur absolue)"}
                                    </span>
                                </Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    step="0.001"
                                    value={(formData.quantity as string) || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            quantity: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="unit_cost">
                                    <DollarSign className="inline h-3.5 w-3.5 mr-1" />
                                    Coût unitaire
                                </Label>
                                <Input
                                    id="unit_cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={(formData.unit_cost as string) || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            unit_cost: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reference">Référence</Label>
                                <Input
                                    id="reference"
                                    placeholder="N° de facture, bon de livraison…"
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
                                    rows={3}
                                    value={formData.notes || ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            notes: e.target.value,
                                        })
                                    }
                                    className="flex w-full border border-input bg-transparent px-3 py-2 text-sm pl-10 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={updateMutation.isPending}
                                className="gap-2"
                            >
                                {updateMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Enregistrer les modifications
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </FormPageLayout>
    );
}
