"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
import {
  ListPageLayout,
  ListPagination,
  ListSearchFilters,
  ListStat,
} from "@/components/layout/ListPageLayout";
import {
  Can,
  PermissionGuard,
  useOrgPermissions,
} from "@/components/permissions";
import { PaymentModeBadge } from "@/components/services/services/ServiceStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  QuickSelect,
  type QuickSelectItem,
} from "@/components/ui/quick-select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
  usePaginatedServiceCategories,
  usePaginatedServices,
} from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import type { Service, ServicePaymentMode } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FaArrowRight,
  FaClock,
  FaConciergeBell,
  FaListOl,
  FaPlus,
  FaTags,
  FaToggleOn,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";

const CATALOG_PAYMENT_MODE_ITEMS: QuickSelectItem[] = [
  { id: "global", name: "Paiement global" },
  { id: "per_step", name: "Paiement par étape" },
  { id: "partial", name: "Paiement partiel libre" },
];

export default function ServicesCatalogPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.SERVICES.VIEW}>
      <ServicesCatalogPage />
    </PermissionGuard>
  );
}

function ServicesCatalogPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.SERVICES.MANAGE);
  const { formatCurrency } = useCurrencyFormatter();

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [activeOnly, setActiveOnly] = useState(true);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      is_active: activeOnly ? "true" : undefined,
      payment_mode: (paymentMode as ServicePaymentMode) || undefined,
      category: categoryId || undefined,
    }),
    [search, activeOnly, paymentMode, categoryId]
  );

  const {
    data: services,
    meta,
    setPage,
    nextPage,
    prevPage,
    isLoading,
    error,
  } = usePaginatedServices(orgId, filters, { pageSize: 12 });

  const categoriesQuery = usePaginatedServiceCategories(
    orgId,
    { is_active: "true" },
    { pageSize: 100 }
  );
  const filtersActive = !!paymentMode || !!categoryId || !activeOnly;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Erreur : {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ListPageLayout
      title="Catalogue de services"
      icon={FaConciergeBell}
      description="Définissez les services proposés et leur composition en étapes."
      headerActions={
        canManage
          ? [
              {
                label: "Nouveau service",
                icon: FaPlus,
                onClick: () =>
                  router.push(`/organisation/${orgId}/services/catalog/create`),
              },
            ]
          : []
      }
      stats={[
        <ListStat
          key="total"
          label="Total services"
          value={meta.totalItems}
          icon={<FaConciergeBell className="h-4 w-4 text-muted-foreground" />}
        />,
        <ListStat
          key="categories"
          label="Catégories"
          value={categoriesQuery.meta.totalItems}
          icon={<FaTags className="h-4 w-4 text-muted-foreground" />}
        />,
        <ListStat
          key="active"
          label="Actifs (page)"
          value={services.filter((s) => s.is_active).length}
          icon={<FaToggleOn className="h-4 w-4 text-green-600" />}
        />,
      ]}
      searchFilters={
        <ListSearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Nom, code, description..."
          filtersOpen={filterOpen}
          onFiltersOpenChange={setFilterOpen}
          filtersAreActive={filtersActive}
          filters={
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium block mb-2">
                  Mode de paiement
                </label>
                <QuickSelect
                  label="Mode de paiement"
                  items={CATALOG_PAYMENT_MODE_ITEMS}
                  selectedId={paymentMode}
                  onSelect={setPaymentMode}
                  placeholder="Tous les modes"
                  canCreate={false}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2">
                  Catégorie
                </label>
                <QuickSelect
                  label="Catégorie"
                  items={categoriesQuery.data.map<QuickSelectItem>((c) => ({
                    id: c.id,
                    name: c.name,
                  }))}
                  selectedId={categoryId}
                  onSelect={setCategoryId}
                  placeholder="Toutes les catégories"
                  canCreate={false}
                />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="h-4 w-4"
                />
                Uniquement les services actifs
              </label>
            </div>
          }
        />
      }
      content={
        <>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-lg">
              <FaConciergeBell className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun service</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                Créez votre premier service pour commencer à inscrire vos clients.
              </p>
              <Can permission={PERMISSIONS.SERVICES.MANAGE}>
                <Button
                  onClick={() =>
                    router.push(`/organisation/${orgId}/services/catalog/create`)
                  }
                >
                  <FaPlus className="mr-2" />
                  Créer un service
                </Button>
              </Can>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {services.map((s) => (
                  <ServiceCatalogCard
                    key={s.id}
                    service={s}
                    canManageEnrollments={can(
                      PERMISSIONS.SERVICE_ENROLLMENTS.MANAGE
                    )}
                    formatCurrency={formatCurrency}
                    onOpen={() =>
                      router.push(
                        `/organisation/${orgId}/services/catalog/${s.id}`
                      )
                    }
                    onEnroll={() =>
                      router.push(
                        `/organisation/${orgId}/services/enrollments/create?service=${s.id}`
                      )
                    }
                  />
                ))}
              </div>
              <div className="mt-4">
                <ListPagination
                  meta={meta}
                  onPageChange={setPage}
                  onNext={nextPage}
                  onPrev={prevPage}
                />
              </div>
            </>
          )}
        </>
      }
    />
  );
}

