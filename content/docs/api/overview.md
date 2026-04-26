L'**API REST** de LouraTech permet d'automatiser toutes les opérations disponibles dans l'interface : gestion des employés, ventes, produits, mouvements de stock, etc.

> **Statut Beta** — L'API est fonctionnelle mais peut évoluer. Versionnage stable prévu pour la v1.0.

## Base URL

```
https://api.louratech.com/v1
```

Tous les endpoints sont préfixés par `/api/`. La documentation interactive (Swagger / OpenAPI) est disponible à `/api/schema/swagger-ui`.

## Authentification

L'API utilise des **JSON Web Tokens** (JWT) avec rotation :

- **Access token** — durée de vie 15 minutes
- **Refresh token** — durée de vie 7 jours, renouvelable

### Obtenir un token

```http
POST /api/auth/login/
Content-Type: application/json

{
  "email": "alice@exemple.com",
  "password": "••••••••"
}
```

Réponse :

```json
{
  "data": {
    "access": "eyJhbGciOi...",
    "refresh": "eyJhbGciOi...",
    "user": { "id": "...", "email": "..." }
  }
}
```

### Utiliser le token

Ajoutez l'en-tête `Authorization` à toutes vos requêtes :

```http
GET /api/inventory/products/
Authorization: Bearer eyJhbGciOi...
```

### Rafraîchir le token

```http
POST /api/auth/refresh/
Content-Type: application/json

{ "refresh": "eyJhbGciOi..." }
```

## Multi-organisation

Chaque requête doit indiquer l'organisation cible via le header :

```http
X-Organization-Id: 5f3e2c8a-1b4d-4f7e-...
```

Sans ce header, l'API renvoie `400 Bad Request` (sauf pour les endpoints globaux comme `/auth/`).

## Pagination

Les endpoints de liste suivent le format DRF standard :

```json
{
  "count": 132,
  "next": "https://api.louratech.com/v1/inventory/products/?page=3",
  "previous": "https://api.louratech.com/v1/inventory/products/?page=1",
  "results": [ ... ]
}
```

Paramètres :

- `page` — numéro de page (1 par défaut)
- `page_size` — taille de page (max 100)
- `ordering` — champ de tri (`-created_at` pour descendant)

## Format des erreurs

Toutes les erreurs suivent un format unifié :

```json
{
  "error": {
    "code": "validation_error",
    "message": "Le SKU doit être unique dans l'organisation",
    "field": "sku"
  }
}
```

Codes HTTP utilisés :

| Code | Signification |
| --- | --- |
| `200` | Succès |
| `201` | Créé |
| `400` | Validation échouée |
| `401` | Token absent ou invalide |
| `403` | Permission refusée |
| `404` | Ressource introuvable |
| `409` | Conflit (ex : SKU déjà pris) |
| `429` | Quota dépassé |
| `500` | Erreur serveur |

## Exemple complet

Créer une vente comptant via l'API :

```typescript
const sale = await fetch("https://api.louratech.com/v1/inventory/sales/", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${accessToken}`,
    "X-Organization-Id": orgId,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    client_id: "5f3...",
    warehouse_id: "9b1...",
    payment_method: "cash",
    items: [
      { product_id: "c4e...", quantity: 2, unit_price: "1500.00" },
    ],
  }),
});

const data = await sale.json();
console.log(data.invoice_url); // PDF facture
```

## Limites

- **Quota par défaut** : 1 000 requêtes / heure / token
- **Taille max d'upload** : 10 MB par fichier (logos, pièces jointes)
- **Timeout** : 30 secondes par requête

Pour augmenter votre quota, contactez le support.

## SDK officiels

Des SDK typés sont en cours de développement :

- `@louratech/sdk-typescript` — TypeScript / JavaScript (**Bientôt**)
- `louratech-python` — Python (**Bientôt**)

En attendant, utilisez n'importe quelle bibliothèque HTTP standard (`fetch`, `axios`, `requests`, …).
