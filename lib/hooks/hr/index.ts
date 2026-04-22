/**
 * Hooks TanStack Query pour le module HR
 * Gestion des employés, rôles, permissions et invitations
 */

'use client';

import { usePaginatedQuery, type UsePaginatedQueryReturn } from '@/lib/hooks/usePagination';
import {
    advancesService,
    assignmentsService,
    contractsService,
    departmentsService,
    invitationService,
    leaveBalancesService,
    leavesService,
    MemberListParams,
    memberService,
    paymentsService,
    permissionService,
    positionsService,
    roleService,
    type LeaveBalancesListParams,
    type LeavesListParams
} from '@/lib/services/hr';
import type {
    AcceptInvitationResponse,
    AdvanceRequest,
    CancelLeaveRequestResponse,
    Contract,
    CreateAdvanceRequestData,
    CreateAdvanceRequestResponse,
    CreateContractData,
    CreateContractResponse,
    CreateDepartmentData,
    CreateDepartmentResponse,
    CreateInvitationData,
    CreateInvitationResponse,
    CreateLeaveBalanceData,
    CreateLeaveBalanceResponse,
    CreateLeaveRequestData,
    CreateLeaveRequestResponse,
    CreatePaymentData,
    CreatePaymentResponse,
    CreatePositionAssignmentData,
    CreatePositionAssignmentResponse,
    CreatePositionData,
    CreatePositionResponse,
    CreateRoleData,
    CreateRoleResponse,
    DeclineInvitationResponse,
    DeleteContractResponse,
    DeleteDepartmentResponse,
    DeleteLeaveBalanceResponse,
    DeleteMembershipResponse,
    DeletePaymentResponse,
    DeletePositionAssignmentResponse,
    DeletePositionResponse,
    DeleteRoleResponse,
    Department,
    DepartmentTree,
    Invitation,
    LeaveBalance,
    LeaveRequest,
    Membership,
    MyMembership,
    MyOrgPermissions,
    Payment,
    Permission,
    Position,
    PositionAssignment,
    PositionLevel,
    ReviewAdvanceRequestData,
    ReviewAdvanceRequestResponse,
    ReviewLeaveRequestData,
    ReviewLeaveRequestResponse,
    Role,
    UpdateContractData,
    UpdateContractResponse,
    UpdateDepartmentData,
    UpdateDepartmentResponse,
    UpdateLeaveBalanceData,
    UpdateLeaveBalanceResponse,
    UpdateMembershipData,
    UpdateMembershipResponse,
    UpdatePaymentData,
    UpdatePaymentResponse,
    UpdatePositionAssignmentData,
    UpdatePositionAssignmentResponse,
    UpdatePositionData,
    UpdatePositionResponse,
    UpdateRoleData,
    UpdateRoleResponse
} from '@/lib/types';
import type { PaginatedResponse } from '@/lib/types/shared';
import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
    type UseQueryResult,
} from '@tanstack/react-query';

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const hrQueryKeys = {
  // Permissions
  permissions: ['hr', 'permissions'] as const,

  // Rôles
  roles: (orgId: string) => ['hr', 'roles', orgId] as const,
  role: (orgId: string, roleId: string) =>
    ['hr', 'roles', orgId, roleId] as const,

  // Membres
  members: (orgId: string) => ['hr', 'members', orgId] as const,
  member: (orgId: string, memberId: string) =>
    ['hr', 'members', orgId, memberId] as const,
  myMemberships: ['hr', 'my-memberships'] as const,
  myPermissions: (orgId: string) => ['hr', 'my-permissions', orgId] as const,

  // Invitations
  invitations: (orgId: string) => ['hr', 'invitations', orgId] as const,
  pendingInvitations: ['hr', 'invitations', 'pending'] as const,

  // Départements
  departments: (orgId: string) => ['hr', 'departments', orgId] as const,
  department: (orgId: string, deptId: string) =>
    ['hr', 'departments', orgId, deptId] as const,
  departmentTree: (orgId: string) =>
    ['hr', 'departments', orgId, 'tree'] as const,

  // Postes
  positions: (orgId: string) => ['hr', 'positions', orgId] as const,
  position: (orgId: string, posId: string) =>
    ['hr', 'positions', orgId, posId] as const,
  positionMembers: (orgId: string, posId: string) =>
    ['hr', 'positions', orgId, posId, 'members'] as const,

  // Assignations
  assignments: (orgId: string) => ['hr', 'assignments', orgId] as const,
  assignment: (orgId: string, assignId: string) =>
    ['hr', 'assignments', orgId, assignId] as const,
  memberAssignments: (orgId: string, memberId: string) =>
    ['hr', 'members', orgId, memberId, 'assignments'] as const,

  // Contrats
  contracts: (orgId: string) => ['hr', 'contracts', orgId] as const,
  contract: (orgId: string, contractId: string) =>
    ['hr', 'contracts', orgId, contractId] as const,
  memberContracts: (orgId: string, memberId: string) =>
    ['hr', 'members', orgId, memberId, 'contracts'] as const,

  // Paiements
  payments: (orgId: string) => ['hr', 'payments', orgId] as const,
  payment: (orgId: string, paymentId: string) =>
    ['hr', 'payments', orgId, paymentId] as const,
  memberPayments: (orgId: string, memberId: string) =>
    ['hr', 'members', orgId, memberId, 'payments'] as const,

  // Demandes d'avance
  advances: (orgId: string) => ['hr', 'advances', orgId] as const,
  advance: (orgId: string, advanceId: string) =>
    ['hr', 'advances', orgId, advanceId] as const,
  memberAdvances: (orgId: string, memberId: string) =>
    ['hr', 'members', orgId, memberId, 'advances'] as const,

  // Soldes de congés
  leaveBalances: (orgId: string) => ['hr', 'leave-balances', orgId] as const,
  leaveBalance: (orgId: string, balanceId: string) =>
    ['hr', 'leave-balances', orgId, balanceId] as const,
  memberLeaveBalances: (orgId: string, memberId: string) =>
    ['hr', 'members', orgId, memberId, 'leave-balances'] as const,

  // Demandes de congé
  leaves: (orgId: string) => ['hr', 'leaves', orgId] as const,
  leave: (orgId: string, leaveId: string) =>
    ['hr', 'leaves', orgId, leaveId] as const,
  memberLeaves: (orgId: string, memberId: string) =>
    ['hr', 'members', orgId, memberId, 'leaves'] as const,
};

