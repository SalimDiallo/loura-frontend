"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useSubscriptionsStats } from "@/lib/hooks/monitoring"
import Link from "next/link"

function fmt(n: string | number): string {
  const v = typeof n === "string" ? Number(n) : n
  if (!isFinite(v)) return "—"
  return new Intl.NumberFormat("fr-FR").format(v)
}

export default function MonitoringSubscriptionsPage() {
  const { data, isLoading } = useSubscriptionsStats()

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Abonnements</h1>
          <p className="text-sm text-muted-foreground">
            État du parc d&apos;abonnements et revenus Djomy 30j.
          </p>
        </div>
        <Link
          href="/admin/monitoring"
          className="text-sm text-primary hover:underline"
        >
          ← Retour
        </Link>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Actifs</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {isLoading ? "…" : fmt(data?.totals.active ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>MRR (GNF)</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {isLoading ? "…" : fmt(data?.mrr_gnf ?? "0")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Annulés 30j</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {isLoading ? "…" : fmt(data?.totals.cancelled_30d ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expirés 30j</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {isLoading ? "…" : fmt(data?.totals.expired_30d ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par plan (actifs)</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(data?.by_plan ?? []).map((row) => (
                <li key={row.plan__code} className="flex justify-between">
                  <span>
                    <span className="font-medium">{row.plan__name}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {row.plan__code}
                    </span>
                  </span>
                  <span className="tabular-nums">{row.count}</span>
                </li>
              ))}
              {data?.by_plan.length === 0 ? (
                <li className="text-muted-foreground">
                  Aucun abonnement actif.
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transactions Djomy (30j)</CardTitle>
            <CardDescription>
              Revenus succès :{" "}
              <span className="font-mono">
                {fmt(data?.transactions_30d.revenue_success_gnf ?? "0")} GNF
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {(data?.transactions_30d.by_status ?? []).map((row) => (
                <li key={row.status} className="flex justify-between">
                  <span className="font-mono uppercase">{row.status}</span>
                  <span className="tabular-nums">{row.count}</span>
                </li>
              ))}
              {data?.transactions_30d.by_status.length === 0 ? (
                <li className="text-muted-foreground">
                  Aucune transaction sur 30j.
                </li>
              ) : null}
            </ul>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Plans publiés</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {(data?.plans ?? []).map((p) => (
              <li key={p.code} className="flex justify-between">
                <span>
                  <span className="font-medium">{p.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {p.code}
                  </span>
                </span>
                <span className="text-xs tabular-nums">
                  {fmt(p.price_monthly)} / {fmt(p.price_yearly)} {p.currency}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
