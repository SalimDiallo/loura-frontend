"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
import { FormPageLayout } from "@/components/layout/FormPageLayout";
import { ListTable, ListTableColumn } from "@/components/layout/ListPageLayout";
import { PermissionGuard } from "@/components/permissions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SmartSelector, type SmartSelectorItem } from "@/components/ui/smart-selector";
import {
    useCreateAssignment,
    useDeleteAssignment,
    usePaginatedMembers,
    usePosition,
    usePositionMembers
} from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import { CreatePositionAssignmentData } from "@/lib/types";
import { Calendar, Loader2, Plus, Trash2, User } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaUserAltSlash } from "react-icons/fa";
import { toast } from "sonner";

export default function PositionAssignmentsPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.HR.MANAGE_EMPLOYEES}>
      <PositionAssignmentsPage />
    </PermissionGuard>
  );
}

function PositionAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const positionId = params.positionId as string;

  const [formData, setFormData] = useState<Partial<CreatePositionAssignmentData>>({
    position_id: positionId,
    membership_id: "",
    start_date: new Date().toISOString().split("T")[0], // Today
    end_date: "",
  });
  const [showAssignConfirm, setShowAssignConfirm] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<any | null>(null);

  // Fetch Position
  const { data: position, isLoading: isPosLoading } = usePosition(orgId, positionId);

  // Fetch Assignments (members in this position)
  const { data: assignments, isLoading: isAssignmentsLoading } = usePositionMembers(orgId, positionId);
  const assignmentsList = assignments || [];

  // Fetch all members to pick from
  const { data: membersResponse } = usePaginatedMembers(orgId, {}, { pageSize: 100 });
  const allMembers = membersResponse || [];

  // Mutations
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();

  // Mapper pour SmartSelector
  const memberItems: SmartSelectorItem[] = useMemo(() => {
    // Filtrer les membres qui ne sont pas DÉJÀ assignés activement à ce poste
    // (optionnel mais UX friendly)
    const activeMemberIds = assignmentsList.filter(a => a.is_active).map(a => a.membership.id);
    return allMembers
      .filter((m: any) => !activeMemberIds.includes(m.id))
      .map((m: any) => ({
      id: m.id,
      name: `${m.employee.user.first_name} ${m.employee.user.last_name}`,
      subtitle: m.employee.user.email,
      icon: User,
    }));
  }, [allMembers, assignmentsList]);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.membership_id) {
      toast("Membre requis", { description: "Veuillez sélectionner un membre." });
      return;
    }
    if (!formData.start_date) {
      toast("Date de début requise", { description: "La date de début est obligatoire." });
      return;
    }
    setShowAssignConfirm(true);
  };

  const handleConfirmAssign = async () => {
    try {
      const payload: CreatePositionAssignmentData = {
        ...formData,
        end_date: formData.end_date?.trim() ? formData.end_date : null,
      } as CreatePositionAssignmentData;

      await createAssignment.mutateAsync({
        orgId,
        data: payload,
      });

      toast.success("Membre assigné", { description: "Le membre occupe désormais ce poste." });
      // Reset form
      setFormData(prev => ({
        ...prev,
        membership_id: "",
        end_date: "",
      }));
      setShowAssignConfirm(false);
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible d'assigner le membre",
      });
    }
  };

  const handleConfirmUnassign = async () => {
    if (!unassignTarget) return;
    try {
      await deleteAssignment.mutateAsync({
        orgId,
        assignId: unassignTarget.id,
      });
      toast.success("Assignation retirée");
      setUnassignTarget(null);
    } catch (error: any) {
      toast.error("Erreur", {
        description: error.message || "Impossible de retirer l'assignation",
      });
    }
  };

  const isLoading = isPosLoading || isAssignmentsLoading;

  return (
    <FormPageLayout
      title="Assignations"
      subtitle={position ? `Membres occupant le poste : ${position.name}` : "Chargement..."}
      backLink={`/organisation/${orgId}/hr/positions`}
      sidebar={
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle assignation</CardTitle>
            <CardDescription>
              Attribuer ce poste à un employé existant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssign} className="space-y-4">
              <div className="space-y-2">
                <Label>Employé *</Label>
                <SmartSelector
                  items={memberItems}
                  selectedIds={formData.membership_id ? [formData.membership_id] : []}
                  onChange={(ids) => setFormData({ ...formData, membership_id: ids[0] || "" })}
                  placeholder="Sélectionner un membre"
                  accentColor="primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Date de prise de poste *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">Date de fin <span className="text-muted-foreground font-normal text-xs">(Optionnel)</span></Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date || ""}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={createAssignment.isPending || !formData.membership_id}
                className="w-full gap-2 mt-2"
              >
                {createAssignment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Assigner
              </Button>
            </form>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Historique des occupants</CardTitle>
          <CardDescription>
            Tous les membres ayant occupé ou occupant actuellement ce poste
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
               <Skeleton className="h-12 w-full" />
            </div>
          ) : assignmentsList.length === 0 ? (
            <div className="text-center py-12 px-4 border rounded-lg border-dashed">
              <FaUserAltSlash className="h-8 w-8 mx-auto text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm font-medium">Aucun membre n'a été assigné à ce poste</p>
              <p className="text-xs text-muted-foreground mt-1">
                Utilisez le formulaire ci-contre pour attribuer le rôle.
              </p>
            </div>
          ) : (
            <ListTable
              columns={[
                <ListTableColumn key="member" header="Employé">
                  {({ value: assignment }) => (
                    <div className="font-medium flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {assignment.membership.employee.user.first_name[0]}
                          {assignment.membership.employee.user.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {assignment.membership.employee.user.first_name}{" "}
                          {assignment.membership.employee.user.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {assignment.membership.employee.user.email}
                        </div>
                      </div>
                    </div>
                  )}
                </ListTableColumn>,
                <ListTableColumn key="dates" header="Période">
                  {({ value: assignment }) => (
                     <div className="text-sm">
                       <div>Du : {new Date(assignment.start_date).toLocaleDateString('fr-FR')}</div>
                       <div className="text-xs text-muted-foreground mt-0.5">
                         {assignment.end_date ? `Au : ${new Date(assignment.end_date).toLocaleDateString('fr-FR')}` : 'En cours'}
                       </div>
                     </div>
                  )}
                </ListTableColumn>,
                <ListTableColumn key="status" header="Statut">
                  {({ value: assignment }) => <BadgeStatus status={assignment.is_active} />}
                </ListTableColumn>,
                <ListTableColumn key="actions" header="" align="right">
                  {({ value: assignment }) => (
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setUnassignTarget(assignment)}
                        disabled={deleteAssignment.isPending}
                        title="Retirer l'assignation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </ListTableColumn>
              ]}
              data={assignmentsList}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={showAssignConfirm} onOpenChange={setShowAssignConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Confirmer l'assignation
            </DialogTitle>
            <DialogDescription>
              Le membre sera officiellement affecté à ce poste à la date
              indiquée.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 rounded-md border bg-muted/30 p-4 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Poste</span>
              <span className="font-medium text-right">
                {position?.name ?? "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Membre</span>
              <span className="font-medium text-right">
                {(() => {
                  const m: any = (allMembers as any[]).find(
                    (x) => x.id === formData.membership_id
                  );
                  if (!m) return "—";
                  return `${m.employee.user.first_name} ${m.employee.user.last_name}`;
                })()}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Prise de poste</span>
              <span className="font-medium text-right">
                {formData.start_date
                  ? new Date(formData.start_date).toLocaleDateString("fr-FR")
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Date de fin</span>
              <span className="font-medium text-right">
                {formData.end_date?.trim()
                  ? new Date(formData.end_date).toLocaleDateString("fr-FR")
                  : "Indéterminée"}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssignConfirm(false)}
              disabled={createAssignment.isPending}
            >
              Retour
            </Button>
            <Button
              onClick={handleConfirmAssign}
              disabled={createAssignment.isPending}
              className="gap-2"
            >
              {createAssignment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Confirmer l'assignation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!unassignTarget}
        onOpenChange={(open) => {
          if (!open) setUnassignTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaUserAltSlash className="h-4 w-4 text-destructive" />
              Retirer cette assignation ?
            </DialogTitle>
            <DialogDescription>
              Le membre ne sera plus rattaché à ce poste. L'historique de
              l'assignation sera conservé.
            </DialogDescription>
          </DialogHeader>
          {unassignTarget && (
            <div className="space-y-2 rounded-md border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Poste</span>
                <span className="font-medium text-right">
                  {position?.name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Membre</span>
                <span className="font-medium text-right">
                  {unassignTarget.membership?.employee?.user?.first_name}{" "}
                  {unassignTarget.membership?.employee?.user?.last_name}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Prise de poste</span>
                <span className="font-medium text-right">
                  {unassignTarget.start_date
                    ? new Date(
                        unassignTarget.start_date
                      ).toLocaleDateString("fr-FR")
                    : "—"}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUnassignTarget(null)}
              disabled={deleteAssignment.isPending}
            >
              Retour
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmUnassign}
              disabled={deleteAssignment.isPending}
              className="gap-2"
            >
              {deleteAssignment.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Retirer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormPageLayout>
  );
}