// ─── Permissions ─────────────────────────────────────────────────────────────

/**
 * Liste toutes les permissions disponibles
 */
export function usePermissions(): UseQueryResult<Permission[], Error> {
  return useQuery({
    queryKey: hrQueryKeys.permissions,
    queryFn: () => permissionService.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutes (les permissions changent rarement)
  });
}

/**
 * Récupère les permissions de l'utilisateur connecté dans une organisation
 */
export function useMyPermissions(orgId: string): UseQueryResult<MyOrgPermissions, Error> {
  return useQuery({
    queryKey: hrQueryKeys.myPermissions(orgId),
    queryFn: () => memberService.getMyPermissions(orgId),
    enabled: !!orgId,
    staleTime: 2 * 60 * 1000,
  });
}

// ─── Rôles ───────────────────────────────────────────────────────────────────

/**
 * Liste les rôles d'une organisation
 */
export function useRoles(orgId: string): UseQueryResult<Role[], Error> {
  return useQuery({
    queryKey: hrQueryKeys.roles(orgId),
    queryFn: () => roleService.list(orgId),
    enabled: !!orgId,
  });
}

/**
 * Récupère un rôle spécifique
 */
export function useRole(
  orgId: string,
  roleId: string
): UseQueryResult<Role, Error> {
  return useQuery({
    queryKey: hrQueryKeys.role(orgId, roleId),
    queryFn: () => roleService.get(orgId, roleId),
    enabled: !!orgId && !!roleId,
  });
}

/**
 * Crée un nouveau rôle
 */
export function useCreateRole(): UseMutationResult<
  CreateRoleResponse,
  Error,
  { orgId: string; data: CreateRoleData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }) => roleService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      // Invalider la liste des rôles
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.roles(orgId) });
    },
  });
}

/**
 * Met à jour un rôle
 */
export function useUpdateRole(): UseMutationResult<
  UpdateRoleResponse,
  Error,
  { orgId: string; roleId: string; data: UpdateRoleData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, roleId, data }) =>
      roleService.update(orgId, roleId, data),
    onSuccess: (_, { orgId, roleId }) => {
      // Invalider le rôle et la liste des rôles
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.role(orgId, roleId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.roles(orgId) });
    },
  });
}

/**
 * Supprime un rôle
 */
export function useDeleteRole(): UseMutationResult<
  DeleteRoleResponse,
  Error,
  { orgId: string; roleId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, roleId }) => roleService.delete(orgId, roleId),
    onSuccess: (_, { orgId }) => {
      // Invalider la liste des rôles
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.roles(orgId) });
      // Invalider aussi la liste des membres (car ils peuvent avoir ce rôle)
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.members(orgId) });
    },
  });
}

