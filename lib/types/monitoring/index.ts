/**
 * Types du module monitoring (J1).
 */

export type VisitSource = "landing" | "app" | "api" | "other"

export interface PageView {
  id: number
  path: string
  method: string
  status_code: number
  source: VisitSource
  user: number | null
  user_email: string | null
  ip: string | null
  user_agent: string
  referer: string
  duration_ms: number | null
  created_at: string
}

export interface VisitsSummary {
  totals: {
    "24h": number
    "7d": number
    "30d": number
    all: number
  }
  by_source: Array<{ source: VisitSource; count: number }>
  top_paths: Array<{ path: string; count: number }>
  series: Array<{ day: string; count: number }>
  status_buckets: {
    "2xx": number
    "3xx": number
    "4xx": number
    "5xx": number
    other: number
  }
  unique_visitors_24h: number
  performance: {
    avg_duration_ms_24h: number | null
    p95_duration_ms_24h: number | null
    slow_requests_24h: number
    slow_threshold_ms: number
  }
}

export interface OrgsStats {
  total: number
  active: number
  inactive: number
  new_7d: number
  new_30d: number
  by_country: Array<{ country: string; count: number }>
  by_currency: Array<{ currency: string; count: number }>
  series: Array<{ day: string; count: number }>
}

export interface SubscriptionsStats {
  totals: {
    all: number
    active: number
    cancelled_30d: number
    expired_30d: number
  }
  by_plan: Array<{ plan__code: string; plan__name: string; count: number }>
  mrr_gnf: string
  transactions_30d: {
    by_status: Array<{ status: string; count: number }>
    revenue_success_gnf: string
  }
  plans: Array<{
    code: string
    name: string
    price_monthly: string
    price_yearly: string
    currency: string
  }>
}

export type LogLevel = "INFO" | "WARNING" | "ERROR" | "CRITICAL"

export interface LogEntry {
  ts: string
  level: LogLevel
  logger: string
  message: string
  exc_type?: string
  traceback?: string
  url?: string
  user_agent?: string
  request_id?: string
  [key: string]: unknown
}

export interface LogPage {
  results: LogEntry[]
  count: number
  has_more: boolean
  total_scanned: number
}

export type ErrorSource = "back" | "front"

export interface ErrorEventListItem {
  id: number
  level: LogLevel
  source: ErrorSource
  logger: string
  message: string
  exc_type: string
  url: string
  user: number | null
  user_email: string | null
  sentry_event_id: string
  created_at: string
}

export interface ErrorEventDetail extends ErrorEventListItem {
  traceback: string
  user_agent: string
  extra: Record<string, unknown>
}

export type VisitsWindow = "24h" | "7d" | "30d"

export interface UniqueVisitor {
  ip: string
  hits: number
  first_seen: string
  last_seen: string
  last_path: string
  last_user_agent: string
  last_user_email: string | null
}

export interface UniqueVisitorsResponse {
  window: VisitsWindow
  count: number
  results: UniqueVisitor[]
  has_more: boolean
}

// ── Santé système + tâches planifiées (J4) ──

export type HealthStatus = "ok" | "degraded" | "down"

export interface HealthCheck {
  ok: boolean
  latency_ms?: number
  error?: string
  workers?: string[]
  eager?: boolean
  last_heartbeat?: string | null
  stale?: boolean
  used_percent?: number
  free_gb?: number
}

export type TaskRunStatus = "running" | "success" | "failure"

export interface BeatTaskStatus {
  name: string
  task: string
  last_run: {
    status: TaskRunStatus
    started_at: string
    finished_at: string | null
    duration_ms: number | null
  } | null
  stale: boolean
}

export interface SystemHealth {
  status: HealthStatus
  checks: {
    database: HealthCheck
    redis: HealthCheck
    celery_worker: HealthCheck
    celery_beat: HealthCheck
    logs_writable: HealthCheck
    disk: HealthCheck
  }
  beat_tasks: BeatTaskStatus[]
  version: string
  environment: string
  uptime_seconds: number
  server_time: string
}

export interface TaskRun {
  id: number
  task_name: string
  task_id: string
  status: TaskRunStatus
  started_at: string
  finished_at: string | null
  duration_ms: number | null
  detail: string
  error: string
}

export interface TasksStatusResponse {
  beat: BeatTaskStatus[]
  recent_runs: TaskRun[]
}
