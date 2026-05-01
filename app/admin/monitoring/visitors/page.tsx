"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { useUniqueVisitors } from "@/lib/hooks/monitoring"
import type { UniqueVisitorsFilters } from "@/lib/services/monitoring/monitoring.service"
import type { VisitsWindow } from "@/lib/types/monitoring"
import Link from "next/link"
import { useState } from "react"

function formatRelative(iso: string): string {
  const ts = new Date(iso).getTime()
  const diff = Date.now() - ts
  const sec = Math.round(diff / 1000)
  if (sec < 60) return `il y a ${sec}s`
  const min = Math.round(sec / 60)
  if (min < 60) return `il y a ${min}min`
  const hr = Math.round(min / 60)
  if (hr < 24) return `il y a ${hr}h`
  const day = Math.round(hr / 24)
  return `il y a ${day}j`
}

function shortUserAgent(ua: string): string {
  if (!ua) return "—"
  const m = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|Brave)\/[\d.]+/)
  const browser = m ? m[1] : "Unknown"
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) return `${browser} · Mobile`
  if (/Windows/i.test(ua)) return `${browser} · Windows`
  if (/Mac OS X|Macintosh/i.test(ua)) return `${browser} · macOS`
  if (/Linux/i.test(ua)) return `${browser} · Linux`
  return browser
}

export default function MonitoringVisitorsPage() {
  const [filters, setFilters] = useState<UniqueVisitorsFilters>({
    window: "24h",
    limit: 50,
    offset: 0,
  })
  const { data, isLoading } = useUniqueVisitors(filters)

  const limit = filters.limit ?? 50
  const offset = filters.offset ?? 0

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Visiteurs uniques
          </h1>
          <p className="text-sm text-muted-foreground">
            Agrégation par adresse IP — {data?.count ?? "—"} visiteurs sur la
            période.
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
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-3">
          <Input
            placeholder="Rechercher une IP…"
            value={filters.q ?? ""}
            onChange={(e) =>
              setFilters({ ...filters, q: e.target.value, offset: 0 })
            }
          />
          <Select
            value={filters.window ?? "24h"}
            onValueChange={(v) =>
              setFilters({ ...filters, window: v as VisitsWindow, offset: 0 })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Fenêtre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Dernières 24h</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setFilters({ window: "24h", limit: 50, offset: 0 })}
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
                <TableHead>IP</TableHead>
                <TableHead className="text-right">Hits</TableHead>
                <TableHead>Première visite</TableHead>
                <TableHead>Dernière visite</TableHead>
                <TableHead>Dernier path</TableHead>
                <TableHead>Navigateur</TableHead>
                <TableHead>User</TableHead>
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
                    Aucun visiteur sur cette période.
                  </TableCell>
                </TableRow>
              )}
              {data?.results.map((v) => (
                <TableRow key={v.ip}>
                  <TableCell className="font-mono text-xs">{v.ip}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {v.hits}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {formatRelative(v.first_seen)}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    {formatRelative(v.last_seen)}
                  </TableCell>
                  <TableCell className="max-w-[260px] truncate font-mono text-xs">
                    {v.last_path || "—"}
                  </TableCell>
                  <TableCell className="text-xs" title={v.last_user_agent}>
                    {shortUserAgent(v.last_user_agent)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {v.last_user_email ?? (
                      <span className="text-muted-foreground">—</span>
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
          {data?.results.length ?? 0} affichés / {data?.count ?? 0} au total
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() =>
              setFilters({ ...filters, offset: Math.max(0, offset - limit) })
            }
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data?.has_more}
            onClick={() => setFilters({ ...filters, offset: offset + limit })}
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  )
}
