"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useOrgPermissions } from "./PermissionsProvider";

interface PermissionGuardProps {
  /** Permission(s) required to access the page */
  permission: string | string[];
  /** "all" (default) = all required ; "any" = at least one */
  mode?: "all" | "any";
  /** Page content */
  children: ReactNode;
  /** Title of the "access denied" screen */
  deniedTitle?: string;
  /** Description shown to the user */
  deniedDescription?: string;
}

/**
 * Guards an entire page behind a permission check.
 * - Shows loading state while fetching permissions.
 * - Shows an "access denied" screen when user lacks permission.
 * - Owner (propriétaire) always has access.
 *
 * @example
 * export default function Page() {
 *   return (
 *     <PermissionGuard permission={PERMISSIONS.CONTRACTS.MANAGE}>
 *       <ContractForm />
 *     </PermissionGuard>
 *   );
 * }
 */
export function PermissionGuard({
  permission,
  mode = "all",
  children,
  deniedTitle = "Accès refusé",
  deniedDescription = "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
}: PermissionGuardProps) {
  const router = useRouter();
  const { can, canAll, canAny, isLoading } = useOrgPermissions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const perms = Array.isArray(permission) ? permission : [permission];
  const allowed =
    perms.length === 1
      ? can(perms[0])
      : mode === "all"
        ? canAll(perms)
        : canAny(perms);

  if (!allowed) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{deniedTitle}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {deniedDescription}
          </p>
          <Button variant="outline" className="gap-2" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" /> Retour
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
