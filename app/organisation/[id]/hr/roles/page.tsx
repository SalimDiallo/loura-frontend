"use client";

import { ListPageLayout, ListStat } from "@/components/layout/ListPageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteRole, useRoles } from "@/lib/hooks/hr";
import type { Role } from "@/lib/types";
import { Check, Eye, Plus, Shield, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

/**
 * Page de gestion des rôles d'une organisation
 */
export default function RolesPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useRoles(orgId);

  // Mutation
  const deleteRole = useDeleteRole();

  // Handlers
  const handleDelete = async () => {
    if (!deletingRole) return;

    try {
      await deleteRole.mutateAsync({ orgId, roleId: deletingRole.id });
      toast.success("Rôle supprimé avec succès");
      setDeletingRole(null);
    } catch (error: any) {
      toast.error("Impossible de supprimer le rôle");
    }
  };

  if (rolesLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ListPageLayout
      title="Rôles & Permissions"
      description="Gérez les rôles et permissions de votre organisation"
      icon={Shield}
      headerActions={[
        {
          label: "Créer un rôle",
          icon: Plus,
          onClick: () => router.push(`/organisation/${orgId}/hr/roles/create`),
        }
      ]}
      stats={[
        <ListStat
          key="total"
          label="Total Rôles"
          value={roles.length}
          icon={<Shield className="h-4 w-4 text-muted-foreground" />}
        />,
        <ListStat
          key="avg"
          label="Permissions moyennes"
          value={roles.length > 0
            ? Math.round(roles.reduce((sum, r) => sum + r.permissions.length, 0) / roles.length)
            : 0}
          icon={<Shield className="h-4 w-4 text-muted-foreground" />}
        />,
        <ListStat
          key="max"
          label="Rôle le plus complet"
          value={roles.length > 0 ? Math.max(...roles.map((r) => r.permissions.length)) : 0}
          icon={<Shield className="h-4 w-4 text-muted-foreground" />}
        />
      ]}
      content={
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground border border-dashed rounded-lg">
                <Shield className="h-12 w-12 mb-2 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Aucun rôle trouvé</p>
                <p className="mb-4">Créez un rôle pour gérer les permissions de votre organisation.</p>
                <Button
                  onClick={() => router.push(`/organisation/${orgId}/hr/roles/create`)}
                  className="gap-2"
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau rôle
                </Button>
              </div>
            ) : (
              roles.map((role) => (
                <Card key={role.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          {role.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {role.description || "Aucune description"}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(`/organisation/${orgId}/hr/roles/${role.id}`)
                          }
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingRole(role)}
                          disabled={deleteRole.isPending}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Permissions</span>
                        <Badge variant="secondary">{role.permissions.length}</Badge>
                      </div>
                      {role.permissions.length > 0 && (
                        <div className="space-y-1">
                          {role.permissions.slice(0, 3).map((perm) => (
                            <div
                              key={perm.id}
                              className="text-xs text-muted-foreground flex items-center gap-1"
                            >
                              <Check className="h-3 w-3 text-green-600" />
                              {perm.label}
                            </div>
                          ))}
                          {role.permissions.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{role.permissions.length - 3} autres...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Delete Dialog */}
          <Dialog open={!!deletingRole} onOpenChange={() => setDeletingRole(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer le rôle</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer le rôle "
                  {deletingRole?.name}" ? Cette action est irréversible. Les
                  employés ayant ce rôle perdront leurs permissions associées.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeletingRole(null)}>
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteRole.isPending}
                >
                  {deleteRole.isPending ? "Suppression..." : "Supprimer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }
    />
  );
}
