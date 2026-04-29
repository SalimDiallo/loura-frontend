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
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
  useAddEnrollmentModule,
  useService,
} from "@/lib/hooks/services";
import type { ServiceModuleInstance } from "@/lib/types";
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
  const { formatCurrency } = useCurrencyFormatter();
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

  const handleAdd = async (moduleId: string) => {
    setPendingId(moduleId);
    try {
      await addModule.mutateAsync(moduleId);
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
              <div
                key={m.id}
                className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/30 transition"
              >
                <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                  {m.order + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">
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
                  </div>
                  {m.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {m.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {m.estimated_duration_days != null && (
                      <span className="inline-flex items-center gap-1">
                        <FaClock className="h-2.5 w-2.5" />
                        {m.estimated_duration_days} j
                      </span>
                    )}
                    {m.price != null && (
                      <span className="font-semibold text-foreground">
                        {formatCurrency(Number(m.price))}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAdd(m.id)}
                  disabled={pendingId !== null}
                  aria-label={`Ajouter l'étape ${m.name}`}
                >
                  {pendingId === m.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  <span className="ml-1">Ajouter</span>
                </Button>
              </div>
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
