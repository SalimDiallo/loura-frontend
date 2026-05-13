/**
 * Hooks TanStack Query pour le module Services.
 *
 * - Listes paginées via `usePaginatedQuery` (search, filtres).
 * - Détail / sous-collections via `useQuery`.
 * - Mutations qui invalident les query keys concernées.
 */

"use client";

import { usePaginatedQuery } from "@/lib/hooks/usePagination";
import {
  enrollmentsService,
  moduleInstancesService,
  serviceActivityLogsService,
  serviceCategoriesService,
  serviceModulesService,
  serviceTransactionsService,
  servicesAnalyticsService,
  servicesCatalogService
} from "@/lib/services/services";
import type {
  CreateServiceCategoryData,
  CreateServiceData,
  CreateServiceEnrollmentData,
  CreateServiceModuleData,
  CreateServiceModuleNoteData,
  CreateServiceTransactionData,
  ListServiceActivityLogsParams,
  ListServiceCategoriesParams,
  ListServiceEnrollmentsParams,
  ListServiceTransactionsParams,
  ListServicesParams,
  ServicesAnalyticsParams,
  UpdateServiceCategoryData,
  UpdateServiceData,
  UpdateServiceEnrollmentData,
  UpdateServiceModuleData,
  UpdateServiceModuleInstanceData,
  UpdateServiceTransactionData
} from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const servicesQueryKeys = {
  categories: (orgId: string, params?: ListServiceCategoriesParams) =>
    ["services", "categories", orgId, params ?? {}] as const,
  categoryTree: (orgId: string) => ["services", "categories", orgId, "tree"] as const,
  category: (orgId: string, id: string) =>
    ["services", "categories", orgId, id] as const,

  services: (orgId: string, params?: ListServicesParams) =>
    ["services", "catalog", orgId, params ?? {}] as const,
  service: (orgId: string, id: string) =>
    ["services", "catalog", orgId, id] as const,

  serviceModules: (orgId: string, serviceId: string) =>
    ["services", "modules", orgId, serviceId] as const,

  enrollments: (orgId: string, params?: ListServiceEnrollmentsParams) =>
    ["services", "enrollments", orgId, params ?? {}] as const,
  enrollment: (orgId: string, id: string) =>
    ["services", "enrollments", orgId, id] as const,
  enrollmentByCustomer: (orgId: string, customerId: string) =>
    ["services", "enrollments", orgId, "customer", customerId] as const,
  enrollmentTransactions: (orgId: string, enrollmentId: string) =>
    ["services", "enrollments", orgId, enrollmentId, "transactions"] as const,

  moduleInstance: (orgId: string, id: string) =>
    ["services", "module-instances", orgId, id] as const,
  moduleInstanceNotes: (orgId: string, id: string) =>
    ["services", "module-instances", orgId, id, "notes"] as const,
  moduleInstanceAttachments: (orgId: string, id: string) =>
    ["services", "module-instances", orgId, id, "attachments"] as const,

  transactions: (orgId: string, params?: ListServiceTransactionsParams) =>
    ["services", "transactions", orgId, params ?? {}] as const,
  transaction: (orgId: string, id: string) =>
    ["services", "transactions", orgId, id] as const,

  activityLogs: (orgId: string, params?: ListServiceActivityLogsParams) =>
    ["services", "activity-logs", orgId, params ?? {}] as const,
} as const;

// ─── Catégories ──────────────────────────────────────────────────────────────

export function usePaginatedServiceCategories(
  orgId: string,
  filters?: ListServiceCategoriesParams,
  options?: { pageSize?: number }
) {
  return usePaginatedQuery({
    queryKey: ["services", "categories", orgId],
    fetchFn: (params) => serviceCategoriesService.list(orgId, params),
    filters,
    pageSize: options?.pageSize ?? 20,
    enabled: !!orgId,
  });
}

export function useServiceCategoryTree(orgId: string) {
  return useQuery({
    queryKey: servicesQueryKeys.categoryTree(orgId),
    queryFn: () => serviceCategoriesService.tree(orgId),
    enabled: !!orgId,
  });
}

export function useCreateServiceCategory(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceCategoryData) =>
      serviceCategoriesService.create(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services", "categories", orgId] });
    },
  });
}