// ─── Carte catalogue ─────────────────────────────────────────────────────────

function ServiceCatalogCard({
  service,
  canManageEnrollments,
  formatCurrency,
  onOpen,
  onEnroll,
}: {
  service: Service;
  canManageEnrollments: boolean;
  formatCurrency: (n: number) => string;
  onOpen: () => void;
  onEnroll: () => void;
}) {
  const price =
    service.computed_price !== null
      ? formatCurrency(Number(service.computed_price))
      : null;

  return (
    <Card
      className={[
        "group flex flex-col gap-0 py-0 transition-all",
        "hover:border-primary/50 hover:shadow-sm",
        !service.is_active ? "opacity-70" : "",
      ].join(" ")}
    >
      <CardHeader className="px-4 pt-4 pb-2 gap-1">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 shrink-0 rounded-md bg-primary/10 text-primary flex items-center justify-center">
            <FaConciergeBell className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle
              className="text-sm font-semibold leading-tight truncate"
              title={service.name}
            >
              {service.name}
            </CardTitle>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
              {service.code && (
                <span className="font-mono">{service.code}</span>
              )}
              {service.code && service.category_name && <span>·</span>}
              {service.category_name && (
                <span className="inline-flex items-center gap-1 truncate">
                  <FaTags className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{service.category_name}</span>
                </span>
              )}
            </div>
          </div>
          {!service.is_active && <BadgeStatus status={false} />}
        </div>
        {service.description && (
          <CardDescription className="line-clamp-2 text-xs mt-1">
            {service.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="px-4 py-2 space-y-2 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <PaymentModeBadge mode={service.payment_mode} />
          {service.duration_days != null && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <FaClock className="h-2.5 w-2.5" />
              {service.duration_days} j
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <FaListOl className="h-2.5 w-2.5" />
            {service.modules_count} étape
            {service.modules_count > 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <FaUsers className="h-2.5 w-2.5" />
            {service.enrollments_count}
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            À partir de
          </span>
          <span className="text-base font-semibold">
            {price ?? (
              <span className="text-muted-foreground italic font-normal">
                Sur devis
              </span>
            )}
          </span>
        </div>
      </CardContent>

      <CardFooter className="px-4 py-2 gap-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpen}
          className="flex-1 h-8"
          aria-label={`Ouvrir ${service.name}`}
        >
          Voir
          <FaArrowRight className="h-3 w-3 ml-1.5" />
        </Button>
        {canManageEnrollments && service.is_active && (
          <Button
            size="sm"
            onClick={onEnroll}
            className="flex-1 h-8"
            aria-label={`Inscrire un client à ${service.name}`}
          >
            <FaUserPlus className="h-3 w-3 mr-1.5" />
            Inscrire
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
