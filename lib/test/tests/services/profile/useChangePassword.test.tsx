import { useChangePassword } from '@/lib/hooks/profile/useChangePassword';
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useChangePassword', () => {
  beforeEach(() => {
    localStorage.clear();
    // Simuler un token d'authentification
    localStorage.setItem('loura_access_token', 'mock_access_token');
  });

  it('should change password successfully', async () => {
    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    });

    const passwordData = {
      old_password: 'OldPassword123!',
      new_password: 'NewPassword456!',
      new_password_confirm: 'NewPassword456!',
    };

    result.current.mutate(passwordData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      message: 'Mot de passe modifié avec succès.',
    });
  });

  it('should fail with wrong old password', async () => {
    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    });

    const passwordData = {
      old_password: 'WrongPassword!',
      new_password: 'NewPassword456!',
      new_password_confirm: 'NewPassword456!',
    };

    result.current.mutate(passwordData);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('should fail when passwords do not match', async () => {
    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    });

    const passwordData = {
      old_password: 'OldPassword123!',
      new_password: 'NewPassword456!',
      new_password_confirm: 'DifferentPassword!',
    };

    result.current.mutate(passwordData);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('should fail when not authenticated', async () => {
    localStorage.removeItem('loura_access_token');

    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    });

    const passwordData = {
      old_password: 'OldPassword123!',
      new_password: 'NewPassword456!',
      new_password_confirm: 'NewPassword456!',
    };

    result.current.mutate(passwordData);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('should set loading state during password change', async () => {
    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    const passwordData = {
      old_password: 'OldPassword123!',
      new_password: 'NewPassword456!',
      new_password_confirm: 'NewPassword456!',
    };

    result.current.mutate(passwordData);

    // Attendre que la mutation démarre
    await waitFor(() =>
      expect(result.current.isPending || result.current.isSuccess).toBe(true)
    );

    // Attendre la fin
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Après succès
    expect(result.current.isPending).toBe(false);
  });

  it('should not update user data in localStorage', async () => {
    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    });

    // Stocker un utilisateur dans localStorage
    const initialUser = {
      id: '1',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
    };
    localStorage.setItem('loura_user', JSON.stringify(initialUser));

    const passwordData = {
      old_password: 'OldPassword123!',
      new_password: 'NewPassword456!',
      new_password_confirm: 'NewPassword456!',
    };

    result.current.mutate(passwordData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Vérifier que les données utilisateur n'ont pas changé
    const storedUser = localStorage.getItem('loura_user');
    expect(storedUser).toBeDefined();

    if (storedUser) {
      const user = JSON.parse(storedUser);
      expect(user).toEqual(initialUser);
    }
  });

  it('should handle error response correctly', async () => {
    const { result } = renderHook(() => useChangePassword(), {
      wrapper: createWrapper(),
    });

    const passwordData = {
      old_password: 'WrongPassword!',
      new_password: 'NewPassword456!',
      new_password_confirm: 'NewPassword456!',
    };

    result.current.mutate(passwordData);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(result.current.data).toBeUndefined();
  });
});
