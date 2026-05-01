/**
 * Dépendances entre permissions (logique UI, "soft").
 *
 * Les règles exprimées ici forcent, côté interface, la cohérence d'une
 * sélection de permissions :
 *   - Cocher une permission "manage" coche automatiquement la "view" associée.
 *   - Décocher "view" est bloqué tant qu'une permission dépendante reste cochée.
 *
 * Les codenames doivent correspondre au backend (`PermissionRegistry`).
 * Les règles sont purement front : le backend n'est pas impacté.
 */

// Ajoutez ici les autres dépendances dès que de nouvelles permissions apparaissent.
export const PERMISSION_DEPENDENCIES: Record<string, readonly string[]> = {
  // Core — Organisation
  "core.manage_organization": ["core.view_organization"],
  "core.manage_settings": ["core.view_organization"],

  // HR — Employés
  "hr.manage_employees": ["hr.view_employees"],
  "hr.invite_employees": ["hr.view_employees"],
  "hr.manage_roles": ["hr.view_employees"],

  // HR — Contrats
  "hr.manage_contracts": ["hr.view_contracts"],

  // HR — Paiements
  "hr.manage_payments": ["hr.view_payments"],
  "hr.approve_payments": ["hr.view_payments", "hr.manage_payments"],

  // HR — Avances
  "hr.request_advance": ["hr.view_advances"],
  "hr.review_advances": ["hr.view_advances"],

  // HR — Congés
  "hr.request_leave": ["hr.view_leaves"],
  "hr.review_leaves": ["hr.view_leaves"],
  "hr.manage_leave_balances": ["hr.view_leaves"],

  // Inventaire — Produits
  "inventory.manage_products": ["inventory.view_products"],

  // Inventaire — Catégories
  "inventory.manage_categories": ["inventory.view_categories"],

  // Inventaire — Entrepôts
  "inventory.manage_warehouses": ["inventory.view_warehouses"],

  // Inventaire — Stock
  "inventory.manage_stock": ["inventory.view_stock"],

  // Inventaire — Fournisseurs
  "inventory.manage_suppliers": ["inventory.view_suppliers"],

  // Inventaire — Approvisionnements
  "inventory.manage_purchase_orders": ["inventory.view_purchase_orders"],

  // Inventaire — Clients
  "inventory.manage_customers": ["inventory.view_customers"],

  // Inventaire — Ventes
  "inventory.manage_sales": ["inventory.view_sales"],

  // Inventaire — Dépenses
  "inventory.manage_expenses": ["inventory.view_expenses"],

  // Inventaire — Restriction par entrepôt
  // La permission de scope a besoin a minima de pouvoir voir les entrepôts
  // (sinon le membre n'a aucun moyen de connaître ses entrepôts assignés).
  "inventory.scope_warehouses": ["inventory.view_warehouses"],

  // Inventaire — Rapports (si besoin de dépendances à l'avenir)
  // "inventory.manage_reports": ["inventory.view_reports"], // décommentez/corrigez si applicable
};

interface PermissionLite {
  id: string;
  codename: string;
}

/** Retourne tous les codenames requis (récursivement) par `codename`. */
export function getRequiredCodenames(codename: string): string[] {
  const visited = new Set<string>();
  const walk = (c: string) => {
    const deps = PERMISSION_DEPENDENCIES[c] ?? [];
    for (const dep of deps) {
      if (visited.has(dep)) continue;
      visited.add(dep);
      walk(dep);
    }
  };
  walk(codename);
  return Array.from(visited);
}

/** Retourne tous les codenames qui dépendent (récursivement) de `codename`. */
export function getDependentCodenames(codename: string): string[] {
  const visited = new Set<string>();
  const walk = (target: string) => {
    for (const [code, deps] of Object.entries(PERMISSION_DEPENDENCIES)) {
      if ((deps as readonly string[]).includes(target) && !visited.has(code)) {
        visited.add(code);
        walk(code);
      }
    }
  };
  walk(codename);
  return Array.from(visited);
}

function buildMaps(allPermissions: PermissionLite[]) {
  const idToCode = new Map<string, string>();
  const codeToId = new Map<string, string>();
  for (const p of allPermissions) {
    idToCode.set(p.id, p.codename);
    codeToId.set(p.codename, p.id);
  }
  return { idToCode, codeToId };
}

/**
 * Résout une nouvelle sélection de permissions en appliquant les dépendances :
 *   - Pour chaque permission nouvellement cochée, ajoute ses permissions requises.
 *   - Une permission ne peut pas être décochée tant qu'une permission qui en
 *     dépend est encore sélectionnée : la tentative est annulée.
 *
 * @param oldIds permissions sélectionnées avant l'action utilisateur
 * @param newIds permissions souhaitées après l'action utilisateur (toggle brut)
 * @param allPermissions liste complète (pour mapper id ↔ codename)
 * @param options.implicitIds permissions déjà accordées implicitement (ex: via
 *   un rôle) et donc non nécessaires à rajouter dans la sélection extra.
 * @returns la sélection finale (ids uniques)
 */
export function resolvePermissionSelection(
  oldIds: string[],
  newIds: string[],
  allPermissions: PermissionLite[],
  options: { implicitIds?: string[] } = {}
): string[] {
  const { idToCode, codeToId } = buildMaps(allPermissions);
  const implicit = new Set(options.implicitIds ?? []);
  const oldSet = new Set(oldIds);
  const nextSet = new Set(newIds);

  const added = newIds.filter((id) => !oldSet.has(id));
  const removed = oldIds.filter((id) => !nextSet.has(id));

  // 1) Ajouter les permissions requises des nouvellement cochées.
  for (const id of added) {
    const code = idToCode.get(id);
    if (!code) continue;
    for (const reqCode of getRequiredCodenames(code)) {
      const reqId = codeToId.get(reqCode);
      if (reqId && !implicit.has(reqId)) nextSet.add(reqId);
    }
  }

  // 2) Bloquer le retrait d'une permission encore requise par une autre
  //    permission sélectionnée : on la remet dans la sélection.
  for (const id of removed) {
    const code = idToCode.get(id);
    if (!code) continue;
    const stillNeeded = getDependentCodenames(code).some((depCode) => {
      const depId = codeToId.get(depCode);
      return depId !== undefined && nextSet.has(depId);
    });
    if (stillNeeded) nextSet.add(id);
  }

  return Array.from(nextSet);
}

/**
 * Ids des permissions actuellement sélectionnées qui dépendent de `permId`.
 * Sert à afficher un tooltip / désactiver le décochage :
 * "Requise par : ...".
 */
export function getDependentSelectedIds(
  permId: string,
  selectedIds: string[],
  allPermissions: PermissionLite[]
): string[] {
  const { idToCode, codeToId } = buildMaps(allPermissions);
  const code = idToCode.get(permId);
  if (!code) return [];
  const selectedSet = new Set(selectedIds);
  const result: string[] = [];
  for (const depCode of getDependentCodenames(code)) {
    const depId = codeToId.get(depCode);
    if (depId && selectedSet.has(depId)) result.push(depId);
  }
  return result;
}

/**
 * Ids des permissions requises par `permId` (utile pour afficher un hint
 * "cocher ajoutera aussi : ...").
 */
export function getRequiredIds(
  permId: string,
  allPermissions: PermissionLite[]
): string[] {
  const { idToCode, codeToId } = buildMaps(allPermissions);
  const code = idToCode.get(permId);
  if (!code) return [];
  return getRequiredCodenames(code)
    .map((c) => codeToId.get(c))
    .filter((id): id is string => Boolean(id));
}
