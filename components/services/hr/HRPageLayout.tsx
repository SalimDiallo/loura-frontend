"use client";

import { cn } from "@/lib/utils";
import type { ComponentType, ReactNode } from "react";

/**
 * Layout RH réutilisable, sobre, pour toute page du module `/hr`.
 *
 * Principes :
 * - Pas d'arrondis ni d'ombres : design strict, "print-ready".
 * - Header plat avec titre + sous-titre + actions optionnelles.
 * - Grille d'éléments (stats / widgets) libre, composable.
 */

export interface HRPageLayoutAction {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "muted";
}

export interface HRPageLayoutProps {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function HRPageLayout({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className,
}: HRPageLayoutProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* Header sobre */}
      <div className="border-b border-border/60 bg-background">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            {Icon && (
              <div className="size-9 shrink-0 flex items-center justify-center border border-border/60 bg-muted/40 text-muted-foreground">
                <Icon className="size-4" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight text-foreground truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
        {children}
      </div>
    </div>
  );
}

/**
 * Grille responsive pour disposer les widgets d'un dashboard.
 * Par défaut : 12 colonnes, gap 4.
 */
export function HRGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Helpers de colonnes pour la grille (sucre syntaxique).
 */
export function HRCol({
  span = 12,
  spanMd,
  spanLg,
  children,
  className,
}: {
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  spanMd?: 1 | 2 | 3 | 4 | 5 | 6;
  spanLg?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  children: ReactNode;
  className?: string;
}) {
  const mdMap: Record<number, string> = {
    1: "md:col-span-1",
    2: "md:col-span-2",
    3: "md:col-span-3",
    4: "md:col-span-4",
    5: "md:col-span-5",
    6: "md:col-span-6",
  };
  const lgMap: Record<number, string> = {
    1: "lg:col-span-1",
    2: "lg:col-span-2",
    3: "lg:col-span-3",
    4: "lg:col-span-4",
    5: "lg:col-span-5",
    6: "lg:col-span-6",
    7: "lg:col-span-7",
    8: "lg:col-span-8",
    9: "lg:col-span-9",
    10: "lg:col-span-10",
    11: "lg:col-span-11",
    12: "lg:col-span-12",
  };
  const smMap: Record<number, string> = {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
    7: "col-span-7",
    8: "col-span-8",
    9: "col-span-9",
    10: "col-span-10",
    11: "col-span-11",
    12: "col-span-12",
  };

  return (
    <div
      className={cn(
        smMap[span],
        spanMd && mdMap[spanMd],
        spanLg && lgMap[spanLg],
        className,
      )}
    >
      {children}
    </div>
  );
}
