import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

/**
 * Barre d'action contextuelle pour la sélection multiple d'une liste.
 * Ne s'affiche que lorsqu'au moins un élément est sélectionné — l'interface
 * reste épurée le reste du temps.
 */
export function ListSelectionBar({
  count,
  label,
  onClear,
  onDelete,
}: {
  count: number;
  /** Libellé complet, ex. « 2 catégories sélectionnées » (gère le genre/pluriel côté appelant). */
  label: string;
  onClear: () => void;
  onDelete: () => void;
}) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 border border-primary/30 bg-primary/5 px-4 py-2 mb-3">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={onClear}>
          Désélectionner
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4 mr-1.5" />
          Supprimer
        </Button>
      </div>
    </div>
  );
}
