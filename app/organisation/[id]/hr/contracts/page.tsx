"use client";

import { ListPageLayout, ListSearchFilters, ListStat } from "@/components/layout/ListPageLayout";
import { Can, useOrgPermissions } from "@/components/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useContracts } from "@/lib/hooks/hr";
import { PERMISSIONS } from "@/lib/permissions";
import type { Contract, ContractStatus, ContractType } from "@/lib/types";
import { FileText, Plus, UserCheck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FaClipboardList, FaFileContract, FaUserTie } from "react-icons/fa";

const CONTRACT_TYPES: { id: ContractType; label: string }[] = [
  { id: "cdi", label: "CDI" },
  { id: "cdd", label: "CDD" },
  { id: "freelance", label: "Freelance" },
  { id: "internship", label: "Stage" },
  { id: "other", label: "Autre" },
];

const CONTRACT_STATUSES: { id: ContractStatus; label: string }[] = [
  { id: "active", label: "Actif" },
  { id: "terminated", label: "Terminé" },
  { id: "suspended", label: "Suspendu" },
];

function statusVariant(status: ContractStatus): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "active": return "default";
    case "terminated": return "destructive";
    case "suspended": return "secondary";
    default: return "outline";
  }
}

export default function ContractsPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;
  const { can } = useOrgPermissions();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const stableFilters = useMemo(
    () => ({
      contract_type: typeFilter || undefined,
      status: statusFilter || undefined,
      page_size: "all" as const,
    }),
    [typeFilter, statusFilter]
  );

  const { data: contractsRaw, isLoading, error } = useContracts(orgId, stableFilters);
  const contracts: Contract[] = Array.isArray(contractsRaw) ? contractsRaw : ((contractsRaw as any)?.results || []);

  const filteredContracts = useMemo(() => {
    if (!search) return contracts;
    const lc = search.toLowerCase();
    return contracts.filter((c) => {
      const name = `${c.membership?.employee?.user?.first_name || ""} ${c.membership?.employee?.user?.last_name || ""}`.toLowerCase();
      const email = (c.membership?.employee?.user?.email || "").toLowerCase();
      return name.includes(lc) || email.includes(lc);
    });
  }, [contracts, search]);

  const filtersAreActive = !!typeFilter || !!statusFilter;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-md">
          Erreur lors du chargement des contrats : {error.message}
        </div>
      </div>
    );
  }

  return (
    <ListPageLayout
      title="Contrats"
      icon={FaFileContract}
      description="Gérez les contrats de travail des membres"
      headerActions={
        can(PERMISSIONS.CONTRACTS.MANAGE)
          ? [{
              label: "Nouveau contrat",
              icon: Plus,
              onClick: () => router.push(`/organisation/${orgId}/hr/contracts/create`),
            }]
          : []
      }
      stats={[
        <ListStat key="total" label="Total" value={contracts.length} icon={<FaClipboardList className="h-4 w-4 text-muted-foreground" />} />,
        <ListStat key="active" label="Actifs" value={contracts.filter((c) => c.status === "active").length} icon={<UserCheck className="h-4 w-4 text-green-600" />} />,
        <ListStat key="cdi" label="CDI" value={contracts.filter((c) => c.contract_type === "cdi").length} icon={<FileText className="h-4 w-4 text-blue-500" />} />,
      ]}
      searchFilters={
        <ListSearchFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Rechercher par nom d'employé..."
          filtersOpen={filterOpen}
          onFiltersOpenChange={setFilterOpen}
          filtersAreActive={filtersAreActive}
          filters={
            <>
              <div>
                <div className="text-xs font-medium uppercase text-muted-foreground mb-2">Type de contrat</div>
                <select className="w-full text-sm border-border bg-background rounded-md p-2 focus:ring-1 focus:ring-primary outline-none" value={typeFilter || ""} onChange={(e) => setTypeFilter(e.target.value || null)}>
                  <option value="">Tous les types</option>
                  {CONTRACT_TYPES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
                </select>
              </div>
              <div className="mt-4">
                <div className="text-xs font-medium uppercase text-muted-foreground mb-2">Statut</div>
                <select className="w-full text-sm border-border bg-background rounded-md p-2 focus:ring-1 focus:ring-primary outline-none" value={statusFilter || ""} onChange={(e) => setStatusFilter(e.target.value || null)}>
                  <option value="">Tous les statuts</option>
                  {CONTRACT_STATUSES.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}
                </select>
              </div>
              {filtersAreActive && (
                <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => { setTypeFilter(null); setStatusFilter(null); }}>
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
            <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => (<Skeleton key={i} className="h-14 w-full" />))}</div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-16">
              <FaFileContract className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium">Aucun contrat trouvé</p>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                {search || filtersAreActive ? "Essayez de modifier vos filtres" : "Créez un premier contrat pour un membre"}
              </p>
              <Can permission={PERMISSIONS.CONTRACTS.MANAGE}>
                {!search && !filtersAreActive && (
                  <Button variant="outline" className="gap-2" onClick={() => router.push(`/organisation/${orgId}/hr/contracts/create`)}>
                    <Plus className="h-4 w-4" /> Nouveau contrat
                  </Button>
                )}
              </Can>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/organisation/${orgId}/hr/contracts/${contract.id}`)}
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <FaUserTie className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {contract.membership?.employee?.user?.first_name}{" "}
                        {contract.membership?.employee?.user?.last_name}
                      </p>
                      <Badge variant="secondary" className="font-normal text-xs shrink-0">
                        {contract.contract_type_display}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {contract.start_date} → {contract.end_date || "Indéterminée"}
                      {" • "}
                      {Number(contract.base_salary).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Badge variant={statusVariant(contract.status)} className="shrink-0">
                    {contract.status_display}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </>
      }
    />
  );
}
