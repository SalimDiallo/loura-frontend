"use client";

/**
 * Hook de conversion de devises pour l'affichage uniquement.
 *
 * - Source : open.er-api.com (gratuit, sans clé API, CORS ouvert)
 * - Cache 12h (les taux changent peu pour les paiements SaaS)
 * - Fallback hardcodé si l'API plante (taux moyen GNF/USD 2026 ≈ 8650)
 *
 * ⚠️ Usage **affichage uniquement**. Les paiements Djomy se font toujours
 * en GNF (la valeur stockée en DB).
 */

import { useQuery } from "@tanstack/react-query";

/** Taux de secours : ~1 USD = 8 650 GNF (2026). */
const FALLBACK_USD_TO_GNF = 8650;

interface ExchangeRateResponse {
    result?: string;
    base_code?: string;
    rates?: Record<string, number>;
}

async function fetchUsdToGnfRate(): Promise<number> {
    const url = "https://open.er-api.com/v6/latest/USD";
    const response = await fetch(url, {
        // Pas de credentials, pas d'auth → CORS simple
        cache: "no-store",
    });
    if (!response.ok) {
        throw new Error(`Exchange API HTTP ${response.status}`);
    }
    const data = (await response.json()) as ExchangeRateResponse;
    const rate = data?.rates?.GNF;
    if (!rate || rate <= 0) {
        throw new Error("Taux GNF absent de la réponse");
    }
    return rate;
}

/**
 * Retourne le taux 1 USD = N GNF (cache 12h, fallback robuste).
 *
 * Usage :
 *   const { usdToGnf } = useUsdToGnfRate();
 *   const usd = gnfAmount / usdToGnf;
 */
export function useUsdToGnfRate(): {
    usdToGnf: number;
    isLoading: boolean;
    isFromApi: boolean;
} {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["fx", "usd-to-gnf"],
        queryFn: fetchUsdToGnfRate,
        staleTime: 12 * 60 * 60 * 1000, // 12h
        retry: 1,
    });

    if (isLoading) {
        return { usdToGnf: FALLBACK_USD_TO_GNF, isLoading: true, isFromApi: false };
    }
    if (isError || !data) {
        return { usdToGnf: FALLBACK_USD_TO_GNF, isLoading: false, isFromApi: false };
    }
    return { usdToGnf: data, isLoading: false, isFromApi: true };
}

// ─── Helpers de formatage ──────────────────────────────────────────────────

/** Convertit un montant GNF → USD avec arrondi 2 décimales. */
export function gnfToUsd(gnfAmount: number, usdToGnf: number): number {
    if (!gnfAmount || !Number.isFinite(gnfAmount) || gnfAmount <= 0) return 0;
    if (!usdToGnf || usdToGnf <= 0) return 0;
    return Math.round((gnfAmount / usdToGnf) * 100) / 100;
}

/** Formate un montant USD au format $X.XX (en-US). */
export function formatUsd(amount: number): string {
    if (!amount || amount <= 0) return "Gratuit";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format combiné : affiche le prix en USD, avec le prix GNF en sous-texte
 * (pour la transparence).
 */
export function formatUsdWithGnfSubtitle(
    gnfAmount: number,
    usdToGnf: number,
): { usd: string; gnf: string } {
    const usd = formatUsd(gnfToUsd(gnfAmount, usdToGnf));
    // GNF n'a pas de subdivision : on arrondit avant formatage pour éviter
    // qu'une décimale soit lue comme un chiffre supplémentaire en fr-GN
    // (où le séparateur des milliers est un espace).
    const rounded = Math.round(gnfAmount);
    const gnf =
        rounded > 0
            ? `${new Intl.NumberFormat("fr-FR", {
                  maximumFractionDigits: 0,
              }).format(rounded)} FNG`
            : "Gratuit";
    return { usd, gnf };
}
