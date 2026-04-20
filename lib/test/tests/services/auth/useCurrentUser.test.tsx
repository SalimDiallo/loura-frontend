import { useCurrentUser, useIsAdmin, useIsAuthenticated } from '@/lib/hooks';
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

describe('useCurrentUser', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should fetch current user when authenticated', async () => {
    localStorage.setItem('loura_access_token', 'mock_access_token');

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      user_type: 'admin',
    });
  });

  it('should not fetch when no token is present', () => {
    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should update localStorage with fresh user data', async () => {
    localStorage.setItem('loura_access_token', 'mock_access_token');

    const { result } = renderHook(() => useCurrentUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const storedUser = localStorage.getItem('loura_user');
    expect(storedUser).toBeDefined();

    if (storedUser) {
      const user = JSON.parse(storedUser);
      expect(user.email).toBe('test@example.com');
    }
  });
});

describe('useIsAuthenticated', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return true when user is authenticated', async () => {
    localStorage.setItem('loura_access_token', 'mock_access_token');

    const { result } = renderHook(() => useIsAuthenticated(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user).toBeDefined();
  });

  it('should return false when user is not authenticated', () => {
    const { result } = renderHook(() => useIsAuthenticated(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeUndefined();
  });
});

describe('useIsAdmin', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return true for admin users', async () => {
    localStorage.setItem('loura_access_token', 'mock_access_token');

    const { result } = renderHook(() => useIsAdmin(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isAdmin).toBe(true));
  });

  it('should return false when no user is logged in', () => {
    const { result } = renderHook(() => useIsAdmin(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isAdmin).toBe(false);
  });
});
