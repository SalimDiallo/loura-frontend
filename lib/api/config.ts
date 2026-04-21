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
    },
    // Invitations
    INVITATIONS: {
      SEND: (orgId: string) => `/hr/organizations/${orgId}/invitations/`,
      LIST: (orgId: string) => `/hr/organizations/${orgId}/invitations/`,
      PENDING: '/hr/invitations/pending/',
      ACCEPT: (id: string) => `/hr/invitations/${id}/accept/`,
      DECLINE: (id: string) => `/hr/invitations/${id}/decline/`,
    },
  },

} as const;
