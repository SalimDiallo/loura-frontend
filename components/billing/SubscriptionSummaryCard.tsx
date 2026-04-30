"use client";

/**
 * Carte d'aperçu de l'abonnement courant, à afficher sur le dashboard
 * principal. Reste compact : nom du plan, statut, lien vers la page billing.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMySubscription } from "@/lib/hooks/core";
import { ArrowRight, Crown, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

const PLAN_ICONS: Record<string, typeof Sparkles> = {
    free: Sparkles,
    basic: Zap,
    pro: Crown,
    enterprise: Crown,
};

export function SubscriptionSummaryCard() {
    const { data: subscription, isLoading } = useMySubscription();

    if (isLoading) {
        return <Skeleton className="h-24 w-full rounded-lg" />;
    }
    if (!subscription) return null;

    const Icon = PLAN_ICONS[subscription.plan.code] ?? Sparkles;
    const isFree = subscription.plan.code === "free";
    const isCancelled = subscription.status === "cancelled";

    return (
        <Card className="border-primary/20">
            <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{subscription.plan.name}</span>
                            {isCancelled && (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                                    Annulé
                                </Badge>
                            )}
                            {isFree && (
                                <Badge variant="secondary" className="text-[10px]">Gratuit</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                            {isFree
                                ? "Passez à un forfait supérieur pour débloquer plus de modules et d'organisations."
                                : `Cycle ${subscription.cycle === "yearly" ? "annuel" : "mensuel"} · ${subscription.days_remaining} jour${subscription.days_remaining > 1 ? "s" : ""} restant`}
                        </p>
                    </div>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href="/core/billing">
                        {isFree ? "Upgrade" : "Gérer"}
                        <ArrowRight className="h-3 w-3 ml-1" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
