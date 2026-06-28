"use client";

import { PermissionGuard } from "@/components/permissions";
import { usePayables } from "@/lib/hooks/accounting";
import { PERMISSIONS } from "@/lib/permissions";
import { PiggyBank } from "lucide-react";
import { useParams } from "next/navigation";

import { OutstandingView } from "../_components/OutstandingView";

function PayablesPage() {
    const { id: orgId } = useParams<{ id: string }>();
    const query = usePayables(orgId);

    return (
        <OutstandingView
            title="Dettes fournisseurs"
            description="Montants restant dus sur les commandes fournisseur."
            partyLabel="Fournisseur"
            icon={PiggyBank}
            csvFilename="dettes-fournisseurs"
            query={query}
        />
    );
}

export default function PayablesPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.ACCOUNTING.VIEW_RECEIVABLES}>
            <PayablesPage />
        </PermissionGuard>
    );
}
