"use client";

import { useMyPermissions } from "@/lib/hooks/hr";
import { useOrgCurrency } from "@/lib/hooks/useCurrency";
import type { MyOrgPermissions } from "@/lib/types";
import { useParams } from "next/navigation";
import { createContext, useContext, useMemo, type ReactNode } from "react";

interface PermissionsContextValue {
  /** Raw permissions data from the API */
  data: MyOrgPermissions | undefined;
  /** True while loading */
  isLoading: boolean;
  /** True if the user is the org owner (always has all permissions) */
  isOwner: boolean;
  /** List of permission codenames the user has */
  permissions: string[];
  /** Membership ID in this org (null if owner without membership) */
  membershipId: string | null;
  /** Check if user has a specific permission */
  can: (permission: string) => boolean;
  /** Check if user has ALL of the given permissions */
  canAll: (permissions: string[]) => boolean;
  /** Check if user has ANY of the given permissions */
  canAny: (permissions: string[]) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  data: undefined,
  isLoading: true,
  isOwner: false,
  permissions: [],
  membershipId: null,
  can: () => false,
  canAll: () => false,
  canAny: () => false,
});

interface PermissionsProviderProps {
  children: ReactNode;
  orgId?: string;
}

export function PermissionsProvider({ children, orgId: propOrgId }: PermissionsProviderProps) {
  const params = useParams();
  const orgId = propOrgId || (params.id as string);

  const { data, isLoading } = useMyPermissions(orgId);

  // Synchronise la devise de l'organisation dans le localStorage pour que
  // tous les formatters purs (formatCurrency, etc.) l'utilisent.
  useOrgCurrency(orgId);

  const value = useMemo<PermissionsContextValue>(() => {
    const isOwner = data?.is_owner ?? false;
    const permissions = data?.permissions ?? [];
    const membershipId = data?.membership_id ?? null;

    const can = (permission: string): boolean => {
      if (isOwner) return true;
      return permissions.includes(permission);
    };

    const canAll = (perms: string[]): boolean => {
      if (isOwner) return true;
      return perms.every((p) => permissions.includes(p));
    };

    const canAny = (perms: string[]): boolean => {
      if (isOwner) return true;
      return perms.some((p) => permissions.includes(p));
    };

    return {
      data,
      isLoading,
      isOwner,
      permissions,
      membershipId,
      can,
      canAll,
      canAny,
    };
  }, [data, isLoading]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * Hook to access the permissions context.
 *
 * @example
 * const { can, isOwner } = useOrgPermissions();
 * if (can('hr.manage_contracts')) { ... }
 */
export function useOrgPermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("useOrgPermissions must be used within a PermissionsProvider");
  }
  return ctx;
}
