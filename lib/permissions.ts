/**
 * Définition centralisée des permissions.
 * Les codenames doivent correspondre exactement au backend (PermissionRegistry).
 */

export const PERMISSIONS = {
  // ── Core (Organisation) ───────────────────────────────────────────────────
  CORE: {
    VIEW_ORGANIZATION: 'core.view_organization',
    MANAGE_ORGANIZATION: 'core.manage_organization',
    MANAGE_SETTINGS: 'core.manage_settings',
  },
  // ── HR ────────────────────────────────────────────────────────────────────
  HR: {
    VIEW_EMPLOYEES: 'hr.view_employees',
    MANAGE_EMPLOYEES: 'hr.manage_employees',
    INVITE_EMPLOYEES: 'hr.invite_employees',
    MANAGE_ROLES: 'hr.manage_roles',
  },
  // ── Contrats ──────────────────────────────────────────────────────────────
  CONTRACTS: {
    VIEW: 'hr.view_contracts',
    MANAGE: 'hr.manage_contracts',
  },
  // ── Paie (Employee Payments) ──────────────────────────────────────────────
  PAYMENTS: {
    VIEW: 'hr.view_payments',
    MANAGE: 'hr.manage_payments',
    APPROVE: 'hr.approve_payments',
  },
  // ── Avances ───────────────────────────────────────────────────────────────
  ADVANCES: {
    VIEW: 'hr.view_advances',
    REQUEST: 'hr.request_advance',
    REVIEW: 'hr.review_advances',
  },
  // ── Congés ────────────────────────────────────────────────────────────────
  LEAVES: {
    VIEW: 'hr.view_leaves',
    REQUEST: 'hr.request_leave',
    REVIEW: 'hr.review_leaves',
    MANAGE_BALANCES: 'hr.manage_leave_balances',
  },
  // ── Inventaire : Produits ─────────────────────────────────────────────────
  PRODUCTS: {
    VIEW: 'inventory.view_products',
    MANAGE: 'inventory.manage_products',
  },
  // ── Inventaire : Catégories ───────────────────────────────────────────────
  PRODUCT_CATEGORIES: {
    VIEW: 'inventory.view_categories',
    MANAGE: 'inventory.manage_categories',
  },
  // ── Inventaire : Entrepôts ────────────────────────────────────────────────
  WAREHOUSES: {
    VIEW: 'inventory.view_warehouses',
    MANAGE: 'inventory.manage_warehouses',
  },
  // ── Inventaire : Stock ────────────────────────────────────────────────────
  STOCK: {
    VIEW: 'inventory.view_stock',
    MANAGE: 'inventory.manage_stock',
  },
  // ── Inventaire : Fournisseurs ─────────────────────────────────────────────
  SUPPLIERS: {
    VIEW: 'inventory.view_suppliers',
    MANAGE: 'inventory.manage_suppliers',
  },
  // ── Inventaire : Approvisionnements ───────────────────────────────────────
  PURCHASE_ORDERS: {
    VIEW: 'inventory.view_purchase_orders',
    MANAGE: 'inventory.manage_purchase_orders',
  },
  // ── HR : Clients (déplacé d'inventory) ────────────────────────────────────
  // Codenames conservés en `inventory.*` pour rétro-compatibilité avec les
  // rôles existants en base ; le module backend est désormais `hr`.
  CUSTOMERS: {
    VIEW: 'inventory.view_customers',
    MANAGE: 'inventory.manage_customers',
  },
  // ── Inventaire : Ventes ───────────────────────────────────────────────────
  SALES: {
    VIEW: 'inventory.view_sales',
    MANAGE: 'inventory.manage_sales',
  },
  // ── Inventaire : Rapports ─────────────────────────────────────────────────
  INVENTORY_REPORTS: {
    VIEW: 'inventory.view_reports',
  },
  // ── Services : Catégories ─────────────────────────────────────────────────
  SERVICE_CATEGORIES: {
    VIEW: 'services.view_categories',
    MANAGE: 'services.manage_categories',
  },
  // ── Services : Catalogue ──────────────────────────────────────────────────
  SERVICES: {
    VIEW: 'services.view_services',
    MANAGE: 'services.manage_services',
  },
  // ── Services : Modules (template) ─────────────────────────────────────────
  SERVICE_MODULES: {
    VIEW: 'services.view_modules',
    MANAGE: 'services.manage_modules',
  },
  // ── Services : Inscriptions clients ───────────────────────────────────────
  SERVICE_ENROLLMENTS: {
    VIEW: 'services.view_enrollments',
    MANAGE: 'services.manage_enrollments',
    ASSIGN_MODULES: 'services.assign_modules',
    UPDATE_MODULE_STATUS: 'services.update_module_status',
  },
  // ── Services : Transactions financières ───────────────────────────────────
  SERVICE_TRANSACTIONS: {
    VIEW: 'services.view_transactions',
    MANAGE: 'services.manage_transactions',
    CONFIRM: 'services.confirm_transactions',
  },
  // ── Services : Rapports (BI) ──────────────────────────────────────────────
  SERVICE_REPORTS: {
    VIEW: 'services.view_reports',
  },
} as const;

/**
 * Type helper : extrait tous les codenames plats.
 */
type NestedValues<T> = T extends string
  ? T
  : T extends Record<string, infer V>
    ? NestedValues<V>
    : never;

export type PermissionCode = NestedValues<typeof PERMISSIONS>;
