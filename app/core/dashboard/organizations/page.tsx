"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useOrganizations,
  useToggleOrganization,
} from "@/lib/hooks/core";
import type { Organization } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  Settings,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function OrganizationsPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Stable filters object
  const filters = useMemo(
    () => (debouncedSearch ? { search: debouncedSearch } : undefined),
    [debouncedSearch]
  );

  // API hooks
  const {
    data: organizations,
    meta,
    page,
    setPage,
    isLoading,
    isFetching,
  } = useOrganizations(filters);

  const toggleMutation = useToggleOrganization();

  const handleToggle = useCallback(
    (org: Organization) => {
      toggleMutation.mutate({ id: org.id, isActive: org.is_active });
    },
    [toggleMutation]
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  if (isLoading) {
    return (
      <div className="px-4 py-8 max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-end pb-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-full rounded-lg" />
        <Card className="p-0 overflow-hidden bg-muted/30">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3.5 p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          ))}
        </Card>
      </div>
    );
  }

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Organisations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {meta.totalItems} espace{meta.totalItems !== 1 ? "s" : ""} de travail
          </p>
        </div>
        <Button
          onClick={() => router.push("/core/dashboard/organizations/create")}
          size="sm"
          className="h-9 text-xs font-medium shadow-sm"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Nouvelle
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher une organisation…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10 pr-10 h-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchInput && !isFetching && (
            <button
              onClick={() => setSearchInput("")}
              className="h-5 w-5 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
          {isFetching && (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>
      </div>

      {/* List */}
      <Card className="overflow-hidden bg-muted/30 p-0">
        {organizations.length > 0 ? (
          <div>
            {organizations.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group cursor-pointer"
                onClick={() => router.push(`/core/dashboard/organizations/${org.id}/edit`)}
              >
                {/* Left: Avatar + Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-primary/8 flex items-center justify-center overflow-hidden">
                    {org.logo ? (
                      <img src={org.logo} alt={org.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold text-xs tracking-wide">
                        {getInitials(org.name)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">{org.name}</h3>
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
                      {(org.category || org.country) && <span className="text-muted-foreground/40">·</span>}
                      <span className="text-[10px] text-muted-foreground">{org.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs px-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => router.push(`/core/dashboard/organizations/${org.id}/edit`)}
                  >
                    <Pencil className="h-3 w-3 mr-1.5" />
                    Modifier
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        className="cursor-pointer text-xs"
                        onClick={() => router.push(`/core/dashboard/organizations/${org.id}/edit`)}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-xs"
                        onClick={() => router.push(`/core/dashboard/organizations/${org.id}/settings`)}
                      >
                        <Settings className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                        Paramètres
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className={cn(
                          "cursor-pointer text-xs",
                          org.is_active
                            ? "text-destructive focus:text-destructive focus:bg-destructive/10"
                            : "text-emerald-600 focus:text-emerald-600 focus:bg-emerald-500/10"
                        )}
                        onClick={() => handleToggle(org)}
                      >
                        <Power className="mr-2 h-3.5 w-3.5" />
                        {org.is_active ? "Désactiver" : "Activer"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center mb-4">
              <Building2 className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <h3 className="text-sm font-medium text-foreground">
              {debouncedSearch ? "Aucun résultat" : "Aucune organisation"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
              {debouncedSearch
                ? "Essayez avec d'autres termes."
                : "Créez votre premier espace de travail."}
            </p>
            {!debouncedSearch && (
              <Button
                onClick={() => router.push("/core/dashboard/organizations/create")}
                size="sm"
                variant="outline"
                className="h-8 text-xs mt-4"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Créer
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Page {meta.currentPage} sur {meta.totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!meta.hasPreviousPage}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (meta.totalPages <= 5) {
                pageNum = i + 1;
              } else if (meta.currentPage <= 3) {
                pageNum = i + 1;
              } else if (meta.currentPage >= meta.totalPages - 2) {
                pageNum = meta.totalPages - 4 + i;
              } else {
                pageNum = meta.currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === meta.currentPage ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-8 w-8 text-xs",
                    pageNum === meta.currentPage && "pointer-events-none"
                  )}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={!meta.hasNextPage}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