// ─── Membres ─────────────────────────────────────────────────────────────────

/**
 * Liste les membres d'une organisation (sans pagination)
 */
export function useMembers(
  orgId: string,
  params?: MemberListParams
): UseQueryResult<{
  count: number;
  next: string | null;
  previous: string | null;
  results: Membership[];
}, Error> {
  return useQuery({
    queryKey: [...hrQueryKeys.members(orgId), params],
    queryFn: () => memberService.list(orgId, params),
    enabled: !!orgId,
  });
}

/**
 * Liste les membres d'une organisation avec pagination automatique
 */
export function usePaginatedMembers(
  orgId: string,
  filters?: Omit<MemberListParams, 'page' | 'page_size'>,
  options?: {
    pageSize?: number;
    initialPage?: number;
    enabled?: boolean;
  }
): UsePaginatedQueryReturn<Membership> {
  return usePaginatedQuery<Membership, MemberListParams>({
    queryKey: [...hrQueryKeys.members(orgId)],
    fetchFn: (params) => memberService.list(orgId, params),
    filters,
    pageSize: options?.pageSize ?? 20,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

/**
 * Récupère un membre spécifique
 */
export function useMember(
  orgId: string,
  memberId: string
): UseQueryResult<Membership, Error> {
  return useQuery({
    queryKey: hrQueryKeys.member(orgId, memberId),
    queryFn: () => memberService.get(orgId, memberId),
    enabled: !!orgId && !!memberId,
  });
}

/**
 * Met à jour un membre (rôle, permissions, statut)
 */
export function useUpdateMember(): UseMutationResult<
  UpdateMembershipResponse,
  Error,
  { orgId: string; memberId: string; data: UpdateMembershipData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, memberId, data }) =>
      memberService.update(orgId, memberId, data),
    onSuccess: (_, { orgId, memberId }) => {
      // Invalider le membre et la liste des membres
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.member(orgId, memberId),
      });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.members(orgId) });
    },
  });
}

/**
 * Retire un membre de l'organisation
 */
export function useRemoveMember(): UseMutationResult<
  DeleteMembershipResponse,
  Error,
  { orgId: string; memberId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, memberId }) => memberService.remove(orgId, memberId),
    onSuccess: (_, { orgId }) => {
      // Invalider la liste des membres
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.members(orgId) });
    },
  });
}

// ─── Invitations ─────────────────────────────────────────────────────────────

/**
 * Envoie une invitation
 */
export function useSendInvitation(): UseMutationResult<
  CreateInvitationResponse,
  Error,
  { orgId: string; data: CreateInvitationData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }) => invitationService.send(orgId, data),
    onSuccess: (_, { orgId }) => {
      // Invalider la liste des invitations
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.invitations(orgId),
      });
    },
  });
}

/**
 * Liste les invitations envoyées par une organisation
 */
export function useOrgInvitations(
  orgId: string
): UseQueryResult<Invitation[], Error> {
  return useQuery({
    queryKey: hrQueryKeys.invitations(orgId),
    queryFn: () => invitationService.list(orgId),
    enabled: !!orgId,
  });
}

/**
 * Liste les invitations en attente pour l'utilisateur connecté
 */
export function usePendingInvitations(): UseQueryResult<Invitation[], Error> {
  return useQuery({
    queryKey: hrQueryKeys.pendingInvitations,
    queryFn: () => invitationService.getPending(),
  });
}

/**
 * Accepte une invitation
 */
export function useAcceptInvitation(): UseMutationResult<
  AcceptInvitationResponse,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      invitationService.accept(invitationId),
    onSuccess: () => {
      // Invalider les invitations pending
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.pendingInvitations,
      });
      // Invalider les organizations (car l'utilisateur rejoint une nouvelle org)
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      // Rafraîchir l'utilisateur courant
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
}

/**
 * Refuse une invitation
 */
export function useDeclineInvitation(): UseMutationResult<
  DeclineInvitationResponse,
  Error,
  string
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) =>
      invitationService.decline(invitationId),
    onSuccess: () => {
      // Invalider les invitations pending
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.pendingInvitations,
      });
    },
  });
}

/**
 * Récupère tous les memberships (organisations) de l'utilisateur connecté
 */
export function useMyMemberships(): UseQueryResult<MyMembership[], Error> {
  return useQuery({
    queryKey: hrQueryKeys.myMemberships,
    queryFn: () => memberService.getMyMemberships(),
  });
}

// ─── Départements ────────────────────────────────────────────────────────────

/**
 * Liste les départements d'une organisation
 */
