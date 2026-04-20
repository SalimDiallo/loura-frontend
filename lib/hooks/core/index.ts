/**
 * Hooks TanStack Query pour le module Core (organisations + catégories)
 */

import { usePaginatedQuery } from '@/lib/hooks/usePagination';
import { categoryService, organizationService } from '@/lib/services/core';
import type { CreateOrganizationData } from '@/lib/types/core';
import type { FilterParams } from '@/lib/types/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const coreQueryKeys = {
  organizations: ['organizations'] as const,
  organization: (id: string) => ['organizations', id] as const,
  categories: ['categories'] as const,
};

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * Récupère toutes les catégories (pour QuickSelect).
 */
export function useCategories() {
  return useQuery({
    queryKey: coreQueryKeys.categories,
    queryFn: () => categoryService.getAll(),
  });
}

// ============================================================================
// ORGANIZATIONS
// ============================================================================

/**
 * Liste paginée des organisations de l'utilisateur.
 */
export function useOrganizations(filters?: Omit<FilterParams, 'page' | 'page_size'>) {
  return usePaginatedQuery({
    queryKey: coreQueryKeys.organizations,
    fetchFn: (params) => organizationService.list(params),
    filters,
  });
}

/**
 * Récupère une seule organisation par ID.
 */
export function useOrganization(id: string) {
  return useQuery({
    queryKey: coreQueryKeys.organization(id),
    queryFn: () => organizationService.getById(id),
    enabled: !!id,
  });
}

/**
 * Mutation de création d'organisation (onboarding).
 */
export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationData) =>
      organizationService.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coreQueryKeys.organizations });
    },
  });
}

/**
 * Mutation d'upload de logo.
 */
export function useUploadOrganizationLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      organizationService.uploadLogo(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coreQueryKeys.organizations });
    },
  });
}

/**
 * Mutation de mise à jour d'organisation.
 */
export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      organizationService.update(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coreQueryKeys.organizations });
    },
  });
}

/**
 * Mutation d'activation/désactivation.
 */
export function useToggleOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      organizationService.toggleActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coreQueryKeys.organizations });
    },
  });
}

