/**
 * Hooks TanStack Query pour le module Core (organisations + catégories + settings)
 */

import { usePaginatedQuery } from '@/lib/hooks/usePagination';
import {
    categoryService,
    moduleCatalogService,
    organizationModuleService,
    organizationService,
    settingsService,
} from '@/lib/services/core';
import type {
    CreateOrganizationData,
    ModuleCode,
    UpdateOrganizationSettingsData,
} from '@/lib/types/core';
import type { FilterParams } from '@/lib/types/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const coreQueryKeys = {
  organizations: ['organizations'] as const,
  organization: (id: string) => ['organizations', id] as const,
  organizationSettings: (id: string) => ['organizations', id, 'settings'] as const,
  organizationModules: (id: string) => ['organizations', id, 'modules'] as const,
  categories: ['categories'] as const,
  modulesCatalog: ['modules-catalog'] as const,
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
    queryKey: [...coreQueryKeys.organizations],
    fetchFn: (params) => organizationService.list(params),
    filters,
    pageSize: 5,
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

// ============================================================================
// ORGANIZATION SETTINGS
// ============================================================================

/**
 * Récupère les settings d'une organisation.
 */
export function useOrganizationSettings(orgId: string) {
  return useQuery({
    queryKey: coreQueryKeys.organizationSettings(orgId),
    queryFn: () => settingsService.get(orgId),
    enabled: !!orgId,
  });
}

/**
 * Mutation de mise à jour des settings.
 */
export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orgId, data }: { orgId: string; data: UpdateOrganizationSettingsData }) =>
      settingsService.update(orgId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: coreQueryKeys.organizationSettings(variables.orgId),
      });
    },
  });
}

// ============================================================================
// MODULES (catalogue + installations)
// ============================================================================

/**
 * Catalogue des modules disponibles (HR, Inventory, Services…).
 * Ne dépend pas de l'organisation : une seule requête partagée.
 */
export function useModulesCatalog() {
  return useQuery({
    queryKey: coreQueryKeys.modulesCatalog,
    queryFn: () => moduleCatalogService.getAll(),
    staleTime: 5 * 60_000,
  });
}

/**
 * Modules installés sur une organisation donnée.
 */
export function useOrganizationModules(orgId: string) {
  return useQuery({
    queryKey: coreQueryKeys.organizationModules(orgId),
    queryFn: () => organizationModuleService.list(orgId),
    enabled: !!orgId,
  });
}

/**
 * Installe un module sur une organisation.
 */
export function useInstallOrganizationModule(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: ModuleCode) =>
      organizationModuleService.install(orgId, code),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: coreQueryKeys.organizationModules(orgId),
      });
      queryClient.invalidateQueries({ queryKey: coreQueryKeys.organization(orgId) });
    },
  });
}

/**
 * Active / désactive une installation existante (toggle).
 */
export function useToggleOrganizationModule(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ installationId, isEnabled }: { installationId: string; isEnabled: boolean }) =>
      organizationModuleService.setEnabled(orgId, installationId, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: coreQueryKeys.organizationModules(orgId),
      });
      queryClient.invalidateQueries({ queryKey: coreQueryKeys.organization(orgId) });
    },
  });
}

/**
 * Désinstalle un module (suppression dure de la ligne).
 */
export function useUninstallOrganizationModule(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (installationId: string) =>
      organizationModuleService.uninstall(orgId, installationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: coreQueryKeys.organizationModules(orgId),
      });
      queryClient.invalidateQueries({ queryKey: coreQueryKeys.organization(orgId) });
    },
  });
}
