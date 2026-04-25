/**
 * Hooks TanStack Query pour le module Inventory.
 *
 * Gestion des catégories produits, entrepôts et produits.
 */

"use client";

export * from "./analytics";

import {
  usePaginatedQuery,
  type UsePaginatedQueryReturn,
} from "@/lib/hooks/usePagination";
import {
  categoriesService,
  customersService,
  physicalInventoriesService,
  productsService,
  purchaseOrdersService,
  quotesService,
  salesService,
  stockMovementsService,
  stockService,
  stockTransfersService,
  suppliersService,
  warehousesService
} from "@/lib/services/inventory";
import type {
  Category,
  CategoryTreeNode,
  ConvertQuoteData,
  CreateCategoryData,
  CreateCategoryResponse,
  CreateCustomerData,
  CreateCustomerResponse,
  CreatePhysicalInventoryData,
  CreateProductData,
  CreateProductResponse,
  CreatePurchaseOrderData,
  CreatePurchaseOrderPaymentData,
  CreatePurchaseOrderPaymentResponse,
  CreateQuoteData,
  CreateSaleData,
  CreateSalePaymentData,
  CreateSalePaymentResponse,
  CreateStockMovementData,
  CreateStockMovementResponse,
  CreateSupplierData,
  CreateSupplierResponse,
  CreateWarehouseData,
  CreateWarehouseResponse,
  Customer,
  DeleteCategoryResponse,
  DeleteCustomerResponse,
  DeleteProductResponse,
  DeleteSupplierResponse,
  DeleteWarehouseResponse,
  ListCategoriesParams,
  ListCustomersParams,
  ListPhysicalInventoriesParams,
  ListProductsParams,
  ListPurchaseOrdersParams,
  ListQuotesParams,
  ListSalesParams,
  ListStockMovementsParams,
  ListStocksParams,
  ListSuppliersParams,
  ListWarehousesParams,
  PhysicalInventory,
  PhysicalInventoryResponse,
  PopulatePhysicalInventoryData,
  Product,
  PurchaseOrder,
  PurchaseOrderResponse,
  Quote,
  QuoteResponse,
  ReceivePurchaseOrderData,
  RejectQuoteData,
  Sale,
  SaleResponse,
  Stock,
  StockAlertsResponse,
  StockMovement,
  StockTransferData,
  StockTransferResponse,
  Supplier,
  UpdateCategoryData,
  UpdateCategoryResponse,
  UpdateCustomerData,
  UpdateCustomerResponse,
  UpdatePhysicalInventoryData,
  UpdatePhysicalInventoryItemsData,
  UpdateProductData,
  UpdateProductResponse,
  UpdatePurchaseOrderData,
  UpdateQuoteData,
  UpdateSaleData,
  UpdateStockMovementData,
  UpdateStockMovementResponse,
  UpdateSupplierData,
  UpdateSupplierResponse,
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

  // Fournisseurs
  suppliers: (orgId: string, params?: ListSuppliersParams) =>
    ["inventory", "suppliers", orgId, params ?? {}] as const,
  supplier: (orgId: string, id: string) =>
    ["inventory", "suppliers", orgId, id] as const,

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

// ─── Stock (niveaux courants) ────────────────────────────────────────────────

export function useStocks(
  orgId: string,
  params?: ListStocksParams
): UseQueryResult<Stock[], Error> {
  return useQuery({
    queryKey: ["inventory", "stocks", orgId, params ?? {}],
    queryFn: () => stockService.list(orgId, params),
    enabled: !!orgId,
  });
}

export function usePaginatedStocks(
  orgId: string,
  filters?: Omit<ListStocksParams, "page" | "page_size">,
  options?: { pageSize?: number; initialPage?: number; enabled?: boolean }
): UsePaginatedQueryReturn<Stock> {
  return usePaginatedQuery<Stock, any>({
    queryKey: ["inventory", "stocks", orgId],
    fetchFn: (params) => stockService.list(orgId, params) as any,
    filters,
    pageSize: options?.pageSize ?? 15,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

export function useStockAlerts(
  orgId: string
): UseQueryResult<StockAlertsResponse, Error> {
  return useQuery({
    queryKey: ["inventory", "stocks", orgId, "alerts"],
    queryFn: () => stockService.alerts(orgId),
    enabled: !!orgId,
  });
}

// ─── Mouvements de stock ─────────────────────────────────────────────────────

export function useStockMovements(
  orgId: string,
  params?: ListStockMovementsParams
): UseQueryResult<StockMovement[], Error> {
  return useQuery({
    queryKey: ["inventory", "stock-movements", orgId, params ?? {}],
    queryFn: () => stockMovementsService.list(orgId, params),
    enabled: !!orgId,
  });
}

export function usePaginatedStockMovements(
  orgId: string,
  filters?: Omit<ListStockMovementsParams, "page" | "page_size">,
  options?: { pageSize?: number; initialPage?: number; enabled?: boolean }
): UsePaginatedQueryReturn<StockMovement> {
  return usePaginatedQuery<StockMovement, any>({
    queryKey: ["inventory", "stock-movements", orgId],
    fetchFn: (params) => stockMovementsService.list(orgId, params) as any,
    filters,
    pageSize: options?.pageSize ?? 15,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

export function useStockMovement(
  orgId: string,
  id: string
): UseQueryResult<StockMovement, Error> {
  return useQuery({
    queryKey: ["inventory", "stock-movements", orgId, id],
    queryFn: () => stockMovementsService.getById(orgId, id),
    enabled: !!orgId && !!id,
  });
}

export function useCreateStockMovement(): UseMutationResult<
  CreateStockMovementResponse,
  Error,
  { orgId: string; data: CreateStockMovementData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }) => stockMovementsService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "stock-movements", orgId] });
      qc.invalidateQueries({ queryKey: ["inventory", "stocks", orgId] });
    },
  });
}

