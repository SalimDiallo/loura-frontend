import { PermissionGuard } from "@/components/permissions";
import { SalesPage } from "@/components/services/inventory/sales/SalePageList";
import { PERMISSIONS } from "@/lib/permissions";

export default function CreditSalesPageWrapper() {
    return (
        <PermissionGuard permission={PERMISSIONS.SALES.VIEW}>
            <SalesPage creditOnly />
        </PermissionGuard>
    );
}
