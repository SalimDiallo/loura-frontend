/**
 * Hooks TanStack Query pour le module Inventory.
 *
 * Gestion des catégories produits, entrepôts et produits.
 */

"use client";

import {
    usePaginatedQuery,
    type UsePaginatedQueryReturn,
} from "@/lib/hooks/usePagination";
import {
    categoriesService,
    productsService,
    warehousesService,
} from "@/lib/services/inventory";
import type {
    Category,
    CategoryTreeNode,
    CreateCategoryData,
    CreateCategoryResponse,
    CreateProductData,
    CreateProductResponse,
    CreateWarehouseData,
    CreateWarehouseResponse,
    DeleteCategoryResponse,
    DeleteProductResponse,
    DeleteWarehouseResponse,
    ListCategoriesParams,
    ListProductsParams,
    ListWarehousesParams,
    Product,
    UpdateCategoryData,
    UpdateCategoryResponse,
    UpdateProductData,
    UpdateProductResponse,
    UpdateWarehouseData,
    UpdateWarehouseResponse,
    Warehouse,
} from "@/lib/types";
import {
    useMutation,
    useQuery,
    useQueryClient,
    type UseMutationResult,
    type UseQueryResult,
} from "@tanstack/react-query";

// ─── Query Keys ──────────────────────────────────────────────────────────────

export const inventoryQueryKeys = {
  // Catégories
  categories: (orgId: string, params?: ListCategoriesParams) =>
    ["inventory", "categories", orgId, params ?? {}] as const,
  category: (orgId: string, id: string) =>
    ["inventory", "categories", orgId, id] as const,
  categoryTree: (orgId: string) =>
    ["inventory", "categories", orgId, "tree"] as const,

  // Entrepôts
  warehouses: (orgId: string, params?: ListWarehousesParams) =>
    ["inventory", "warehouses", orgId, params ?? {}] as const,
  warehouse: (orgId: string, id: string) =>
    ["inventory", "warehouses", orgId, id] as const,

  // Produits
  products: (orgId: string, params?: ListProductsParams) =>
    ["inventory", "products", orgId, params ?? {}] as const,
  product: (orgId: string, id: string) =>
    ["inventory", "products", orgId, id] as const,
};

// ─── Catégories ──────────────────────────────────────────────────────────────

export function useCategories(
  orgId: string,
  params?: ListCategoriesParams
): UseQueryResult<Category[], Error> {
  return useQuery({
    queryKey: inventoryQueryKeys.categories(orgId, params),
    queryFn: () => categoriesService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

export function useCategoryTree(
  orgId: string
): UseQueryResult<CategoryTreeNode[], Error> {
  return useQuery({
    queryKey: inventoryQueryKeys.categoryTree(orgId),
    queryFn: () => categoriesService.getTree(orgId),
    enabled: !!orgId,
  });
}

export function useCategory(
  orgId: string,
  id: string
): UseQueryResult<Category, Error> {
  return useQuery({
    queryKey: inventoryQueryKeys.category(orgId, id),
    queryFn: () => categoriesService.getById(orgId, id),
    enabled: !!orgId && !!id,
  });
}

// ─── Catégories : pagination ─────────────────────────────────────────────────

export function usePaginatedCategories(
  orgId: string,
  filters?: Omit<ListCategoriesParams, "page" | "page_size">,
  options?: { pageSize?: number; initialPage?: number; enabled?: boolean }
): UsePaginatedQueryReturn<Category> {
  return usePaginatedQuery<Category, any>({
    queryKey: ["inventory", "categories", orgId],
    fetchFn: (params) => categoriesService.getAll(orgId, params) as any,
    filters,
    pageSize: options?.pageSize ?? 10,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

export function usePaginatedWarehouses(
  orgId: string,
  filters?: Omit<ListWarehousesParams, "page" | "page_size">,
  options?: { pageSize?: number; initialPage?: number; enabled?: boolean }
): UsePaginatedQueryReturn<Warehouse> {
  return usePaginatedQuery<Warehouse, any>({
    queryKey: ["inventory", "warehouses", orgId],
    fetchFn: (params) => warehousesService.getAll(orgId, params) as any,
    filters,
    pageSize: options?.pageSize ?? 10,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

export function usePaginatedProducts(
  orgId: string,
  filters?: Omit<ListProductsParams, "page" | "page_size">,
  options?: { pageSize?: number; initialPage?: number; enabled?: boolean }
): UsePaginatedQueryReturn<Product> {
  return usePaginatedQuery<Product, any>({
    queryKey: ["inventory", "products", orgId],
    fetchFn: (params) => productsService.getAll(orgId, params) as any,
    filters,
    pageSize: options?.pageSize ?? 10,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

export function useCreateCategory(): UseMutationResult<
  CreateCategoryResponse,
  Error,
  { orgId: string; data: CreateCategoryData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }) => categoriesService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "categories", orgId] });
    },
  });
}

export function useUpdateCategory(): UseMutationResult<
  UpdateCategoryResponse,
  Error,
  { orgId: string; categoryId: string; data: UpdateCategoryData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, categoryId, data }) =>
      categoriesService.update(orgId, categoryId, data),
    onSuccess: (_, { orgId, categoryId }) => {
      qc.invalidateQueries({
        queryKey: inventoryQueryKeys.category(orgId, categoryId),
      });
      qc.invalidateQueries({ queryKey: ["inventory", "categories", orgId] });
    },
  });
}

