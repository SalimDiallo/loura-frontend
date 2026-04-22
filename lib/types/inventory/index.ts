/**
 * Types pour le module Inventory (catalogue, entrepôts).
 *
 * Ces types correspondent exactement aux serializers backend.
 */

import type { UserMiniInfo } from "../shared";

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  organization: string;
  parent: string | null;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  full_path: string;
  level: number;
  children_count: number;
  products_count: number;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
  level: number;
  products_count: number;
  children: CategoryTreeNode[];
}

export interface CreateCategoryData {
  name: string;
  parent_id?: string | null;
  description?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
}

export type UpdateCategoryData = Partial<CreateCategoryData>;

export interface CreateCategoryResponse {
  message: string;
  data: Category;
}

export interface UpdateCategoryResponse {
  message: string;
  data: Category;
}

export interface DeleteCategoryResponse {
  message: string;
}

// ─── Warehouse ───────────────────────────────────────────────────────────────

export interface WarehouseManager {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  organization: string;
  manager: WarehouseManager | null;
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  is_default: boolean;
  is_active: boolean;
  products_count: number;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreateWarehouseData {
  name: string;
  code: string;
  manager_id?: string | null;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  is_default?: boolean;
  is_active?: boolean;
}

export type UpdateWarehouseData = Partial<CreateWarehouseData>;

export interface CreateWarehouseResponse {
  message: string;
  data: Warehouse;
}

export interface UpdateWarehouseResponse {
  message: string;
  data: Warehouse;
}

export interface DeleteWarehouseResponse {
  message: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────

export type ProductUnit =
  | "piece"
  | "kg"
  | "g"
  | "l"
  | "ml"
  | "m"
  | "m2"
  | "m3"
  | "pack"
  | "box"
  | "hour"
  | "other";

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  organization: string;
  category: Category | null;
  description: string;
  unit: ProductUnit;
  unit_display: string;
  purchase_price: string;
  selling_price: string;
  tax_rate: string;
  min_stock_level: string;
  margin: string;
  margin_rate: string | null;
  image: string | null;
  image_url: string | null;
  track_stock: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreateProductData {
  name: string;
  sku: string;
  barcode?: string;
  category_id?: string | null;
  description?: string;
  unit?: ProductUnit;
  purchase_price?: string | number;
  selling_price?: string | number;
  tax_rate?: string | number;
  min_stock_level?: string | number;
  track_stock?: boolean;
  is_active?: boolean;
}

export type UpdateProductData = Partial<CreateProductData>;

export interface CreateProductResponse {
  message: string;
  data: Product;
}

export interface UpdateProductResponse {
  message: string;
  data: Product;
}

export interface DeleteProductResponse {
  message: string;
}

// ─── Filtres de liste ────────────────────────────────────────────────────────

export interface ListCategoriesParams {
  search?: string;
  parent?: string | "null";
  is_active?: boolean | string;
  page?: number;
  page_size?: number | string;
}

export interface ListWarehousesParams {
  search?: string;
  is_active?: boolean | string;
  page?: number;
  page_size?: number | string;
}

export interface ListProductsParams {
  search?: string;
  category?: string | "null";
  unit?: ProductUnit;
  is_active?: boolean | string;
  track_stock?: boolean | string;
  page?: number;
  page_size?: number | string;
}

// ─── Constantes UI (unités) ──────────────────────────────────────────────────

export const PRODUCT_UNITS: { value: ProductUnit; label: string }[] = [
  { value: "piece", label: "Pièce" },
  { value: "kg", label: "Kilogramme" },
  { value: "g", label: "Gramme" },
  { value: "l", label: "Litre" },
  { value: "ml", label: "Millilitre" },
  { value: "m", label: "Mètre" },
  { value: "m2", label: "Mètre carré" },
  { value: "m3", label: "Mètre cube" },
  { value: "pack", label: "Paquet" },
  { value: "box", label: "Carton" },
  { value: "hour", label: "Heure" },
  { value: "other", label: "Autre" },
];
