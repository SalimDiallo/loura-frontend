/**
 * Configuration de l'API
 * Ce fichier contient la configuration de base pour les appels API
 */

export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Clés de stockage local
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'loura_access_token',
  REFRESH_TOKEN: 'loura_refresh_token',
  USER: 'loura_user',
} as const;

/**
 * Endpoints de l'API par module
 */
export const API_ENDPOINTS = {
  /**
   * Module CORE - Authentification, Organisations, Catégories
   */
  // Authentification unifiée (Admin et Employee)
  AUTH: {
    LOGIN: '/auth/login/',                         // Login unifié
    REGISTER: '/auth/register/',                   // Registration Admin + Organisation
    LOGOUT: '/auth/logout/',                       // Logout centralisé
    REFRESH: '/auth/token/refresh/',               // Refresh centralisé (endpoint DRF standard)
    ME: '/auth/me/',                               // Utilisateur courant
    UPDATE_PROFILE: '/auth/profile/update/',       // Mise à jour du profil
    CHANGE_PASSWORD: '/auth/profile/change-password/',  // Changement de mot de passe
    UPLOAD_AVATAR: '/auth/profile/upload-avatar/', // Upload d'avatar
    DELETE_AVATAR: '/auth/profile/upload-avatar/', // Suppression d'avatar (même endpoint, méthode DELETE)
  },

  CORE: {
    // Organisations
    ORGANIZATIONS: {
      LIST: '/core/organizations/',
      CREATE: '/core/organizations/',
      DETAIL: (id: string) => `/core/organizations/${id}/`,
      UPDATE: (id: string) => `/core/organizations/${id}/`,
      DELETE: (id: string) => `/core/organizations/${id}/`,
      ACTIVATE: (id: string) => `/core/organizations/${id}/activate/`,
      DEACTIVATE: (id: string) => `/core/organizations/${id}/deactivate/`,
      UPLOAD_LOGO: (id: string) => `/core/organizations/${id}/logo/`,
      SETTINGS: (id: string) => `/core/organizations/${id}/settings/`,
      DOCUMENT: (id: string, docType: string, objectId: string) =>
        `/core/organizations/${id}/documents/${docType}/${objectId}/`,
    },
    // Catégories
    CATEGORIES: {
      LIST: '/core/categories/',
      DETAIL: (id: number) => `/core/categories/${id}/`,
    },
  },

  // ── HR (Human Resources) ────────────────────────────────────────────────────
  HR: {
    // Permissions
    PERMISSIONS: {
      LIST: '/hr/permissions/',
    },
    // Rôles
    ROLES: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/roles/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/roles/`,
      DETAIL: (orgId: string, id: string) => `/hr/organizations/${orgId}/roles/${id}/`,
      UPDATE: (orgId: string, id: string) => `/hr/organizations/${orgId}/roles/${id}/`,
      DELETE: (orgId: string, id: string) => `/hr/organizations/${orgId}/roles/${id}/`,
    },
    // Membres
    MEMBERS: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/members/`,
      DETAIL: (orgId: string, id: string) => `/hr/organizations/${orgId}/members/${id}/`,
      UPDATE: (orgId: string, id: string) => `/hr/organizations/${orgId}/members/${id}/`,
      DELETE: (orgId: string, id: string) => `/hr/organizations/${orgId}/members/${id}/`,
      MY_MEMBERSHIPS: '/hr/my-memberships/',
      MY_PERMISSIONS: (orgId: string) => `/hr/organizations/${orgId}/my-permissions/`,
    },
    // Invitations
    INVITATIONS: {
      SEND: (orgId: string) => `/hr/organizations/${orgId}/invitations/`,
      LIST: (orgId: string) => `/hr/organizations/${orgId}/invitations/`,
      PENDING: '/hr/invitations/pending/',
      ACCEPT: (id: string) => `/hr/invitations/${id}/accept/`,
      DECLINE: (id: string) => `/hr/invitations/${id}/decline/`,
    },
    // Départements
    DEPARTMENTS: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/departments/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/departments/`,
      TREE: (orgId: string) => `/hr/organizations/${orgId}/departments/tree/`,
      DETAIL: (orgId: string, id: string) => `/hr/organizations/${orgId}/departments/${id}/`,
      UPDATE: (orgId: string, id: string) => `/hr/organizations/${orgId}/departments/${id}/`,
      DELETE: (orgId: string, id: string) => `/hr/organizations/${orgId}/departments/${id}/`,
    },
    // Postes
    POSITIONS: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/positions/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/positions/`,
      DETAIL: (orgId: string, id: string) => `/hr/organizations/${orgId}/positions/${id}/`,
      UPDATE: (orgId: string, id: string) => `/hr/organizations/${orgId}/positions/${id}/`,
      DELETE: (orgId: string, id: string) => `/hr/organizations/${orgId}/positions/${id}/`,
      MEMBERS: (orgId: string, positionId: string) => `/hr/organizations/${orgId}/positions/${positionId}/members/`,
    },
    // Assignations de postes
    ASSIGNMENTS: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/assignments/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/assignments/`,
      DETAIL: (orgId: string, id: string) => `/hr/organizations/${orgId}/assignments/${id}/`,
      UPDATE: (orgId: string, id: string) => `/hr/organizations/${orgId}/assignments/${id}/`,
      DELETE: (orgId: string, id: string) => `/hr/organizations/${orgId}/assignments/${id}/`,
      BY_MEMBER: (orgId: string, membershipId: string) => `/hr/organizations/${orgId}/members/${membershipId}/assignments/`,
    },
    // Contrats
    CONTRACTS: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/contracts/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/contracts/`,
      DETAIL: (orgId: string, id: string) => `/hr/organizations/${orgId}/contracts/${id}/`,
      UPDATE: (orgId: string, id: string) => `/hr/organizations/${orgId}/contracts/${id}/`,
      DELETE: (orgId: string, id: string) => `/hr/organizations/${orgId}/contracts/${id}/`,
      BY_MEMBER: (orgId: string, membershipId: string) => `/hr/organizations/${orgId}/members/${membershipId}/contracts/`,
    },
    // Paiements
    PAYMENTS: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/payments/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/payments/`,
      DETAIL: (orgId: string, id: string) => `/hr/organizations/${orgId}/payments/${id}/`,
      UPDATE: (orgId: string, id: string) => `/hr/organizations/${orgId}/payments/${id}/`,
      DELETE: (orgId: string, id: string) => `/hr/organizations/${orgId}/payments/${id}/`,
      BY_MEMBER: (orgId: string, membershipId: string) => `/hr/organizations/${orgId}/members/${membershipId}/payments/`,
    },
    // Demandes d'avance
    ADVANCES: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/advances/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/advances/`,
      DETAIL: (orgId: string, id: string) => `/hr/organizations/${orgId}/advances/${id}/`,
      REVIEW: (orgId: string, id: string) => `/hr/organizations/${orgId}/advances/${id}/review/`,
      BY_MEMBER: (orgId: string, membershipId: string) => `/hr/organizations/${orgId}/members/${membershipId}/advances/`,
    },
    // Soldes de congés
    LEAVE_BALANCES: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/leave-balances/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/leave-balances/`,
      DETAIL: (orgId: string, id: string) => `/hr/organizations/${orgId}/leave-balances/${id}/`,
      UPDATE: (orgId: string, id: string) => `/hr/organizations/${orgId}/leave-balances/${id}/`,
      DELETE: (orgId: string, id: string) => `/hr/organizations/${orgId}/leave-balances/${id}/`,
      BY_MEMBER: (orgId: string, membershipId: string) => `/hr/organizations/${orgId}/members/${membershipId}/leave-balances/`,
    },
    // Demandes de congé
    LEAVES: {
      LIST: (orgId: string) => `/hr/organizations/${orgId}/leaves/`,
      CREATE: (orgId: string) => `/hr/organizations/${orgId}/leaves/`,
      DETAIL: (orgId: string, id: string) => `/hr/organizations/${orgId}/leaves/${id}/`,
      REVIEW: (orgId: string, id: string) => `/hr/organizations/${orgId}/leaves/${id}/review/`,
      CANCEL: (orgId: string, id: string) => `/hr/organizations/${orgId}/leaves/${id}/cancel/`,
      BY_MEMBER: (orgId: string, membershipId: string) => `/hr/organizations/${orgId}/members/${membershipId}/leaves/`,
    },
    // Analytics (dashboard HR)
    ANALYTICS: {
      OVERVIEW: (orgId: string) => `/hr/organizations/${orgId}/analytics/overview/`,
      HEADCOUNT: (orgId: string) => `/hr/organizations/${orgId}/analytics/headcount/`,
      LEAVES: (orgId: string) => `/hr/organizations/${orgId}/analytics/leaves/`,
      PAYROLL: (orgId: string) => `/hr/organizations/${orgId}/analytics/payroll/`,
      CONTRACTS: (orgId: string) => `/hr/organizations/${orgId}/analytics/contracts/`,
      PENDING_ACTIONS: (orgId: string) => `/hr/organizations/${orgId}/analytics/pending-actions/`,
    },
  },

  // ── INVENTORY (Catalogue, Entrepôts) ────────────────────────────────────────
  INVENTORY: {
    // Catégories produits
    CATEGORIES: {
      LIST: (orgId: string) => `/inventory/organizations/${orgId}/categories/`,
      CREATE: (orgId: string) => `/inventory/organizations/${orgId}/categories/`,
      TREE: (orgId: string) => `/inventory/organizations/${orgId}/categories/tree/`,
      DETAIL: (orgId: string, id: string) => `/inventory/organizations/${orgId}/categories/${id}/`,
      UPDATE: (orgId: string, id: string) => `/inventory/organizations/${orgId}/categories/${id}/`,
      DELETE: (orgId: string, id: string) => `/inventory/organizations/${orgId}/categories/${id}/`,
    },
    // Entrepôts
    WAREHOUSES: {
      LIST: (orgId: string) => `/inventory/organizations/${orgId}/warehouses/`,
      CREATE: (orgId: string) => `/inventory/organizations/${orgId}/warehouses/`,
      DETAIL: (orgId: string, id: string) => `/inventory/organizations/${orgId}/warehouses/${id}/`,
      UPDATE: (orgId: string, id: string) => `/inventory/organizations/${orgId}/warehouses/${id}/`,
      DELETE: (orgId: string, id: string) => `/inventory/organizations/${orgId}/warehouses/${id}/`,
    },
    // Produits
    PRODUCTS: {
      LIST: (orgId: string) => `/inventory/organizations/${orgId}/products/`,
      CREATE: (orgId: string) => `/inventory/organizations/${orgId}/products/`,
      DETAIL: (orgId: string, id: string) => `/inventory/organizations/${orgId}/products/${id}/`,
      UPDATE: (orgId: string, id: string) => `/inventory/organizations/${orgId}/products/${id}/`,
      DELETE: (orgId: string, id: string) => `/inventory/organizations/${orgId}/products/${id}/`,
      IMAGE: (orgId: string, id: string) => `/inventory/organizations/${orgId}/products/${id}/image/`,
    },
  },

} as const;
