"use client"

import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useSystemHealth } from "@/lib/hooks/monitoring"
import type { HealthCheck, HealthStatus } from "@/lib/types/monitoring"

const CHECK_LABELS: Record<string, string> = {
  database: "Base de données",
  redis: "Redis (broker)",
  celery_worker: "Worker Celery",
  celery_beat: "Beat Celery",
  logs_writable: "Logs (écriture)",
  disk: "Disque",
}

function statusBadge(status: HealthStatus) {
  if (status === "ok") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Opérationnel</Badge>
  }
  if (status === "degraded") {
    return <Badge className="bg-amber-500 hover:bg-amber-500">Dégradé</Badge>
  }
  return <Badge variant="destructive">Hors service</Badge>
}

function checkHint(key: string, check: HealthCheck): string {
  if (!check.ok) return check.error ?? "indisponible"
  if (key === "celery_worker") {
    if (check.eager) return "mode eager"
    return check.workers?.join(", ") || "—"
  }
  if (key === "celery_beat") {
    return check.last_heartbeat
      ? new Date(check.last_heartbeat).toLocaleTimeString("fr-FR")
      : "—"
  }
  if (key === "disk") {
    return `${check.used_percent ?? "?"}% utilisé · ${check.free_gb ?? "?"} Go libres`
  }
  if (typeof check.latency_ms === "number") return `${check.latency_ms} ms`
  return "ok"
}

function formatUptime(seconds: number): string {
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`
  return `${Math.floor(seconds / 86400)} j`
}

export function SystemHealthCard() {
  const health = useSystemHealth()
  const data = health.data

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>Santé système</CardTitle>
          <CardDescription>
            DB, Redis, Celery, disque — refresh 30 s.
          </CardDescription>
        </div>
        {data ? statusBadge(data.status) : null}
      </CardHeader>
      <CardContent>
        {health.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : health.isError || !data ? (
          <p className="text-sm text-destructive">
            Impossible de joindre le backend — il est peut-être hors service.
          </p>
        ) : (
          <div className="space-y-3">
            <ul className="space-y-2 text-sm">
              {Object.entries(data.checks).map(([key, check]) => (
                <li key={key} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full ${
                        check.ok ? "bg-emerald-500" : "bg-destructive"
                      }`}
                    />
                    {CHECK_LABELS[key] ?? key}
                  </span>
                  <span
                    className="max-w-[220px] truncate font-mono text-xs text-muted-foreground"
                    title={checkHint(key, check)}
                  >
                    {checkHint(key, check)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t pt-2 text-xs text-muted-foreground">
              Env : {data.environment}
              {data.version ? ` · version ${data.version}` : ""} · uptime{" "}
              {formatUptime(data.uptime_seconds)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
