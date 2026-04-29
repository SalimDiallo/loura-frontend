/**
 * Types pour le module Services.
 *
 * Correspond aux serializers backend `loura/services/serializers/*`.
 * Toute évolution backend doit être reflétée ici.
 */

import type { AuditInfo, FilterParams, UserMiniInfo } from "../shared";

// ─── Catégories ──────────────────────────────────────────────────────────────

export interface ServiceCategory extends AuditInfo {
  id: string;
  organization: string;
  parent: string | null;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  full_path: string;
  level: number;
  services_count: number;
}

export interface ServiceCategoryTreeNode {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
  children: ServiceCategoryTreeNode[];
}

export interface CreateServiceCategoryData {
  name: string;
  parent?: string | null;
  description?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
}

export type UpdateServiceCategoryData = Partial<CreateServiceCategoryData>;

export interface ListServiceCategoriesParams extends FilterParams {
  is_active?: string;
  parent?: string;
}

// ─── Services (catalogue) ────────────────────────────────────────────────────

export type ServicePaymentMode = "global" | "per_step" | "partial";

export interface ServiceModule extends AuditInfo {
  id: string;
  service: string;
  name: string;
  description: string;
  order: number;
  price: string | null;
  estimated_duration_days: number | null;
  is_required: boolean;
  is_active: boolean;
}

export interface Service extends AuditInfo {
  id: string;
  organization: string;
  category: string | null;
  category_name: string | null;
  name: string;
  code: string;
  description: string;
  base_price: string | null;
  computed_price: string | null;
  duration_days: number | null;
  payment_mode: ServicePaymentMode;
  payment_mode_display: string;
  parameters: Record<string, unknown>;
  is_active: boolean;
  modules: ServiceModule[];
  modules_count: number;
  enrollments_count: number;
}

export interface CreateServiceData {
  name: string;
  code?: string;
  category?: string | null;
  description?: string;
  base_price?: string | number | null;
  duration_days?: number | null;
  payment_mode?: ServicePaymentMode;
  parameters?: Record<string, unknown>;
  is_active?: boolean;
}

export type UpdateServiceData = Partial<CreateServiceData>;

export interface ListServicesParams extends FilterParams {
  is_active?: string;
  category?: string;
  payment_mode?: ServicePaymentMode;
}

export interface CreateServiceModuleData {
  name: string;
  description?: string;
  order?: number;
  price?: string | number | null;
  estimated_duration_days?: number | null;
  is_required?: boolean;
  is_active?: boolean;
}

export type UpdateServiceModuleData = Partial<CreateServiceModuleData>;

// ─── Inscriptions clients (Enrollments) ──────────────────────────────────────

export type ServiceEnrollmentStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "suspended"
  | "cancelled";

export interface ServiceEnrollmentModulesSummary {
  total: number;
  completed: number;
  in_progress: number;
  blocked: number;
  skipped: number;
  pending: number;
  progress_pct: number;
}

export interface ServiceEnrollmentServiceMini {
  id: string;
  name: string;
  code: string;
  payment_mode: ServicePaymentMode;
}

export interface ServiceEnrollmentCustomerMini {
  id: string;
  name: string;
  customer_type: string;
  email: string;
  phone: string;
}

export interface ServiceEnrollmentAssigneeMini {
  id: string;
  user: UserMiniInfo | null;
}

export interface ServiceEnrollment extends AuditInfo {
  id: string;
  organization: string;
  service: string;
  service_info: ServiceEnrollmentServiceMini;
  customer: string;
  customer_info: ServiceEnrollmentCustomerMini;
  assignee: string | null;
  assignee_info: ServiceEnrollmentAssigneeMini | null;
  reference: string;
  status: ServiceEnrollmentStatus;
  status_display: string;
  start_date: string | null;
  expected_end_date: string | null;
  end_date: string | null;
  total_due: string;
  total_paid: string;
  balance_due: string;
  payment_mode: ServicePaymentMode;
  payment_mode_display: string;
  notes: string;
  parameters: Record<string, unknown>;
  modules_summary: ServiceEnrollmentModulesSummary;
  /** Présent uniquement sur le détail (?include_modules=true). */
  module_instances?: ServiceModuleInstance[];
}

export interface CreateServiceEnrollmentData {
  service: string;
  customer: string;
  assignee?: string | null;
  start_date?: string | null;
  expected_end_date?: string | null;
  payment_mode?: ServicePaymentMode;
  notes?: string;
  parameters?: Record<string, unknown>;
  auto_generate_modules?: boolean;
}

export interface UpdateServiceEnrollmentData {
  status?: ServiceEnrollmentStatus;
  start_date?: string | null;
  expected_end_date?: string | null;
  end_date?: string | null;
  assignee?: string | null;
  notes?: string;
  parameters?: Record<string, unknown>;
}

export interface ListServiceEnrollmentsParams extends FilterParams {
  status?: ServiceEnrollmentStatus;
  service?: string;
  customer?: string;
  assignee?: string;
}

// ─── Modules instanciés (workflow client) ────────────────────────────────────

export type ServiceModuleInstanceStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "blocked"
  | "skipped";

