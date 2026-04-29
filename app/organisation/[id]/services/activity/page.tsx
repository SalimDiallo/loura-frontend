"use client";

import {
  ListPageLayout,
  ListPagination,
  ListSearchFilters,
  ListStat,
} from "@/components/layout/ListPageLayout";
import { PermissionGuard } from "@/components/permissions";
import { Card, CardContent } from "@/components/ui/card";
import {
  QuickSelect,
  type QuickSelectItem,
} from "@/components/ui/quick-select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginatedServiceActivityLogs } from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import type { ServiceActivityTargetType } from "@/lib/types";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FaHistory } from "react-icons/fa";

const TARGET_OPTIONS: {
  value: ServiceActivityTargetType | "";
  label: string;
}[] = [
  { value: "", label: "Tous" },
  { value: "service", label: "Service" },
  { value: "service_module", label: "Module" },
  { value: "enrollment", label: "Inscription" },
  { value: "module_instance", label: "Étape client" },
  { value: "transaction", label: "Transaction" },
];

const TARGET_ITEMS: QuickSelectItem[] = TARGET_OPTIONS.filter(
  (o) => o.value !== ""
).map((o) => ({ id: o.value, name: o.label }));

export default function ActivityLogPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.SERVICE_ENROLLMENTS.VIEW}>
      <ActivityLogPage />
    </PermissionGuard>
  );
}

function ActivityLogPage() {
  const params = useParams();
  const orgId = params.id as string;

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [target, setTarget] = useState<string>("");

  const filters = useMemo(
    () => ({
      search: search || undefined,
      target_type: (target as ServiceActivityTargetType) || undefined,
    }),
    [search, target]
  );

  const { data, meta, setPage, nextPage, prevPage, isLoading } =
    usePaginatedServiceActivityLogs(orgId, filters, { pageSize: 20 });

  return (
    <ListPageLayout
      title="Journal d'activité"
      icon={FaHistory}
      description="Toutes les actions effectuées sur le périmètre Services."
      stats={[
        <ListStat
          key="total"
          label="Événements"
          value={meta.totalItems}
          icon={<FaHistory className="h-4 w-4 text-muted-foreground" />}
        />,
      ]}
      searchFilters={
        <ListSearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Action, description..."
          filtersOpen={filterOpen}
          onFiltersOpenChange={setFilterOpen}
          filtersAreActive={!!target}
          filters={
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Cible
                </label>
                <QuickSelect
                  label="Cible"
                  items={TARGET_ITEMS}
                  selectedId={target}
                  onSelect={setTarget}
                  placeholder="Toutes les cibles"
                  canCreate={false}
                />
              </div>
            </div>
          }
        />
      }
      content={
        isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FaHistory className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="font-medium">Aucun évènement</p>
              <p className="text-sm text-muted-foreground mt-1">
                Les actions s&apos;afficheront ici au fil de l&apos;eau.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <ol className="relative ml-3 border-l border-border space-y-4">
              {data.map((log) => (
                <li key={log.id} className="ml-4">
                  <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                  <div className="rounded-lg border p-3 bg-card">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <code className="text-xs font-mono text-primary">
                        {log.target_type_display}
                      </code>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <p className="text-sm">
                      {log.description ||
                        `${log.target_type_display} #${log.target_id?.slice(0, 8) ?? ""}`}
                    </p>
                    <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      {log.created_by_info && (
                        <span>par {log.created_by_info.name}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
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
