/**
 * Service pour la génération de documents (contrats, paiements, avances…).
 *
 * Le backend renvoie du HTML déjà stylé avec le branding de l'organisation.
 * Ce service fait un appel `fetch` authentifié et retourne le HTML sous
 * forme de string, à injecter dans un iframe `srcdoc` pour prévisualisation.
 */

import { API_CONFIG, API_ENDPOINTS } from "@/lib/api/config";
import { ApiError, tokenManager } from "@/lib/api/client";

export type DocumentType = "contract" | "payment" | "advance";

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
};