export interface ServiceModuleInstance extends AuditInfo {
  id: string;
  enrollment: string;
  module: string;
  name: string;
  description: string;
  order: number;
  price: string | null;
  estimated_duration_days: number | null;
  is_required: boolean;
  status: ServiceModuleInstanceStatus;
  status_display: string;
  started_at: string | null;
  completed_at: string | null;
  suspended_at: string | null;
  reopened_at: string | null;
  blocked_reason: string;
  /** Audit explicite des transitions de workflow. */
  started_by_info: UserMiniInfo | null;
  completed_by_info: UserMiniInfo | null;
  blocked_by_info: UserMiniInfo | null;
  reopened_by_info: UserMiniInfo | null;
  assignee: string | null;
  assignee_info: ServiceEnrollmentAssigneeMini | null;
  notes: string;
  amount_paid: string;
  balance_due: string;
  notes_count: number;
  attachments_count: number;
}

export interface UpdateServiceModuleInstanceData {
  assignee?: string | null;
  notes?: string;
  price?: string | number | null;
  estimated_duration_days?: number | null;
}

export interface ServiceModuleNote extends AuditInfo {
  id: string;
  module_instance: string;
  author: string | null;
  author_info: ServiceEnrollmentAssigneeMini | null;
  content: string;
}

export interface CreateServiceModuleNoteData {
  content: string;
}

export interface ServiceModuleAttachment extends AuditInfo {
  id: string;
  module_instance: string;
  file: string;
  file_url: string | null;
  name: string;
  description: string;
}

// ─── Transactions financières ────────────────────────────────────────────────

export type ServiceTransactionType =
  | "client_payment"
  | "internal_expense"
  | "revenue"
  | "refund";

export type ServiceTransactionDirection = "in" | "out";

export type ServiceTransactionStatus = "pending" | "confirmed" | "cancelled";

export type ServiceTransactionPaymentMethod =
  | "cash"
  | "bank"
  | "mobile_money"
  | "cheque"
  | "card"
  | "other";

export interface ServiceTransaction extends AuditInfo {
  id: string;
  organization: string;
  enrollment: string | null;
  enrollment_reference: string | null;
  module_instance: string | null;
  module_name: string | null;
  transaction_type: ServiceTransactionType;
  transaction_type_display: string;
  direction: ServiceTransactionDirection;
  direction_display: string;
  amount: string;
  currency: string;
  transaction_date: string;
  reference: string;
  description: string;
  payment_method: ServiceTransactionPaymentMethod;
  payment_method_display: string;
  status: ServiceTransactionStatus;
  status_display: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  /** Audit explicite : utilisateur ayant validé / annulé la transaction. */
  confirmed_by_info: UserMiniInfo | null;
  cancelled_by_info: UserMiniInfo | null;
}

export interface CreateServiceTransactionData {
  enrollment?: string | null;
  module_instance?: string | null;
  transaction_type?: ServiceTransactionType;
  amount: string | number;
  currency?: string;
  transaction_date?: string;
  reference?: string;
  description?: string;
  payment_method?: ServiceTransactionPaymentMethod;
  status?: ServiceTransactionStatus;
}

export type UpdateServiceTransactionData = Partial<
  Omit<CreateServiceTransactionData, "enrollment" | "module_instance" | "status">
>;

export interface ListServiceTransactionsParams extends FilterParams {
  status?: ServiceTransactionStatus;
  transaction_type?: ServiceTransactionType;
  direction?: ServiceTransactionDirection;
  enrollment?: string;
  module_instance?: string;
  date_from?: string;
  date_to?: string;
}

// ─── Activity Log ────────────────────────────────────────────────────────────

export type ServiceActivityTargetType =
  | "service"
  | "service_module"
  | "enrollment"
  | "module_instance"
  | "transaction";

export interface ServiceActivityLog extends AuditInfo {
  id: string;
  organization: string;
  action: string;
  target_type: ServiceActivityTargetType;
  target_type_display: string;
  target_id: string | null;
  description: string;
  metadata: Record<string, unknown>;
}

export interface ListServiceActivityLogsParams extends FilterParams {
  target_type?: ServiceActivityTargetType;
  target_id?: string;
  action?: string;
}

// ─── Analytics (BI) ──────────────────────────────────────────────────────────

export type ServicesAnalyticsGranularity = "day" | "week" | "month";

export interface ServicesAnalyticsParams {
  from?: string;
  to?: string;
  granularity?: ServicesAnalyticsGranularity;
}

export interface ServicesAnalyticsKpis {
  revenue: string;
  other_revenue: string;
  /** Total des sorties (dépenses internes + remboursements). */
  expense: string;
  /** Détail : dépenses internes uniquement. */
  internal_expense: string;
  /** Détail : remboursements clients uniquement. */
  refunds: string;
  net: string;
  outstanding: string;
  active_services: number;
  total_enrollments: number;
  completed_enrollments: number;
  in_progress_enrollments: number;
  cancelled_enrollments: number;
}

export interface ServicesAnalyticsTrendPoint {
  period: string;
  revenue: string;
  expense: string;
}

export interface ServicesAnalyticsTopService {
  service_id: string;
  service_name: string;
  service_code: string;
  revenue: string;
  payments_count: number;
}

export interface ServicesAnalyticsSummary {
  from: string;
  to: string;
  granularity: ServicesAnalyticsGranularity;
  kpis: ServicesAnalyticsKpis;
  transactions_trend: ServicesAnalyticsTrendPoint[];
  top_services: ServicesAnalyticsTopService[];
  enrollments_by_status: Record<ServiceEnrollmentStatus, number>;
  modules_by_status: Record<ServiceModuleInstanceStatus, number>;
}

// ─── Réponses standard ───────────────────────────────────────────────────────

export interface MessageDataResponse<T> {
  message: string;
  data: T;
}
