"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
import { ListPageLayout, ListPagination, ListSearchFilters, ListStat, ListTable, ListTableColumn } from "@/components/layout/ListPageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginatedMembers } from "@/lib/hooks/hr";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { FaEnvelope, FaEye, FaUserPlus, FaUsers } from "react-icons/fa";

/**
 * Page de gestion des employés (membres) d'une organisation
 * Utilise le composant ListPageLayout réutilisable pour unifier les pages de listes.
 */
export default function EmployeesPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  // Filtres locaux employés
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [activeSince, setActiveSince] = useState<string>("");
  const [showOnlyWithEmail, setShowOnlyWithEmail] = useState<boolean>(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Fetch et pagination
  const {
    data: members,
    meta,
    page,
    setPage,
    nextPage,
    prevPage,
    isLoading,
    error,
  } = usePaginatedMembers(
    orgId,
    {
      search: search || undefined,
    },
    {
      pageSize: 5,
    }
  );

  // ... (filtrage local logic unchanged)
  const roleOptions: { name: string; id: string }[] = Array.from(
    new Map(
      (members || []).filter(Boolean).map(m => m.role && { id: m.role?.id, name: m.role?.name })
        .filter(Boolean)
        .map(obj => [obj!.id, obj!])
    ).values()
  );
  let filteredMembers = members || [];
  if (statusFilter === "active") {
    filteredMembers = filteredMembers.filter((m) => m.is_active);
  }
  if (statusFilter === "inactive") {
    filteredMembers = filteredMembers.filter((m) => !m.is_active);
  }
  if (roleFilter) {
    filteredMembers = filteredMembers.filter((m) => m.role?.id === roleFilter);
  }
  if (activeSince) {
    filteredMembers = filteredMembers.filter((m) => {
      if (!m.joined_at) return false;
      const joined = new Date(m.joined_at);
      return joined >= new Date(activeSince);
    });
  }
  if (showOnlyWithEmail) {
    filteredMembers = filteredMembers.filter((m) => !!m.employee?.user?.email);
  }
  const filtersAreActive =
    !(statusFilter === "all") ||
    !!roleFilter ||
    !!activeSince ||
    showOnlyWithEmail;

  const totalCount = meta.totalItems;

  // Si erreur API
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              Erreur lors du chargement des employés : {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ListPageLayout
      title="Employés"
      icon={FaUsers}
      description="Gérez les membres de votre organisation"
      headerActions={[
        {
          label: "Voir les invitations",
          icon: FaEye,
          onClick: () => router.push(`/organisation/${orgId}/hr/employees/invitations`),
          variant: "outline"
        },
        {
          label: "Ajouter un employé",
          icon: FaUserPlus,
          onClick: () => router.push(`/organisation/${orgId}/hr/employees/invite`),
        }
      ]}
      stats={[
        <ListStat
          key="total"
          label="Total Employés"
          value={totalCount}
          icon={<FaUsers className="h-4 w-4 text-muted-foreground" />}
        />,
        <ListStat
          key="active"
          label="Actifs (page)"
          value={members?.filter((m) => m.is_active).length || 0}
          icon={<FaUsers className="h-4 w-4 text-green-600" />}
        />,
        <ListStat
          key="inactive"
          label="Inactifs (page)"
          value={members?.filter((m) => !m.is_active).length || 0}
          icon={<FaUsers className="h-4 w-4 text-gray-400" />}
        />
      ]}
      searchFilters={
        <ListSearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher par nom ou email..."
          filtersOpen={filterOpen}
          onFiltersOpenChange={setFilterOpen}
          filtersAreActive={filtersAreActive}
          filters={
            <>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                  Statut
                </div>
                <div className="flex flex-col gap-2">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={statusFilter === "all"}
                      onCheckedChange={() => setStatusFilter("all")}
                    />
                    Tous
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={statusFilter === "active"}
                      onCheckedChange={() => setStatusFilter("active")}
                    />
                    Actifs
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={statusFilter === "inactive"}
                      onCheckedChange={() => setStatusFilter("inactive")}
                    />
                    Inactifs
                  </label>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                  Rôle
                </div>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={roleFilter === null}
                      onCheckedChange={() => setRoleFilter(null)}
                    />
                    Tous les rôles
                  </label>
                  {roleOptions.map(role => (
                    <label
                      key={role.id}
                      className="inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={roleFilter === role.id}
                        onCheckedChange={() => setRoleFilter(role.id)}
                      />
                      {role.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                  Date de début (rejoint après)
                </div>
                <Input
                  type="date"
                  value={activeSince}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={e => setActiveSince(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
              </div>
              {filtersAreActive && (
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      setStatusFilter("all");
                      setRoleFilter(null);
                      setActiveSince("");
                      setShowOnlyWithEmail(false);
                    }}
                  >
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </>
          }
        />
      }
      content={
        <>
          {/* Loading and Empty states */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <FaUsers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucun employé trouvé</p>
              <p className="text-sm text-muted-foreground">
                {search || filtersAreActive
                  ? "Essayez de modifier votre recherche ou vos filtres"
                  : "Commencez par inviter des membres"}
              </p>
              <div className="mt-6 flex justify-center">
                <Button
                  variant="default"
                  onClick={() => router.push(`/organisation/${orgId}/hr/employees/invite`)}
                >
                  <FaUserPlus className="mr-2" />
                  Inviter un membre
                </Button>
              </div>
            </div>
       
          ) : (
            <ListTable
              columns={[
                <ListTableColumn key="employee" header="Employé">
                  {({ value: member }) => (
                    <div className="font-medium flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {member.employee.user.avatar_url ? (
                          <img
                            src={member.employee.user.avatar_url}
                            alt={member.employee.user.first_name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-semibold text-primary">
                            {member.employee.user.first_name[0]}
                            {member.employee.user.last_name[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {member.employee.user.first_name}{" "}
                          {member.employee.user.last_name}
                        </div>
                        {member.employee.employee_id && (
                          <div className="text-xs text-muted-foreground">
                            ID: {member.employee.employee_id}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </ListTableColumn>,
                <ListTableColumn key="email" header="Email">
                  {({ value: member }) => (
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="h-3 w-3 text-muted-foreground" />
                      {member.employee.user.email}
                    </div>
                  )}
                </ListTableColumn>,
                <ListTableColumn key="role" header="Rôle">
                  {({ value: member }) =>
                    member.role ? (
                      <Badge variant="outline">{member.role.name}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Aucun rôle
                      </span>
                    )
                  }
                </ListTableColumn>,
                <ListTableColumn key="status" header="Statut">
                  {({ value: member }) => <BadgeStatus status={member.is_active} />}
                </ListTableColumn>,
                <ListTableColumn key="joined_at" header="Rejoint le">
                  {({ value: member }) => (
                    <span className="text-sm text-muted-foreground">
                      {new Date(member.joined_at).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </ListTableColumn>,
                <ListTableColumn key="actions" header="Actions" align="right">
                  {({ value: member }) => (
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() =>
                          router.push(
                            `/organisation/${orgId}/hr/employees/${member.id}`
                          )
                        }
                      >
                        <FaEye className="h-4 w-4" />
                        Voir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/organisation/${orgId}/hr/employees/${member.id}?edit=1`
                          )
                        }
                      >
                        Modifier
                      </Button>
                    </div>
                  )}
                </ListTableColumn>
              ]}
              data={filteredMembers}
            />
          )}

          {/* Pagination */}
          {!isLoading && filteredMembers.length > 0 && meta.totalPages > 1 && (
            <ListPagination
              meta={meta}
              onPageChange={setPage}
              onNext={nextPage}
              onPrev={prevPage}
            />
          )}
        </>
      }
    />
  );
}