export function useDepartments(
  orgId: string,
  params?: { search?: string; page_size?: string | number }
): UseQueryResult<Department[], Error> {
  return useQuery({
    queryKey: [...hrQueryKeys.departments(orgId), params],
    queryFn: () => departmentsService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

/**
 * Liste les départements d'une organisation avec pagination automatique
 */
export function usePaginatedDepartments(
  orgId: string,
  filters?: { search?: string },
  options?: {
    pageSize?: number;
    initialPage?: number;
    enabled?: boolean;
  }
): UsePaginatedQueryReturn<Department> {
  return usePaginatedQuery<Department, any>({
    queryKey: [...hrQueryKeys.departments(orgId)],
    fetchFn: (params) => departmentsService.getAll(orgId, params) as any,
    filters,
    pageSize: options?.pageSize ?? 10,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

/**
 * Récupère la hiérarchie complète des départements
 */
export function useDepartmentTree(
  orgId: string
): UseQueryResult<DepartmentTree[], Error> {
  return useQuery({
    queryKey: hrQueryKeys.departmentTree(orgId),
    queryFn: () => departmentsService.getTree(orgId),
    enabled: !!orgId,
  });
}

/**
 * Récupère un département spécifique
 */
export function useDepartment(
  orgId: string,
  deptId: string
): UseQueryResult<Department, Error> {
  return useQuery({
    queryKey: hrQueryKeys.department(orgId, deptId),
    queryFn: () => departmentsService.getById(orgId, deptId),
    enabled: !!orgId && !!deptId,
  });
}

/**
 * Crée un nouveau département
 */
export function useCreateDepartment(): UseMutationResult<
  CreateDepartmentResponse,
  Error,
  { orgId: string; data: CreateDepartmentData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }) => departmentsService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.departments(orgId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.departmentTree(orgId) });
    },
  });
}

/**
 * Met à jour un département
 */
export function useUpdateDepartment(): UseMutationResult<
  UpdateDepartmentResponse,
  Error,
  { orgId: string; deptId: string; data: UpdateDepartmentData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, deptId, data }) =>
      departmentsService.update(orgId, deptId, data),
    onSuccess: (_, { orgId, deptId }) => {
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.department(orgId, deptId),
      });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.departments(orgId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.departmentTree(orgId) });
    },
  });
}

/**
 * Supprime un département
 */
export function useDeleteDepartment(): UseMutationResult<
  DeleteDepartmentResponse,
  Error,
  { orgId: string; deptId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, deptId }) => departmentsService.delete(orgId, deptId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.departments(orgId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.departmentTree(orgId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.positions(orgId) });
    },
  });
}

// ─── Postes ──────────────────────────────────────────────────────────────────

/**
 * Liste les postes d'une organisation
 */
export function usePositions(
  orgId: string,
  params?: {
    search?: string;
    department?: string;
    level?: PositionLevel;
    page_size?: string | number;
  }
): UseQueryResult<Position[], Error> {
  return useQuery({
    queryKey: [...hrQueryKeys.positions(orgId), params],
    queryFn: () => positionsService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

/**
 * Liste les postes d'une organisation avec pagination automatique
 */
export function usePaginatedPositions(
  orgId: string,
  filters?: { search?: string; department?: string; level?: PositionLevel },
  options?: {
    pageSize?: number;
    initialPage?: number;
    enabled?: boolean;
  }
): UsePaginatedQueryReturn<Position> {
  return usePaginatedQuery<Position, any>({
    queryKey: [...hrQueryKeys.positions(orgId)],
    fetchFn: (params) => positionsService.getAll(orgId, params) as any,
    filters,
    pageSize: options?.pageSize ?? 10,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

/**
 * Récupère un poste spécifique
 */
export function usePosition(
  orgId: string,
  posId: string
): UseQueryResult<Position, Error> {
  return useQuery({
    queryKey: hrQueryKeys.position(orgId, posId),
    queryFn: () => positionsService.getById(orgId, posId),
    enabled: !!orgId && !!posId,
  });
}

/**
 * Crée un nouveau poste
 */
export function useCreatePosition(): UseMutationResult<
  CreatePositionResponse,
  Error,
  { orgId: string; data: CreatePositionData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }) => positionsService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.positions(orgId) });
    },
  });
}

/**
 * Met à jour un poste
 */
export function useUpdatePosition(): UseMutationResult<
  UpdatePositionResponse,
  Error,
  { orgId: string; posId: string; data: UpdatePositionData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, posId, data }) =>
      positionsService.update(orgId, posId, data),
    onSuccess: (_, { orgId, posId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.position(orgId, posId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.positions(orgId) });
    },
  });
}

