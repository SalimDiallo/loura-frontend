"use client";

/**
 * Page d'annulation après abandon du paiement Djomy.
 *
 * Djomy redirige ici quand l'utilisateur annule depuis la page de paiement.
 * Aucun débit n'a été effectué.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentCancelPage() {
    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-600">
                        <XCircle className="h-6 w-6" />
                        Paiement annulé
                    </CardTitle>
                    <CardDescription>
                        Vous avez interrompu le processus de paiement. Aucun montant
                        n'a été débité. Votre abonnement actuel reste inchangé.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                    <Button asChild>
                        <Link href="/core/billing">Réessayer</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href="/core/dashboard">Retour au dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