export function useUpdateServiceCategory(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateServiceCategoryData;
    }) => serviceCategoriesService.update(orgId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services", "categories", orgId] });
    },
  });
}

export function useDeleteServiceCategory(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serviceCategoriesService.delete(orgId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services", "categories", orgId] });
    },
  });
}

// ─── Services (catalogue) ────────────────────────────────────────────────────

export function usePaginatedServices(
  orgId: string,
  filters?: ListServicesParams,
  options?: { pageSize?: number }
) {
  return usePaginatedQuery({
    queryKey: ["services", "catalog", orgId],
    fetchFn: (params) => servicesCatalogService.list(orgId, params),
    filters,
    pageSize: options?.pageSize ?? 12,
    enabled: !!orgId,
  });
}

export function useService(orgId: string, id: string | undefined) {
  return useQuery({
    queryKey: id ? servicesQueryKeys.service(orgId, id) : ["services", "catalog", orgId, "noop"],
    queryFn: () => servicesCatalogService.get(orgId, id as string),
    enabled: !!orgId && !!id,
  });
}

export function useCreateService(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceData) =>
      servicesCatalogService.create(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services", "catalog", orgId] });
    },
  });
}

export function useUpdateService(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceData }) =>
      servicesCatalogService.update(orgId, id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["services", "catalog", orgId] });
      qc.invalidateQueries({ queryKey: servicesQueryKeys.service(orgId, vars.id) });
    },
  });
}

export function useDeleteService(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicesCatalogService.delete(orgId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services", "catalog", orgId] });
    },
  });
}

// ─── Modules de service (template) ───────────────────────────────────────────

export function useServiceModules(orgId: string, serviceId: string | undefined) {
  return useQuery({
    queryKey: serviceId
      ? servicesQueryKeys.serviceModules(orgId, serviceId)
      : ["services", "modules", orgId, "noop"],
    queryFn: () => serviceModulesService.list(orgId, serviceId as string),
    enabled: !!orgId && !!serviceId,
  });
}

export function useCreateServiceModule(orgId: string, serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceModuleData) =>
      serviceModulesService.create(orgId, serviceId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: servicesQueryKeys.serviceModules(orgId, serviceId) });
      qc.invalidateQueries({ queryKey: servicesQueryKeys.service(orgId, serviceId) });
    },
  });
}

export function useUpdateServiceModule(orgId: string, serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceModuleData }) =>
      serviceModulesService.update(orgId, serviceId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: servicesQueryKeys.serviceModules(orgId, serviceId) });
      qc.invalidateQueries({ queryKey: servicesQueryKeys.service(orgId, serviceId) });
    },
  });
}

export function useDeleteServiceModule(orgId: string, serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      serviceModulesService.delete(orgId, serviceId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: servicesQueryKeys.serviceModules(orgId, serviceId) });
      qc.invalidateQueries({ queryKey: servicesQueryKeys.service(orgId, serviceId) });
    },
  });
}

// ─── Inscriptions ────────────────────────────────────────────────────────────

export function usePaginatedEnrollments(
  orgId: string,
  filters?: ListServiceEnrollmentsParams,
  options?: { pageSize?: number }
) {
  return usePaginatedQuery({
    queryKey: ["services", "enrollments", orgId],
    fetchFn: (params) => enrollmentsService.list(orgId, params),
    filters,
    pageSize: options?.pageSize ?? 10,
    enabled: !!orgId,
  });
}

export function useEnrollment(orgId: string, id: string | undefined) {
  return useQuery({
    queryKey: id ? servicesQueryKeys.enrollment(orgId, id) : ["services", "enrollments", orgId, "noop"],
    queryFn: () => enrollmentsService.get(orgId, id as string, true),
    enabled: !!orgId && !!id,
  });
}

export function useCreateEnrollment(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceEnrollmentData) =>
      enrollmentsService.create(orgId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services", "enrollments", orgId] });
    },
  });
}

export function useUpdateEnrollment(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceEnrollmentData }) =>
      enrollmentsService.update(orgId, id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["services", "enrollments", orgId] });
      qc.invalidateQueries({ queryKey: servicesQueryKeys.enrollment(orgId, vars.id) });
    },
  });
}

export function useDeleteEnrollment(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enrollmentsService.delete(orgId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services", "enrollments", orgId] });
    },
  });
}

