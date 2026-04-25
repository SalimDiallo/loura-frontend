"use client";

import { GenerateDocumentButton } from "@/components/documents";
import { DetailPageLayout } from "@/components/layout/DetailPageLayout";
import { getApiErrorMessage } from "@/lib/api";
import { PermissionGuard, useOrgPermissions } from "@/components/permissions";
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
    FaCalendarAlt,
    FaCheckCircle,
    FaCreditCard,
    FaEdit,
    FaExclamationTriangle,
    FaInfoCircle,
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

    const { data: sale, isLoading, error } = useSale(orgId, saleId);
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
    const [showPayConfirm, setShowPayConfirm] = useState(false);

    if (isLoading || error || !sale) {
        return (
            <DetailPageLayout
                title="Vente"
                isLoading={isLoading}
                error={error ? { message: error.message } : null}
            />
        );
    }

    const statusStyle = STATUS_STYLES[sale.status];
    const StatusIcon = statusStyle.icon;
    const paymentBadge = PAYMENT_BADGE[sale.payment_status];

    const handleComplete = async () => {
        try {
            await completeMutation.mutateAsync({ orgId, id: saleId });
            toast.success("Vente finalisée. Le stock a été décompté.");
        } catch (err) {
            toast.error("Impossible de finaliser la vente", {
                description: getApiErrorMessage(err),
            });
        }
    };

    const handleCancel = async () => {
        try {
            await cancelMutation.mutateAsync({ orgId, id: saleId });
            toast.success("Vente annulée.");
            setShowCancel(false);
        } catch (err) {
            toast.error("Impossible d'annuler la vente", {
                description: getApiErrorMessage(err),
            });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync({ orgId, id: saleId });
            toast.success("Vente supprimée.");
            router.push(`/organisation/${orgId}/inventory/sales`);
        } catch (err) {
            toast.error("Impossible de supprimer la vente", {
                description: getApiErrorMessage(err),
            });
        }
    };

    const handleOpenPayConfirm = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(payAmount);
        const outstanding = Number(sale.outstanding_amount);
        if (!payAmount || isNaN(amount) || amount <= 0) {
            toast("Montant invalide", { description: "Saisissez un montant > 0." });
            return;
        }
        if (amount > outstanding + 0.001) {
            toast("Montant trop élevé", {
                description: `Le montant ne peut excéder le restant dû (${formatCurrency(outstanding)}).`,
            });
            return;
        }
        setShowPayConfirm(true);
    };

    const handleConfirmPayment = async () => {
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
            setShowPayConfirm(false);
        } catch (err) {
            toast.error("Impossible d'enregistrer le paiement", {
                description: getApiErrorMessage(err),
            });
        }
    };

    const fillPaymentAmount = (ratio: number) => {
        const outstanding = Number(sale.outstanding_amount);
        const value = (outstanding * ratio).toFixed(2);
        setPayAmount(value);
    };

    const fillFromInstallment = () => {
        if (!payInstallmentId) return;
        const inst = sale.installments.find((i) => i.id === payInstallmentId);
        if (!inst) return;
        const remaining = Number(inst.outstanding_amount);
        if (remaining > 0) setPayAmount(remaining.toFixed(2));
    };

    const handleDeletePayment = async (paymentId: string) => {
        try {
            await deletePaymentMutation.mutateAsync({ orgId, id: saleId, paymentId });
            toast.success("Paiement supprimé.");
        } catch (err) {
            toast.error("Impossible de supprimer le paiement", {
                description: getApiErrorMessage(err),
            });
        }
    };

    const canAddPayment =
        canManage && sale.status !== "cancelled" && sale.payment_status !== "paid";
    const canCancel =
        canManage && sale.status !== "cancelled" && sale.payments.length === 0;
    const canEdit = canManage && sale.status === "draft";
    const canComplete = canManage && sale.status === "draft";
    const canDelete = canManage && sale.status === "draft";

    const actions = [
        canEdit && {
            label: "Modifier",
            icon: FaEdit,
            onClick: () =>
                router.push(
                    `/organisation/${orgId}/inventory/sales/${sale.id}/edit`
                ),
            variant: "outline" as const,
        },
        canComplete && {
            label: "Finaliser",
            icon: FaCheckCircle,
            onClick: handleComplete,
            loading: completeMutation.isPending,
        },
        canCancel && {
            label: "Annuler",
            icon: FaTimes,
            onClick: () => setShowCancel(true),
            variant: "outline" as const,
        },
        canDelete && {
            label: "Supprimer",
            icon: FaTrash,
            onClick: () => setShowDelete(true),
            variant: "destructive" as const,
        },
    ].filter(Boolean) as NonNullable<
        Parameters<typeof DetailPageLayout>[0]["actions"]
    >;

    return (
        <DetailPageLayout
            title={sale.sale_number}
            backLink={`/organisation/${orgId}/inventory/sales`}
            badge={
                <div className="flex items-center gap-2 flex-wrap">
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
            }
            headerExtras={
                <div className="flex items-center gap-3 flex-wrap">
                    <span>
                        {sale.customer?.name ?? "Comptoir"} ·{" "}
                        {sale.warehouse.name} ·{" "}
                        {new Date(sale.sale_date).toLocaleDateString("fr-FR")}
                    </span>
                    <GenerateDocumentButton
                        orgId={orgId}
                        docType="sale_invoice"
                        objectId={sale.id}
                        modalTitle={`Facture · ${sale.sale_number}`}
                        modalSubtitle={sale.customer?.name ?? "Comptoir"}
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5"
                    >
                        Facture
                    </GenerateDocumentButton>
                </div>
            }
            actions={actions}
            summaryCards={
                <>
                    <SummaryCard label="Total TTC">
                        <span className="text-2xl font-bold">
                            {formatCurrency(Number(sale.total))}
                        </span>
                        {Number(sale.discount_amount) > 0 && (
                            <span className="block text-xs text-emerald-600 mt-1">
                                dont remise{" "}
                                {formatCurrency(Number(sale.discount_amount))}
                            </span>
                        )}
                    </SummaryCard>
                    <SummaryCard label="Encaissé">
                        <span className="text-2xl font-bold text-green-700">
                            {formatCurrency(Number(sale.paid_amount))}
                        </span>
                    </SummaryCard>
                    <SummaryCard label="Restant dû">
                        <span
                            className={`text-2xl font-bold ${
                                Number(sale.outstanding_amount) > 0
                                    ? "text-red-700"
                                    : "text-muted-foreground"
                            }`}
                        >
                            {formatCurrency(Number(sale.outstanding_amount))}
                        </span>
                    </SummaryCard>
                    <SummaryCard label="Échéance">
                        <span className="text-2xl font-bold">
                            {sale.due_date
                                ? new Date(sale.due_date).toLocaleDateString(
                                      "fr-FR"
                                  )
                                : "—"}
                        </span>
                    </SummaryCard>
                </>
            }
            tabs={[
                {
                    value: "items",
                    label: `Articles (${sale.items.length})`,
                    icon: FaReceipt,
                    content: (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Articles vendus
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="border-b">
                                            <tr className="text-left">
                                                <th className="py-2 pr-4">
                                                    Produit
                                                </th>
                                                <th className="py-2 pr-4 text-right">
                                                    Qté
                                                </th>
                                                <th className="py-2 pr-4 text-right">
                                                    Prix unit.
                                                </th>
                                                <th className="py-2 pr-4 text-right">
                                                    Remise
                                                </th>
                                                <th className="py-2 pr-4 text-right">
                                                    TVA
                                                </th>
                                                <th className="py-2 text-right">
                                                    Total ligne
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sale.items.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="border-b"
                                                >
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
                                                            item.quantity
                                                        ).toLocaleString(
                                                            "fr-FR"
                                                        )}{" "}
                                                        <span className="text-xs text-muted-foreground">
                                                            {item.product.unit_display.toLowerCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 pr-4 text-right">
                                                        {formatCurrency(
                                                            Number(
                                                                item.unit_price
                                                            )
                                                        )}
                                                    </td>
                                                    <td className="py-3 pr-4 text-right">
                                                        {item.discount_type ===
                                                            "none" ||
                                                        Number(
                                                            item.discount_value
                                                        ) === 0 ? (
                                                            <span className="text-xs text-muted-foreground/50">
                                                                —
                                                            </span>
                                                        ) : (
                                                            <span className="text-emerald-700 text-xs">
                                                                −
                                                                {item.discount_type ===
                                                                "percentage"
                                                                    ? `${item.discount_value}%`
                                                                    : formatCurrency(
                                                                          Number(
                                                                              item.discount_value
                                                                          )
                                                                      )}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 pr-4 text-right">
                                                        {Number(item.tax_rate)}%
                                                    </td>
                                                    <td className="py-3 text-right font-semibold">
                                                        {formatCurrency(
                                                            Number(
                                                                item.line_total
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="py-2 pr-4 text-right"
                                                >
                                                    Sous-total
                                                </td>
                                                <td className="py-2 text-right">
                                                    {formatCurrency(
                                                        Number(sale.subtotal)
                                                    )}
                                                </td>
                                            </tr>
                                            {Number(sale.discount_amount) >
                                                0 && (
                                                <tr className="text-emerald-700">
                                                    <td
                                                        colSpan={5}
                                                        className="py-2 pr-4 text-right"
                                                    >
                                                        Remise globale
                                                    </td>
                                                    <td className="py-2 text-right">
                                                        −
                                                        {formatCurrency(
                                                            Number(
                                                                sale.discount_amount
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="py-2 pr-4 text-right"
                                                >
                                                    Taxes
                                                </td>
                                                <td className="py-2 text-right">
                                                    {formatCurrency(
                                                        Number(sale.tax_amount)
                                                    )}
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
                                                    {formatCurrency(
                                                        Number(sale.total)
                                                    )}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ),
                },
                {
                    value: "payments",
                    label: `Paiements (${sale.payments.length})`,
                    icon: FaMoneyBillWave,
                    content: (
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
                                            onSubmit={handleOpenPayConfirm}
                                            className="space-y-3"
                                        >
                                            <div className="space-y-2">
                                                <Label htmlFor="pay_amount">
                                                    Montant *
                                                </Label>
                                                <Input
                                                    id="pay_amount"
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    max={Number(
                                                        sale.outstanding_amount
                                                    )}
                                                    value={payAmount}
                                                    onChange={(e) =>
                                                        setPayAmount(
                                                            e.target.value
                                                        )
                                                    }
                                                    required
                                                />
                                                <div className="flex flex-wrap gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            fillPaymentAmount(1)
                                                        }
                                                        className="h-7 text-xs"
                                                    >
                                                        Tout (
                                                        {formatCurrency(
                                                            Number(
                                                                sale.outstanding_amount
                                                            )
                                                        )}
                                                        )
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            fillPaymentAmount(
                                                                0.5
                                                            )
                                                        }
                                                        className="h-7 text-xs"
                                                    >
                                                        50 %
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            fillPaymentAmount(
                                                                0.25
                                                            )
                                                        }
                                                        className="h-7 text-xs"
                                                    >
                                                        25 %
                                                    </Button>
                                                    {payInstallmentId && (
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={
                                                                fillFromInstallment
                                                            }
                                                            className="h-7 text-xs"
                                                        >
                                                            Échéance ciblée
                                                        </Button>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Restant dû :{" "}
                                                    {formatCurrency(
                                                        Number(
                                                            sale.outstanding_amount
                                                        )
                                                    )}
                                                </p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pay_date">
                                                    Date *
                                                </Label>
                                                <Input
                                                    id="pay_date"
                                                    type="date"
                                                    value={payDate}
                                                    onChange={(e) =>
                                                        setPayDate(
                                                            e.target.value
                                                        )
                                                    }
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="pay_method">
                                                    Méthode *
                                                </Label>
                                                <select
                                                    id="pay_method"
                                                    value={payMethod}
                                                    onChange={(e) =>
                                                        setPayMethod(
                                                            e.target
                                                                .value as SalePaymentMethod
                                                        )
                                                    }
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                >
                                                    {SALE_PAYMENT_METHODS.map(
                                                        (m) => (
                                                            <option
                                                                key={m.value}
                                                                value={m.value}
                                                            >
                                                                {m.label}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </div>
                                            {sale.installments.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="pay_installment">
                                                        Échéance ciblée
                                                    </Label>
                                                    <select
                                                        id="pay_installment"
                                                        value={
                                                            payInstallmentId
                                                        }
                                                        onChange={(e) =>
                                                            setPayInstallmentId(
                                                                e.target.value
                                                            )
                                                        }
                                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                    >
                                                        <option value="">
                                                            Non assigné
                                                        </option>
                                                        {sale.installments
                                                            .filter(
                                                                (i) =>
                                                                    i.status !==
                                                                    "paid"
                                                            )
                                                            .map(
                                                                (inst, idx) => (
                                                                    <option
                                                                        key={
                                                                            inst.id
                                                                        }
                                                                        value={
                                                                            inst.id
                                                                        }
                                                                    >
                                                                        #
                                                                        {idx +
                                                                            1}{" "}
                                                                        —{" "}
                                                                        {new Date(
                                                                            inst.due_date
                                                                        ).toLocaleDateString(
                                                                            "fr-FR"
                                                                        )}{" "}
                                                                        (
                                                                        {formatCurrency(
                                                                            Number(
                                                                                inst.amount
                                                                            )
                                                                        )}
                                                                        )
                                                                    </option>
                                                                )
                                                            )}
                                                    </select>
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label htmlFor="pay_ref">
                                                    Référence
                                                </Label>
                                                <Input
                                                    id="pay_ref"
                                                    placeholder="Reçu, virement..."
                                                    value={payReference}
                                                    onChange={(e) =>
                                                        setPayReference(
                                                            e.target.value
                                                        )
                                                    }
                                                    maxLength={100}
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    paymentMutation.isPending
                                                }
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
                                className={
                                    canAddPayment
                                        ? "lg:col-span-2"
                                        : "lg:col-span-3"
                                }
                            >
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Historique
                                    </CardTitle>
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
                                                                {formatCurrency(
                                                                    Number(
                                                                        p.amount
                                                                    )
                                                                )}
                                                            </span>
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {
                                                                    p.method_display
                                                                }
                                                            </Badge>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(
                                                                p.payment_date
                                                            ).toLocaleDateString(
                                                                "fr-FR"
                                                            )}
                                                            {p.reference &&
                                                                ` · ${p.reference}`}
                                                        </div>
                                                        {p.created_by_info && (
                                                            <div className="text-[10px] text-muted-foreground/70 mt-1">
                                                                par{" "}
                                                                {
                                                                    p
                                                                        .created_by_info
                                                                        .name
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <GenerateDocumentButton
                                                            orgId={orgId}
                                                            docType="sale_payment_receipt"
                                                            objectId={p.id}
                                                            modalTitle={`Reçu · ${sale.sale_number}`}
                                                            modalSubtitle={
                                                                sale.customer
                                                                    ?.name ??
                                                                "Comptoir"
                                                            }
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
                                                                onClick={() =>
                                                                    handleDeletePayment(
                                                                        p.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    deletePaymentMutation.isPending
                                                                }
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
                    ),
                },
                ...(sale.sale_type === "credit"
                    ? [
                          {
                              value: "installments",
                              label: `Échéances (${sale.installments.length})`,
                              icon: FaCalendarAlt,
                              content: (
                                  <Card>
                                      <CardHeader>
                                          <CardTitle className="text-base">
                                              Échéancier de paiement
                                          </CardTitle>
                                          <CardDescription>
                                              Paiements planifiés pour cette
                                              vente à crédit
                                          </CardDescription>
                                      </CardHeader>
                                      <CardContent>
                                          {sale.installments.length === 0 ? (
                                              <p className="text-sm text-muted-foreground text-center py-8">
                                                  Aucune échéance définie. Le
                                                  total est dû à la date
                                                  d'échéance globale.
                                              </p>
                                          ) : (
                                              <div className="space-y-2">
                                                  {sale.installments.map(
                                                      (inst, idx) => (
                                                          <div
                                                              key={inst.id}
                                                              className="flex items-center justify-between p-3 border rounded-md"
                                                          >
                                                              <div className="flex items-center gap-3">
                                                                  <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                                                                      #
                                                                      {idx + 1}
                                                                  </div>
                                                                  <div>
                                                                      <div className="text-sm font-medium">
                                                                          {formatCurrency(
                                                                              Number(
                                                                                  inst.amount
                                                                              )
                                                                          )}
                                                                      </div>
                                                                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                          <FaCalendarAlt className="h-2.5 w-2.5" />
                                                                          {new Date(
                                                                              inst.due_date
                                                                          ).toLocaleDateString(
                                                                              "fr-FR"
                                                                          )}
                                                                          {inst.status ===
                                                                              "overdue" && (
                                                                              <span className="ml-1 text-red-600 flex items-center gap-0.5">
                                                                                  <FaExclamationTriangle className="h-2.5 w-2.5" />
                                                                                  en
                                                                                  retard
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
                                                                          {formatCurrency(
                                                                              Number(
                                                                                  inst.paid_amount
                                                                              )
                                                                          )}
                                                                          {
                                                                              " / "
                                                                          }
                                                                          {formatCurrency(
                                                                              Number(
                                                                                  inst.amount
                                                                              )
                                                                          )}
                                                                      </div>
                                                                  </div>
                                                                  <Badge
                                                                      variant="outline"
                                                                      className={
                                                                          INSTALLMENT_BADGE[
                                                                              inst
                                                                                  .status
                                                                          ]
                                                                      }
                                                                  >
                                                                      {
                                                                          inst.status_display
                                                                      }
                                                                  </Badge>
                                                              </div>
                                                          </div>
                                                      )
                                                  )}
                                              </div>
                                          )}
                                      </CardContent>
                                  </Card>
                              ),
                          },
                      ]
                    : []),
                {
                    value: "info",
                    label: "Infos",
                    icon: FaInfoCircle,
                    content: (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Informations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Client
                                        </p>
                                        {sale.customer ? (
                                            <>
                                                <p className="font-medium">
                                                    {sale.customer.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {
                                                        sale.customer
                                                            .customer_type_display
                                                    }
                                                </p>
                                            </>
                                        ) : (
                                            <p className="italic text-muted-foreground">
                                                Vente comptoir (sans client)
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Entrepôt
                                        </p>
                                        <p className="font-medium">
                                            {sale.warehouse.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {sale.warehouse.code}
                                        </p>
                                    </div>
                                </div>
                                {sale.notes && (
                                    <div className="pt-3 border-t">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Notes
                                        </p>
                                        <p className="text-sm whitespace-pre-wrap">
                                            {sale.notes}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ),
                },
            ]}
            audit={{
                created_at: sale.created_at,
                updated_at: sale.updated_at,
                created_by_info: sale.created_by_info ?? null,
                updated_by_info: sale.updated_by_info ?? null,
            }}
            dialogs={
                <>
                    <Dialog open={showCancel} onOpenChange={setShowCancel}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Annuler cette vente ?
                                </DialogTitle>
                                <DialogDescription>
                                    La vente{" "}
                                    <span className="font-mono font-semibold">
                                        {sale.sale_number}
                                    </span>{" "}
                                    sera annulée. Si elle est finalisée, le
                                    stock sera réinjecté.
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
                                    {cancelMutation.isPending && (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    )}
                                    Confirmer
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={showPayConfirm}
                        onOpenChange={setShowPayConfirm}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Enregistrer ce paiement ?
                                </DialogTitle>
                                <DialogDescription>
                                    Vérifiez les informations avant validation.
                                    Un paiement enregistré peut être supprimé
                                    depuis l'historique tant que la vente n'est
                                    pas archivée.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 rounded-md border bg-muted/30 p-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Montant
                                    </span>
                                    <span className="font-bold text-base">
                                        {formatCurrency(
                                            Number(payAmount || 0)
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Méthode
                                    </span>
                                    <span className="font-medium">
                                        {SALE_PAYMENT_METHODS.find(
                                            (m) => m.value === payMethod
                                        )?.label ?? payMethod}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Date
                                    </span>
                                    <span className="font-medium">
                                        {new Date(payDate).toLocaleDateString(
                                            "fr-FR"
                                        )}
                                    </span>
                                </div>
                                {payInstallmentId && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Échéance
                                        </span>
                                        <span className="font-medium">
                                            {(() => {
                                                const idx =
                                                    sale.installments.findIndex(
                                                        (i) =>
                                                            i.id ===
                                                            payInstallmentId
                                                    );
                                                return idx >= 0
                                                    ? `#${idx + 1}`
                                                    : "—";
                                            })()}
                                        </span>
                                    </div>
                                )}
                                {payReference && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">
                                            Référence
                                        </span>
                                        <span className="font-mono text-xs">
                                            {payReference}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t pt-2">
                                    <span className="text-muted-foreground">
                                        Restant après paiement
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(
                                            Math.max(
                                                0,
                                                Number(
                                                    sale.outstanding_amount
                                                ) - Number(payAmount || 0)
                                            )
                                        )}
                                    </span>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowPayConfirm(false)}
                                >
                                    Retour
                                </Button>
                                <Button
                                    onClick={handleConfirmPayment}
                                    disabled={paymentMutation.isPending}
                                    className="gap-2"
                                >
                                    {paymentMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FaCheckCircle className="h-3.5 w-3.5" />
                                    )}
                                    Confirmer le paiement
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showDelete} onOpenChange={setShowDelete}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Supprimer ce brouillon ?
                                </DialogTitle>
                                <DialogDescription>
                                    Cette action est irréversible. Le brouillon{" "}
                                    <span className="font-mono font-semibold">
                                        {sale.sale_number}
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
            }
        />
    );
}

function SummaryCard({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <Card>
            <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                {children}
            </CardContent>
        </Card>
    );
}
