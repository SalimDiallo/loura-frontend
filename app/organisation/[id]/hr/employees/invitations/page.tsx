"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useOrgInvitations, useSendInvitation } from "@/lib/hooks/hr";
import type { Invitation, Permission } from "@/lib/types";
import { Check, Clock, Mail, MailX, RefreshCw, Send, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";


/**
 * Page de gestion des invitations d'une organisation
 */
export default function InvitationsPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  // Fetch invitations
  const { data: invitations = [], isLoading, error } = useOrgInvitations(orgId);
  const sendInvitation = useSendInvitation();

  // Statistiques
  const stats = {
    total: invitations.length,
    pending: invitations.filter((inv) => inv.status === "pending").length,
    accepted: invitations.filter((inv) => inv.status === "accepted").length,
    declined: invitations.filter((inv) => inv.status === "declined").length,
    expired: invitations.filter((inv) => inv.status === "expired").length,
  };

  const handleResendInvitation = async (invitation: Invitation) => {
    if (invitation.status !== "pending" && invitation.status !== "expired") {
      toast("Impossible de renvoyer", {
        description: "Seules les invitations en attente ou expirées peuvent être renvoyées.",
      });
      return;
    }

    try {
      await sendInvitation.mutateAsync({
        orgId,
        data: {
          email: invitation.email,
          role_id: invitation.role?.id,
          permission_ids: invitation.permissions.map((p: Permission) => p.id),
        },
      });
      toast("Invitation renvoyée", {
        description: `Une nouvelle invitation a été envoyée à ${invitation.email}`,
      });
    } catch (error: any) {
      toast("Erreur", {
        description: error.message || "Impossible de renvoyer l'invitation",
      });
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              Erreur lors du chargement des invitations : {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Invitations
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les invitations envoyées aux nouveaux membres
          </p>
        </div>
        <Button
          onClick={() => router.push(`/organisation/${orgId}/hr/employees/invite`)}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          Nouvelle invitation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptées</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Refusées</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.declined}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirées</CardTitle>
            <MailX className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des invitations</CardTitle>
          <CardDescription>
            Historique complet des invitations envoyées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucune invitation envoyée</p>
              <p className="text-sm text-muted-foreground mb-4">
                Commencez par inviter de nouveaux membres à rejoindre votre organisation
              </p>
              <Button
                onClick={() =>
                  router.push(`/organisation/${orgId}/hr/employees/invite`)
                }
              >
                <Send className="h-4 w-4 mr-2" />
                Envoyer une invitation
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Envoyée le</TableHead>
                    <TableHead>Expire le</TableHead>
                    <TableHead>Réponse le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {invitation.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {invitation.role ? (
                          <Badge variant="outline">{invitation.role.name}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Aucun rôle
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <BadgeStatus status={invitation.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(invitation.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invitation.expires_at ? (
                          new Date(invitation.expires_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        ) : (
                          <span className="text-xs">Jamais</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invitation.accepted_at ? (
                          new Date(invitation.accepted_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        ) : (
                          <span className="text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {(invitation.status === "pending" ||
                          invitation.status === "expired") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvitation(invitation)}
                            disabled={sendInvitation.isPending}
                            className="gap-1"
                          >
                            <RefreshCw
                              className={`h-3 w-3 ${sendInvitation.isPending ? "animate-spin" : ""}`}
                            />
                            Renvoyer
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
