"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

/**
 * Primitives sobres pour le dashboard HR.
 * - Pas de shadow, pas de rounded.
 * - Bordures fines, typographie calme.
 */

// ─── Metric (KPI) ───────────────────────────────────────────────────────────

export interface MetricProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: "default" | "success" | "warning" | "danger" | "muted";
  compact?: boolean;
  className?: string;
}

const TONE_VALUE: Record<NonNullable<MetricProps["tone"]>, string> = {
  default: "text-foreground",
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-rose-600",
  muted: "text-muted-foreground",
};

export function Metric({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  compact = false,
  className,
}: MetricProps) {
  return (
    <div
      className={cn(
        "border border-border/60 bg-card",
        compact ? "p-4" : "p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "mt-2 font-semibold tabular-nums",
              compact ? "text-xl" : "text-2xl",
              TONE_VALUE[tone],
            )}
          >
            {value}
          </p>
          {hint && (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
        {Icon && (
          <div className="size-8 shrink-0 flex items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground">
            <Icon className="size-4" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Widget shell ───────────────────────────────────────────────────────────

export interface WidgetProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Hauteur min du corps (utile pour alignement dans une grille) */
  minBodyHeight?: number | string;
}

export function Widget({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  minBodyHeight,
}: WidgetProps) {
  return (
    <div
      className={cn(
        "border border-border/60 bg-card flex flex-col h-full",
        className,
      )}
    >
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <Icon className="size-4 text-muted-foreground shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground tracking-tight truncate">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground truncate">
                {description}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div
        className="px-5 py-4 flex-1"
        style={
          minBodyHeight
            ? { minHeight: typeof minBodyHeight === "number" ? `${minBodyHeight}px` : minBodyHeight }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

// ─── États (loading / error / empty) ────────────────────────────────────────

export function WidgetLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function WidgetError({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-2 text-amber-600">
        <AlertCircle className="size-4" />
        <span className="font-medium">Données indisponibles</span>
      </div>
      {message && <p className="text-xs">{message}</p>}
    </div>
  );
}

export function WidgetEmpty({ message = "Aucune donnée." }: { message?: string }) {
  return (
    <p className="text-sm text-muted-foreground italic">{message}</p>
  );
}

export function MetricSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "border border-border/60 bg-card",
        compact ? "p-4" : "p-5",
      )}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className={cn("mt-3", compact ? "h-6 w-20" : "h-7 w-24")} />
      <Skeleton className="h-3 w-16 mt-2" />
    </div>
  );
}
