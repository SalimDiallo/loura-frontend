"use client";

import { GenerateDocumentButton } from "@/components/documents";
import { PermissionGuard, useOrgPermissions } from "@/components/permissions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
    useCancelPurchaseOrder,
    useCreatePurchaseOrderPayment,
    useDeletePurchaseOrder,
    useDeletePurchaseOrderPayment,
    usePurchaseOrder,
    useReceivePurchaseOrder,
    useSendPurchaseOrder,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import {
    PURCHASE_ORDER_PAYMENT_METHODS,
    type PurchaseOrderPaymentMethod,
    type PurchaseOrderPaymentStatus,
    type PurchaseOrderStatus,
} from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaArrowLeft,
    FaCheckCircle,
    FaClock,
    FaCreditCard,
    FaEdit,
    FaHourglassHalf,
    FaPaperPlane,
    FaPlus,
    FaReceipt,
    FaTimes,
    FaTrash,
    FaTruckLoading,
} from "react-icons/fa";
import { toast } from "sonner";

export default function PurchaseOrderDetailPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.PURCHASE_ORDERS.VIEW}>
            <PurchaseOrderDetailPage />
        </PermissionGuard>
    );
}

const STATUS_STYLES: Record<
    PurchaseOrderStatus,
    { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
    draft: { color: "bg-gray-100 text-gray-700 border-gray-200", icon: FaEdit },
    sent: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: FaClock },
    partial: {
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: FaHourglassHalf,
    },
    received: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: FaCheckCircle,
    },
    cancelled: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: FaTimes,
    },
};

const PAYMENT_BADGE: Record<
    PurchaseOrderPaymentStatus,
    { color: string; label: string }
> = {
    unpaid: { color: "bg-red-50 text-red-700 border-red-200", label: "Non payé" },
    partial: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Partiellement payé",
    },
    paid: {
        color: "bg-green-50 text-green-700 border-green-200",
        label: "Payé",
    },
};

function PurchaseOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const poId = params.purchaseOrderId as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.PURCHASE_ORDERS.MANAGE);
    const { formatCurrency } = useCurrencyFormatter();

    const { data: po, isLoading } = usePurchaseOrder(orgId, poId);

    const sendMutation = useSendPurchaseOrder();
    const cancelMutation = useCancelPurchaseOrder();
    const receiveMutation = useReceivePurchaseOrder();
    const deleteMutation = useDeletePurchaseOrder();
    const paymentMutation = useCreatePurchaseOrderPayment();
    const deletePaymentMutation = useDeletePurchaseOrderPayment();

    const [showDelete, setShowDelete] = useState(false);
    const [showCancel, setShowCancel] = useState(false);

    // Map item.id → quantity à réceptionner pour le form de réception
    const [receiveQuantities, setReceiveQuantities] = useState<
        Record<string, string>
    >({});
    const [receiveReference, setReceiveReference] = useState("");
    const [receiveNotes, setReceiveNotes] = useState("");

    // Form paiement
    const [payAmount, setPayAmount] = useState("");
    const [payDate, setPayDate] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [payMethod, setPayMethod] =
        useState<PurchaseOrderPaymentMethod>("cash");
    const [payReference, setPayReference] = useState("");
    const [payNotes, setPayNotes] = useState("");

    const totalToReceive = useMemo(() => {
        if (!po) return 0;
        return po.items.reduce((acc, it) => {
            const qty = parseFloat(receiveQuantities[it.id] || "0");
            return acc + (Number.isFinite(qty) ? qty : 0);
        }, 0);
    }, [po, receiveQuantities]);

    if (isLoading || !po) {
        return (
            <div className="container mx-auto p-6 space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        );
    }

    const statusStyle = STATUS_STYLES[po.status];
    const StatusIcon = statusStyle.icon;
    const paymentBadge = PAYMENT_BADGE[po.payment_status];

    const handleSend = async () => {
        try {
            await sendMutation.mutateAsync({ orgId, id: poId });
            toast.success("Commande validée. Elle est désormais en cours.");
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.data?.error || error?.message,
            });
        }
    };

    const handleCancel = async () => {
        try {
            await cancelMutation.mutateAsync({ orgId, id: poId });
            toast.success("Commande annulée.");
            setShowCancel(false);
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.data?.error || error?.message,
            });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync({ orgId, id: poId });
            toast.success("Commande supprimée.");
            router.push(`/organisation/${orgId}/inventory/purchase-orders`);
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.data?.error || error?.message,
            });
        }
    };

    const handleReceive = async () => {
        const lines = Object.entries(receiveQuantities)
            .map(([item_id, qty]) => ({
                item_id,
                quantity: qty,
            }))
            .filter((l) => parseFloat(String(l.quantity)) > 0);

        if (lines.length === 0) {
            toast("Aucune ligne à réceptionner", {
                description: "Saisissez une quantité > 0 pour au moins une ligne.",
            });
            return;
        }

        try {
            await receiveMutation.mutateAsync({
                orgId,
                id: poId,
                data: {
                    lines,
                    reference: receiveReference,
                    notes: receiveNotes,
                },
            });
            toast.success("Réception enregistrée.");
            setReceiveQuantities({});
            setReceiveReference("");
            setReceiveNotes("");
        } catch (error: any) {
            toast.error("Erreur", {
                description:
                    error?.data?.lines?.[0] ||
                    error?.data?.detail ||
                    error?.message,
            });
        }
    };

    const handleRecordPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payAmount || parseFloat(payAmount) <= 0) {
            toast("Montant invalide", { description: "Saisissez un montant > 0." });
            return;
        }
        try {
            await paymentMutation.mutateAsync({
                orgId,
                id: poId,
                data: {
                    amount: payAmount,
                    payment_date: payDate,
                    method: payMethod,
                    reference: payReference,
                    notes: payNotes,
                },
            });
            toast.success("Paiement enregistré.");
            setPayAmount("");
            setPayReference("");
            setPayNotes("");
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.data?.detail || error?.message,
            });
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        try {
            await deletePaymentMutation.mutateAsync({ orgId, id: poId, paymentId });
            toast.success("Paiement supprimé.");
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.data?.detail || error?.message,
            });
        }
    };

    const canReceive =
        canManage && (po.status === "sent" || po.status === "partial");
    const canAddPayment =
        canManage && po.status !== "cancelled" && po.payment_status !== "paid";
    const canCancel =
        canManage &&
        po.status !== "cancelled" &&
        po.status !== "received" &&
        po.payments.length === 0;

    return (
        <>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                        >
                            <FaArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold font-mono">
                                    {po.order_number}
                                </h1>
                                <Badge
                                    variant="outline"
                                    className={`gap-1.5 ${statusStyle.color}`}
                                >
                                    <StatusIcon className="h-3 w-3" />
                                    {po.status_display}
                                </Badge>
                                <Badge variant="outline" className={paymentBadge.color}>
                                    {paymentBadge.label}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {po.supplier.name} · {po.warehouse.name} ·{" "}
                                {new Date(po.order_date).toLocaleDateString("fr-FR")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <GenerateDocumentButton
                            orgId={orgId}
                            docType="purchase_order"
                            objectId={po.id}
                            modalTitle={`Bon de commande · ${po.order_number}`}
                            modalSubtitle={po.supplier.name}
                            variant="outline"
                            className="gap-2"
                        >
                            Bon de commande
                        </GenerateDocumentButton>
                        {canManage && po.status === "draft" && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.push(
                                            `/organisation/${orgId}/inventory/purchase-orders/${po.id}/edit`
                                        )
                                    }
                                    className="gap-2"
                                >
                                    <FaEdit className="h-3.5 w-3.5" />
                                    Modifier
                                </Button>
                                <Button
                                    onClick={handleSend}
                                    disabled={sendMutation.isPending}
                                    className="gap-2"
                                >
                                    {sendMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FaPaperPlane className="h-3.5 w-3.5" />
                                    )}
                                    Valider la commande
                                </Button>
                            </>
                        )}
                        {canCancel && (
                            <Button
                                variant="outline"
                                onClick={() => setShowCancel(true)}
                                className="gap-2 text-amber-700 hover:text-amber-800"
                            >
                                <FaTimes className="h-3.5 w-3.5" />
                                Annuler
                            </Button>
                        )}
                        {canManage && po.status === "draft" && (
                            <Button
                                variant="outline"
                                onClick={() => setShowDelete(true)}
                                className="gap-2 text-destructive hover:text-destructive"
                            >
                                <FaTrash className="h-3.5 w-3.5" />
                                Supprimer
                            </Button>
                        )}
                    </div>
                </div>

                {/* Résumé financier */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-xs text-muted-foreground mb-1">Total</p>
                            <p className="text-2xl font-bold">
                                {formatCurrency(Number(po.total))}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                dont taxes {formatCurrency(Number(po.tax_amount))}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-xs text-muted-foreground mb-1">Payé</p>
                            <p className="text-2xl font-bold text-green-700">
                                {formatCurrency(Number(po.paid_amount))}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-xs text-muted-foreground mb-1">Restant dû</p>
                            <p
                                className={`text-2xl font-bold ${Number(po.outstanding_amount) > 0 ? "text-red-700" : "text-muted-foreground"}`}
                            >
                                {formatCurrency(Number(po.outstanding_amount))}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-xs text-muted-foreground mb-1">
                                Date prévue
                            </p>
                            <p className="text-2xl font-bold">
                                {po.expected_date
                                    ? new Date(po.expected_date).toLocaleDateString(
                                          "fr-FR"
                                      )
                                    : "—"}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="items" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="items">
                            <span className="flex items-center gap-2">
                                <FaEdit className="h-3 w-3" />
                                Lignes ({po.items.length})
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="receive" disabled={!canReceive}>
                            <span className="flex items-center gap-2">
                                <FaTruckLoading className="h-3 w-3" />
                                Réception
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="payments">
                            <span className="flex items-center gap-2">
                                <FaCreditCard className="h-3 w-3" />
                                Paiements ({po.payments.length})
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="info">Infos</TabsTrigger>
                    </TabsList>

                    {/* ── Lignes ────────────────────────────────────── */}
                    <TabsContent value="items">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Produits commandés
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-b">
                                            <tr className="text-left">
                                                <th className="py-2 pr-4">Produit</th>
                                                <th className="py-2 pr-4 text-right">Commandé</th>
                                                <th className="py-2 pr-4 text-right">Reçu</th>
                                                <th className="py-2 pr-4 text-right">
                                                    Coût unit.
                                                </th>
                                                <th className="py-2 pr-4 text-right">TVA</th>
                                                <th className="py-2 text-right">Total ligne</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {po.items.map((item) => (
                                                <tr key={item.id} className="border-b">
                                                    <td className="py-3 pr-4">
                                                        <div className="font-medium">
                                                            {item.product.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {item.product.sku}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 pr-4 text-right">
                                                        {Number(
                                                            item.quantity_ordered
                                                        ).toLocaleString("fr-FR")}{" "}
                                                        <span className="text-xs text-muted-foreground">
                                                            {item.product.unit_display.toLowerCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-4 text-right">
                                                        <span
                                                            className={
                                                                item.is_fully_received
                                                                    ? "text-green-700"
                                                                    : Number(item.quantity_received) > 0
                                                                      ? "text-amber-700"
                                                                      : "text-muted-foreground"
                                                            }
                                                        >
                                                            {Number(
                                                                item.quantity_received
                                                            ).toLocaleString("fr-FR")}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-4 text-right">
                                                        {formatCurrency(Number(item.unit_cost))}
                                                    </td>
                                                    <td className="py-3 pr-4 text-right">
                                                        {Number(item.tax_rate)}%
                                                    </td>
                                                    <td className="py-3 text-right font-semibold">
                                                        {formatCurrency(Number(item.line_total))}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td colSpan={5} className="py-2 pr-4 text-right">
                                                    Sous-total
                                                </td>
                                                <td className="py-2 text-right">
                                                    {formatCurrency(Number(po.subtotal))}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan={5} className="py-2 pr-4 text-right">
                                                    Taxes
                                                </td>
                                                <td className="py-2 text-right">
                                                    {formatCurrency(Number(po.tax_amount))}
                                                </td>
                                            </tr>
                                            <tr className="border-t">
                                                <td
                                                    colSpan={5}
                                                    className="py-3 pr-4 text-right font-bold"
                                                >
                                                    Total TTC
                                                </td>
                                                <td className="py-3 text-right text-lg font-bold text-primary">
                                                    {formatCurrency(Number(po.total))}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Réception ─────────────────────────────────── */}
                    <TabsContent value="receive">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Enregistrer une réception
                                </CardTitle>
                                <CardDescription>
                                    Saisissez la quantité reçue pour chaque ligne. Un mouvement
                                    de stock sera créé automatiquement.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {po.items.map((item) => {
                                        const remaining = Number(item.remaining_to_receive);
                                        const disabled = remaining <= 0;
                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3 p-3 border rounded-md"
                                            >
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">
                                                        {item.product.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Restant à recevoir :{" "}
                                                        <span
                                                            className={
                                                                remaining > 0
                                                                    ? "text-amber-700 font-semibold"
                                                                    : "text-green-700"
                                                            }
                                                        >
                                                            {remaining.toLocaleString("fr-FR")}{" "}
                                                            {item.product.unit_display.toLowerCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="w-32">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max={remaining}
                                                        step="0.001"
                                                        placeholder="0"
                                                        value={receiveQuantities[item.id] ?? ""}
                                                        onChange={(e) =>
                                                            setReceiveQuantities({
                                                                ...receiveQuantities,
                                                                [item.id]: e.target.value,
                                                            })
                                                        }
                                                        disabled={disabled}
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={disabled}
                                                    onClick={() =>
                                                        setReceiveQuantities({
                                                            ...receiveQuantities,
                                                            [item.id]: String(remaining),
                                                        })
                                                    }
                                                    title="Remplir avec la quantité restante"
                                                >
                                                    Tout
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="grid gap-3 md:grid-cols-2 pt-3 border-t">
                                    <div className="space-y-2">
                                        <Label htmlFor="receive_ref">Référence</Label>
                                        <Input
                                            id="receive_ref"
                                            placeholder="Bon de livraison, BL-..."
                                            value={receiveReference}
                                            onChange={(e) =>
                                                setReceiveReference(e.target.value)
                                            }
                                            maxLength={100}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="receive_notes">Notes</Label>
                                        <Input
                                            id="receive_notes"
                                            value={receiveNotes}
                                            onChange={(e) => setReceiveNotes(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-3 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Total à réceptionner :{" "}
                                        <span className="font-semibold">
                                            {totalToReceive.toLocaleString("fr-FR")}
                                        </span>
                                    </p>
                                    <Button
                                        onClick={handleReceive}
                                        disabled={
                                            receiveMutation.isPending || totalToReceive <= 0
                                        }
                                        className="gap-2"
                                    >
                                        {receiveMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <FaTruckLoading className="h-3.5 w-3.5" />
                                        )}
                                        Valider la réception
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Paiements ─────────────────────────────────── */}
                    <TabsContent value="payments">
                        <div className="grid gap-4 lg:grid-cols-3">
                            {canAddPayment && (
                                <Card className="lg:col-span-1">
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Nouveau paiement
                                        </CardTitle>
                                        <CardDescription>
                                            Paiement partiel ou total
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form
                                            onSubmit={handleRecordPayment}
                                            className="space-y-3"
                                        >
                                            <div className="space-y-2">
                                                <Label htmlFor="pay_amount">Montant *</Label>
                                                <Input
                                                    id="pay_amount"
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    max={Number(po.outstanding_amount)}
                                                    value={payAmount}
                                                    onChange={(e) => setPayAmount(e.target.value)}
                                                    required
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Restant dû :{" "}
                                                    {formatCurrency(Number(po.outstanding_amount))}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pay_date">Date *</Label>
                                                <Input
                                                    id="pay_date"
                                                    type="date"
                                                    value={payDate}
                                                    onChange={(e) => setPayDate(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pay_method">Méthode *</Label>
                                                <select
                                                    id="pay_method"
                                                    value={payMethod}
                                                    onChange={(e) =>
                                                        setPayMethod(
                                                            e.target.value as PurchaseOrderPaymentMethod
                                                        )
                                                    }
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                >
                                                    {PURCHASE_ORDER_PAYMENT_METHODS.map((m) => (
                                                        <option key={m.value} value={m.value}>
                                                            {m.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pay_ref">Référence</Label>
                                                <Input
                                                    id="pay_ref"
                                                    placeholder="N° de virement..."
                                                    value={payReference}
                                                    onChange={(e) =>
                                                        setPayReference(e.target.value)
                                                    }
                                                    maxLength={100}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pay_notes">Notes</Label>
                                                <textarea
                                                    id="pay_notes"
                                                    rows={2}
                                                    value={payNotes}
                                                    onChange={(e) => setPayNotes(e.target.value)}
                                                    className="flex w-full border border-input bg-transparent px-3 py-2 text-sm rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={paymentMutation.isPending}
                                                className="w-full gap-2"
                                            >
                                                {paymentMutation.isPending ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <FaPlus className="h-3.5 w-3.5" />
                                                )}
                                                Enregistrer
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            )}
                            <Card
                                className={canAddPayment ? "lg:col-span-2" : "lg:col-span-3"}
                            >
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Historique des paiements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {po.payments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            Aucun paiement enregistré.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {po.payments.map((p) => (
                                                <div
                                                    key={p.id}
                                                    className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/30"
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg font-bold text-green-700">
                                                                {formatCurrency(Number(p.amount))}
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {p.method_display}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(
                                                                p.payment_date
                                                            ).toLocaleDateString("fr-FR")}
                                                            {p.reference && ` · ${p.reference}`}
                                                        </div>
                                                        {p.created_by_info && (
                                                            <div className="text-[10px] text-muted-foreground/70 mt-1">
                                                                enregistré par{" "}
                                                                {p.created_by_info.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <GenerateDocumentButton
                                                            orgId={orgId}
                                                            docType="purchase_payment_receipt"
                                                            objectId={p.id}
                                                            modalTitle={`Reçu fournisseur · ${po.order_number}`}
                                                            modalSubtitle={po.supplier.name}
                                                            variant="ghost"
                                                            size="sm"
                                                            hideIcon
                                                        >
                                                            <FaReceipt className="h-3 w-3" />
                                                        </GenerateDocumentButton>
                                                        {canManage && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => handleDeletePayment(p.id)}
                                                                disabled={deletePaymentMutation.isPending}
                                                            >
                                                                <FaTrash className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ── Infos ─────────────────────────────────────── */}
                    <TabsContent value="info">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Informations</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Fournisseur
                                        </p>
                                        <p className="font-medium">{po.supplier.name}</p>
                                        {po.supplier.code && (
                                            <p className="text-xs text-muted-foreground">
                                                {po.supplier.code}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            Paiement à {po.supplier.payment_terms_days} jours
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Entrepôt de livraison
                                        </p>
                                        <p className="font-medium">{po.warehouse.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {po.warehouse.code}
                                        </p>
                                    </div>
                                </div>
                                {po.notes && (
                                    <div className="pt-3 border-t">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Notes
                                        </p>
                                        <p className="text-sm whitespace-pre-wrap">
                                            {po.notes}
                                        </p>
                                    </div>
                                )}
                                <AuditFootprint
                                    created_at={po.created_at}
                                    updated_at={po.updated_at}
                                    created_by_info={po.created_by_info ?? null}
                                    updated_by_info={po.updated_by_info ?? null}
                                    className="pt-3 border-t"
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Cancel dialog */}
            <Dialog open={showCancel} onOpenChange={setShowCancel}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Annuler cette commande ?</DialogTitle>
                        <DialogDescription>
                            La commande{" "}
                            <span className="font-mono font-semibold">
                                {po.order_number}
                            </span>{" "}
                            sera marquée comme annulée. Cette action ne peut pas être faite
                            si une réception a eu lieu.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCancel(false)}
                        >
                            Retour
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={cancelMutation.isPending}
                        >
                            {cancelMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Confirmer l'annulation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Supprimer ce brouillon ?</DialogTitle>
                        <DialogDescription>
                            Cette action est irréversible. Le brouillon{" "}
                            <span className="font-mono font-semibold">
                                {po.order_number}
                            </span>{" "}
                            sera définitivement supprimé.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDelete(false)}
                        >
                            Annuler
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="gap-2"
                        >
                            {deleteMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FaTrash className="h-3.5 w-3.5" />
                            )}
                            Supprimer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
