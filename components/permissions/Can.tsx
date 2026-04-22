"use client";

import { useOrgPermissions } from "./PermissionsProvider";
import type { ReactNode } from "react";

type CanMode = "all" | "any";

interface CanProps {
  /** Single permission codename or array of codenames */
  permission: string | string[];
  /** "all" = user must have ALL permissions; "any" = at least one. Default: "all" */
  mode?: CanMode;
  /** Content to render if allowed */
  children: ReactNode;
  /** Optional fallback to render if denied */
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on the user's permissions.
 * Owner (admin/propriétaire) always gets access.
 *
 * @example
 * // Single permission
 * <Can permission="hr.manage_contracts">
 *   <Button>Créer un contrat</Button>
 * </Can>
 *
 * // Multiple (ALL required)
 * <Can permission={["hr.manage_payments", "hr.approve_payments"]}>
 *   <Button>Approuver</Button>
 * </Can>
 *
 * // Multiple (ANY required)
 * <Can permission={["hr.view_payments", "hr.manage_payments"]} mode="any">
 *   <PaymentsTable />
 * </Can>
 *
 * // With fallback
 * <Can permission="hr.manage_roles" fallback={<p>Accès refusé</p>}>
 *   <RolesEditor />
 * </Can>
 */
export function Can({ permission, mode = "all", children, fallback = null }: CanProps) {
  const { can, canAll, canAny, isLoading } = useOrgPermissions();

  // While loading, don't render anything (avoid flash)
  if (isLoading) return null;

  const perms = Array.isArray(permission) ? permission : [permission];
  const allowed = perms.length === 1
    ? can(perms[0])
    : mode === "all"
      ? canAll(perms)
      : canAny(perms);

  return allowed ? <>{children}</> : <>{fallback}</>;
}

/**
 * Inverse of Can — renders children only if user does NOT have the permission.
 *
 * @example
 * <Cannot permission="hr.manage_employees">
 *   <p>Vous n'avez pas les droits pour gérer les employés.</p>
 * </Cannot>
 */
export function Cannot({
  permission,
  mode = "all",
  children,
}: Omit<CanProps, "fallback">) {
  const { can, canAll, canAny, isLoading } = useOrgPermissions();

  if (isLoading) return null;

  const perms = Array.isArray(permission) ? permission : [permission];
  const allowed = perms.length === 1
    ? can(perms[0])
    : mode === "all"
      ? canAll(perms)
      : canAny(perms);

  return allowed ? null : <>{children}</>;
}
