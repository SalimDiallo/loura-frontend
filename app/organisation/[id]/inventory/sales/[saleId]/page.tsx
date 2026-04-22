"use client";

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
    useCancelSale,
    useCompleteSale,
    useCreateSalePayment,
    useDeleteSale,
    useDeleteSalePayment,
    useSale,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import {
    SALE_PAYMENT_METHODS,
    type SaleInstallmentStatus,
    type SalePaymentMethod,
    type SalePaymentStatus,
    type SaleStatus,
} from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaCheckCircle,
    FaClock,
    FaCreditCard,
    FaEdit,
    FaExclamationTriangle,
    FaEye,
    FaMoneyBillWave,
    FaPlus,
    FaReceipt,
    FaTimes,
    FaTrash,
} from "react-icons/fa";
import { toast } from "sonner";

export default function SaleDetailPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.SALES.VIEW}>
            <SaleDetailPage />
        </PermissionGuard>
    );
}

const STATUS_STYLES: Record<
    SaleStatus,
    { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
    draft: { color: "bg-gray-100 text-gray-700 border-gray-200", icon: FaEdit },
    completed: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: FaCheckCircle,
    },
    cancelled: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: FaTimes,
    },
};

const PAYMENT_BADGE: Record<SalePaymentStatus, { color: string; label: string }> = {
    unpaid: { color: "bg-red-50 text-red-700 border-red-200", label: "Non payée" },
    partial: {
        color: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Partiellement payée",
    },
    paid: { color: "bg-green-50 text-green-700 border-green-200", label: "Payée" },
};

const INSTALLMENT_BADGE: Record<SaleInstallmentStatus, string> = {
    pending: "bg-gray-100 text-gray-700 border-gray-200",
    partial: "bg-amber-100 text-amber-700 border-amber-200",
    paid: "bg-green-100 text-green-700 border-green-200",
    overdue: "bg-red-100 text-red-700 border-red-200",
};

function SaleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const saleId = params.saleId as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.SALES.MANAGE);
    const { formatCurrency } = useCurrencyFormatter();

    const { data: sale, isLoading } = useSale(orgId, saleId);
    const completeMutation = useCompleteSale();
    const cancelMutation = useCancelSale();
    const deleteMutation = useDeleteSale();
    const paymentMutation = useCreateSalePayment();
    const deletePaymentMutation = useDeleteSalePayment();

    const [showDelete, setShowDelete] = useState(false);
    const [showCancel, setShowCancel] = useState(false);

    // Payment form
    const [payAmount, setPayAmount] = useState("");
    const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
    const [payMethod, setPayMethod] = useState<SalePaymentMethod>("cash");
    const [payInstallmentId, setPayInstallmentId] = useState<string>("");
    const [payReference, setPayReference] = useState("");
    const [payNotes, setPayNotes] = useState("");

    if (isLoading || !sale) {
        return (
            <div className="container mx-auto p-6 space-y-4">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-[500px] w-full" />
            </div>
        );
    }

    const statusStyle = STATUS_STYLES[sale.status];
    const StatusIcon = statusStyle.icon;
    const paymentBadge = PAYMENT_BADGE[sale.payment_status];

    const handleComplete = async () => {
        try {
            await completeMutation.mutateAsync({ orgId, id: saleId });
            toast.success("Vente finalisée. Le stock a été décompté.");
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.data?.error || error?.message,
            });
        }
    };

    const handleCancel = async () => {
        try {
            await cancelMutation.mutateAsync({ orgId, id: saleId });
            toast.success("Vente annulée.");
            setShowCancel(false);
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.data?.error || error?.message,
            });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync({ orgId, id: saleId });
            toast.success("Vente supprimée.");
            router.push(`/organisation/${orgId}/inventory/sales`);
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.data?.error || error?.message,
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
                id: saleId,
                data: {
                    amount: payAmount,
                    payment_date: payDate,
                    method: payMethod,
                    installment_id: payInstallmentId || null,
                    reference: payReference,
                    notes: payNotes,
                },
            });
            toast.success("Paiement enregistré.");
            setPayAmount("");
            setPayReference("");
            setPayNotes("");
            setPayInstallmentId("");
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.data?.detail || error?.message,
            });
        }
    };

    const handleDeletePayment = async (paymentId: string) => {
        try {
            await deletePaymentMutation.mutateAsync({ orgId, id: saleId, paymentId });
            toast.success("Paiement supprimé.");
        } catch (error: any) {
            toast.error("Erreur", {
                description: error?.data?.detail || error?.message,
            });
        }
    };

    const canAddPayment =
        canManage && sale.status !== "cancelled" && sale.payment_status !== "paid";
    const canCancel = canManage && sale.status !== "cancelled" && sale.payments.length === 0;

    return (
        <>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={() => router.back()}>
                            <FaArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-2xl font-bold font-mono">
                                    {sale.sale_number}
                                </h1>
                                <Badge
                                    variant="outline"
                                    className={`gap-1.5 ${statusStyle.color}`}
                                >
                                    <StatusIcon className="h-3 w-3" />
                                    {sale.status_display}
                                </Badge>
                                <Badge variant="outline" className={paymentBadge.color}>
                                    {paymentBadge.label}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className={
                                        sale.sale_type === "credit"
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    }
                                >
                                    {sale.sale_type === "credit" ? (
                                        <FaCreditCard className="h-3 w-3 mr-1" />
                                    ) : (
                                        <FaMoneyBillWave className="h-3 w-3 mr-1" />
                                    )}
                                    {sale.sale_type_display}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {sale.customer?.name ?? "Comptoir"} · {sale.warehouse.name} ·{" "}
                                {new Date(sale.sale_date).toLocaleDateString("fr-FR")}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {canManage && sale.status === "draft" && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        router.push(
                                            `/organisation/${orgId}/inventory/sales/${sale.id}/edit`
                                        )
                                    }
                                    className="gap-2"
                                >
                                    <FaEdit className="h-3.5 w-3.5" />
                                    Modifier
                                </Button>
                                <Button
                                    onClick={handleComplete}
                                    disabled={completeMutation.isPending}
                                    className="gap-2"
                                >
                                    {completeMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FaCheckCircle className="h-3.5 w-3.5" />
                                    )}
                                    Finaliser
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
                        {canManage && sale.status === "draft" && (
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
                            <p className="text-xs text-muted-foreground mb-1">Total TTC</p>
                            <p className="text-2xl font-bold">
                                {formatCurrency(Number(sale.total))}
                            </p>
                            {Number(sale.discount_amount) > 0 && (
                                <p className="text-xs text-emerald-600 mt-1">
                                    dont remise {formatCurrency(Number(sale.discount_amount))}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-xs text-muted-foreground mb-1">Encaissé</p>
                            <p className="text-2xl font-bold text-green-700">
                                {formatCurrency(Number(sale.paid_amount))}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-xs text-muted-foreground mb-1">Restant dû</p>
                            <p
                                className={`text-2xl font-bold ${Number(sale.outstanding_amount) > 0 ? "text-red-700" : "text-muted-foreground"}`}
                            >
                                {formatCurrency(Number(sale.outstanding_amount))}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-xs text-muted-foreground mb-1">Échéance</p>
                            <p className="text-2xl font-bold">
                                {sale.due_date
                                    ? new Date(sale.due_date).toLocaleDateString("fr-FR")
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
                                <FaReceipt className="h-3 w-3" />
                                Articles ({sale.items.length})
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="payments">
                            <span className="flex items-center gap-2">
                                <FaMoneyBillWave className="h-3 w-3" />
                                Paiements ({sale.payments.length})
                            </span>
                        </TabsTrigger>
                        {sale.sale_type === "credit" && (
                            <TabsTrigger value="installments">
                                <span className="flex items-center gap-2">
                                    <FaCalendarAlt className="h-3 w-3" />
                                    Échéances ({sale.installments.length})
                                </span>
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="info">Infos</TabsTrigger>
                    </TabsList>

                    {/* Articles */}
                    <TabsContent value="items">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Articles vendus</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-b">
                                            <tr className="text-left">
                                                <th className="py-2 pr-4">Produit</th>
                                                <th className="py-2 pr-4 text-right">Qté</th>
                                                <th className="py-2 pr-4 text-right">Prix unit.</th>
                                                <th className="py-2 pr-4 text-right">Remise</th>
                                                <th className="py-2 pr-4 text-right">TVA</th>
                                                <th className="py-2 text-right">Total ligne</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sale.items.map((item) => (
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
                                                        {Number(item.quantity).toLocaleString("fr-FR")}{" "}
                                                        <span className="text-xs text-muted-foreground">
                                                            {item.product.unit_display.toLowerCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-4 text-right">
                                                        {formatCurrency(Number(item.unit_price))}
                                                    </td>
                                                    <td className="py-3 pr-4 text-right">
                                                        {item.discount_type === "none" ||
                                                        Number(item.discount_value) === 0 ? (
                                                            <span className="text-xs text-muted-foreground/50">
                                                                —
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-700 text-xs">
                                                                −
                                                                {item.discount_type === "percentage"
                                                                    ? `${item.discount_value}%`
                                                                    : formatCurrency(
                                                                          Number(item.discount_value)
                                                                      )}
                                                            </span>
                                                        )}
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
                                                    {formatCurrency(Number(sale.subtotal))}
                                                </td>
                                            </tr>
                                            {Number(sale.discount_amount) > 0 && (
                                                <tr className="text-emerald-700">
                                                    <td colSpan={5} className="py-2 pr-4 text-right">
                                                        Remise globale
                                                    </td>
                                                    <td className="py-2 text-right">
                                                        −
                                                        {formatCurrency(Number(sale.discount_amount))}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td colSpan={5} className="py-2 pr-4 text-right">
                                                    Taxes
                                                </td>
                                                <td className="py-2 text-right">
                                                    {formatCurrency(Number(sale.tax_amount))}
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
                                                    {formatCurrency(Number(sale.total))}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Paiements */}
                    <TabsContent value="payments">
                        <div className="grid gap-4 lg:grid-cols-3">
                            {canAddPayment && (
                                <Card className="lg:col-span-1">
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Nouveau paiement
                                        </CardTitle>
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
                                                    max={Number(sale.outstanding_amount)}
                                                    value={payAmount}
                                                    onChange={(e) => setPayAmount(e.target.value)}
                                                    required
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Restant dû :{" "}
                                                    {formatCurrency(Number(sale.outstanding_amount))}
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
                                                            e.target.value as SalePaymentMethod
                                                        )
                                                    }
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                >
                                                    {SALE_PAYMENT_METHODS.map((m) => (
                                                        <option key={m.value} value={m.value}>
                                                            {m.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {sale.installments.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="pay_installment">
                                                        Échéance ciblée
                                                    </Label>
                                                    <select
                                                        id="pay_installment"
                                                        value={payInstallmentId}
                                                        onChange={(e) =>
                                                            setPayInstallmentId(e.target.value)
                                                        }
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                    >
                                                        <option value="">Non assigné</option>
                                                        {sale.installments
                                                            .filter((i) => i.status !== "paid")
                                                            .map((inst, idx) => (
                                                                <option key={inst.id} value={inst.id}>
                                                                    #{idx + 1} —{" "}
                                                                    {new Date(
                                                                        inst.due_date
                                                                    ).toLocaleDateString("fr-FR")}{" "}
                                                                    ({formatCurrency(Number(inst.amount))})
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label htmlFor="pay_ref">Référence</Label>
                                                <Input
                                                    id="pay_ref"
                                                    placeholder="Reçu, virement..."
                                                    value={payReference}
                                                    onChange={(e) => setPayReference(e.target.value)}
                                                    maxLength={100}
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
                                    <CardTitle className="text-base">Historique</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {sale.payments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            Aucun paiement enregistré.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {sale.payments.map((p) => (
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
                                                            {new Date(p.payment_date).toLocaleDateString(
                                                                "fr-FR"
                                                            )}
                                                            {p.reference && ` · ${p.reference}`}
                                                        </div>
                                                        {p.created_by_info && (
                                                            <div className="text-[10px] text-muted-foreground/70 mt-1">
                                                                par {p.created_by_info.name}
                                                            </div>
                                                        )}
                                                    </div>
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
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Échéances */}
                    {sale.sale_type === "credit" && (
                        <TabsContent value="installments">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Échéancier de paiement
                                    </CardTitle>
                                    <CardDescription>
                                        Paiements planifiés pour cette vente à crédit
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {sale.installments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            Aucune échéance définie. Le total est dû à la date
                                            d'échéance globale.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {sale.installments.map((inst, idx) => (
                                                <div
                                                    key={inst.id}
                                                    className="flex items-center justify-between p-3 border rounded-md"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                                                            #{idx + 1}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium">
                                                                {formatCurrency(Number(inst.amount))}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <FaCalendarAlt className="h-2.5 w-2.5" />
                                                                {new Date(
                                                                    inst.due_date
                                                                ).toLocaleDateString("fr-FR")}
                                                                {inst.status === "overdue" && (
                                                                    <span className="ml-1 text-red-600 flex items-center gap-0.5">
                                                                        <FaExclamationTriangle className="h-2.5 w-2.5" />
                                                                        en retard
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <div className="text-xs text-muted-foreground">
                                                                Payé
                                                            </div>
                                                            <div className="text-sm font-medium">
                                                                {formatCurrency(Number(inst.paid_amount))}
                                                                {" / "}
                                                                {formatCurrency(Number(inst.amount))}
                                                            </div>
                                                        </div>
                                                        <Badge
                                                            variant="outline"
                                                            className={INSTALLMENT_BADGE[inst.status]}
                                                        >
                                                            {inst.status_display}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* Infos */}
                    <TabsContent value="info">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Informations</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Client</p>
                                        {sale.customer ? (
                                            <>
                                                <p className="font-medium">{sale.customer.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {sale.customer.customer_type_display}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="italic text-muted-foreground">
                                                Vente comptoir (sans client)
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Entrepôt</p>
                                        <p className="font-medium">{sale.warehouse.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {sale.warehouse.code}
                                        </p>
                                    </div>
                                </div>
                                {sale.notes && (
                                    <div className="pt-3 border-t">
                                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                        <p className="text-sm whitespace-pre-wrap">{sale.notes}</p>
                                    </div>
                                )}
                                <AuditFootprint
                                    created_at={sale.created_at}
                                    updated_at={sale.updated_at}
                                    created_by_info={sale.created_by_info ?? null}
                                    updated_by_info={sale.updated_by_info ?? null}
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
                        <DialogTitle>Annuler cette vente ?</DialogTitle>
                        <DialogDescription>
                            La vente{" "}
                            <span className="font-mono font-semibold">{sale.sale_number}</span>{" "}
                            sera annulée. Si elle est finalisée, le stock sera réinjecté.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancel(false)}>
                            Retour
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancel}
                            disabled={cancelMutation.isPending}
                        >
                            {cancelMutation.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            Confirmer
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
                            <span className="font-mono font-semibold">{sale.sale_number}</span>{" "}
                            sera définitivement supprimé.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDelete(false)}>
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