export function useUpdateStockMovement(): UseMutationResult<
  UpdateStockMovementResponse,
  Error,
  { orgId: string; id: string; data: UpdateStockMovementData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) =>
      stockMovementsService.update(orgId, id, data),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "stock-movements", orgId] });
      qc.invalidateQueries({
        queryKey: ["inventory", "stock-movements", orgId, id],
      });
    },
  });
}

export function useDeleteStockMovement(): UseMutationResult<
  void,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => stockMovementsService.remove(orgId, id),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "stock-movements", orgId] });
    },
  });
}

export function useValidateStockMovement(): UseMutationResult<
  UpdateStockMovementResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => stockMovementsService.validate(orgId, id),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "stock-movements", orgId] });
      qc.invalidateQueries({
        queryKey: ["inventory", "stock-movements", orgId, id],
      });
      qc.invalidateQueries({ queryKey: ["inventory", "stocks", orgId] });
    },
  });
}

export function useCancelStockMovement(): UseMutationResult<
  UpdateStockMovementResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => stockMovementsService.cancel(orgId, id),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "stock-movements", orgId] });
      qc.invalidateQueries({
        queryKey: ["inventory", "stock-movements", orgId, id],
      });
    },
  });
}

// ─── Transferts ──────────────────────────────────────────────────────────────

export function useStockTransfer(): UseMutationResult<
  StockTransferResponse,
  Error,
  { orgId: string; data: StockTransferData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }) => stockTransfersService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "stock-movements", orgId] });
      qc.invalidateQueries({ queryKey: ["inventory", "stocks", orgId] });
    },
  });
}

// ─── Fournisseurs ────────────────────────────────────────────────────────────

export function useSuppliers(
  orgId: string,
  params?: ListSuppliersParams
): UseQueryResult<Supplier[], Error> {
  return useQuery({
    queryKey: inventoryQueryKeys.suppliers(orgId, params),
    queryFn: () => suppliersService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

export function usePaginatedSuppliers(
  orgId: string,
  filters?: Omit<ListSuppliersParams, "page" | "page_size">,
  options?: { pageSize?: number; initialPage?: number; enabled?: boolean }
): UsePaginatedQueryReturn<Supplier> {
  return usePaginatedQuery<Supplier, any>({
    queryKey: ["inventory", "suppliers", orgId],
    fetchFn: (params) => suppliersService.getAll(orgId, params) as any,
    filters,
    pageSize: options?.pageSize ?? 10,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

export function useSupplier(
  orgId: string,
  id: string
): UseQueryResult<Supplier, Error> {
  return useQuery({
    queryKey: inventoryQueryKeys.supplier(orgId, id),
    queryFn: () => suppliersService.getById(orgId, id),
    enabled: !!orgId && !!id,
  });
}

export function useCreateSupplier(): UseMutationResult<
  CreateSupplierResponse,
  Error,
  { orgId: string; data: CreateSupplierData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }) => suppliersService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "suppliers", orgId] });
    },
  });
}

