/**
 * Tests pour les hooks Core (useOrganizations, useCategories, settings, mutations).
 */

import { tokenManager } from '@/lib/api';
import {
  useCategories,
  useCreateOrganization,
  useOrganization,
  useOrganizationSettings,
  useToggleOrganization,
  useUpdateOrganization,
  useUpdateOrganizationSettings,
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

// ============================================================================
// ORGANIZATION SETTINGS
// ============================================================================

describe('useOrganizationSettings', () => {
  beforeEach(() => {
    tokenManager.setTokens('mock_access_token', 'mock_refresh_token');
  });

  it('récupère les settings par défaut', async () => {
    const { result } = renderHook(() => useOrganizationSettings('org-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const settings = result.current.data!;
    expect(settings.primary_color).toBe('#6366F1');
    expect(settings.secondary_color).toBe('#E5E7EB');
    expect(settings.font_family).toBe('Inter');
    expect(settings.tax_rate).toBe('18.00');
    expect(settings.invoice_prefix).toBe('FAC');
    expect(settings.receipt_prefix).toBe('REC');
  });

  it('contient tous les champs attendus', async () => {
    const { result } = renderHook(() => useOrganizationSettings('org-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const settings = result.current.data!;
    expect(settings).toHaveProperty('id');
    expect(settings).toHaveProperty('organization');
    expect(settings).toHaveProperty('primary_color');
    expect(settings).toHaveProperty('secondary_color');
    expect(settings).toHaveProperty('font_family');
    expect(settings).toHaveProperty('address');
    expect(settings).toHaveProperty('phone');
    expect(settings).toHaveProperty('email');
    expect(settings).toHaveProperty('website');
    expect(settings).toHaveProperty('tax_id');
    expect(settings).toHaveProperty('tax_rate');
    expect(settings).toHaveProperty('invoice_footer');
    expect(settings).toHaveProperty('invoice_prefix');
    expect(settings).toHaveProperty('receipt_prefix');
  });

  it('retourne 404 pour une org inexistante', async () => {
    const { result } = renderHook(() => useOrganizationSettings('org-unknown'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('ne fait pas de requête si orgId est vide', async () => {
    const { result } = renderHook(() => useOrganizationSettings(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useUpdateOrganizationSettings', () => {
  beforeEach(() => {
    tokenManager.setTokens('mock_access_token', 'mock_refresh_token');
  });

  it('met à jour les couleurs', async () => {
    const { result } = renderHook(() => useUpdateOrganizationSettings(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      orgId: 'org-1',
      data: { primary_color: '#FF5500', secondary_color: '#000000' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.primary_color).toBe('#FF5500');
    expect(result.current.data!.secondary_color).toBe('#000000');
  });

  it('met à jour la police', async () => {
    const { result } = renderHook(() => useUpdateOrganizationSettings(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      orgId: 'org-2',
      data: { font_family: 'Roboto' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.font_family).toBe('Roboto');
  });

  it('met à jour les coordonnées', async () => {
    const { result } = renderHook(() => useUpdateOrganizationSettings(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      orgId: 'org-1',
      data: {
        address: '123 Rue Test',
        phone: '+224621000000',
        email: 'test@acme.com',
        website: 'https://acme.com',
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.address).toBe('123 Rue Test');
    expect(result.current.data!.phone).toBe('+224621000000');
    expect(result.current.data!.email).toBe('test@acme.com');
  });

  it('met à jour les infos fiscales et préfixes', async () => {
    const { result } = renderHook(() => useUpdateOrganizationSettings(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      orgId: 'org-1',
      data: {
        tax_id: 'NIF-999',
        tax_rate: '10.00',
        invoice_prefix: 'INV',
        receipt_prefix: 'RCT',
        invoice_footer: 'Merci !',
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data!.tax_id).toBe('NIF-999');
    expect(result.current.data!.tax_rate).toBe('10.00');
    expect(result.current.data!.invoice_prefix).toBe('INV');
    expect(result.current.data!.receipt_prefix).toBe('RCT');
    expect(result.current.data!.invoice_footer).toBe('Merci !');
  });
});
