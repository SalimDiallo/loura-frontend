"use client";

import { useOrganization } from "@/lib/hooks/core";
import {
  formatCompactCurrency,
  formatCurrency,
  getStoredCurrency,
  setStoredCurrency,
} from "@/utils/formatters";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

/**
 * Récupère la devise de l'organisation active et la synchronise avec le
 * localStorage pour que les formatters purs (`formatCurrency`, etc.) l'utilisent
 * automatiquement partout dans l'app.
 *
 * - Si `orgId` n'est pas fourni, lit `params.id` depuis la route courante.
 * - Retourne la devise courante (depuis l'API ou le localStorage).
 *
 * @example
 * const { currency, isLoading } = useOrgCurrency();
 */
export function useOrgCurrency(orgId?: string): {
  currency: string;
  isLoading: boolean;
} {
  const params = useParams();
  const resolvedOrgId = orgId || (params?.id as string | undefined);

  const { data: org, isLoading } = useOrganization(resolvedOrgId || "");

  // Synchronise la devise de l'org dans le localStorage dès qu'elle est connue.
  useEffect(() => {
    if (org?.currency) {
      setStoredCurrency(org.currency);
    }
  }, [org?.currency]);

  const currency = org?.currency || getStoredCurrency() || "GNF";

  return { currency, isLoading };
}

/**
 * Hook qui retourne des formatters de devise pré-liés à la devise de
 * l'organisation active. Rerender automatique quand la devise change.
 *
 * @example
 * const { formatCurrency, formatCompactCurrency, currency } = useCurrencyFormatter();
 * <p>{formatCurrency(1500)}</p>
 */
export function useCurrencyFormatter(orgId?: string): {
  currency: string;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  formatCompactCurrency: (amount: number) => string;
} {
  const { currency, isLoading } = useOrgCurrency(orgId);

  const boundFormatCurrency = useCallback(
    (amount: number) => formatCurrency(amount, currency),
    [currency]
  );

  const boundFormatCompact = useCallback(
    (amount: number) => formatCompactCurrency(amount, currency),
    [currency]
  );

  return useMemo(
    () => ({
      currency,
      isLoading,
      formatCurrency: boundFormatCurrency,
      formatCompactCurrency: boundFormatCompact,
    }),
    [currency, isLoading, boundFormatCurrency, boundFormatCompact]
  );
}