export function useUpdateSupplier(): UseMutationResult<
  UpdateSupplierResponse,
  Error,
  { orgId: string; id: string; data: UpdateSupplierData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) =>
      suppliersService.update(orgId, id, data),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: inventoryQueryKeys.supplier(orgId, id) });
      qc.invalidateQueries({ queryKey: ["inventory", "suppliers", orgId] });
    },
  });
}

export function useDeleteSupplier(): UseMutationResult<
  DeleteSupplierResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => suppliersService.delete(orgId, id),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "suppliers", orgId] });
    },
  });
}

// ─── Clients (Customers) ─────────────────────────────────────────────────────

export function useCustomers(
  orgId: string,
  params?: ListCustomersParams
): UseQueryResult<Customer[], Error> {
  return useQuery({
    queryKey: ["inventory", "customers", orgId, params ?? {}],
    queryFn: () => customersService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

export function usePaginatedCustomers(
  orgId: string,
  filters?: Omit<ListCustomersParams, "page" | "page_size">,
  options?: { pageSize?: number; initialPage?: number; enabled?: boolean }
): UsePaginatedQueryReturn<Customer> {
  return usePaginatedQuery<Customer, any>({
    queryKey: ["inventory", "customers", orgId],
    fetchFn: (params) => customersService.getAll(orgId, params) as any,
    filters,
    pageSize: options?.pageSize ?? 10,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

export function useCustomer(
  orgId: string,
  id: string
): UseQueryResult<Customer, Error> {
  return useQuery({
    queryKey: ["inventory", "customers", orgId, id],
    queryFn: () => customersService.getById(orgId, id),
    enabled: !!orgId && !!id,
  });
}

export function useCreateCustomer(): UseMutationResult<
  CreateCustomerResponse,
  Error,
  { orgId: string; data: CreateCustomerData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }) => customersService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "customers", orgId] });
    },
  });
}

export function useUpdateCustomer(): UseMutationResult<
  UpdateCustomerResponse,
  Error,
  { orgId: string; id: string; data: UpdateCustomerData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) =>
      customersService.update(orgId, id, data),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "customers", orgId, id] });
      qc.invalidateQueries({ queryKey: ["inventory", "customers", orgId] });
    },
  });
}

export function useDeleteCustomer(): UseMutationResult<
  DeleteCustomerResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => customersService.delete(orgId, id),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "customers", orgId] });
    },
  });
}

// ─── Commandes fournisseur (Purchase Orders) ─────────────────────────────────

export function usePurchaseOrders(
  orgId: string,
  params?: ListPurchaseOrdersParams
): UseQueryResult<PurchaseOrder[], Error> {
  return useQuery({
    queryKey: ["inventory", "purchase-orders", orgId, params ?? {}],
    queryFn: () => purchaseOrdersService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

export function usePaginatedPurchaseOrders(
  orgId: string,
  filters?: Omit<ListPurchaseOrdersParams, "page" | "page_size">,
  options?: { pageSize?: number; initialPage?: number; enabled?: boolean }
): UsePaginatedQueryReturn<PurchaseOrder> {
  return usePaginatedQuery<PurchaseOrder, any>({
    queryKey: ["inventory", "purchase-orders", orgId],
    fetchFn: (params) => purchaseOrdersService.getAll(orgId, params) as any,
    filters,
    pageSize: options?.pageSize ?? 15,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

export function usePurchaseOrder(
  orgId: string,
  id: string
): UseQueryResult<PurchaseOrder, Error> {
  return useQuery({
    queryKey: ["inventory", "purchase-orders", orgId, id],
    queryFn: () => purchaseOrdersService.getById(orgId, id),
    enabled: !!orgId && !!id,
  });
}

export function useCreatePurchaseOrder(): UseMutationResult<
  PurchaseOrderResponse,
  Error,
  { orgId: string; data: CreatePurchaseOrderData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }) => purchaseOrdersService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId] });
    },
  });
}

export function useUpdatePurchaseOrder(): UseMutationResult<
  PurchaseOrderResponse,
  Error,
  { orgId: string; id: string; data: UpdatePurchaseOrderData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) =>
      purchaseOrdersService.update(orgId, id, data),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId, id] });
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId] });
    },
  });
}

export function useDeletePurchaseOrder(): UseMutationResult<
  { message: string },
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => purchaseOrdersService.delete(orgId, id),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId] });
    },
  });
}