export function useGenerateEnrollmentModules(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enrollmentsService.generateModules(orgId, id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: servicesQueryKeys.enrollment(orgId, id) });
    },
  });
}

export function useAddEnrollmentModule(orgId: string, enrollmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) =>
      enrollmentsService.addModule(orgId, enrollmentId, moduleId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: servicesQueryKeys.enrollment(orgId, enrollmentId),
      });
      qc.invalidateQueries({ queryKey: ["services", "enrollments", orgId] });
    },
  });
}

export function useDeleteModuleInstance(orgId: string, enrollmentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moduleInstancesService.delete(orgId, id),
    onSuccess: () => {
      if (enrollmentId) {
        qc.invalidateQueries({
          queryKey: servicesQueryKeys.enrollment(orgId, enrollmentId),
        });
      }
      qc.invalidateQueries({ queryKey: ["services", "enrollments", orgId] });
    },
  });
}

export function useRecomputeEnrollmentTotal(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => enrollmentsService.recomputeTotal(orgId, id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: servicesQueryKeys.enrollment(orgId, id) });
    },
  });
}

// ─── Module Instance (workflow) ──────────────────────────────────────────────

function invalidateInstanceParents(
  qc: ReturnType<typeof useQueryClient>,
  orgId: string,
  enrollmentId?: string
) {
  if (enrollmentId) {
    qc.invalidateQueries({ queryKey: servicesQueryKeys.enrollment(orgId, enrollmentId) });
  }
  qc.invalidateQueries({ queryKey: ["services", "enrollments", orgId] });
}

export function useUpdateModuleInstance(orgId: string, enrollmentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceModuleInstanceData }) =>
      moduleInstancesService.update(orgId, id, data),
    onSuccess: () => invalidateInstanceParents(qc, orgId, enrollmentId),
  });
}

export function useStartModuleInstance(orgId: string, enrollmentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moduleInstancesService.start(orgId, id),
    onSuccess: () => invalidateInstanceParents(qc, orgId, enrollmentId),
  });
}

export function useCompleteModuleInstance(orgId: string, enrollmentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moduleInstancesService.complete(orgId, id),
    onSuccess: () => invalidateInstanceParents(qc, orgId, enrollmentId),
  });
}

export function useBlockModuleInstance(orgId: string, enrollmentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      moduleInstancesService.block(orgId, id, reason),
    onSuccess: () => invalidateInstanceParents(qc, orgId, enrollmentId),
  });
}

export function useSkipModuleInstance(orgId: string, enrollmentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moduleInstancesService.skip(orgId, id),
    onSuccess: () => invalidateInstanceParents(qc, orgId, enrollmentId),
  });
}

export function useReopenModuleInstance(orgId: string, enrollmentId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moduleInstancesService.reopen(orgId, id),
    onSuccess: () => invalidateInstanceParents(qc, orgId, enrollmentId),
  });
}

export function useModuleInstanceNotes(orgId: string, id: string | undefined) {
  return useQuery({
    queryKey: id
      ? servicesQueryKeys.moduleInstanceNotes(orgId, id)
      : ["services", "module-instances", orgId, "noop", "notes"],
    queryFn: () => moduleInstancesService.listNotes(orgId, id as string),
    enabled: !!orgId && !!id,
  });
}

export function useAddModuleInstanceNote(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceModuleNoteData) =>
      moduleInstancesService.addNote(orgId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: servicesQueryKeys.moduleInstanceNotes(orgId, id) });
    },
  });
}

export function useModuleInstanceAttachments(
  orgId: string,
  id: string | undefined
) {
  return useQuery({
    queryKey: id
      ? servicesQueryKeys.moduleInstanceAttachments(orgId, id)
      : ["services", "module-instances", orgId, "noop", "attachments"],
    queryFn: () => moduleInstancesService.listAttachments(orgId, id as string),
    enabled: !!orgId && !!id,
  });
}

export function useUploadModuleInstanceAttachment(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) =>
      moduleInstancesService.uploadAttachment(orgId, id, formData),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: servicesQueryKeys.moduleInstanceAttachments(orgId, id),
      });
    },
  });
}

