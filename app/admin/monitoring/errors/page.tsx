"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useErrorDetail, useErrorsList } from "@/lib/hooks/monitoring"
import type { ErrorsFilters } from "@/lib/services/monitoring/monitoring.service"
import type { LogLevel } from "@/lib/types/monitoring"
import Link from "next/link"
import { useState } from "react"

function levelVariant(
  level: string
): "default" | "secondary" | "destructive" | "outline" {
  if (level === "CRITICAL" || level === "ERROR") return "destructive"
  if (level === "WARNING") return "secondary"
  return "outline"
}

export default function MonitoringErrorsPage() {
  const [filters, setFilters] = useState<ErrorsFilters>({ page: 1 })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const { data, isLoading } = useErrorsList(filters)
  const { data: detail, isLoading: detailLoading } = useErrorDetail(selectedId)

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Erreurs</h1>
          <p className="text-sm text-muted-foreground">
            Miroir local des erreurs back/front. Cliquer sur une ligne pour le
            traceback.
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
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-4">
          <Input
            placeholder="Rechercher dans le message…"
            value={filters.q ?? ""}
            onChange={(e) =>
              setFilters({ ...filters, q: e.target.value, page: 1 })
            }
          />
          <Select
            value={filters.source ?? "all"}
            onValueChange={(v) =>
              setFilters({
                ...filters,
                source: v === "all" ? undefined : (v as "back" | "front"),
                page: 1,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes sources</SelectItem>
              <SelectItem value="back">Backend</SelectItem>
              <SelectItem value="front">Frontend</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.level ?? "all"}
            onValueChange={(v) =>
              setFilters({
                ...filters,
                level: v === "all" ? undefined : (v as LogLevel),
                page: 1,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous niveaux</SelectItem>
              <SelectItem value="WARNING">WARNING</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
              <SelectItem value="CRITICAL">CRITICAL</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setFilters({ page: 1 })}>
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
                <TableHead>Niveau</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Sentry</TableHead>
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
                    Aucune erreur ne correspond aux filtres.
                  </TableCell>
                </TableRow>
              )}
              {data?.results.map((e) => (
                <TableRow
                  key={e.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setSelectedId(e.id)}
                >
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={levelVariant(e.level)}>{e.level}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground uppercase">
                    {e.source}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {e.exc_type || "—"}
                  </TableCell>
                  <TableCell className="max-w-[400px] truncate text-xs">
                    {e.message}
                  </TableCell>
                  <TableCell className="text-xs">
                    {e.user_email ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {e.sentry_event_id ? (
                      <span title={e.sentry_event_id}>
                        {e.sentry_event_id.slice(0, 8)}…
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {data ? `${data.count} erreurs au total` : "—"}
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

      <Dialog
        open={selectedId !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detail ? (
                <span className="flex items-center gap-2">
                  <Badge variant={levelVariant(detail.level)}>
                    {detail.level}
                  </Badge>
                  <span className="font-mono text-sm">
                    {detail.exc_type || detail.logger}
                  </span>
                </span>
              ) : (
                "Détail"
              )}
            </DialogTitle>
            <DialogDescription>
              {detail
                ? `${new Date(detail.created_at).toLocaleString("fr-FR")} · source ${detail.source}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {detailLoading && (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          )}
          {detail ? (
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                  Message
                </h3>
                <p className="break-all">{detail.message}</p>
              </div>
              {detail.url ? (
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    URL
                  </h3>
                  <p className="font-mono text-xs break-all">{detail.url}</p>
                </div>
              ) : null}
              {detail.user_email ? (
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    User
                  </h3>
                  <p className="font-mono text-xs">{detail.user_email}</p>
                </div>
              ) : null}
              {detail.sentry_event_id ? (
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    Sentry event ID
                  </h3>
                  <p className="font-mono text-xs">{detail.sentry_event_id}</p>
                </div>
              ) : null}
              {detail.traceback ? (
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    Traceback
                  </h3>
                  <pre className="max-h-[400px] overflow-auto rounded bg-muted/50 p-3 text-[11px] break-all whitespace-pre-wrap">
                    {detail.traceback}
                  </pre>
                </div>
              ) : null}
              {Object.keys(detail.extra ?? {}).length > 0 ? (
                <div>
                  <h3 className="mb-1 text-xs font-semibold text-muted-foreground uppercase">
                    Extra
                  </h3>
                  <pre className="rounded bg-muted/50 p-3 text-[11px] break-all whitespace-pre-wrap">
                    {JSON.stringify(detail.extra, null, 2)}
                  </pre>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
