"use client";

import { useOrgPermissions } from "@/components/permissions";
import {
  ContractsWidget,
  HeadcountWidget,
  LeavesWidget,
  OverviewWidget,
  PayrollWidget,
  PendingActionsWidget,
} from "@/components/services/hr/dashboard";
import { HRCol, HRGrid, HRPageLayout } from "@/components/services/hr/HRPageLayout";
import { PERMISSIONS } from "@/lib/permissions";
import { Users } from "lucide-react";
import { useParams } from "next/navigation";

/**
 * Tableau de bord RH — page racine du module `/hr`.
 *
 * Conception :
 * - Layout réutilisable ``HRPageLayout`` + grille sobre ``HRGrid`` / ``HRCol``.
 * - Chaque widget est indépendant : il fetch ses propres données, affiche
 *   son propre état (loading / error / empty) et n'apparaît que si
 *   l'utilisateur a la permission associée (gating via ``<Can>``).
 */
export default function HRDashboardPage() {
  const params = useParams();
  const orgId = params.id as string;
  const { canAny, isLoading: permsLoading } = useOrgPermissions();

  // Accès minimum au module RH : au moins une permission HR.
  const hasAnyHRAccess =
    !permsLoading &&
    canAny([
      PERMISSIONS.HR.VIEW_EMPLOYEES,
      PERMISSIONS.LEAVES.VIEW,
      PERMISSIONS.PAYMENTS.VIEW,
      PERMISSIONS.CONTRACTS.VIEW,
    ]);

  return (
    <HRPageLayout
      title="Tableau de bord RH"
      subtitle="Vue d'ensemble des effectifs, congés, paie et contrats"
      icon={Users}
    >
      {permsLoading ? (
        <div className="text-sm text-muted-foreground">
          Chargement des permissions…
        </div>
      ) : !hasAnyHRAccess ? (
        <div className="border border-border/60 bg-card p-8 text-center">
          <h2 className="text-base font-semibold text-foreground">
            Aucun accès RH
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vous n'avez pas de permission vous donnant accès aux données RH de
            cette organisation.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* KPI row (plein largeur) */}
          <OverviewWidget orgId={orgId} />

          {/* Grille principale */}
          <HRGrid>
            <HRCol spanLg={8}>
              <PayrollWidget orgId={orgId} />
            </HRCol>
            <HRCol spanLg={4}>
              <PendingActionsWidget orgId={orgId} />
            </HRCol>

            <HRCol spanLg={7}>
              <LeavesWidget orgId={orgId} />
            </HRCol>
            <HRCol spanLg={5}>
              <HeadcountWidget orgId={orgId} />
            </HRCol>

            <HRCol spanLg={12}>
              <ContractsWidget orgId={orgId} />
            </HRCol>
          </HRGrid>
        </div>
      )}
    </HRPageLayout>
  );
}
