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
import { Textarea } from "@/components/ui/textarea";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
    useAcceptQuote,
    useConvertQuote,
    useDeleteQuote,
    useDuplicateQuote,
    useExpireQuote,
    useQuote,
    useRejectQuote,
    useSendQuote,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { QuoteStatus, SaleType } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
    FaCalendarAlt,
    FaCheckCircle,
    FaClone,
    FaEdit,
    FaExchangeAlt,
    FaFileAlt,
    FaHourglassEnd,
    FaInfoCircle,
    FaPaperPlane,
    FaReceipt,
    FaRegHandshake,
    FaTimes,
    FaTrash,
} from "react-icons/fa";
import { toast } from "sonner";

export default function QuoteDetailPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.SALES.VIEW}>
            <QuoteDetailPage />
        </PermissionGuard>
    );
}

const STATUS_STYLES: Record<
    QuoteStatus,
    { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
    draft: {
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: FaEdit,
    },
    sent: {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: FaPaperPlane,
    },
    accepted: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: FaRegHandshake,
    },
    rejected: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: FaTimes,
    },
    expired: {
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: FaHourglassEnd,
    },
    converted: {
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: FaCheckCircle,
    },
};

function QuoteDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const quoteId = params.quoteId as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.SALES.MANAGE);
    const { formatCurrency } = useCurrencyFormatter();

    const { data: quote, isLoading, error } = useQuote(orgId, quoteId);

    const sendMutation = useSendQuote();
    const acceptMutation = useAcceptQuote();
    const rejectMutation = useRejectQuote();
    const expireMutation = useExpireQuote();
    const convertMutation = useConvertQuote();
    const duplicateMutation = useDuplicateQuote();
    const deleteMutation = useDeleteQuote();

    const [showDelete, setShowDelete] = useState(false);
    const [showReject, setShowReject] = useState(false);
    const [showConvert, setShowConvert] = useState(false);
    const [showExpire, setShowExpire] = useState(false);
    const [showSend, setShowSend] = useState(false);
    const [showAccept, setShowAccept] = useState(false);
    const [showDuplicate, setShowDuplicate] = useState(false);

    const [rejectReason, setRejectReason] = useState("");
    const [convertSaleType, setConvertSaleType] = useState<SaleType>("cash");
    const [convertSaleDate, setConvertSaleDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [convertDueDate, setConvertDueDate] = useState("");

    if (isLoading || error || !quote) {
        return (
            <DetailPageLayout
                title="Devis"
                isLoading={isLoading}
                error={error ? { message: error.message } : null}
            />
        );
    }

    const statusStyle = STATUS_STYLES[quote.status];
    const StatusIcon = statusStyle.icon;

    const handleSend = async () => {
        try {
            await sendMutation.mutateAsync({ orgId, id: quoteId });
            toast.success("Devis envoyé.");
            setShowSend(false);
        } catch (err) {
            toast.error("Erreur", {
                description: getApiErrorMessage(err),
            });
        }
    };

    const handleAccept = async () => {
        try {
            await acceptMutation.mutateAsync({ orgId, id: quoteId });
            toast.success("Devis accepté.");
            setShowAccept(false);
        } catch (err) {
            toast.error("Erreur", {
                description: getApiErrorMessage(err),
            });
        }
    };

    const handleReject = async () => {
        try {
            await rejectMutation.mutateAsync({
                orgId,
                id: quoteId,
                data: { reason: rejectReason },
            });
            toast.success("Devis refusé.");
            setShowReject(false);
            setRejectReason("");
        } catch (err) {
            toast.error("Erreur", {
                description: getApiErrorMessage(err),
            });
        }
    };

    const handleExpire = async () => {
        try {
            await expireMutation.mutateAsync({ orgId, id: quoteId });
            toast.success("Devis marqué comme expiré.");
            setShowExpire(false);
        } catch (err) {
            toast.error("Erreur", {
                description: getApiErrorMessage(err),
            });
        }
    };

    const handleConvert = async () => {
        try {
            const res = await convertMutation.mutateAsync({
                orgId,
                id: quoteId,
                data: {
                    sale_type: convertSaleType,
                    sale_date: convertSaleDate,
                    due_date: convertDueDate || null,
                },
            });
            toast.success(res.message ?? "Devis converti.");
            setShowConvert(false);
            const newSaleId = res.data.converted_to_sale?.id;
            if (newSaleId) {
                router.push(
                    `/organisation/${orgId}/inventory/sales/${newSaleId}`
                );
            }
        } catch (err) {
            toast.error("Erreur", {
                description: getApiErrorMessage(err),
            });
        }
    };

    const handleDuplicate = async () => {
        try {
            const res = await duplicateMutation.mutateAsync({
                orgId,
                id: quoteId,
            });
            toast.success(res.message ?? "Devis dupliqué.");
            setShowDuplicate(false);
            router.push(
                `/organisation/${orgId}/inventory/quotes/${res.data.id}`
            );
        } catch (err) {
            toast.error("Erreur", {
                description: getApiErrorMessage(err),
            });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync({ orgId, id: quoteId });
            toast.success("Devis supprimé.");
            router.push(`/organisation/${orgId}/inventory/quotes`);
        } catch (err) {
            toast.error("Erreur", {
                description: getApiErrorMessage(err),
            });
        }
    };

    const isDraft = quote.status === "draft";
    const isSent = quote.status === "sent";
    const isAccepted = quote.status === "accepted";
    const canSend = canManage && isDraft && quote.items.length > 0;
    const canAccept = canManage && (isDraft || isSent);
    const canReject = canManage && (isDraft || isSent || isAccepted);
    const canExpire = canManage && (isDraft || isSent);
    const canConvert =
        canManage && isAccepted && !quote.converted_to_sale;
    const canDuplicate = canManage;
    const canEdit = canManage && quote.is_editable;
    const canDelete = canManage && isDraft;

    const docType = quote.quote_type === "proforma" ? "proforma" : "quote";
    const docLabel = quote.quote_type_display;

    // Actions du header (les actions complexes restent en mode "boutons custom"
    // via le slot `headerExtras` n'est pas idéal pour ça — on passe par actions).
    const actions = [
        canEdit && {
            label: "Modifier",
            icon: FaEdit,
            onClick: () =>
                router.push(
                    `/organisation/${orgId}/inventory/quotes/${quote.id}/edit`
                ),
            variant: "outline" as const,
        },
        canSend && {
            label: "Envoyer",
            icon: FaPaperPlane,
            onClick: () => setShowSend(true),
        },
        canAccept && {
            label: "Accepter",
            icon: FaRegHandshake,
            onClick: () => setShowAccept(true),
            variant: "outline" as const,
        },
        canConvert && {
            label: "Convertir en vente",
            icon: FaExchangeAlt,
            onClick: () => setShowConvert(true),
        },
        canDuplicate && {
            label: "Dupliquer",
            icon: FaClone,
            onClick: () => setShowDuplicate(true),
            variant: "outline" as const,
        },
        canReject && {
            label: "Refuser",
            icon: FaTimes,
            onClick: () => setShowReject(true),
            variant: "outline" as const,
        },
        canExpire && {
            label: "Expirer",
            icon: FaHourglassEnd,
            onClick: () => setShowExpire(true),
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
            title={quote.quote_number}
            backLink={`/organisation/${orgId}/inventory/quotes`}
            badge={
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                        variant="outline"
                        className={`gap-1.5 ${statusStyle.color}`}
                    >
                        <StatusIcon className="h-3 w-3" />
                        {quote.status_display}
                    </Badge>
                    <Badge variant="outline">{quote.quote_type_display}</Badge>
                    {quote.is_expired_by_date && !quote.is_terminal && (
                        <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 gap-1"
                        >
                            <FaHourglassEnd className="h-3 w-3" />
                            Validité dépassée
                        </Badge>
                    )}
                </div>
            }
            headerExtras={
                <div className="flex items-center gap-3 flex-wrap">
                    <span>
                        {quote.customer?.name ??
                            quote.customer_name_snapshot ??
                            "—"}{" "}
                        · {quote.warehouse.name} ·{" "}
                        {new Date(quote.issue_date).toLocaleDateString(
                            "fr-FR"
                        )}
                    </span>
                    <GenerateDocumentButton
                        orgId={orgId}
                        docType={docType}
                        objectId={quote.id}
                        modalTitle={`${docLabel} · ${quote.quote_number}`}
                        modalSubtitle={
                            quote.customer?.name ??
                            quote.customer_name_snapshot
                        }
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5"
                    >
                        Aperçu {docLabel.toLowerCase()}
                    </GenerateDocumentButton>
                </div>
            }
            actions={actions}
            banners={
                <>
                    {quote.converted_to_sale && (
                        <Card className="border-emerald-200 bg-emerald-50/40">
                            <CardContent className="pt-6 flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-3">
                                    <FaCheckCircle className="h-5 w-5 text-emerald-700" />
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-900">
                                            Devis converti en vente
                                        </p>
                                        <p className="text-xs text-emerald-800/80">
                                            {
                                                quote.converted_to_sale
                                                    .sale_number
                                            }
                                            {quote.converted_at &&
                                                ` · le ${new Date(
                                                    quote.converted_at
                                                ).toLocaleDateString("fr-FR")}`}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        router.push(
                                            `/organisation/${orgId}/inventory/sales/${quote.converted_to_sale!.id}`
                                        )
                                    }
                                    className="gap-2"
                                >
                                    <FaReceipt className="h-3.5 w-3.5" />
                                    Voir la vente
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {quote.status === "rejected" &&
                        quote.rejection_reason && (
                            <Card className="border-red-200 bg-red-50/40">
                                <CardContent className="pt-6">
                                    <div className="flex items-start gap-3">
                                        <FaInfoCircle className="h-5 w-5 text-red-700 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-red-900">
                                                Motif du refus
                                            </p>
                                            <p className="text-sm text-red-800/90 whitespace-pre-wrap mt-1">
                                                {quote.rejection_reason}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                </>
            }
            summaryCards={
                <>
                    <SummaryCard label="Total TTC">
                        <span className="text-2xl font-bold">
                            {formatCurrency(Number(quote.total))}
                        </span>
                        {Number(quote.discount_amount) > 0 && (
                            <span className="block text-xs text-emerald-600 mt-1">
                                dont remise{" "}
                                {formatCurrency(
                                    Number(quote.discount_amount)
                                )}
                            </span>
                        )}
                    </SummaryCard>
                    <SummaryCard label="Sous-total HT">
                        <span className="text-2xl font-bold">
                            {formatCurrency(Number(quote.subtotal))}
                        </span>
                    </SummaryCard>
                    <SummaryCard label="Taxes">
                        <span className="text-2xl font-bold">
                            {formatCurrency(Number(quote.tax_amount))}
                        </span>
                    </SummaryCard>
                    <SummaryCard label="Validité">
                        <span
                            className={`text-2xl font-bold ${
                                quote.is_expired_by_date && !quote.is_terminal
                                    ? "text-red-700"
                                    : ""
                            }`}
                        >
                            {quote.valid_until
                                ? new Date(
                                      quote.valid_until
                                  ).toLocaleDateString("fr-FR")
                                : "—"}
                        </span>
                    </SummaryCard>
                </>
            }
            tabs={[
                {
                    value: "items",
                    label: `Articles (${quote.items.length})`,
                    icon: FaReceipt,
                    content: (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Lignes du {docLabel.toLowerCase()}
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
                                            {quote.items.map((item) => (
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
                                                        {item.description && (
                                                            <div className="text-xs text-muted-foreground/80 mt-1 italic">
                                                                {
                                                                    item.description
                                                                }
                                                            </div>
                                                        )}
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
                                                        {Number(item.tax_rate)}
                                                        %
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
                                                        Number(quote.subtotal)
                                                    )}
                                                </td>
                                            </tr>
                                            {Number(quote.discount_amount) >
                                                0 && (
                                                <tr className="text-emerald-700">
                                                    <td
                                                        colSpan={5}
                                                        className="py-2 pr-4 text-right"
                                                    >
                                                        Remise globale (
                                                        {
                                                            quote.discount_type_display
                                                        }
                                                        )
                                                    </td>
                                                    <td className="py-2 text-right">
                                                        −
                                                        {formatCurrency(
                                                            Number(
                                                                quote.discount_amount
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
                                                        Number(quote.tax_amount)
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
                                                        Number(quote.total)
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
                                        {quote.customer ? (
                                            <>
                                                <p className="font-medium">
                                                    {quote.customer.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {
                                                        quote.customer
                                                            .customer_type_display
                                                    }
                                                </p>
                                                {quote.customer.email && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {quote.customer.email}
                                                    </p>
                                                )}
                                                {quote.customer.phone && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {quote.customer.phone}
                                                    </p>
                                                )}
                                            </>
                                        ) : quote.customer_name_snapshot ? (
                                            <>
                                                <p className="font-medium">
                                                    {
                                                        quote.customer_name_snapshot
                                                    }
                                                </p>
                                                <p className="text-xs text-muted-foreground italic">
                                                    Client libre (non
                                                    enregistré)
                                                </p>
                                            </>
                                        ) : (
                                            <p className="italic text-muted-foreground">
                                                —
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Entrepôt
                                        </p>
                                        <p className="font-medium">
                                            {quote.warehouse.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {quote.warehouse.code}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Date d'émission
                                        </p>
                                        <p className="font-medium">
                                            {new Date(
                                                quote.issue_date
                                            ).toLocaleDateString("fr-FR")}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Valide jusqu'au
                                        </p>
                                        <p
                                            className={`font-medium ${
                                                quote.is_expired_by_date &&
                                                !quote.is_terminal
                                                    ? "text-red-700"
                                                    : ""
                                            }`}
                                        >
                                            {quote.valid_until
                                                ? new Date(
                                                      quote.valid_until
                                                  ).toLocaleDateString("fr-FR")
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                                {quote.notes && (
                                    <div className="pt-3 border-t">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Notes
                                        </p>
                                        <p className="text-sm whitespace-pre-wrap">
                                            {quote.notes}
                                        </p>
                                    </div>
                                )}
                                {quote.terms && (
                                    <div className="pt-3 border-t">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Conditions
                                        </p>
                                        <p className="text-sm whitespace-pre-wrap">
                                            {quote.terms}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ),
                },
                {
                    value: "timeline",
                    label: "Historique",
                    icon: FaCalendarAlt,
                    content: (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Historique du document
                                </CardTitle>
                                <CardDescription>
                                    Étapes du cycle de vie de ce devis avec
                                    l&apos;auteur de chaque transition.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ol className="space-y-3">
                                    <TimelineRow
                                        icon={FaFileAlt}
                                        color="bg-gray-100 text-gray-700"
                                        title="Créé en brouillon"
                                        date={quote.created_at}
                                        user={
                                            quote.created_by_info?.name ?? null
                                        }
                                    />
                                    <TimelineRow
                                        icon={FaPaperPlane}
                                        color="bg-blue-100 text-blue-700"
                                        title="Envoyé au client"
                                        date={quote.sent_at}
                                        user={quote.sent_by_info?.name ?? null}
                                    />
                                    <TimelineRow
                                        icon={FaRegHandshake}
                                        color="bg-green-100 text-green-700"
                                        title="Accepté"
                                        date={quote.accepted_at}
                                        user={
                                            quote.accepted_by_info?.name ?? null
                                        }
                                    />
                                    {quote.status === "rejected" && (
                                        <TimelineRow
                                            icon={FaTimes}
                                            color="bg-red-100 text-red-700"
                                            title="Refusé"
                                            date={quote.rejected_at}
                                            user={
                                                quote.rejected_by_info?.name ??
                                                null
                                            }
                                            extra={
                                                quote.rejection_reason ||
                                                undefined
                                            }
                                        />
                                    )}
                                    {quote.status === "expired" && (
                                        <TimelineRow
                                            icon={FaHourglassEnd}
                                            color="bg-amber-100 text-amber-700"
                                            title="Marqué comme expiré"
                                            date={
                                                quote.expired_at ??
                                                quote.updated_at
                                            }
                                            user={
                                                quote.expired_by_info?.name ??
                                                null
                                            }
                                        />
                                    )}
                                    <TimelineRow
                                        icon={FaCheckCircle}
                                        color="bg-emerald-100 text-emerald-800"
                                        title={
                                            quote.converted_to_sale
                                                ? `Converti en vente ${quote.converted_to_sale.sale_number}`
                                                : "Converti en vente"
                                        }
                                        date={quote.converted_at}
                                        user={
                                            quote.converted_by_info?.name ??
                                                null
                                        }
                                    />
                                </ol>
                            </CardContent>
                        </Card>
                    ),
                },
            ]}
            audit={{
                created_at: quote.created_at,
                updated_at: quote.updated_at,
                created_by_info: quote.created_by_info ?? null,
                updated_by_info: quote.updated_by_info ?? null,
            }}
            dialogs={
                <>
                    <Dialog open={showSend} onOpenChange={setShowSend}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Envoyer ce devis ?</DialogTitle>
                                <DialogDescription>
                                    Le devis{" "}
                                    <span className="font-mono font-semibold">
                                        {quote.quote_number}
                                    </span>{" "}
                                    passera du statut brouillon à{" "}
                                    <span className="font-semibold">
                                        envoyé
                                    </span>{" "}
                                    et ne pourra plus être modifié librement.
                                    Vous pourrez ensuite l&apos;accepter,
                                    le refuser ou le convertir en vente.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowSend(false)}
                                >
                                    Annuler
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
                                    Envoyer
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showAccept} onOpenChange={setShowAccept}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Accepter ce devis ?
                                </DialogTitle>
                                <DialogDescription>
                                    Le devis{" "}
                                    <span className="font-mono font-semibold">
                                        {quote.quote_number}
                                    </span>{" "}
                                    sera marqué comme{" "}
                                    <span className="font-semibold">
                                        accepté
                                    </span>
                                    . Vous pourrez ensuite le convertir en
                                    vente.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAccept(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleAccept}
                                    disabled={acceptMutation.isPending}
                                    className="gap-2 bg-green-700 hover:bg-green-800"
                                >
                                    {acceptMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FaRegHandshake className="h-3.5 w-3.5" />
                                    )}
                                    Confirmer l&apos;acceptation
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={showDuplicate}
                        onOpenChange={setShowDuplicate}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Dupliquer ce devis ?
                                </DialogTitle>
                                <DialogDescription>
                                    Un nouveau brouillon identique sera créé à
                                    partir de{" "}
                                    <span className="font-mono font-semibold">
                                        {quote.quote_number}
                                    </span>
                                    . Vous serez redirigé vers le nouveau
                                    devis.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDuplicate(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleDuplicate}
                                    disabled={duplicateMutation.isPending}
                                    className="gap-2"
                                >
                                    {duplicateMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FaClone className="h-3.5 w-3.5" />
                                    )}
                                    Dupliquer
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showReject} onOpenChange={setShowReject}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Refuser ce devis ?</DialogTitle>
                                <DialogDescription>
                                    Le devis{" "}
                                    <span className="font-mono font-semibold">
                                        {quote.quote_number}
                                    </span>{" "}
                                    sera marqué comme refusé. Cette action est
                                    définitive.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2">
                                <Label htmlFor="reject_reason">
                                    Motif (optionnel)
                                </Label>
                                <Textarea
                                    id="reject_reason"
                                    value={rejectReason}
                                    onChange={(e) =>
                                        setRejectReason(e.target.value)
                                    }
                                    placeholder="Indiquez la raison du refus…"
                                    rows={3}
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowReject(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={rejectMutation.isPending}
                                >
                                    {rejectMutation.isPending && (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    )}
                                    Confirmer le refus
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showExpire} onOpenChange={setShowExpire}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Marquer comme expiré ?
                                </DialogTitle>
                                <DialogDescription>
                                    Le devis{" "}
                                    <span className="font-mono font-semibold">
                                        {quote.quote_number}
                                    </span>{" "}
                                    sera marqué comme expiré et ne pourra plus
                                    être accepté.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowExpire(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleExpire}
                                    disabled={expireMutation.isPending}
                                >
                                    {expireMutation.isPending && (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    )}
                                    Confirmer
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showConvert} onOpenChange={setShowConvert}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Convertir en vente</DialogTitle>
                                <DialogDescription>
                                    Une nouvelle vente en brouillon sera créée
                                    à partir de ce devis. Vous pourrez ensuite
                                    la finaliser depuis l'écran ventes.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label htmlFor="convert_type">
                                        Type de vente
                                    </Label>
                                    <select
                                        id="convert_type"
                                        value={convertSaleType}
                                        onChange={(e) =>
                                            setConvertSaleType(
                                                e.target.value as SaleType
                                            )
                                        }
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        <option value="cash">Comptant</option>
                                        <option value="credit">À crédit</option>
                                    </select>
                                    {convertSaleType === "credit" &&
                                        !quote.customer && (
                                            <p className="text-xs text-amber-700">
                                                Une vente à crédit nécessite un
                                                client enregistré.
                                            </p>
                                        )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="convert_date">
                                        Date de vente
                                    </Label>
                                    <Input
                                        id="convert_date"
                                        type="date"
                                        value={convertSaleDate}
                                        onChange={(e) =>
                                            setConvertSaleDate(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="convert_due">
                                        Date d'échéance (optionnel)
                                    </Label>
                                    <Input
                                        id="convert_due"
                                        type="date"
                                        value={convertDueDate}
                                        onChange={(e) =>
                                            setConvertDueDate(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowConvert(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleConvert}
                                    disabled={
                                        convertMutation.isPending ||
                                        (convertSaleType === "credit" &&
                                            !quote.customer)
                                    }
                                    className="gap-2"
                                >
                                    {convertMutation.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <FaExchangeAlt className="h-3.5 w-3.5" />
                                    )}
                                    Convertir
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
                                        {quote.quote_number}
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

function TimelineRow({
    icon: Icon,
    color,
    title,
    date,
    user,
    extra,
}: {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    title: string;
    date: string | null | undefined;
    user?: string | null;
    extra?: string;
}) {
    const done = !!date;
    return (
        <li
            className={`flex items-start gap-3 p-3 border rounded-md ${
                done ? "" : "opacity-50"
            }`}
        >
            <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    done ? color : "bg-muted text-muted-foreground"
                }`}
            >
                <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">
                    {date
                        ? new Date(date).toLocaleString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                          })
                        : "—"}
                    {user ? ` · ${user}` : ""}
                </div>
                {extra && (
                    <div className="text-xs text-muted-foreground mt-1 italic">
                        {extra}
                    </div>
                )}
            </div>
        </li>
    );
}
