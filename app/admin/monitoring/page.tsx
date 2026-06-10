"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    useOrgsStats,
    useSubscriptionsStats,
    useVisitsSummary,
} from "@/lib/hooks/monitoring"
import Link from "next/link"
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"

import { ScheduledTasksCard } from "./_components/scheduled-tasks-card"
import { SystemHealthCard } from "./_components/system-health-card"

function StatCard({
  title,
  value,
  hint,
  href,
  loading,
}: {
  title: string
  value: string | number
  hint?: string
  href?: string
  loading?: boolean
}) {
  const inner = (
    <Card className="transition-colors hover:border-primary/50">
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-mono text-3xl tabular-nums">
          {loading ? "…" : value}
        </CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

export default function MonitoringHomePage() {
  const visits = useVisitsSummary()
  const orgs = useOrgsStats()
  const subs = useSubscriptionsStats()

  const series = visits.data?.series ?? []

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Vue d&apos;ensemble — visites, organisations et abonnements.
          Auto-refresh toutes les 30 secondes.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Visites 24h"
          value={visits.data?.totals["24h"] ?? "—"}
          hint={`${visits.data?.unique_visitors_24h ?? 0} IPs uniques`}
          href="/admin/monitoring/visits"
          loading={visits.isLoading}
        />
        <StatCard
          title="Visites 30j"
          value={visits.data?.totals["30d"] ?? "—"}
          hint={`Total: ${visits.data?.totals.all ?? 0}`}
          href="/admin/monitoring/visits"
          loading={visits.isLoading}
        />
        <StatCard
          title="Organisations actives"
          value={orgs.data?.active ?? "—"}
          hint={`${orgs.data?.new_30d ?? 0} créées sur 30j`}
          href="/admin/monitoring/organizations"
          loading={orgs.isLoading}
        />
        <StatCard
          title="Abonnements actifs"
          value={subs.data?.totals.active ?? "—"}
          hint={`MRR ≈ ${subs.data?.mrr_gnf ?? "0"} GNF`}
          href="/admin/monitoring/subscriptions"
          loading={subs.isLoading}
        />
        <StatCard
          title="p95 latence 24h"
          value={
            visits.data?.performance?.p95_duration_ms_24h !== null &&
            visits.data?.performance?.p95_duration_ms_24h !== undefined
              ? `${visits.data.performance.p95_duration_ms_24h} ms`
              : "—"
          }
          hint={`${visits.data?.performance?.slow_requests_24h ?? 0} requêtes lentes (≥ ${
            visits.data?.performance?.slow_threshold_ms ?? 2000
          } ms)`}
          loading={visits.isLoading}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SystemHealthCard />
        <ScheduledTasksCard />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Visites — 30 derniers jours</CardTitle>
          <CardDescription>
            Une ligne par jour, toutes sources confondues.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px]">
          {visits.isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Chargement…
            </div>
          ) : series.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Aucune visite enregistrée pour l&apos;instant.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={series}
                margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="day"
                  tickFormatter={(d: string) => d.slice(5)}
                  className="text-xs"
                />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Link href="/admin/users" className="contents">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader className="py-4">
              <CardTitle className="text-sm">
                Gérer les abonnements →
              </CardTitle>
              <CardDescription className="text-xs">
                Mois gratuits, changement de plan, annulations.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/monitoring/visits" className="contents">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader className="py-4">
              <CardTitle className="text-sm">Visites détaillées →</CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/monitoring/visitors" className="contents">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader className="py-4">
              <CardTitle className="text-sm">Visiteurs uniques →</CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/monitoring/logs" className="contents">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader className="py-4">
              <CardTitle className="text-sm">Logs backend →</CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/monitoring/logs-frontend" className="contents">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader className="py-4">
              <CardTitle className="text-sm">Logs frontend →</CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/monitoring/errors" className="contents">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader className="py-4">
              <CardTitle className="text-sm">
                Erreurs (back + front) →
              </CardTitle>
            </CardHeader>
          </Card>
        </Link>
        <Link href="/admin/feedback" className="contents">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader className="py-4">
              <CardTitle className="text-sm">Feedback utilisateur →</CardTitle>
            </CardHeader>
          </Card>
        </Link>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top paths (30j)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(visits.data?.top_paths ?? []).slice(0, 8).map((row) => (
                <li key={row.path} className="flex justify-between gap-4">
                  <span className="truncate font-mono text-muted-foreground">
                    {row.path}
                  </span>
                  <span className="font-medium tabular-nums">{row.count}</span>
                </li>
              ))}
              {visits.data?.top_paths.length === 0 ? (
                <li className="text-muted-foreground">Aucune donnée.</li>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status codes (30j)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {visits.data
                ? (
                    Object.entries(visits.data.status_buckets) as Array<
                      [string, number]
                    >
                  ).map(([k, v]) => (
                    <li key={k} className="flex justify-between gap-4">
                      <span className="font-mono text-muted-foreground uppercase">
                        {k}
                      </span>
                      <span className="font-medium tabular-nums">{v}</span>
                    </li>
                  ))
                : null}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
