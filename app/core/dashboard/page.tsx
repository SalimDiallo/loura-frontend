"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { useCurrentUser } from "@/lib/hooks/auth/useCurrentUser";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaBuilding,
  FaUsers
} from "react-icons/fa";

export default function DashboardPage() {
  const router = useRouter();
  const [isUiLoading, setIsUiLoading] = useState(true);

  // Auth/user hook
  const { data: user, isLoading: isUserLoading, isError } = useCurrentUser();

  // UI skeleton/app loading (not tied to user data loading)
  useEffect(() => {
    setIsUiLoading(true);
    setTimeout(() => setIsUiLoading(false), 500);
  }, []);

  // Combine both UI and user loading states for main skeleton
  const isLoading = isUiLoading || isUserLoading;

  // Fallback if user data fails to load
  if (isError) {
    return (
      <div className="px-4 py-6 max-w-6xl mx-auto">
        <div className="text-red-700 bg-red-100 px-4 py-3 rounded">
          Erreur lors du chargement de vos informations. Veuillez réessayer ou vous reconnecter.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-6xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-5 border bg-muted/10">
              <div className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-3 w-28" />
              </div>
            </Card>
          ))}
        </div>
        {/* Lists Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Card className="p-4 border bg-muted/10">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const userName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.email || "Utilisateur";

  // Data map simulée
  const ownedOrganizations = [
    { id: 1, name: "Acme Corp", initials: "AC", role: "Propriétaire" },
    { id: 2, name: "Marketing Staff", initials: "MS", role: "Propriétaire" },
    { id: 3, name: "Engineering Team", initials: "ET", role: "Propriétaire" },
    { id: 4, name: "Sales Department", initials: "SD", role: "Propriétaire" },
    { id: 5, name: "Customer Success", initials: "CS", role: "Propriétaire" },
    { id: 6, name: "Finance Dept", initials: "FD", role: "Propriétaire" },
  ];

  // On simule une liste vide pour "Rejointes" afin de tester la disposition intelligente
  const joinedOrganizations: any[] = [];

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between pb-4 border-b border-border/40">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Bonjour, {userName}
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          variant="featured"
          title="Mes Organisations"
          value="1"
          subtitle="Gérées par vous"
          icon={FaBuilding}
        />
        <StatCard
          variant="featured"
          title="Organisations Rejointes"
          value="2"
          subtitle="En tant que membre"
          icon={FaUsers}
        />
      </div>

      {/* Organizations Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
        {/* Mes organisations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground tracking-tight">Vos organisations</h2>
            <Button
              onClick={() => router.push("/core/dashboard/organizations/create")}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs font-semibold hover:text-primary hover:bg-primary/10 transition-colors"
            >
              + Créer
            </Button>
          </div>

          <Card className="border shadow-sm overflow-hidden bg-card">
            {ownedOrganizations.length > 0 ? (
              <div className="divide-y divide-border/50">
                {ownedOrganizations.slice(0, 5).map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors group cursor-pointer"
                    onClick={() => router.push("/core/dashboard/organizations")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-md bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
                        <span className="text-primary font-bold text-xs tracking-wide">{org.initials}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{org.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{org.role}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/core/dashboard/organizations");
                      }}
                    >
                      Gérer
                    </Button>
                  </div>
                ))}
                
                {ownedOrganizations.length > 5 && (
                  <div 
                    className="p-3 flex justify-center bg-muted/5 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => router.push("/core/dashboard/organizations")}
                  >
                    <span className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                      Afficher tout ({ownedOrganizations.length}) &rarr;
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="h-10 w-10 shrink-0 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                  <FaBuilding className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <h3 className="text-sm font-medium text-foreground">Aucune organisation</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-4 flex max-w-[200px] leading-relaxed">
                  Vous n'avez pas encore d'espace de travail.
                </p>
                <Button
                  onClick={() => router.push("/core/dashboard/organizations/create")}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-medium"
                >
                  <span className="text-primary mr-1">+</span> Créer
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Organisations rejointes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground tracking-tight">Organisations rejointes</h2>
            <Button
              onClick={() => router.push("/core/dashboard/organizations")}
              variant="link"
              size="sm"
              className="h-7 px-0 text-xs font-medium text-muted-foreground hover:text-primary"
            >
              Voir tout &rarr;
            </Button>
          </div>

          <Card className="border shadow-sm overflow-hidden bg-card">
            {joinedOrganizations.length > 0 ? (
              <div className="divide-y divide-border/50">
                {joinedOrganizations.slice(0, 5).map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between p-3.5 hover:bg-muted/40 transition-colors group cursor-pointer"
                    onClick={() => router.push("/core/dashboard/organizations")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 shrink-0 rounded-md bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
                        <span className="text-primary font-bold text-xs tracking-wide">{org.initials}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{org.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{org.role}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/core/dashboard/organizations");
                      }}
                    >
                      Accéder
                    </Button>
                  </div>
                ))}
                
                {joinedOrganizations.length > 5 && (
                  <div 
                    className="p-3 flex justify-center bg-muted/5 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => router.push("/core/dashboard/organizations")}
                  >
                    <span className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                      Afficher tout ({joinedOrganizations.length}) &rarr;
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="h-10 w-10 shrink-0 rounded-full bg-muted/60 flex items-center justify-center mb-3">
                  <FaUsers className="h-4 w-4 text-muted-foreground/60" />
                </div>
                <h3 className="text-sm font-medium text-foreground">Aucune invitation</h3>
                <p className="text-xs text-muted-foreground mt-1 flex max-w-[200px] leading-relaxed">
                  Vos invitations apparaîtront ici.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}