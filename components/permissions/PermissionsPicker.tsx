"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    getDependentSelectedIds,
    getExcludingSelectedIds,
    getRequiredIds,
    resolvePermissionSelection,
} from "@/lib/permission-dependencies";
import type { Permission } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
    AlertTriangle,
    Ban,
    Check,
    ChevronDown,
    Eye,
    Filter,
    Lock,
    Search,
    Settings2,
    Shield,
    Sparkles,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const MODULE_LABELS: Record<string, string> = {
  core: "Organisation",
  hr: "Ressources humaines",
  inventory: "Inventaire",
  services: "Services",
};

const MODULE_ACCENTS: Record<string, string> = {
  core: "bg-violet-500",
  hr: "bg-amber-500",
  inventory: "bg-emerald-500",
  services: "bg-sky-500",
};

type FilterMode = "all" | "selected" | "available";

interface PermissionsPickerProps {
  permissions: Permission[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /**
   * Permissions déjà accordées implicitement (ex : via le rôle d'un membre).
   * Affichées comme cochées + grisées avec un badge "Du rôle", non éditables.
   */
  implicitIds?: string[];
  /** Texte affiché au-dessus du picker (optionnel). */
  description?: string;
  /** Hauteur max de la liste défilante. Défaut: 520px. */
  maxHeight?: number | string;
  /** Affichage compact si true (utilisé dans des cards déjà denses). */
  compact?: boolean;
}

/**
 * Sélecteur de permissions premium :
 *   - Recherche live, filtres rapides (toutes / sélectionnées / disponibles).
 *   - Modules pliables, "Tout sélectionner" par module.
 *   - Compteur visuel + barre de progression.
 *   - Verrouillage automatique pour les exclusions mutuelles & dépendances.
 *   - Hints discrets via Tooltip pour ne pas alourdir la lecture.
 */
export function PermissionsPicker({
  permissions,
  selectedIds,
  onChange,
  implicitIds = [],
  description,
  maxHeight = 560,
  compact = false,
}: PermissionsPickerProps) {
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const implicitSet = useMemo(() => new Set(implicitIds), [implicitIds]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // ─── Group permissions by module ──────────────────────────────────────────
  const grouped = useMemo(() => {
    const map: Record<string, Permission[]> = {};
    for (const p of permissions) {
      if (!map[p.module]) map[p.module] = [];
      map[p.module].push(p);
    }
    // Sort: core first, then alpha
    return Object.entries(map).sort(([a], [b]) => {
      if (a === "core") return -1;
      if (b === "core") return 1;
      return a.localeCompare(b);
    });
  }, [permissions]);

  // ─── Filtre live (search + mode) ──────────────────────────────────────────
  const filteredGrouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return grouped
      .map(([mod, perms]) => {
        const moduleLabel = (MODULE_LABELS[mod] ?? mod).toLowerCase();
        const matches = perms.filter((p) => {
          const matchesSearch =
            !q ||
            p.label.toLowerCase().includes(q) ||
            mod.toLowerCase().includes(q) ||
            moduleLabel.includes(q);
          if (!matchesSearch) return false;
          const isOn = selectedSet.has(p.id) || implicitSet.has(p.id);
          if (filterMode === "selected") return isOn;
          if (filterMode === "available") return !isOn;
          return true;
        });
        return [mod, matches] as const;
      })
      .filter(([, perms]) => perms.length > 0);
  }, [grouped, search, filterMode, selectedSet, implicitSet]);

