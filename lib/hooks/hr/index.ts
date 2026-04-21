/**
 * Hooks TanStack Query pour le module HR
 * Gestion des employés, rôles, permissions et invitations
 */

'use client';

import {
    invitationService,
    MemberListParams,
    memberService,
    permissionService,
    roleService,
} from '@/lib/services/hr';
import type {
    AcceptInvitationResponse,
    CreateInvitationData,
    CreateInvitationResponse,
    CreateRoleData,
    CreateRoleResponse,
    DeclineInvitationResponse,
    DeleteMembershipResponse,
    DeleteRoleResponse,
    Invitation,
    Membership,
    MyMembership,
    Permission,
    Role,
    UpdateMembershipData,
    UpdateMembershipResponse,
    UpdateRoleData,
    UpdateRoleResponse,
} from '@/lib/types';
import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
    type UseQueryResult,
} from '@tanstack/react-query';
import { usePaginatedQuery, type UsePaginatedQueryReturn } from '@/lib/hooks/usePagination';

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

  // Invitations
  invitations: (orgId: string) => ['hr', 'invitations', orgId] as const,
  pendingInvitations: ['hr', 'invitations', 'pending'] as const,
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
