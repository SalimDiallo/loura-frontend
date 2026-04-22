"use client";

import { BadgeStatus } from "@/components/BadgeStatus";
import { ListPageLayout, ListPagination, ListSearchFilters, ListStat, ListTable, ListTableColumn } from "@/components/layout/ListPageLayout";
import { Can, PermissionGuard, useOrgPermissions } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginatedDepartments } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import { DepartmentTree } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaBriefcase, FaBuilding, FaChevronDown, FaChevronRight, FaEdit, FaNetworkWired, FaPlus, FaUsers } from "react-icons/fa";

/**
 * Composant de rendu récursif de l'arbre des départements
 */
function DepartmentTreeNode({ 
  node, 
  onEdit 
}: { 
  node: DepartmentTree; 
  onEdit: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "flex items-center justify-between p-3 rounded-lg border border-transparent transition-all duration-200",
          "hover:bg-muted/50 hover:border-border/50 group"
        )}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "p-1 rounded-md hover:bg-muted transition-colors flex items-center justify-center w-6 h-6",
              !hasChildren && "opacity-0 cursor-default"
            )}
            disabled={!hasChildren}
          >
            {hasChildren && (
              isOpen ? <FaChevronDown className="h-3 w-3 text-muted-foreground" /> : <FaChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
          
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
            <FaNetworkWired className="h-4 w-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{node.name}</span>
              {!node.is_active && (
                <Badge variant="secondary" className="text-[10px] py-0 h-4">Inactif</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
              {node.manager ? (
                <span className="flex items-center gap-1">
                  <FaUsers className="h-3 w-3" />
                  {node.manager.first_name} {node.manager.last_name}
                </span>
              ) : (
                <span className="text-muted-foreground/60 italic">Aucun manager</span>
              )}
              {node.description && (
                <>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <span className="truncate max-w-[200px] md:max-w-md">{node.description}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={() => onEdit(node.id)}>
            <FaEdit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Children Container */}
      <div 
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          {hasChildren && (
            <div className="ml-6 pl-4 border-l border-border/50 mt-2 space-y-2">
              {node.children.map((child) => (
                <DepartmentTreeNode key={child.id} node={child} onEdit={onEdit} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DepartmentsPageWrapper() {
  return (
    <PermissionGuard permission={PERMISSIONS.HR.VIEW_EMPLOYEES}>
      <DepartmentsPage />
    </PermissionGuard>
  );
}

function DepartmentsPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();
  const canManage = can(PERMISSIONS.HR.MANAGE_EMPLOYEES);

  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const stableFilters = useMemo(
    () => ({
      search: search || undefined,
    }),
    [search]
  );

  // Fetch paginé
  const {
    data: departmentsList,
    meta,
    page,
    setPage,
    nextPage,
    prevPage,
    isLoading,
    error
  } = usePaginatedDepartments(orgId, stableFilters, { pageSize: 10 });

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              Erreur lors du chargement des départements : {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ListPageLayout
      title="Départements"
      icon={FaBriefcase}
      description="Organisez la structure hiérarchique de votre entreprise"
      headerActions={
        canManage
          ? [
              {
                label: "Nouveau département",
                icon: FaPlus,
                onClick: () => router.push(`/organisation/${orgId}/hr/departments/create`),
              },
            ]
          : []
      }
      stats={[
        <ListStat
          key="total"
          label="Total Départements"
          value={meta.totalItems}
          icon={<FaBuilding className="h-4 w-4 text-muted-foreground" />}
        />,
        // Since we can't efficiently filter all active globally with paginated results, unless backend returns it in meta,
        // We will just show the total for now, and maybe the page's active count or hide it.
        <ListStat
          key="active"
          label="Sur cette page"
          value={departmentsList.length}
          icon={<FaNetworkWired className="h-4 w-4 text-green-600" />}
        />
      ]}
      searchFilters={
        <ListSearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher un département..."
          filtersOpen={filterOpen}
          onFiltersOpenChange={setFilterOpen}
          filtersAreActive={!!search}
          filters={
            <div className="text-sm text-muted-foreground mt-4">
              La recherche utilise le nom du département.
            </div>
          }
        />
      }
      content={
        <>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : departmentsList.length === 0 ? (
            <div className="text-center py-16 bg-muted/20 rounded-lg">
              <FaNetworkWired className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun département trouvé</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                Commencez par créer la structure de base de votre organisation
              </p>
              <Can permission={PERMISSIONS.HR.MANAGE_EMPLOYEES}>
                <Button onClick={() => router.push(`/organisation/${orgId}/hr/departments/create`)}>
                  <FaPlus className="mr-2" />
                  Créer un département
                </Button>
              </Can>
            </div>
          ) : (
            <>
              <ListTable
                columns={[
                  <ListTableColumn key="name" header="Nom du département">
                    {({ value: dept }) => (
                      <div className="font-medium flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                          <FaNetworkWired className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{dept.name}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {dept.full_path !== dept.name ? dept.full_path : (dept.description || 'Département')}
                          </div>
                        </div>
                      </div>
                    )}
                  </ListTableColumn>,
                  <ListTableColumn key="manager" header="Manager">
                    {({ value: dept }) =>
                      dept.manager ? (
                        <span className="text-sm flex items-center gap-1.5">
                          <FaUsers className="h-3 w-3 text-muted-foreground" />
                          {dept.manager.first_name} {dept.manager.last_name}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground/50 italic">
                          Aucun
                        </span>
                      )
                    }
                  </ListTableColumn>,
                  <ListTableColumn key="status" header="Statut">
                    {({ value: dept }) => <BadgeStatus status={dept.is_active} />}
                  </ListTableColumn>,
                  <ListTableColumn key="actions" header="Actions" align="right">
                    {({ value: dept }) => (
                      <div className="flex items-center gap-2 justify-end">
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              router.push(`/organisation/${orgId}/hr/departments/${dept.id}`)
                            }
                          >
                            <FaEdit className="h-4 w-4 mr-1.5" />
                            Modifier
                          </Button>
                        )}
                      </div>
                    )}
                  </ListTableColumn>
                ]}
                data={departmentsList}
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
