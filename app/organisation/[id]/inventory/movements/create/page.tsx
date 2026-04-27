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
import { getApiErrorMessage } from "@/lib/api";
import {
    useCreateStockMovement,
    useProducts,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    CreateStockMovementData,
    Product,
    StockMovementReason,
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
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function CreateMovementPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.STOCK.MANAGE}>
            <Suspense fallback={null}>
                <CreateMovementPage />
            </Suspense>
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
        description: "Réception, retour client, correction positive",
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

function CreateMovementPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const orgId = params.id as string;

    const prefilledProduct = searchParams.get("product") || "";
    const prefilledWarehouse = searchParams.get("warehouse") || "";
    const prefilledType =
        (searchParams.get("type") as SimpleMovementType | null) || "in";

    const [movementType, setMovementType] =
        useState<SimpleMovementType>(prefilledType);
    const [saveAsDraft, setSaveAsDraft] = useState(false);
    const [formData, setFormData] = useState<CreateStockMovementData>({
        product_id: prefilledProduct,
        warehouse_id: prefilledWarehouse,
        movement_type: prefilledType,
        reason: prefilledType === "out" ? "sale" : "purchase",
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

    const createMovement = useCreateStockMovement();

    // Quand on change le type, reset la raison par défaut
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            movement_type: movementType,
            reason: REASON_OPTIONS_BY_TYPE[movementType][0]?.value || "other",
        }));
    }, [movementType]);

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

        if (!formData.product_id || !formData.warehouse_id || !formData.quantity) {
            toast("Champs manquants", {
                description: "Produit, entrepôt et quantité sont obligatoires.",
            });
            return;
        }

        // Pour les sorties, on force la quantité négative ; pour les entrées positive
        let signedQuantity = Number(formData.quantity);
        if (movementType === "out" && signedQuantity > 0) signedQuantity = -signedQuantity;
        if (movementType === "in" && signedQuantity < 0) signedQuantity = -signedQuantity;

        if (signedQuantity === 0) {
            toast("Quantité invalide", { description: "Doit être différente de 0." });
            return;
        }

        try {
            const result = await createMovement.mutateAsync({
                orgId,
                data: {
                    ...formData,
                    quantity: signedQuantity.toString(),
                    status: saveAsDraft ? "draft" : "validated",
                },
            });
            toast.success(
                saveAsDraft
                    ? "Mouvement enregistré en brouillon."
                    : "Mouvement validé. Le stock a été mis à jour."
            );
            router.push(
                `/organisation/${orgId}/inventory/movements/${result.data.id}`
            );
        } catch (error: any) {
            toast.error("Erreur", {
                description: getApiErrorMessage(error),
            });
        }
    };

    const reasonOptions = REASON_OPTIONS_BY_TYPE[movementType];
    const selectedProduct = products.find((p) => p.id === formData.product_id);
    const selectedWarehouse = warehouses.find(
        (w) => w.id === formData.warehouse_id
    );

    return (
        <FormPageLayout
            title="Nouveau mouvement de stock"
            subtitle="Enregistrez une entrée, sortie ou ajustement"
            backLink={`/organisation/${orgId}/inventory/inventories`}
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
                                    SKU: {selectedProduct.sku} · {selectedProduct.unit_display}
                                </p>
                            </div>
                        ) : (
                            <p className="text-xs text-muted-foreground italic">
                                Sélectionnez un produit…
                            </p>
                        )}
                        {selectedWarehouse && (
                            <div className="pt-3 border-t">
                                <p className="text-xs text-muted-foreground">Entrepôt</p>
                                <p className="font-medium">{selectedWarehouse.name}</p>
                            </div>
                        )}
                        {formData.quantity && (
                            <div className="pt-3 border-t">
                                <p className="text-xs text-muted-foreground">
                                    Impact sur le stock
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
                        )}
                    </CardContent>
                </Card>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Détails du mouvement</CardTitle>
                    <CardDescription>
                        Chaque mouvement est auditable et immutable.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Type de mouvement */}
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
                                            onClick={() => setMovementType(opt.value)}
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

                        {/* Produit + Entrepôt */}
                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>Produit *</Label>
                                <SmartSelector
                                    items={productItems}
                                    selectedIds={
                                        formData.product_id ? [formData.product_id] : []
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
                                        formData.warehouse_id ? [formData.warehouse_id] : []
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

                        {/* Motif + quantité */}
                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="reason">Motif *</Label>
                                <select
                                    id="reason"
                                    value={formData.reason}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            reason: e.target.value as StockMovementReason,
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
                                    value={formData.quantity as string}
                                    onChange={(e) =>
                                        setFormData({ ...formData, quantity: e.target.value })
                                    }
                                    required
                                />
                            </div>
                        </div>

                        {/* Coût + référence */}
                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                            <div className="space-y-2">
                                <Label htmlFor="unit_cost">
                                    <DollarSign className="inline h-3.5 w-3.5 mr-1" />
                                    Coût unitaire
                                    <span className="text-muted-foreground font-normal text-xs ml-2">
                                        (valorisation)
                                    </span>
                                </Label>
                                <Input
                                    id="unit_cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.unit_cost as string}
                                    onChange={(e) =>
                                        setFormData({ ...formData, unit_cost: e.target.value })
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
                                        setFormData({ ...formData, notes: e.target.value })
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
                                variant="outline"
                                disabled={createMovement.isPending}
                                onClick={() => setSaveAsDraft(true)}
                                className="gap-2"
                            >
                                {createMovement.isPending && saveAsDraft ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <FileText className="h-4 w-4" />
                                )}
                                Enregistrer en brouillon
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMovement.isPending}
                                onClick={() => setSaveAsDraft(false)}
                                className="gap-2"
                            >
                                {createMovement.isPending && !saveAsDraft ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Valider le mouvement
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </FormPageLayout>
    );
}