  // Auto-collapse les modules qui n'ont aucune permission active (gain de place)
  // mais on respecte les choix manuels de l'utilisateur ensuite.
  useEffect(() => {
    if (search.trim() || filterMode !== "all") return;
    setCollapsed((prev) => {
      const next = { ...prev };
      for (const [mod, perms] of grouped) {
        if (next[mod] !== undefined) continue; // utilisateur a déjà décidé
        const hasAny = perms.some(
          (p) => selectedSet.has(p.id) || implicitSet.has(p.id)
        );
        next[mod] = !hasAny;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grouped]);

  const totalCount = permissions.length;
  const selectedCount = selectedIds.length + implicitIds.length;
  const progressPct =
    totalCount === 0 ? 0 : Math.round((selectedCount / totalCount) * 100);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleToggle = (permId: string) => {
    const nextRaw = selectedIds.includes(permId)
      ? selectedIds.filter((id) => id !== permId)
      : [...selectedIds, permId];
    onChange(
      resolvePermissionSelection(selectedIds, nextRaw, permissions, {
        implicitIds,
      })
    );
  };

  const handleToggleModule = (mod: string, perms: Permission[]) => {
    const editable = perms.filter((p) => !implicitSet.has(p.id));
    const allOn = editable.every((p) => selectedIds.includes(p.id));
    const nextRaw = allOn
      ? selectedIds.filter((id) => !editable.some((p) => p.id === id))
      : Array.from(new Set([...selectedIds, ...editable.map((p) => p.id)]));
    onChange(
      resolvePermissionSelection(selectedIds, nextRaw, permissions, {
        implicitIds,
      })
    );
  };

  const handleClearAll = () => {
    if (selectedIds.length === 0) return;
    onChange([]);
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    grouped.forEach(([mod]) => {
      next[mod] = false;
    });
    setCollapsed(next);
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    grouped.forEach(([mod]) => {
      next[mod] = true;
    });
    setCollapsed(next);
  };

  const isCollapsed = (mod: string) => Boolean(collapsed[mod]);
  const toggleCollapse = (mod: string) =>
    setCollapsed((c) => ({ ...c, [mod]: !c[mod] }));

  const allExpanded = grouped.every(([mod]) => !isCollapsed(mod));

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4">
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        {/* ─── Header : recherche + résumé ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Rechercher une permission, un module..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9 h-10"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-md hover:bg-muted"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="h-9 px-3 text-xs font-mono uppercase tracking-widest"
            >
              <Shield className="h-3.5 w-3.5 mr-1.5" />
              {selectedCount} / {totalCount}
            </Badge>
            {selectedIds.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-9 px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Tout désélectionner</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* ─── Toolbar : filtres + actions ───────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="inline-flex bg-muted/50 p-0.5 rounded-md">
            <FilterTab
              active={filterMode === "all"}
              onClick={() => setFilterMode("all")}
              icon={<Filter className="h-3.5 w-3.5" />}
              label="Toutes"
              count={totalCount}
            />
            <FilterTab
              active={filterMode === "selected"}
              onClick={() => setFilterMode("selected")}
              icon={<Check className="h-3.5 w-3.5" />}
              label="Actives"
              count={selectedCount}
            />
            <FilterTab
              active={filterMode === "available"}
              onClick={() => setFilterMode("available")}
              icon={<Eye className="h-3.5 w-3.5" />}
              label="Disponibles"
              count={totalCount - selectedCount}
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={allExpanded ? handleCollapseAll : handleExpandAll}
              className="h-7 text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              {allExpanded ? "Tout replier" : "Tout déplier"}
            </Button>
          </div>
        </div>

        {/* ─── Barre de progression ──────────────────────────────────── */}
        <div className="h-1 w-full bg-muted overflow-hidden rounded-full">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* ─── Liste défilante par module ────────────────────────────── */}
        <div
          className="border bg-card/30 overflow-y-auto rounded-md"
          style={{
            maxHeight:
              typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight,
          }}
        >
          {filteredGrouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                {search
                  ? `Aucune permission ne correspond à « ${search} »`
                  : filterMode === "selected"
                    ? "Aucune permission sélectionnée pour le moment"
                    : "Aucune permission disponible avec ce filtre"}
              </p>
              {(search || filterMode !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setFilterMode("all");
                  }}
                  className="mt-3 text-xs"
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredGrouped.map(([mod, perms]) => {
                // Pour l'entête module on tient compte de TOUTES les perms du module,
                // pas seulement de celles filtrées.
                const allModPerms = grouped.find(([m]) => m === mod)?.[1] ?? [];
                const editable = allModPerms.filter(
                  (p) => !implicitSet.has(p.id)
                );
                const selectedInMod = allModPerms.filter(
                  (p) => selectedSet.has(p.id) || implicitSet.has(p.id)
                ).length;
                const allOn =
                  editable.length > 0 &&
                  editable.every((p) => selectedSet.has(p.id));
                const collapsedNow = isCollapsed(mod);
                const accent = MODULE_ACCENTS[mod] ?? "bg-muted-foreground";
                const hasAny = selectedInMod > 0;

                return (
                  <div key={mod} className="bg-background">
                    {/* Header module */}
                    <div className="flex items-center gap-3 px-4 py-2.5 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/50">
                      <button
                        type="button"
                        onClick={() => toggleCollapse(mod)}
                        className="flex items-center gap-2.5 flex-1 min-w-0 text-left group"
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                            collapsedNow && "-rotate-90"
                          )}
                        />
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full shrink-0",
                            hasAny ? accent : "bg-muted-foreground/30"
                          )}
                        />
                        <h4 className="text-[11px] font-mono uppercase tracking-widest font-bold group-hover:text-primary transition-colors truncate">
                          {MODULE_LABELS[mod] ?? mod}
                        </h4>
                        <Badge
                          variant={hasAny ? "default" : "outline"}
                          className={cn(
                            "h-5 text-[10px] font-mono shrink-0",
                            !hasAny && "text-muted-foreground"
                          )}
                        >
                          {selectedInMod} / {allModPerms.length}
                        </Badge>
                      </button>
                      {editable.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleToggleModule(mod, allModPerms)
                          }
                          className="h-7 text-[10px] font-mono uppercase tracking-wider hover:bg-primary/10 hover:text-primary"
                        >
                          {allOn ? "Aucune" : "Toutes"}
                        </Button>
                      )}
                    </div>

