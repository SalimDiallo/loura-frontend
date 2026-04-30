"use client";

/**
 * Composants pour gérer et visualiser les contrôles d'accès basés sur l'abonnement.
 * Affiche les fonctionnalités verrouillées/déverrouillées selon le plan.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Plan, Subscription } from "@/lib/types/core";
import { 
  Lock, 
  Unlock, 
  AlertCircle, 
  Crown, 
  Zap, 
  Sparkles,
  Building2,
  Puzzle,
  CheckCircle2,
  XCircle,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";

// ─── Types & Interfaces ─────────────────────────────────────────────────────

interface FeatureLimit {
  feature: string;
  current: number;
  max: number | null; // null = illimité
  unit?: string;
}

interface PlanFeature {
  name: string;
  description: string;
  icon: typeof Sparkles;
  locked?: boolean;
  highlight?: boolean;
}

// ─── Composant : Indicateur de limite ───────────────────────────────────────────

interface LimitIndicatorProps {
  label: string;
  current: number;
  max: number | null;
  unit?: string;
  warningThreshold?: number; // Pourcentage (0-1)
}

export function LimitIndicator({
  label,
  current,
  max,
  unit = "",
  warningThreshold = 0.8,
}: LimitIndicatorProps) {
  const isUnlimited = max === null;
  const percentage = isUnlimited ? 0 : Math.min((current / max) * 100, 100);
  const isWarning = !isUnlimited && percentage >= warningThreshold * 100;
  const isExceeded = !isUnlimited && current >= max;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(
          "font-medium",
          isExceeded && "text-destructive",
          isWarning && !isExceeded && "text-amber-600"
        )}>
          {current}
          {!isUnlimited && ` / ${max}`} {unit}
        </span>
      </div>
      {!isUnlimited && (
        <Progress 
          value={percentage} 
          className={cn(
            "h-2",
            isExceeded && "bg-destructive/20",
            isWarning && !isExceeded && "bg-amber-100"
          )}
        />
      )}
      {isExceeded && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Limite atteinte - Passez à un plan supérieur
        </p>
      )}
    </div>
  );
}

// ─── Composant : Grille de fonctionnalités ────────────────────────────────────

interface FeatureGridProps {
  features: PlanFeature[];
  currentPlanCode: string;
  targetPlanCode: string;
}

export function FeatureGrid({ features, currentPlanCode, targetPlanCode }: FeatureGridProps) {
  const planHierarchy = ["free", "basic", "pro", "enterprise"];
  const currentIndex = planHierarchy.indexOf(currentPlanCode);
  const targetIndex = planHierarchy.indexOf(targetPlanCode);
  const isUpgrade = targetIndex > currentIndex;
  const isDowngrade = targetIndex < currentIndex;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {features.map((feature) => {
        const Icon = feature.icon;
        const isLocked = feature.locked;

        return (
          <div
            key={feature.name}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border",
              isLocked 
                ? "bg-muted/50 border-muted opacity-60" 
                : "bg-background border-border",
              feature.highlight && !isLocked && "border-primary/50 bg-primary/5"
            )}
          >
            <div className={cn(
              "rounded-md p-2 shrink-0",
              isLocked ? "bg-muted" : "bg-primary/10"
            )}>
              {isLocked ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Icon className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-medium text-sm",
                  isLocked && "text-muted-foreground"
                )}>
                  {feature.name}
                </span>
                {isUpgrade && !isLocked && (
                  <Badge variant="default" className="text-[10px] h-4 px-1">
                    <Unlock className="h-2.5 w-2.5 mr-0.5" />
                    Débloqué
                  </Badge>
                )}
                {isDowngrade && isLocked && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1">
                    <Lock className="h-2.5 w-2.5 mr-0.5" />
                    Verrouillé
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {feature.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Composant : Carte de comparaison de plans ────────────────────────────────

interface PlanComparisonCardProps {
  currentPlan: Plan;
  targetPlan: Plan;
  subscription?: Subscription | null;
}

export function PlanComparisonCard({
  currentPlan,
  targetPlan,
  subscription,
}: PlanComparisonCardProps) {
  const planHierarchy = ["free", "basic", "pro", "enterprise"];
  const currentIndex = planHierarchy.indexOf(currentPlan.code);
  const targetIndex = planHierarchy.indexOf(targetPlan.code);
  
  const isUpgrade = targetIndex > currentIndex;
  const isDowngrade = targetIndex < currentIndex;
  const isSame = currentPlan.code === targetPlan.code;

  // Calcul des différences
  const orgDiff = (targetPlan.max_organizations ?? Infinity) - (currentPlan.max_organizations ?? Infinity);
  const moduleDiff = (targetPlan.max_modules_per_org ?? Infinity) - (currentPlan.max_modules_per_org ?? Infinity);

  const getPlanIcon = (code: string) => {
    switch (code) {
      case "free": return Sparkles;
      case "basic": return Zap;
      case "pro": return Crown;
      case "enterprise": return Crown;
      default: return Sparkles;
    }
  };

  const CurrentIcon = getPlanIcon(currentPlan.code);
  const TargetIcon = getPlanIcon(targetPlan.code);

  if (isSame) {
    return (
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Forfait actuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Vous êtes déjà sur le plan <strong>{currentPlan.name}</strong>.
            Aucun changement nécessaire.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      isUpgrade && "border-emerald-500/50",
      isDowngrade && "border-amber-500/50"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {isUpgrade ? (
              <>
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                Upgrade vers {targetPlan.name}
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-amber-500" />
                Downgrade vers {targetPlan.name}
              </>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <CurrentIcon className="h-3 w-3" />
              {currentPlan.name}
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge className="gap-1">
              <TargetIcon className="h-3 w-3" />
              {targetPlan.name}
            </Badge>
          </div>
        </div>
        <CardDescription>
          {isUpgrade 
            ? "Débloquez plus de fonctionnalités et augmentez vos limites."
            : "Réduisez vos limites à la fin de la période en cours."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Limites organisations */}
        <LimitIndicator
          label="Organisations"
          current={subscription?.usage?.organization_count || 0}
          max={targetPlan.max_organizations}
          unit="org"
        />

        {/* Limites modules */}
        <LimitIndicator
          label="Modules par organisation"
          current={subscription?.usage?.modules_count || 0}
          max={targetPlan.max_modules_per_org}
          unit="module"
        />

        {/* Modules autorisés */}
        {targetPlan.allowed_module_codes && (
          <div className="space-y-2">
            <span className="text-sm text-muted-foreground">Modules inclus</span>
            <div className="flex flex-wrap gap-1.5">
              {targetPlan.allowed_module_codes.map((code) => (
                <Badge key={code} variant="secondary" className="text-xs">
                  {code.toUpperCase()}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Composant : Bannière de limitation ───────────────────────────────────────

interface LimitBannerProps {
  feature: string;
  limitType: "organizations" | "modules" | "feature";
  currentUsage: number;
  maxAllowed: number | null;
  upgradePlanCode?: string;
  upgradePlanName?: string;
}

export function LimitBanner({
  feature,
  limitType,
  currentUsage,
  maxAllowed,
  upgradePlanCode = "pro",
  upgradePlanName = "Pro",
}: LimitBannerProps) {
  const isExceeded = maxAllowed !== null && currentUsage >= maxAllowed;
  const isWarning = maxAllowed !== null && currentUsage >= maxAllowed * 0.8 && !isExceeded;

  if (!isExceeded && !isWarning) return null;

  return (
    <Card className={cn(
      "border-l-4",
      isExceeded && "border-l-destructive border-destructive/50 bg-destructive/5",
      isWarning && "border-l-amber-500 border-amber-500/50 bg-amber-50"
    )}>
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          <AlertCircle className={cn(
            "h-5 w-5 shrink-0 mt-0.5",
            isExceeded ? "text-destructive" : "text-amber-600"
          )} />
          <div className="flex-1">
            <h4 className={cn(
              "font-medium",
              isExceeded ? "text-destructive" : "text-amber-700"
            )}>
              {isExceeded ? "Limite atteinte" : "Vous approchez de la limite"}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {feature} - Utilisation actuelle : {currentUsage}
              {maxAllowed !== null && ` / ${maxAllowed}`}
            </p>
            <Button 
              asChild 
              size="sm" 
              className="mt-3"
              variant={isExceeded ? "default" : "outline"}
            >
              <Link href={`/core/billing/upgrade/${upgradePlanCode}`}>
                Passer au plan {upgradePlanName}
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Composant : Badge de plan ────────────────────────────────────────────────

interface PlanBadgeProps {
  planCode: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PlanBadge({ planCode, showIcon = true, size = "md" }: PlanBadgeProps) {
  const config: Record<string, { icon: typeof Sparkles; color: string; bg: string; label: string }> = {
    free: { icon: Sparkles, color: "text-slate-600", bg: "bg-slate-100", label: "Free" },
    basic: { icon: Zap, color: "text-blue-600", bg: "bg-blue-100", label: "Basic" },
    pro: { icon: Crown, color: "text-amber-600", bg: "bg-amber-100", label: "Pro" },
    enterprise: { icon: Crown, color: "text-purple-600", bg: "bg-purple-100", label: "Enterprise" },
  };

  const cfg = config[planCode] || config.free;
  const Icon = cfg.icon;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  };

  const iconSizes = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-4 w-4",
  };

  return (
    <Badge className={cn(cfg.bg, cfg.color, "border-0", sizeClasses[size])}>
      {showIcon && <Icon className={cn(iconSizes[size], "mr-1")} />}
      {cfg.label}
    </Badge>
  );
}
