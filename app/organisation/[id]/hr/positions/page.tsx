"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
import { ListPageLayout, ListPagination, ListSearchFilters, ListStat, ListTable, ListTableColumn } from "@/components/layout/ListPageLayout";
import { Can, useOrgPermissions } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDepartments, usePaginatedPositions } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import { PositionLevel } from "@/lib/types";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaBriefcase, FaEdit, FaEye, FaNetworkWired, FaPlus, FaUserTie } from "react-icons/fa";

// Les différents niveaux de postes disponibles
const POSITION_LEVELS: { id: PositionLevel; label: string }[] = [
  { id: "junior", label: "Junior" },
  { id: "intermediate", label: "Intermédiaire" },
  { id: "senior", label: "Senior" },
  { id: "lead", label: "Lead" },
  { id: "manager", label: "Manager" },
  { id: "director", label: "Directeur" },
];

export default function PositionsPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.HR.MANAGE_EMPLOYEES);

  // Filtres locaux
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<PositionLevel | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Fetch Départements (pour les options de filtre)
  const { data: departmentsData } = useDepartments(orgId, { page_size: "all" });
  const allDepartments = Array.isArray(departmentsData) ? departmentsData : ((departmentsData as any)?.results || []);

  const stableFilters = useMemo(
    () => ({
      search: search || undefined,
      department: departmentFilter || undefined,
      level: levelFilter || undefined,
    }),
    [search, departmentFilter, levelFilter]
  );

  // Fetch Postes avec pagination
  const {
    data: positionsList,
    meta,
    page,
    setPage,
    nextPage,
    prevPage,
    isLoading,
    error
  } = usePaginatedPositions(orgId, stableFilters, { pageSize: 10 });

  const filtersAreActive = !!departmentFilter || !!levelFilter;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Erreur lors du chargement des postes : {error.message}
        </div>
      </div>
    );
  }

  return (
    <ListPageLayout
      title="Postes"
      icon={FaUserTie}
      description="Gérez les différents postes (jobs) de l'entreprise"
      headerActions={
        canManage
          ? [{ label: "Nouveau poste", icon: FaPlus, onClick: () => router.push(`/organisation/${orgId}/hr/positions/create`) }]
          : []
      }
      stats={[
        <ListStat
          key="total"
          label="Total Postes"
          value={meta.totalItems}
          icon={<FaUserTie className="h-4 w-4 text-muted-foreground" />}
        />,
        <ListStat
          key="active"
          label="Postes Actifs"
          value={positionsList.filter((p: any) => p.is_active).length}
          icon={<FaBriefcase className="h-4 w-4 text-green-600" />}
        />,
        <ListStat
          key="management"
          label="Management"
          value={positionsList.filter((p: any) => ["manager", "director"].includes(p.level)).length}
          icon={<FaNetworkWired className="h-4 w-4 text-blue-500" />}
        />
      ]}
      searchFilters={
        <ListSearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher par nom..."
          filtersOpen={filterOpen}
          onFiltersOpenChange={setFilterOpen}
          filtersAreActive={filtersAreActive}
          filters={
            <>
              {/* Filtre par Niveau */}
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                  Niveau de seniorité
                </div>
                <select
                  className="w-full text-sm border-border bg-background rounded-md p-2 focus:ring-1 focus:ring-primary outline-none"
                  value={levelFilter || ""}
                  onChange={(e) => setLevelFilter((e.target.value as PositionLevel) || null)}
                >
                  <option value="">Tous les niveaux</option>
                  {POSITION_LEVELS.map(level => (
                    <option key={level.id} value={level.id}>{level.label}</option>
                  ))}
                </select>
              </div>

              {/* Filtre par Département */}
              <div className="mt-4">
                <div className="text-xs font-medium uppercase text-muted-foreground mb-2">
                  Département
                </div>
                <select
                  className="w-full text-sm border-border bg-background rounded-md p-2 focus:ring-1 focus:ring-primary outline-none"
                  value={departmentFilter || ""}
                  onChange={(e) => setDepartmentFilter(e.target.value || null)}
                >
                  <option value="">Tous les départements</option>
                  {allDepartments.map((dept: any) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              {filtersAreActive && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => {
                    setDepartmentFilter(null);
                    setLevelFilter(null);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </>
          }
        />
      }
      content={
        <>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : positionsList.length === 0 ? (
            <div className="text-center py-12">
              <FaBriefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun poste trouvé</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                {search || filtersAreActive
                  ? "Essayez de modifier votre recherche ou vos filtres"
                  : "Commencez par définir les postes de votre entreprise"}
              </p>
              <Can permission={PERMISSIONS.HR.MANAGE_EMPLOYEES}>
                <Button onClick={() => router.push(`/organisation/${orgId}/hr/positions/create`)}>
                  <FaPlus className="mr-2" />
                  Créer un poste
                </Button>
              </Can>
            </div>
          ) : (
            <>
              <ListTable
                columns={[
                  <ListTableColumn key="name" header="Nom du poste">
                    {({ value: position }) => (
                      <div className="font-medium flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <FaUserTie className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{position.name}</div>
                          {position.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {position.description}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="department" header="Département">
                    {({ value: position }) =>
                      position.department ? (
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <FaNetworkWired className="h-3 w-3" />
                          {position.department.name}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground/50 italic">
                          Aucun
                        </span>
                      )
                    }
                  </ListTableColumn>,
                  <ListTableColumn key="level" header="Niveau">
                    {({ value: position }) => (
                      <Badge variant="secondary" className="font-normal border-border/50">
                        {position.level_display || position.level}
                      </Badge>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="status" header="Statut">
                    {({ value: position }) => <BadgeStatus status={position.is_active} />}
                  </ListTableColumn>,
                  <ListTableColumn key="actions" header="Actions" align="right">
                    {({ value: position }) => (
                      <div className="flex items-center gap-2 justify-end">
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              router.push(`/organisation/${orgId}/hr/positions/${position.id}`)
                            }
                          >
                            <FaEdit className="h-4 w-4 mr-1.5" />
                            Modifier
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/organisation/${orgId}/hr/positions/${position.id}/assignments`)
                          }
                        >
                          <FaEye className="h-4 w-4 mr-1.5 text-muted-foreground" />
                          Membres
                        </Button>
                      </div>
                    )}
                  </ListTableColumn>
                ]}
                data={positionsList}
              />
              <div className="mt-4">
                <ListPagination
                  meta={meta}
                  onPageChange={setPage}
                  onNext={nextPage}
                  onPrev={prevPage}
                />
              </div>
            </>
          )}
        </>
      }
    />
  );
}
