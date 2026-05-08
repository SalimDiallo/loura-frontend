"use client";

/**
 * Page de retour Djomy après paiement.
 *
 * Djomy redirige le payeur ici (via le bridge HTTPS en dev) avec
 * ``?ref=<merchantPaymentReference>``. On poll ``GET /transactions/<ref>/status/``
 * jusqu'à ce que la transaction atteigne un statut terminal puis on
 * affiche le résultat ; le webhook Djomy peut être en retard de
 * plusieurs secondes en sandbox, c'est normal de patienter.
 */

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { billingQueryKeys, useTransactionStatus } from "@/lib/hooks/core";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";

const SUCCESS_STATUSES = new Set(["SUCCESS", "CAPTURED"]);
const FAILURE_STATUSES = new Set(["FAILED", "CANCELLED", "TIMEOUT", "REFUNDED"]);
// Au-delà de 60 s, on arrête le polling et on demande au user de
// rafraîchir la page billing — le webhook finira par arriver et la
// query React Query la mettra à jour.
const POLL_TIMEOUT_MS = 60_000;

function PaymentReturnClient() {
    const router = useRouter();
    const params = useSearchParams();
    const queryClient = useQueryClient();
    const reference = useMemo(
        () =>
            // Priorité au nom natif Djomy si jamais le retour bypass le
            // bridge backend ; sinon ``ref`` normalisé par le bridge.
            // ``transactionId`` couvre le cas où Djomy ajoute lui-même
            // l'UUID transactionId à l'URL de retour.
            params.get("merchantPaymentReference") ||
            params.get("transactionId") ||
            params.get("ref") ||
            params.get("reference") ||
            null,
        [params]
    );

    const { data: tx, isLoading, error } = useTransactionStatus(reference);

    const isSuccess = tx ? SUCCESS_STATUSES.has(tx.status) : false;
    const isFailure = tx ? FAILURE_STATUSES.has(tx.status) : false;
    const isTerminal = isSuccess || isFailure;
    // 404 → transaction non reconnue côté Loura (référence ancienne,
    // mauvais user, paiement initié sur un autre environnement…). On
    // évite de boucler "Difficulté de connexion" indéfiniment.
    const isNotFound =
        (error as { status?: number } | undefined)?.status === 404;

    // Sur 404, le webhook Djomy a peut-être déjà appliqué l'effet sur
    // l'abonnement (succès ou échec) avant qu'on accède à la tx. On
    // invalide la query subscription pour forcer un refetch et redirige
    // après 4s vers /core/billing où l'utilisateur verra l'état réel.
    useEffect(() => {
        if (!isNotFound) return;
        queryClient.invalidateQueries({
            queryKey: billingQueryKeys.mySubscription,
        });
        const timer = setTimeout(() => {
            router.replace("/core/billing");
        }, 4000);
        return () => clearTimeout(timer);
    }, [isNotFound, queryClient, router]);

    // Cap sur la durée de polling : on coupe au bout de POLL_TIMEOUT_MS pour
    // ne pas bloquer le user indéfiniment si le webhook tarde anormalement.
    useEffect(() => {
        if (!reference || isTerminal) return;
        const timer = setTimeout(() => {
            router.replace("/core/billing");
        }, POLL_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [reference, isTerminal, router]);

    // Sans référence, rien à poller — on renvoie sur le dashboard.
    if (!reference) {
        return (
            <div className="container mx-auto p-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle>Référence de paiement manquante</CardTitle>
                        <CardDescription>
                            Impossible d'identifier votre transaction. Si le paiement
                            a été débité, il sera traité automatiquement.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/core/billing">
                                Retour à la facturation
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="container mx-auto p-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                        </div>
                        <CardTitle className="text-2xl">
                            Félicitations, votre abonnement est actif
                        </CardTitle>
                        <CardDescription className="pt-1 text-base">
                            Merci pour votre confiance. Votre paiement a bien
                            été reçu et toutes les fonctionnalités de votre
                            nouveau forfait sont disponibles dès maintenant.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                        <Button asChild>
                            <Link href="/core/dashboard">
                                Accéder au tableau de bord
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/core/billing">
                                Voir mon abonnement
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isNotFound) {
        return (
            <div className="container mx-auto p-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            Finalisation du paiement
                        </CardTitle>
                        <CardDescription>
                            Nous n&apos;avons pas pu retrouver immédiatement
                            le détail de cette transaction sur votre compte,
                            mais le paiement est traité en arrière-plan.
                            Vous allez être redirigé vers votre espace
                            facturation pour voir l&apos;état actuel de votre
                            abonnement.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-3">
                        <Button asChild>
                            <Link href="/core/billing">
                                Voir mon abonnement maintenant
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/core/dashboard">
                                Retour au tableau de bord
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isFailure) {
        return (
            <div className="container mx-auto p-6 max-w-2xl">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <XCircle className="h-6 w-6" />
                            Paiement non abouti
                        </CardTitle>
                        <CardDescription>
                            La transaction n'a pas pu être finalisée
                            (statut&nbsp;: {tx?.status}). Aucun montant n'a été
                            définitivement débité. Vous pouvez réessayer.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-3">
                        <Button asChild>
                            <Link href="/core/billing">Réessayer</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/core/dashboard">
                                Retour au tableau de bord
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // En cours : on affiche un état d'attente avec polling actif.
    return (
        <div className="container mx-auto p-8 flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4 max-w-md">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">
                    Confirmation du paiement…
                </h2>
                <p className="text-muted-foreground text-sm">
                    Nous attendons la confirmation de Djomy. Cela peut prendre
                    quelques secondes. Ne fermez pas cette page.
                </p>
                {error && (
                    <p className="text-xs text-amber-700">
                        Difficulté de connexion au serveur. Nouvelle tentative
                        en cours…
                    </p>
                )}
                {!isLoading && tx && (
                    <p className="text-xs text-muted-foreground/70 font-mono">
                        Statut actuel&nbsp;: {tx.status}
                    </p>
                )}
            </div>
        </div>
    );
}

function PaymentReturnFallback() {
    return (
        <div className="container mx-auto p-8 flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">
                    Confirmation du paiement…
                </h2>
            </div>
        </div>
    );
}

export default function PaymentReturnPage() {
    return (
        <Suspense fallback={<PaymentReturnFallback />}>
            <PaymentReturnClient />
        </Suspense>
    );
}
