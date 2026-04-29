"use client";

import { ConfirmActionDialog } from "@/components/services/services/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import {
  useBlockModuleInstance,
  useCompleteModuleInstance,
  useReopenModuleInstance,
  useSkipModuleInstance,
  useStartModuleInstance,
} from "@/lib/hooks/services";
import type { ServiceModuleInstance } from "@/lib/types";
import { useState } from "react";
import {
  FaCheck,
  FaForward,
  FaPlay,
  FaStop,
  FaUndo,
} from "react-icons/fa";
import { toast } from "sonner";

interface Props {
  orgId: string;
  enrollmentId: string;
  instance: ServiceModuleInstance;
  /** Désactive l'ensemble (si l'utilisateur n'a pas la permission). */
  disabled?: boolean;
  size?: "sm" | "default";
  /** Affichage compact : icônes seules + tooltips. */
  compact?: boolean;
}

type ActionKey = "start" | "complete" | "block" | "skip" | "reopen";

export function ModuleWorkflowActions({
  orgId,
  enrollmentId,
  instance,
  disabled,
  size = "sm",
  compact,
}: Props) {
  const start = useStartModuleInstance(orgId, enrollmentId);
  const complete = useCompleteModuleInstance(orgId, enrollmentId);
  const block = useBlockModuleInstance(orgId, enrollmentId);
  const skip = useSkipModuleInstance(orgId, enrollmentId);
  const reopen = useReopenModuleInstance(orgId, enrollmentId);

  const [pendingAction, setPendingAction] = useState<ActionKey | null>(null);

  const status = instance.status;

  const showStart = status === "pending" || status === "blocked";
  const showComplete = status === "in_progress" || status === "blocked";
  const showBlock = status === "in_progress" || status === "pending";
  const showSkip =
    !instance.is_required &&
    status !== "completed" &&
    status !== "skipped";
  const showReopen = status === "completed" || status === "skipped";

  const close = () => setPendingAction(null);

  const runAction = async (
    action: ActionKey,
    fn: () => Promise<unknown>,
    successMessage: string
  ) => {
    try {
      await fn();
      toast.success(successMessage);
    } catch (err: unknown) {
      const e = err as { data?: { detail?: string }; message?: string };
      toast.error("Action impossible", {
        description: e?.data?.detail || e?.message || "Veuillez réessayer.",
      });
      // Ré-throw pour que ConfirmActionDialog garde le modal ouvert
      throw err;
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {showStart && (
          <Button
            size={size}
            variant="default"
            disabled={disabled}
            onClick={() => setPendingAction("start")}
            aria-label="Démarrer le module"
          >
            <FaPlay className="h-3 w-3" />
            {!compact && <span className="ml-2">Démarrer</span>}
          </Button>
        )}

        {showComplete && (
          <Button
            size={size}
            variant="default"
            disabled={disabled}
            onClick={() => setPendingAction("complete")}
            aria-label="Terminer le module"
          >
            <FaCheck className="h-3 w-3" />
            {!compact && <span className="ml-2">Terminer</span>}
          </Button>
        )}

        {showBlock && (
          <Button
            size={size}
            variant="outline"
            disabled={disabled}
            onClick={() => setPendingAction("block")}
            aria-label="Bloquer le module"
          >
            <FaStop className="h-3 w-3" />
            {!compact && <span className="ml-2">Bloquer</span>}
          </Button>
        )}

        {showSkip && (
          <Button
            size={size}
            variant="outline"
            disabled={disabled}
            onClick={() => setPendingAction("skip")}
            aria-label="Ignorer le module"
          >
            <FaForward className="h-3 w-3" />
            {!compact && <span className="ml-2">Ignorer</span>}
          </Button>
        )}

        {showReopen && (
          <Button
            size={size}
            variant="ghost"
            disabled={disabled}
            onClick={() => setPendingAction("reopen")}
            aria-label="Réouvrir le module"
          >
            <FaUndo className="h-3 w-3" />
            {!compact && <span className="ml-2">Réouvrir</span>}
          </Button>
        )}
      </div>

      {/* ── Confirmation : démarrer ──────────────────────────────────────── */}
      <ConfirmActionDialog
        open={pendingAction === "start"}
        onOpenChange={(o) => !o && close()}
        title={`Démarrer « ${instance.name} » ?`}
        description="Le module passera en cours et sera horodaté à votre nom."
        icon={<FaPlay className="h-4 w-4 text-primary" />}
        confirmLabel="Démarrer"
        onConfirm={() =>
          runAction(
            "start",
            () => start.mutateAsync(instance.id),
            "Module démarré."
          )
        }
      />

      {/* ── Confirmation : terminer ──────────────────────────────────────── */}
      <ConfirmActionDialog
        open={pendingAction === "complete"}
        onOpenChange={(o) => !o && close()}
        title={`Terminer « ${instance.name} » ?`}
        description="Cette étape sera marquée comme terminée. Vous pourrez toujours la réouvrir si besoin."
        icon={<FaCheck className="h-4 w-4 text-green-600" />}
        confirmLabel="Confirmer la fin"
        tone="success"
        onConfirm={() =>
          runAction(
            "complete",
            () => complete.mutateAsync(instance.id),
            "Module terminé."
          )
        }
      />

      {/* ── Confirmation : bloquer (avec motif obligatoire) ──────────────── */}
      <ConfirmActionDialog
        open={pendingAction === "block"}
        onOpenChange={(o) => !o && close()}
        title={`Bloquer « ${instance.name} » ?`}
        description="Indiquez la raison pour laquelle ce module est suspendu."
        icon={<FaStop className="h-4 w-4 text-red-600" />}
        confirmLabel="Confirmer le blocage"
        tone="danger"
        reasonField={{
          label: "Motif du blocage",
          placeholder: "Documents manquants, incident, attente client…",
          required: true,
          rows: 4,
        }}
        onConfirm={(reason) =>
          runAction(
            "block",
            () => block.mutateAsync({ id: instance.id, reason }),
            "Module bloqué."
          )
        }
      />

      {/* ── Confirmation : ignorer ───────────────────────────────────────── */}
      <ConfirmActionDialog
        open={pendingAction === "skip"}
        onOpenChange={(o) => !o && close()}
        title={`Ignorer « ${instance.name} » ?`}
        description="Cette étape optionnelle sera marquée comme ignorée et exclue du calcul du total."
        icon={<FaForward className="h-4 w-4 text-muted-foreground" />}
        confirmLabel="Ignorer cette étape"
        onConfirm={() =>
          runAction(
            "skip",
            () => skip.mutateAsync(instance.id),
            "Module ignoré."
          )
        }
      />

      {/* ── Confirmation : réouvrir ──────────────────────────────────────── */}
      <ConfirmActionDialog
        open={pendingAction === "reopen"}
        onOpenChange={(o) => !o && close()}
        title={`Réouvrir « ${instance.name} » ?`}
        description="Le module repassera en attente. L'audit des transitions précédentes (qui a démarré, terminé) sera réinitialisé."
        icon={<FaUndo className="h-4 w-4 text-muted-foreground" />}
        confirmLabel="Réouvrir"
        onConfirm={() =>
          runAction(
            "reopen",
            () => reopen.mutateAsync(instance.id),
            "Module réouvert."
          )
        }
      />
    </>
  );
}