export function useSendPurchaseOrder(): UseMutationResult<
  PurchaseOrderResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => purchaseOrdersService.send(orgId, id),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId, id] });
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId] });
    },
  });
}

export function useCancelPurchaseOrder(): UseMutationResult<
  PurchaseOrderResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => purchaseOrdersService.cancel(orgId, id),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId, id] });
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId] });
    },
  });
}

export function useReceivePurchaseOrder(): UseMutationResult<
  PurchaseOrderResponse,
  Error,
  { orgId: string; id: string; data: ReceivePurchaseOrderData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) =>
      purchaseOrdersService.receive(orgId, id, data),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId, id] });
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId] });
      // La réception impacte stock + mouvements
      qc.invalidateQueries({ queryKey: ["inventory", "stocks", orgId] });
      qc.invalidateQueries({ queryKey: ["inventory", "stock-movements", orgId] });
    },
  });
}

export function useCreatePurchaseOrderPayment(): UseMutationResult<
  CreatePurchaseOrderPaymentResponse,
  Error,
  { orgId: string; id: string; data: CreatePurchaseOrderPaymentData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) =>
      purchaseOrdersService.createPayment(orgId, id, data),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId, id] });
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId] });
    },
  });
}

export function useDeletePurchaseOrderPayment(): UseMutationResult<
  { message: string },
  Error,
  { orgId: string; id: string; paymentId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, paymentId }) =>
      purchaseOrdersService.deletePayment(orgId, id, paymentId),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId, id] });
      qc.invalidateQueries({ queryKey: ["inventory", "purchase-orders", orgId] });
    },
  });
}

// ─── Ventes (Sales) ──────────────────────────────────────────────────────────

export function useSales(
  orgId: string,
  params?: ListSalesParams
): UseQueryResult<Sale[], Error> {
  return useQuery({
    queryKey: ["inventory", "sales", orgId, params ?? {}],
    queryFn: () => salesService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

export function usePaginatedSales(
  orgId: string,
  filters?: Omit<ListSalesParams, "page" | "page_size">,
  options?: { pageSize?: number; initialPage?: number; enabled?: boolean }
): UsePaginatedQueryReturn<Sale> {
  return usePaginatedQuery<Sale, any>({
    queryKey: ["inventory", "sales", orgId],
    fetchFn: (params) => salesService.getAll(orgId, params) as any,
    filters,
    pageSize: options?.pageSize ?? 15,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

export function useSale(
  orgId: string,
  id: string
): UseQueryResult<Sale, Error> {
  return useQuery({
    queryKey: ["inventory", "sales", orgId, id],
    queryFn: () => salesService.getById(orgId, id),
    enabled: !!orgId && !!id,
  });
}

export function useCreateSale(): UseMutationResult<
  SaleResponse,
  Error,
  { orgId: string; data: CreateSaleData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }) => salesService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "sales", orgId] });
    },
  });
}

export function useUpdateSale(): UseMutationResult<
  SaleResponse,
  Error,
  { orgId: string; id: string; data: UpdateSaleData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) => salesService.update(orgId, id, data),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "sales", orgId, id] });
      qc.invalidateQueries({ queryKey: ["inventory", "sales", orgId] });
    },
  });
}

export function useDeleteSale(): UseMutationResult<
  { message: string },
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => salesService.delete(orgId, id),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "sales", orgId] });
    },
  });
}

export function useCompleteSale(): UseMutationResult<
  SaleResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => salesService.complete(orgId, id),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "sales", orgId, id] });
      qc.invalidateQueries({ queryKey: ["inventory", "sales", orgId] });
      // Complete décrémente le stock
      qc.invalidateQueries({ queryKey: ["inventory", "stocks", orgId] });
      qc.invalidateQueries({ queryKey: ["inventory", "stock-movements", orgId] });
    },
  });
}

export function useCancelSale(): UseMutationResult<
  SaleResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => salesService.cancel(orgId, id),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "sales", orgId, id] });
      qc.invalidateQueries({ queryKey: ["inventory", "sales", orgId] });
      qc.invalidateQueries({ queryKey: ["inventory", "stocks", orgId] });
      qc.invalidateQueries({ queryKey: ["inventory", "stock-movements", orgId] });
    },
  });
}

