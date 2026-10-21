import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

/**
 * Actions de ligne affichées directement en icônes (pas de menu caché).
 * Compact et découvrable pour des utilisateurs non techniques : chaque icône
 * a un libellé accessible + une infobulle. N'affiche que les actions fournies.
 */
export function RowActionsMenu({
  onEdit,
  onDelete,
  editLabel = "Modifier",
  deleteLabel = "Supprimer",
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
}) {
  if (!onEdit && !onDelete) return null;

  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label={editLabel}
          title={editLabel}
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          aria-label={deleteLabel}
          title={deleteLabel}
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
