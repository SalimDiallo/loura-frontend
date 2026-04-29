"use client";

import {
    ListPageLayout,
    ListPagination,
    ListSearchFilters,
    ListStat,
    ListTable,
    ListTableColumn,
} from "@/components/layout/ListPageLayout";
import { Can, PermissionGuard, useOrgPermissions } from "@/components/permissions";
import {
    EnrollmentStatusBadge,
    ProgressBar,
} from "@/components/services/services/ServiceStatusBadge";
import { Button } from "@/components/ui/button";
import {
    QuickSelect,
    type QuickSelectItem,
} from "@/components/ui/quick-select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import { usePaginatedEnrollments } from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import type { ServiceEnrollmentStatus } from "@/lib/types";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
    FaArrowRight,
    FaPlus,
    FaUserPlus,
} from "react-icons/fa";

const STATUS_OPTIONS: { value: ServiceEnrollmentStatus | ""; label: string }[] = [
  { value: "", label: "Tous" },
  { value: "pending", label: "En attente" },
  { value: "in_progress", label: "En cours" },
  { value: "completed", label: "Terminée" },
  { value: "suspended", label: "Suspendue" },
  { value: "cancelled", label: "Annulée" },
];

const STATUS_ITEMS: QuickSelectItem[] = STATUS_OPTIONS.filter(
  (o) => o.value !== ""
).map((o) => ({ id: o.value, name: o.label }));

export default function EnrollmentsListPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.SERVICE_ENROLLMENTS.VIEW}>
      <EnrollmentsListPage />
    </PermissionGuard>
  );
}

function EnrollmentsListPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.SERVICE_ENROLLMENTS.MANAGE);
  const { formatCurrency } = useCurrencyFormatter();

  const initialStatus =
    (searchParams.get("status") as ServiceEnrollmentStatus | null) || "";

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  // Le statut s'initialise depuis l'URL, mais on ne resynchronise pas ensuite
  // pour ne pas écraser le choix utilisateur.
  const [status, setStatus] = useState<string>(initialStatus);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      status: (status as ServiceEnrollmentStatus) || undefined,
    }),
    [search, status]
  );

  const {
    data,
    meta,
    setPage,
    nextPage,
    prevPage,
    isLoading,
  } = usePaginatedEnrollments(orgId, filters, { pageSize: 12 });

  return (
    <ListPageLayout
      title="Inscriptions clients"
      icon={FaUserPlus}
      description="Suivez l'avancement de chaque client à travers les étapes des services."
      headerActions={
        canManage
          ? [
              {
                label: "Inscrire un client",
                icon: FaPlus,
                onClick: () =>
                  router.push(
                    `/organisation/${orgId}/services/enrollments/create`
                  ),
              },
            ]
          : []
      }
      stats={[
        <ListStat
          key="total"
          label="Total inscriptions"
          value={meta.totalItems}
          icon={<FaUserPlus className="h-4 w-4 text-muted-foreground" />}
        />,
      ]}
      searchFilters={
        <ListSearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Référence, client, service, notes..."
          filtersOpen={filterOpen}
          onFiltersOpenChange={setFilterOpen}
          filtersAreActive={!!status}
          filters={
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Statut
                </label>
                <QuickSelect
                  label="Statut"
                  items={STATUS_ITEMS}
                  selectedId={status}
                  onSelect={setStatus}
                  placeholder="Tous les statuts"
                  canCreate={false}
                />
              </div>
            </div>
          }
        />
      }
      content={
        isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 bg-muted/20 rounded-lg">
            <FaUserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium">Aucune inscription</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Ajoutez la première inscription pour démarrer le suivi.
            </p>
            <Can permission={PERMISSIONS.SERVICE_ENROLLMENTS.MANAGE}>
              <Button
                onClick={() =>
                  router.push(
                    `/organisation/${orgId}/services/enrollments/create`
                  )
                }
              >
                <FaPlus className="mr-2 h-3.5 w-3.5" />
                Nouvelle inscription
              </Button>
            </Can>
          </div>
        ) : (
          <>
            <ListTable
              columns={[
                <ListTableColumn key="ref" header="Référence">
                  {({ value: e }) => (
                    <div>
                      <div className="text-sm font-medium font-mono">
                        {e.reference}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  )}
                </ListTableColumn>,
                <ListTableColumn key="customer" header="Client">
                  {({ value: e }) => (
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {e.customer_info.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {e.customer_info.email || e.customer_info.phone || "—"}
                      </div>
                    </div>
                  )}
                </ListTableColumn>,
                <ListTableColumn key="service" header="Service">
                  {({ value: e }) => (
                    <span className="text-sm">{e.service_info.name}</span>
                  )}
                </ListTableColumn>,
                <ListTableColumn key="progress" header="Avancement">
                  {({ value: e }) => (
                    <div className="min-w-[140px]">
                      <ProgressBar
                        value={e.modules_summary.progress_pct}
                        label={`${e.modules_summary.completed}/${e.modules_summary.total}`}
                      />
                    </div>
                  )}
                </ListTableColumn>,
                <ListTableColumn key="finance" header="Finance">
                  {({ value: e }) => (
                    <div className="text-xs space-y-0.5 min-w-[110px]">
                      <div>
                        <span className="text-muted-foreground">Dû</span>{" "}
                        <span className="font-semibold">
                          {formatCurrency(Number(e.total_due))}
                        </span>
                      </div>
                      <div
                        className={
                          Number(e.balance_due) > 0
                            ? "text-amber-700"
                            : "text-green-700"
                        }
                      >
                        Reste {formatCurrency(Number(e.balance_due))}
                      </div>
                    </div>
                  )}
                </ListTableColumn>,
                <ListTableColumn key="status" header="Statut">
                  {({ value: e }) => (
                    <EnrollmentStatusBadge status={e.status} />
                  )}
                </ListTableColumn>,
                <ListTableColumn key="actions" header="" align="right">
                  {({ value: e }) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/organisation/${orgId}/services/enrollments/${e.id}`
                        )
                      }
                      aria-label={`Ouvrir ${e.reference}`}
                    >
                      <FaArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </ListTableColumn>,
              ]}
              data={data}
            />
            <div className="mt-4">
              <ListPagination
                meta={meta}
                onPageChange={setPage}
                onNext={nextPage}
                onPrev={prevPage}
              />
            </div>
          </>
        )
      }
    />
  );
}
