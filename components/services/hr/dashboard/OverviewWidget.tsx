"use client";

import { Can } from "@/components/permissions";
import { useHROverviewAnalytics } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import {
    Briefcase,
    CalendarClock,
    FileText,
    Users,
} from "lucide-react";
import { Metric, MetricSkeleton, WidgetError } from "./primitives";

interface Props {
  orgId: string;
}

/**
 * Rangée de KPIs principaux du module RH.
 * - Gate : `hr.view_employees` (permission de base requise pour voir l'org RH).
 * - Les sous-métriques sensibles (contrats, congés) sont à `null` côté API
 *   si l'utilisateur n'a pas la permission → on les masque proprement.
 */
export function OverviewWidget({ orgId }: Props) {
  return (
    <Can permission={PERMISSIONS.HR.VIEW_EMPLOYEES}>
      <OverviewInner orgId={orgId} />
    </Can>
  );
}

function OverviewInner({ orgId }: Props) {
  const { data, isLoading, isError, error } = useHROverviewAnalytics(orgId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border border-border/60 bg-card p-5">
        <WidgetError message={error?.message} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Metric
        label="Effectif actif"
        value={data.active_members.toLocaleString("fr-FR")}
        hint={
          data.total_members > data.active_members
            ? `sur ${data.total_members} membres`
            : "Membres actifs de l'organisation"
        }
        icon={Users}
      />
      <Metric
        label="Départements"
        value={data.departments.toLocaleString("fr-FR")}
        hint="Entités actives"
        icon={Briefcase}
      />
      {data.active_contracts !== null && (
        <Metric
          label="Contrats actifs"
          value={data.active_contracts.toLocaleString("fr-FR")}
          hint="Engagements en cours"
          icon={FileText}
        />
      )}
      {data.pending_leaves !== null && (
        <Metric
          label="Congés en attente"
          value={data.pending_leaves.toLocaleString("fr-FR")}
          tone={data.pending_leaves > 0 ? "warning" : "default"}
          hint="Demandes à traiter"
          icon={CalendarClock}
        />
      )}
    </div>
  );
}