export function useDeleteModuleInstanceAttachment(orgId: string, id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attId: string) =>
      moduleInstancesService.deleteAttachment(orgId, id, attId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: servicesQueryKeys.moduleInstanceAttachments(orgId, id),
      });
    },
  });
}

// ─── Transactions ────────────────────────────────────────────────────────────

export function usePaginatedServiceTransactions(
  orgId: string,
  filters?: ListServiceTransactionsParams,
  options?: { pageSize?: number }
) {
  return usePaginatedQuery({
    queryKey: ["services", "transactions", orgId],
    fetchFn: (params) => serviceTransactionsService.list(orgId, params),
    filters,
    pageSize: options?.pageSize ?? 15,
    enabled: !!orgId,
  });
}

export function useServiceTransaction(orgId: string, id: string | undefined) {
  return useQuery({
    queryKey: id
      ? servicesQueryKeys.transaction(orgId, id)
      : ["services", "transactions", orgId, "noop"],
    queryFn: () => serviceTransactionsService.get(orgId, id as string),
    enabled: !!orgId && !!id,
  });
}

export function useEnrollmentTransactions(
  orgId: string,
  enrollmentId: string | undefined
) {
  return useQuery({
    queryKey: enrollmentId
      ? servicesQueryKeys.enrollmentTransactions(orgId, enrollmentId)
      : ["services", "enrollments", orgId, "noop", "transactions"],
    queryFn: () =>
      enrollmentsService.listTransactions(orgId, enrollmentId as string),
    enabled: !!orgId && !!enrollmentId,
  });
}

export function useCreateServiceTransaction(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateServiceTransactionData) =>
      serviceTransactionsService.create(orgId, data),
    onSuccess: (resp) => {
      qc.invalidateQueries({ queryKey: ["services", "transactions", orgId] });
      const enrollment = resp.data.enrollment;
      if (enrollment) {
        qc.invalidateQueries({
          queryKey: servicesQueryKeys.enrollment(orgId, enrollment),
        });
        qc.invalidateQueries({
          queryKey: servicesQueryKeys.enrollmentTransactions(orgId, enrollment),
        });
      }
    },
  });
}

export function useUpdateServiceTransaction(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateServiceTransactionData;
    }) => serviceTransactionsService.update(orgId, id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services", "transactions", orgId] });
    },
  });
}

export function useConfirmServiceTransaction(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serviceTransactionsService.confirm(orgId, id),
    onSuccess: (tx) => {
      qc.invalidateQueries({ queryKey: ["services", "transactions", orgId] });
      qc.invalidateQueries({
        queryKey: servicesQueryKeys.transaction(orgId, tx.id),
      });
      if (tx.enrollment) {
        qc.invalidateQueries({
          queryKey: servicesQueryKeys.enrollment(orgId, tx.enrollment),
        });
      }
    },
  });
}

export function useCancelServiceTransaction(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serviceTransactionsService.cancel(orgId, id),
    onSuccess: (tx) => {
      qc.invalidateQueries({ queryKey: ["services", "transactions", orgId] });
      qc.invalidateQueries({
        queryKey: servicesQueryKeys.transaction(orgId, tx.id),
      });
      if (tx.enrollment) {
        qc.invalidateQueries({
          queryKey: servicesQueryKeys.enrollment(orgId, tx.enrollment),
        });
      }
    },
  });
}

export function useDeleteServiceTransaction(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => serviceTransactionsService.delete(orgId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["services", "transactions", orgId] });
    },
  });
}

// ─── Activity log ────────────────────────────────────────────────────────────

export function usePaginatedServiceActivityLogs(
  orgId: string,
  filters?: ListServiceActivityLogsParams,
  options?: { pageSize?: number }
) {
  return usePaginatedQuery({
    queryKey: ["services", "activity-logs", orgId],
    fetchFn: (params) => serviceActivityLogsService.list(orgId, params),
    filters,
    pageSize: options?.pageSize ?? 20,
    enabled: !!orgId,
  });
}

// ─── Analytics (BI) ──────────────────────────────────────────────────────────

export function useServicesAnalyticsSummary(
  orgId: string,
  params?: ServicesAnalyticsParams
) {
  return useQuery({
    queryKey: ["services", "analytics", "summary", orgId, params ?? {}] as const,
    queryFn: () => servicesAnalyticsService.summary(orgId, params),
    enabled: !!orgId,
  });
}
