"use client";

import {
    ListPageLayout,
    ListSearchFilters,
    ListStat,
} from "@/components/layout/ListPageLayout";
import { PermissionGuard, useOrgPermissions } from "@/components/permissions";
import {
    ModuleStatusBadge,
} from "@/components/services/services/ServiceStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import { usePaginatedEnrollments } from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import type {
    ServiceEnrollment,
    ServiceModuleInstance,
    ServiceModuleInstanceStatus,
} from "@/lib/types";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FaProjectDiagram, FaUserPlus } from "react-icons/fa";

const COLUMNS: {
  status: ServiceModuleInstanceStatus;
  label: string;
  className: string;
}[] = [
  {
    status: "pending",
    label: "En attente",
    className: "border-slate-200 bg-slate-50/40 dark:bg-slate-800/20",
  },
  {
    status: "in_progress",
    label: "En cours",
    className: "border-amber-200 bg-amber-50/40 dark:bg-amber-900/10",
  },
  {
    status: "blocked",
    label: "Bloqué",
    className: "border-red-200 bg-red-50/40 dark:bg-red-900/10",
  },
  {
    status: "completed",
    label: "Terminé",
    className: "border-green-200 bg-green-50/40 dark:bg-green-900/10",
  },
];

export default function WorkflowPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.SERVICE_ENROLLMENTS.VIEW}>
      <WorkflowPage />
    </PermissionGuard>
  );
}

function WorkflowPage() {
  const params = useParams();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.SERVICE_ENROLLMENTS.MANAGE);
  const { formatCurrency } = useCurrencyFormatter();

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: undefined,
    }),
    [search]
  );

  const enrollments = usePaginatedEnrollments(
    orgId,
    { ...filters, status: undefined as never },
    { pageSize: 50 }
  );

  // Aplatir tous les modules de toutes les enrollments visibles
  const grouped = useMemo(() => {
    const out: Record<
      ServiceModuleInstanceStatus,
      Array<{
        enrollment: ServiceEnrollment;
        instance: ServiceModuleInstance;
      }>
    > = {
      pending: [],
      in_progress: [],
      completed: [],
      blocked: [],
      skipped: [],
    };
    for (const e of enrollments.data) {
      // module_instances n'est pas inclus dans la liste : on s'en remet aux
      // counts du summary pour afficher des cartes de synthèse à la place.
      const total = e.modules_summary.total;
      if (total === 0) continue;
      // Carte synthétique par statut
      (
        [
          ["pending", e.modules_summary.pending],
          ["in_progress", e.modules_summary.in_progress],
          ["blocked", e.modules_summary.blocked],
          ["completed", e.modules_summary.completed],
        ] as const
      ).forEach(([s, count]) => {
        if (count > 0) {
          // pseudo-instance pour affichage seulement
          out[s].push({
            enrollment: e,
            instance: {
              id: `${e.id}__${s}`,
              enrollment: e.id,
              module: "",
              name: `${count} étape(s)`,
              description: "",
              order: 0,
              price: null,
              estimated_duration_days: null,
              is_required: true,
              status: s,
              status_display: "",
              started_at: null,
              completed_at: null,
              suspended_at: null,
              reopened_at: null,
              blocked_reason: "",
              started_by_info: null,
              completed_by_info: null,
              blocked_by_info: null,
              reopened_by_info: null,
              assignee: null,
              assignee_info: null,
              notes: "",
              amount_paid: "0",
              balance_due: "0",
              notes_count: 0,
              attachments_count: 0,
              created_at: e.created_at,
              updated_at: e.updated_at,
              created_by_info: null,
              updated_by_info: null,
            },
          });
        }
      });
    }
    return out;
  }, [enrollments.data]);

  return (
    <ListPageLayout
      title="Workflow"
      icon={FaProjectDiagram}
      description="Vue Kanban des étapes en cours par dossier client."
      stats={[
        <ListStat
          key="total"
          label="Inscriptions visibles"
          value={enrollments.meta.totalItems}
          icon={<FaUserPlus className="h-4 w-4 text-muted-foreground" />}
        />,
      ]}
      searchFilters={
        <ListSearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Client, service, référence..."
          filtersOpen={filterOpen}
          onFiltersOpenChange={setFilterOpen}
          filtersAreActive={false}
          filters={null}
        />
      }
      content={
        enrollments.isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {COLUMNS.map((c) => (
              <Skeleton key={c.status} className="h-[400px] rounded-lg" />
            ))}
          </div>
        ) : enrollments.data.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FaProjectDiagram className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="font-medium">Aucune inscription en cours</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {COLUMNS.map((col) => (
              <div
                key={col.status}
                className={`rounded-lg border p-3 ${col.className}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <ModuleStatusBadge status={col.status} />
                  <span className="text-xs text-muted-foreground">
                    {grouped[col.status].length} dossier(s)
                  </span>
                </div>
                <div className="space-y-2">
                  {grouped[col.status].length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      Aucun dossier
                    </p>
                  ) : (
                    grouped[col.status].map(({ enrollment, instance }) => (
                      <Link
                        key={instance.id}
                        href={`/organisation/${orgId}/services/enrollments/${enrollment.id}`}
                        className="block rounded-md bg-card border p-2 hover:border-primary/40 transition"
                      >
                        <div className="text-sm font-medium truncate">
                          {enrollment.customer_info.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {enrollment.service_info.name}
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-xs">
                          <span className="font-mono text-muted-foreground">
                            {enrollment.reference}
                          </span>
                          <span className="font-semibold">
                            {instance.name}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {formatCurrency(Number(enrollment.balance_due))} à payer
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
    />
  );
}
