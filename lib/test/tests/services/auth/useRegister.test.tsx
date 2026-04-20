import { useRegister } from '@/lib/hooks';
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

describe('useRegister', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should register successfully with valid data', async () => {
    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: 'newuser@example.com',
      password: 'SecurePass123',
      first_name: 'New',
      last_name: 'User',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      user: {
        email: 'newuser@example.com',
        first_name: 'New',
        last_name: 'User',
        user_type: 'admin',
      },
      access: 'mock_access_token',
      refresh: 'mock_refresh_token',
    });

    // Vérifier que les tokens sont stockés
    expect(localStorage.getItem('loura_access_token')).toBe('mock_access_token');
    expect(localStorage.getItem('loura_refresh_token')).toBe('mock_refresh_token');
  });

  it('should fail when email already exists', async () => {
    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: 'existing@example.com',
      password: 'SecurePass123',
      first_name: 'Existing',
      last_name: 'User',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(localStorage.getItem('loura_access_token')).toBeNull();
  });

  it('should authenticate user automatically after registration', async () => {
    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: 'auto@example.com',
      password: 'SecurePass123',
      first_name: 'Auto',
      last_name: 'Login',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Vérifier que l'utilisateur est authentifié
    expect(localStorage.getItem('loura_access_token')).toBeTruthy();
    expect(localStorage.getItem('loura_user')).toBeTruthy();
  });

  it('should clean localStorage on registration error', async () => {
    const { result } = renderHook(() => useRegister(), {
      wrapper: createWrapper(),
    });

    // Pré-remplir localStorage pour tester le nettoyage
    localStorage.setItem('loura_access_token', 'old_token');
    localStorage.setItem('loura_refresh_token', 'old_refresh');

    result.current.mutate({
      email: 'existing@example.com',
      password: 'SecurePass123',
      first_name: 'Fail',
      last_name: 'User',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Vérifier que le localStorage est nettoyé
    expect(localStorage.getItem('loura_access_token')).toBeNull();
    expect(localStorage.getItem('loura_refresh_token')).toBeNull();
  });
});
