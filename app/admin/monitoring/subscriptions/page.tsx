"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAdminUsersBilling } from "@/lib/hooks/admin"
import { useSubscriptionsStats } from "@/lib/hooks/monitoring"
import Link from "next/link"

function fmt(n: string | number): string {
  const v = typeof n === "string" ? Number(n) : n
  if (!isFinite(v)) return "—"
  return new Intl.NumberFormat("fr-FR").format(v)
}

export default function MonitoringSubscriptionsPage() {
  const { data, isLoading } = useSubscriptionsStats()
  const recentSubs = useAdminUsersBilling({
    has_sub: "true",
    page: 1,
    page_size: 10,
  })

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Abonnements actifs (10 derniers)</CardTitle>
            <CardDescription>
              Clic sur une ligne pour gérer cet utilisateur.
            </CardDescription>
          </div>
          <Link
            href="/admin/users"
            className="text-sm text-primary hover:underline"
          >
            Tout voir →
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Fin de période</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSubs.isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Chargement…
                  </TableCell>
                </TableRow>
              ) : (recentSubs.data?.results ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Aucun abonnement actif.
                  </TableCell>
                </TableRow>
              ) : (
                (recentSubs.data?.results ?? []).map((u) => (
                  <TableRow key={u.id} className="hover:bg-muted/40">
                    <TableCell>
                      <Link
                        href={`/admin/users?focus=${u.id}`}
                        className="font-mono text-xs text-primary hover:underline"
                      >
                        {u.email}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.plan_code === "pro" ? "default" : "secondary"}>
                        {u.plan_code ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{u.sub_status ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.current_period_end
                        ? new Date(u.current_period_end).toLocaleDateString("fr-FR")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