/**
 * Supprime un poste
 */
export function useDeletePosition(): UseMutationResult<
  DeletePositionResponse,
  Error,
  { orgId: string; posId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, posId }) => positionsService.delete(orgId, posId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.positions(orgId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.assignments(orgId) });
    },
  });
}

/**
 * Récupère tous les membres assignés à un poste
 */
export function usePositionMembers(
  orgId: string,
  posId: string
): UseQueryResult<PositionAssignment[], Error> {
  return useQuery({
    queryKey: hrQueryKeys.positionMembers(orgId, posId),
    queryFn: () => positionsService.getMembers(orgId, posId),
    enabled: !!orgId && !!posId,
  });
}

// ─── Assignations ────────────────────────────────────────────────────────────

/**
 * Liste les assignations d'une organisation
 */
export function useAssignments(
  orgId: string,
  params?: {
    membership?: string;
    position?: string;
    department?: string;
    is_active?: boolean;
    page_size?: string | number;
  }
): UseQueryResult<PositionAssignment[], Error> {
  return useQuery({
    queryKey: [...hrQueryKeys.assignments(orgId), params],
    queryFn: () => assignmentsService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

/**
 * Récupère une assignation spécifique
 */
export function useAssignment(
  orgId: string,
  assignId: string
): UseQueryResult<PositionAssignment, Error> {
  return useQuery({
    queryKey: hrQueryKeys.assignment(orgId, assignId),
    queryFn: () => assignmentsService.getById(orgId, assignId),
    enabled: !!orgId && !!assignId,
  });
}

/**
 * Récupère toutes les assignations d'un membre
 */
export function useMemberAssignments(
  orgId: string,
  memberId: string
): UseQueryResult<PositionAssignment[], Error> {
  return useQuery({
    queryKey: hrQueryKeys.memberAssignments(orgId, memberId),
    queryFn: () => assignmentsService.getByMember(orgId, memberId),
    enabled: !!orgId && !!memberId,
  });
}

/**
 * Crée une nouvelle assignation
 */
export function useCreateAssignment(): UseMutationResult<
  CreatePositionAssignmentResponse,
  Error,
  { orgId: string; data: CreatePositionAssignmentData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }) => assignmentsService.create(orgId, data),
    onSuccess: (_, { orgId, data }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.assignments(orgId) });
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.memberAssignments(orgId, data.membership_id),
      });
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.positionMembers(orgId, data.position_id),
      });
    },
  });
}

/**
 * Met à jour une assignation
 */
export function useUpdateAssignment(): UseMutationResult<
  UpdatePositionAssignmentResponse,
  Error,
  { orgId: string; assignId: string; data: UpdatePositionAssignmentData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, assignId, data }) =>
      assignmentsService.update(orgId, assignId, data),
    onSuccess: (_, { orgId, assignId }) => {
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.assignment(orgId, assignId),
      });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.assignments(orgId) });
    },
  });
}

/**
 * Supprime une assignation
 */
export function useDeleteAssignment(): UseMutationResult<
  DeletePositionAssignmentResponse,
  Error,
  { orgId: string; assignId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, assignId }) =>
      assignmentsService.delete(orgId, assignId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.assignments(orgId) });
    },
  });
}

// ─── Contrats ─────────────────────────────────────────────────────────────────

/**
 * Liste les contrats d'une organisation
 */
export function useContracts(
  orgId: string,
  params?: { membership?: string; contract_type?: string; status?: string; page_size?: string | number }
): UseQueryResult<Contract[], Error> {
  return useQuery({
    queryKey: [...hrQueryKeys.contracts(orgId), params],
    queryFn: () => contractsService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

/**
 * Récupère un contrat spécifique
 */
export function useContract(
  orgId: string,
  contractId: string
): UseQueryResult<Contract, Error> {
  return useQuery({
    queryKey: hrQueryKeys.contract(orgId, contractId),
    queryFn: () => contractsService.getById(orgId, contractId),
    enabled: !!orgId && !!contractId,
  });
}

/**
 * Liste les contrats d'un membre
 */
export function useMemberContracts(
  orgId: string,
  membershipId: string
): UseQueryResult<Contract[], Error> {
  return useQuery({
    queryKey: hrQueryKeys.memberContracts(orgId, membershipId),
    queryFn: () => contractsService.getByMember(orgId, membershipId),
    enabled: !!orgId && !!membershipId,
  });
}

/**
 * Crée un nouveau contrat
 */
export function useCreateContract(): UseMutationResult<
  CreateContractResponse,
  Error,
  { orgId: string; data: CreateContractData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }) => contractsService.create(orgId, data),
    onSuccess: (_, { orgId, data }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.contracts(orgId) });
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.memberContracts(orgId, data.membership_id),
      });
    },
  });
}

