"use client";

import { Button } from "@/components/ui/button";
import { useOrganization } from "@/lib/hooks/core";
import { ArrowLeft, Crown, Loader2, Lock, Mail, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/**
 * Bloque l'accès aux pages d'une organisation lorsque celle-ci est marquée
 * comme **inactive** (suspendue ou désactivée par son propriétaire / par
 * dépassement de forfait).
 *
 * Comportement :
 *   - Pendant le chargement : on rend les enfants pour ne pas casser
 *     le layout (sidebar/header) et éviter un flash. Le hook DRF est mis
 *     en cache, donc l'attente est généralement < 50 ms.
 *   - Si l'API renvoie une org `is_active === false` : on remplace le
 *     contenu par un écran d'erreur clair + bouton retour.
 *   - Sur erreur du hook : on laisse les enfants gérer (chaque page a déjà
 *     son propre fallback d'erreur).
 *
 * Le guard est volontairement placé **dans** le `SidebarInset` du layout,
 * pour que le bandeau d'erreur conserve la sidebar et le header — l'utilisateur
 * comprend où il est et peut naviguer ailleurs.
 */
export function OrganizationActiveGuard({ children }: { children: ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const orgId = params.id as string;
    const { data: org, isLoading, isError } = useOrganization(orgId);

    // Délai minimal — si jamais l'utilisateur arrive directement sur l'URL
    // alors que la fenêtre est inactive, on prefetch pour rendre la transition
    // fluide quand il rentrera.
    useEffect(() => {
        if (org?.is_active === false) {
            // L'utilisateur est sur une page interdite — on log côté front
            // pour le monitoring (pas critique).
            // eslint-disable-next-line no-console
            console.info(
                `[OrgGuard] Tentative d'accès à une organisation inactive: ${orgId}`,
            );
        }
    }, [org, orgId]);

    if (isLoading) {
        // Pas de fullscreen : juste un spinner discret, le layout se charge à côté.
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // En cas d'erreur réseau on laisse les enfants gérer leur propre état :
    // le layout reste utilisable même si l'API du détail échoue.
    if (isError || !org) {
        return <>{children}</>;
    }

    if (!org.is_active) {
        return <InactiveOrganizationScreen orgName={org.name} onBack={() => router.push("/core/dashboard/organizations")} />;
    }

    return <>{children}</>;
}

function InactiveOrganizationScreen({
    orgName,
    onBack,
}: {
    orgName: string;
    onBack: () => void;
}) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] px-4 py-12">
            <div className="w-full max-w-md text-center space-y-6">
                {/* Icône en avant */}
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="h-20 w-20 rounded-2xl bg-amber-500/10 flex items-center justify-center ring-1 ring-amber-500/20">
                            <Lock className="h-9 w-9 text-amber-600" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-background flex items-center justify-center ring-2 ring-amber-500/30">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                        </div>
                    </div>
                </div>

                {/* Message principal */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Organisation inactive
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        L&apos;accès à{" "}
                        <span className="font-semibold text-foreground">{orgName}</span>{" "}
                        est actuellement suspendu. Vous ne pouvez pas consulter ses
                        données ni effectuer d&apos;actions tant qu&apos;elle reste désactivée.
                    </p>
                </div>

                {/* Causes possibles */}
                <div className="text-left space-y-2.5 px-1">
                    <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                        Raisons possibles
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2.5">
                            <Crown className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                            <span>
                                Votre forfait ne couvre plus le nombre
                                d&apos;organisations actives.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                            <span>
                                Le propriétaire de l&apos;organisation l&apos;a
                                volontairement désactivée.
                            </span>
                        </li>
                        <li className="flex items-start gap-2.5">
                            <Mail className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                            <span>
                                Un problème de paiement empêche la réactivation
                                automatique.
                            </span>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2 pt-2">
                    <Button onClick={onBack} className="h-10">
                        <ArrowLeft className="h-4 w-4 mr-1.5" />
                        Retour à mes organisations
                    </Button>
                    <Button asChild variant="outline" className="h-10">
                        <Link href="/core/billing">
                            <Crown className="h-4 w-4 mr-1.5" />
                            Voir mon forfait
                        </Link>
                    </Button>
                </div>

                <p className="text-[11px] text-muted-foreground/70 pt-2">
                    Besoin d&apos;aide ? Contactez le propriétaire de l&apos;organisation
                    ou notre support.
                </p>
            </div>
        </div>
    );
}
