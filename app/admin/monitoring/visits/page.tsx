"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useVisitsList } from "@/lib/hooks/monitoring"
import type { VisitsListFilters } from "@/lib/services/monitoring/monitoring.service"
import Link from "next/link"
import { useState } from "react"

function statusVariant(
  code: number
): "default" | "secondary" | "destructive" | "outline" {
  if (code >= 500) return "destructive"
  if (code >= 400) return "destructive"
  if (code >= 300) return "secondary"
  return "default"
}

export default function MonitoringVisitsPage() {
  const [filters, setFilters] = useState<VisitsListFilters>({ page: 1 })
  const { data, isLoading } = useVisitsList(filters)

  const setFilter = <K extends keyof VisitsListFilters>(
    k: K,
    v: VisitsListFilters[K]
  ) => setFilters((f) => ({ ...f, [k]: v, page: 1 }))

  const totalPages = data ? Math.max(1, Math.ceil(data.count / 5)) : 1

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visites</h1>
          <p className="text-sm text-muted-foreground">
            {data?.count ?? "—"} requêtes enregistrées au total.
          </p>
        </div>
        <Link
          href="/admin/monitoring"
          className="text-sm text-primary hover:underline"
        >
          ← Retour
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Input
            placeholder="Rechercher un path…"
            value={filters.q ?? ""}
            onChange={(e) => setFilter("q", e.target.value)}
          />
          <Select
            value={filters.source ?? "all"}
            onValueChange={(v) =>
              setFilter("source", v === "all" ? undefined : v)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes sources</SelectItem>
              <SelectItem value="landing">Landing</SelectItem>
              <SelectItem value="app">App</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="other">Autre</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.status_class ? String(filters.status_class) : "all"}
            onValueChange={(v) =>
              setFilter(
                "status_class",
                v === "all" ? undefined : (Number(v) as 2 | 3 | 4 | 5)
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="2">2xx</SelectItem>
              <SelectItem value="3">3xx</SelectItem>
              <SelectItem value="4">4xx</SelectItem>
              <SelectItem value="5">5xx</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setFilters({ page: 1 })}
            className="w-full sm:w-auto"
          >
            Réinitialiser
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Durée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Chargement…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data?.results.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Aucune visite ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              )}
              {data?.results.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(v.created_at).toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {v.method}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate font-mono text-xs">
                    {v.path}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(v.status_code)}>
                      {v.status_code}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground uppercase">
                    {v.source}
                  </TableCell>
                  <TableCell className="text-xs">
                    {v.user_email ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {v.duration_ms ? `${v.duration_ms} ms` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Page {filters.page ?? 1} / {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!data?.previous}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                page: Math.max(1, (f.page ?? 1) - 1),
              }))
            }
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data?.next}
            onClick={() =>
              setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))
            }
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  )
}
