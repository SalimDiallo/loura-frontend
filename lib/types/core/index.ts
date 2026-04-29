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
  /** Codes des modules installés ET activés sur cette organisation. */
  module_codes: ModuleCode[];
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
  /** Codes des modules à installer sur la nouvelle organisation. */
  module_codes?: ModuleCode[];
}

// ============================================================================
// MODULES (catalogue + installations)
// ============================================================================

/**
 * Codes stables des modules fonctionnels exposés par le backend.
 *
 * Tout ajout côté backend doit être répercuté ici pour bénéficier du typage.
 */
export type ModuleCode = "hr" | "inventory" | "services" | (string & {});

export interface Module {
  id: string;
  code: ModuleCode;
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  is_default: boolean;
}

export interface OrganizationModule {
  id: string;
  module: Module;
  is_enabled: boolean;
  installed_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Données pour la mise à jour d'organisation
 */
export interface UpdateOrganizationData {
  name?: string;
  country?: string;
  currency?: string;
}

// ============================================================================
// ORGANIZATION SETTINGS
// ============================================================================

export interface OrganizationSettings {
  id: string;
  organization: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  tax_id: string;
  tax_rate: string;
  invoice_footer: string;
  invoice_prefix: string;
  receipt_prefix: string;
  created_at: string;
  updated_at: string;
}

export type UpdateOrganizationSettingsData = Partial<
  Omit<OrganizationSettings, 'id' | 'organization' | 'created_at' | 'updated_at'>
>;
