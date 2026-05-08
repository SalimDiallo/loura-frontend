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
import { useTransactionStatus } from "@/lib/hooks/core";
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
    const reference = useMemo(
        () =>
            params.get("ref") ||
            params.get("reference") ||
            params.get("merchantPaymentReference") ||
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
                        <CardTitle className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle2 className="h-6 w-6" />
                            Paiement confirmé
                        </CardTitle>
                        <CardDescription>
                            Votre abonnement a bien été activé. Vous pouvez
                            commencer à utiliser votre nouveau forfait dès
                            maintenant.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-3">
                        <Button asChild>
                            <Link href="/core/dashboard">
                                Aller au tableau de bord
                            </Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/core/billing">Voir mon abonnement</Link>
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
                        <CardTitle>Transaction introuvable</CardTitle>
                        <CardDescription>
                            Aucune transaction ne correspond à cette
                            référence sur votre compte. Si vous venez d&apos;être
                            débité, le paiement sera traité automatiquement
                            dans quelques minutes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-3">
                        <Button asChild>
                            <Link href="/core/billing">
                                Voir mon abonnement
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
