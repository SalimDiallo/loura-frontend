"use client";

import { DetailPageLayout } from "@/components/layout/DetailPageLayout";
import { PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
    useCancelStockMovement,
    useDeleteStockMovement,
    useStockMovement,
    useValidateStockMovement,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import type { StockMovementStatus, StockMovementType } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
    FaArrowDown,
    FaArrowUp,
    FaBalanceScale,
    FaBox,
    FaCheckCircle,
    FaEdit,
    FaExchangeAlt,
    FaHistory,
    FaInfoCircle,
    FaTimes,
    FaTrash,
    FaWarehouse,
} from "react-icons/fa";
import { toast } from "sonner";

export default function MovementDetailPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.STOCK.VIEW}>
            <MovementDetailPage />
        </PermissionGuard>
    );
}

const STATUS_STYLES: Record<
    StockMovementStatus,
    { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
    draft: {
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: FaEdit,
    },
    validated: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: FaCheckCircle,
    },
    cancelled: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: FaTimes,
    },
};

const TYPE_STYLES: Record<
    StockMovementType,
    { color: string; icon: React.ComponentType<{ className?: string }> }
> = {
    in: {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: FaArrowUp,
    },
    out: {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: FaArrowDown,
    },
    adjust: {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: FaBalanceScale,
    },
    transfer: {
        color: "bg-purple-100 text-purple-700 border-purple-200",
        icon: FaExchangeAlt,
    },
};

function MovementDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const movementId = params.movementId as string;
    const { can } = useOrgPermissions();
    const canManage = can(PERMISSIONS.STOCK.MANAGE);
    const { formatCurrency } = useCurrencyFormatter();

    const { data: movement, isLoading, error } = useStockMovement(orgId, movementId);
    const validateMutation = useValidateStockMovement();
    const cancelMutation = useCancelStockMovement();
    const deleteMutation = useDeleteStockMovement();

    const [showValidate, setShowValidate] = useState(false);
    const [showCancel, setShowCancel] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    const handleValidate = async () => {
        try {
            await validateMutation.mutateAsync({ orgId, id: movementId });
            toast.success("Mouvement validé. Le stock a été mis à jour.");
            setShowValidate(false);
        } catch (err) {
            toast.error("Erreur", { description: getApiErrorMessage(err) });
        }
    };

    const handleCancel = async () => {
        try {
            await cancelMutation.mutateAsync({ orgId, id: movementId });
            toast.success("Mouvement annulé.");
            setShowCancel(false);
        } catch (err) {
            toast.error("Erreur", { description: getApiErrorMessage(err) });
        }
    };

    const handleDelete = async () => {
        try {
            await deleteMutation.mutateAsync({ orgId, id: movementId });
            toast.success("Mouvement supprimé.");
            router.push(`/organisation/${orgId}/inventory/movements`);
        } catch (err) {
            toast.error("Erreur", { description: getApiErrorMessage(err) });
        }
    };

    if (isLoading || !movement) {
        return (
            <DetailPageLayout
                title="Chargement…"
                isLoading
                error={error ? { message: error.message } : null}
            />
        );
    }

    const statusStyle = STATUS_STYLES[movement.status];
    const StatusIcon = statusStyle.icon;
    const typeStyle = TYPE_STYLES[movement.movement_type];
    const TypeIcon = typeStyle.icon;

    const qty = Number(movement.quantity);
    const isNegative = qty < 0;
    const isDraft = movement.status === "draft";
    const isValidated = movement.status === "validated";
    const isTransfer = movement.movement_type === "transfer";

    const actions = canManage
        ? [
              ...(isDraft && !isTransfer
                  ? [
                        {
                            label: "Valider",
                            icon: FaCheckCircle,
                            onClick: () => setShowValidate(true),
                        },
                        {
                            label: "Modifier",
                            icon: FaEdit,
                            variant: "outline" as const,
                            onClick: () =>
                                router.push(
                                    `/organisation/${orgId}/inventory/movements/${movementId}/edit`
                                ),
                        },
                        {
                            label: "Annuler",
                            icon: FaTimes,
                            variant: "outline" as const,
                            onClick: () => setShowCancel(true),
                        },
                        {
                            label: "Supprimer",
                            icon: FaTrash,
                            variant: "destructive" as const,
                            onClick: () => setShowDelete(true),
                        },
                    ]
                  : []),
          ]
        : [];

    return (
        <DetailPageLayout
            title={`Mouvement ${movement.movement_type_display.toLowerCase()}`}
            subtitle={
                movement.reference
                    ? `Réf : ${movement.reference}`
                    : `Créé le ${new Date(movement.created_at).toLocaleDateString("fr-FR")}`
            }
            backLink={`/organisation/${orgId}/inventory/movements`}
            icon={FaHistory}
            actions={actions}
            badge={
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={`gap-1.5 ${typeStyle.color}`}>
                        <TypeIcon className="h-3 w-3" />
                        {movement.movement_type_display}
                    </Badge>
                    <Badge
                        variant="outline"
                        className={`gap-1.5 ${statusStyle.color}`}
                    >
                        <StatusIcon className="h-3 w-3" />
                        {movement.status_display}
                    </Badge>
                </div>
            }
            headerExtras={
                <span className="flex flex-wrap items-center gap-2">
                    <FaBox className="h-3 w-3" />
                    {movement.product.name} ({movement.product.sku})
                    <span className="text-muted-foreground/40">·</span>
                    <FaWarehouse className="h-3 w-3" />
                    {movement.warehouse.name}
                </span>
            }
            banners={
                <>
                    {isDraft && (
                        <Card className="border-amber-200 bg-amber-50/50">
                            <CardContent className="pt-4 flex gap-3">
                                <FaInfoCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-amber-900">
                                        Mouvement en brouillon
                                    </p>
                                    <p className="text-amber-700">
                                        Le stock n'est pas encore impacté. Validez pour
                                        appliquer le delta, ou modifiez/annulez/supprimez
                                        librement.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {isTransfer && (
                        <Card className="border-purple-200 bg-purple-50/50">
                            <CardContent className="pt-4 flex gap-3">
                                <FaExchangeAlt className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-purple-900">
                                        Mouvement issu d'un transfert
                                    </p>
                                    <p className="text-purple-700">
                                        Les transferts sont immutables. Pour corriger,
                                        créez un nouveau transfert dans l'autre sens.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            }
            summaryCards={
                <>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-normal">
                                Quantité
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p
                                className={`text-2xl font-bold ${
                                    isNegative ? "text-red-600" : "text-green-600"
                                }`}
                            >
                                {isNegative ? "" : "+"}
                                {qty.toLocaleString("fr-FR")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {movement.product.unit_display ?? ""}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-normal">
                                Coût unitaire
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {Number(movement.unit_cost) > 0
                                    ? formatCurrency(Number(movement.unit_cost))
                                    : "—"}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-normal">
                                Valeur totale
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">
                                {Number(movement.unit_cost) > 0
                                    ? formatCurrency(
                                          Math.abs(qty) * Number(movement.unit_cost)
                                      )
                                    : "—"}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground font-normal">
                                Motif
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-base font-medium">
                                {movement.reason_display}
                            </p>
                        </CardContent>
                    </Card>
                </>
            }
            tabs={[
                {
                    value: "info",
                    label: "Informations",
                    icon: FaInfoCircle,
                    content: (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Détails</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <Row label="Type" value={movement.movement_type_display} />
                                <Row label="Statut" value={movement.status_display} />
                                <Row label="Motif" value={movement.reason_display} />
                                <Row
                                    label="Produit"
                                    value={`${movement.product.name} · ${movement.product.sku}`}
                                />
                                <Row
                                    label="Entrepôt"
                                    value={`${movement.warehouse.name} (${movement.warehouse.code})`}
                                />
                                <Row label="Quantité" value={movement.quantity} />
                                <Row
                                    label="Coût unitaire"
                                    value={
                                        Number(movement.unit_cost) > 0
                                            ? formatCurrency(Number(movement.unit_cost))
                                            : "—"
                                    }
                                />
                                <Row
                                    label="Référence"
                                    value={movement.reference || "—"}
                                />
                                <Row
                                    label="Notes"
                                    value={movement.notes || "—"}
                                />
                                {movement.related_movement && (
                                    <Row
                                        label="Mouvement lié"
                                        value={
                                            <Button
                                                variant="link"
                                                className="h-auto p-0"
                                                onClick={() =>
                                                    router.push(
                                                        `/organisation/${orgId}/inventory/movements/${movement.related_movement}`
                                                    )
                                                }
                                            >
                                                Voir le mouvement lié
                                            </Button>
                                        }
                                    />
                                )}
                            </CardContent>
                        </Card>
                    ),
                },
                {
                    value: "history",
                    label: "Historique",
                    icon: FaHistory,
                    content: (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Chronologie
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ol className="relative border-l-2 border-muted ml-3 space-y-4">
                                    <TimelineItem
                                        when={movement.created_at}
                                        title="Brouillon créé"
                                        who={movement.created_by_info ?? null}
                                    />
                                    {isValidated && movement.validated_at && (
                                        <TimelineItem
                                            when={movement.validated_at}
                                            title="Mouvement validé · stock impacté"
                                            who={movement.validated_by_info ?? null}
                                            color="text-green-600"
                                        />
                                    )}
                                    {movement.status === "cancelled" && (
                                        <TimelineItem
                                            when={movement.updated_at}
                                            title="Mouvement annulé"
                                            who={movement.updated_by_info ?? null}
                                            color="text-red-600"
                                        />
                                    )}
                                </ol>
                            </CardContent>
                        </Card>
                    ),
                },
            ]}
            audit={{
                created_at: movement.created_at,
                updated_at: movement.updated_at,
                created_by_info: movement.created_by_info ?? null,
                updated_by_info: movement.updated_by_info ?? null,
            }}
            dialogs={
                <>
                    <Dialog open={showValidate} onOpenChange={setShowValidate}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Valider le mouvement ?</DialogTitle>
                                <DialogDescription>
                                    Le stock sera mis à jour immédiatement et le
                                    mouvement deviendra immutable. Pour corriger après
                                    validation, créez un mouvement d'ajustement inverse.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowValidate(false)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleValidate}
                                    disabled={validateMutation.isPending}
                                    className="gap-2"
                                >
                                    {validateMutation.isPending && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    Valider
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showCancel} onOpenChange={setShowCancel}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Annuler ce brouillon ?</DialogTitle>
                                <DialogDescription>
                                    Le mouvement passera au statut « annulé ». Aucun
                                    impact sur le stock.
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
                                    className="gap-2"
                                >
                                    {cancelMutation.isPending && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    )}
                                    Annuler le mouvement
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showDelete} onOpenChange={setShowDelete}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Supprimer ce brouillon ?</DialogTitle>
                                <DialogDescription>
                                    Action définitive. Le mouvement disparaîtra de
                                    l'historique. Seuls les brouillons peuvent être
                                    supprimés.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDelete(false)}
                                >
                                    Retour
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending}
                                    className="gap-2"
                                >
                                    {deleteMutation.isPending && (
                                        <Loader2 className="h-4 w-4 animate-spin" />
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between gap-4 border-b border-muted/40 pb-2 last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right">{value}</span>
        </div>
    );
}

function TimelineItem({
    when,
    title,
    who,
    color,
}: {
    when: string;
    title: string;
    who: { name?: string; email?: string } | null;
    color?: string;
}) {
    return (
        <li className="ml-4 relative">
            <div className="absolute -left-[1.4rem] top-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
            <p className={`text-sm font-medium ${color ?? ""}`}>{title}</p>
            <p className="text-xs text-muted-foreground">
                {new Date(when).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })}
                {who && (
                    <>
                        {" · par "}
                        <span className="font-medium">
                            {who.name || who.email || "—"}
                        </span>
                    </>
                )}
            </p>
        </li>
    );
}
