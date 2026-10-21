'use client';

import { useCallback, useMemo, useState } from 'react';

/**
 * Gère une sélection multiple de lignes par identifiant.
 *
 * `visibleIds` = les ids actuellement affichés à l'écran. « Tout sélectionner »
 * et l'état « tout coché » ne portent que sur ces lignes visibles : on ne
 * sélectionne jamais des éléments hors de la vue courante.
 */
export function useBulkSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const clear = useCallback(() => setSelected(new Set()), []);

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      if (visibleIds.length > 0 && visibleIds.every((id) => prev.has(id))) {
        return new Set();
      }
      return new Set(visibleIds);
    });
  }, [visibleIds]);

  const ids = useMemo(() => [...selected], [selected]);

  return {
    selected,
    ids,
    count: selected.size,
    allSelected,
    toggleOne,
    toggleAll,
    clear,
  };
}
