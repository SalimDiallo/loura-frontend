"use client"

import { Badge } from "@/components/ui/badge"
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
import type { LogEntry, LogLevel, LogPage } from "@/lib/types/monitoring"
import { useState } from "react"

interface Props {
  title: string
  description?: string
  data: LogPage | undefined
  isLoading: boolean
  filters: { limit?: number; offset?: number; level?: LogLevel; q?: string }
  setFilters: (f: {
    limit?: number
    offset?: number
    level?: LogLevel
    q?: string
  }) => void
}

function levelVariant(
  level: string
): "default" | "secondary" | "destructive" | "outline" {
  if (level === "CRITICAL" || level === "ERROR") return "destructive"
  if (level === "WARNING") return "secondary"
  return "outline"
}

export function LogsViewer({
  title,
  description,
  data,
  isLoading,
  filters,
  setFilters,
}: Props) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const limit = filters.limit ?? 100
  const offset = filters.offset ?? 0

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-3">
          <Input
            placeholder="Rechercher dans le message…"
            value={filters.q ?? ""}
            onChange={(e) =>
              setFilters({ ...filters, q: e.target.value, offset: 0 })
            }
          />
          <Select
            value={filters.level ?? "all"}
            onValueChange={(v) =>
              setFilters({
                ...filters,
                level: v === "all" ? undefined : (v as LogLevel),
                offset: 0,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous niveaux</SelectItem>
              <SelectItem value="INFO">INFO</SelectItem>
              <SelectItem value="WARNING">WARNING</SelectItem>
              <SelectItem value="ERROR">ERROR</SelectItem>
              <SelectItem value="CRITICAL">CRITICAL</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setFilters({ limit, offset: 0 })}
          >
            Réinitialiser
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="max-h-[640px] overflow-auto p-0">
          {isLoading && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Chargement…
            </div>
          )}
          {!isLoading && data?.results.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Aucun log à afficher pour ces filtres.
            </div>
          )}
          <ul className="divide-y divide-border font-mono text-xs">
            {data?.results.map((entry: LogEntry, idx: number) => {
              const isOpen = expanded === idx
              const hasTraceback = !!entry.traceback
              return (
                <li
                  key={`${entry.ts}-${idx}`}
                  className="px-4 py-2 hover:bg-muted/30"
                >
                  <button
                    type="button"
                    onClick={() =>
                      hasTraceback ? setExpanded(isOpen ? null : idx) : null
                    }
                    className="flex w-full items-start gap-3 text-left"
                    disabled={!hasTraceback}
                  >
                    <span className="w-[160px] shrink-0 text-muted-foreground tabular-nums">
                      {entry.ts}
                    </span>
                    <Badge
                      variant={levelVariant(entry.level)}
                      className="shrink-0"
                    >
                      {entry.level}
                    </Badge>
                    <span className="max-w-[180px] shrink-0 truncate text-muted-foreground">
                      {entry.logger}
                    </span>
                    <span className="flex-1 break-all">{entry.message}</span>
                    {entry.exc_type ? (
                      <span className="shrink-0 text-destructive">
                        {entry.exc_type}
                      </span>
                    ) : null}
                  </button>
                  {isOpen && entry.traceback ? (
                    <pre className="mt-2 rounded bg-muted/50 p-3 text-[11px] break-all whitespace-pre-wrap">
                      {entry.traceback}
                    </pre>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {data
            ? `${data.results.length} sur ${data.count} (scanné: ${data.total_scanned})`
            : "—"}
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
            Plus récent
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data?.has_more}
            onClick={() => setFilters({ ...filters, offset: offset + limit })}
          >
            Plus ancien
          </Button>
        </div>
      </div>
    </div>
  )
}