/**
 * Met à jour un contrat
 */
export function useUpdateContract(): UseMutationResult<
  UpdateContractResponse,
  Error,
  { orgId: string; contractId: string; data: UpdateContractData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, contractId, data }) =>
      contractsService.update(orgId, contractId, data),
    onSuccess: (_, { orgId, contractId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.contract(orgId, contractId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.contracts(orgId) });
    },
  });
}

/**
 * Supprime un contrat
 */
export function useDeleteContract(): UseMutationResult<
  DeleteContractResponse,
  Error,
  { orgId: string; contractId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, contractId }) =>
      contractsService.delete(orgId, contractId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.contracts(orgId) });
    },
  });
}

// ─── Paiements (EP) ──────────────────────────────────────────────────────────

/**
 * Liste les paiements d'une organisation
 */
export function usePayments(
  orgId: string,
  params?: { membership?: string; payment_type?: string; status?: string; page_size?: string | number }
): UseQueryResult<Payment[], Error> {
  return useQuery({
    queryKey: [...hrQueryKeys.payments(orgId), params],
    queryFn: () => paymentsService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

/**
 * Récupère un paiement spécifique
 */
export function usePayment(
  orgId: string,
  paymentId: string
): UseQueryResult<Payment, Error> {
  return useQuery({
    queryKey: hrQueryKeys.payment(orgId, paymentId),
    queryFn: () => paymentsService.getById(orgId, paymentId),
    enabled: !!orgId && !!paymentId,
  });
}

/**
 * Liste les paiements d'un membre
 */
export function useMemberPayments(
  orgId: string,
  membershipId: string
): UseQueryResult<Payment[], Error> {
  return useQuery({
    queryKey: hrQueryKeys.memberPayments(orgId, membershipId),
    queryFn: () => paymentsService.getByMember(orgId, membershipId),
    enabled: !!orgId && !!membershipId,
  });
}

/**
 * Crée un nouveau paiement
 */
export function useCreatePayment(): UseMutationResult<
  CreatePaymentResponse,
  Error,
  { orgId: string; data: CreatePaymentData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }) => paymentsService.create(orgId, data),
    onSuccess: (_, { orgId, data }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.payments(orgId) });
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.memberPayments(orgId, data.membership_id),
      });
    },
  });
}

/**
 * Met à jour un paiement
 */
export function useUpdatePayment(): UseMutationResult<
  UpdatePaymentResponse,
  Error,
  { orgId: string; paymentId: string; data: UpdatePaymentData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, paymentId, data }) =>
      paymentsService.update(orgId, paymentId, data),
    onSuccess: (_, { orgId, paymentId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.payment(orgId, paymentId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.payments(orgId) });
    },
  });
}

/**
 * Supprime un paiement
 */
export function useDeletePayment(): UseMutationResult<
  DeletePaymentResponse,
  Error,
  { orgId: string; paymentId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, paymentId }) =>
      paymentsService.delete(orgId, paymentId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.payments(orgId) });
    },
  });
}

// ─── Demandes d'avance (EP) ──────────────────────────────────────────────────

/**
 * Liste les demandes d'avance d'une organisation
 */
export function useAdvanceRequests(
  orgId: string,
  params?: { membership?: string; status?: string; page_size?: string | number }
): UseQueryResult<AdvanceRequest[], Error> {
  return useQuery({
    queryKey: [...hrQueryKeys.advances(orgId), params],
    queryFn: () => advancesService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

/**
 * Récupère une demande d'avance spécifique
 */
export function useAdvanceRequest(
  orgId: string,
  advanceId: string
): UseQueryResult<AdvanceRequest, Error> {
  return useQuery({
    queryKey: hrQueryKeys.advance(orgId, advanceId),
    queryFn: () => advancesService.getById(orgId, advanceId),
    enabled: !!orgId && !!advanceId,
  });
}

/**
 * Liste les demandes d'avance d'un membre
 */
export function useMemberAdvanceRequests(
  orgId: string,
  membershipId: string
): UseQueryResult<AdvanceRequest[], Error> {
  return useQuery({
    queryKey: hrQueryKeys.memberAdvances(orgId, membershipId),
    queryFn: () => advancesService.getByMember(orgId, membershipId),
    enabled: !!orgId && !!membershipId,
  });
}

/**
 * Crée une nouvelle demande d'avance
 */
export function useCreateAdvanceRequest(): UseMutationResult<
  CreateAdvanceRequestResponse,
  Error,
  { orgId: string; data: CreateAdvanceRequestData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }) => advancesService.create(orgId, data),
    onSuccess: (_, { orgId, data }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.advances(orgId) });
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.memberAdvances(orgId, data.membership_id),
      });
    },
  });
}

