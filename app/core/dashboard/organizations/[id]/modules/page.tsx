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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
 * Tout module installé et activé est désormais verrouillé : une fois en
 * production sur une organisation, il ne peut plus être désactivé pour
 * préserver la cohérence des données métier engagées (références FK,
 * historique, configurations, droits attribués…).
 *
 * Conséquence : seule l'activation initiale est révocable — pas la
 * désactivation. Cela évite aussi les bascules accidentelles qui masquent
 * les données existantes aux utilisateurs.
 */
function isInstallationLocked(installation: OrganizationModule): boolean {
    return installation.is_enabled;
}

/**
 * Normalise une chaîne pour comparaison « tolérante » :
 * - retire les accents (NFD + suppression des marques diacritiques)
 * - met en minuscules
 * - trim
 *
 * Permet à l'utilisateur de saisir « stocks », « STOCKS », « Stocks » ou
 * même « SERVICES » sans buter sur la casse ou un accent oublié.
 */
function normalizeForCompare(value: string): string {
    return value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
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

    // Module dont l'activation est en attente de confirmation explicite
    // (saisie du nom). null = pas de dialog ouvert.
    const [pendingInstall, setPendingInstall] = useState<Module | null>(null);
    const [confirmText, setConfirmText] = useState("");

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

    /**
     * Étape 1 : ouvrir le dialog de confirmation. L'utilisateur devra saisir
     * le nom exact du module pour valider — geste volontaire qui rappelle
     * que l'activation est définitive et consomme un crédit du forfait.
     */
    const requestInstall = (m: Module) => {
        setConfirmText("");
        setPendingInstall(m);
    };

    /**
     * Étape 2 : déclenchée depuis le dialog une fois la saisie validée.
     */
    const confirmInstall = async () => {
        if (!pendingInstall) return;
        try {
            await installMutation.mutateAsync(pendingInstall.code as ModuleCode);
            toast.success(`${pendingInstall.name} activé.`);
            setPendingInstall(null);
            setConfirmText("");
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Activation impossible.";
            toast.error(message);
        }
    };

    // Saisie correcte (insensible à la casse et aux accents).
    const isConfirmValid =
        pendingInstall !== null &&
        normalizeForCompare(confirmText) ===
            normalizeForCompare(pendingInstall.name);

    /**
     * Désormais la seule transition autorisée est la **réactivation** d'un
     * module historiquement désactivé (cas legacy). Tout module actif est
     * verrouillé : la désactivation n'est plus exposée dans l'UI.
     */
    const handleReactivate = async (installation: OrganizationModule) => {
        if (installation.is_enabled) return;
        try {
            await toggleMutation.mutateAsync({
                installationId: installation.id,
                isEnabled: true,
            });
            toast.success("Module réactivé.");
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
                                Activez les domaines métier disponibles pour cette
                                organisation. Une fois activé, un module est verrouillé
                                pour protéger les données déjà engagées. Les modules
                                sont limités par votre forfait.
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

                            // Tout module installé et activé est verrouillé : la
                            // désactivation n'est plus exposée dans l'UI.
                            const isLocked =
                                installation !== undefined &&
                                isInstallationLocked(installation);

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
                                                            Module installé
                                                        </p>
                                                        <p className="text-xs">
                                                            Une fois activé, un module ne peut plus
                                                            être désactivé : cela préserve la
                                                            cohérence des données métier (historique,
                                                            transactions, droits attribués…). Vous
                                                            pouvez en revanche restreindre son accès
                                                            via les rôles et permissions.
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
                                                    onClick={() => requestInstall(m)}
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
                                                    Une fois activé, un module ne peut plus être
                                                    désactivé. Cela protège l&apos;historique et les
                                                    données déjà engagées.
                                                </TooltipContent>
                                            </Tooltip>
                                        ) : (
                                            // Cas legacy : module installé puis désactivé avant
                                            // l'introduction du verrouillage. On autorise une
                                            // réactivation simple, sans confirmation.
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => handleReactivate(installation!)}
                                                disabled={toggleMutation.isPending}
                                            >
                                                {toggleMutation.isPending &&
                                                toggleMutation.variables?.installationId ===
                                                    installation!.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                                ) : (
                                                    <Power className="h-3.5 w-3.5 mr-1.5" />
                                                )}
                                                Réactiver
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

            {/* ── Dialog : confirmation d'activation par saisie du nom ───── */}
            <Dialog
                open={!!pendingInstall}
                onOpenChange={(open) => {
                    if (installMutation.isPending) return;
                    if (!open) {
                        setPendingInstall(null);
                        setConfirmText("");
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex items-start gap-3">
                            <div className="h-9 w-9 shrink-0 rounded-full bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-0">
                                <DialogTitle>
                                    Activer{" "}
                                    <span className="font-semibold">
                                        {pendingInstall?.name}
                                    </span>{" "}
                                    ?
                                </DialogTitle>
                                <DialogDescription>
                                    Cette action est{" "}
                                    <span className="font-medium text-foreground">
                                        définitive
                                    </span>
                                    . Veuillez lire les conséquences avant de confirmer.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-3">
                        {/* Conséquences */}
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2.5">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold mt-0.5">
                                    1
                                </span>
                                <span className="flex-1 leading-snug">
                                    Une fois activé,{" "}
                                    <span className="font-medium text-foreground">
                                        ce module ne pourra plus être désactivé
                                    </span>{" "}
                                    sur cette organisation. Cela protège
                                    l&apos;historique et les données métier déjà
                                    engagées.
                                </span>
                            </li>
                            <li className="flex items-start gap-2.5">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold mt-0.5">
                                    2
                                </span>
                                <span className="flex-1 leading-snug">
                                    L&apos;activation{" "}
                                    <span className="font-medium text-foreground">
                                        consomme un crédit module
                                    </span>{" "}
                                    de votre forfait{" "}
                                    {plan && (
                                        <span className="font-medium text-foreground">
                                            {plan.name}
                                        </span>
                                    )}{" "}
                                    {maxModules !== null && (
                                        <span className="text-muted-foreground">
                                            ({installedCount}/{maxModules}
                                            {" → "}
                                            {installedCount + 1}/{maxModules} après
                                            activation)
                                        </span>
                                    )}
                                    .
                                </span>
                            </li>
                        </ul>

                        {/* Saisie de confirmation */}
                        <div className="space-y-1.5 pt-1">
                            <Label
                                htmlFor="confirm-module-name"
                                className="text-xs font-medium text-foreground"
                            >
                                Pour confirmer, saisissez{" "}
                                <span className="font-mono px-1 py-0.5 rounded bg-muted text-foreground">
                                    {pendingInstall?.name}
                                </span>
                            </Label>
                            <Input
                                id="confirm-module-name"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder={pendingInstall?.name ?? ""}
                                autoComplete="off"
                                autoFocus
                                disabled={installMutation.isPending}
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "Enter" &&
                                        isConfirmValid &&
                                        !installMutation.isPending
                                    ) {
                                        e.preventDefault();
                                        void confirmInstall();
                                    }
                                }}
                                className={cn(
                                    "h-10 transition-colors",
                                    isConfirmValid &&
                                        "border-emerald-500 focus-visible:ring-emerald-500/30",
                                )}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                {isConfirmValid
                                    ? "✓ Saisie validée — vous pouvez activer."
                                    : "La casse et les accents sont ignorés."}
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setPendingInstall(null);
                                setConfirmText("");
                            }}
                            disabled={installMutation.isPending}
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={() => void confirmInstall()}
                            disabled={installMutation.isPending || !isConfirmValid}
                            className="bg-amber-600 hover:bg-amber-700 text-white disabled:bg-amber-600/50"
                        >
                            {installMutation.isPending ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                                    Activation…
                                </>
                            ) : (
                                <>
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Activer définitivement
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
