"use client";

/**
 * Section "Accès aux entrepôts" sur la fiche d'un membre.
 *
 * - Lecture : affiche la liste blanche actuelle + l'état "is_scoped".
 * - Écriture : permet de cocher/décocher la liste des entrepôts (PUT idempotent).
 *
 * Visible si l'utilisateur a la perm `hr.manage_employees`. La modification
 * n'a d'effet que si le membre a aussi la perm `inventory.scope_warehouses`
 * (sinon la liste est ignorée et il garde accès à tout).
 */

import { Can, useOrgPermissions } from "@/components/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMemberWarehouseAccess,
  useSetMemberWarehouseAccess,
  useWarehouses,
} from "@/lib/hooks/inventory";
import { PERMISSIONS } from "@/lib/permissions";
import { getApiErrorMessage } from "@/lib/api/error-message";
import { useEffect, useMemo, useState } from "react";
import { FaInfoCircle, FaSave, FaWarehouse } from "react-icons/fa";
import { toast } from "sonner";

interface Props {
  orgId: string;
  memberId: string;
}

export function MemberWarehouseAccessSection({ orgId, memberId }: Props) {
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.HR.MANAGE_EMPLOYEES);

  const { data: access, isLoading } = useMemberWarehouseAccess(orgId, memberId);
  const { data: warehouses = [] } = useWarehouses(orgId, {
    page_size: "all",
    is_active: true,
  });
  const setAccess = useSetMemberWarehouseAccess();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Sync l'état local avec la donnée serveur quand elle arrive.
  useEffect(() => {
    if (access) {
      setSelected(new Set(access.warehouses.map((w) => w.id)));
    }
  }, [access]);

  const sortedWarehouses = useMemo(
    () =>
      [...(warehouses as { id: string; name: string; code?: string }[])].sort(
        (a, b) => a.name.localeCompare(b.name)
      ),
    [warehouses]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accès aux entrepôts</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const isScoped = access?.is_scoped ?? false;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSave = async () => {
    try {
      await setAccess.mutateAsync({
        orgId,
        memberId,
        warehouseIds: Array.from(selected),
      });
      toast.success("Accès aux entrepôts mis à jour.");
    } catch (err: unknown) {
      toast.error("Erreur", { description: getApiErrorMessage(err) });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FaWarehouse className="h-4 w-4" />
          Accès aux entrepôts
        </CardTitle>
        <CardDescription>
          {isScoped ? (
            <span className="text-amber-700">
              Ce membre est restreint à la liste d&apos;entrepôts cochés
              ci-dessous.
            </span>
          ) : (
            <span>
              Ce membre n&apos;a pas la permission{" "}
              <code className="text-xs">inventory.scope_warehouses</code> — il
              voit donc tous les entrepôts. La sélection ci-dessous est
              enregistrée mais sans effet tant que la permission n&apos;est pas
              attribuée via le rôle ou les permissions directes.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedWarehouses.length === 0 ? (
          <div className="text-sm text-muted-foreground italic">
            Aucun entrepôt actif dans cette organisation.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sortedWarehouses.map((w) => (
              <label
                key={w.id}
                className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-accent/30 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.has(w.id)}
                  onChange={() => toggle(w.id)}
                  disabled={!canManage}
                  className="h-4 w-4"
                />
                <span className="font-medium">{w.name}</span>
                {w.code ? (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {w.code}
                  </span>
                ) : null}
              </label>
            ))}
          </div>
        )}

        {!isScoped ? (
          <div className="text-xs text-muted-foreground flex items-start gap-2 p-3 bg-muted/30 rounded-md">
            <FaInfoCircle className="h-3 w-3 mt-0.5 shrink-0" />
            <span>
              Pour activer la restriction, attribuez la permission{" "}
              <code>inventory.scope_warehouses</code> au membre (rôle ou
              permissions directes).
            </span>
          </div>
        ) : null}

        <Can permission={PERMISSIONS.HR.MANAGE_EMPLOYEES}>
          <div className="flex justify-end">
            <Button
              onClick={onSave}
              disabled={setAccess.isPending}
              size="sm"
            >
              <FaSave className="mr-2 h-3 w-3" />
              {setAccess.isPending
                ? "Enregistrement..."
                : "Enregistrer les accès"}
            </Button>
          </div>
        </Can>
      </CardContent>
    </Card>
  );
}
