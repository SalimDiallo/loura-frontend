"use client";

/**
 * Composants de garde d'utilisation pour contrôler l'accès aux fonctionnalités
 * selon le niveau d'abonnement. Affiche des messages explicatifs et des CTA d'upgrade.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Plan, Subscription } from "@/lib/types/core";
import { 
  Lock, 
  AlertTriangle, 
  Crown, 
  Zap, 
  Sparkles,
  Building2,
  Puzzle,
  ArrowUpRight,
  Info
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FeatureGuardProps {
  /** Le code de la fonctionnalité requise */
  featureCode: string;
  /** Nom affiché de la fonctionnalité */
  featureName: string;
  /** Description de ce que fait la fonctionnalité */
  description: string;
  /** Le plan actuel de l'utilisateur */
  currentPlan: Plan;
  /** Liste des codes de plans autorisés */
  allowedPlanCodes: string[];
  /** Contenu à afficher si l'accès est autorisé */
  children: React.ReactNode;
  /** Afficher un fallback au lieu de bloquer */
  fallback?: React.ReactNode;
  /** Variante d'affichage */
  variant?: "card" | "inline" | "overlay";
}

interface UsageGuardProps {
  /** Type de ressource */
  resourceType: "organizations" | "modules" | "users" | "storage";
  /** Utilisation actuelle */
  current: number;
  /** Limite du plan (null = illimité) */
  limit: number | null;
  /** Nom de la ressource */
  resourceName: string;
  /** Le plan actuel */
  currentPlan: Plan;
  /** Seuil d'avertissement (0-1) */
  warningThreshold?: number;
}

// ─── Composant : Garde de fonctionnalité ────────────────────────────────────

export function FeatureGuard({
  featureName,
  description,
  currentPlan,
  allowedPlanCodes,
  children,
  fallback,
  variant = "card",
}: FeatureGuardProps) {
  const isAllowed = allowedPlanCodes.includes(currentPlan.code);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Détermine le plan minimum requis
  const planHierarchy = ["free", "basic", "pro", "enterprise"];
  const currentIndex = planHierarchy.indexOf(currentPlan.code);
  const minRequiredIndex = Math.min(
    ...allowedPlanCodes.map((code) => planHierarchy.indexOf(code)).filter((i) => i >= 0)
  );
  const minRequiredPlan = planHierarchy[minRequiredIndex] || "pro";

  if (variant === "inline") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>
          {featureName} disponible en plan {minRequiredPlan}
        </span>
        <Button asChild size="sm" variant="link" className="h-auto p-0">
          <Link href={`/core/billing/upgrade/${minRequiredPlan}`}>
            Upgrader
          </Link>
        </Button>
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className="relative">
        <div className="opacity-50 pointer-events-none">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="max-w-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                <Lock className="h-6 w-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-base">{featureName}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={`/core/billing/upgrade/${minRequiredPlan}`}>
                  Passer au plan {minRequiredPlan}
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Default: card
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">{featureName}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {allowedPlanCodes.map((code) => (
            <Badge key={code} variant="secondary">
              <Crown className="h-3 w-3 mr-1" />
              {code}
            </Badge>
          ))}
        </div>
        <Button asChild>
          <Link href={`/core/billing/upgrade/${minRequiredPlan}`}>
            Passer au plan {minRequiredPlan}
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Composant : Indicateur d'utilisation ─────────────────────────────────────

