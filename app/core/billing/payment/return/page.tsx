"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Page de retour simplifiée après le paiement Djomy.
 * Redirige automatiquement vers le dashboard principal.
 */
export default function PaymentReturnPage() {
    const router = useRouter();
    const params = useSearchParams();

    useEffect(() => {
        // On peut lire ici la référence si besoin, ou faire un appel, mais on redirige directement.
        // const reference =
        //     params.get("merchantPaymentReference") ||
        //     params.get("reference") ||
        //     params.get("ref") ||
        //     null;

        // Redirection simple après un minidélai
        const timeout = setTimeout(() => {
            router.replace("/core/dashboard");
        }, 1200);

        return () => clearTimeout(timeout);
    }, [router, params]);

    return (
        <div className="container mx-auto p-8 flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <svg className="h-8 w-8 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-30" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-70" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                </div>
                <h2 className="text-xl font-semibold">Traitement du paiement...</h2>
                <p className="text-muted-foreground text-sm">
                    Merci, votre paiement est en cours de traitement.<br />Vous allez être redirigé(e) vers le dashboard.
                </p>
            </div>
        </div>
    );
}
