/**
 * Service pour la génération de documents (contrats, paiements, avances…).
 *
 * Le backend renvoie du HTML déjà stylé avec le branding de l'organisation.
 * Ce service fait un appel `fetch` authentifié et retourne le HTML sous
 * forme de string, à injecter dans un iframe `srcdoc` pour prévisualisation.
 */

import { ApiError, tokenManager } from "@/lib/api/client";
import { API_CONFIG, API_ENDPOINTS } from "@/lib/api/config";

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
