"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useInstallOrganizationModule,
  useModulesCatalog,
  useOrganization,
  useOrganizationModules,
  useToggleOrganizationModule,
} from "@/lib/hooks/core";
import type { ModuleCode } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import {
  Blocks,
  Briefcase,
  Loader2,
  Package,
  Plus,
  Power,
  PowerOff,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

const MODULE_ICONS: Record<string, LucideIcon> = {
  hr: Users,
  inventory: Package,
  services: Briefcase,
};

export default function OrganizationSettingsPage() {
  const params = useParams();
  const orgId = params.id as string;

  const { data: org } = useOrganization(orgId);
  const { data: catalog = [], isLoading: catalogLoading } = useModulesCatalog();
  const { data: installed = [], isLoading: installedLoading } =
    useOrganizationModules(orgId);

  const installMutation = useInstallOrganizationModule(orgId);
  const toggleMutation = useToggleOrganizationModule(orgId);

  // Index des installations par code module pour résoudre rapidement état + id.
  const installationsByCode = new Map(
    installed.map((i) => [i.module.code, i] as const),
  );

  const handleInstall = async (code: ModuleCode) => {
    try {
      await installMutation.mutateAsync(code);
      toast.success("Module installé.");
    } catch {
      toast.error("Installation impossible.");
    }
  };

  const handleToggle = async (installationId: string, isEnabled: boolean) => {
    try {
      await toggleMutation.mutateAsync({ installationId, isEnabled });
      toast.success(isEnabled ? "Module activé." : "Module désactivé.");
    } catch {
      toast.error("Mise à jour impossible.");
    }
  };

  const isLoading = catalogLoading || installedLoading;

  return (
    <div className="container max-w-3xl py-8 px-4 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Paramètres de l'organisation
        </h1>
        <p className="text-sm text-muted-foreground">
          {org?.name ?? "—"}
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Blocks className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Modules</CardTitle>
              <CardDescription>
                Activez ou désactivez les domaines métier disponibles sur cette
                organisation.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : catalog.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Aucun module disponible.
            </p>
          ) : (
            catalog.map((m) => {
              const Icon = MODULE_ICONS[m.code] ?? Blocks;
              const installation = installationsByCode.get(m.code);
              const isInstalled = !!installation;
              const isEnabled = installation?.is_enabled === true;

              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                    isInstalled && isEnabled
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/60 bg-background",
                  )}
                >
                  <div
                    className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                      isInstalled && isEnabled
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {m.name}
                      </span>
                      {isInstalled && (
                        <span
                          className={cn(
                            "text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 font-medium",
                            isEnabled
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {isEnabled ? "Activé" : "Désactivé"}
                        </span>
                      )}
                    </div>
                    {m.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {m.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {!isInstalled ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInstall(m.code)}
                        disabled={installMutation.isPending}
                      >
                        {installMutation.isPending &&
                        installMutation.variables === m.code ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Installer
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={isEnabled ? "outline" : "default"}
                        onClick={() =>
                          handleToggle(installation!.id, !isEnabled)
                        }
                        disabled={toggleMutation.isPending}
                      >
                        {toggleMutation.isPending &&
                        toggleMutation.variables?.installationId ===
                          installation!.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : isEnabled ? (
                          <PowerOff className="h-3.5 w-3.5 mr-1.5" />
                        ) : (
                          <Power className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {isEnabled ? "Désactiver" : "Réactiver"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
