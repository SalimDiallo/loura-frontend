"use client";

import { PermissionGuard } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStockAlerts } from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import { useParams, useRouter } from "next/navigation";
import { FaArrowUp, FaBox, FaCheckCircle, FaExclamationTriangle, FaWarehouse } from "react-icons/fa";

export default function AlertsPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.STOCK.VIEW}>
            <AlertsPage />
        </PermissionGuard>
    );
}

function AlertsPage() {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;

    const { data: alertsData, isLoading, error } = useStockAlerts(orgId);

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-destructive">Erreur : {error.message}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const alerts = alertsData?.alerts ?? [];

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div
                        className={`h-12 w-12 rounded-lg flex items-center justify-center ${alerts.length > 0 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}
                    >
                        <FaExclamationTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Alertes de stock</h1>
                        <p className="text-sm text-muted-foreground">
                            Produits dont le stock total est sous le seuil d'alerte
                        </p>
                    </div>
                </div>
                <Badge
                    variant={alerts.length > 0 ? "destructive" : "secondary"}
                    className="text-base px-3 py-1"
                >
                    {alerts.length} alerte{alerts.length > 1 ? "s" : ""}
                </Badge>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-lg" />
                    ))}
                </div>
            ) : alerts.length === 0 ? (
                <Card className="border-green-200 bg-green-50/30">
                    <CardContent className="pt-6 pb-8 text-center">
                        <FaCheckCircle className="h-12 w-12 mx-auto text-green-600 mb-4" />
                        <p className="text-lg font-medium">
                            Tous les stocks sont au-dessus du seuil
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Aucune action requise pour le moment.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert) => (
                        <Card
                            key={alert.product.id}
                            className="border-amber-200 hover:border-amber-300 transition-colors"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {alert.product.image_url ? (
                                            <img
                                                src={alert.product.image_url}
                                                alt={alert.product.name}
                                                className="h-12 w-12 rounded object-cover border shrink-0"
                                            />
                                        ) : (
                                            <div className="h-12 w-12 bg-amber-100 text-amber-700 rounded flex items-center justify-center shrink-0">
                                                <FaBox className="h-5 w-5" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <CardTitle className="text-base truncate">
                                                {alert.product.name}
                                            </CardTitle>
                                            <CardDescription>
                                                SKU: {alert.product.sku} ·{" "}
                                                {alert.product.unit_display}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 shrink-0"
                                        onClick={() =>
                                            router.push(
                                                `/organisation/${orgId}/inventory/movements/create?product=${alert.product.id}&type=in`
                                            )
                                        }
                                    >
                                        <FaArrowUp className="h-3.5 w-3.5 text-green-600" />
                                        Réapprovisionner
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="grid gap-3 md:grid-cols-3 mb-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Stock actuel
                                        </p>
                                        <p className="text-xl font-bold text-amber-700">
                                            {Number(alert.total_quantity).toLocaleString("fr-FR")}
                                            <span className="text-xs text-muted-foreground font-normal ml-1">
                                                {alert.product.unit_display.toLowerCase()}
                                            </span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">
                                            Seuil d'alerte
                                        </p>
                                        <p className="text-xl font-semibold">
                                            {Number(alert.threshold).toLocaleString("fr-FR")}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Déficit</p>
                                        <p className="text-xl font-semibold text-red-600">
                                            −{Number(alert.deficit).toLocaleString("fr-FR")}
                                        </p>
                                    </div>
                                </div>
                                {alert.warehouses.length > 0 && (
                                    <div className="pt-3 border-t">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                                            Répartition par entrepôt
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {alert.warehouses.map((w) => (
                                                <Badge
                                                    key={w.id}
                                                    variant="outline"
                                                    className="gap-1.5"
                                                >
                                                    <FaWarehouse className="h-3 w-3" />
                                                    {w.name}:{" "}
                                                    <span className="font-semibold">
                                                        {Number(w.quantity).toLocaleString("fr-FR")}
                                                    </span>
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
