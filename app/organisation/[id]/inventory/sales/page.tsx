"use client";

import { PermissionGuard } from "@/components/permissions";
import { SalesPage } from "@/components/services/inventory/sales/SalePageList";
import { PERMISSIONS } from "@/lib/permissions";
export default function SalesPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.SALES.VIEW}>
            <SalesPage />
        </PermissionGuard>
    );
}

