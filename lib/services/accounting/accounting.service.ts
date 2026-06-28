/**
 * Service API du module Comptabilité (reporting financier — phase 1).
 *
 * Le backend consolide à la lecture les flux métier (ventes, dépenses,
 * paiements fournisseurs, transactions services, paies RH, apports/retraits)
 * et renvoie des états : P&L, journal de trésorerie, ventilations,
 * créances/dettes. Aucun écriture côté front (lecture seule).
 */

import { ApiError, apiClient, tokenManager } from "@/lib/api/client";
import { API_CONFIG, API_ENDPOINTS } from "@/lib/api/config";
import type {
    AccountingOverview,
    AccountingPeriodParams,
    CategoryBreakdownResponse,
    OutstandingResponse,
    Pnl,
    PnlTrendParams,
    PnlTrendResponse,
    TreasuryJournalParams,
    TreasuryLine,
} from "@/lib/types/accounting";
import type { PaginatedResponse } from "@/lib/types/shared";

export type AccountingReportType = "pnl" | "treasury";

const toParams = (obj: object): Record<string, string> => {
    const out: Record<string, string> = {};
    Object.entries(obj).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
            out[k] = String(v);
        }
    });
    return out;
};

export const accountingService = {
    overview(orgId: string, params: AccountingPeriodParams = {}) {
        return apiClient.get<AccountingOverview>(
            API_ENDPOINTS.ACCOUNTING.OVERVIEW(orgId),
            { params: toParams(params) }
        );
    },

    pnl(orgId: string, params: AccountingPeriodParams = {}) {
        return apiClient.get<Pnl>(API_ENDPOINTS.ACCOUNTING.PNL(orgId), {
            params: toParams(params),
        });
    },

    pnlTrend(orgId: string, params: PnlTrendParams = {}) {
        return apiClient.get<PnlTrendResponse>(
            API_ENDPOINTS.ACCOUNTING.PNL_TREND(orgId),
            { params: toParams(params) }
        );
    },

    /**
     * Journal de trésorerie. Avec `page_size: "all"` le backend renvoie un
     * tableau brut (non paginé) ; sinon une réponse paginée.
     */
    treasuryJournal(orgId: string, params: TreasuryJournalParams = {}) {
        return apiClient.get<PaginatedResponse<TreasuryLine> | TreasuryLine[]>(
            API_ENDPOINTS.ACCOUNTING.TREASURY_JOURNAL(orgId),
            { params: toParams(params) }
        );
    },

    expensesByCategory(orgId: string, params: AccountingPeriodParams = {}) {
        return apiClient.get<CategoryBreakdownResponse>(
            API_ENDPOINTS.ACCOUNTING.EXPENSES_BY_CATEGORY(orgId),
            { params: toParams(params) }
        );
    },

    revenueBySource(orgId: string, params: AccountingPeriodParams = {}) {
        return apiClient.get<CategoryBreakdownResponse>(
            API_ENDPOINTS.ACCOUNTING.REVENUE_BY_SOURCE(orgId),
            { params: toParams(params) }
        );
    },

    receivables(orgId: string) {
        return apiClient.get<OutstandingResponse>(
            API_ENDPOINTS.ACCOUNTING.RECEIVABLES(orgId)
        );
    },

    payables(orgId: string) {
        return apiClient.get<OutstandingResponse>(
            API_ENDPOINTS.ACCOUNTING.PAYABLES(orgId)
        );
    },

    /**
     * Récupère un état financier (P&L ou trésorerie) rendu en HTML brandé,
     * à injecter dans un iframe `srcDoc` pour prévisualisation puis impression
     * native (« Enregistrer en PDF »). Même stratégie que les factures/devis.
     */
    async reportHtml(
        orgId: string,
        type: AccountingReportType,
        params: AccountingPeriodParams = {}
    ): Promise<string> {
        const search = new URLSearchParams({ type });
        Object.entries(params).forEach(([k, v]) => {
            if (v) search.append(k, String(v));
        });
        const url =
            `${API_CONFIG.baseURL}` +
            API_ENDPOINTS.ACCOUNTING.REPORT_DOCUMENT(orgId) +
            `?${search.toString()}`;
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
                "Impossible de générer le rapport";
            throw new ApiError(message, response.status, errorData);
        }
        return response.text();
    },
};
