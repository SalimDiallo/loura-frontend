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
    useCreateSale,
    useCustomers,
    useProducts,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    CreateSaleData,
    CreateSaleInstallmentData,
    CreateSaleItemData,
    Customer,
    Product,
    SaleDiscountType,
    SaleType,
    Warehouse,
} from "@/lib/types";
import {
    Box,
    CreditCard,
    DollarSign,
    FileText,
    Loader2,
    Save,
    Trash2,
    User,
    Warehouse as WarehouseIcon,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FaMoneyBillWave, FaPlus } from "react-icons/fa";
import { toast } from "sonner";

export default function CreateSalePageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.SALES.MANAGE}>
            <CreateSalePage />
        </PermissionGuard>
    );
}

type FormItem = CreateSaleItemData & { _key: string };
type FormInstallment = CreateSaleInstallmentData & { _key: string };

let itemKey = 0;
const nextKey = () => `itm-${++itemKey}`;

function CreateSalePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { formatCurrency } = useCurrencyFormatter();

    const today = new Date().toISOString().split("T")[0];

    const initialType: SaleType =
        searchParams.get("mode") === "credit" ? "credit" : "cash";

    const [saleType, setSaleType] = useState<SaleType>(initialType);
    const [customerId, setCustomerId] = useState<string>("");
    const [warehouseId, setWarehouseId] = useState<string>("");
    const [saleDate, setSaleDate] = useState<string>(today);
    const [dueDate, setDueDate] = useState<string>("");
    const [discountType, setDiscountType] = useState<SaleDiscountType>("none");
    const [discountValue, setDiscountValue] = useState<string>("0");
    const [notes, setNotes] = useState<string>("");
    const [items, setItems] = useState<FormItem[]>([
        {
            _key: nextKey(),
            product_id: "",
            quantity: "",
            unit_price: "",
            discount_type: "none",
            discount_value: "0",
            tax_rate: "0",
        },
    ]);
    const [installments, setInstallments] = useState<FormInstallment[]>([]);

    const { data: customersList = [] } = useCustomers(orgId, {
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

    const customers = customersList as unknown as Customer[];
    const warehouses = warehousesList as unknown as Warehouse[];
    const products = productsList as unknown as Product[];

    const createSale = useCreateSale();

    const customerItems: SmartSelectorItem[] = useMemo(
        () =>
            customers
                .filter((c) => (saleType === "credit" ? Number(c.credit_limit) > 0 : true))
                .map((c) => ({
                    id: c.id,
                    name: c.name,
                    subtitle: c.customer_type === "company" ? "Entreprise" : "Particulier",
                    icon: User,
                })),
        [customers, saleType]
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
        let totalTax = 0;
        for (const it of items) {
            const qty = parseFloat(String(it.quantity || 0));
            const price = parseFloat(String(it.unit_price || 0));
            if (!Number.isFinite(qty) || !Number.isFinite(price)) continue;
            const lineBase = qty * price;
            const lineDisc = parseFloat(String(it.discount_value || 0));
            let lineAfter = lineBase;
            if (it.discount_type === "percentage") {
                lineAfter = lineBase - (lineBase * lineDisc) / 100;
            } else if (it.discount_type === "fixed") {
                lineAfter = lineBase - Math.min(lineDisc, lineBase);
            }
            const rate = parseFloat(String(it.tax_rate || 0));
            subtotal += lineAfter;
            totalTax += (lineAfter * (Number.isFinite(rate) ? rate : 0)) / 100;
        }
        let globalDiscount = 0;
        const dv = parseFloat(discountValue || "0");
        if (discountType === "percentage") {
            globalDiscount = (subtotal * dv) / 100;
        } else if (discountType === "fixed") {
            globalDiscount = Math.min(dv, subtotal);
        }
        const base = subtotal - globalDiscount;
        const taxRatio = subtotal > 0 ? base / subtotal : 0;
        const adjustedTax = totalTax * taxRatio;
        return {
            subtotal,
            discount: globalDiscount,
            tax: adjustedTax,
            total: base + adjustedTax,
        };
    }, [items, discountType, discountValue]);

    const installmentsTotal = useMemo(
        () =>
            installments.reduce(
                (acc, i) => acc + (parseFloat(String(i.amount || 0)) || 0),
                0
            ),
        [installments]
    );

    const addItem = () => {
        setItems((prev) => [
            ...prev,
            {
                _key: nextKey(),
                product_id: "",
                quantity: "",
                unit_price: "",
                discount_type: "none",
                discount_value: "0",
                tax_rate: "0",
            },
        ]);
    };

    const removeItem = (key: string) => {
        setItems((prev) => (prev.length > 1 ? prev.filter((i) => i._key !== key) : prev));
    };

    const updateItem = (key: string, patch: Partial<FormItem>) => {
        setItems((prev) =>
            prev.map((i) => (i._key === key ? { ...i, ...patch } : i))
        );
    };

    const handleProductChange = (key: string, productId: string) => {
        const p = products.find((x) => x.id === productId);
        updateItem(key, {
            product_id: productId,
            unit_price: p?.selling_price ?? "",
            tax_rate: p?.tax_rate ?? "0",
        });
    };

    const addInstallment = () => {
        setInstallments((prev) => [
            ...prev,
            {
                _key: nextKey(),
                due_date: saleDate,
                amount: "0",
            },
        ]);
    };

    const removeInstallment = (key: string) => {
        setInstallments((prev) => prev.filter((i) => i._key !== key));
    };

    const updateInstallment = (key: string, patch: Partial<FormInstallment>) => {
        setInstallments((prev) =>
            prev.map((i) => (i._key === key ? { ...i, ...patch } : i))
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!warehouseId || !saleDate) {
            toast("Champs manquants", {
                description: "Entrepôt et date sont obligatoires.",
            });
            return;
        }
        if (saleType === "credit" && !customerId) {
            toast("Client requis", {
                description: "Une vente à crédit nécessite un client avec limite de crédit.",
            });
            return;
        }
        const validItems = items.filter(
            (it) =>
                it.product_id &&
                parseFloat(String(it.quantity || 0)) > 0 &&
                parseFloat(String(it.unit_price || 0)) >= 0
        );
        if (validItems.length === 0) {
            toast("Aucune ligne valide", {
                description: "Ajoutez au moins un produit avec quantité et prix.",
            });
            return;
        }

        const payload: CreateSaleData = {
            customer_id: customerId || null,
            warehouse_id: warehouseId,
            sale_type: saleType,
            sale_date: saleDate,
            due_date: dueDate || null,
            discount_type: discountType,
            discount_value: discountValue || "0",
            notes,
            items: validItems.map(({ _key, ...rest }) => rest),
            installments:
                saleType === "credit" && installments.length > 0
                    ? installments.map(({ _key, ...rest }) => rest)
                    : undefined,
        };

        try {
            const response = await createSale.mutateAsync({ orgId, data: payload });
            toast.success("Vente créée en brouillon.");
            router.push(
                `/organisation/${orgId}/inventory/sales/${response.data.id}`
            );
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.detail ||
                    error?.data?.items?.[0] ||
                    error?.data?.customer_id?.[0] ||
                    error?.message ||
                    "Impossible de créer la vente",
            });
        }
    };

    const selectedCustomer = customers.find((c) => c.id === customerId);

    return (
        <FormPageLayout
            title="Nouvelle vente"
            subtitle="Créez un brouillon puis finalisez pour décompter le stock"
            backLink={`/organisation/${orgId}/inventory/sales`}
            sidebar={
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Récapitulatif</CardTitle>
                        <CardDescription>Calculé en temps réel</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {selectedCustomer && (
                            <div className="pb-3 border-b">
                                <p className="text-xs text-muted-foreground">Client</p>
                                <p className="text-sm font-medium">{selectedCustomer.name}</p>
                                {saleType === "credit" && (
                                    <p className="text-xs text-muted-foreground">
                                        Limite :{" "}
                                        {formatCurrency(Number(selectedCustomer.credit_limit))}
                                    </p>
                                )}
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Sous-total</span>
                            <span className="font-medium">
                                {formatCurrency(totals.subtotal)}
                            </span>
                        </div>
                        {totals.discount > 0 && (
                            <div className="flex justify-between text-sm text-emerald-700">
                                <span>Remise globale</span>
                                <span className="font-medium">
                                    −{formatCurrency(totals.discount)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Taxes</span>
                            <span className="font-medium">{formatCurrency(totals.tax)}</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t">
                            <span className="font-semibold">Total TTC</span>
                            <span className="text-lg font-bold text-primary">
                                {formatCurrency(totals.total)}
                            </span>
                        </div>
                        {saleType === "credit" && installments.length > 0 && (
                            <div className="pt-3 border-t space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    Total échéances : {formatCurrency(installmentsTotal)}
                                </p>
                                {Math.abs(installmentsTotal - totals.total) > 0.01 && (
                                    <p className="text-xs text-amber-600">
                                        ⚠ Les échéances doivent couvrir le total
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            }
        >
            <Card>
                <CardHeader>
                    <CardTitle>Détails de la vente</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Type de vente */}
                        <div className="space-y-2">
                            <Label>Type de vente *</Label>
                            <div className="grid gap-3 md:grid-cols-2">
                                {[
                                    {
                                        value: "cash" as SaleType,
                                        label: "Comptant",
                                        icon: FaMoneyBillWave,
                                        description: "Payée au moment de la vente",
                                        color: "text-green-600 border-green-200 bg-green-50",
                                    },
                                    {
                                        value: "credit" as SaleType,
                                        label: "À crédit",
                                        icon: CreditCard,
                                        description: "Avec échéancier et contrôle du crédit client",
                                        color: "text-amber-600 border-amber-200 bg-amber-50",
                                    },
                                ].map((opt) => {
                                    const Icon = opt.icon as any;
                                    const selected = saleType === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setSaleType(opt.value)}
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

                        {/* Client + Entrepôt + Dates */}
                        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                            <div className="space-y-2">
                                <Label>
                                    Client{" "}
                                    {saleType === "credit" ? "*" : "(optionnel pour comptoir)"}
                                </Label>
                                <SmartSelector
                                    items={customerItems}
                                    selectedIds={customerId ? [customerId] : []}
                                    onChange={(ids) => setCustomerId(ids[0] || "")}
                                    placeholder="Rechercher un client"
                                    accentColor="primary"
                                />
                                {saleType === "credit" && customerItems.length === 0 && (
                                    <p className="text-xs text-amber-600">
                                        Aucun client avec limite de crédit configurée.
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Entrepôt *</Label>
                                <SmartSelector
                                    items={warehouseItems}
                                    selectedIds={warehouseId ? [warehouseId] : []}
                                    onChange={(ids) => setWarehouseId(ids[0] || "")}
                                    placeholder="Sélectionner un entrepôt"
                                    accentColor="blue"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sale_date">Date de vente *</Label>
                                <Input
                                    id="sale_date"
                                    type="date"
                                    value={saleDate}
                                    onChange={(e) => setSaleDate(e.target.value)}
                                    required
                                />
                            </div>
                            {saleType === "credit" && (
                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Échéance finale</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Lignes avec remises */}
                        <div className="space-y-3 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold">Articles vendus</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                    className="gap-2"
                                >
                                    <FaPlus className="h-3 w-3" />
                                    Ligne
                                </Button>
                            </div>
                            <div className="space-y-3">
                                {items.map((item) => {
                                    const qty = parseFloat(String(item.quantity || 0));
                                    const price = parseFloat(String(item.unit_price || 0));
                                    const lineBase = qty * price;
                                    const dv = parseFloat(String(item.discount_value || 0));
                                    let afterDisc = lineBase;
                                    if (item.discount_type === "percentage") {
                                        afterDisc = lineBase - (lineBase * dv) / 100;
                                    } else if (item.discount_type === "fixed") {
                                        afterDisc = lineBase - Math.min(dv, lineBase);
                                    }
                                    return (
                                        <div
                                            key={item._key}
                                            className="p-3 border rounded-md bg-muted/20 space-y-2"
                                        >
                                            <div className="grid grid-cols-12 gap-2">
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
                                                        value={String(item.quantity)}
                                                        onChange={(e) =>
                                                            updateItem(item._key, {
                                                                quantity: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="col-span-4 md:col-span-2">
                                                    <Label className="text-xs">Prix unit.</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={String(item.unit_price)}
                                                        onChange={(e) =>
                                                            updateItem(item._key, {
                                                                unit_price: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="col-span-3 md:col-span-1">
                                                    <Label className="text-xs">TVA %</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
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
                                                                Number.isFinite(afterDisc)
                                                                    ? afterDisc
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

                                            {/* Remise ligne */}
                                            <div className="grid grid-cols-12 gap-2 pt-2 border-t">
                                                <div className="col-span-12 md:col-span-3">
                                                    <Label className="text-xs flex items-center gap-1">
                                                        <DollarSign className="h-3 w-3" />
                                                        Remise ligne
                                                    </Label>
                                                    <select
                                                        value={item.discount_type ?? "none"}
                                                        onChange={(e) =>
                                                            updateItem(item._key, {
                                                                discount_type: e.target
                                                                    .value as SaleDiscountType,
                                                            })
                                                        }
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                                                    >
                                                        <option value="none">Aucune</option>
                                                        <option value="percentage">%</option>
                                                        <option value="fixed">Montant</option>
                                                    </select>
                                                </div>
                                                {item.discount_type !== "none" && (
                                                    <div className="col-span-12 md:col-span-3">
                                                        <Label className="text-xs">
                                                            Valeur{" "}
                                                            {item.discount_type === "percentage"
                                                                ? "(%)"
                                                                : "(montant)"}
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={String(item.discount_value ?? "0")}
                                                            onChange={(e) =>
                                                                updateItem(item._key, {
                                                                    discount_value: e.target.value,
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Remise globale */}
                        <div className="space-y-3 pt-4 border-t">
                            <p className="text-sm font-semibold">Remise globale sur la vente</p>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <select
                                        value={discountType}
                                        onChange={(e) =>
                                            setDiscountType(e.target.value as SaleDiscountType)
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        <option value="none">Aucune</option>
                                        <option value="percentage">Pourcentage (%)</option>
                                        <option value="fixed">Montant fixe</option>
                                    </select>
                                </div>
                                {discountType !== "none" && (
                                    <div className="space-y-2">
                                        <Label>
                                            Valeur{" "}
                                            {discountType === "percentage"
                                                ? "(% sur sous-total)"
                                                : "(montant)"}
                                        </Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={discountValue}
                                            onChange={(e) => setDiscountValue(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Échéances (credit only) */}
                        {saleType === "credit" && (
                            <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-semibold">
                                            Échéancier
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Les paiements échelonnés planifiés
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addInstallment}
                                        className="gap-2"
                                    >
                                        <FaPlus className="h-3 w-3" />
                                        Échéance
                                    </Button>
                                </div>
                                {installments.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">
                                        Sans échéance définie, le total est dû à la date d'échéance finale.
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {installments.map((inst, idx) => (
                                            <div
                                                key={inst._key}
                                                className="flex items-end gap-2 p-2 border rounded"
                                            >
                                                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary rounded flex items-center justify-center text-xs font-semibold">
                                                    #{idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <Label className="text-xs">Date</Label>
                                                    <Input
                                                        type="date"
                                                        value={inst.due_date}
                                                        onChange={(e) =>
                                                            updateInstallment(inst._key, {
                                                                due_date: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <Label className="text-xs">Montant</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={String(inst.amount)}
                                                        onChange={(e) =>
                                                            updateInstallment(inst._key, {
                                                                amount: e.target.value,
                                                            })
                                                        }
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeInstallment(inst._key)}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2 pt-4 border-t">
                            <Label htmlFor="notes">Notes</Label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <textarea
                                    id="notes"
                                    rows={2}
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
                                disabled={createSale.isPending}
                                className="gap-2"
                            >
                                {createSale.isPending ? (
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
