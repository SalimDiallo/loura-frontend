"use client";

import {
  EnrollmentStatusBadge,
  TransactionStatusBadge,
  TransactionTypeBadge,
} from "@/components/services/services/ServiceStatusBadge";
import { PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrencyFormatter } from "@/lib/hooks";
import {
  usePaginatedEnrollments,
  usePaginatedServiceTransactions,
  usePaginatedServices,
} from "@/lib/hooks/services";
import { PERMISSIONS } from "@/lib/permissions";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FaArrowRight,
  FaConciergeBell,
  FaMoneyBillWave,
  FaPlus,
  FaUserPlus,
} from "react-icons/fa";

export default function ServicesOverviewPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.SERVICES.VIEW}>
      <ServicesOverviewPage />
    </PermissionGuard>
  );
}

function ServicesOverviewPage() {
  const params = useParams();
  const orgId = params.id as string;
  const { formatCurrency } = useCurrencyFormatter();
  const { can } = useOrgPermissions();
  const canManageServices = can(PERMISSIONS.SERVICES.MANAGE);
  const canManageEnrollments = can(PERMISSIONS.SERVICE_ENROLLMENTS.MANAGE);

  const services = usePaginatedServices(orgId, { is_active: "true" }, { pageSize: 1 });
  const enrollments = usePaginatedEnrollments(orgId, undefined, { pageSize: 5 });
  const inProgress = usePaginatedEnrollments(
    orgId,
    { status: "in_progress" },
    { pageSize: 1 }
  );
  const transactions = usePaginatedServiceTransactions(
    orgId,
    undefined,
    { pageSize: 5 }
  );
  const pendingTx = usePaginatedServiceTransactions(
    orgId,
    { status: "pending" },
    { pageSize: 1 }
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <FaConciergeBell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Services</h1>
              <p className="text-sm text-muted-foreground">
                Pilotez votre catalogue, vos inscriptions clients et leurs flux financiers.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canManageServices && (
            <Button asChild variant="outline">
              <Link href={`/organisation/${orgId}/services/catalog/create`}>
                <FaPlus className="mr-2 h-3.5 w-3.5" />
                Nouveau service
              </Link>
            </Button>
          )}
          {canManageEnrollments && (
            <Button asChild>
              <Link href={`/organisation/${orgId}/services/enrollments/create`}>
                <FaUserPlus className="mr-2 h-3.5 w-3.5" />
                Inscrire un client
              </Link>
            </Button>
          )}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Services actifs"
          value={services.meta.totalItems}
          icon={<FaConciergeBell className="h-4 w-4 text-muted-foreground" />}
          loading={services.isLoading}
          href={`/organisation/${orgId}/services/catalog`}
        />
        <StatCard
          label="Inscriptions"
          value={enrollments.meta.totalItems}
          icon={<FaUserPlus className="h-4 w-4 text-muted-foreground" />}
          loading={enrollments.isLoading}
          href={`/organisation/${orgId}/services/enrollments`}
        />
        <StatCard
          label="Dossiers en cours"
          value={inProgress.meta.totalItems}
          icon={<FaArrowRight className="h-4 w-4 text-amber-600" />}
          loading={inProgress.isLoading}
          href={`/organisation/${orgId}/services/enrollments?status=in_progress`}
        />
        <StatCard
          label="Transactions en attente"
          value={pendingTx.meta.totalItems}
          icon={<FaMoneyBillWave className="h-4 w-4 text-blue-600" />}
          loading={pendingTx.isLoading}
          href={`/organisation/${orgId}/services/transactions?status=pending`}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Inscriptions récentes</CardTitle>
              <CardDescription>5 derniers dossiers clients ouverts</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/organisation/${orgId}/services/enrollments`}>
                Voir tout <FaArrowRight className="ml-1.5 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {enrollments.isLoading ? (
              <SkeletonList />
            ) : enrollments.data.length === 0 ? (
              <EmptyMini
                label="Aucune inscription"
                hint="Inscrivez un client à un service pour démarrer le suivi."
              />
            ) : (
              enrollments.data.map((e) => (
                <Link
                  key={e.id}
                  href={`/organisation/${orgId}/services/enrollments/${e.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/40 transition"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {e.customer_info.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {e.service_info.name} · {e.reference}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {e.modules_summary.progress_pct.toFixed(0)}%
                    </span>
                    <EnrollmentStatusBadge status={e.status} />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>Transactions récentes</CardTitle>
              <CardDescription>Mouvements financiers récents</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/organisation/${orgId}/services/transactions`}>
                Voir tout <FaArrowRight className="ml-1.5 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {transactions.isLoading ? (
              <SkeletonList />
            ) : transactions.data.length === 0 ? (
              <EmptyMini
                label="Aucune transaction"
                hint="Les paiements et dépenses liés aux services apparaîtront ici."
              />
            ) : (
              transactions.data.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">
                      {t.enrollment_reference || t.module_name || "Mouvement libre"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {new Date(t.transaction_date).toLocaleDateString("fr-FR")}
                      {" · "}
                      {t.payment_method_display}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm font-semibold ${
                        t.direction === "in" ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {t.direction === "in" ? "+" : "−"}
                      {formatCurrency(Number(t.amount))}
                    </span>
                    <TransactionTypeBadge type={t.transaction_type} />
                    <TransactionStatusBadge status={t.status} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  loading,
  href,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  loading?: boolean;
  href?: string;
}) {
  const inner = (
    <Card className="hover:border-primary/40 transition">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? <Skeleton className="h-7 w-16" /> : value}
        </div>
      </CardContent>
    </Card>
  );
  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

function EmptyMini({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="text-center py-6 bg-muted/20 rounded-lg">
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
