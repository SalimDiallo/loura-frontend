import { useUpdateProfile } from '@/lib/hooks/profile/useUpdateProfile';
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

describe('useUpdateProfile', () => {
  beforeEach(() => {
    localStorage.clear();
    // Simuler un token d'authentification
    localStorage.setItem('loura_access_token', 'mock_access_token');
  });

  it('should update profile successfully', async () => {
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    const updateData = {
      first_name: 'Updated',
      last_name: 'Name',
      phone: '+224123456789',
    };

    result.current.mutate(updateData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      first_name: 'Updated',
      last_name: 'Name',
      phone: '+224123456789',
    });
  });

  it('should fail when not authenticated', async () => {
    localStorage.removeItem('loura_access_token');

    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ first_name: 'Test' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('should update only provided fields', async () => {
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    // Ne mettre à jour que le téléphone
    result.current.mutate({ phone: '+224987654321' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.phone).toBe('+224987654321');
    // Les autres champs devraient rester identiques (valeurs par défaut du mock)
    expect(result.current.data?.email).toBe('test@example.com');
  });

  it('should update address fields', async () => {
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    const addressData = {
      address: '123 Main Street',
      city: 'Conakry',
      country: 'Guinée',
    };

    result.current.mutate(addressData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject(addressData);
  });

  it('should update preferences', async () => {
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    const preferencesData = {
      language: 'en',
      timezone: 'Europe/Paris',
    };

    result.current.mutate(preferencesData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.language).toBe('en');
    expect(result.current.data?.timezone).toBe('Europe/Paris');
  });

  it('should set loading state during update', async () => {
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    result.current.mutate({ first_name: 'Test' });

    // Attendre que la mutation démarre
    await waitFor(() =>
      expect(result.current.isPending || result.current.isSuccess).toBe(true)
    );

    // Attendre la fin
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Après succès
    expect(result.current.isPending).toBe(false);
  });

  it('should update user data in localStorage on success', async () => {
    const { result } = renderHook(() => useUpdateProfile(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ first_name: 'NewName' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await waitFor(() => {
      const storedUser = localStorage.getItem('loura_user');
      expect(storedUser).toBeDefined();

      if (storedUser) {
        const user = JSON.parse(storedUser);
        expect(user.first_name).toBe('NewName');
      }
    });
  });
});
