"use client";

/**
 * Aperçu compact de l'abonnement courant pour le dashboard.
 *
 * Volontairement discret : un bandeau inline (pas une Card) qui se fond
 * dans la page, avec une exception visuelle pour le plan **Free** ou un
 * abonnement **annulé** où on attire un peu plus l'attention vers
 * l'upgrade / la résolution.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { useMySubscription } from "@/lib/hooks/core";
import { cn } from "@/lib/utils";
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
        return <Skeleton className="h-9 w-full max-w-md rounded-md" />;
    }
    if (!subscription) return null;

    const Icon = PLAN_ICONS[subscription.plan.code] ?? Sparkles;
    const isFree = subscription.plan.code === "free";
    const isCancelled = subscription.status === "cancelled";
    const needsAttention = isFree || isCancelled;

    return (
        <Link
            href="/core/billing"
            className={cn(
                "group inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors",
                "border border-transparent hover:border-border",
                needsAttention
                    ? "bg-amber-50/40 hover:bg-amber-50/70 text-amber-700"
                    : "text-muted-foreground hover:bg-muted/40",
            )}
            aria-label={`Forfait ${subscription.plan.name} — gérer l'abonnement`}
        >
            <Icon
                className={cn(
                    "h-3.5 w-3.5 shrink-0",
                    needsAttention ? "text-amber-600" : "text-muted-foreground/70",
                )}
                aria-hidden
            />
            <span className="font-medium">{subscription.plan.name}</span>
            {isCancelled && (
                <span className="text-[10px] uppercase tracking-wider font-semibold">
                    · Annulé
                </span>
            )}
            {!needsAttention && subscription.cycle && (
                <span className="text-muted-foreground/70 hidden sm:inline">
                    · {subscription.cycle === "yearly" ? "annuel" : "mensuel"}
                </span>
            )}
            <span className="opacity-60 group-hover:opacity-100 transition-opacity inline-flex items-center gap-0.5">
                {isFree ? "Upgrade" : "Gérer"}
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
        </Link>
    );
}
