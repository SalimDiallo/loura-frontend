/**
 * Services API du module Services (catalogue, inscriptions, transactions).
 *
 * Toutes les listes sont paginées (PaginatedResponse<T>).
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
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
  ListServicesParams,
  ListServiceTransactionsParams,
  MessageDataResponse,
  PaginatedResponse,
  Service,
  ServiceActivityLog,
  ServiceCategory,
  ServiceCategoryTreeNode,
  ServiceEnrollment,
  ServiceModule,
  ServiceModuleAttachment,
  ServiceModuleInstance,
  ServiceModuleNote,
  ServicesAnalyticsParams,
  ServicesAnalyticsSummary,
  ServiceTransaction,
  UpdateServiceCategoryData,
  UpdateServiceData,
  UpdateServiceEnrollmentData,
  UpdateServiceModuleData,
  UpdateServiceModuleInstanceData,
  UpdateServiceTransactionData
} from "@/lib/types";

const ENDPOINTS = API_ENDPOINTS.SERVICES;

// ─── Catégories ──────────────────────────────────────────────────────────────

export const serviceCategoriesService = {
  list: (orgId: string, params?: ListServiceCategoriesParams) =>
    apiClient.get<PaginatedResponse<ServiceCategory>>(
      ENDPOINTS.CATEGORIES.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    ),

  tree: (orgId: string) =>
    apiClient.get<ServiceCategoryTreeNode[]>(ENDPOINTS.CATEGORIES.TREE(orgId)),

  get: (orgId: string, id: string) =>
    apiClient.get<ServiceCategory>(ENDPOINTS.CATEGORIES.DETAIL(orgId, id)),

  create: (orgId: string, data: CreateServiceCategoryData) =>
    apiClient.post<MessageDataResponse<ServiceCategory>>(
      ENDPOINTS.CATEGORIES.CREATE(orgId),
      data
    ),

  update: (orgId: string, id: string, data: UpdateServiceCategoryData) =>
    apiClient.patch<MessageDataResponse<ServiceCategory>>(
      ENDPOINTS.CATEGORIES.UPDATE(orgId, id),
      data
    ),

  delete: (orgId: string, id: string) =>
    apiClient.delete<{ message: string }>(
      ENDPOINTS.CATEGORIES.DELETE(orgId, id)
    ),
};

// ─── Services (catalogue) ────────────────────────────────────────────────────

export const servicesCatalogService = {
  list: (orgId: string, params?: ListServicesParams) =>
    apiClient.get<PaginatedResponse<Service>>(
      ENDPOINTS.SERVICES.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    ),

  get: (orgId: string, id: string) =>
    apiClient.get<Service>(ENDPOINTS.SERVICES.DETAIL(orgId, id)),

  create: (orgId: string, data: CreateServiceData) =>
    apiClient.post<MessageDataResponse<Service>>(
      ENDPOINTS.SERVICES.CREATE(orgId),
      data
    ),

  update: (orgId: string, id: string, data: UpdateServiceData) =>
    apiClient.patch<MessageDataResponse<Service>>(
      ENDPOINTS.SERVICES.UPDATE(orgId, id),
      data
    ),

  delete: (orgId: string, id: string) =>
    apiClient.delete<{ message: string }>(ENDPOINTS.SERVICES.DELETE(orgId, id)),
};

// ─── Modules de service (template) ───────────────────────────────────────────

export const serviceModulesService = {
  list: (orgId: string, serviceId: string) =>
    apiClient.get<ServiceModule[]>(
      ENDPOINTS.SERVICE_MODULES.LIST(orgId, serviceId)
    ),

  create: (orgId: string, serviceId: string, data: CreateServiceModuleData) =>
    apiClient.post<MessageDataResponse<ServiceModule>>(
      ENDPOINTS.SERVICE_MODULES.CREATE(orgId, serviceId),
      data
    ),

  update: (
    orgId: string,
    serviceId: string,
    id: string,
    data: UpdateServiceModuleData
  ) =>
    apiClient.patch<MessageDataResponse<ServiceModule>>(
      ENDPOINTS.SERVICE_MODULES.UPDATE(orgId, serviceId, id),
      data
    ),

  delete: (orgId: string, serviceId: string, id: string) =>
    apiClient.delete<{ message: string }>(
      ENDPOINTS.SERVICE_MODULES.DELETE(orgId, serviceId, id)
    ),
};

// ─── Inscriptions clients ────────────────────────────────────────────────────

export const enrollmentsService = {
  list: (orgId: string, params?: ListServiceEnrollmentsParams) =>
    apiClient.get<PaginatedResponse<ServiceEnrollment>>(
      ENDPOINTS.ENROLLMENTS.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    ),

  byCustomer: (orgId: string, customerId: string) =>
    apiClient.get<PaginatedResponse<ServiceEnrollment>>(
      ENDPOINTS.ENROLLMENTS.BY_CUSTOMER(orgId, customerId)
    ),

  get: (orgId: string, id: string, includeModules = true) =>
    apiClient.get<ServiceEnrollment>(ENDPOINTS.ENROLLMENTS.DETAIL(orgId, id), {
      params: { include_modules: includeModules ? "true" : "false" },
    }),

  create: (orgId: string, data: CreateServiceEnrollmentData) =>
    apiClient.post<MessageDataResponse<ServiceEnrollment>>(
      ENDPOINTS.ENROLLMENTS.CREATE(orgId),
      data
    ),

  update: (orgId: string, id: string, data: UpdateServiceEnrollmentData) =>
    apiClient.patch<MessageDataResponse<ServiceEnrollment>>(
      ENDPOINTS.ENROLLMENTS.UPDATE(orgId, id),
      data
    ),

  delete: (orgId: string, id: string) =>
    apiClient.delete<{ message: string }>(
      ENDPOINTS.ENROLLMENTS.DELETE(orgId, id)
    ),

  generateModules: (orgId: string, id: string) =>
    apiClient.post<{
      message: string;
      module_instances: ServiceModuleInstance[];
      total_due: string;
    }>(ENDPOINTS.ENROLLMENTS.GENERATE_MODULES(orgId, id), {}),

  addModule: (orgId: string, id: string, moduleId: string) =>
    apiClient.post<{
      message: string;
      data: ServiceModuleInstance;
      total_due: string;
    }>(ENDPOINTS.ENROLLMENTS.ADD_MODULE(orgId, id), { module: moduleId }),

  recomputeTotal: (orgId: string, id: string) =>
    apiClient.post<{ message: string; total_due: string }>(
      ENDPOINTS.ENROLLMENTS.RECOMPUTE_TOTAL(orgId, id),
      {}
    ),

  listModules: (orgId: string, enrollmentId: string) =>
    apiClient.get<PaginatedResponse<ServiceModuleInstance>>(
      ENDPOINTS.ENROLLMENTS.MODULES(orgId, enrollmentId)
    ),

  listTransactions: (orgId: string, enrollmentId: string) =>
    apiClient.get<PaginatedResponse<ServiceTransaction>>(
      ENDPOINTS.ENROLLMENTS.TRANSACTIONS(orgId, enrollmentId)
    ),
};

// ─── Instances de modules (workflow) ─────────────────────────────────────────

export const moduleInstancesService = {
  get: (orgId: string, id: string) =>
    apiClient.get<ServiceModuleInstance>(
      ENDPOINTS.MODULE_INSTANCES.DETAIL(orgId, id)
    ),

  update: (orgId: string, id: string, data: UpdateServiceModuleInstanceData) =>
    apiClient.patch<MessageDataResponse<ServiceModuleInstance>>(
      ENDPOINTS.MODULE_INSTANCES.DETAIL(orgId, id),
      data
    ),

  delete: (orgId: string, id: string) =>
    apiClient.delete<{ message: string; total_due?: string }>(
      ENDPOINTS.MODULE_INSTANCES.DETAIL(orgId, id)
    ),

  start: (orgId: string, id: string) =>
    apiClient.post<ServiceModuleInstance>(
      ENDPOINTS.MODULE_INSTANCES.START(orgId, id),
      {}
    ),

  complete: (orgId: string, id: string) =>
    apiClient.post<ServiceModuleInstance>(
      ENDPOINTS.MODULE_INSTANCES.COMPLETE(orgId, id),
      {}
    ),

  block: (orgId: string, id: string, reason?: string) =>
    apiClient.post<ServiceModuleInstance>(
      ENDPOINTS.MODULE_INSTANCES.BLOCK(orgId, id),
      { reason: reason ?? "" }
    ),

  skip: (orgId: string, id: string) =>
    apiClient.post<ServiceModuleInstance>(
      ENDPOINTS.MODULE_INSTANCES.SKIP(orgId, id),
      {}
    ),

  reopen: (orgId: string, id: string) =>
    apiClient.post<ServiceModuleInstance>(
      ENDPOINTS.MODULE_INSTANCES.REOPEN(orgId, id),
      {}
    ),

  listNotes: (orgId: string, id: string) =>
    apiClient.get<ServiceModuleNote[]>(
      ENDPOINTS.MODULE_INSTANCES.NOTES(orgId, id)
    ),

  addNote: (orgId: string, id: string, data: CreateServiceModuleNoteData) =>
    apiClient.post<MessageDataResponse<ServiceModuleNote>>(
      ENDPOINTS.MODULE_INSTANCES.NOTES(orgId, id),
      data
    ),

  listAttachments: (orgId: string, id: string) =>
    apiClient.get<ServiceModuleAttachment[]>(
      ENDPOINTS.MODULE_INSTANCES.ATTACHMENTS(orgId, id)
    ),

  uploadAttachment: (orgId: string, id: string, formData: FormData) =>
    apiClient.post<MessageDataResponse<ServiceModuleAttachment>>(
      ENDPOINTS.MODULE_INSTANCES.ATTACHMENTS(orgId, id),
      formData
    ),

  deleteAttachment: (orgId: string, id: string, attId: string) =>
    apiClient.delete<{ message: string }>(
      ENDPOINTS.MODULE_INSTANCES.ATTACHMENT_DETAIL(orgId, id, attId)
    ),
};

// ─── Transactions ────────────────────────────────────────────────────────────

export const serviceTransactionsService = {
  list: (orgId: string, params?: ListServiceTransactionsParams) =>
    apiClient.get<PaginatedResponse<ServiceTransaction>>(
      ENDPOINTS.TRANSACTIONS.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    ),

  get: (orgId: string, id: string) =>
    apiClient.get<ServiceTransaction>(ENDPOINTS.TRANSACTIONS.DETAIL(orgId, id)),

  create: (orgId: string, data: CreateServiceTransactionData) =>
    apiClient.post<MessageDataResponse<ServiceTransaction>>(
      ENDPOINTS.TRANSACTIONS.CREATE(orgId),
      data
    ),

  update: (orgId: string, id: string, data: UpdateServiceTransactionData) =>
    apiClient.patch<MessageDataResponse<ServiceTransaction>>(
      ENDPOINTS.TRANSACTIONS.UPDATE(orgId, id),
      data
    ),

  delete: (orgId: string, id: string) =>
    apiClient.delete<{ message: string }>(
      ENDPOINTS.TRANSACTIONS.DELETE(orgId, id)
    ),

  confirm: (orgId: string, id: string) =>
    apiClient.post<ServiceTransaction>(
      ENDPOINTS.TRANSACTIONS.CONFIRM(orgId, id),
      {}
    ),

  cancel: (orgId: string, id: string) =>
    apiClient.post<ServiceTransaction>(
      ENDPOINTS.TRANSACTIONS.CANCEL(orgId, id),
      {}
    ),
};

// ─── Activity Logs ───────────────────────────────────────────────────────────

export const serviceActivityLogsService = {
  list: (orgId: string, params?: ListServiceActivityLogsParams) =>
    apiClient.get<PaginatedResponse<ServiceActivityLog>>(
      ENDPOINTS.ACTIVITY_LOGS.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    ),
};

// ─── Analytics (BI) ──────────────────────────────────────────────────────────

export const servicesAnalyticsService = {
  summary: (orgId: string, params?: ServicesAnalyticsParams) =>
    apiClient.get<ServicesAnalyticsSummary>(
      ENDPOINTS.ANALYTICS.SUMMARY(orgId),
      { params: params as Record<string, unknown> | undefined }
    ),
};
