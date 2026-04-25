/**
 * Extrait un message d'erreur lisible depuis une exception API.
 *
 * Le backend Django/DRF peut retourner plusieurs formats :
 * - `{ "error": "Message" }` — vues custom (cancel, complete…)
 * - `{ "detail": "Message" }` — handlers DRF par défaut + ValidationError Django
 *   à un seul message
 * - `{ "detail": ["msg1", "msg2"] }` — ValidationError Django à messages multiples
 * - `{ "field_name": ["Message1", "Message2"] }` — erreurs de validation par
 *   champ (DRF serializer + Django Model.clean()/save())
 * - `"Plain string"` — fallback rare
 *
 * Ce helper traverse ces variantes dans l'ordre de spécificité et retourne
 * la première chaîne lisible trouvée. Si rien n'est exploitable, retourne
 * le `fallback` (par défaut `err.message` puis "Une erreur est survenue").
 */
export function getApiErrorMessage(
  err: unknown,
  fallback?: string
): string {
  const e = err as {
    data?: unknown;
    message?: string;
  };

  const fromData = extractFromData(e?.data);
  if (fromData) return fromData;

  if (e?.message) return e.message;
  return fallback ?? "Une erreur est survenue.";
}

function extractFromData(data: unknown): string | null {
  if (data == null) return null;

  if (typeof data === "string") return data;

  if (typeof data !== "object") return null;

  const obj = data as Record<string, unknown>;

  // 1) Clés explicites les plus fréquentes
  for (const key of ["error", "detail", "message"] as const) {
    const v = obj[key];
    const s = stringifyValue(v);
    if (s) return s;
  }

  // 2) Dict {field: [msgs]} — on prend le premier champ avec un message
  for (const value of Object.values(obj)) {
    const s = stringifyValue(value);
    if (s) return s;
  }

  return null;
}

function stringifyValue(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v)) {
    for (const item of v) {
      const s = stringifyValue(item);
      if (s) return s;
    }
    return null;
  }
  if (typeof v === "object") {
    // Récursion peu profonde pour les payloads imbriqués (ex: serializers nested)
    return extractFromData(v);
  }
  return null;
}
