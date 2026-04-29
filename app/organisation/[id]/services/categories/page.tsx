"use client";

import { ListPageLayout, ListSearchFilters, ListStat } from "@/components/layout/ListPageLayout";
import { PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    QuickSelect,
    type QuickSelectItem,
} from "@/components/ui/quick-select";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    useCreateServiceCategory,
    useDeleteServiceCategory,
    usePaginatedServiceCategories,
    usePaginatedServices,
    useUpdateService,
    useUpdateServiceCategory,
} from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    CreateServiceCategoryData,
    Service,
    ServiceCategory,
} from "@/lib/types";
import {
    ArrowRight,
    Eye,
    EyeOff,
    Loader2,
    MoreHorizontal,
    Pencil,
    Plus,
    Save,
    Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FaConciergeBell, FaPlus, FaSitemap } from "react-icons/fa";
import { toast } from "sonner";

export default function ServiceCategoriesPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.SERVICE_CATEGORIES.VIEW}>
      <ServiceCategoriesPage />
    </PermissionGuard>
  );
}

function ServiceCategoriesPage() {
  const params = useParams();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.SERVICE_CATEGORIES.MANAGE);
  const canManageServices = can(PERMISSIONS.SERVICES.MANAGE);

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      is_active: activeOnly ? "true" : undefined,
    }),
    [search, activeOnly]
  );

  const {
    data,
    meta,
    isLoading,
    error,
  } = usePaginatedServiceCategories(orgId, filters, { pageSize: 100 });

  const create = useCreateServiceCategory(orgId);
  const update = useUpdateServiceCategory(orgId);
  const remove = useDeleteServiceCategory(orgId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ServiceCategory | null>(
    null
  );
  const [managing, setManaging] = useState<ServiceCategory | null>(null);

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-destructive">Erreur : {error.message}</p>
      </div>
    );
  }

  return (
    <>
      <ListPageLayout
        title="Catégories de services"
        icon={FaSitemap}
        description="Organisez votre offre par catégorie pour la rendre plus lisible."
        headerActions={
          canManage
            ? [
                {
                  label: "Nouvelle catégorie",
                  icon: FaPlus,
                  onClick: () => {
                    setEditing(null);
                    setFormOpen(true);
                  },
                },
              ]
            : []
        }
        stats={[
          <ListStat
            key="total"
            label="Catégories"
            value={meta.totalItems}
            icon={<FaSitemap className="h-4 w-4 text-muted-foreground" />}
          />,
          <ListStat
            key="services"
            label="Services rattachés"
            value={data.reduce((acc, c) => acc + (c.services_count || 0), 0)}
            icon={
              <FaConciergeBell className="h-4 w-4 text-muted-foreground" />
            }
          />,
        ]}
        searchFilters={
          <ListSearchFilters
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Rechercher une catégorie..."
            filtersOpen={filterOpen}
            onFiltersOpenChange={setFilterOpen}
            filtersAreActive={!activeOnly}
            filters={
              <label className="flex items-center gap-2 text-sm cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="h-4 w-4"
                />
                Uniquement les catégories actives
              </label>
            }
          />
        }
        content={
          isLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-44 w-full" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 border border-dashed">
              <FaSitemap className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="font-medium">Aucune catégorie</p>
              <p className="text-sm text-muted-foreground mt-1">
                Créez vos premières catégories pour structurer votre catalogue.
              </p>
              {canManage && (
                <Button
                  className="mt-4"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une catégorie
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((c) => (
                <CategoryCard
                  key={c.id}
                  category={c}
                  canManage={canManage}
                  onEdit={() => {
                    setEditing(c);
                    setFormOpen(true);
                  }}
                  onDelete={() => setConfirmDelete(c)}
                  onManage={() => setManaging(c)}
                />
              ))}
            </div>
          )
        }
      />

      <CategoryDialog
        open={formOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
          setFormOpen(o);
        }}
        initial={editing}
        parents={data}
        onSave={async (payload, id) => {
          try {
            if (id) {
              await update.mutateAsync({ id, data: payload });
              toast.success("Catégorie mise à jour.");
            } else {
              await create.mutateAsync(payload);
              toast.success("Catégorie créée.");
            }
            setFormOpen(false);
            setEditing(null);
          } catch (err: unknown) {
            const e = err as { data?: { detail?: string }; message?: string };
            toast.error("Action impossible", {
              description: e?.data?.detail || e?.message,
            });
          }
        }}
        isPending={create.isPending || update.isPending}
      />

      {managing && (
        <ManageCategoryServicesSheet
          open={!!managing}
          onOpenChange={(o) => !o && setManaging(null)}
          orgId={orgId}
          category={managing}
          allCategories={data}
          canManageServices={canManageServices}
        />
      )}

      <Dialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la catégorie ?</DialogTitle>
            <DialogDescription>
              « {confirmDelete?.name} » sera supprimée. Les{" "}
              {confirmDelete?.services_count ?? 0} service(s) qui
              l&apos;utilisaient ne seront plus catégorisés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={async () => {
                if (!confirmDelete) return;
                try {
                  await remove.mutateAsync(confirmDelete.id);
                  toast.success("Catégorie supprimée.");
                } catch (err: unknown) {
                  const e = err as { message?: string };
                  toast.error("Suppression impossible", {
                    description: e?.message,
                  });
                } finally {
                  setConfirmDelete(null);
                }
              }}
            >
              {remove.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Card pour une catégorie
// ────────────────────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  canManage,
  onEdit,
  onDelete,
  onManage,
}: {
  category: ServiceCategory;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onManage: () => void;
}) {
  const dotColor = category.color || "#9ca3af";
  return (
    <div className="border bg-card flex flex-col group hover:border-primary/40 transition-colors">
      <div className="p-4 flex items-start gap-3 border-b bg-muted/20">
        <span
          className="h-9 w-9 shrink-0 inline-flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: dotColor }}
          aria-hidden
        >
          <FaSitemap className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{category.name}</h3>
            {!category.is_active && (
              <Badge variant="outline" className="text-xs gap-1">
                <EyeOff className="h-3 w-3" />
                Inactive
              </Badge>
            )}
          </div>
          {category.full_path !== category.name && (
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {category.full_path}
            </p>
          )}
        </div>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-60 group-hover:opacity-100"
                aria-label="Options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
          {category.description || (
            <span className="italic opacity-70">Pas de description</span>
          )}
        </p>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">
            {category.services_count}
          </span>
          <span className="text-xs text-muted-foreground">
            service{category.services_count > 1 ? "s" : ""} rattaché
            {category.services_count > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="border-t p-2 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start"
          onClick={onManage}
        >
          <Eye className="h-4 w-4 mr-2" />
          Gérer les services
        </Button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sheet : gestion des services rattachés à une catégorie
// ────────────────────────────────────────────────────────────────────────────

function ManageCategoryServicesSheet({
  open,
  onOpenChange,
  orgId,
  category,
  allCategories,
  canManageServices,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  orgId: string;
  category: ServiceCategory;
  allCategories: ServiceCategory[];
  canManageServices: boolean;
}) {
  // Services déjà dans la catégorie
  const inCategory = usePaginatedServices(
    orgId,
    { category: category.id },
    { pageSize: 100 }
  );

  // Services NON catégorisés ou dans une autre catégorie : pour les rattacher.
  const others = usePaginatedServices(orgId, {}, { pageSize: 200 });

  const updateService = useUpdateService(orgId);

  const [pickServiceId, setPickServiceId] = useState<string>("");

  const otherServices = useMemo<Service[]>(
    () => others.data.filter((s) => s.category !== category.id),
    [others.data, category.id]
  );

  const reassign = async (service: Service, newCategoryId: string | null) => {
    try {
      await updateService.mutateAsync({
        id: service.id,
        data: { category: newCategoryId },
      });
      toast.success(
        newCategoryId
          ? `« ${service.name} » rattaché à « ${category.name} ».`
          : `« ${service.name} » détaché de la catégorie.`
      );
      setPickServiceId("");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error("Action impossible", { description: e?.message });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col gap-0 p-0">
        <SheetHeader className="p-6 border-b">
          <div className="flex items-center gap-3">
            <span
              className="h-10 w-10 inline-flex items-center justify-center text-white"
              style={{ backgroundColor: category.color || "#9ca3af" }}
              aria-hidden
            >
              <FaSitemap className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <SheetTitle className="truncate">{category.name}</SheetTitle>
              <SheetDescription className="text-xs">
                Gérez les services rattachés à cette catégorie.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ── Ajout d'un service existant ────────────────────────────── */}
          {canManageServices && (
            <section className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Ajouter un service à cette catégorie
              </Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <QuickSelect
                    label="Service"
                    items={otherServices.map<QuickSelectItem>((s) => ({
                      id: s.id,
                      name: s.name,
                      subtitle: s.category_name
                        ? `Actuellement dans : ${s.category_name}`
                        : "Sans catégorie",
                    }))}
                    selectedId={pickServiceId}
                    onSelect={setPickServiceId}
                    placeholder="Choisir un service…"
                    icon={FaConciergeBell}
                    accentColor="orange"
                    canCreate={false}
                  />
                </div>
                <Button
                  disabled={!pickServiceId || updateService.isPending}
                  onClick={() => {
                    const svc = otherServices.find(
                      (s) => s.id === pickServiceId
                    );
                    if (svc) reassign(svc, category.id);
                  }}
                >
                  {updateService.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Rattacher
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Vous pouvez aussi créer un nouveau service depuis le catalogue
                en sélectionnant cette catégorie.
              </p>
            </section>
          )}

          {/* ── Services déjà rattachés ─────────────────────────────────── */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Services rattachés
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {inCategory.meta.totalItems}
              </span>
            </div>

            {inCategory.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : inCategory.data.length === 0 ? (
              <div className="text-center py-8 border border-dashed bg-muted/20">
                <FaConciergeBell className="h-7 w-7 mx-auto text-muted-foreground opacity-50 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aucun service dans cette catégorie pour le moment.
                </p>
              </div>
            ) : (
              <ul className="divide-y border bg-card">
                {inCategory.data.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/30"
                  >
                    <FaConciergeBell className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/organisation/${orgId}/services/catalog/${s.id}`}
                        className="text-sm font-medium hover:underline truncate block"
                      >
                        {s.name}
                      </Link>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
                        <span>{s.code || "Sans code"}</span>
                        <span>·</span>
                        <span>
                          {s.modules_count} module{s.modules_count > 1 ? "s" : ""}
                        </span>
                        {!s.is_active && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                            inactif
                          </Badge>
                        )}
                      </div>
                    </div>
                    {canManageServices && (
                      <ReassignServiceMenu
                        service={s}
                        currentCategoryId={category.id}
                        categories={allCategories}
                        onReassign={(targetId) => reassign(s, targetId)}
                        pending={updateService.isPending}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ReassignServiceMenu({
  service,
  currentCategoryId,
  categories,
  onReassign,
  pending,
}: {
  service: Service;
  currentCategoryId: string;
  categories: ServiceCategory[];
  onReassign: (targetCategoryId: string | null) => void;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const others = categories.filter((c) => c.id !== currentCategoryId);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={pending}
          aria-label={`Réorganiser ${service.name}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => onReassign(null)}>
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          Détacher (sans catégorie)
        </DropdownMenuItem>
        {others.length > 0 && <DropdownMenuSeparator />}
        {others.map((c) => (
          <DropdownMenuItem
            key={c.id}
            onClick={() => onReassign(c.id)}
            className="gap-2"
          >
            <span
              className="h-2.5 w-2.5 inline-block"
              style={{ backgroundColor: c.color || "#9ca3af" }}
              aria-hidden
            />
            <span className="truncate">{c.full_path}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Dialog création / édition d'une catégorie (key-remount pattern)
// ────────────────────────────────────────────────────────────────────────────

function CategoryDialog({
  open,
  onOpenChange,
  initial,
  parents,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: ServiceCategory | null;
  parents: ServiceCategory[];
  onSave: (
    data: CreateServiceCategoryData,
    id?: string
  ) => Promise<void>;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && (
          <CategoryDialogBody
            key={initial?.id ?? "new"}
            initial={initial}
            parents={parents}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
            isPending={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CategoryDialogBody({
  initial,
  parents,
  onCancel,
  onSave,
  isPending,
}: {
  initial: ServiceCategory | null;
  parents: ServiceCategory[];
  onCancel: () => void;
  onSave: (
    data: CreateServiceCategoryData,
    id?: string
  ) => Promise<void>;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [parent, setParent] = useState<string>(initial?.parent ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "");
  const [color, setColor] = useState(initial?.color || "#ffd15d");
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {initial ? "Modifier la catégorie" : "Nouvelle catégorie"}
        </DialogTitle>
        <DialogDescription>
          Une catégorie peut avoir un parent pour créer une hiérarchie.
        </DialogDescription>
      </DialogHeader>

      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) {
            toast.error("Le nom est obligatoire.");
            return;
          }
          await onSave(
            {
              name: trimmed,
              parent: parent || null,
              description,
              icon,
              color,
              is_active: isActive,
            },
            initial?.id
          );
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="cat-name">Nom</Label>
          <Input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>Catégorie parente</Label>
          <QuickSelect
            label="Catégorie parente"
            items={parents
              .filter((p) => p.id !== initial?.id)
              .map<QuickSelectItem>((p) => ({
                id: p.id,
                name: p.full_path,
                subtitle: p.description || undefined,
              }))}
            selectedId={parent}
            onSelect={setParent}
            placeholder="Rechercher une catégorie parente..."
            icon={FaSitemap}
            accentColor="blue"
            canCreate={false}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="cat-icon">Icône (Lucide)</Label>
            <Input
              id="cat-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="briefcase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-color">Couleur</Label>
            <Input
              id="cat-color"
              type="color"
              value={color || "#ffd15d"}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cat-desc">Description</Label>
          <Textarea
            id="cat-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between border p-3">
          <div>
            <p className="text-sm font-medium">Active</p>
            <p className="text-xs text-muted-foreground">
              Les catégories inactives sont masquées des sélecteurs.
            </p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
            aria-label="Active"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