export function UsageGuard({
  resourceType,
  current,
  limit,
  resourceName,
  currentPlan,
  warningThreshold = 0.8,
}: UsageGuardProps) {
  const isUnlimited = limit === null;
  const percentage = isUnlimited ? 0 : Math.min((current / (limit || 1)) * 100, 100);
  const isWarning = !isUnlimited && percentage >= warningThreshold * 100;
  const isExceeded = !isUnlimited && current >= (limit || 0);

  const icons = {
    organizations: Building2,
    modules: Puzzle,
    users: Crown,
    storage: Zap,
  };
  const Icon = icons[resourceType];

  const planHierarchy = ["free", "basic", "pro", "enterprise"];
  const currentIndex = planHierarchy.indexOf(currentPlan.code);
  const nextPlan = planHierarchy[currentIndex + 1];

  if (isExceeded) {
    return (
      <Card className="border-l-4 border-l-destructive border-destructive/50 bg-destructive/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-destructive">
                Limite {resourceName} atteinte
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                Vous utilisez {current} / {limit} {resourceName}.
                Passez à un plan supérieur pour continuer.
              </p>
              {nextPlan && (
                <Button asChild size="sm" className="mt-3">
                  <Link href={`/core/billing/upgrade/${nextPlan}`}>
                    Passer au plan {nextPlan}
                    <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{resourceName}</span>
        </div>
        <span className={cn(
          "font-medium",
          isWarning && "text-amber-600"
        )}>
          {current}{!isUnlimited && ` / ${limit}`}
        </span>
      </div>
      {!isUnlimited && (
        <Progress 
          value={percentage} 
          className={cn(
            "h-1.5",
            isWarning && "bg-amber-100 [&>div]:bg-amber-500"
          )} 
        />
      )}
      {isWarning && !isExceeded && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Vous approchez de la limite
          {nextPlan && (
            <Link 
              href={`/core/billing/upgrade/${nextPlan}`}
              className="underline ml-1"
            >
              Upgrader ?
            </Link>
          )}
        </p>
      )}
    </div>
  );
}

// ─── Hook : Vérification des permissions ─────────────────────────────────────

export function useFeatureAccess(
  subscription: Subscription | null | undefined,
  featureCode: string
) {
  if (!subscription) {
    return { 
      allowed: false, 
      reason: "no_subscription",
      minPlan: "basic" 
    };
  }

  const planHierarchy: Record<string, number> = {
    free: 0,
    basic: 1,
    pro: 2,
    enterprise: 3,
  };

  const currentLevel = planHierarchy[subscription.plan.code] ?? 0;

  // Mapping des fonctionnalités aux plans requis
  const featureRequirements: Record<string, string> = {
    "multiple_organizations": "basic",
    "advanced_modules": "basic",
    "api_access": "pro",
    "priority_support": "pro",
    "custom_branding": "pro",
    "dedicated_manager": "enterprise",
    "sla_guarantee": "enterprise",
  };

  const requiredPlan = featureRequirements[featureCode] || "free";
  const requiredLevel = planHierarchy[requiredPlan] ?? 0;

  return {
    allowed: currentLevel >= requiredLevel,
    reason: currentLevel >= requiredLevel ? null : "plan_too_low",
    minPlan: requiredPlan,
    currentPlan: subscription.plan.code,
  };
}

// ─── Composant : Badge de statut d'abonnement ─────────────────────────────────

interface SubscriptionStatusBadgeProps {
  subscription: Subscription | null | undefined;
  showDetails?: boolean;
}

export function SubscriptionStatusBadge({ 
  subscription, 
  showDetails = false 
}: SubscriptionStatusBadgeProps) {
  if (!subscription) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Lock className="h-3 w-3 mr-1" />
        Non connecté
      </Badge>
    );
  }

  const planColors: Record<string, string> = {
    free: "bg-slate-100 text-slate-700",
    basic: "bg-blue-100 text-blue-700",
    pro: "bg-amber-100 text-amber-700",
    enterprise: "bg-purple-100 text-purple-700",
  };

  const isExpiring = subscription.days_remaining <= 7 && subscription.days_remaining > 0;
  const isExpired = subscription.days_remaining <= 0;

  return (
    <div className="flex items-center gap-2">
      <Badge className={cn(planColors[subscription.plan.code] || planColors.free)}>
        {subscription.plan.code === "free" && <Sparkles className="h-3 w-3 mr-1" />}
        {subscription.plan.code === "basic" && <Zap className="h-3 w-3 mr-1" />}
        {(subscription.plan.code === "pro" || subscription.plan.code === "enterprise") && (
          <Crown className="h-3 w-3 mr-1" />
        )}
        {subscription.plan.name}
      </Badge>
      
      {showDetails && (
        <>
          {isExpired && (
            <Badge variant="destructive" className="text-xs">
              Expiré
            </Badge>
          )}
          {isExpiring && !isExpired && (
            <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
              {subscription.days_remaining}j restants
            </Badge>
          )}
          {subscription.cancelled_at && (
            <Badge variant="outline" className="text-muted-foreground text-xs">
              Annulé
            </Badge>
          )}
        </>
      )}
    </div>
  );
}
