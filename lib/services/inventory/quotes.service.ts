/**
 * Service API pour les devis / pro forma (Quotes).
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  ConvertQuoteData,
  CreateQuoteData,
  ListQuotesParams,
  Quote,
  QuoteResponse,
  RejectQuoteData,
  UpdateQuoteData,
} from "@/lib/types/inventory";

export const quotesService = {
  async getAll(orgId: string, params?: ListQuotesParams) {
    return apiClient.get<Quote[]>(
      API_ENDPOINTS.INVENTORY.QUOTES.LIST(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getById(orgId: string, id: string) {
    return apiClient.get<Quote>(API_ENDPOINTS.INVENTORY.QUOTES.DETAIL(orgId, id));
  },

  async create(orgId: string, data: CreateQuoteData) {
    return apiClient.post<QuoteResponse>(
      API_ENDPOINTS.INVENTORY.QUOTES.CREATE(orgId),
      data
    );
  },

  async update(orgId: string, id: string, data: UpdateQuoteData) {
    return apiClient.patch<QuoteResponse>(
      API_ENDPOINTS.INVENTORY.QUOTES.UPDATE(orgId, id),
      data
    );
  },

  async delete(orgId: string, id: string) {
    return apiClient.delete<{ message: string }>(
      API_ENDPOINTS.INVENTORY.QUOTES.DELETE(orgId, id)
    );
  },

  async send(orgId: string, id: string) {
    return apiClient.post<QuoteResponse>(
      API_ENDPOINTS.INVENTORY.QUOTES.SEND(orgId, id),
      {}
    );
  },

  async accept(orgId: string, id: string) {
    return apiClient.post<QuoteResponse>(
      API_ENDPOINTS.INVENTORY.QUOTES.ACCEPT(orgId, id),
      {}
    );
  },

  async reject(orgId: string, id: string, data: RejectQuoteData = {}) {
    return apiClient.post<QuoteResponse>(
      API_ENDPOINTS.INVENTORY.QUOTES.REJECT(orgId, id),
      data
    );
  },

  async expire(orgId: string, id: string) {
    return apiClient.post<QuoteResponse>(
      API_ENDPOINTS.INVENTORY.QUOTES.EXPIRE(orgId, id),
      {}
    );
  },

  async convert(orgId: string, id: string, data: ConvertQuoteData = {}) {
    return apiClient.post<QuoteResponse>(
      API_ENDPOINTS.INVENTORY.QUOTES.CONVERT(orgId, id),
      data
    );
  },

  async duplicate(orgId: string, id: string) {
    return apiClient.post<QuoteResponse>(
      API_ENDPOINTS.INVENTORY.QUOTES.DUPLICATE(orgId, id),
      {}
    );
  },
};
