/**
 * Types pour le module HR (Human Resources)
 * Gestion des employés, rôles, permissions et invitations
 */

import type { UserMiniInfo } from "../shared";

// ─── Permission ──────────────────────────────────────────────────────────────

export interface Permission {
  id: string;
  codename: string;
  label: string;
  module: string;
}

// ─── Role ────────────────────────────────────────────────────────────────────

export interface Role {
  id: string;
  name: string;
  organization: string;
  permissions: Permission[];
  description: string;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreateRoleData {
  name: string;
  description?: string;
  permission_ids: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permission_ids?: string[];
}

// ─── Employee ────────────────────────────────────────────────────────────────

export interface EmployeeUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  phone: string;
}

export interface Employee {
  id: string;
  user: EmployeeUser;
  employee_id: string;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

// ─── Membership ──────────────────────────────────────────────────────────────

export interface Membership {
  id: string;
  employee: Employee;
  organization: string;
  role: Role | null;
  extra_permissions: Permission[];
  all_permissions: string[];  // Liste des codenames
  is_active: boolean;
  joined_at: string;
  created_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface UpdateMembershipData {
  role_id?: string | null;
  extra_permission_ids?: string[];
  is_active?: boolean;
}

// Type pour les memberships de l'utilisateur connecté (avec infos org)
export interface MyMembershipOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  is_active: boolean;
}

export interface MyMembership {
  id: string;
  organization: MyMembershipOrganization;
  role: Role | null;
  extra_permissions: Permission[];
  all_permissions: string[];  // Liste des codenames
  is_active: boolean;
  joined_at: string;
  created_at: string;
}

// ─── My Permissions (org-scoped) ─────────────────────────────────────────────

export interface MyOrgPermissions {
  is_owner: boolean;
  membership_id: string | null;
  role: { id: string; name: string } | null;
  permissions: string[];  // Liste des codenames
}

// ─── Invitation ──────────────────────────────────────────────────────────────

export interface InvitationOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export interface InvitationInvitedBy {
  email: string;
  first_name: string;
  last_name: string;
}

export interface InvitationDepartment {
  id: string;
  name: string;
}

export interface InvitationPosition {
  id: string;
  name: string;
  level: string;
}

export interface Invitation {
  id: string;
  email: string;
  organization: InvitationOrganization;
  invited_by: InvitationInvitedBy;
  role: Role | null;
  permissions: Permission[];
  department: InvitationDepartment | null;
  position: InvitationPosition | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

/**
 * Vue publique d'une invitation depuis son token (lien email).
 *
 * Renvoyé par `GET /api/hr/invitations/by-token/<token>/`. Contient
 * uniquement les informations nécessaires à l'affichage de la landing
 * page d'invitation, jamais le token lui-même ni les permissions
 * effectives.
 */
export interface InvitationByToken {
  id: string;
  email: string;
  organization: InvitationOrganization;
  invited_by: InvitationInvitedBy;
  role: { id: string; name: string } | null;
  department: InvitationDepartment | null;
  position: InvitationPosition | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  is_expired: boolean;
  created_at: string;
}

export interface CreateInvitationData {
  email: string;
  role_id?: string | null;
  permission_ids?: string[];
  department_id?: string | null;
  position_id?: string | null;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface CreateRoleResponse {
  message: string;
  data: Role;
}

export interface UpdateRoleResponse {
  message: string;
  data: Role;
}

export interface DeleteRoleResponse {
  message: string;
}

export interface CreateInvitationResponse {
  message: string;
  data: Invitation;
}

export interface UpdateMembershipResponse {
  message: string;
  data: Membership;
}

export interface DeleteMembershipResponse {
  message: string;
}

export interface AcceptInvitationResponse {
  message: string;
  data: {
    organization: {
      id: string;
      name: string;
      slug: string;
    };
    membership_id: string;
  };
}

export interface DeclineInvitationResponse {
  message: string;
}

// ─── Department ──────────────────────────────────────────────────────────────

export interface DepartmentManager {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Department {
  id: string;
  name: string;
  organization: string;
  parent: string | null;
  description: string;
  manager: DepartmentManager | null;
  is_active: boolean;
  full_path: string;
  level: number;
  children_count: number;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface DepartmentTree {
  id: string;
  name: string;
  description: string;
  manager: DepartmentManager | null;
  is_active: boolean;
  level: number;
  children: DepartmentTree[];
}

export interface CreateDepartmentData {
  name: string;
  parent_id?: string | null;
  description?: string;
  manager_id?: string | null;
  is_active?: boolean;
}

export interface UpdateDepartmentData {
  name?: string;
  parent_id?: string | null;
  description?: string;
  manager_id?: string | null;
  is_active?: boolean;
}

// ─── Position ────────────────────────────────────────────────────────────────

export type PositionLevel = 'junior' | 'intermediate' | 'senior' | 'lead' | 'manager' | 'director';

export interface Position {
  id: string;
  name: string;
  organization: string;
  department: Department | null;
  description: string;
  level: PositionLevel;
  level_display: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreatePositionData {
  name: string;
  department_id?: string | null;
  description?: string;
  level?: PositionLevel;
  is_active?: boolean;
}

export interface UpdatePositionData {
  name?: string;
  department_id?: string | null;
  description?: string;
  level?: PositionLevel;
  is_active?: boolean;
}

// ─── Position Assignment ─────────────────────────────────────────────────────

export interface PositionAssignment {
  id: string;
  membership: Membership;
  position: Position;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreatePositionAssignmentData {
  membership_id: string;
  position_id: string;
  start_date: string;
  end_date?: string | null;
  is_active?: boolean;
}

export interface UpdatePositionAssignmentData {
  start_date?: string;
  end_date?: string | null;
  is_active?: boolean;
}

// ─── API Responses (Departments & Positions) ─────────────────────────────────

export interface CreateDepartmentResponse {
  message: string;
  data: Department;
}

export interface UpdateDepartmentResponse {
  message: string;
  data: Department;
}

export interface DeleteDepartmentResponse {
  message: string;
}

export interface CreatePositionResponse {
  message: string;
  data: Position;
}

export interface UpdatePositionResponse {
  message: string;
  data: Position;
}

export interface DeletePositionResponse {
  message: string;
}

export interface CreatePositionAssignmentResponse {
  message: string;
  data: PositionAssignment;
}

export interface UpdatePositionAssignmentResponse {
  message: string;
  data: PositionAssignment;
}

export interface DeletePositionAssignmentResponse {
  message: string;
}

// ─── Contract ───────────────────────────────────────────────────────────────

export type ContractType = 'cdi' | 'cdd' | 'freelance' | 'internship' | 'other';
export type ContractStatus = 'active' | 'terminated' | 'suspended';

export interface Contract {
  id: string;
  membership: Membership;
  contract_type: ContractType;
  contract_type_display: string;
  start_date: string;
  end_date: string | null;
  base_salary: string;
  status: ContractStatus;
  status_display: string;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreateContractData {
  membership_id: string;
  contract_type: ContractType;
  start_date: string;
  end_date?: string | null;
  base_salary: string;
  status?: ContractStatus;
  notes?: string;
  /**
   * Si `true` (défaut côté backend), un contrat actif existant pour ce membre
   * sera automatiquement terminé avant la création. Si `false`, la création
   * échoue avec l'erreur structurée `ACTIVE_CONTRACT_EXISTS`.
   */
  close_existing?: boolean;
}

/**
 * Erreur structurée renvoyée par le backend quand `close_existing=false`
 * et qu'un contrat actif existe déjà pour le membre.
 */
export interface ActiveContractExistsError {
  code: "ACTIVE_CONTRACT_EXISTS";
  message: string;
  existing_contract: {
    id: string;
    contract_type: ContractType;
    contract_type_display: string;
    start_date: string;
    end_date: string | null;
    base_salary: string;
  };
}

export interface UpdateContractData {
  contract_type?: ContractType;
  start_date?: string;
  end_date?: string | null;
  base_salary?: string;
  status?: ContractStatus;
  notes?: string;
}

export interface CreateContractResponse {
  message: string;
  data: Contract;
}

export interface UpdateContractResponse {
  message: string;
  data: Contract;
}

export interface DeleteContractResponse {
  message: string;
}

// ─── Payment (EP) ───────────────────────────────────────────────────────────

export type PaymentType = 'salary' | 'bonus' | 'premium' | 'adjustment';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

/**
 * Informations consolidées sur le reviewer / approbateur d'une demande
 * (congé, avance, paiement). Vaut ``null`` pour une demande en attente.
 *
 * - ``type = "member"`` : validé par un membre de l'organisation.
 * - ``type = "owner"``  : validé par le propriétaire (AdminUser) qui n'est
 *   pas membre. ``role`` vaut alors ``null``.
 */
export interface ReviewerInfo {
  type: 'member' | 'owner';
  is_owner: boolean;
  name: string;
  email: string;
  role: string | null;
}

export interface Payment {
  id: string;
  membership: Membership;
  contract: string | null;
  amount: string;
  payment_type: PaymentType;
  payment_type_display: string;
  payment_date: string;
  status: PaymentStatus;
  status_display: string;
  approved_by: Membership | null;
  reviewer: ReviewerInfo | null;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreatePaymentData {
  membership_id: string;
  contract_id?: string | null;
  amount: string;
  payment_type: PaymentType;
  payment_date: string;
  status?: PaymentStatus;
  notes?: string;
}

export interface UpdatePaymentData {
  amount?: string;
  payment_type?: PaymentType;
  payment_date?: string;
  status?: PaymentStatus;
  notes?: string;
}

export interface CreatePaymentResponse {
  message: string;
  data: Payment;
}

export interface UpdatePaymentResponse {
  message: string;
  data: Payment;
}

export interface DeletePaymentResponse {
  message: string;
}

// ─── Advance Request (EP) ───────────────────────────────────────────────────

export type AdvanceRequestStatus = 'pending' | 'approved' | 'rejected';

export interface AdvanceRequest {
  id: string;
  membership: Membership;
  amount: string;
  reason: string;
  request_date: string;
  status: AdvanceRequestStatus;
  status_display: string;
  reviewed_by: Membership | null;
  reviewer: ReviewerInfo | null;
  reviewed_at: string | null;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreateAdvanceRequestData {
  membership_id: string;
  amount: string;
  reason: string;
  request_date: string;
}

export interface ReviewAdvanceRequestData {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface CreateAdvanceRequestResponse {
  message: string;
  data: AdvanceRequest;
}

export interface ReviewAdvanceRequestResponse {
  message: string;
  data: AdvanceRequest;
}

// ─── Leave Balance ──────────────────────────────────────────────────────────

export interface LeaveBalance {
  id: string;
  membership: Membership;
  year: number;
  total_days: string;
  used_days: string;
  remaining_days: string;
  max_days: number;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreateLeaveBalanceData {
  membership_id: string;
  year: number;
  total_days: string;
}

export interface UpdateLeaveBalanceData {
  total_days: string;
}

export interface CreateLeaveBalanceResponse {
  message: string;
  data: LeaveBalance;
}

export interface UpdateLeaveBalanceResponse {
  message: string;
  data: LeaveBalance;
}

export interface DeleteLeaveBalanceResponse {
  message: string;
}

// ─── Leave Request ──────────────────────────────────────────────────────────

export type LeaveType = 'annual' | 'sick' | 'unpaid' | 'other';
export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  membership: Membership;
  leave_type: LeaveType;
  leave_type_display: string;
  start_date: string;
  end_date: string;
  days_count: string;
  reason: string;
  status: LeaveRequestStatus;
  status_display: string;
  reviewed_by: Membership | null;
  reviewer: ReviewerInfo | null;
  reviewed_at: string | null;
  rejection_reason: string;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreateLeaveRequestData {
  membership_id: string;
  leave_type?: LeaveType;
  start_date: string;
  end_date: string;
  days_count: string;
  reason?: string;
}

export interface ReviewLeaveRequestData {
  action: 'approve' | 'reject';
  rejection_reason?: string;
}

export interface CreateLeaveRequestResponse {
  message: string;
  data: LeaveRequest;
}

export interface ReviewLeaveRequestResponse {
  message: string;
  data: LeaveRequest;
}

export interface CancelLeaveRequestResponse {
  message: string;
  data: LeaveRequest;
}
