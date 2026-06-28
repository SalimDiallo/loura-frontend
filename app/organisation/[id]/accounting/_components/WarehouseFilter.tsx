"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useWarehouses } from "@/lib/hooks/inventory";
import type { Warehouse } from "@/lib/types/inventory";

const ALL = "all";

/**
 * `useWarehouses` est typé `Warehouse[]` mais l'endpoint est paginé : selon le
 * cas, on reçoit soit un tableau, soit `{ results: Warehouse[] }`. On normalise
 * défensivement pour éviter `warehouses.map is not a function`.
 */
function toList(data: unknown): Warehouse[] {
    if (Array.isArray(data)) return data as Warehouse[];
    const results = (data as { results?: unknown })?.results;
    return Array.isArray(results) ? (results as Warehouse[]) : [];
}

/**
 * Sélecteur d'entrepôt/caisse pour filtrer les états comptables.
 * `value` vide ("") = toutes les caisses. Le back filtre via `?warehouse=`.
 *
 * Note : un membre scopé entrepôt ne verra ici que ses caisses (le back filtre
 * déjà la liste warehouses) — cohérent avec le scoping de la compta.
 */
export function WarehouseFilter({
    orgId,
    value,
    onChange,
}: {
    orgId: string;
    value: string; // "" = toutes
    onChange: (warehouseId: string) => void;
}) {
    // `page_size: "all"` est le contrat de fait de ce hook dans tout le projet :
    // l'endpoint warehouses est paginé et ne renvoie un tableau brut que dans ce
    // cas (cf. StandardPagination). Sans ça, on recevrait `{count, results}` →
    // `warehouses.map is not a function`. `toList` reste une ceinture de sécurité.
    const { data } = useWarehouses(orgId, { page_size: "all", is_active: true });
    const warehouses = toList(data);

    // Inutile d'afficher le filtre s'il n'y a qu'une caisse (ou aucune).
    if (warehouses.length <= 1) return null;

    return (
        <Select
            value={value || ALL}
            onValueChange={(v) => onChange(v === ALL ? "" : v)}
        >
            <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Entrepôt" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value={ALL}>Toutes les caisses</SelectItem>
                {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                        {w.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
