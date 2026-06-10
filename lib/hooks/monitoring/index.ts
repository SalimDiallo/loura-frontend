"use client"

import {
  monitoringService,
  type ErrorsFilters,
  type LogsFilters,
  type UniqueVisitorsFilters,
  type VisitsListFilters,
} from "@/lib/services/monitoring/monitoring.service"
import { useQuery } from "@tanstack/react-query"

const REFRESH_MS = 30_000

export function useVisitsSummary() {
  return useQuery({
    queryKey: ["monitoring", "visits", "summary"],
    queryFn: () => monitoringService.getVisitsSummary(),
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS,
  })
}

export function useVisitsList(filters: VisitsListFilters) {
  return useQuery({
    queryKey: ["monitoring", "visits", "list", filters],
    queryFn: () => monitoringService.listVisits(filters),
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS,
  })
}

export function useUniqueVisitors(filters: UniqueVisitorsFilters) {
  return useQuery({
    queryKey: ["monitoring", "visits", "unique", filters],
    queryFn: () => monitoringService.listUniqueVisitors(filters),
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS,
  })
}

export function useOrgsStats() {
  return useQuery({
    queryKey: ["monitoring", "orgs", "stats"],
    queryFn: () => monitoringService.getOrgsStats(),
    refetchInterval: REFRESH_MS * 2,
    staleTime: REFRESH_MS * 2,
  })
}

export function useSubscriptionsStats() {
  return useQuery({
    queryKey: ["monitoring", "subscriptions", "stats"],
    queryFn: () => monitoringService.getSubscriptionsStats(),
    refetchInterval: REFRESH_MS * 2,
    staleTime: REFRESH_MS * 2,
  })
}

export function useBackendLogs(filters: LogsFilters) {
  return useQuery({
    queryKey: ["monitoring", "logs", "backend", filters],
    queryFn: () => monitoringService.getBackendLogs(filters),
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS,
  })
}

export function useFrontendLogs(filters: LogsFilters) {
  return useQuery({
    queryKey: ["monitoring", "logs", "frontend", filters],
    queryFn: () => monitoringService.getFrontendLogs(filters),
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS,
  })
}

export function useErrorsList(filters: ErrorsFilters) {
  return useQuery({
    queryKey: ["monitoring", "errors", "list", filters],
    queryFn: () => monitoringService.listErrors(filters),
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS,
  })
}

export function useErrorDetail(id: number | null) {
  return useQuery({
    queryKey: ["monitoring", "errors", "detail", id],
    queryFn: () => monitoringService.getError(id as number),
    enabled: id !== null,
  })
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ["monitoring", "health"],
    queryFn: () => monitoringService.getSystemHealth(),
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS,
  })
}

export function useTasksStatus() {
  return useQuery({
    queryKey: ["monitoring", "tasks"],
    queryFn: () => monitoringService.getTasksStatus(),
    refetchInterval: REFRESH_MS * 2,
    staleTime: REFRESH_MS * 2,
  })
}
