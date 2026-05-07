/**
 * Configuration de l'API
 * Ce fichier contient la configuration de base pour les appels API
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
}

/**
 * Clés de stockage local
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "loura_access_token",
  REFRESH_TOKEN: "loura_refresh_token",
  USER: "loura_user",
  // Drapeau persistant choisissant le storage des tokens (localStorage vs sessionStorage)
  // Stocké dans localStorage uniquement.
  REMEMBER_ME: "loura_remember_me",
} as const

/**
 * Endpoints de l'API par module
 */
export const API_ENDPOINTS = {
  /**
   * Module CORE - Authentification, Organisations, Catégories
   */
  // Authentification unifiée (Admin et Employee)
  AUTH: {
    LOGIN: "/auth/login/", // Login unifié
    REGISTER: "/auth/register/", // Registration Admin + Organisation
    LOGOUT: "/auth/logout/", // Logout centralisé
    REFRESH: "/auth/token/refresh/", // Refresh centralisé (endpoint DRF standard)
    ME: "/auth/me/", // Utilisateur courant
    UPDATE_PROFILE: "/auth/profile/update/", // Mise à jour du profil
    CHANGE_PASSWORD: "/auth/profile/change-password/", // Changement de mot de passe
    UPLOAD_AVATAR: "/auth/profile/upload-avatar/", // Upload d'avatar
    DELETE_AVATAR: "/auth/profile/upload-avatar/", // Suppression d'avatar (même endpoint, méthode DELETE)
    VERIFY_EMAIL: "/auth/email/verify/", // Vérification d'email via token signé
    RESEND_VERIFICATION: "/auth/email/resend/", // Renvoi du lien de vérification
    FORGOT_PASSWORD: "/auth/password/forgot/", // Demande d'email de reset
    RESET_PASSWORD: "/auth/password/reset/", // Soumission du nouveau mot de passe
  },

  CORE: {
    // Organisations
    ORGANIZATIONS: {
      LIST: "/core/organizations/",
      CREATE: "/core/organizations/",
      DETAIL: (id: string) => `/core/organizations/${id}/`,
      UPDATE: (id: string) => `/core/organizations/${id}/`,
      DELETE: (id: string) => `/core/organizations/${id}/`,
      ACTIVATE: (id: string) => `/core/organizations/${id}/activate/`,
      DEACTIVATE: (id: string) => `/core/organizations/${id}/deactivate/`,
      UPLOAD_LOGO: (id: string) => `/core/organizations/${id}/logo/`,
      SETTINGS: (id: string) => `/core/organizations/${id}/settings/`,
      DOCUMENT: (id: string, docType: string, objectId: string) =>
        `/core/organizations/${id}/documents/${docType}/${objectId}/`,
      DOCUMENT_SAMPLE: (id: string) =>
        `/core/organizations/${id}/documents/_sample/`,
    },
    // Catégories
    CATEGORIES: {
      LIST: "/core/categories/",
      DETAIL: (id: number) => `/core/categories/${id}/`,
    },
    // Modules (catalogue + installations par organisation)
    MODULES: {
      CATALOG: "/core/modules/",
      LIST: (orgId: string) => `/core/organizations/${orgId}/modules/`,
      INSTALL: (orgId: string) => `/core/organizations/${orgId}/modules/`,
      DETAIL: (orgId: string, id: string) =>
        `/core/organizations/${orgId}/modules/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/core/organizations/${orgId}/modules/${id}/`,
      UNINSTALL: (orgId: string, id: string) =>
        `/core/organizations/${orgId}/modules/${id}/`,
    },
    // Abonnements / Facturation
    BILLING: {
      PLANS: "/core/billing/plans/",
      MY_SUBSCRIPTION: "/core/billing/subscription/",
      CHANGE_PLAN: "/core/billing/subscription/change-plan/",
      CANCEL: "/core/billing/subscription/cancel/",
      CANCEL_SCHEDULED_CHANGE:
        "/core/billing/subscription/scheduled-change/cancel/",
      AUTO_RENEW: "/core/billing/subscription/auto-renew/",
      RENEW_NOW: "/core/billing/subscription/renew-now/",
      EVENTS: "/core/billing/events/",
      TRANSACTION_STATUS: (reference: string) =>
        `/core/billing/transactions/${reference}/status/`,
    },
  },

  // ── Monitoring (superadmin only) ───────────────────────────────────────────
  MONITORING: {
    VISITS_SUMMARY: "/monitoring/visits/summary/",
    VISITS_LIST: "/monitoring/visits/list/",
    VISITS_UNIQUE: "/monitoring/visits/unique/",
    ORGS_STATS: "/monitoring/orgs/stats/",
    SUBSCRIPTIONS_STATS: "/monitoring/subscriptions/stats/",
    LOGS_BACKEND: "/monitoring/logs/backend/",
    LOGS_FRONTEND: "/monitoring/logs/frontend/",
    LOGS_FRONTEND_INGEST: "/monitoring/logs/frontend/ingest/",
    ERRORS_LIST: "/monitoring/errors/",
    ERROR_DETAIL: (id: number) => `/monitoring/errors/${id}/`,
  },

  // ── HR (Human Resources) ────────────────────────────────────────────────────
  HR: {
    // Permissions
    PERMISSIONS: {
      LIST: "/hr/permissions/",
    },
    // Rôles
    ROLES: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/roles/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/roles/`,
      DETAIL: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/roles/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/roles/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/roles/${id}/`,
    },
    // Membres
    MEMBERS: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/members/`,
      DETAIL: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/members/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/members/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/members/${id}/`,
      MY_MEMBERSHIPS: "/hr/my-memberships/",
      MY_PERMISSIONS: (orgId: string) =>
        `/hr/organizations/${orgId}/my-permissions/`,
      WAREHOUSE_ACCESS: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/members/${id}/warehouse-access/`,
    },
    // Invitations
    INVITATIONS: {
      SEND: (orgId: string) => `/hr/organizations/${orgId}/invitations/`,
      LIST: (orgId: string) => `/hr/organizations/${orgId}/invitations/`,
      PENDING: "/hr/invitations/pending/",
      ACCEPT: (id: string) => `/hr/invitations/${id}/accept/`,
      DECLINE: (id: string) => `/hr/invitations/${id}/decline/`,
      // Routes empruntables depuis le lien reçu par email (token signé).
      BY_TOKEN: (token: string) => `/hr/invitations/by-token/${token}/`,
      ACCEPT_BY_TOKEN: (token: string) =>
        `/hr/invitations/by-token/${token}/accept/`,
    },
    // Départements
    DEPARTMENTS: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/departments/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/departments/`,
      TREE: (orgId: string) => `/hr/organizations/${orgId}/departments/tree/`,
      DETAIL: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/departments/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/departments/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/departments/${id}/`,
    },
    // Postes
    POSITIONS: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/positions/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/positions/`,
      DETAIL: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/positions/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/positions/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/positions/${id}/`,
      MEMBERS: (orgId: string, positionId: string) =>
        `/hr/organizations/${orgId}/positions/${positionId}/members/`,
    },
    // Assignations de postes
    ASSIGNMENTS: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/assignments/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/assignments/`,
      DETAIL: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/assignments/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/assignments/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/assignments/${id}/`,
      BY_MEMBER: (orgId: string, membershipId: string) =>
        `/hr/organizations/${orgId}/members/${membershipId}/assignments/`,
    },
    // Contrats
    CONTRACTS: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/contracts/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/contracts/`,
      DETAIL: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/contracts/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/contracts/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/contracts/${id}/`,
      BY_MEMBER: (orgId: string, membershipId: string) =>
        `/hr/organizations/${orgId}/members/${membershipId}/contracts/`,
    },
    // Paiements
    PAYMENTS: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/payments/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/payments/`,
      DETAIL: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/payments/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/payments/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/payments/${id}/`,
      BY_MEMBER: (orgId: string, membershipId: string) =>
        `/hr/organizations/${orgId}/members/${membershipId}/payments/`,
    },
    // Demandes d'avance
    ADVANCES: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/advances/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/advances/`,
      DETAIL: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/advances/${id}/`,
      REVIEW: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/advances/${id}/review/`,
      BY_MEMBER: (orgId: string, membershipId: string) =>
        `/hr/organizations/${orgId}/members/${membershipId}/advances/`,
    },
    // Soldes de congés
    LEAVE_BALANCES: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/leave-balances/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/leave-balances/`,
      DETAIL: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/leave-balances/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/leave-balances/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/leave-balances/${id}/`,
      BY_MEMBER: (orgId: string, membershipId: string) =>
        `/hr/organizations/${orgId}/members/${membershipId}/leave-balances/`,
    },
    // Demandes de congé
    LEAVES: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/leaves/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/leaves/`,
      DETAIL: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/leaves/${id}/`,
      REVIEW: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/leaves/${id}/review/`,
      CANCEL: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/leaves/${id}/cancel/`,
      BY_MEMBER: (orgId: string, membershipId: string) =>
        `/hr/organizations/${orgId}/members/${membershipId}/leaves/`,
    },
    // Analytics (dashboard HR)
    ANALYTICS: {
      OVERVIEW: (orgId: string) =>
        `/hr/organizations/${orgId}/analytics/overview/`,
      HEADCOUNT: (orgId: string) =>
        `/hr/organizations/${orgId}/analytics/headcount/`,
      LEAVES: (orgId: string) => `/hr/organizations/${orgId}/analytics/leaves/`,
      PAYROLL: (orgId: string) =>
        `/hr/organizations/${orgId}/analytics/payroll/`,
      CONTRACTS: (orgId: string) =>
        `/hr/organizations/${orgId}/analytics/contracts/`,
      PENDING_ACTIONS: (orgId: string) =>
        `/hr/organizations/${orgId}/analytics/pending-actions/`,
    },
    // Clients (déplacé d'INVENTORY vers HR)
    CUSTOMERS: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/customers/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/customers/`,
      DETAIL: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/customers/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/customers/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/hr/organizations/${orgId}/customers/${id}/`,
    },
  },

  // ── INVENTORY (Catalogue, Entrepôts) ────────────────────────────────────────
  INVENTORY: {
    // Catégories produits
    CATEGORIES: {
      LIST: (orgId: string) => `/inventory/organizations/${orgId}/categories/`,
      CREATE: (orgId: string) =>
        `/inventory/organizations/${orgId}/categories/`,
      TREE: (orgId: string) =>
        `/inventory/organizations/${orgId}/categories/tree/`,
      DETAIL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/categories/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/categories/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/categories/${id}/`,
    },
    // Entrepôts
    WAREHOUSES: {
      LIST: (orgId: string) => `/inventory/organizations/${orgId}/warehouses/`,
      CREATE: (orgId: string) =>
        `/inventory/organizations/${orgId}/warehouses/`,
      DETAIL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/warehouses/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/warehouses/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/warehouses/${id}/`,
    },
    // Produits
    PRODUCTS: {
      LIST: (orgId: string) => `/inventory/organizations/${orgId}/products/`,
      CREATE: (orgId: string) => `/inventory/organizations/${orgId}/products/`,
      DETAIL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/products/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/products/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/products/${id}/`,
      IMAGE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/products/${id}/image/`,
    },
    // Stock (niveaux courants)
    STOCKS: {
      LIST: (orgId: string) => `/inventory/organizations/${orgId}/stocks/`,
      ALERTS: (orgId: string) =>
        `/inventory/organizations/${orgId}/stocks/alerts/`,
    },
    // Mouvements de stock
    STOCK_MOVEMENTS: {
      LIST: (orgId: string) =>
        `/inventory/organizations/${orgId}/stock-movements/`,
      CREATE: (orgId: string) =>
        `/inventory/organizations/${orgId}/stock-movements/`,
      DETAIL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/stock-movements/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/stock-movements/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/stock-movements/${id}/`,
      VALIDATE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/stock-movements/${id}/validate/`,
      CANCEL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/stock-movements/${id}/cancel/`,
    },
    // Transferts
    STOCK_TRANSFERS: {
      CREATE: (orgId: string) =>
        `/inventory/organizations/${orgId}/stock-transfers/`,
    },
    // Fournisseurs
    SUPPLIERS: {
      LIST: (orgId: string) => `/inventory/organizations/${orgId}/suppliers/`,
      CREATE: (orgId: string) => `/inventory/organizations/${orgId}/suppliers/`,
      DETAIL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/suppliers/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/suppliers/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/suppliers/${id}/`,
    },
    // Ventes (Sales)
    SALES: {
      LIST: (orgId: string) => `/inventory/organizations/${orgId}/sales/`,
      CREATE: (orgId: string) => `/inventory/organizations/${orgId}/sales/`,
      DETAIL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/sales/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/sales/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/sales/${id}/`,
      COMPLETE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/sales/${id}/complete/`,
      CANCEL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/sales/${id}/cancel/`,
      PAYMENTS: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/sales/${id}/payments/`,
      PAYMENT_DETAIL: (orgId: string, id: string, paymentId: string) =>
        `/inventory/organizations/${orgId}/sales/${id}/payments/${paymentId}/`,
      INSTALLMENTS: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/sales/${id}/installments/`,
    },
    // Analytics (BI)
    ANALYTICS: {
      OVERVIEW: (orgId: string) =>
        `/inventory/organizations/${orgId}/analytics/overview/`,
      SALES_TREND: (orgId: string) =>
        `/inventory/organizations/${orgId}/analytics/sales-trend/`,
      TOP_PRODUCTS: (orgId: string) =>
        `/inventory/organizations/${orgId}/analytics/top-products/`,
      STOCK_VALUE: (orgId: string) =>
        `/inventory/organizations/${orgId}/analytics/stock-value/`,
      STOCK_ALERTS: (orgId: string) =>
        `/inventory/organizations/${orgId}/analytics/stock-alerts/`,
      MARGIN: (orgId: string) =>
        `/inventory/organizations/${orgId}/analytics/margin/`,
      MOVEMENTS: (orgId: string) =>
        `/inventory/organizations/${orgId}/analytics/movements/`,
      EXPENSES: (orgId: string) =>
        `/inventory/organizations/${orgId}/analytics/expenses/`,
    },
    // Dépenses
    EXPENSES: {
      LIST: (orgId: string) => `/inventory/organizations/${orgId}/expenses/`,
      CREATE: (orgId: string) => `/inventory/organizations/${orgId}/expenses/`,
      DETAIL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/expenses/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/expenses/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/expenses/${id}/`,
    },
    // Commandes fournisseur (Purchase Orders)
    PURCHASE_ORDERS: {
      LIST: (orgId: string) =>
        `/inventory/organizations/${orgId}/purchase-orders/`,
      CREATE: (orgId: string) =>
        `/inventory/organizations/${orgId}/purchase-orders/`,
      DETAIL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/purchase-orders/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/purchase-orders/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/purchase-orders/${id}/`,
      SEND: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/purchase-orders/${id}/send/`,
      CANCEL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/purchase-orders/${id}/cancel/`,
      RECEIVE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/purchase-orders/${id}/receive/`,
      PAYMENTS: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/purchase-orders/${id}/payments/`,
      PAYMENT_DETAIL: (orgId: string, id: string, paymentId: string) =>
        `/inventory/organizations/${orgId}/purchase-orders/${id}/payments/${paymentId}/`,
    },
    QUOTES: {
      LIST: (orgId: string) => `/inventory/organizations/${orgId}/quotes/`,
      CREATE: (orgId: string) => `/inventory/organizations/${orgId}/quotes/`,
      DETAIL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/quotes/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/quotes/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/quotes/${id}/`,
      SEND: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/quotes/${id}/send/`,
      ACCEPT: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/quotes/${id}/accept/`,
      REJECT: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/quotes/${id}/reject/`,
      EXPIRE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/quotes/${id}/expire/`,
      CONVERT: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/quotes/${id}/convert/`,
      DUPLICATE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/quotes/${id}/duplicate/`,
    },
    PHYSICAL_INVENTORIES: {
      LIST: (orgId: string) =>
        `/inventory/organizations/${orgId}/physical-inventories/`,
      CREATE: (orgId: string) =>
        `/inventory/organizations/${orgId}/physical-inventories/`,
      DETAIL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/physical-inventories/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/physical-inventories/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/physical-inventories/${id}/`,
      POPULATE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/physical-inventories/${id}/populate/`,
      ITEMS: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/physical-inventories/${id}/items/`,
      COMPLETE: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/physical-inventories/${id}/complete/`,
      CANCEL: (orgId: string, id: string) =>
        `/inventory/organizations/${orgId}/physical-inventories/${id}/cancel/`,
    },
  },

  // ── SERVICES (Catalogue, Inscriptions, Transactions) ──────────────────────
  SERVICES: {
    CATEGORIES: {
      LIST: (orgId: string) => `/services/organizations/${orgId}/categories/`,
      CREATE: (orgId: string) => `/services/organizations/${orgId}/categories/`,
      TREE: (orgId: string) =>
        `/services/organizations/${orgId}/categories/tree/`,
      DETAIL: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/categories/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/categories/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/categories/${id}/`,
    },
    SERVICES: {
      LIST: (orgId: string) => `/services/organizations/${orgId}/services/`,
      CREATE: (orgId: string) => `/services/organizations/${orgId}/services/`,
      DETAIL: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/services/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/services/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/services/${id}/`,
    },
    SERVICE_MODULES: {
      LIST: (orgId: string, serviceId: string) =>
        `/services/organizations/${orgId}/services/${serviceId}/modules/`,
      CREATE: (orgId: string, serviceId: string) =>
        `/services/organizations/${orgId}/services/${serviceId}/modules/`,
      DETAIL: (orgId: string, serviceId: string, id: string) =>
        `/services/organizations/${orgId}/services/${serviceId}/modules/${id}/`,
      UPDATE: (orgId: string, serviceId: string, id: string) =>
        `/services/organizations/${orgId}/services/${serviceId}/modules/${id}/`,
      DELETE: (orgId: string, serviceId: string, id: string) =>
        `/services/organizations/${orgId}/services/${serviceId}/modules/${id}/`,
    },
    ENROLLMENTS: {
      LIST: (orgId: string) => `/services/organizations/${orgId}/enrollments/`,
      CREATE: (orgId: string) =>
        `/services/organizations/${orgId}/enrollments/`,
      DETAIL: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/enrollments/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/enrollments/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/enrollments/${id}/`,
      GENERATE_MODULES: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/enrollments/${id}/generate-modules/`,
      ADD_MODULE: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/enrollments/${id}/add-module/`,
      RECOMPUTE_TOTAL: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/enrollments/${id}/recompute-total/`,
      MODULES: (orgId: string, enrollmentId: string) =>
        `/services/organizations/${orgId}/enrollments/${enrollmentId}/modules/`,
      TRANSACTIONS: (orgId: string, enrollmentId: string) =>
        `/services/organizations/${orgId}/enrollments/${enrollmentId}/transactions/`,
      BY_CUSTOMER: (orgId: string, customerId: string) =>
        `/services/organizations/${orgId}/customers/${customerId}/enrollments/`,
    },
    MODULE_INSTANCES: {
      DETAIL: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/module-instances/${id}/`,
      START: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/module-instances/${id}/start/`,
      COMPLETE: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/module-instances/${id}/complete/`,
      BLOCK: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/module-instances/${id}/block/`,
      SKIP: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/module-instances/${id}/skip/`,
      REOPEN: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/module-instances/${id}/reopen/`,
      NOTES: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/module-instances/${id}/notes/`,
      ATTACHMENTS: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/module-instances/${id}/attachments/`,
      ATTACHMENT_DETAIL: (orgId: string, id: string, attId: string) =>
        `/services/organizations/${orgId}/module-instances/${id}/attachments/${attId}/`,
    },
    TRANSACTIONS: {
      LIST: (orgId: string) => `/services/organizations/${orgId}/transactions/`,
      CREATE: (orgId: string) =>
        `/services/organizations/${orgId}/transactions/`,
      DETAIL: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/transactions/${id}/`,
      UPDATE: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/transactions/${id}/`,
      DELETE: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/transactions/${id}/`,
      CONFIRM: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/transactions/${id}/confirm/`,
      CANCEL: (orgId: string, id: string) =>
        `/services/organizations/${orgId}/transactions/${id}/cancel/`,
    },
    ACTIVITY_LOGS: {
      LIST: (orgId: string) =>
        `/services/organizations/${orgId}/activity-logs/`,
    },
    ANALYTICS: {
      SUMMARY: (orgId: string) =>
        `/services/organizations/${orgId}/analytics/summary/`,
    },
  },

  // ── Feedback utilisateur ────────────────────────────────────────────────
  FEEDBACK: {
    CREATE: "/feedback/",
    LIST: "/feedback/list/",
    DETAIL: (id: number) => `/feedback/list/${id}/`,
  },
} as const
