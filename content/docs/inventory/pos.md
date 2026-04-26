La **caisse** est l'écran le plus utilisé de LouraTech : c'est ici que vous **encaissez vos ventes** au quotidien — en boutique, par téléphone, ou en ligne.

:::video src="oJmNRXcqr18" title="Encaisser une vente en 30 secondes" /:::

## L'écran en un coup d'œil

L'écran de caisse est divisé en **deux zones** :

- **À gauche** : votre **catalogue produits** avec recherche et filtres par catégorie
- **À droite** : le **panier**, le client, et les options de paiement

:::image src="/images/docs/pos-overview.png" alt="Écran de caisse complet" caption="L'écran de caisse — catalogue à gauche, panier à droite." /:::

En haut, vous choisissez l'**entrepôt** depuis lequel vendre. Le stock disponible s'affiche directement sur chaque produit.

## Encaisser une vente — les 5 étapes

:::steps

1. **Choisissez l'entrepôt**

   Si vous avez plusieurs sites (boutique 1, boutique 2, dépôt…), sélectionnez celui d'où partent les produits. Le stock affiché change selon votre choix.

2. **Ajoutez les produits au panier**

   Cliquez sur les vignettes des produits, ou tapez dans la barre de recherche pour filtrer. Si vous avez un lecteur de code-barres, scannez directement — le produit s'ajoute automatiquement.

3. **Ajustez les quantités**

   Dans le panier, cliquez sur les boutons `+` / `−` ou tapez directement le nombre. Le stock disponible vous bloque si vous demandez trop.

4. **Renseignez le client et le paiement**
   - Sélectionnez le **client** dans la liste, ou créez-en un nouveau (juste un nom suffit)
   - Choisissez la **méthode de paiement** (comptant, crédit, mixte)
   - Si crédit ou mixte : indiquez le montant payé maintenant et la date d'échéance pour le reste

5. **Confirmez l'encaissement**

   Une fenêtre de confirmation récapitule tout. Validez — la facture PDF s'ouvre automatiquement.
   :::

:::callout type="success" title="C'est tout"
La vente est enregistrée, le stock est mis à jour, la facture est générée. Vous pouvez l'imprimer, l'envoyer par email ou simplement la fermer.
:::

## Les méthodes de paiement

| Méthode      | Quand l'utiliser                                                  |
| ------------ | ----------------------------------------------------------------- |
| **Comptant** | Le client paie tout, immédiatement (espèces, mobile money, carte) |
| **Crédit**   | Le client paiera plus tard, totalement                            |
| **Mixte**    | Le client paie une partie maintenant, le reste plus tard          |

Pour les paiements partiels (mixte ou suivi de créance), des **boutons rapides** facilitent la saisie :

- **Tout** — pré-remplit avec le montant total
- **50%** / **25%** — pré-remplit avec la moitié ou un quart
- **Échéance ciblée** — pour viser un montant arrondi (1000, 5000, etc.)

:::image src="/images/docs/pos-payment.png" alt="Section de paiement" caption="La section paiement avec les boutons de pré-remplissage." /:::

## Le suivi de stock en temps réel

LouraTech vérifie **automatiquement** la disponibilité de chaque produit :

- Un **badge vert** indique un stock confortable
- Un **badge ambre** indique un stock bas (≤ 5 unités)
- Un **badge rouge** indique une rupture — le produit est désactivé

:::image src="/images/docs/pos-stock-badges.png" alt="Badges de stock sur les produits" caption="Les badges de stock — visibles sur chaque vignette produit." /:::

:::callout type="warning" title="Pas de vente à découvert par défaut"
Si vous tentez d'ajouter 5 unités d'un produit qui n'en a que 3 en stock dans l'entrepôt sélectionné, le système vous bloque avec un message clair. Pour vendre quand même (cas exceptionnel), créez d'abord un mouvement d'entrée.
:::

## Créer un nouveau client à la volée

Pas besoin de quitter la caisse pour ajouter un client :

:::steps

1. Cliquez sur le champ **Client** dans le panier
2. Tapez le nom du nouveau client
3. Cliquez sur **+ Créer "Nom du client"**
4. Une mini-fenêtre s'ouvre — remplissez juste les champs essentiels (téléphone si crédit)
5. Validez — le client est créé et sélectionné dans le panier
   :::

:::callout type="tip" title="Client de comptoir"
Pour les ventes anonymes (boutique avec passage), créez **un client générique** ("Client comptoir", "Client occasionnel") et utilisez-le pour toutes les ventes sans identification. Vous garderez vos vrais clients propres pour le suivi de fidélité.
:::

## Remises et promotions

Vous pouvez appliquer une **remise globale** sur le panier :

- En **pourcentage** : "10%" appliqué à tout le panier
- En **montant fixe** : "5000 FCFA" déduit du total

La remise apparaît clairement sur la facture.

:::image src="/images/docs/pos-discount.png" alt="Application d'une remise" caption="Remise globale en pourcentage ou en montant fixe." /:::

## Astuces de productivité

:::callout type="tip" title="Pour aller plus vite"

- **Activez les codes-barres** sur vos produits — un scan = un ajout au panier
- **Triez vos produits** par fréquence de vente : les plus vendus apparaissent en premier
- **Créez des catégories** claires pour filtrer rapidement
- **Utilisez le clavier** : flèches pour naviguer, Entrée pour sélectionner, `+` / `−` pour les quantités
- **Configurez un entrepôt par défaut** dans les paramètres pour éviter de le sélectionner à chaque ouverture
  :::

## Que faire si...

### Le produit n'apparaît pas dans la caisse

Vérifiez :

- Qu'il existe bien dans `Stocks → Produits`
- Qu'il est marqué **Actif** (pas archivé)
- Qu'il est en stock dans l'entrepôt sélectionné (sinon il est désactivé)

### Le total semble faux

Vérifiez les **remises** appliquées et les **prix unitaires** dans le panier. Cliquez sur un produit du panier pour voir le détail (prix d'origine + remise éventuelle).

### Une vente s'est mal passée

Allez dans `Ventes`, ouvrez la vente concernée. Vous pouvez :

- Modifier les **paiements** (ajouter, supprimer)
- Émettre un **avoir** si le client retourne des articles
- **Annuler** la vente complètement (libère le stock)

## Aller plus loin

- [Produits](/docs/documentation/inventory/products) — créer et organiser votre catalogue
- [Entrepôts](/docs/documentation/inventory/warehouses) — gestion multi-sites
- [Mouvements de stock](/docs/documentation/inventory/stock) — ajustements et inventaires
