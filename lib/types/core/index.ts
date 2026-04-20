/**
 * Types pour le module Core (Organisation, Catégorie, AdminUser)
 */

// ============================================================================
// CATEGORY
// ============================================================================

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// ============================================================================
// ADMIN USER
// ============================================================================

export interface AdminUser {
  id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
}

// ============================================================================
// ORGANIZATION
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  category: Category | null;
  owner_email: string;
  country: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Données pour la création d'organisation (onboarding)
 */
export interface CreateOrganizationData {
  name: string;
  category_id?: string | null;
  country?: string;
  currency?: string;
}

/**
 * Données pour la mise à jour d'organisation
 */
export interface UpdateOrganizationData {
  name?: string;
  country?: string;
  currency?: string;
}