export function useDeleteCategory(): UseMutationResult<
  DeleteCategoryResponse,
  Error,
  { orgId: string; categoryId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, categoryId }) =>
      categoriesService.delete(orgId, categoryId),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "categories", orgId] });
      qc.invalidateQueries({ queryKey: ["inventory", "products", orgId] });
    },
  });
}

// ─── Entrepôts ───────────────────────────────────────────────────────────────

export function useWarehouses(
  orgId: string,
  params?: ListWarehousesParams
): UseQueryResult<Warehouse[], Error> {
  return useQuery({
    queryKey: inventoryQueryKeys.warehouses(orgId, params),
    queryFn: () => warehousesService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

export function useWarehouse(
  orgId: string,
  id: string
): UseQueryResult<Warehouse, Error> {
  return useQuery({
    queryKey: inventoryQueryKeys.warehouse(orgId, id),
    queryFn: () => warehousesService.getById(orgId, id),
    enabled: !!orgId && !!id,
  });
}

export function useCreateWarehouse(): UseMutationResult<
  CreateWarehouseResponse,
  Error,
  { orgId: string; data: CreateWarehouseData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }) => warehousesService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "warehouses", orgId] });
    },
  });
}

export function useUpdateWarehouse(): UseMutationResult<
  UpdateWarehouseResponse,
  Error,
  { orgId: string; warehouseId: string; data: UpdateWarehouseData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, warehouseId, data }) =>
      warehousesService.update(orgId, warehouseId, data),
    onSuccess: (_, { orgId, warehouseId }) => {
      qc.invalidateQueries({
        queryKey: inventoryQueryKeys.warehouse(orgId, warehouseId),
      });
      qc.invalidateQueries({ queryKey: ["inventory", "warehouses", orgId] });
    },
  });
}

export function useDeleteWarehouse(): UseMutationResult<
  DeleteWarehouseResponse,
  Error,
  { orgId: string; warehouseId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, warehouseId }) =>
      warehousesService.delete(orgId, warehouseId),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "warehouses", orgId] });
    },
  });
}

// ─── Produits ────────────────────────────────────────────────────────────────

export function useProducts(
  orgId: string,
  params?: ListProductsParams
): UseQueryResult<Product[], Error> {
  return useQuery({
    queryKey: inventoryQueryKeys.products(orgId, params),
    queryFn: () => productsService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

export function useProduct(
  orgId: string,
  id: string
): UseQueryResult<Product, Error> {
  return useQuery({
    queryKey: inventoryQueryKeys.product(orgId, id),
    queryFn: () => productsService.getById(orgId, id),
    enabled: !!orgId && !!id,
  });
}

export function useCreateProduct(): UseMutationResult<
  CreateProductResponse,
  Error,
  { orgId: string; data: CreateProductData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }) => productsService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "products", orgId] });
    },
  });
}

export function useUpdateProduct(): UseMutationResult<
  UpdateProductResponse,
  Error,
  { orgId: string; productId: string; data: UpdateProductData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, productId, data }) =>
      productsService.update(orgId, productId, data),
    onSuccess: (_, { orgId, productId }) => {
      qc.invalidateQueries({
        queryKey: inventoryQueryKeys.product(orgId, productId),
      });
      qc.invalidateQueries({ queryKey: ["inventory", "products", orgId] });
    },
  });
}

export function useDeleteProduct(): UseMutationResult<
  DeleteProductResponse,
  Error,
  { orgId: string; productId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, productId }) =>
      productsService.delete(orgId, productId),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "products", orgId] });
    },
  });
}

export function useUploadProductImage(): UseMutationResult<
  UpdateProductResponse,
  Error,
  { orgId: string; productId: string; file: File }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, productId, file }) =>
      productsService.uploadImage(orgId, productId, file),
    onSuccess: (_, { orgId, productId }) => {
      qc.invalidateQueries({
        queryKey: inventoryQueryKeys.product(orgId, productId),
      });
      qc.invalidateQueries({ queryKey: ["inventory", "products", orgId] });
    },
  });
}

export function useDeleteProductImage(): UseMutationResult<
  DeleteProductResponse,
  Error,
  { orgId: string; productId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, productId }) =>
      productsService.deleteImage(orgId, productId),
    onSuccess: (_, { orgId, productId }) => {
      qc.invalidateQueries({
        queryKey: inventoryQueryKeys.product(orgId, productId),
      });
      qc.invalidateQueries({ queryKey: ["inventory", "products", orgId] });
    },
  });
}
