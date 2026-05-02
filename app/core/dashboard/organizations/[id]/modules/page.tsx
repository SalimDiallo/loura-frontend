"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    useInstallOrganizationModule,
    useModulesCatalog,
    useMySubscription,
    useOrganization,
    useOrganizationModules,
    useOrganizations,
    useToggleOrganizationModule,
} from "@/lib/hooks/core";
import type { Module, ModuleCode, OrganizationModule } from "@/lib/types/core";
import { cn } from "@/lib/utils";
import {
    AlertTriangle,
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
    ShieldCheck,
    Sparkles,
    Users,
    Zap,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
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

/**
 * Fenêtre (en millisecondes) après la création d'une organisation pendant
 * laquelle un module installé est considéré comme « choisi à la création »
 * et donc non désactivable.
 *
 * 2 minutes : large pour absorber les latences (upload de logo, redirections,
 * etc.) sans risquer un faux positif sur un module ajouté manuellement plus
 * tard depuis cette même page.
 */
const CREATION_LOCK_WINDOW_MS = 2 * 60 * 1000;

/**
 * Un module installé est verrouillé si son `installed_at` tombe dans la
 * fenêtre suivant `org.created_at`. L'utilisateur a délibérément choisi ces
 * modules au moment de créer l'organisation : on l'empêche de revenir
 * dessus pour préserver la cohérence des données métier déjà engagées.
 */
function isInstallationLocked(
    installation: OrganizationModule,
    orgCreatedAt: string | undefined,
): boolean {
    if (!orgCreatedAt) return false;
    const orgTs = new Date(orgCreatedAt).getTime();
    const installTs = new Date(installation.installed_at).getTime();
    if (!Number.isFinite(orgTs) || !Number.isFinite(installTs)) return false;
    return installTs - orgTs <= CREATION_LOCK_WINDOW_MS;
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

    // Cible de la confirmation de désactivation. Stocke l'installation
    // visée + son module pour pouvoir afficher le contexte dans le dialog.
    const [pendingDisable, setPendingDisable] = useState<{
        installation: OrganizationModule;
        module: Module;
    } | null>(null);

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

    const performToggle = async (installationId: string, isEnabled: boolean) => {
        try {
            await toggleMutation.mutateAsync({ installationId, isEnabled });
            toast.success(isEnabled ? "Module activé." : "Module désactivé.");
        } catch {
            toast.error("Mise à jour impossible.");
        }
    };

    /**
     * Réactivation : pas de confirmation nécessaire (action sans risque).
     * Désactivation : on bloque si le module est verrouillé, sinon on ouvre
     * le dialog de confirmation pour avertir des conséquences.
     */
    const handleToggleClick = (installation: OrganizationModule) => {
        const isEnabled = installation.is_enabled;
        if (!isEnabled) {
            void performToggle(installation.id, true);
            return;
        }
        if (isInstallationLocked(installation, org?.created_at)) {
            toast.error(
                "Ce module a été activé à la création de l'organisation et ne peut plus être désactivé.",
            );
            return;
        }
        setPendingDisable({ installation, module: installation.module });
    };

    const confirmDisable = async () => {
        if (!pendingDisable) return;
        await performToggle(pendingDisable.installation.id, false);
        setPendingDisable(null);
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
                        <TooltipProvider delayDuration={250}>
                        {catalog.map((m: Module) => {
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

                            // Module installé à la création → non désactivable.
                            const isLocked =
                                installation !== undefined &&
                                installation.is_enabled &&
                                isInstallationLocked(installation, org?.created_at);

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
                                            {isLocked && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Badge
                                                            variant="outline"
                                                            className="text-[10px] uppercase tracking-wide font-medium border-emerald-300 text-emerald-700 bg-emerald-50 cursor-help"
                                                        >
                                                            <ShieldCheck className="h-2.5 w-2.5 mr-1" />
                                                            Verrouillé
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="max-w-xs">
                                                        <p className="font-semibold mb-1">
                                                            Module choisi à la création
                                                        </p>
                                                        <p className="text-xs">
                                                            Ce module a été activé au moment de la
                                                            création de l&apos;organisation. Il ne peut
                                                            plus être désactivé pour préserver la
                                                            cohérence des données métier déjà
                                                            engagées.
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
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
                                        ) : isLocked ? (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled
                                                            className="cursor-not-allowed"
                                                        >
                                                            <Lock className="h-3.5 w-3.5 mr-1.5" />
                                                            Verrouillé
                                                        </Button>
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent side="left" className="max-w-xs">
                                                    Module choisi à la création de l&apos;organisation —
                                                    désactivation impossible.
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant={isEnabled ? "outline" : "default"}
                                                onClick={() => handleToggleClick(installation!)}
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
                        })}
                        </TooltipProvider>
                    )}
                </CardContent>
            </Card>

            {/* ── Dialog de confirmation : désactivation d'un module ─────── */}
            <AlertDialog
                open={!!pendingDisable}
                onOpenChange={(open) => {
                    if (!open && !toggleMutation.isPending) setPendingDisable(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="h-9 w-9 shrink-0 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
                            </div>
                            <div className="space-y-1.5 flex-1">
                                <AlertDialogTitle>
                                    Désactiver{" "}
                                    <span className="font-semibold">
                                        {pendingDisable?.module.name}
                                    </span>{" "}
                                    ?
                                </AlertDialogTitle>
                                <AlertDialogDescription asChild>
                                    <div className="space-y-2">
                                        <p>
                                            Les utilisateurs n&apos;auront plus accès à ce
                                            module sur cette organisation. Les données
                                            métier (historique, transactions, configurations)
                                            sont conservées et redeviendront accessibles
                                            si vous réactivez le module plus tard.
                                        </p>
                                        <p className="text-xs">
                                            Cette action est{" "}
                                            <span className="font-medium text-foreground">
                                                réversible
                                            </span>{" "}
                                            — vous pourrez réactiver le module à tout moment.
                                        </p>
                                    </div>
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={toggleMutation.isPending}>
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                void confirmDisable();
                            }}
                            disabled={toggleMutation.isPending}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {toggleMutation.isPending ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    Désactivation…
                                </>
                            ) : (
                                <>
                                    <PowerOff className="h-3.5 w-3.5 mr-1.5" />
                                    Désactiver
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