                    {/* Liste des permissions du module */}
                    {!collapsedNow && (
                      <div
                        className={cn(
                          "grid gap-px bg-border/30",
                          compact ? "grid-cols-1" : "sm:grid-cols-2"
                        )}
                      >
                        {perms.map((perm) => (
                          <PermissionRow
                            key={perm.id}
                            perm={perm}
                            permissions={permissions}
                            selectedIds={selectedIds}
                            implicitSet={implicitSet}
                            onToggle={handleToggle}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function FilterTab({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-medium transition-all",
        active
          ? "bg-background shadow-sm text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
      <span
        className={cn(
          "ml-0.5 text-[10px] font-mono",
          active ? "text-primary" : "text-muted-foreground/70"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function PermissionRow({
  perm,
  permissions,
  selectedIds,
  implicitSet,
  onToggle,
}: {
  perm: Permission;
  permissions: Permission[];
  selectedIds: string[];
  implicitSet: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isImplicit = implicitSet.has(perm.id);
  const isExtra = selectedIds.includes(perm.id);
  const isChecked = isImplicit || isExtra;

  // Bloqué par dépendance : encore requise par une autre cochée
  const lockingIds = isExtra
    ? getDependentSelectedIds(perm.id, selectedIds, permissions)
    : [];
  const isLockedByDep = lockingIds.length > 0;

  // Bloqué par exclusion mutuelle
  const excludingIds = !isChecked
    ? getExcludingSelectedIds(perm.id, selectedIds, permissions)
    : [];
  const isLockedByExcl = excludingIds.length > 0;

  const lockingLabels = lockingIds
    .map((id) => permissions.find((p) => p.id === id)?.label)
    .filter((l): l is string => Boolean(l));
  const excludingLabels = excludingIds
    .map((id) => permissions.find((p) => p.id === id)?.label)
    .filter((l): l is string => Boolean(l));

  const requiredIds = !isChecked ? getRequiredIds(perm.id, permissions) : [];
  const requiredLabels = requiredIds
    .filter((id) => !implicitSet.has(id))
    .map((id) => permissions.find((p) => p.id === id)?.label)
    .filter((l): l is string => Boolean(l));

  const disabled = isImplicit || isLockedByDep || isLockedByExcl;
  const action = inferAction(perm.codename);
  const description = describePermission(perm);

  // Status indicator (icon affiché à droite si présent)
  const statusIcon = isLockedByDep ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <p className="font-semibold mb-1">Requise par d'autres permissions</p>
        <p className="text-xs">{lockingLabels.join(", ")}</p>
      </TooltipContent>
    </Tooltip>
  ) : isLockedByExcl ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Ban className="h-3 w-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <p className="font-semibold mb-1">Incompatible</p>
        <p className="text-xs">
          Désactive d'abord : {excludingLabels.join(", ")}
        </p>
      </TooltipContent>
    </Tooltip>
  ) : !isChecked && requiredLabels.length > 0 ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Sparkles className="h-3 w-3" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        <p className="font-semibold mb-1">Active aussi automatiquement</p>
        <p className="text-xs">{requiredLabels.join(", ")}</p>
      </TooltipContent>
    </Tooltip>
  ) : null;

  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(perm.id)}
      disabled={disabled}
      className={cn(
        "group flex items-start gap-3 px-4 py-3 bg-background text-left transition-colors relative",
        isChecked && !isImplicit && "bg-primary/5 hover:bg-primary/10",
        isImplicit && "bg-muted/40",
        !disabled && !isChecked && "hover:bg-muted/40 cursor-pointer",
        disabled && "cursor-not-allowed",
        isLockedByExcl && "opacity-60"
      )}
    >
      {/* Checkbox custom */}
      <span
        className={cn(
          "mt-0.5 h-4 w-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors",
          isChecked
            ? isImplicit
              ? "bg-muted-foreground/70 border-muted-foreground/70"
              : "bg-primary border-primary"
            : "border-muted-foreground/30 group-hover:border-primary/60",
          isLockedByExcl && "border-destructive/30"
        )}
      >
        {isChecked && <Check className="h-3 w-3 text-primary-foreground" />}
      </span>

      {/* Contenu */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          {action && (
            <ActionBadge action={action} />
          )}
          <span
            className={cn(
              "text-sm font-medium leading-tight",
              isImplicit && "text-muted-foreground"
            )}
          >
            {perm.label}
          </span>
          {isImplicit && (
            <Badge
              variant="outline"
              className="h-4 px-1.5 text-[9px] font-mono uppercase tracking-wider"
            >
              <Lock className="h-2.5 w-2.5 mr-1" />
              Du rôle
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-[11px] text-muted-foreground/80 leading-snug">
            {description}
          </p>
        )}
      </div>

      {/* Status icon (à droite) */}
      {statusIcon && <div className="shrink-0 mt-0.5">{statusIcon}</div>}
    </button>
  );
}

function ActionBadge({ action }: { action: ActionType }) {
  const styles: Record<ActionType, string> = {
    view: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
    manage:
      "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
    approve:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    request:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    review:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    invite:
      "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
    scope:
      "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  };
  const labels: Record<ActionType, string> = {
    view: "VOIR",
    manage: "GÉRER",
    approve: "APPROUVER",
    request: "DEMANDER",
    review: "VALIDER",
    invite: "INVITER",
    scope: "RESTREINDRE",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 h-4 text-[9px] font-mono font-bold uppercase tracking-wider border rounded",
        styles[action]
      )}
    >
      {labels[action]}
    </span>
  );
}

// ─── Helpers : déduction de l'action et de la description ──────────────────

type ActionType =
  | "view"
  | "manage"
  | "approve"
  | "request"
  | "review"
  | "invite"
  | "scope";

function inferAction(codename: string): ActionType | null {
  const name = codename.split(".").pop() ?? codename;
  if (name.startsWith("view_")) return "view";
  if (name.startsWith("manage_")) return "manage";
  if (name.startsWith("approve_")) return "approve";
  if (name.startsWith("request_")) return "request";
  if (name.startsWith("review_")) return "review";
  if (name.startsWith("invite_")) return "invite";
  if (name.startsWith("scope_")) return "scope";
  return null;
}

/**
 * Génère une phrase courte décrivant ce que fait la permission, à partir
 * du codename (ex: "hr.manage_employees" → "Modifier la liste des employés").
 * On évite ainsi d'afficher le codename brut tout en gardant une info utile.
 */
function describePermission(perm: Permission): string | null {
  const action = inferAction(perm.codename);
  if (!action) return null;
  const name = perm.codename.split(".").pop() ?? "";
  const subject = name.replace(/^[a-z]+_/, "").replace(/_/g, " ");
  if (!subject) return null;

  switch (action) {
    case "view":
      return `Consulter ${subject}`;
    case "manage":
      return `Créer, modifier et supprimer ${subject}`;
    case "approve":
      return `Approuver ${subject}`;
    case "request":
      return `Faire une demande pour ${subject}`;
    case "review":
      return `Examiner et valider ${subject}`;
    case "invite":
      return `Envoyer des invitations à ${subject}`;
    case "scope":
      return `Restreindre l'accès aux ${subject} assignés`;
    default:
      return null;
  }
}
