/**
 * Service API pour la Caisse / Trésorerie (module Inventory).
 *
 * Le backend consolide à la volée les flux (ventes, achats, dépenses) + les
 * apports/retraits (CashAdjustment). Ce service expose :
 * - la liste consolidée des transactions et le résumé (entrées/sorties/solde) ;
 * - le CRUD des apports/retraits.
 */

import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/config";
import type {
  BankAccount,
  CashAdjustment,
  CashSummary,
  CashTransaction,
  CreateBankAccountData,
  CreateCashAdjustmentData,
  CreateTreasuryTransferData,
  ListBankAccountsParams,
  ListCashAdjustmentsParams,
  ListCashTransactionsParams,
  ListTreasuryTransfersParams,
  TreasuryOverview,
  TreasuryOverviewParams,
  TreasuryTransfer,
  UpdateBankAccountData,
  UpdateCashAdjustmentData,
  UpdateTreasuryTransferData,
} from "@/lib/types/inventory";

interface PaginatedResponse<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export const cashService = {
  // ── Vue consolidée ──────────────────────────────────────────────────────
  async transactions(orgId: string, params?: ListCashTransactionsParams) {
    return apiClient.get<PaginatedResponse<CashTransaction>>(
      API_ENDPOINTS.INVENTORY.CASH.TRANSACTIONS(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async summary(orgId: string, params?: ListCashTransactionsParams) {
    return apiClient.get<CashSummary>(
      API_ENDPOINTS.INVENTORY.CASH.SUMMARY(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  // ── Apports / retraits ────────────────────────────────────────────────────
  async listAdjustments(orgId: string, params?: ListCashAdjustmentsParams) {
    return apiClient.get<PaginatedResponse<CashAdjustment> | CashAdjustment[]>(
      API_ENDPOINTS.INVENTORY.CASH.ADJUSTMENTS(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getAdjustment(orgId: string, id: string) {
    return apiClient.get<CashAdjustment>(
      API_ENDPOINTS.INVENTORY.CASH.ADJUSTMENT_DETAIL(orgId, id)
    );
  },

  async createAdjustment(orgId: string, data: CreateCashAdjustmentData) {
    return apiClient.post<{ message: string; data: CashAdjustment }>(
      API_ENDPOINTS.INVENTORY.CASH.ADJUSTMENTS(orgId),
      data
    );
  },

  async updateAdjustment(
    orgId: string,
    id: string,
    data: UpdateCashAdjustmentData
  ) {
    return apiClient.patch<{ message: string; data: CashAdjustment }>(
      API_ENDPOINTS.INVENTORY.CASH.ADJUSTMENT_DETAIL(orgId, id),
      data
    );
  },

  async deleteAdjustment(orgId: string, id: string) {
    return apiClient.delete<{ message: string }>(
      API_ENDPOINTS.INVENTORY.CASH.ADJUSTMENT_DETAIL(orgId, id)
    );
  },
};

export const bankService = {
  // ── Comptes bancaires ─────────────────────────────────────────────────────
  async listAccounts(orgId: string, params?: ListBankAccountsParams) {
    return apiClient.get<PaginatedResponse<BankAccount> | BankAccount[]>(
      API_ENDPOINTS.INVENTORY.BANK.ACCOUNTS(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getAccount(orgId: string, id: string) {
    return apiClient.get<BankAccount>(
      API_ENDPOINTS.INVENTORY.BANK.ACCOUNT_DETAIL(orgId, id)
    );
  },

  async createAccount(orgId: string, data: CreateBankAccountData) {
    return apiClient.post<{ message: string; data: BankAccount }>(
      API_ENDPOINTS.INVENTORY.BANK.ACCOUNTS(orgId),
      data
    );
  },

  async updateAccount(orgId: string, id: string, data: UpdateBankAccountData) {
    return apiClient.patch<{ message: string; data: BankAccount }>(
      API_ENDPOINTS.INVENTORY.BANK.ACCOUNT_DETAIL(orgId, id),
      data
    );
  },

  async deleteAccount(orgId: string, id: string) {
    return apiClient.delete<{ message: string }>(
      API_ENDPOINTS.INVENTORY.BANK.ACCOUNT_DETAIL(orgId, id)
    );
  },

  // ── Flux bancaires (lecture) ──────────────────────────────────────────────
  async transactions(orgId: string, params?: ListCashTransactionsParams) {
    return apiClient.get<PaginatedResponse<CashTransaction>>(
      API_ENDPOINTS.INVENTORY.BANK.TRANSACTIONS(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async summary(orgId: string, params?: ListCashTransactionsParams) {
    return apiClient.get<CashSummary>(
      API_ENDPOINTS.INVENTORY.BANK.SUMMARY(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },
};

export const treasuryService = {
  // ── Synthèse consolidée ───────────────────────────────────────────────────
  async overview(orgId: string, params?: TreasuryOverviewParams) {
    return apiClient.get<TreasuryOverview>(
      API_ENDPOINTS.INVENTORY.TREASURY.OVERVIEW(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  // ── Transferts internes caisse ↔ banque ───────────────────────────────────
  async listTransfers(orgId: string, params?: ListTreasuryTransfersParams) {
    return apiClient.get<PaginatedResponse<TreasuryTransfer> | TreasuryTransfer[]>(
      API_ENDPOINTS.INVENTORY.TREASURY.TRANSFERS(orgId),
      { params: params as Record<string, unknown> | undefined }
    );
  },

  async getTransfer(orgId: string, id: string) {
    return apiClient.get<TreasuryTransfer>(
      API_ENDPOINTS.INVENTORY.TREASURY.TRANSFER_DETAIL(orgId, id)
    );
  },

  async createTransfer(orgId: string, data: CreateTreasuryTransferData) {
    return apiClient.post<{ message: string; data: TreasuryTransfer }>(
      API_ENDPOINTS.INVENTORY.TREASURY.TRANSFERS(orgId),
      data
    );
  },

  async updateTransfer(
    orgId: string,
    id: string,
    data: UpdateTreasuryTransferData
  ) {
    return apiClient.patch<{ message: string; data: TreasuryTransfer }>(
      API_ENDPOINTS.INVENTORY.TREASURY.TRANSFER_DETAIL(orgId, id),
      data
    );
  },

  async deleteTransfer(orgId: string, id: string) {
    return apiClient.delete<{ message: string }>(
      API_ENDPOINTS.INVENTORY.TREASURY.TRANSFER_DETAIL(orgId, id)
    );
  },
};
