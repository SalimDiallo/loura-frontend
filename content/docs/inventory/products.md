Le **catalogue produits** est le cœur de votre activité commerciale. C'est ici que vous référencez tout ce que vous vendez — biens physiques, services, ou les deux.

:::video src="oJmNRXcqr18" title="Bien organiser son catalogue produits (4 min)" /:::

## Vue d'ensemble

La page Produits liste tous vos articles avec leurs informations clés : nom, catégorie, prix de vente, stock total, statut.

:::image src="/images/docs/products-list.png" alt="Liste des produits" caption="Catalogue produits — vue tableau avec recherche et filtres." /:::

Vous pouvez **rechercher** par nom ou SKU, **filtrer** par catégorie, et trier par n'importe quelle colonne en cliquant sur l'en-tête.

## Créer un produit

Cliquez sur **Nouveau produit** en haut à droite et remplissez le formulaire.

:::steps

1. **Donnez un nom clair**

   Le nom apparaît partout : caisse, factures, devis. Préférez "T-shirt blanc taille M" plutôt que "Réf 4521".

2. **Saisissez le SKU (référence interne)**

   Code unique pour vous y retrouver. Choisissez une convention claire et tenez-vous-y : par exemple `TS-BLA-M` (T-shirt, blanc, taille M).

3. **Choisissez une catégorie**

   Indispensable pour filtrer rapidement en caisse et générer des rapports utiles. Si la catégorie n'existe pas, créez-la depuis `Stocks → Catégories`.

4. **Renseignez les prix**
   - **Prix d'achat** — combien vous coûte le produit (sert au calcul de la marge)
   - **Prix de vente** — le prix affiché au client

5. **Activez le suivi de stock (si bien physique)**

   Cochez **Track stock** pour les biens physiques. Décochez pour les services (consultation, abonnement, livraison…).

6. **Ajoutez un code-barres (optionnel)**

   Si votre produit a un EAN, UPC ou QR code, scannez-le ou saisissez-le manuellement. Vous pourrez ensuite le scanner en caisse.

7. **Ajoutez une photo (recommandé)**

   Une image rend la caisse plus rapide et plus visuelle. Format carré, 500×500px minimum.

8. **Validez**

   Le produit est immédiatement disponible en caisse. Si vous avez activé le suivi de stock, créez maintenant un mouvement d'entrée pour saisir le stock initial.
   :::

:::image src="/images/docs/product-form.png" alt="Formulaire de création de produit" caption="Création d'un produit — tous les champs essentiels en une seule page." /:::

## Le suivi de stock

Pour les **biens physiques**, activez le suivi de stock. LouraTech tracera automatiquement chaque entrée et sortie.

:::callout type="info" title="Stock par entrepôt, pas global"
Chaque produit a un niveau de stock **par entrepôt**. Si vous avez 50 unités au total réparties en 30 + 20 entre deux boutiques, c'est ce qui s'affichera. La caisse ne propose que le stock de l'entrepôt sélectionné.
:::

### Saisir le stock initial

Pour un nouveau produit avec suivi de stock :

:::steps

1. Allez dans `Stocks → Mouvements → Nouveau`
2. Type : **Entrée**
3. Choisissez l'**entrepôt** où arrivent les marchandises
4. Sélectionnez le **produit** créé
5. Saisissez la **quantité** initiale
6. Motif : "Stock initial à l'inventaire"
7. Validez
   :::

Le stock est immédiatement disponible en caisse.

## Catégories

Bien catégoriser vos produits **améliore tout** : la caisse, les rapports, les filtres.

Allez dans `Stocks → Catégories → Nouvelle` et créez une arborescence claire :

```
Vêtements
├── Hauts
│   ├── T-shirts
│   └── Chemises
├── Bas
│   ├── Pantalons
│   └── Shorts
└── Accessoires
```

:::image src="/images/docs/categories-tree.png" alt="Arborescence des catégories" caption="Arborescence des catégories — sur autant de niveaux que vous voulez." /:::

:::callout type="tip" title="Catégorie unique = simplicité"
Un produit appartient à **une seule catégorie**. Si vous hésitez, choisissez la plus précise (T-shirts plutôt que Hauts). Les filtres en caisse remontent automatiquement par parent, donc vous retrouverez le produit en filtrant sur "Hauts" ou "Vêtements".
:::

## Modifier un produit

Cliquez sur la ligne d'un produit pour ouvrir sa fiche. Vous pouvez modifier :

- Toutes les **infos générales** (nom, catégorie, prix, photo)
- Le **suivi de stock** (activer/désactiver — attention, désactiver perd l'historique)
- Le **statut** (actif/archivé)

:::callout type="warning" title="Modifier le prix ne change pas les ventes passées"
Les ventes déjà effectuées conservent le prix de l'époque. Les nouvelles ventes utiliseront le nouveau prix. Idem pour les devis non encore convertis en ventes.
:::

## Archiver un produit

Pour retirer un produit que vous ne vendez plus, **archivez-le** (ne le supprimez pas) :

→ Bouton **Archiver** sur la fiche produit

Le produit disparaît de la caisse mais reste accessible dans les ventes passées et les rapports historiques. Vous pouvez le désarchiver à tout moment.

:::callout type="warning" title="Pourquoi pas supprimer ?"
Supprimer un produit qui a déjà été vendu casserait l'historique de vos factures et rapports. L'archivage est la bonne pratique. La suppression définitive n'est possible que pour les produits **jamais vendus**.
:::

## Bonnes pratiques

:::callout type="success" title="Pour un catalogue propre"

- **SKU stables** — n'utilisez pas le nom dans le SKU, le nom pourra changer
- **Catégorisez systématiquement** dès la création
- **Photos carrées** uniformes pour un visuel pro en caisse
- **Ajoutez les codes-barres** dès la saisie pour gagner du temps en caisse
- **Surveillez vos marges** : prix de vente / prix d'achat — si une marge tombe sous votre seuil, ajustez vite
- **Faites le ménage** trimestriellement : archivez les produits jamais vendus depuis 6 mois
  :::

## Aller plus loin

- [Caisse](/docs/documentation/inventory/pos) — vendre vos produits
- [Mouvements de stock](/docs/documentation/inventory/stock) — entrées et sorties
- [Entrepôts](/docs/documentation/inventory/warehouses) — gestion multi-sites
