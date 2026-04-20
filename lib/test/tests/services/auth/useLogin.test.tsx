import { useLogin } from '@/lib/hooks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

// Wrapper pour les tests
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

describe('useLogin', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should login successfully with valid credentials', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: 'test@example.com',
      password: 'password123',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      user: {
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        user_type: 'admin',
      },
      access: 'mock_access_token',
      refresh: 'mock_refresh_token',
    });

    // Vérifier que les tokens sont stockés dans localStorage
    expect(localStorage.getItem('loura_access_token')).toBe('mock_access_token');
    expect(localStorage.getItem('loura_refresh_token')).toBe('mock_refresh_token');
  });

  it('should fail with invalid credentials', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: 'wrong@example.com',
      password: 'wrongpassword',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(localStorage.getItem('loura_access_token')).toBeNull();
  });

  it('should store user data in localStorage on success', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      email: 'test@example.com',
      password: 'password123',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const storedUser = localStorage.getItem('loura_user');
    expect(storedUser).toBeDefined();

    if (storedUser) {
      const user = JSON.parse(storedUser);
      expect(user.email).toBe('test@example.com');
    }
  });

  it('should set loading state during login', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    result.current.mutate({
      email: 'test@example.com',
      password: 'password123',
    });

    // Pendant la mutation
    expect(result.current.isPending).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Après succès
    expect(result.current.isPending).toBe(false);
  });
});
