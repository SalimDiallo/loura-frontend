import { useLogout } from '@/lib/hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useLogout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should logout successfully', async () => {
    // Simuler un utilisateur connecté
    localStorage.setItem('loura_access_token', 'mock_access_token');
    localStorage.setItem('loura_refresh_token', 'mock_refresh_token');
    localStorage.setItem('loura_user', JSON.stringify({ id: '1', email: 'test@example.com' }));

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      message: 'Logout successful',
    });
  });

  it('should clear all localStorage data on logout', async () => {
    // Pré-remplir localStorage
    localStorage.setItem('loura_access_token', 'mock_access_token');
    localStorage.setItem('loura_refresh_token', 'mock_refresh_token');
    localStorage.setItem('loura_user', JSON.stringify({ id: '1' }));
    localStorage.setItem('current_organization_slug', 'test-org');

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Vérifier que tout est nettoyé
    expect(localStorage.getItem('loura_access_token')).toBeNull();
    expect(localStorage.getItem('loura_refresh_token')).toBeNull();
    expect(localStorage.getItem('loura_user')).toBeNull();
    expect(localStorage.getItem('current_organization_slug')).toBeNull();
  });

  it('should clear localStorage even on logout error', async () => {
    localStorage.setItem('loura_access_token', 'mock_access_token');
    localStorage.setItem('loura_refresh_token', 'invalid_token');
    localStorage.setItem('loura_user', JSON.stringify({ id: '1' }));

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    // Même en cas d'erreur, le localStorage doit être nettoyé
    await waitFor(() => {
      expect(localStorage.getItem('loura_access_token')).toBeNull();
      expect(localStorage.getItem('loura_refresh_token')).toBeNull();
    });
  });

  it('should work when no refresh token is present', async () => {
    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      message: expect.any(String),
    });
  });
});
