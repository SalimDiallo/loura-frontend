"use client";

import { PermissionGuard } from "@/components/permissions";
import { useReceivables } from "@/lib/hooks/accounting";
import { PERMISSIONS } from "@/lib/permissions";
import { Receipt } from "lucide-react";
import { useParams } from "next/navigation";

import { OutstandingView } from "../_components/OutstandingView";

function ReceivablesPage() {
    const { id: orgId } = useParams<{ id: string }>();
    const query = useReceivables(orgId);

    return (
        <OutstandingView
            title="Créances clients"
            description="Montants restant dus sur les ventes non soldées."
            partyLabel="Client"
            icon={Receipt}
            csvFilename="creances-clients"
            query={query}
        />
    );
}

export default function ReceivablesPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.ACCOUNTING.VIEW_RECEIVABLES}>
            <ReceivablesPage />
        </PermissionGuard>
    );
}
