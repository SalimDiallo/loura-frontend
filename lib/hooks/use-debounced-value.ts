'use client';

import { useEffect, useState } from 'react';

/**
 * Renvoie une version « retardée » de `value` : elle n'est mise à jour qu'après
 * `delay` ms sans nouveau changement. Utile pour éviter une requête réseau à
 * chaque frappe dans un champ de recherche.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
