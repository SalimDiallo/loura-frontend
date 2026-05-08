/**
 * Service pour la génération de documents (contrats, paiements, avances…).
 *
 * Le backend renvoie du HTML déjà stylé avec le branding de l'organisation.
 * Ce service fait un appel `fetch` authentifié et retourne le HTML sous
 * forme de string, à injecter dans un iframe `srcdoc` pour prévisualisation.
 */

import { ApiError, tokenManager } from "@/lib/api/client";
import { API_CONFIG, API_ENDPOINTS } from "@/lib/api/config";

/** Type d'une remise (ligne ou globale) sur une facture rapide. */
export type QuickDiscountType = "none" | "percentage" | "fixed";

/** Une ligne de facture rapide composée à la volée par l'utilisateur. */
export interface QuickInvoiceItem {
  /** Identifiant local pour le tri drag-and-drop. Non envoyé au backend. */
  id?: string;
  description: string;
  /** String pour préserver la précision décimale dans les payloads JSON. */
  quantity: string;
  unit_price: string;
  discount_type?: QuickDiscountType;
  discount_value?: string;
  tax_rate?: string;
}

export interface QuickInvoicePayload {
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    tax_id?: string;
  };
  invoice?: {
    /** Numéro de facture, généré côté backend si vide. */
    number?: string;
    /** ISO 8601 ``YYYY-MM-DD``. */
    date?: string;
    due_date?: string;
    notes?: string;
  };
  items: QuickInvoiceItem[];
  discount_type?: QuickDiscountType;
  discount_value?: string;
}

export type DocumentType =
  // HR
  | "contract"
  | "payment"
  | "advance"
  // Inventory
  | "sale_invoice"
  | "sale_payment_receipt"
  | "purchase_order"
  | "purchase_payment_receipt"
  | "physical_inventory"
  | "quote"
  | "proforma"
  // Services
  | "service_enrollment_invoice"
  | "service_transaction_receipt";

export const documentsService = {
  /**
   * Récupère le HTML rendu d'un document pour prévisualisation/impression.
   */
  async getHtml(
    orgId: string,
    docType: DocumentType,
    objectId: string
  ): Promise<string> {
    const endpoint = API_ENDPOINTS.CORE.ORGANIZATIONS.DOCUMENT(
      orgId,
      docType,
      objectId
    );
    const token = tokenManager.getAccessToken();
    const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
      method: "GET",
      headers: {
        Accept: "text/html",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      const message =
        (errorData as { detail?: string; message?: string })?.detail ||
        (errorData as { detail?: string; message?: string })?.message ||
        "Impossible de générer le document";
      throw new ApiError(message, response.status, errorData);
    }

    return response.text();
  },

  /**
   * Facture rapide ad-hoc : compose une facture sans la persister.
   * Renvoie le HTML branding-prêt à imprimer / sauvegarder en PDF.
   *
   * Le payload est entièrement libre côté client : on liste les lignes
   * (description + qté + PU + remise/TVA), un bloc client texte libre,
   * et l'organisation fournit le branding (logo, couleurs, footer…).
   */
  async renderQuickInvoice(
    orgId: string,
    payload: QuickInvoicePayload
  ): Promise<string> {
    const url =
      `${API_CONFIG.baseURL}` + API_ENDPOINTS.CORE.ORGANIZATIONS.QUICK_INVOICE(orgId);
    const token = tokenManager.getAccessToken();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/html",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      const message =
        (errorData as { detail?: string; message?: string })?.detail ||
        (errorData as { detail?: string; message?: string })?.message ||
        "Impossible de générer la facture rapide";
      throw new ApiError(message, response.status, errorData);
    }
    return response.text();
  },

  /**
   * Facture groupée des ventes : agrège plusieurs Sales selon les
   * filtres (mêmes paramètres que la liste GET /sales/) en un unique
   * HTML branding-prêt à imprimer.
   *
   * Côté backend : ``GroupedSaleInvoiceView``. Le param ``include_drafts``
   * permet de générer un récap interne incluant les brouillons (à ne
   * pas remettre au client en l'état).
   */
  async getGroupedSaleInvoiceHtml(
    orgId: string,
    filters: Record<string, string | number | boolean | undefined>
  ): Promise<string> {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(filters)) {
      if (val !== undefined && val !== null && val !== "") {
        params.append(key, String(val));
      }
    }
    const qs = params.toString();
    const url =
      `${API_CONFIG.baseURL}/inventory/organizations/${orgId}/sales/grouped-invoice/` +
      (qs ? `?${qs}` : "");
    const token = tokenManager.getAccessToken();
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/html",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      const message =
        (errorData as { detail?: string; message?: string })?.detail ||
        (errorData as { detail?: string; message?: string })?.message ||
        "Impossible de générer la facture groupée";
      throw new ApiError(message, response.status, errorData);
    }
    return response.text();
  },

  /**
   * Récupère un document fictif (devis de démo) rendu avec un modèle
   * spécifique — utilisé sur la page « Paramètres » pour aider
   * l'utilisateur à choisir parmi les modèles disponibles.
   */
  async getSampleHtml(
    orgId: string,
    template: "classic" | "modern" | "minimal" | "corporate"
  ): Promise<string> {
    const endpoint = API_ENDPOINTS.CORE.ORGANIZATIONS.DOCUMENT_SAMPLE(orgId);
    const url = `${API_CONFIG.baseURL}${endpoint}?template=${encodeURIComponent(template)}`;
    const token = tokenManager.getAccessToken();
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/html",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      const message =
        (errorData as { detail?: string; message?: string })?.detail ||
        (errorData as { detail?: string; message?: string })?.message ||
        "Impossible de générer la prévisualisation";
      throw new ApiError(message, response.status, errorData);
    }

    return response.text();
  },
};