/**
 * Approuve ou rejette une demande d'avance
 */
export function useReviewAdvanceRequest(): UseMutationResult<
  ReviewAdvanceRequestResponse,
  Error,
  { orgId: string; advanceId: string; data: ReviewAdvanceRequestData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, advanceId, data }) =>
      advancesService.review(orgId, advanceId, data),
    onSuccess: (_, { orgId, advanceId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.advance(orgId, advanceId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.advances(orgId) });
    },
  });
}

// ─── Soldes de congés ────────────────────────────────────────────────────────

/**
 * Liste les soldes de congés d'une organisation.
 * Normalise la réponse : `PaginatedResponse<T> | T[]` → `T[]`.
 * Pour la variante paginée côté serveur, voir `useLeaveBalancesPaginated`.
 */
export function useLeaveBalances(
  orgId: string,
  params?: LeaveBalancesListParams,
): UseQueryResult<LeaveBalance[], Error> {
  return useQuery({
    queryKey: [...hrQueryKeys.leaveBalances(orgId), params],
    queryFn: async () => {
      const res = await leaveBalancesService.getAll(orgId, params);
      return Array.isArray(res) ? res : res.results;
    },
    enabled: !!orgId,
  });
}

/**
 * Liste paginée (côté serveur) des soldes de congés.
 * Idéal pour les gros jeux de données avec recherche / filtres.
 */
export function useLeaveBalancesPaginated(
  orgId: string,
  filters: Omit<LeaveBalancesListParams, 'page' | 'page_size'> = {},
  options: { pageSize?: number; enabled?: boolean } = {},
): UsePaginatedQueryReturn<LeaveBalance> {
  return usePaginatedQuery<LeaveBalance>({
    queryKey: [...hrQueryKeys.leaveBalances(orgId), 'paginated'],
    fetchFn: (params) =>
      leaveBalancesService.getAll(
        orgId,
        params as LeaveBalancesListParams,
      ) as Promise<PaginatedResponse<LeaveBalance>>,
    filters: filters as Record<string, string | number | boolean | undefined>,
    pageSize: options.pageSize ?? 10,
    enabled: (options.enabled ?? true) && !!orgId,
  });
}

/**
 * Récupère un solde spécifique
 */
export function useLeaveBalance(
  orgId: string,
  balanceId: string,
): UseQueryResult<LeaveBalance, Error> {
  return useQuery({
    queryKey: hrQueryKeys.leaveBalance(orgId, balanceId),
    queryFn: () => leaveBalancesService.getById(orgId, balanceId),
    enabled: !!orgId && !!balanceId,
  });
}

/**
 * Liste les soldes d'un membre (toutes années)
 */
export function useMemberLeaveBalances(
  orgId: string,
  membershipId: string,
): UseQueryResult<LeaveBalance[], Error> {
  return useQuery({
    queryKey: hrQueryKeys.memberLeaveBalances(orgId, membershipId),
    queryFn: () => leaveBalancesService.getByMember(orgId, membershipId),
    enabled: !!orgId && !!membershipId,
  });
}

/**
 * Crée un nouveau solde de congés
 */
export function useCreateLeaveBalance(): UseMutationResult<
  CreateLeaveBalanceResponse,
  Error,
  { orgId: string; data: CreateLeaveBalanceData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }) => leaveBalancesService.create(orgId, data),
    onSuccess: (_, { orgId, data }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveBalances(orgId) });
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.memberLeaveBalances(orgId, data.membership_id),
      });
    },
  });
}

/**
 * Met à jour un solde (total_days uniquement)
 */
export function useUpdateLeaveBalance(): UseMutationResult<
  UpdateLeaveBalanceResponse,
  Error,
  { orgId: string; balanceId: string; data: UpdateLeaveBalanceData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, balanceId, data }) =>
      leaveBalancesService.update(orgId, balanceId, data),
    onSuccess: (_, { orgId, balanceId }) => {
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.leaveBalance(orgId, balanceId),
      });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveBalances(orgId) });
    },
  });
}

/**
 * Supprime un solde
 */
