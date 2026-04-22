import { API_CONFIG } from '@/lib/api';
import { useCreateDepartment, useDepartment, useDepartments } from '@/lib/hooks/hr';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../server';

const API_URL = API_CONFIG.baseURL;
const orgId = 'org-123';
const deptId = 'dept-1';

// Mocks Data
const mockDepartmentsList = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: deptId,
      name: 'Ressources Humaines',
      organization: orgId,
      parent: null,
      description: 'Département RH',
      manager: null,
      is_active: true,
      full_path: 'Ressources Humaines',
      level: 0,
      children_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]
};

// Wrapper test
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

describe('useDepartments hooks', () => {
  beforeEach(() => {
    // Nettoyer tous les handlers ajoutés pendant les tests et revenir à ceux de base
    server.resetHandlers();
    
    // Définir les handlers spécifiques pour ce groupe de tests
    server.use(
      http.get(`${API_URL}/hr/organizations/${orgId}/departments/`, () => {
        return HttpResponse.json(mockDepartmentsList);
      }),

      http.get(`${API_URL}/hr/organizations/${orgId}/departments/${deptId}/`, () => {
        return HttpResponse.json(mockDepartmentsList.results[0]);
      }),

      http.post(`${API_URL}/hr/organizations/${orgId}/departments/`, async ({ request }) => {
        const body = await request.json() as any;
        return HttpResponse.json({
          message: 'Département créé avec succès.',
          data: {
            id: 'dept-new',
            name: body.name,
            organization: orgId,
            parent: body.parent_id || null,
            description: body.description || '',
            manager: null,
            is_active: body.is_active ?? true,
            full_path: body.name,
            level: 0,
            children_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }, { status: 201 });
      })
    );
  });

  it('useDepartments should fetch the list of departments', async () => {
    const { result } = renderHook(() => useDepartments(orgId, {}), {
      wrapper: createWrapper(),
    });

    // Attente du succès de la requête
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    // Gérer à la fois le cas paginé retourné et direct
    const results = (result.current.data as any).results || result.current.data;
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Ressources Humaines');
    expect(results[0].full_path).toBe('Ressources Humaines');
  });

  it('useDepartment should fetch single department details', async () => {
    const { result } = renderHook(() => useDepartment(orgId, deptId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toBe(deptId);
    expect(result.current.data?.name).toBe('Ressources Humaines');
  });

  it('useCreateDepartment should successfully create a department', async () => {
    const { result } = renderHook(() => useCreateDepartment(), {
      wrapper: createWrapper(),
    });

    const newDeptData = {
      name: 'IT Department',
      description: 'Tech Hub',
      is_active: true,
      parent_id: null,
      manager_id: null,
    };

    result.current.mutate({ orgId, data: newDeptData });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    // Le useCreateDepartment renvoie directement .data extrait du backend
    expect(result.current.data).toBeDefined();
    expect(result.current.data?.data.name).toBe('IT Department');
    expect(result.current.data?.data.id).toBe('dept-new');
  });
});
