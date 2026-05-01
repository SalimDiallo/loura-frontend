/**
 * Service API pour le module monitoring (J1 — superadmin only).
 */

import { apiClient } from "@/lib/api/client"
import { API_ENDPOINTS } from "@/lib/api/config"
import type {
  ErrorEventDetail,
  ErrorEventListItem,
  LogLevel,
  LogPage,
  OrgsStats,
  PageView,
  SubscriptionsStats,
  UniqueVisitorsResponse,
  VisitsSummary,
  VisitsWindow,
} from "@/lib/types/monitoring"

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface VisitsListFilters {
  page?: number
  page_size?: number
  source?: string
  status?: number
  status_class?: 2 | 3 | 4 | 5
  user?: number
  q?: string
}

export interface UniqueVisitorsFilters {
  window?: VisitsWindow
  limit?: number
  offset?: number
  q?: string
}

export const monitoringService = {
  async getVisitsSummary() {
    return apiClient.get<VisitsSummary>(API_ENDPOINTS.MONITORING.VISITS_SUMMARY)
  },

  async listVisits(filters: VisitsListFilters = {}) {
    return apiClient.get<PaginatedResponse<PageView>>(
      API_ENDPOINTS.MONITORING.VISITS_LIST,
      { params: filters as Record<string, unknown> }
    )
  },

  async listUniqueVisitors(filters: UniqueVisitorsFilters = {}) {
    return apiClient.get<UniqueVisitorsResponse>(
      API_ENDPOINTS.MONITORING.VISITS_UNIQUE,
      { params: filters as Record<string, unknown> }
    )
  },

  async getOrgsStats() {
    return apiClient.get<OrgsStats>(API_ENDPOINTS.MONITORING.ORGS_STATS)
  },

  async getSubscriptionsStats() {
    return apiClient.get<SubscriptionsStats>(
      API_ENDPOINTS.MONITORING.SUBSCRIPTIONS_STATS
    )
  },

  // ── Logs ──
  async getBackendLogs(filters: LogsFilters = {}) {
    return apiClient.get<LogPage>(API_ENDPOINTS.MONITORING.LOGS_BACKEND, {
      params: filters as Record<string, unknown>,
    })
  },

  async getFrontendLogs(filters: LogsFilters = {}) {
    return apiClient.get<LogPage>(API_ENDPOINTS.MONITORING.LOGS_FRONTEND, {
      params: filters as Record<string, unknown>,
    })
  },

  async ingestFrontendLog(payload: FrontendLogPayload) {
    return apiClient.post<{ ok: true }>(
      API_ENDPOINTS.MONITORING.LOGS_FRONTEND_INGEST,
      payload,
      { requiresAuth: false }
    )
  },

  // ── Erreurs ──
  async listErrors(filters: ErrorsFilters = {}) {
    return apiClient.get<PaginatedResponse<ErrorEventListItem>>(
      API_ENDPOINTS.MONITORING.ERRORS_LIST,
      { params: filters as Record<string, unknown> }
    )
  },

  async getError(id: number) {
    return apiClient.get<ErrorEventDetail>(
      API_ENDPOINTS.MONITORING.ERROR_DETAIL(id)
    )
  },
}

export interface LogsFilters {
  limit?: number
  offset?: number
  level?: LogLevel
  q?: string
}

export interface ErrorsFilters {
  page?: number
  page_size?: number
  source?: "back" | "front"
  level?: LogLevel
  q?: string
}

export interface FrontendLogPayload {
  level: LogLevel
  message: string
  url?: string
  user_agent?: string
  exc_type?: string
  traceback?: string
  context?: Record<string, unknown>
}