export function useDeleteLeaveBalance(): UseMutationResult<
  DeleteLeaveBalanceResponse,
  Error,
  { orgId: string; balanceId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, balanceId }) =>
      leaveBalancesService.delete(orgId, balanceId),
    onSuccess: (_, { orgId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveBalances(orgId) });
    },
  });
}

// ─── Demandes de congé ───────────────────────────────────────────────────────

/**
 * Liste les demandes de congé d'une organisation.
 * Normalise la réponse : `PaginatedResponse<T> | T[]` → `T[]`.
 * Pour la variante paginée côté serveur, voir `useLeaveRequestsPaginated`.
 */
export function useLeaveRequests(
  orgId: string,
  params?: LeavesListParams,
): UseQueryResult<LeaveRequest[], Error> {
  return useQuery({
    queryKey: [...hrQueryKeys.leaves(orgId), params],
    queryFn: async () => {
      const res = await leavesService.getAll(orgId, params);
      return Array.isArray(res) ? res : res.results;
    },
    enabled: !!orgId,
  });
}

/**
 * Liste paginée (côté serveur) des demandes de congé.
 * Idéal pour l'onglet "à valider" avec recherche + filtres.
 */
export function useLeaveRequestsPaginated(
  orgId: string,
  filters: Omit<LeavesListParams, 'page' | 'page_size'> = {},
  options: { pageSize?: number; enabled?: boolean } = {},
): UsePaginatedQueryReturn<LeaveRequest> {
  return usePaginatedQuery<LeaveRequest>({
    queryKey: [...hrQueryKeys.leaves(orgId), 'paginated'],
    fetchFn: (params) =>
      leavesService.getAll(
        orgId,
        params as LeavesListParams,
      ) as Promise<PaginatedResponse<LeaveRequest>>,
    filters: filters as Record<string, string | number | boolean | undefined>,
    pageSize: options.pageSize ?? 10,
    enabled: (options.enabled ?? true) && !!orgId,
  });
}

/**
 * Récupère une demande de congé spécifique
 */
export function useLeaveRequest(
  orgId: string,
  leaveId: string,
): UseQueryResult<LeaveRequest, Error> {
  return useQuery({
    queryKey: hrQueryKeys.leave(orgId, leaveId),
    queryFn: () => leavesService.getById(orgId, leaveId),
    enabled: !!orgId && !!leaveId,
  });
}

/**
 * Liste les demandes de congé d'un membre
 */
export function useMemberLeaveRequests(
  orgId: string,
  membershipId: string,
): UseQueryResult<LeaveRequest[], Error> {
  return useQuery({
    queryKey: hrQueryKeys.memberLeaves(orgId, membershipId),
    queryFn: () => leavesService.getByMember(orgId, membershipId),
    enabled: !!orgId && !!membershipId,
  });
}

/**
 * Crée une nouvelle demande de congé
 */
export function useCreateLeaveRequest(): UseMutationResult<
  CreateLeaveRequestResponse,
  Error,
  { orgId: string; data: CreateLeaveRequestData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }) => leavesService.create(orgId, data),
    onSuccess: (_, { orgId, data }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaves(orgId) });
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.memberLeaves(orgId, data.membership_id),
      });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveBalances(orgId) });
      queryClient.invalidateQueries({
        queryKey: hrQueryKeys.memberLeaveBalances(orgId, data.membership_id),
      });
    },
  });
}

/**
 * Approuve ou rejette une demande de congé
 */
export function useReviewLeaveRequest(): UseMutationResult<
  ReviewLeaveRequestResponse,
  Error,
  { orgId: string; leaveId: string; data: ReviewLeaveRequestData }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, leaveId, data }) =>
      leavesService.review(orgId, leaveId, data),
    onSuccess: (_, { orgId, leaveId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leave(orgId, leaveId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaves(orgId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveBalances(orgId) });
    },
  });
}

/**
 * Annule une demande de congé
 */
export function useCancelLeaveRequest(): UseMutationResult<
  CancelLeaveRequestResponse,
  Error,
  { orgId: string; leaveId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, leaveId }) => leavesService.cancel(orgId, leaveId),
    onSuccess: (_, { orgId, leaveId }) => {
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leave(orgId, leaveId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaves(orgId) });
      queryClient.invalidateQueries({ queryKey: hrQueryKeys.leaveBalances(orgId) });
    },
  });
}

// ─── Analytics (dashboard HR) ────────────────────────────────────────────────

export {
    hrAnalyticsKeys,
    useHRContractsAnalytics,
    useHRHeadcountAnalytics,
    useHRLeavesAnalytics,
    useHROverviewAnalytics,
    useHRPayrollAnalytics,
    useHRPendingActions
} from './analytics';

