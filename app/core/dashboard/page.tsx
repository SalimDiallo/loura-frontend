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
    FaChartBar,
    FaCog,
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-5 border bg-muted/10">
              <div className="space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-14" />
                <Skeleton className="h-3 w-28" />
              </div>
            </Card>
          ))}
        </div>
        {/* Actions Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-4 border bg-muted/10">
              <div className="space-y-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const userName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.email || "Utilisateur";

  return (
    <div className="px-4 py-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-medium text-foreground">
          Bienvenue, {userName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Aperçu de l'activité et des organisations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          variant="featured"
          title="Organisations"
          value="12"
          subtitle="3 actives"
          icon={FaBuilding}
          iconColor="#B6B2A8"
          iconBgColor="transparent"
        />
        <StatCard
          variant="featured"
          title="Utilisateurs"
          value="248"
          subtitle="45 actifs aujourd'hui"
          icon={FaUsers}
          iconColor="#B6B2A8"
          iconBgColor="transparent"
        />
        <StatCard
          variant="featured"
          title="Activité"
          value="1.2K"
          subtitle="Actions ce mois"
          icon={FaChartBar}
          iconColor="#B6B2A8"
          iconBgColor="transparent"
        />
        <StatCard
          variant="featured"
          title="Paramètres"
          value="3"
          subtitle="Configurations"
          icon={FaCog}
          iconColor="#B6B2A8"
          iconBgColor="transparent"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border bg-card transition-none hover:shadow-lg hover:border-primary/60 transition-shadow duration-200">
          <div className="p-4 items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="font-semibold text-base text-foreground tracking-tight">Créer une organisation</div>
              <div className="text-xs text-muted-foreground leading-snug">
                Ajoutez une nouvelle organisation à gérer depuis votre tableau de bord.
              </div>
              <Button
                onClick={() => router.push("/core/dashboard/organizations/create")}
                size="sm"
                className="mt-2 px-4 py-1 text-sm font-mediuml shadow-sm hover:bg-primary/80 transition-colors duration-150 dark:text-foreground"
              >
                Créer maintenant
              </Button>
            </div>
          </div>
        </Card>
   

        <Card className="border bg-card transition-shadow hover:shadow-lg hover:border-primary/60 duration-200">
          <div className="p-4 flex flex-col gap-2">
            <div className="font-semibold text-base text-foreground tracking-tight">Gérer les organisations</div>
            <div className="text-xs text-muted-foreground leading-snug">
              Consultez, modifiez ou administrez vos organisations existantes depuis un seul endroit.
            </div>
            <Button
              onClick={() => router.push("/core/dashboard/organizations")}
              className="mt-3 w-full px-4 py-1 text-sm font-medium shadow-sm hover:bg-primary/10 hover:text-primary transition-colors duration-150"
              variant="outline"
              size="sm"
            >
              Gérer toutes les organisations
            </Button>
          </div>
        </Card>
        
   
      </div>
    </div>
  );
}