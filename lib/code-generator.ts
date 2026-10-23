/**
 * Génération de codes (SKU, code interne, code-barres).
 *
 * Objectif UX : aider l'utilisateur à remplir les champs « code » d'un clic,
 * sans réfléchir à un format. Les codes restent librement modifiables, et
 * l'unicité finale est garantie côté serveur (le back régénère si collision).
 *
 * On évite les caractères ambigus (I, O, 0, 1) dans les suffixes aléatoires
 * pour faciliter la lecture / saisie manuelle.
 */

/** Translittère un texte en segment ASCII alphanumérique majuscule. */
export function slugFromName(name: string, maxLen = 10): string {
  return (name || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // diacritiques
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, maxLen);
}

const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I, O, 0, 1

/** Suffixe aléatoire court et lisible (ex: "7F3K"). */
export function randomSuffix(len = 4): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)];
  }
  return out;
}

/**
 * Génère un code lisible : base dérivée du nom si fourni, sinon un préfixe
 * fixe, suivie d'un suffixe aléatoire. Ex :
 *   makeCode({ name: "Entrepôt Central", prefix: "WH" }) → "ENTREPOT-7F3K"
 *   makeCode({ prefix: "FOUR" })                         → "FOUR-7F3K"
 */
export function makeCode(
  opts: { name?: string; prefix?: string; maxLen?: number } = {}
): string {
  const base = slugFromName(opts.name ?? "", opts.maxLen ?? 8) || opts.prefix || "REF";
  return `${base}-${randomSuffix(4)}`;
}

/** SKU produit : dérivé du nom si fourni, sinon préfixe "SKU". */
export function makeSku(name?: string): string {
  const base = slugFromName(name ?? "", 10) || "SKU";
  return `${base}-${randomSuffix(4)}`;
}

/**
 * Génère un code-barres EAN-13 valide (12 chiffres aléatoires + clé de
 * contrôle). Utile pour étiqueter un produit sans code-barres fabricant.
 */
export function makeBarcodeEAN13(): string {
  let digits = "";
  for (let i = 0; i < 12; i++) digits += Math.floor(Math.random() * 10);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const n = Number(digits[i]);
    sum += i % 2 === 0 ? n : n * 3; // poids 1,3,1,3… (EAN-13)
  }
  const check = (10 - (sum % 10)) % 10;
  return digits + String(check);
}
