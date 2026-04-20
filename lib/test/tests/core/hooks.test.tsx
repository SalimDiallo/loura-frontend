/**
 * Tests pour les hooks Core (useOrganizations, useCategories, mutations).
 */

import { tokenManager } from '@/lib/api';
import {
  useCategories,
  useCreateOrganization,
  useOrganization,
  useToggleOrganization,
  useUpdateOrganization
} from '@/lib/hooks/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

// ============================================================================
// WRAPPER
// ============================================================================

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// ============================================================================
// TESTS
// ============================================================================

describe('useCategories', () => {
  beforeEach(() => {
    tokenManager.setTokens('mock_access_token', 'mock_refresh_token');
  });

  it('récupère la liste des catégories', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
    expect(result.current.data![0].name).toBe('Commerce');
    expect(result.current.data![1].name).toBe('Santé');
    expect(result.current.data![2].name).toBe('Technologie');
  });

  it('chaque catégorie contient id, name, description, icon', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cat = result.current.data![0];
    expect(cat).toHaveProperty('id');
    expect(cat).toHaveProperty('name');
    expect(cat).toHaveProperty('description');
    expect(cat).toHaveProperty('icon');
  });
});

describe('useOrganization', () => {
  beforeEach(() => {
    tokenManager.setTokens('mock_access_token', 'mock_refresh_token');
  });

  it('récupère une organisation par ID', async () => {
    const { result } = renderHook(() => useOrganization('org-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.name).toBe('Acme Corp');
    expect(result.current.data!.slug).toBe('acme-corp');
    expect(result.current.data!.country).toBe('Guinée');
    expect(result.current.data!.currency).toBe('GNF');
    expect(result.current.data!.is_active).toBe(true);
  });

  it('retourne une 404 pour un ID inexistant', async () => {
    const { result } = renderHook(() => useOrganization('org-unknown'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('ne fait pas de requête si l\'ID est vide', async () => {
    const { result } = renderHook(() => useOrganization(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateOrganization', () => {
  beforeEach(() => {
    tokenManager.setTokens('mock_access_token', 'mock_refresh_token');
  });

  it('crée une organisation avec succès', async () => {
    const { result } = renderHook(() => useCreateOrganization(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Nouvelle Org',
      category_id: 'cat-1',
      country: 'Guinée',
      currency: 'GNF',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.name).toBe('Nouvelle Org');
    expect(result.current.data!.is_active).toBe(true);
  });

  it('échoue si le nom est vide', async () => {
    const { result } = renderHook(() => useCreateOrganization(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ name: '' });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateOrganization', () => {
  beforeEach(() => {
    tokenManager.setTokens('mock_access_token', 'mock_refresh_token');
  });

  it('met à jour une organisation', async () => {
    const { result } = renderHook(() => useUpdateOrganization(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 'org-1',
      data: { name: 'Acme Updated', country: 'France' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useToggleOrganization', () => {
  beforeEach(() => {
    tokenManager.setTokens('mock_access_token', 'mock_refresh_token');
  });

  it('désactive une organisation active', async () => {
    const { result } = renderHook(() => useToggleOrganization(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'org-1', isActive: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('active une organisation inactive', async () => {
    const { result } = renderHook(() => useToggleOrganization(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id: 'org-3', isActive: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
