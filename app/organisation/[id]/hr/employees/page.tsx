"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePaginatedMembers } from "@/lib/hooks/hr";
import { Filter as FilterIcon, Mail, Search, Users, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { FaEye, FaUserPlus } from "react-icons/fa";

/**
 * Page de gestion des employés (membres) d'une organisation
 */
export default function EmployeesPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [activeSince, setActiveSince] = useState<string>(""); // yyyy-mm-dd
  const [showOnlyWithEmail, setShowOnlyWithEmail] = useState<boolean>(false);

  // UI pour ouvrir/fermer les filtres avancés
  const [filterOpen, setFilterOpen] = useState(false);

  // Fetch members avec recherche et pagination
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

  // Extraction des rôles uniques listés dans les membres pour options de filtre
  const roleOptions: { name: string; id: string }[] = Array.from(
    new Map(
      (members || []).filter(Boolean).map(m => m.role && { id: m.role?.id, name: m.role?.name })
        .filter(Boolean) // enlève null des membres sans rôle
        .map(obj => [obj!.id, obj!])
    ).values()
  );

  // Application des filtres côté client (s'appliquent sur la page courante)
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
    // La date de join >= activeSince
    filteredMembers = filteredMembers.filter((m) => {
      if (!m.joined_at) return false;
      const joined = new Date(m.joined_at);
      // Date d'entrée >= filtre
      return joined >= new Date(activeSince);
    });
  }
  if (showOnlyWithEmail) {
    filteredMembers = filteredMembers.filter((m) => !!m.employee?.user?.email);
  }
  const totalCount = meta.totalItems;

  // Pour savoir si au moins un filtre avancé est actif
  const filtersAreActive =
    !(statusFilter === "all") ||
    !!roleFilter ||
    !!activeSince ||
    showOnlyWithEmail;

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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Employés
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez les membres de votre organisation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/organisation/${orgId}/hr/employees/invitations`)}
            className="gap-2"
            variant={"outline"}
          >
            <FaEye className="h-4 w-4" />
            Voir les invitations
          </Button>
          <Button
            onClick={() => router.push(`/organisation/${orgId}/hr/employees/invite`)}
            className="gap-2"
          >
            <FaUserPlus className="h-4 w-4" />
            Ajouter un employé
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs (page)</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members?.filter((m) => m.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactifs (page)</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members?.filter((m) => !m.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des employés</CardTitle>
          <CardDescription>
            Recherchez et gérez les membres de votre équipe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search et filtre avancé */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                spellCheck={false}
              />
              {search && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="Effacer la recherche"
                  onClick={() => setSearch("")}
                  type="button"
                  tabIndex={0}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Icône filtre pro */}
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant={filtersAreActive ? "secondary" : "ghost"}
                  className={`ml-0 sm:ml-2 ${filtersAreActive ? "text-primary border border-primary/40" : ""}`}
                  aria-label="Filtrer"
                >
                  <FilterIcon className="h-5 w-5" />
                  {filtersAreActive && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <div className="space-y-4">
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
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={showOnlyWithEmail}
                        onCheckedChange={() => setShowOnlyWithEmail(val => !val)}
                      />
                      Uniquement les membres avec email
                    </label>
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
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Aucun employé trouvé</p>
              <p className="text-sm text-muted-foreground">
                {search || filtersAreActive
                  ? "Essayez de modifier votre recherche ou vos filtres"
                  : "Commencez par inviter des membres"}
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Rejoint le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
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
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {member.employee.user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.role ? (
                          <Badge variant="outline">{member.role.name}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Aucun rôle
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {member.is_active ? (
                          <Badge variant="default" className="bg-green-600">
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(member.joined_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right flex items-center gap-2 justify-end">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && filteredMembers.length > 0 && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {meta.currentPage} sur {meta.totalPages} ({meta.totalItems} employés au total)
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (meta.hasPreviousPage) prevPage();
                      }}
                      className={!meta.hasPreviousPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {/* Première page */}
                  {meta.currentPage > 2 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(1);
                        }}
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Ellipsis si nécessaire */}
                  {meta.currentPage > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Page précédente */}
                  {meta.currentPage > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(meta.currentPage - 1);
                        }}
                      >
                        {meta.currentPage - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Page actuelle */}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive
                      onClick={(e) => e.preventDefault()}
                    >
                      {meta.currentPage}
                    </PaginationLink>
                  </PaginationItem>

                  {/* Page suivante */}
                  {meta.currentPage < meta.totalPages && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(meta.currentPage + 1);
                        }}
                      >
                        {meta.currentPage + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {/* Ellipsis si nécessaire */}
                  {meta.currentPage < meta.totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {/* Dernière page */}
                  {meta.currentPage < meta.totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(meta.totalPages);
                        }}
                      >
                        {meta.totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (meta.hasNextPage) nextPage();
                      }}
                      className={!meta.hasNextPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
