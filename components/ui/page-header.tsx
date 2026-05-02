"use client";

import PageHelper from "@/components/services/organisation/PageHelper";
import { Button } from "@/components/ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ArrowLeft, ChevronRight, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";

export interface PageHeaderAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
  loading?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ComponentType<{ className?: string }>;
  actions?: PageHeaderAction[];
  backLink?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: ReactNode;
  className?: string;
}

/**
 * Header de page responsive.
 *
 * Mobile :
 *   - Titre `text-xl`, bouton retour 36px, icône 36px → tout tient sur 320px.
 *   - Une seule action principale visible (la dernière du tableau).
 *   - Les autres actions partent dans un menu kebab `MoreVertical`.
 *
 * Desktop :
 *   - Layout 2 colonnes (titre / actions), titre `text-3xl`, toutes les
 *     actions visibles côte à côte.
 */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  actions = [],
  backLink,
  breadcrumbs,
  badge,
  className = "",
}: PageHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backLink) {
      router.push(backLink);
    } else {
      router.back();
    }
  };

  // Sépare l'action principale (dernière) et les secondaires.
  const primaryAction = actions.length > 0 ? actions[actions.length - 1] : null;
  const secondaryActions = actions.length > 1 ? actions.slice(0, -1) : [];
  const hasSecondaryActions = secondaryActions.length > 0;

  return (
    <div className={cn("space-y-3 sm:space-y-4", className)}>
      {/* Breadcrumbs — caché sur très petit écran pour gagner de la place */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Fil d'Ariane"
          className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground overflow-x-auto"
        >
          {breadcrumbs.map((crumb, index) => (
            <div
              key={index}
              className="flex items-center gap-1.5 shrink-0"
            >
              {index > 0 && (
                <ChevronRight className="size-3.5 text-muted-foreground/50" />
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors duration-150 truncate"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium truncate">
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Header principal */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        {/* Left side : back button + icône + titre */}
        <div className="flex items-start gap-2.5 sm:gap-4 min-w-0">
          {/* Back button */}
          <button
            onClick={handleBack}
            className={cn(
              "flex items-center justify-center",
              "size-9 sm:size-10 rounded-xl",
              "bg-muted/50 hover:bg-muted",
              "text-muted-foreground hover:text-foreground",
              "border border-border/50 hover:border-border",
              "transition-all duration-200",
              "active:scale-95 sm:hover:scale-105",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "shrink-0 mt-0.5"
            )}
            aria-label="Retour"
          >
            <ArrowLeft className="size-4 sm:size-5" />
          </button>

          {/* Title section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Icon — caché en très petit pour libérer le titre */}
              {Icon && (
                <div className="hidden xs:flex sm:flex items-center justify-center size-9 sm:size-10 rounded-xl bg-primary/10 text-primary shrink-0">
                  <Icon className="size-4 sm:size-5" />
                </div>
              )}

              {/* Title + Badge */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight leading-tight truncate max-w-[200px] sm:max-w-none">
                  {title}
                </h1>
                {badge}
              </div>
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 max-w-2xl leading-relaxed line-clamp-2 sm:line-clamp-none">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side : Helper + Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 -mx-1 sm:mx-0">
          <PageHelper />

          {/* ─── Desktop : toutes les actions visibles ───────────────── */}
          {actions.length > 0 && (
            <div className="hidden sm:flex items-center gap-2">
              {actions.map((action, index) => (
                <ActionButton
                  key={index}
                  action={action}
                  isPrimary={index === actions.length - 1}
                />
              ))}
            </div>
          )}

          {/* ─── Mobile : action principale + kebab ──────────────────── */}
          {primaryAction && (
            <div className="flex sm:hidden items-center gap-1.5">
              <ActionButton
                action={primaryAction}
                isPrimary
                mobileCompact
              />
              {hasSecondaryActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9 shrink-0"
                      aria-label="Plus d'actions"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {secondaryActions.map((action, index) => {
                      const ActionIcon = action.icon;
                      const item = (
                        <DropdownMenuItem
                          key={index}
                          disabled={action.disabled || action.loading}
                          onClick={action.onClick}
                          className={cn(
                            "gap-2",
                            action.variant === "destructive" &&
                              "text-destructive focus:text-destructive"
                          )}
                        >
                          {ActionIcon && (
                            <ActionIcon
                              className={cn(
                                "size-4",
                                action.loading && "animate-spin"
                              )}
                            />
                          )}
                          <span>{action.label}</span>
                        </DropdownMenuItem>
                      );
                      if (action.href && !action.disabled && !action.loading) {
                        return (
                          <Link
                            key={index}
                            href={action.href}
                            className="block"
                          >
                            {item}
                          </Link>
                        );
                      }
                      return item;
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ActionButton (factorise l'affichage d'une action) ─────────────────────

function ActionButton({
  action,
  isPrimary,
  mobileCompact = false,
}: {
  action: PageHeaderAction;
  isPrimary: boolean;
  mobileCompact?: boolean;
}) {
  const ActionIcon = action.icon;

  const buttonContent = (
    <>
      {ActionIcon && (
        <ActionIcon
          className={cn("size-4", action.loading && "animate-spin")}
        />
      )}
      {/* En mode compact mobile : le label est masqué si une icône est fournie. */}
      <span
        className={cn(
          ActionIcon && mobileCompact && "sr-only",
          ActionIcon && !mobileCompact && "hidden sm:inline"
        )}
      >
        {action.label}
      </span>
    </>
  );

  const buttonClassName = cn(
    "gap-2",
    mobileCompact && ActionIcon && "size-9 px-0"
  );

  const tourAttr = isPrimary ? "page-action-create" : undefined;

  if (action.href) {
    return (
      <Button
        variant={action.variant || "default"}
        disabled={action.disabled || action.loading}
        asChild
        className={buttonClassName}
        data-tour={tourAttr}
      >
        <Link href={action.href}>{buttonContent}</Link>
      </Button>
    );
  }

  return (
    <Button
      variant={action.variant || "default"}
      onClick={action.onClick}
      disabled={action.disabled || action.loading}
      className={buttonClassName}
      data-tour={tourAttr}
    >
      {buttonContent}
    </Button>
  );
}

// Composant séparé pour un header plus simple (sans actions)
export function PageHeaderSimple({
  title,
  subtitle,
  backLink,
  className,
}: {
  title: string;
  subtitle?: string;
  backLink?: string;
  className?: string;
}) {
  const router = useRouter();

  const handleBack = () => {
    if (backLink) {
      router.push(backLink);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn("flex items-center gap-3 sm:gap-4", className)}>
      <button
        onClick={handleBack}
        className={cn(
          "flex items-center justify-center",
          "size-9 rounded-lg",
          "text-muted-foreground hover:text-foreground",
          "hover:bg-muted",
          "transition-all duration-200",
          "active:scale-95",
          "shrink-0"
        )}
        aria-label="Retour"
      >
        <ArrowLeft className="size-5" />
      </button>
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