export function useCreateSalePayment(): UseMutationResult<
  CreateSalePaymentResponse,
  Error,
  { orgId: string; id: string; data: CreateSalePaymentData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) =>
      salesService.createPayment(orgId, id, data),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "sales", orgId, id] });
      qc.invalidateQueries({ queryKey: ["inventory", "sales", orgId] });
    },
  });
}

export function useDeleteSalePayment(): UseMutationResult<
  { message: string },
  Error,
  { orgId: string; id: string; paymentId: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, paymentId }) =>
      salesService.deletePayment(orgId, id, paymentId),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "sales", orgId, id] });
      qc.invalidateQueries({ queryKey: ["inventory", "sales", orgId] });
    },
  });
}

// ─── Inventaires physiques (stocktaking) ────────────────────────────────────

export function usePhysicalInventories(
  orgId: string,
  params?: ListPhysicalInventoriesParams
): UseQueryResult<PhysicalInventory[], Error> {
  return useQuery({
    queryKey: ["inventory", "physical-inventories", orgId, params ?? {}],
    queryFn: () => physicalInventoriesService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

export function usePaginatedPhysicalInventories(
  orgId: string,
  filters?: Omit<ListPhysicalInventoriesParams, "page" | "page_size">,
  options?: { pageSize?: number; initialPage?: number; enabled?: boolean }
): UsePaginatedQueryReturn<PhysicalInventory> {
  return usePaginatedQuery<PhysicalInventory, any>({
    queryKey: ["inventory", "physical-inventories", orgId],
    fetchFn: (params) =>
      physicalInventoriesService.getAll(orgId, params) as any,
    filters,
    pageSize: options?.pageSize ?? 15,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

export function usePhysicalInventory(
  orgId: string,
  id: string
): UseQueryResult<PhysicalInventory, Error> {
  return useQuery({
    queryKey: ["inventory", "physical-inventories", orgId, id],
    queryFn: () => physicalInventoriesService.getById(orgId, id),
    enabled: !!orgId && !!id,
  });
}

export function useCreatePhysicalInventory(): UseMutationResult<
  PhysicalInventoryResponse,
  Error,
  { orgId: string; data: CreatePhysicalInventoryData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }) =>
      physicalInventoriesService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({
        queryKey: ["inventory", "physical-inventories", orgId],
      });
    },
  });
}

export function useUpdatePhysicalInventory(): UseMutationResult<
  PhysicalInventoryResponse,
  Error,
  { orgId: string; id: string; data: UpdatePhysicalInventoryData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) =>
      physicalInventoriesService.update(orgId, id, data),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({
        queryKey: ["inventory", "physical-inventories", orgId, id],
      });
      qc.invalidateQueries({
        queryKey: ["inventory", "physical-inventories", orgId],
      });
    },
  });
}

export function useDeletePhysicalInventory(): UseMutationResult<
  { message: string },
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => physicalInventoriesService.delete(orgId, id),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({
        queryKey: ["inventory", "physical-inventories", orgId],
      });
    },
  });
}

export function usePopulatePhysicalInventory(): UseMutationResult<
  PhysicalInventoryResponse,
  Error,
  { orgId: string; id: string; data?: PopulatePhysicalInventoryData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) =>
      physicalInventoriesService.populate(orgId, id, data ?? {}),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({
        queryKey: ["inventory", "physical-inventories", orgId, id],
      });
    },
  });
}

export function useUpdatePhysicalInventoryItems(): UseMutationResult<
  PhysicalInventoryResponse,
  Error,
  { orgId: string; id: string; data: UpdatePhysicalInventoryItemsData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) =>
      physicalInventoriesService.updateItems(orgId, id, data),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({
        queryKey: ["inventory", "physical-inventories", orgId, id],
      });
    },
  });
}

export function useCompletePhysicalInventory(): UseMutationResult<
  PhysicalInventoryResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) =>
      physicalInventoriesService.complete(orgId, id),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({
        queryKey: ["inventory", "physical-inventories", orgId, id],
      });
      qc.invalidateQueries({
        queryKey: ["inventory", "physical-inventories", orgId],
      });
      // La clôture génère des StockMovement d'ajustement.
      qc.invalidateQueries({ queryKey: ["inventory", "stocks", orgId] });
      qc.invalidateQueries({ queryKey: ["inventory", "stock-movements", orgId] });
    },
  });
}

