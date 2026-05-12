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

export type DocumentTemplate = 'classic' | 'modern' | 'minimal' | 'corporate';

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
  document_template: DocumentTemplate;
  invoice_footer: string;
  invoice_prefix: string;
  receipt_prefix: string;
  created_at: string;
  updated_at: string;
}

export type UpdateOrganizationSettingsData = Partial<
  Omit<OrganizationSettings, 'id' | 'organization' | 'created_at' | 'updated_at'>
>;

// ─── Abonnements (Billing) ───────────────────────────────────────────────────

export type PlanCode = 'free' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

export interface Plan {
  id: string;
  code: PlanCode | string;
  name: string;
  description: string;
  price_monthly: string;
  price_yearly: string;
  currency: string;
  /** null = illimité */
  max_organizations: number | null;
  /** null = illimité */
  max_modules_per_org: number | null;
  /** Liste blanche de codes de modules. Vide = tous autorisés. */
  allowed_module_codes: string[];
  is_active: boolean;
  is_free: boolean;
  sort_order: number;
}

export interface SubscriptionUsage {
  organization_count: number;
  modules_count: number;
}

export interface Subscription {
  id: string;
  plan: Plan;
  cycle: SubscriptionCycle;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancelled_at: string | null;
  auto_renew: boolean;
  /** Méthode de paiement mémorisée pour les renouvellements auto. */
  payment_method: "OM" | "MOMO" | "KULU" | "" | string;
  renewal_attempts: number;
  last_renewal_error: string;
  /**
   * Plan vers lequel la sub bascule à ``current_period_end``. Posé
   * lorsqu'on annule (cible Free) ou qu'on planifie un downgrade vers
   * un autre plan payant. ``null`` = aucun changement planifié.
   */
  scheduled_plan: Plan | null;
  scheduled_cycle: SubscriptionCycle | '';
  is_active: boolean;
  days_remaining: number;
  /** Statistiques d'utilisation pour l'affichage des limites */
  usage?: SubscriptionUsage;
  created_at: string;
  updated_at: string;
}

/** Méthodes de paiement supportées par Djomy. */
export type DjomyPaymentMethod =
  | 'OM'           // Orange Money
  | 'MOMO'         // MTN Mobile Money
  | 'KULU'         // Kulu de Digital Pay
  | 'SOUTRA_MONEY' // Soutra Money
  | 'PAYCARD'      // PayCard
  | 'YMO'          // Ymo
  | 'CARD';        // Carte bancaire (Visa/Mastercard)

export interface ChangePlanData {
  plan_code: PlanCode | string;
  cycle: SubscriptionCycle;
  /** Téléphone du payeur au format international (ex: 00224623707722). */
  payer_number?: string;
  /** Liste blanche des méthodes de paiement à proposer ; vide = toutes. */
  allowed_payment_methods?: DjomyPaymentMethod[];
}

export type DjomyTransactionStatus =
  | 'PENDING' | 'CREATED' | 'REDIRECTED'
  | 'SUCCESS' | 'CAPTURED'
  | 'FAILED' | 'CANCELLED' | 'TIMEOUT' | 'REFUNDED';

export interface ProrataInfo {
  prorata_applied: boolean;
  previous_plan: string;
  previous_cycle: string;
  days_remaining: number;
  credit_amount: string;
  base_price: string;
  final_price: string;
}

export interface DjomyTransaction {
  id: string;
  reference: string;
  djomy_transaction_id: string;
  plan_code: string;
  cycle: SubscriptionCycle;
  amount: string;
  currency: string;
  country_code: string;
  payer_number: string;
  allowed_payment_methods: string[];
  status: DjomyTransactionStatus;
  provider_redirect_url: string;
  is_successful: boolean;
  is_terminal: boolean;
  completed_at: string | null;
  /** Payload de statut brut pour debugging/diagnostics */
  last_status_payload?: Record<string, unknown>;
  /** Informations de prorata pour les upgrades */
  prorata?: ProrataInfo;
  created_at: string;
  updated_at: string;
}

/**
 * Réponse de POST /change-plan/.
 *
 * - Plan gratuit : ``requires_payment=false`` + ``subscription`` activée
 * - Plan payant : ``requires_payment=true`` + ``redirect_url`` à suivre
 */
export interface ChangePlanResponse {
  message: string;
  data: {
    transaction: DjomyTransaction;
    subscription?: Subscription;
    requires_payment: boolean;
    redirect_url?: string;
    /** Vrai pour un downgrade différé (la sub courante reste, schedule posé). */
    scheduled?: boolean;
    /** Date à laquelle le changement planifié prendra effet (ISO 8601). */
    effective_at?: string;
  };
}

export interface CancelSubscriptionResponse {
  message: string;
  data: Subscription;
}

export type BillingEventType =
  | 'created'
  | 'upgraded'
  | 'downgraded'
  | 'renewed'
  | 'cancelled'
  | 'expired'
  | 'expiry_reminder'
  | 'renewal_attempt'
  | 'renewal_failed'
  | 'payment_success'
  | 'payment_failed'
  | 'limit_reached'
  | 'gift_granted';

export interface BillingEvent {
  id: string;
  event_type: BillingEventType;
  message: string;
  metadata: Record<string, unknown>;
  subscription: string | null;
  created_at: string;
}
