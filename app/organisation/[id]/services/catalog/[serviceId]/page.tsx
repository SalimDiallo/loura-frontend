"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
import { DetailPageLayout } from "@/components/layout/DetailPageLayout";
import { Can, PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { PaymentModeBadge } from "@/components/services/services/ServiceStatusBadge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    QuickSelect,
    type QuickSelectItem,
} from "@/components/ui/quick-select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
    useCreateServiceModule,
    useDeleteService,
    useDeleteServiceModule,
    useService,
    useUpdateService,
    useUpdateServiceModule,
} from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    CreateServiceModuleData,
    ServiceModule,
    ServicePaymentMode,
} from "@/lib/types";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
    FaCheckCircle,
    FaClock,
    FaConciergeBell,
    FaEdit,
    FaListOl,
    FaUserPlus,
} from "react-icons/fa";
import { toast } from "sonner";

export default function ServiceDetailPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.SERVICES.VIEW}>
      <ServiceDetailPage />
    </PermissionGuard>
  );
}

function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const serviceId = params.serviceId as string;
  const { formatCurrency } = useCurrencyFormatter();
  const { can } = useOrgPermissions();
  const canManageService = can(PERMISSIONS.SERVICES.MANAGE);
  const canManageModules = can(PERMISSIONS.SERVICE_MODULES.MANAGE);

  const { data: service, isLoading, error } = useService(orgId, serviceId);
  const updateService = useUpdateService(orgId);
  const deleteService = useDeleteService(orgId);
  const createModule = useCreateServiceModule(orgId, serviceId);
  const updateModule = useUpdateServiceModule(orgId, serviceId);
  const deleteModule = useDeleteServiceModule(orgId, serviceId);

  const [editOpen, setEditOpen] = useState(false);
  const [moduleOpen, setModuleOpen] = useState(false);
  const [moduleEditing, setModuleEditing] = useState<ServiceModule | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmModuleDelete, setConfirmModuleDelete] =
    useState<ServiceModule | null>(null);

  const handleToggleActive = async () => {
    if (!service) return;
    try {
      await updateService.mutateAsync({
        id: service.id,
        data: { is_active: !service.is_active },
      });
      toast.success(
        !service.is_active ? "Service activé." : "Service désactivé."
      );
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error("Action impossible", { description: e?.message });
    }
  };

  const handleDelete = async () => {
    if (!service) return;
    try {
      await deleteService.mutateAsync(service.id);
      toast.success("Service supprimé.");
      router.push(`/organisation/${orgId}/services/catalog`);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string }; message?: string };
      toast.error("Suppression impossible", {
        description: e?.data?.detail || e?.message,
      });
    }
  };

  return (
    <>
      <DetailPageLayout
        title={service?.name || "Service"}
        subtitle={service?.code || undefined}
        backLink={`/organisation/${orgId}/services/catalog`}
        icon={FaConciergeBell}
        isLoading={isLoading && !service}
        error={error ? { message: error.message } : null}
        badge={
          service ? (
            <div className="flex items-center gap-2">
              <PaymentModeBadge mode={service.payment_mode} />
              <BadgeStatus status={service.is_active} />
            </div>
          ) : undefined
        }
        actions={
          service
            ? [
                ...(can(PERMISSIONS.SERVICE_ENROLLMENTS.MANAGE)
                  ? [
                      {
                        label: "Inscrire un client",
                        icon: FaUserPlus,
                        onClick: () =>
                          router.push(
                            `/organisation/${orgId}/services/enrollments/create?service=${service.id}`
                          ),
                      },
                    ]
                  : []),
                ...(canManageService
                  ? [
                      {
                        label: "Modifier",
                        icon: FaEdit,
                        onClick: () => setEditOpen(true),
                        variant: "outline" as const,
                      },
                    ]
                  : []),
              ]
            : []
        }
        headerExtras={
          service ? (
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <span>
                <strong>{service.modules_count}</strong> étape(s)
              </span>
              <span>
                <strong>{service.enrollments_count}</strong> inscription(s)
              </span>
              {service.duration_days != null && (
                <span>
                  Durée estimée :{" "}
                  <strong>{service.duration_days}</strong> jour(s)
                </span>
              )}
              <span>
                Prix calculé :{" "}
                <strong>
                  {service.computed_price !== null
                    ? formatCurrency(Number(service.computed_price))
                    : "—"}
                </strong>
              </span>
            </div>
          ) : undefined
        }
        audit={
          service
            ? {
                created_at: service.created_at,
                updated_at: service.updated_at,
                created_by_info: service.created_by_info,
                updated_by_info: service.updated_by_info,
              }
            : undefined
        }
      >
        {service && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
                {service.category_name && (
                  <CardDescription>
                    Catégorie : {service.category_name}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {service.description || "Aucune description."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FaListOl className="h-4 w-4" />
                    Étapes du service
                  </CardTitle>
                  <CardDescription>
                    Ces étapes sont automatiquement instanciées à chaque
                    inscription.
                  </CardDescription>
                </div>
                {canManageModules && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setModuleEditing(null);
                      setModuleOpen(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Ajouter une étape
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {service.modules.length === 0 ? (
                  <div className="text-center py-8 bg-muted/20 rounded-lg">
                    <FaListOl className="h-9 w-9 mx-auto text-muted-foreground mb-3 opacity-50" />
                    <p className="text-sm font-medium">
                      Aucune étape pour ce service
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ajoutez la première étape pour structurer votre processus.
                    </p>
                  </div>
                ) : (
                  service.modules
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-3 hover:bg-muted/30 transition"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                            {m.order + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm truncate">
                                {m.name}
                              </span>
                              {m.is_required ? (
                                <span className="text-[10px] uppercase tracking-wide text-primary bg-primary/10 rounded px-1.5 py-0.5">
                                  Obligatoire
                                </span>
                              ) : (
                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                                  Optionnel
                                </span>
                              )}
                              {!m.is_active && <BadgeStatus status={false} />}
                            </div>
                            {m.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {m.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                          {m.estimated_duration_days != null && (
                            <span className="inline-flex items-center gap-1">
                              <FaClock className="h-3 w-3" />
                              {m.estimated_duration_days} j
                            </span>
                          )}
                          {m.price != null && (
                            <span className="font-semibold text-foreground">
                              {formatCurrency(Number(m.price))}
                            </span>
                          )}
                          {canManageModules && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setModuleEditing(m);
                                  setModuleOpen(true);
                                }}
                                aria-label={`Modifier ${m.name}`}
                              >
                                <FaEdit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setConfirmModuleDelete(m)}
                                aria-label={`Supprimer ${m.name}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            <Can permission={PERMISSIONS.SERVICES.MANAGE}>
              <Card>
                <CardHeader>
                  <CardTitle>Statut & administration</CardTitle>
                  <CardDescription>
                    Activez / désactivez ou supprimez ce service.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Service actif</p>
                      <p className="text-xs text-muted-foreground">
                        Les services inactifs ne peuvent pas accueillir de nouvelles inscriptions.
                      </p>
                    </div>
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={handleToggleActive}
                      disabled={updateService.isPending}
                      aria-label="Activer / désactiver le service"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <p className="text-sm font-medium text-destructive">
                        Supprimer ce service
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Action irréversible. Impossible si des inscriptions existent.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setConfirmDeleteOpen(true)}
                      disabled={service.enrollments_count > 0}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Supprimer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Can>
          </>
        )}
      </DetailPageLayout>

      {service && (
        <>
          <EditServiceDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            service={service}
            onSave={async (data) => {
              await updateService.mutateAsync({ id: service.id, data });
              toast.success("Service mis à jour.");
              setEditOpen(false);
            }}
            isPending={updateService.isPending}
          />

          <ServiceModuleDialog
            open={moduleOpen}
            onOpenChange={setModuleOpen}
            initial={moduleEditing}
            nextOrder={
              moduleEditing
                ? moduleEditing.order
                : service.modules.length
            }
            onSave={async (data, id) => {
              try {
                if (id) {
                  await updateModule.mutateAsync({ id, data });
                  toast.success("Étape mise à jour.");
                } else {
                  await createModule.mutateAsync(data);
                  toast.success("Étape ajoutée.");
                }
                setModuleOpen(false);
                setModuleEditing(null);
              } catch (err: unknown) {
                const e = err as { data?: { detail?: string }; message?: string };
                toast.error("Action impossible", {
                  description: e?.data?.detail || e?.message,
                });
              }
            }}
            isPending={createModule.isPending || updateModule.isPending}
          />

          <Dialog
            open={confirmDeleteOpen}
            onOpenChange={setConfirmDeleteOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer le service ?</DialogTitle>
                <DialogDescription>
                  Cette action est irréversible. Le service « {service.name} »
                  sera définitivement supprimé.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeleteOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    setConfirmDeleteOpen(false);
                    await handleDelete();
                  }}
                  disabled={deleteService.isPending}
                >
                  {deleteService.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Supprimer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={!!confirmModuleDelete}
            onOpenChange={(o) => !o && setConfirmModuleDelete(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer cette étape ?</DialogTitle>
                <DialogDescription>
                  L&apos;étape « {confirmModuleDelete?.name} » sera retirée du
                  service. Action irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmModuleDelete(null)}
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!confirmModuleDelete) return;
                    try {
                      await deleteModule.mutateAsync(confirmModuleDelete.id);
                      toast.success("Étape supprimée.");
                    } catch (err: unknown) {
                      const e = err as { data?: { detail?: string }; message?: string };
                      toast.error("Suppression impossible", {
                        description: e?.data?.detail || e?.message,
                      });
                    } finally {
                      setConfirmModuleDelete(null);
                    }
                  }}
                  disabled={deleteModule.isPending}
                >
                  {deleteModule.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Supprimer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}

// ─── Dialog : édition rapide du service ──────────────────────────────────────

function EditServiceDialog({
  open,
  onOpenChange,
  service,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: NonNullable<ReturnType<typeof useService>["data"]>;
  onSave: (data: {
    name?: string;
    code?: string;
    description?: string;
    base_price?: string | null;
    duration_days?: number | null;
    payment_mode?: ServicePaymentMode;
  }) => Promise<void>;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <EditServiceDialogBody
            key={`${service.id}-${service.updated_at}`}
            service={service}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
            isPending={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

const EDIT_PAYMENT_MODE_ITEMS: QuickSelectItem[] = [
  { id: "global", name: "Paiement global", subtitle: "Total en une fois" },
  { id: "per_step", name: "Par étape", subtitle: "Au fil des étapes" },
  { id: "partial", name: "Partiel libre", subtitle: "Échéances libres" },
];

function EditServiceDialogBody({
  service,
  onCancel,
  onSave,
  isPending,
}: {
  service: NonNullable<ReturnType<typeof useService>["data"]>;
  onCancel: () => void;
  onSave: (data: {
    name?: string;
    code?: string;
    description?: string;
    base_price?: string | null;
    duration_days?: number | null;
    payment_mode?: ServicePaymentMode;
  }) => Promise<void>;
  isPending: boolean;
}) {
  const [name, setName] = useState(service.name);
  const [code, setCode] = useState(service.code);
  const [description, setDescription] = useState(service.description);
  const [paymentMode, setPaymentMode] = useState<ServicePaymentMode>(
    service.payment_mode
  );
  const [basePrice, setBasePrice] = useState(service.base_price ?? "");
  const [durationDays, setDurationDays] = useState<string>(
    service.duration_days?.toString() ?? ""
  );

  return (
    <>
        <DialogHeader>
          <DialogTitle>Modifier le service</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations principales du service.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            await onSave({
              name: name.trim(),
              code: code.trim(),
              description,
              payment_mode: paymentMode,
              base_price: basePrice === "" ? null : String(basePrice),
              duration_days: durationDays === "" ? null : Number(durationDays),
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nom</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-code">Code</Label>
              <Input
                id="edit-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mode de paiement</Label>
              <QuickSelect
                label="Mode de paiement"
                items={EDIT_PAYMENT_MODE_ITEMS}
                selectedId={paymentMode}
                onSelect={(id) =>
                  setPaymentMode((id as ServicePaymentMode) || "global")
                }
                placeholder="Choisir un mode..."
                accentColor="orange"
                canCreate={false}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-price">Prix de base</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min={0}
                value={basePrice ?? ""}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="Vide = somme des étapes"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-duration">Durée (jours)</Label>
              <Input
                id="edit-duration"
                type="number"
                min={0}
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
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

// ─── Dialog : création / édition d'une étape ─────────────────────────────────

function ServiceModuleDialog({
  open,
  onOpenChange,
  initial,
  nextOrder,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: ServiceModule | null;
  nextOrder: number;
  onSave: (data: CreateServiceModuleData, id?: string) => Promise<void>;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <ServiceModuleDialogBody
            key={initial?.id ?? `new-${nextOrder}`}
            initial={initial}
            nextOrder={nextOrder}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
            isPending={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ServiceModuleDialogBody({
  initial,
  nextOrder,
  onCancel,
  onSave,
  isPending,
}: {
  initial: ServiceModule | null;
  nextOrder: number;
  onCancel: () => void;
  onSave: (data: CreateServiceModuleData, id?: string) => Promise<void>;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [order, setOrder] = useState<string>(
    (initial?.order ?? nextOrder).toString()
  );
  const [price, setPrice] = useState<string>(initial?.price ?? "");
  const [estimatedDays, setEstimatedDays] = useState<string>(
    initial?.estimated_duration_days?.toString() ?? ""
  );
  const [isRequired, setIsRequired] = useState(initial?.is_required ?? true);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);

  return (
    <>
        <DialogHeader>
          <DialogTitle>
            {initial ? "Modifier l’étape" : "Nouvelle étape"}
          </DialogTitle>
          <DialogDescription>
            Définissez le nom, l&apos;ordre et les paramètres de cette étape.
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
                description,
                order: Number(order || 0),
                price: price === "" ? null : String(price),
                estimated_duration_days:
                  estimatedDays === "" ? null : Number(estimatedDays),
                is_required: isRequired,
                is_active: isActive,
              },
              initial?.id
            );
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="m-name">Nom de l&apos;étape</Label>
            <Input
              id="m-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-order">Ordre</Label>
              <Input
                id="m-order"
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-price">Prix</Label>
              <Input
                id="m-price"
                type="number"
                step="0.01"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-days">Durée (j)</Label>
              <Input
                id="m-days"
                type="number"
                min={0}
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="m-desc">Description</Label>
            <Textarea
              id="m-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Étape obligatoire</p>
              <p className="text-xs text-muted-foreground">
                Une étape obligatoire ne peut pas être ignorée pour un client.
              </p>
            </div>
            <Switch
              checked={isRequired}
              onCheckedChange={setIsRequired}
              aria-label="Obligatoire"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Étape active</p>
              <p className="text-xs text-muted-foreground">
                Une étape inactive ne sera pas instanciée pour de nouvelles
                inscriptions.
              </p>
            </div>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              aria-label="Active"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FaCheckCircle className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
    </>
  );
}
