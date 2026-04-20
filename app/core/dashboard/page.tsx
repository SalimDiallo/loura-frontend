"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/hooks/auth/useCurrentUser";
import { useOrganizations } from "@/lib/hooks/core";
import type { Organization } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import { Building2, ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

// ============================================================================
// HELPERS
// ============================================================================

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ============================================================================
// ORG ROW
// ============================================================================

function OrgRow({ org, onClick }: { org: Organization; onClick: () => void }) {
  return (
    <div
      className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors group cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/8 flex items-center justify-center overflow-hidden transition-colors group-hover:bg-primary/15">
          {org.logo ? (
            <img src={org.logo} alt={org.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-primary font-bold text-[11px] tracking-wide">{getInitials(org.name)}</span>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
              {org.name}
            </h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-px rounded text-[9px] uppercase font-bold tracking-wider shrink-0",
                org.is_active
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "h-1 w-1 rounded-full",
                  org.is_active ? "bg-emerald-500" : "bg-muted-foreground/50"
                )}
              />
              {org.is_active ? "Actif" : "Inactif"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {org.category && (
              <span className="text-[10px] text-muted-foreground font-medium">{org.category.name}</span>
            )}
            {org.category && org.country && <span className="text-muted-foreground/40">·</span>}
            {org.country && <span className="text-[10px] text-muted-foreground">{org.country}</span>}
          </div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function DashboardPage() {
  const router = useRouter();
  const { data: user, isLoading: isUserLoading, isError } = useCurrentUser();
  const {
    data: organizations,
    meta,
    isLoading: isOrgsLoading,
  } = useOrganizations();

  const isLoading = isUserLoading || isOrgsLoading;

  // ========================================================================
  // ERROR
  // ========================================================================

  if (isError) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto">
        <div className="text-red-700 bg-red-100 px-4 py-3 rounded-lg text-sm">
          Erreur lors du chargement. Veuillez réessayer.
        </div>
      </div>
    );
  }

  // ========================================================================
  // LOADING
  // ========================================================================

  if (isLoading) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto space-y-8">
        <div className="space-y-2 pb-4 border-b border-border/40">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-16" />
          </div>
          <Card className="border overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 border-b border-border/30 last:border-0">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    );
  }

  // ========================================================================
  // DATA
  // ========================================================================

  const userName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.email || "Utilisateur";

  const displayOrgs = organizations.slice(0, 5);
  const totalOrgs = meta.totalItems;

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-border/40">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Bonjour, {userName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {totalOrgs} organisation{totalOrgs !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Organizations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Vos organisations</h2>
          <Button
            onClick={() => router.push("/core/dashboard/organizations/create")}
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs font-semibold hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Plus className="h-3 w-3 mr-1" />
            Créer
          </Button>
        </div>

        <Card className="border shadow-sm overflow-hidden bg-card">
          {displayOrgs.length > 0 ? (
            <div className="divide-y divide-border/40">
              {displayOrgs.map((org) => (
                <OrgRow
                  key={org.id}
                  org={org}
                  onClick={() => router.push("/core/dashboard/organizations")}
                />
              ))}

              {/* "View all" button if more than 5 */}
              {totalOrgs > 5 && (
                <div
                  className="p-3 flex justify-center hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => router.push("/core/dashboard/organizations")}
                >
                  <span className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                    Afficher tout ({totalOrgs}) &rarr;
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <div className="h-11 w-11 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                <Building2 className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <h3 className="text-sm font-medium text-foreground">Aucune organisation</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-[220px] leading-relaxed">
                Créez votre premier espace de travail pour commencer.
              </p>
              <Button
                onClick={() => router.push("/core/dashboard/organizations/create")}
                size="sm"
                variant="outline"
                className="h-8 text-xs font-medium"
              >
                <Plus className="h-3 w-3 mr-1.5" />
                Créer une organisation
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}