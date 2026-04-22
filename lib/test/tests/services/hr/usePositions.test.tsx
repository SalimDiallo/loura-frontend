import { API_CONFIG } from '@/lib/api';
import { useCreatePosition, usePosition, usePositionMembers, usePositions } from '@/lib/hooks/hr';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import { server } from '../../server';

const API_URL = API_CONFIG.baseURL;
const orgId = 'org-123';
const posId = 'pos-1';

const mockPositionsList = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: posId,
      name: 'Développeur Frontend',
      organization: orgId,
      department: {
        id: 'dept-1',
        name: 'IT'
      },
      description: 'React Developer',
      level: 'intermediate',
      level_display: 'Intermédiaire',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ]
};

const mockAssignmentsList = [
  {
    id: 'assign-1',
    membership: {
      id: 'memb-1',
      employee: {
        user: {
          id: 'user-1',
          email: 'dev@example.com',
          first_name: 'John',
          last_name: 'Doe'
        }
      }
    },
    position: {
      id: posId,
      name: 'Développeur Frontend'
    },
    start_date: '2023-01-01',
    end_date: null,
    is_active: true
  }
];

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

describe('usePositions hooks', () => {
  beforeEach(() => {
    server.resetHandlers();
    
    server.use(
      http.get(`${API_URL}/hr/organizations/${orgId}/positions/`, () => {
        return HttpResponse.json(mockPositionsList);
      }),

      http.get(`${API_URL}/hr/organizations/${orgId}/positions/${posId}/`, () => {
        return HttpResponse.json(mockPositionsList.results[0]);
      }),

      http.post(`${API_URL}/hr/organizations/${orgId}/positions/`, async ({ request }) => {
        const body = await request.json() as any;
        return HttpResponse.json({
          message: 'Poste créé.',
          data: {
            id: 'pos-new',
            name: body.name,
            organization: orgId,
            department: null,
            description: body.description,
            level: body.level,
            is_active: body.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }, { status: 201 });
      }),
      
      http.get(`${API_URL}/hr/organizations/${orgId}/positions/${posId}/members/`, () => {
        return HttpResponse.json(mockAssignmentsList);
      })
    );
  });

  it('usePositions should fetch the list of positions', async () => {
    const { result } = renderHook(() => usePositions(orgId, {}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const results = (result.current.data as any).results || result.current.data;
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Développeur Frontend');
    expect(results[0].level).toBe('intermediate');
  });

  it('usePosition should fetch single position details', async () => {
    const { result } = renderHook(() => usePosition(orgId, posId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe(posId);
  });

  it('useCreatePosition should successfully create a position', async () => {
    const { result } = renderHook(() => useCreatePosition(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ 
      orgId, 
      data: {
        name: 'Backend Engineer',
        level: 'senior',
        is_active: true,
        department_id: null,
        description: ''
      } 
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data.name).toBe('Backend Engineer');
    expect(result.current.data?.data.id).toBe('pos-new');
  });

  it('usePositionMembers should fetch assignments for a specific position', async () => {
    const { result } = renderHook(() => usePositionMembers(orgId, posId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data![0].membership.employee.user.first_name).toBe('John');
  });
});
