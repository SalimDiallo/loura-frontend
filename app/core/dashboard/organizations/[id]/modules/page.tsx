"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    useInstallOrganizationModule,
    useModulesCatalog,
    useMySubscription,
    useOrganization,
    useOrganizationModules,
    useOrganizations,
    useToggleOrganizationModule,
} from "@/lib/hooks/core";
import type { Module, ModuleCode } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import {
    ArrowLeft,
    Blocks,
    Briefcase,
    Crown,
    Loader2,
    Lock,
    Package,
    Plus,
    Power,
    PowerOff,
    Sparkles,
    Users,
    Zap,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";

const MODULE_ICONS: Record<string, LucideIcon> = {
    hr: Users,
    inventory: Package,
    services: Briefcase,
};

const PLAN_ICONS: Record<string, LucideIcon> = {
    free: Sparkles,
    basic: Zap,
    pro: Crown,
    enterprise: Crown,
};

// ─── Helpers plan ───────────────────────────────────────────────────────────

function isModuleAllowedByPlan(
    moduleCode: string,
    allowedCodes: string[] | null | undefined,
): boolean {
    // Liste blanche vide = tous les modules autorisés
    if (!allowedCodes || allowedCodes.length === 0) return true;
    return allowedCodes.includes(moduleCode);
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function OrganizationSettingsPage() {
    const params = useParams();
    const orgId = params.id as string;

    const { data: org } = useOrganization(orgId);
    const { data: subscription } = useMySubscription();
    const { data: catalog = [], isLoading: catalogLoading } = useModulesCatalog();
    const { data: installed = [], isLoading: installedLoading } =
        useOrganizationModules(orgId);
    const orgsListPaged = useOrganizations();

    const installMutation = useInstallOrganizationModule(orgId);
    const toggleMutation = useToggleOrganizationModule(orgId);

    const installationsByCode = new Map(
        installed.map((i) => [i.module.code, i] as const),
    );

    const plan = subscription?.plan;
    const allowedCodes = plan?.allowed_module_codes ?? [];
    const maxModules = plan?.max_modules_per_org ?? null;
    const installedCount = installed.length;
    const PlanIcon = plan ? PLAN_ICONS[plan.code] ?? Sparkles : Sparkles;

    // Compte d'organisations (pour afficher l'usage côté global) :
    // ``meta.totalItems`` reflète le nombre total au-delà de la pagination.
    const orgCount = orgsListPaged.meta?.totalItems ?? orgsListPaged.data?.length ?? 0;
    const maxOrgs = plan?.max_organizations ?? null;

    const handleInstall = async (code: ModuleCode) => {
        try {
            await installMutation.mutateAsync(code);
            toast.success("Module activé.");
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Activation impossible.";
            toast.error(message);
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
        <div className="mx-auto max-w-4xl py-8 px-4 space-y-6">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
                <Link href="/core/dashboard/organizations">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Mes organisations
                </Link>
            </Button>

            <header className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Modules & forfait
                </h1>
                <p className="text-sm text-muted-foreground">
                    {org?.name ?? "—"} — gérez les modules activés sur cette organisation.
                </p>
            </header>

            {/* ── Bandeau plan + usage ─────────────────────────────────── */}
            {plan && (
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <PlanIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-primary/60">
                                        Forfait {plan.name}
                                    </p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Modules :{" "}
                                    <strong className="text-foreground">
                                        {installedCount}
                                        {maxModules !== null ? `/${maxModules}` : ""}
                                    </strong>
                                    {" · "}
                                    Organisations :{" "}
                                    <strong className="text-foreground">
                                        {orgCount}
                                        {maxOrgs !== null ? `/${maxOrgs}` : ""}
                                    </strong>
                                </p>
                            </div>
                        </div>
                        {plan.code !== "enterprise" && (
                            <Button asChild size="sm" variant="outline">
                                <Link href="/core/billing">
                                    <Crown className="h-3.5 w-3.5 mr-1.5" />
                                    Upgrade
                                </Link>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Blocks className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Modules</CardTitle>
                            <CardDescription>
                                Activez ou désactivez les domaines métier disponibles
                                sur cette organisation. Les modules sont limités par
                                votre forfait.
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
                        catalog.map((m: Module) => {
                            const Icon = MODULE_ICONS[m.code] ?? Blocks;
                            const installation = installationsByCode.get(m.code);
                            const isInstalled = !!installation;
                            const isEnabled = installation?.is_enabled === true;

                            // Vérifications de plan : module dans la whitelist + quota
                            const moduleAllowed = isModuleAllowedByPlan(
                                m.code,
                                allowedCodes,
                            );
                            const quotaReached =
                                maxModules !== null &&
                                installedCount >= maxModules &&
                                !isInstalled;
                            const isBlockedByPlan = !isInstalled && (!moduleAllowed || quotaReached);

                            return (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                                        isInstalled && isEnabled
                                            ? "border-primary/40 bg-primary/5"
                                            : isBlockedByPlan
                                              ? "border-border/60 bg-muted/30 opacity-75"
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
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-sm font-medium text-foreground">
                                                {m.name}
                                            </span>
                                            {isInstalled && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-[10px] uppercase tracking-wide font-medium",
                                                        isEnabled
                                                            ? "bg-primary/15 text-primary border-primary/30"
                                                            : "bg-muted text-muted-foreground",
                                                    )}
                                                >
                                                    {isEnabled ? "Activé" : "Désactivé"}
                                                </Badge>
                                            )}
                                            {isBlockedByPlan && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-[10px] uppercase tracking-wide font-medium border-amber-300 text-amber-700"
                                                >
                                                    <Lock className="h-2.5 w-2.5 mr-1" />
                                                    {!moduleAllowed
                                                        ? `Réservé aux forfaits supérieurs`
                                                        : `Quota ${maxModules} atteint`}
                                                </Badge>
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
                                            isBlockedByPlan ? (
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href="/core/billing">
                                                        <Crown className="h-3.5 w-3.5 mr-1.5" />
                                                        Upgrade
                                                    </Link>
                                                </Button>
                                            ) : (
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
                                                    Activer
                                                </Button>
                                            )
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
