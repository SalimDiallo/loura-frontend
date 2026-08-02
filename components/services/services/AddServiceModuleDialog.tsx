"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAddEnrollmentModule,
  useService,
} from "@/lib/hooks/services";
import type { ServiceModule, ServiceModuleInstance } from "@/lib/types";
import { Loader2, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { FaCheckCircle, FaClock, FaListOl } from "react-icons/fa";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  enrollmentId: string;
  serviceId: string;
  /** Instances déjà existantes (pour les filtrer du picker). */
  existingInstances: ServiceModuleInstance[];
}

/**
 * Permet d'ajouter une étape précise du catalogue à une inscription en cours,
 * **au coup par coup** (et non en générant tout d'un seul bloc).
 *
 * - Liste les modules actifs du service qui ne sont pas encore instanciés.
 * - L'admin clique « Ajouter » pour en intégrer un.
 * - Le solde de l'inscription est recalculé côté backend.
 */
export function AddServiceModuleDialog({
  open,
  onOpenChange,
  orgId,
  enrollmentId,
  serviceId,
  existingInstances,
}: Props) {
  const { data: service, isLoading } = useService(
    orgId,
    open ? serviceId : undefined
  );
  const addModule = useAddEnrollmentModule(orgId, enrollmentId);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Modules du catalogue qui ne sont pas encore instanciés sur l'inscription.
  const availableModules = useMemo(() => {
    if (!service) return [];
    const usedIds = new Set(existingInstances.map((i) => i.module));
    return service.modules
      .filter((m) => m.is_active && !usedIds.has(m.id))
      .sort((a, b) => a.order - b.order);
  }, [service, existingInstances]);

  const handleAdd = async (moduleId: string, price: string) => {
    setPendingId(moduleId);
    try {
      // Envoie le prix personnalisé pour ce client uniquement s'il diffère
      // (ou est renseigné) ; sinon le backend reprend le prix catalogue.
      await addModule.mutateAsync({ moduleId, price: price || undefined });
      toast.success("Étape ajoutée à l'inscription.");
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string }; message?: string };
      toast.error("Impossible d'ajouter cette étape", {
        description: e?.data?.detail || e?.message,
      });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaListOl className="h-4 w-4 text-primary" />
            Ajouter une étape
          </DialogTitle>
          <DialogDescription>
            Sélectionnez les étapes à intégrer à cette inscription. Le total
            dû sera recalculé automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 overflow-y-auto pr-1 flex-1">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : availableModules.length === 0 ? (
            <div className="text-center py-8 bg-muted/20 rounded-lg">
              <FaCheckCircle className="h-9 w-9 mx-auto text-green-600 mb-3 opacity-80" />
              <p className="text-sm font-medium">Toutes les étapes ont été ajoutées</p>
              <p className="text-xs text-muted-foreground mt-1">
                Il n&apos;y a plus d&apos;étape disponible dans le catalogue
                de ce service.
              </p>
            </div>
          ) : (
            availableModules.map((m) => (
              <ModuleRow
                key={m.id}
                module={m}
                disabled={pendingId !== null}
                isPending={pendingId === m.id}
                onAdd={(price) => handleAdd(m.id, price)}
              />
            ))
          )}
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Une ligne du picker : module du catalogue + champ prix **éditable**.
 * Le montant est pré-rempli avec le prix catalogue mais peut être ajusté
 * pour ce client avant l'ajout.
 */
function ModuleRow({
  module: m,
  disabled,
  isPending,
  onAdd,
}: {
  module: ServiceModule;
  disabled: boolean;
  isPending: boolean;
  onAdd: (price: string) => void;
}) {
  const [price, setPrice] = useState<string>(
    m.price != null ? String(m.price) : ""
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-3 hover:bg-muted/30 transition sm:flex-row sm:items-start">
      <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
        {m.order + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{m.name}</span>
          {m.is_required ? (
            <span className="text-[10px] uppercase tracking-wide text-primary bg-primary/10 rounded px-1.5 py-0.5">
              Obligatoire
            </span>
          ) : (
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground bg-muted rounded px-1.5 py-0.5">
              Optionnel
            </span>
          )}
        </div>
        {m.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {m.description}
          </p>
        )}
        {m.estimated_duration_days != null && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="inline-flex items-center gap-1">
              <FaClock className="h-2.5 w-2.5" />
              {m.estimated_duration_days} j
            </span>
          </div>
        )}
        <div className="mt-2 space-y-1">
          <Label
            htmlFor={`price-${m.id}`}
            className="text-xs text-muted-foreground"
          >
            Montant pour ce client
          </Label>
          <MoneyInput
            id={`price-${m.id}`}
            value={price}
            onChange={setPrice}
            min={0}
            step={1000}
            disabled={disabled}
          />
        </div>
      </div>
      <Button
        size="sm"
        className="shrink-0 sm:mt-6"
        onClick={() => onAdd(price)}
        disabled={disabled}
        aria-label={`Ajouter l'étape ${m.name}`}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Plus className="h-3.5 w-3.5" />
        )}
        <span className="ml-1">Ajouter</span>
      </Button>
    </div>
  );
}
