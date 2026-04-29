/**
 * Types pour le module Inventory (catalogue, entrepôts).
 *
 * Ces types correspondent exactement aux serializers backend.
 */

import type { UserMiniInfo } from "../shared";
import type { CustomerType } from "../hr";

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

// ─── Stock ───────────────────────────────────────────────────────────────────

export interface StockProductMini {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  unit: ProductUnit;
  unit_display: string;
  purchase_price: string;
  selling_price: string;
  min_stock_level: string;
  track_stock: boolean;
  is_active: boolean;
  category: Category | null;
  image: string | null;
}

export interface StockWarehouseMini {
  id: string;
  name: string;
  code: string;
  city: string;
  is_default: boolean;
  is_active: boolean;
}

export interface Stock {
  id: string;
  product: StockProductMini;
  warehouse: StockWarehouseMini;
  quantity: string;
  is_low: boolean;
  stock_value: string;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export type StockMovementType = "in" | "out" | "adjust" | "transfer";

export type StockMovementReason =
  | "purchase"
  | "sale"
  | "return_customer"
  | "return_supplier"
  | "inventory"
  | "loss"
  | "correction"
  | "transfer_in"
  | "transfer_out"
  | "other";

export type StockMovementStatus = "draft" | "validated" | "cancelled";

export interface StockMovement {
  id: string;
  organization: string;
  product: StockProductMini;
  warehouse: StockWarehouseMini;
  movement_type: StockMovementType;
  movement_type_display: string;
  reason: StockMovementReason;
  reason_display: string;
  status: StockMovementStatus;
  status_display: string;
  quantity: string;
  unit_cost: string;
  related_movement: string | null;
  reference: string;
  notes: string;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
  validated_by_info?: UserMiniInfo | null;
}

export interface CreateStockMovementData {
  product_id: string;
  warehouse_id: string;
  movement_type: "in" | "out" | "adjust";
  reason?: StockMovementReason;
  status?: StockMovementStatus;
  quantity: string | number;
  unit_cost?: string | number;
  reference?: string;
  notes?: string;
}

export interface UpdateStockMovementData {
  movement_type?: "in" | "out" | "adjust";
  reason?: StockMovementReason;
  quantity?: string | number;
  unit_cost?: string | number;
  reference?: string;
  notes?: string;
  product_id?: string;
  warehouse_id?: string;
}

export interface CreateStockMovementResponse {
  message: string;
  data: StockMovement;
}

export interface UpdateStockMovementResponse {
  message: string;
  data: StockMovement;
}

export interface StockTransferData {
  product_id: string;
  source_warehouse_id: string;
  target_warehouse_id: string;
  quantity: string | number;
  unit_cost?: string | number;
  reference?: string;
  notes?: string;
}

export interface StockTransferResponse {
  message: string;
  data: {
    out_movement: StockMovement;
    in_movement: StockMovement;
  };
}

export interface StockAlertWarehouseEntry {
  id: string;
  name: string;
  code: string;
  quantity: string;
}

export interface StockAlertEntry {
  product: {
    id: string;
    name: string;
    sku: string;
    unit: ProductUnit;
    unit_display: string;
    min_stock_level: string;
    image_url: string | null;
  };
  total_quantity: string;
  threshold: string;
  deficit: string;
  warehouses: StockAlertWarehouseEntry[];
}

export interface StockAlertsResponse {
  count: number;
  alerts: StockAlertEntry[];
}

export interface ListStocksParams {
  search?: string;
  warehouse?: string;
  product?: string;
  low?: string | boolean;
  page?: number;
  page_size?: number | string;
}

export interface ListStockMovementsParams {
  search?: string;
  warehouse?: string;
  product?: string;
  movement_type?: StockMovementType;
  reason?: StockMovementReason;
  status?: StockMovementStatus;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number | string;
}

// ─── Fournisseurs ────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  organization: string;
  name: string;
  code: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  tax_id: string;
  payment_terms_days: number;
  notes: string;
  is_active: boolean;
  purchase_orders_count: number;
  outstanding_amount: string;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreateSupplierData {
  name: string;
  code?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  payment_terms_days?: number;
  notes?: string;
  is_active?: boolean;
}

export type UpdateSupplierData = Partial<CreateSupplierData>;

export interface CreateSupplierResponse {
  message: string;
  data: Supplier;
}

export interface UpdateSupplierResponse {
  message: string;
  data: Supplier;
}

export interface DeleteSupplierResponse {
  message: string;
}

export interface ListSuppliersParams {
  search?: string;
  is_active?: boolean | string;
  page?: number;
  page_size?: number | string;
}

// ─── Approvisionnements (Purchase Orders) ────────────────────────────────────

export type PurchaseOrderStatus =
  | "draft"
  | "sent"
  | "partial"
  | "received"
  | "cancelled";

export type PurchaseOrderPaymentStatus = "unpaid" | "partial" | "paid";

export type PurchaseOrderPaymentMethod =
  | "cash"
  | "bank_transfer"
  | "mobile_money"
  | "check"
  | "card"
  | "other";

export interface PurchaseOrderSupplierMini {
  id: string;
  name: string;
  code: string;
  payment_terms_days: number;
}

export interface PurchaseOrderWarehouseMini {
  id: string;
  name: string;
  code: string;
}

export interface PurchaseOrderProductMini {
  id: string;
  name: string;
  sku: string;
  unit: ProductUnit;
  unit_display: string;
  purchase_price: string;
}

export interface PurchaseOrderItem {
  id: string;
  product: PurchaseOrderProductMini;
  quantity_ordered: string;
  quantity_received: string;
  unit_cost: string;
  tax_rate: string;
  line_subtotal: string;
  line_tax: string;
  line_total: string;
  remaining_to_receive: string;
  is_fully_received: boolean;
}

export interface PurchaseOrderPayment {
  id: string;
  amount: string;
  payment_date: string;
  method: PurchaseOrderPaymentMethod;
  method_display: string;
  reference: string;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface PurchaseOrder {
  id: string;
  organization: string;
  supplier: PurchaseOrderSupplierMini;
  warehouse: PurchaseOrderWarehouseMini;
  order_number: string;
  status: PurchaseOrderStatus;
  status_display: string;
  payment_status: PurchaseOrderPaymentStatus;
  payment_status_display: string;
  order_date: string;
  expected_date: string | null;
  subtotal: string;
  tax_amount: string;
  total: string;
  paid_amount: string;
  outstanding_amount: string;
  currency: string;
  notes: string;
  items: PurchaseOrderItem[];
  payments: PurchaseOrderPayment[];
  is_editable: boolean;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreatePurchaseOrderItemData {
  product_id: string;
  quantity_ordered: string | number;
  unit_cost: string | number;
  tax_rate?: string | number;
}

export interface CreatePurchaseOrderData {
  supplier_id: string;
  warehouse_id: string;
  order_date: string;
  expected_date?: string | null;
  currency?: string;
  notes?: string;
  items: CreatePurchaseOrderItemData[];
}

export interface UpdatePurchaseOrderData {
  warehouse_id?: string;
  order_date?: string;
  expected_date?: string | null;
  currency?: string;
  notes?: string;
  items?: CreatePurchaseOrderItemData[];
}

export interface PurchaseOrderResponse {
  message: string;
  data: PurchaseOrder;
}

export interface ReceivePurchaseOrderLine {
  item_id: string;
  quantity: string | number;
}

export interface ReceivePurchaseOrderData {
  reception_date?: string;
  reference?: string;
  notes?: string;
  lines: ReceivePurchaseOrderLine[];
}

export interface CreatePurchaseOrderPaymentData {
  amount: string | number;
  payment_date: string;
  method?: PurchaseOrderPaymentMethod;
  reference?: string;
  notes?: string;
}

export interface CreatePurchaseOrderPaymentResponse {
  message: string;
  data: PurchaseOrderPayment;
  purchase_order: PurchaseOrder;
}

export interface ListPurchaseOrdersParams {
  search?: string;
  status?: PurchaseOrderStatus;
  payment_status?: PurchaseOrderPaymentStatus;
  supplier?: string;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number | string;
}

export const PURCHASE_ORDER_PAYMENT_METHODS: {
  value: PurchaseOrderPaymentMethod;
  label: string;
}[] = [
  { value: "cash", label: "Espèces" },
  { value: "bank_transfer", label: "Virement bancaire" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "check", label: "Chèque" },
  { value: "card", label: "Carte bancaire" },
  { value: "other", label: "Autre" },
];

// ─── Ventes (Sales) ──────────────────────────────────────────────────────────

export type SaleType = "cash" | "credit";
export type SaleStatus = "draft" | "completed" | "cancelled";
export type SalePaymentStatus = "unpaid" | "partial" | "paid";
export type SaleDiscountType = "none" | "percentage" | "fixed";
export type SalePaymentMethod =
  | "cash"
  | "bank_transfer"
  | "mobile_money"
  | "check"
  | "card"
  | "other";
export type SaleInstallmentStatus = "pending" | "partial" | "paid" | "overdue";

export interface SaleCustomerMini {
  id: string;
  name: string;
  code: string;
  customer_type: CustomerType;
  customer_type_display: string;
  credit_limit: string;
  payment_terms_days: number;
}

export interface SaleWarehouseMini {
  id: string;
  name: string;
  code: string;
}

export interface SaleProductMini {
  id: string;
  name: string;
  sku: string;
  unit: ProductUnit;
  unit_display: string;
  selling_price: string;
}

export interface SaleItem {
  id: string;
  product: SaleProductMini;
  quantity: string;
  unit_price: string;
  discount_type: SaleDiscountType;
  discount_type_display: string;
  discount_value: string;
  tax_rate: string;
  line_subtotal: string;
  line_discount_amount: string;
  line_after_discount: string;
  line_tax: string;
  line_total: string;
}

export interface SalePayment {
  id: string;
  installment: string | null;
  amount: string;
  payment_date: string;
  method: SalePaymentMethod;
  method_display: string;
  reference: string;
  notes: string;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface SaleInstallment {
  id: string;
  due_date: string;
  amount: string;
  paid_amount: string;
  outstanding_amount: string;
  status: SaleInstallmentStatus;
  status_display: string;
  notes: string;
}

export interface Sale {
  id: string;
  organization: string;
  customer: SaleCustomerMini | null;
  warehouse: SaleWarehouseMini;
  sale_number: string;
  sale_type: SaleType;
  sale_type_display: string;
  status: SaleStatus;
  status_display: string;
  payment_status: SalePaymentStatus;
  payment_status_display: string;
  sale_date: string;
  due_date: string | null;
  subtotal: string;
  discount_type: SaleDiscountType;
  discount_type_display: string;
  discount_value: string;
  discount_amount: string;
  tax_amount: string;
  total: string;
  paid_amount: string;
  outstanding_amount: string;
  currency: string;
  notes: string;
  items: SaleItem[];
  payments: SalePayment[];
  installments: SaleInstallment[];
  is_editable: boolean;
  is_credit: boolean;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreateSaleItemData {
  product_id: string;
  quantity: string | number;
  unit_price: string | number;
  discount_type?: SaleDiscountType;
  discount_value?: string | number;
  tax_rate?: string | number;
}

export interface CreateSaleInstallmentData {
  due_date: string;
  amount: string | number;
  notes?: string;
}

export interface CreateSaleData {
  customer_id?: string | null;
  warehouse_id: string;
  sale_type?: SaleType;
  sale_date: string;
  due_date?: string | null;
  discount_type?: SaleDiscountType;
  discount_value?: string | number;
  currency?: string;
  notes?: string;
  items: CreateSaleItemData[];
  installments?: CreateSaleInstallmentData[];
}

export type UpdateSaleData = Partial<CreateSaleData>;

export interface SaleResponse {
  message: string;
  data: Sale;
}

export interface CreateSalePaymentData {
  amount: string | number;
  payment_date: string;
  method?: SalePaymentMethod;
  installment_id?: string | null;
  reference?: string;
  notes?: string;
}

export interface CreateSalePaymentResponse {
  message: string;
  data: SalePayment;
  sale: Sale;
}

export type SaleOrdering =
  | "sale_date"
  | "-sale_date"
  | "total"
  | "-total"
  | "created_at"
  | "-created_at"
  | "outstanding_amount"
  | "-outstanding_amount";

export interface ListSalesParams {
  search?: string;
  status?: SaleStatus;
  sale_type?: SaleType;
  payment_status?: SalePaymentStatus;
  customer?: string;
  warehouse?: string;
  from?: string;
  to?: string;
  min_total?: string | number;
  max_total?: string | number;
  ordering?: SaleOrdering;
  page?: number;
  page_size?: number | string;
}

export const SALE_PAYMENT_METHODS: {
  value: SalePaymentMethod;
  label: string;
}[] = [
  { value: "cash", label: "Espèces" },
  { value: "bank_transfer", label: "Virement bancaire" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "check", label: "Chèque" },
  { value: "card", label: "Carte bancaire" },
  { value: "other", label: "Autre" },
];

// ─── Inventaires physiques (stocktaking) ────────────────────────────────────

export type PhysicalInventoryStatus = "draft" | "completed" | "cancelled";

export interface PhysicalInventoryItem {
  id: string;
  product: StockProductMini;
  expected_quantity: string;
  counted_quantity: string | null;
  unit_cost: string;
  notes: string;
  delta: string | null;
  has_discrepancy: boolean;
  delta_value: string;
  adjustment_movement: string | null;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface PhysicalInventoryTotals {
  total_items: number;
  counted_items: number;
  uncounted_items: number;
  discrepancy_items: number;
  expected_total: string;
  counted_total: string;
  delta_total: string;
}

export interface PhysicalInventory {
  id: string;
  organization: string;
  warehouse: StockWarehouseMini;
  reference: string;
  status: PhysicalInventoryStatus;
  status_display: string;
  count_date: string;
  completed_at: string | null;
  cancelled_at: string | null;
  notes: string;
  items: PhysicalInventoryItem[];
  totals: PhysicalInventoryTotals;
  is_editable: boolean;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreatePhysicalInventoryData {
  warehouse_id: string;
  count_date: string;
  notes?: string;
}

export interface UpdatePhysicalInventoryData {
  count_date?: string;
  notes?: string;
}

export interface PopulatePhysicalInventoryData {
  include_zero?: boolean;
  product_ids?: string[];
}

export interface UpdatePhysicalInventoryItemInput {
  id?: string;
  product_id?: string;
  counted_quantity?: string | number | null;
  notes?: string;
}

export interface UpdatePhysicalInventoryItemsData {
  items: UpdatePhysicalInventoryItemInput[];
}

export interface PhysicalInventoryResponse {
  message: string;
  data: PhysicalInventory;
}

export interface ListPhysicalInventoriesParams {
  search?: string;
  status?: PhysicalInventoryStatus;
  warehouse?: string;
  from?: string;
  to?: string;
  page?: number;
  page_size?: number | string;
}

// ─── Devis / Pro forma (Quotes) ──────────────────────────────────────────────

export type QuoteType = "quote" | "proforma";

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted";

export type QuoteDiscountType = SaleDiscountType;

export interface QuoteCustomerMini {
  id: string;
  name: string;
  code: string;
  customer_type: CustomerType;
  customer_type_display: string;
  email: string;
  phone: string;
  address: string;
}

export interface QuoteWarehouseMini {
  id: string;
  name: string;
  code: string;
}

export interface QuoteSaleMini {
  id: string;
  sale_number: string;
  status: SaleStatus;
  total: string;
}

export interface QuoteProductMini {
  id: string;
  name: string;
  sku: string;
  unit: ProductUnit;
  unit_display: string;
  selling_price: string;
}

export interface QuoteItem {
  id: string;
  product: QuoteProductMini;
  quantity: string;
  unit_price: string;
  discount_type: QuoteDiscountType;
  discount_type_display: string;
  discount_value: string;
  tax_rate: string;
  description: string;
  line_subtotal: string;
  line_discount_amount: string;
  line_after_discount: string;
  line_tax: string;
  line_total: string;
}

export interface Quote {
  id: string;
  organization: string;
  customer: QuoteCustomerMini | null;
  customer_name_snapshot: string;
  warehouse: QuoteWarehouseMini;
  quote_number: string;
  quote_type: QuoteType;
  quote_type_display: string;
  status: QuoteStatus;
  status_display: string;
  issue_date: string;
  valid_until: string | null;
  subtotal: string;
  discount_type: QuoteDiscountType;
  discount_type_display: string;
  discount_value: string;
  discount_amount: string;
  tax_amount: string;
  total: string;
  currency: string;
  notes: string;
  terms: string;
  sent_at: string | null;
  sent_by_info?: UserMiniInfo | null;
  accepted_at: string | null;
  accepted_by_info?: UserMiniInfo | null;
  rejected_at: string | null;
  rejected_by_info?: UserMiniInfo | null;
  rejection_reason: string;
  expired_at: string | null;
  expired_by_info?: UserMiniInfo | null;
  converted_at: string | null;
  converted_by_info?: UserMiniInfo | null;
  converted_to_sale: QuoteSaleMini | null;
  items: QuoteItem[];
  is_editable: boolean;
  is_terminal: boolean;
  is_expired_by_date: boolean;
  created_at: string;
  updated_at: string;
  created_by_info?: UserMiniInfo | null;
  updated_by_info?: UserMiniInfo | null;
}

export interface CreateQuoteItemData {
  product_id: string;
  quantity: string;
  unit_price: string;
  discount_type?: QuoteDiscountType;
  discount_value?: string;
  tax_rate?: string;
  description?: string;
}

export interface CreateQuoteData {
  customer_id?: string | null;
  customer_name_snapshot?: string;
  warehouse_id: string;
  quote_type?: QuoteType;
  issue_date: string;
  valid_until?: string | null;
  discount_type?: QuoteDiscountType;
  discount_value?: string;
  currency?: string;
  notes?: string;
  terms?: string;
  items: CreateQuoteItemData[];
}

export interface UpdateQuoteData {
  customer_id?: string | null;
  customer_name_snapshot?: string;
  warehouse_id?: string;
  quote_type?: QuoteType;
  issue_date?: string;
  valid_until?: string | null;
  discount_type?: QuoteDiscountType;
  discount_value?: string;
  currency?: string;
  notes?: string;
  terms?: string;
  items?: CreateQuoteItemData[];
}

export interface QuoteResponse {
  message: string;
  data: Quote;
}

export interface ConvertQuoteData {
  sale_type?: SaleType;
  sale_date?: string;
  due_date?: string | null;
}

export interface RejectQuoteData {
  reason?: string;
}

export interface ListQuotesParams {
  search?: string;
  status?: QuoteStatus;
  quote_type?: QuoteType;
  customer?: string;
  warehouse?: string;
  from?: string;
  to?: string;
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
