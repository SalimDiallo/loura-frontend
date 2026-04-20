/**
 * Hooks de pagination réutilisables pour TanStack Query
 * =====================================================
 *
 * Usage:
 *
 *   // Paginé (par défaut, 20 items)
 *   const { data, page, setPage, ... } = usePaginatedQuery({
 *     queryKey: ['employees'],
 *     fetchFn: (params) => employeeService.list(params),
 *     filters: { search: 'John' },
 *   });
 *
 *   // Tous les éléments d'un coup (pour selects, dropdowns, etc.)
 *   const { data } = useAllQuery({
 *     queryKey: ['departments', 'all'],
 *     fetchFn: () => departmentService.list({ page_size: 'all' as any }),
 *   });
 */

import type { FilterParams, PaginatedResponse } from '@/lib/types/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  /** Total items across all pages */
  totalItems: number;
  /** Total pages */
  totalPages: number;
  /** Current page number */
  currentPage: number;
  /** Items per page */
  pageSize: number;
  /** Has a next page? */
  hasNextPage: boolean;
  /** Has a previous page? */
  hasPreviousPage: boolean;
}

export interface UsePaginatedQueryOptions<T, TFilters extends FilterParams = FilterParams> {
  /** TanStack Query key (without page params — they get appended automatically) */
  queryKey: unknown[];
  /** The service function that returns a PaginatedResponse */
  fetchFn: (params: TFilters) => Promise<PaginatedResponse<T>>;
  /** Extra filters (search, ordering, etc.) */
  filters?: Omit<TFilters, 'page' | 'page_size'>;
  /** Items per page (defaults to 20) */
  pageSize?: number;
  /** Initial page (defaults to 1) */
  initialPage?: number;
  /** TanStack Query enabled flag */
  enabled?: boolean;
}

export interface UsePaginatedQueryReturn<T> {
  /** The current page items */
  data: T[];
  /** Pagination metadata */
  meta: PaginationMeta;
  /** Current page */
  page: number;
  /** Go to a specific page */
  setPage: (page: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Change page size */
  setPageSize: (size: number) => void;
  /** Loading state */
  isLoading: boolean;
  /** Fetching state (for background refetches) */
  isFetching: boolean;
  /** Error state */
  isError: boolean;
  /** Error object */
  error: Error | null;
  /** Refetch */
  refetch: () => void;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook de pagination pour les listes paginées côté serveur (page + page_size)
 */
export function usePaginatedQuery<T, TFilters extends FilterParams = FilterParams>(
  options: UsePaginatedQueryOptions<T, TFilters>
): UsePaginatedQueryReturn<T> {
  const {
    queryKey,
    fetchFn,
    filters,
    pageSize: defaultPageSize = 20,
    initialPage = 1,
    enabled = true,
  } = options;

  // Stabilize the filters reference to avoid infinite re-renders
  const stableFilters = useMemo(
    () => (filters ?? {}) as Omit<TFilters, 'page' | 'page_size'>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(filters)]
  );

  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    pageSize: defaultPageSize,
  });

  // Reset to page 1 when filters change
  const filtersKey = JSON.stringify(stableFilters);
  useMemo(() => {
    setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  // Builds the composite query key including filters + pagination
  const compositeKey = useMemo(
    () => [...queryKey, { ...stableFilters, page: pagination.page, page_size: pagination.pageSize }],
    [queryKey, stableFilters, pagination.page, pagination.pageSize]
  );

  const query = useQuery<PaginatedResponse<T>, Error>({
    queryKey: compositeKey,
    queryFn: () =>
      fetchFn({
        ...stableFilters,
        page: pagination.page,
        page_size: pagination.pageSize,
      } as TFilters),
    placeholderData: keepPreviousData,
    enabled,
  });

  const totalItems = query.data?.count ?? 0;
  const totalPages = query.data?.total_pages || Math.ceil(totalItems / pagination.pageSize) || 1;

  const meta: PaginationMeta = useMemo(
    () => ({
      totalItems,
      totalPages,
      currentPage: pagination.page,
      pageSize: pagination.pageSize,
      hasNextPage: !!query.data?.next,
      hasPreviousPage: !!query.data?.previous,
    }),
    [totalItems, totalPages, pagination, query.data?.next, query.data?.previous]
  );

  const setPage = useCallback((p: number) => {
    setPagination((prev) => ({ ...prev, page: Math.max(1, Math.min(p, totalPages)) }));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setPage(pagination.page + 1);
  }, [pagination.page, setPage]);

  const prevPage = useCallback(() => {
    setPage(pagination.page - 1);
  }, [pagination.page, setPage]);

  const setPageSize = useCallback((size: number) => {
    setPagination({ page: 1, pageSize: size }); // Reset to page 1 on size change
  }, []);

  return {
    data: query.data?.results ?? [],
    meta,
    page: pagination.page,
    setPage,
    nextPage,
    prevPage,
    setPageSize,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

// ============================================================================

export interface UseAllQueryOptions<T> {
  /** TanStack Query key */
  queryKey: unknown[];
  /** The service function — should pass { page_size: 'all' } to the API */
  fetchFn: () => Promise<PaginatedResponse<T> | T[]>;
  /** TanStack Query enabled flag */
  enabled?: boolean;
}

/**
 * Hook pour récupérer TOUS les éléments sans pagination.
 * Le backend renvoie un tableau brut quand ?page_size=all.
 *
 * Use-cases : dropdowns, selects, autocomplete, très petites collections.
 */
export function useAllQuery<T>(options: UseAllQueryOptions<T>) {
  const { queryKey, fetchFn, enabled = true } = options;

  const query = useQuery<T[], Error>({
    queryKey: [...queryKey, 'all'],
    queryFn: async () => {
      const response = await fetchFn();
      // Si le backend renvoie un array (page_size=all) ou une PaginatedResponse
      if (Array.isArray(response)) {
        return response;
      }
      return (response as PaginatedResponse<T>).results ?? [];
    },
    enabled,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