export function useCancelPhysicalInventory(): UseMutationResult<
  PhysicalInventoryResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) =>
      physicalInventoriesService.cancel(orgId, id),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({
        queryKey: ["inventory", "physical-inventories", orgId, id],
      });
      qc.invalidateQueries({
        queryKey: ["inventory", "physical-inventories", orgId],
      });
    },
  });
}

// ─── Devis / Pro forma (Quotes) ──────────────────────────────────────────────

export function useQuotes(
  orgId: string,
  params?: ListQuotesParams
): UseQueryResult<Quote[], Error> {
  return useQuery({
    queryKey: ["inventory", "quotes", orgId, params ?? {}],
    queryFn: () => quotesService.getAll(orgId, params),
    enabled: !!orgId,
  });
}

export function usePaginatedQuotes(
  orgId: string,
  filters?: Omit<ListQuotesParams, "page" | "page_size">,
  options?: { pageSize?: number; initialPage?: number; enabled?: boolean }
): UsePaginatedQueryReturn<Quote> {
  return usePaginatedQuery<Quote, any>({
    queryKey: ["inventory", "quotes", orgId],
    fetchFn: (params) => quotesService.getAll(orgId, params) as any,
    filters,
    pageSize: options?.pageSize ?? 15,
    initialPage: options?.initialPage ?? 1,
    enabled: options?.enabled !== false && !!orgId,
  });
}

export function useQuote(
  orgId: string,
  id: string
): UseQueryResult<Quote, Error> {
  return useQuery({
    queryKey: ["inventory", "quotes", orgId, id],
    queryFn: () => quotesService.getById(orgId, id),
    enabled: !!orgId && !!id,
  });
}

export function useCreateQuote(): UseMutationResult<
  QuoteResponse,
  Error,
  { orgId: string; data: CreateQuoteData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, data }) => quotesService.create(orgId, data),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "quotes", orgId] });
    },
  });
}

export function useUpdateQuote(): UseMutationResult<
  QuoteResponse,
  Error,
  { orgId: string; id: string; data: UpdateQuoteData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) => quotesService.update(orgId, id, data),
    onSuccess: (_, { orgId, id }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "quotes", orgId, id] });
      qc.invalidateQueries({ queryKey: ["inventory", "quotes", orgId] });
    },
  });
}

export function useDeleteQuote(): UseMutationResult<
  { message: string },
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => quotesService.delete(orgId, id),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "quotes", orgId] });
    },
  });
}

function _invalidateQuote(
  qc: ReturnType<typeof useQueryClient>,
  orgId: string,
  id: string
) {
  qc.invalidateQueries({ queryKey: ["inventory", "quotes", orgId, id] });
  qc.invalidateQueries({ queryKey: ["inventory", "quotes", orgId] });
}

export function useSendQuote(): UseMutationResult<
  QuoteResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => quotesService.send(orgId, id),
    onSuccess: (_, { orgId, id }) => _invalidateQuote(qc, orgId, id),
  });
}

export function useAcceptQuote(): UseMutationResult<
  QuoteResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => quotesService.accept(orgId, id),
    onSuccess: (_, { orgId, id }) => _invalidateQuote(qc, orgId, id),
  });
}

export function useRejectQuote(): UseMutationResult<
  QuoteResponse,
  Error,
  { orgId: string; id: string; data?: RejectQuoteData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) =>
      quotesService.reject(orgId, id, data ?? {}),
    onSuccess: (_, { orgId, id }) => _invalidateQuote(qc, orgId, id),
  });
}

export function useExpireQuote(): UseMutationResult<
  QuoteResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => quotesService.expire(orgId, id),
    onSuccess: (_, { orgId, id }) => _invalidateQuote(qc, orgId, id),
  });
}

export function useConvertQuote(): UseMutationResult<
  QuoteResponse,
  Error,
  { orgId: string; id: string; data?: ConvertQuoteData }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id, data }) =>
      quotesService.convert(orgId, id, data ?? {}),
    onSuccess: (_, { orgId, id }) => {
      _invalidateQuote(qc, orgId, id);
      // La conversion crée une Sale en draft → invalider les ventes.
      qc.invalidateQueries({ queryKey: ["inventory", "sales", orgId] });
    },
  });
}

export function useDuplicateQuote(): UseMutationResult<
  QuoteResponse,
  Error,
  { orgId: string; id: string }
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, id }) => quotesService.duplicate(orgId, id),
    onSuccess: (_, { orgId }) => {
      qc.invalidateQueries({ queryKey: ["inventory", "quotes", orgId] });
    },
  });
}
