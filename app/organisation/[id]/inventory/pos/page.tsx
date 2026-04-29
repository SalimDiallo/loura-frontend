"use client";

import { GenerateDocumentButton } from "@/components/documents";
import { ListPagination } from "@/components/layout/ListPageLayout";
import { PermissionGuard } from "@/components/permissions";
import PageHelper from "@/components/services/organisation/PageHelper";
import { QuickSelect } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { useCurrencyFormatter } from "@/lib/hooks";
import { useCustomers } from "@/lib/hooks/hr";
import {
    useCategories,
    useCompleteSale,
    useCreateSale,
    useCreateSalePayment,
    usePaginatedProducts,
    useStocks,
    useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import {
    SALE_PAYMENT_METHODS,
    type Category,
    type CreateSaleData,
    type CreateSaleInstallmentData,
    type Customer,
    type Product,
    type SaleDiscountType,
    type SalePaymentMethod,
    type SaleType,
    type Stock,
    type Warehouse,
} from "@/lib/types";
import {
    Box,
    ChevronDown,
    CreditCard,
    Loader2,
    Minus,
    Percent,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
    User,
    Warehouse as WarehouseIcon,
    X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaMoneyBillWave, FaReceipt } from "react-icons/fa";
import { toast } from "sonner";

export default function POSPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.SALES.MANAGE}>
            <POSPage />
        </PermissionGuard>
    );
}

// ─── Panier ──────────────────────────────────────────────────────────────────

interface CartLine {
    product: Product;
    quantity: number;
    unit_price: string;
    tax_rate: string;
    discount_type: SaleDiscountType;
    discount_value: string;
}

interface FormInstallment extends CreateSaleInstallmentData {
    _key: string;
}

let instCounter = 0;
const nextInstKey = () => `inst-${++instCounter}`;

// ─── Page ────────────────────────────────────────────────────────────────────

function POSPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { formatCurrency } = useCurrencyFormatter();
    const today = new Date().toISOString().split("T")[0];

    // Datasets
    const { data: categoriesList = [] } = useCategories(orgId, {
        page_size: "all",
    });
    const { data: warehousesList = [] } = useWarehouses(orgId, {
        page_size: "all",
        is_active: true,
    });
    const { data: customersList = [] } = useCustomers(orgId, {
        page_size: "all",
        is_active: "true",
    });

    const categories = categoriesList as unknown as Category[];
    const warehouses = warehousesList as unknown as Warehouse[];
    const customers = customersList as unknown as Customer[];

    // Filtres grille (déclarés avant le hook produits car utilisés par les filtres serveur)
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("");

    // Produits paginés côté serveur (search + category appliqués au backend)
    const productsFilters = useMemo(
        () => ({
            is_active: true,
            search: search.trim() || undefined,
            category: categoryFilter || undefined,
        }),
        [search, categoryFilter]
    );
    const {
        data: products,
        meta: productsMeta,
        setPage: setProductsPage,
        nextPage: nextProductsPage,
        prevPage: prevProductsPage,
        isLoading: loadingProducts,
    } = usePaginatedProducts(orgId, productsFilters, { pageSize: 10 });

    // Sélection warehouse par défaut
    const [warehouseId, setWarehouseId] = useState<string>("");
    useEffect(() => {
        if (!warehouseId && warehouses.length > 0) {
            const defaultWh = warehouses.find((w) => w.is_default) ?? warehouses[0];
            setWarehouseId(defaultWh.id);
        }
    }, [warehouses, warehouseId]);

    // Stock disponible par produit pour l'entrepôt sélectionné
    const { data: stocksList = [] } = useStocks(orgId, {
        warehouse: warehouseId || undefined,
        page_size: "all",
    });
    const stockByProductId = useMemo(() => {
        const map: Record<string, number> = {};
        for (const s of stocksList as unknown as Stock[]) {
            map[s.product.id] = Number(s.quantity);
        }
        return map;
    }, [stocksList]);
    const stockOf = (product: Product) => {
        if (!product.track_stock) return Infinity;
        return stockByProductId[product.id] ?? 0;
    };

    // Panier
    const [cart, setCart] = useState<CartLine[]>([]);

    const addToCart = (product: Product) => {
        const max = stockOf(product);
        if (max <= 0) {
            toast.error("Stock épuisé", {
                description: `${product.name} n'est pas disponible dans cet entrepôt.`,
            });
            return;
        }
        setCart((prev) => {
            const existing = prev.find((l) => l.product.id === product.id);
            if (existing) {
                if (existing.quantity >= max) {
                    toast.warning("Stock atteint", {
                        description: `Stock disponible : ${max}.`,
                    });
                    return prev;
                }
                return prev.map((l) =>
                    l.product.id === product.id
                        ? { ...l, quantity: l.quantity + 1 }
                        : l
                );
            }
            return [
                ...prev,
                {
                    product,
                    quantity: 1,
                    unit_price: product.selling_price,
                    tax_rate: product.tax_rate ?? "0",
                    discount_type: "none",
                    discount_value: "0",
                },
            ];
        });
    };

    const updateLine = (productId: string, patch: Partial<CartLine>) => {
        setCart((prev) =>
            prev.map((l) => {
                if (l.product.id !== productId) return l;
                const next = { ...l, ...patch };
                if (patch.quantity !== undefined) {
                    const max = stockOf(l.product);
                    if (next.quantity > max) {
                        toast.warning("Stock atteint", {
                            description: `Stock disponible : ${max}.`,
                        });
                        next.quantity = max;
                    }
                }
                return next;
            })
        );
    };

    const changeQty = (productId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((l) => {
                    if (l.product.id !== productId) return l;
                    const max = stockOf(l.product);
                    const target = l.quantity + delta;
                    if (delta > 0 && target > max) {
                        toast.warning("Stock atteint", {
                            description: `Stock disponible : ${max}.`,
                        });
                        return { ...l, quantity: max };
                    }
                    return { ...l, quantity: target };
                })
                .filter((l) => l.quantity > 0)
        );
    };

    const removeLine = (productId: string) => {
        setCart((prev) => prev.filter((l) => l.product.id !== productId));
    };

    const clearCart = () => setCart([]);

    // Options
    const [saleType, setSaleType] = useState<SaleType>("cash");
    const [customerId, setCustomerId] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>("cash");
    const [paymentReference, setPaymentReference] = useState("");
    const [globalDiscountType, setGlobalDiscountType] =
        useState<SaleDiscountType>("none");
    const [globalDiscountValue, setGlobalDiscountValue] = useState("0");
    const [notes, setNotes] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [installments, setInstallments] = useState<FormInstallment[]>([]);

    // Collapsibles
    const [showDiscounts, setShowDiscounts] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [showInstallments, setShowInstallments] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);

    // Dernière vente encaissée : déclenche la modale de succès (aperçu facture).
    const [lastSale, setLastSale] = useState<
        { id: string; number: string; total: number; customerName: string | null } | null
    >(null);

    // Totaux
    const totals = useMemo(() => {
        let subtotal = 0;
        let totalTax = 0;
        for (const line of cart) {
            const price = parseFloat(line.unit_price || "0");
            const qty = line.quantity;
            if (!Number.isFinite(qty) || !Number.isFinite(price)) continue;
            const base = qty * price;
            const dv = parseFloat(line.discount_value || "0");
            let afterDisc = base;
            if (line.discount_type === "percentage") {
                afterDisc = base - (base * dv) / 100;
            } else if (line.discount_type === "fixed") {
                afterDisc = base - Math.min(dv, base);
            }
            const rate = parseFloat(line.tax_rate || "0");
            subtotal += afterDisc;
            totalTax += (afterDisc * rate) / 100;
        }
        let globalDiscount = 0;
        const gdv = parseFloat(globalDiscountValue || "0");
        if (globalDiscountType === "percentage") {
            globalDiscount = (subtotal * gdv) / 100;
        } else if (globalDiscountType === "fixed") {
            globalDiscount = Math.min(gdv, subtotal);
        }
        const base = subtotal - globalDiscount;
        const taxRatio = subtotal > 0 ? base / subtotal : 0;
        const adjTax = totalTax * taxRatio;
        return {
            subtotal,
            discount: globalDiscount,
            tax: adjTax,
            total: base + adjTax,
        };
    }, [cart, globalDiscountType, globalDiscountValue]);

    const installmentsTotal = useMemo(
        () =>
            installments.reduce(
                (a, i) => a + (parseFloat(String(i.amount || 0)) || 0),
                0
            ),
        [installments]
    );

    // Mutations
    const createSale = useCreateSale();
    const completeSale = useCompleteSale();
    const createPayment = useCreateSalePayment();

    const isCheckingOut =
        createSale.isPending || completeSale.isPending || createPayment.isPending;

    // Actions
    const handleCheckout = () => {
        if (cart.length === 0) {
            toast("Panier vide", { description: "Ajoutez au moins un produit." });
            return;
        }
        if (!warehouseId) {
            toast("Entrepôt manquant", {
                description: "Sélectionnez l'entrepôt de vente.",
            });
            return;
        }
        if (saleType === "credit" && !customerId) {
            toast("Client requis", {
                description: "Une vente à crédit nécessite un client.",
            });
            return;
        }
        // Vérification stock côté front avant ouverture
        const insufficient = cart.find(
            (l) => l.product.track_stock && l.quantity > stockOf(l.product)
        );
        if (insufficient) {
            toast.error("Stock insuffisant", {
                description: `${insufficient.product.name} : ${stockOf(insufficient.product)} dispo.`,
            });
            return;
        }
        setShowCheckoutConfirm(true);
    };

    const handleConfirmCheckout = async () => {
        const payload: CreateSaleData = {
            customer_id: customerId || null,
            warehouse_id: warehouseId,
            sale_type: saleType,
            sale_date: today,
            due_date: saleType === "credit" ? dueDate || null : null,
            discount_type: globalDiscountType,
            discount_value: globalDiscountValue || "0",
            notes,
            items: cart.map((l) => ({
                product_id: l.product.id,
                quantity: String(l.quantity),
                unit_price: l.unit_price,
                tax_rate: l.tax_rate,
                discount_type: l.discount_type,
                discount_value: l.discount_value,
            })),
            installments:
                saleType === "credit" && installments.length > 0
                    ? installments.map(({ _key, ...rest }) => rest)
                    : undefined,
        };

        try {
            // 1. créer brouillon
            const created = await createSale.mutateAsync({ orgId, data: payload });
            const saleId = created.data.id;
            // 2. finaliser (décrémente le stock)
            await completeSale.mutateAsync({ orgId, id: saleId });
            // 3. si cash, enregistrer un paiement intégral
            if (saleType === "cash" && totals.total > 0) {
                await createPayment.mutateAsync({
                    orgId,
                    id: saleId,
                    data: {
                        amount: totals.total.toFixed(2),
                        payment_date: today,
                        method: paymentMethod,
                        reference: paymentReference,
                        notes: "",
                    },
                });
            }
            toast.success(`Vente ${created.data.sale_number} enregistrée`, {
                description: `Total : ${formatCurrency(totals.total)}`,
            });
            // Capture pour la modale facture
            setLastSale({
                id: saleId,
                number: created.data.sale_number,
                total: totals.total,
                customerName:
                    customers.find((c) => c.id === customerId)?.name ?? null,
            });
            // Reset
            clearCart();
            setCustomerId("");
            setPaymentReference("");
            setGlobalDiscountType("none");
            setGlobalDiscountValue("0");
            setNotes("");
            setDueDate("");
            setInstallments([]);
            setShowCheckoutConfirm(false);
        } catch (error: any) {
            toast.error("Erreur lors de l'encaissement", {
                description:
                    error?.data?.detail ||
                    error?.data?.items?.[0] ||
                    error?.data?.error ||
                    error?.message ||
                    "Une erreur est survenue",
            });
        }
    };

    const addInstallment = () => {
        setInstallments((prev) => [
            ...prev,
            { _key: nextInstKey(), due_date: today, amount: "0" },
        ]);
    };
    const updateInstallment = (key: string, patch: Partial<FormInstallment>) => {
        setInstallments((prev) =>
            prev.map((i) => (i._key === key ? { ...i, ...patch } : i))
        );
    };
    const removeInstallment = (key: string) => {
        setInstallments((prev) => prev.filter((i) => i._key !== key));
    };

    return (
        <>
        <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
            {/* ──── Grille produits ──── */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
                {/* Header POS */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-10 bg-primary/10 text-primary flex items-center justify-center rounded-md">
                            <FaReceipt className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Caisse rapide</h1>
                            <p className="text-xs text-muted-foreground">
                                Encaissement comptant ou crédit
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2" data-tour="pos-warehouse">
                            <WarehouseIcon className="h-4 w-4 text-muted-foreground" />
                            <select
                                value={warehouseId}
                                onChange={(e) => setWarehouseId(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                {warehouses.map((w) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name} {w.is_default ? "★" : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <PageHelper />
                    </div>
                </div>

                {/* Recherche + catégories */}
                <div className="space-y-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            autoFocus
                            placeholder="Rechercher un produit par nom, SKU ou code-barres..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-11 text-base"
                        />
                    </div>
                    {categories.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                            <Button
                                variant={categoryFilter === "" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCategoryFilter("")}
                                className="shrink-0"
                            >
                                Tous
                            </Button>
                            {categories.map((c) => (
                                <Button
                                    key={c.id}
                                    variant={
                                        categoryFilter === c.id ? "default" : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setCategoryFilter(c.id)}
                                    className="shrink-0"
                                >
                                    {c.name}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Grille cartes */}
                <div className="flex-1 overflow-y-auto pr-1" data-tour="pos-products">
                    {loadingProducts ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                            {Array.from({ length: 10 }).map((_, i) => (
                                <Skeleton key={i} className="h-32 w-full rounded-md" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 text-muted-foreground">
                            <Box className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Aucun produit trouvé</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                            {products.map((p) => {
                                const stock = stockOf(p);
                                const tracked = p.track_stock;
                                const outOfStock = tracked && stock <= 0;
                                const lowStock =
                                    tracked && stock > 0 && stock <= 5;
                                const stockBadgeClass = outOfStock
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : lowStock
                                        ? "bg-amber-100 text-amber-700 border-amber-200"
                                        : "bg-emerald-100 text-emerald-700 border-emerald-200";
                                return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => addToCart(p)}
                                    disabled={outOfStock}
                                    className={`group relative text-left border rounded-md p-3 transition-all bg-card ${
                                        outOfStock
                                            ? "opacity-60 cursor-not-allowed"
                                            : "hover:border-primary hover:shadow-sm active:scale-[0.98]"
                                    }`}
                                >
                                    {tracked && (
                                        <Badge
                                            variant="outline"
                                            className={`absolute top-1.5 right-1.5 text-[9px] px-1.5 py-0 h-5 ${stockBadgeClass}`}
                                        >
                                            {outOfStock
                                                ? "Rupture"
                                                : `${stock} ${p.unit_display ?? ""}`.trim()}
                                        </Badge>
                                    )}
                                    <div className="aspect-square w-full bg-muted rounded flex items-center justify-center overflow-hidden mb-2">
                                        {p.image_url ? (
                                            <img
                                                src={p.image_url}
                                                alt={p.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Box className="h-8 w-8 text-muted-foreground/40" />
                                        )}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-medium line-clamp-2 leading-tight">
                                            {p.name}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground font-mono">
                                            {p.sku}
                                        </p>
                                        <p className="text-sm font-bold text-primary">
                                            {formatCurrency(Number(p.selling_price))}
                                        </p>
                                    </div>
                                </button>
                                );
                            })}
                        </div>
                    )}
                    {!loadingProducts && products.length > 0 && (
                        <div className="mt-4 pb-2">
                            <ListPagination
                                meta={productsMeta}
                                onPageChange={setProductsPage}
                                onNext={nextProductsPage}
                                onPrev={prevProductsPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* ──── Panier ──── */}
            <Card className="lg:w-[420px] flex flex-col h-full overflow-hidden" data-tour="pos-cart">
                <div className="p-3 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        <span className="font-semibold text-sm">
                            Panier ({cart.length})
                        </span>
                    </div>
                    {cart.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearCart}
                            className="text-destructive h-7 px-2"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>

                <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                    {/* Lignes */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {cart.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40" />
                                <p className="text-xs">Cliquez sur un produit pour l'ajouter</p>
                            </div>
                        ) : (
                            cart.map((line) => {
                                const base = line.quantity * parseFloat(line.unit_price || "0");
                                const dv = parseFloat(line.discount_value || "0");
                                let lineTotal = base;
                                if (line.discount_type === "percentage") {
                                    lineTotal = base - (base * dv) / 100;
                                } else if (line.discount_type === "fixed") {
                                    lineTotal = base - Math.min(dv, base);
                                }
                                return (
                                    <div
                                        key={line.product.id}
                                        className="border rounded-md p-2 bg-muted/20 space-y-2"
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium truncate">
                                                    {line.product.name}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground font-mono">
                                                    {line.product.sku}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeLine(line.product.id)}
                                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    onClick={() => changeQty(line.product.id, -1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    max={
                                                        Number.isFinite(
                                                            stockOf(line.product)
                                                        )
                                                            ? stockOf(line.product)
                                                            : undefined
                                                    }
                                                    value={line.quantity}
                                                    onChange={(e) =>
                                                        updateLine(line.product.id, {
                                                            quantity: Math.max(
                                                                0,
                                                                parseInt(e.target.value || "0", 10)
                                                            ),
                                                        })
                                                    }
                                                    className="h-7 w-12 text-center px-1 text-xs"
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 w-7 p-0"
                                                    disabled={
                                                        line.quantity >=
                                                        stockOf(line.product)
                                                    }
                                                    onClick={() => changeQty(line.product.id, 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={line.unit_price}
                                                onChange={(e) =>
                                                    updateLine(line.product.id, {
                                                        unit_price: e.target.value,
                                                    })
                                                }
                                                className="h-7 text-xs flex-1"
                                            />
                                            <p className="text-sm font-semibold whitespace-nowrap">
                                                {formatCurrency(lineTotal)}
                                            </p>
                                        </div>
                                        {/* Remise ligne */}
                                        <Collapsible>
                                            <CollapsibleTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-full justify-start text-[10px] text-muted-foreground hover:text-foreground px-1"
                                                >
                                                    <Percent className="h-3 w-3 mr-1" />
                                                    Remise ligne
                                                    {line.discount_type !== "none" &&
                                                        parseFloat(line.discount_value) > 0 && (
                                                            <Badge
                                                                variant="secondary"
                                                                className="ml-auto h-4 px-1 text-[9px]"
                                                            >
                                                                −
                                                                {line.discount_type === "percentage"
                                                                    ? `${line.discount_value}%`
                                                                    : formatCurrency(
                                                                          parseFloat(line.discount_value)
                                                                      )}
                                                            </Badge>
                                                        )}
                                                </Button>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="pt-2 grid grid-cols-2 gap-1">
                                                <select
                                                    value={line.discount_type}
                                                    onChange={(e) =>
                                                        updateLine(line.product.id, {
                                                            discount_type: e.target
                                                                .value as SaleDiscountType,
                                                        })
                                                    }
                                                    className="h-7 rounded border border-input bg-background px-2 text-[10px]"
                                                >
                                                    <option value="none">Aucune</option>
                                                    <option value="percentage">%</option>
                                                    <option value="fixed">Montant</option>
                                                </select>
                                                {line.discount_type !== "none" && (
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={line.discount_value}
                                                        onChange={(e) =>
                                                            updateLine(line.product.id, {
                                                                discount_value: e.target.value,
                                                            })
                                                        }
                                                        className="h-7 text-[10px]"
                                                    />
                                                )}
                                            </CollapsibleContent>
                                        </Collapsible>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Options déroulables */}
                    {cart.length > 0 && (
                        <div className="border-t bg-muted/10 divide-y">
                            {/* Type de vente + client */}
                            <div className="p-3 space-y-2">
                                <div className="grid grid-cols-2 gap-1">
                                    <Button
                                        variant={saleType === "cash" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSaleType("cash")}
                                        className="gap-1.5"
                                    >
                                        <FaMoneyBillWave className="h-3 w-3" />
                                        Comptant
                                    </Button>
                                    <Button
                                        variant={
                                            saleType === "credit" ? "default" : "outline"
                                        }
                                        size="sm"
                                        onClick={() => setSaleType("credit")}
                                        className="gap-1.5"
                                    >
                                        <CreditCard className="h-3 w-3" />
                                        Crédit
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                    <QuickSelect
                                        label="Client"
                                        items={customers
                                            .filter((c) =>
                                                saleType === "credit"
                                                    ? Number(c.credit_limit) > 0
                                                    : true
                                            )
                                            .map((c) => ({
                                                id: c.id,
                                                name: c.name,
                                                subtitle:
                                                    c.phone ||
                                                    (c.email ?? undefined),
                                            }))}
                                        selectedId={customerId}
                                        onSelect={setCustomerId}
                                        placeholder={
                                            saleType === "credit"
                                                ? "— Client requis —"
                                                : "Client (optionnel)"
                                        }
                                        icon={User}
                                        accentColor="blue"
                                        canCreate={false}
                                        disabled={customers.length === 0}
                                    />
                              
                                </div>
                            </div>

                            {/* Remise globale */}
                            <Collapsible
                                open={showDiscounts}
                                onOpenChange={setShowDiscounts}
                            >
                                <CollapsibleTrigger asChild>
                                    <button
                                        type="button"
                                        className="w-full p-3 flex items-center justify-between hover:bg-muted/30 text-xs"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Percent className="h-3.5 w-3.5" />
                                            Remise globale
                                            {globalDiscountType !== "none" &&
                                                parseFloat(globalDiscountValue) > 0 && (
                                                    <Badge
                                                        variant="secondary"
                                                        className="h-5 text-[10px]"
                                                    >
                                                        −
                                                        {globalDiscountType === "percentage"
                                                            ? `${globalDiscountValue}%`
                                                            : formatCurrency(
                                                                  parseFloat(globalDiscountValue)
                                                              )}
                                                    </Badge>
                                                )}
                                        </span>
                                        <ChevronDown
                                            className={`h-3.5 w-3.5 transition-transform ${
                                                showDiscounts ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="p-3 pt-0 grid grid-cols-2 gap-2">
                                    <select
                                        value={globalDiscountType}
                                        onChange={(e) =>
                                            setGlobalDiscountType(
                                                e.target.value as SaleDiscountType
                                            )
                                        }
                                        className="h-9 rounded-md border border-input bg-background px-2 text-xs"
                                    >
                                        <option value="none">Aucune</option>
                                        <option value="percentage">Pourcentage</option>
                                        <option value="fixed">Montant fixe</option>
                                    </select>
                                    {globalDiscountType !== "none" && (
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={globalDiscountValue}
                                            onChange={(e) =>
                                                setGlobalDiscountValue(e.target.value)
                                            }
                                            className="h-9 text-xs"
                                        />
                                    )}
                                </CollapsibleContent>
                            </Collapsible>

                            {/* Paiement */}
                            {saleType === "cash" && (
                                <Collapsible
                                    open={showPayment}
                                    onOpenChange={setShowPayment}
                                >
                                    <CollapsibleTrigger asChild>
                                        <button
                                            type="button"
                                            className="w-full p-3 flex items-center justify-between hover:bg-muted/30 text-xs"
                                        >
                                            <span className="flex items-center gap-2">
                                                <FaMoneyBillWave className="h-3.5 w-3.5" />
                                                Méthode de paiement
                                                <Badge
                                                    variant="outline"
                                                    className="h-5 text-[10px]"
                                                >
                                                    {
                                                        SALE_PAYMENT_METHODS.find(
                                                            (m) => m.value === paymentMethod
                                                        )?.label
                                                    }
                                                </Badge>
                                            </span>
                                            <ChevronDown
                                                className={`h-3.5 w-3.5 transition-transform ${
                                                    showPayment ? "rotate-180" : ""
                                                }`}
                                            />
                                        </button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="p-3 pt-0 space-y-2">
                                        <select
                                            value={paymentMethod}
                                            onChange={(e) =>
                                                setPaymentMethod(
                                                    e.target.value as SalePaymentMethod
                                                )
                                            }
                                            className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs"
                                        >
                                            {SALE_PAYMENT_METHODS.map((m) => (
                                                <option key={m.value} value={m.value}>
                                                    {m.label}
                                                </option>
                                            ))}
                                        </select>
                                        <Input
                                            placeholder="Référence (optionnelle)"
                                            value={paymentReference}
                                            onChange={(e) =>
                                                setPaymentReference(e.target.value)
                                            }
                                            className="h-9 text-xs"
                                        />
                                    </CollapsibleContent>
                                </Collapsible>
                            )}

                            {/* Échéancier crédit */}
                            {saleType === "credit" && (
                                <Collapsible
                                    open={showInstallments}
                                    onOpenChange={setShowInstallments}
                                >
                                    <CollapsibleTrigger asChild>
                                        <button
                                            type="button"
                                            className="w-full p-3 flex items-center justify-between hover:bg-muted/30 text-xs"
                                        >
                                            <span className="flex items-center gap-2">
                                                <CreditCard className="h-3.5 w-3.5" />
                                                Échéances ({installments.length})
                                                {Math.abs(installmentsTotal - totals.total) >
                                                    0.01 &&
                                                    installments.length > 0 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="h-5 text-[10px] text-amber-600"
                                                        >
                                                            ⚠
                                                        </Badge>
                                                    )}
                                            </span>
                                            <ChevronDown
                                                className={`h-3.5 w-3.5 transition-transform ${
                                                    showInstallments ? "rotate-180" : ""
                                                }`}
                                            />
                                        </button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="p-3 pt-0 space-y-2">
                                        <div>
                                            <Label className="text-[10px]">
                                                Échéance finale
                                            </Label>
                                            <Input
                                                type="date"
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addInstallment}
                                            className="w-full h-8 text-xs gap-1"
                                        >
                                            <Plus className="h-3 w-3" />
                                            Ajouter une échéance
                                        </Button>
                                        {installments.map((inst, idx) => (
                                            <div
                                                key={inst._key}
                                                className="flex items-center gap-1"
                                            >
                                                <span className="text-[10px] text-muted-foreground w-6">
                                                    #{idx + 1}
                                                </span>
                                                <Input
                                                    type="date"
                                                    value={inst.due_date}
                                                    onChange={(e) =>
                                                        updateInstallment(inst._key, {
                                                            due_date: e.target.value,
                                                        })
                                                    }
                                                    className="h-7 text-[10px] flex-1"
                                                />
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
                                                    className="h-7 text-[10px] w-24"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeInstallment(inst._key)}
                                                    className="h-7 w-7 p-0 text-destructive"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </CollapsibleContent>
                                </Collapsible>
                            )}

                            {/* Notes */}
                            <Collapsible open={showNotes} onOpenChange={setShowNotes}>
                                <CollapsibleTrigger asChild>
                                    <button
                                        type="button"
                                        className="w-full p-3 flex items-center justify-between hover:bg-muted/30 text-xs"
                                    >
                                        <span className="flex items-center gap-2">
                                            📝 Notes {notes && `(${notes.length})`}
                                        </span>
                                        <ChevronDown
                                            className={`h-3.5 w-3.5 transition-transform ${
                                                showNotes ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="p-3 pt-0">
                                    <textarea
                                        rows={2}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Commentaire libre..."
                                        className="w-full text-xs rounded border border-input bg-background px-2 py-1"
                                    />
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    )}

                    {/* Totaux + checkout */}
                    {cart.length > 0 && (
                        <div className="border-t p-3 space-y-2 bg-background">
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Sous-total</span>
                                    <span>{formatCurrency(totals.subtotal)}</span>
                                </div>
                                {totals.discount > 0 && (
                                    <div className="flex justify-between text-emerald-700">
                                        <span>Remise</span>
                                        <span>−{formatCurrency(totals.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Taxes</span>
                                    <span>{formatCurrency(totals.tax)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                    <span className="font-semibold">Total</span>
                                    <span className="text-lg font-bold text-primary">
                                        {formatCurrency(totals.total)}
                                    </span>
                                </div>
                            </div>
                            <Button
                                size="lg"
                                className="w-full h-11 gap-2"
                                disabled={
                                    isCheckingOut ||
                                    cart.length === 0 ||
                                    !warehouseId ||
                                    (saleType === "credit" && !customerId)
                                }
                                onClick={handleCheckout}
                            >
                                {isCheckingOut ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <FaReceipt className="h-4 w-4" />
                                )}
                                Encaisser {formatCurrency(totals.total)}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Modale confirmation d'encaissement */}
        <Dialog
            open={showCheckoutConfirm}
            onOpenChange={setShowCheckoutConfirm}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Confirmer l'encaissement
                    </DialogTitle>
                    <DialogDescription>
                        Vérifiez les informations avant de finaliser la vente.
                        Le stock sera décompté immédiatement.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 rounded-md border bg-muted/30 p-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Articles</span>
                        <span className="font-medium">
                            {cart.length} ligne{cart.length > 1 ? "s" : ""} ·{" "}
                            {cart.reduce((s, l) => s + l.quantity, 0)} unités
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Type</span>
                        <span className="font-medium">
                            {saleType === "cash" ? "Comptant" : "Crédit"}
                        </span>
                    </div>
                    {saleType === "cash" && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Méthode
                            </span>
                            <span className="font-medium">
                                {SALE_PAYMENT_METHODS.find(
                                    (m) => m.value === paymentMethod
                                )?.label ?? paymentMethod}
                            </span>
                        </div>
                    )}
                    {customerId && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                Client
                            </span>
                            <span className="font-medium">
                                {customers.find((c) => c.id === customerId)
                                    ?.name ?? "—"}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Entrepôt</span>
                        <span className="font-medium">
                            {warehouses.find((w) => w.id === warehouseId)
                                ?.name ?? "—"}
                        </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-bold text-base text-primary">
                            {formatCurrency(totals.total)}
                        </span>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setShowCheckoutConfirm(false)}
                        disabled={isCheckingOut}
                    >
                        Retour
                    </Button>
                    <Button
                        onClick={handleConfirmCheckout}
                        disabled={isCheckingOut}
                        className="gap-2"
                    >
                        {isCheckingOut ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <CreditCard className="h-4 w-4" />
                        )}
                        Confirmer l'encaissement
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Modale succès + aperçu facture */}
        <Dialog
            open={!!lastSale}
            onOpenChange={(open) => {
                if (!open) setLastSale(null);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FaReceipt className="h-4 w-4 text-primary" />
                        Vente enregistrée
                    </DialogTitle>
                    <DialogDescription>
                        {lastSale && (
                            <>
                                <span className="font-mono font-semibold">
                                    {lastSale.number}
                                </span>{" "}
                                · {formatCurrency(lastSale.total)}
                                {lastSale.customerName && (
                                    <> · {lastSale.customerName}</>
                                )}
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setLastSale(null)}
                    >
                        Nouvelle vente
                    </Button>
                    {lastSale && (
                        <GenerateDocumentButton
                            orgId={orgId}
                            docType="sale_invoice"
                            objectId={lastSale.id}
                            modalTitle={`Facture · ${lastSale.number}`}
                            modalSubtitle={
                                lastSale.customerName ?? "Comptoir"
                            }
                            variant="default"
                        >
                            Imprimer la facture
                        </GenerateDocumentButton>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
