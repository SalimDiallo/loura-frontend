"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Plus, Settings, Users, MoreHorizontal, Pencil, Power, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function OrganizationsPage() {
  const router = useRouter();

  // Données factices pour illustrer l'interface (à remplacer par des hooks API réels)
  const organizations = [
    {
      id: 1,
      name: "Acme Corp",
      initials: "AC",
      role: "Propriétaire",
      members: 12,
      plan: "Pro",
      status: "active",
    },
    {
      id: 2,
      name: "Tech Innovators",
      initials: "TI",
      role: "Membre",
      members: 5,
      plan: "Starter",
      status: "active",
    },
    {
      id: 3,
      name: "Design Studio",
      initials: "DS",
      role: "Invité",
      members: 3,
      plan: "Enterprise",
      status: "inactive",
    }
  ];

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b border-border/40 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Organisations
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos espaces de travail, accédez aux paramètres de votre équipe et surveillez vos abonnements.
          </p>
        </div>
        <Button 
          onClick={() => router.push("/core/dashboard/organizations/create")}
          className="shadow-sm transition-all text-sm font-medium"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle organisation
        </Button>
      </div>

      {/* Main List */}
      <Card className="border shadow-sm overflow-hidden bg-card">
        <div className="divide-y divide-border/50">
          {organizations.map((org) => (
            <div key={org.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 hover:bg-primary/5 transition-colors group">
              
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 shrink-0 rounded-full bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
                  <span className="text-primary font-semibold text-sm tracking-wide">{org.initials}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                    {org.name}
                    {org.status === 'active' ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] uppercase font-bold tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Actif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                        Inactif
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-secondary/50 text-secondary-foreground px-2 py-0.5 rounded-sm">
                      {org.plan}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground/80">{org.role}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <div className="flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                      {org.members} membre{org.members > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0 justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 px-4 bg-transparent group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 hidden sm:flex"
                >
                  <UserPlus className="h-4 w-4 mr-2 opacity-70 group-hover:opacity-100" />
                  Équipe
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[220px]">
                    <DropdownMenuItem className="cursor-pointer">
                      <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                      Modifier les infos & logo
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer sm:hidden">
                       <UserPlus className="mr-2 h-4 w-4 text-muted-foreground" />
                       Gérer l'équipe
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                      Paramètres avancés
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                      <Power className="mr-2 h-4 w-4" />
                      Désactiver l'organisation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

            </div>
          ))}
          
          {organizations.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Aucune organisation trouvée</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Vous ne faites actuellement partie d'aucune organisation. Créez-en une pour commencer à collaborer.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
