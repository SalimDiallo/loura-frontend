Les **entrepôts** sont vos lieux physiques de stockage : boutiques, dépôts, points de vente, ou même votre voiture si vous êtes commercial itinérant. Chaque entrepôt a son propre stock — et vous pouvez transférer des marchandises entre eux.

:::video src="oJmNRXcqr18" title="Configurer ses entrepôts (3 min)" /:::

## Pourquoi plusieurs entrepôts ?

Si vous n'avez qu'**un seul lieu**, créez un seul entrepôt ("Boutique" ou "Stock principal") et passez à la suite.

Si vous avez **plusieurs sites**, vous voudrez :

- Suivre le **stock séparément** par site
- Faire des **ventes locales** (chaque caisse vend depuis son propre stock)
- Tracer les **transferts** entre sites
- Faire des **rapports par site**

:::image src="/images/docs/warehouses-list.png" alt="Liste des entrepôts" caption="Liste des entrepôts avec niveau de stock total par site." /:::

## Créer un entrepôt

Cliquez sur **Nouvel entrepôt** en haut à droite.

:::steps

1. **Donnez un nom clair**

   "Boutique centre-ville", "Dépôt Nord", "Stock principal"… Le nom apparaît dans la caisse et dans les bons de transfert.

2. **Code (optionnel)**

   Référence courte (3-4 lettres) si vous avez beaucoup de sites. Ex : "BCV", "DEP-N".

3. **Adresse complète**

   Adresse postale du site. Apparaît sur les bons de transfert.

4. **Ville et pays**

   Pour les filtres et rapports géographiques.

5. **Cocher "Par défaut" (un seul entrepôt)**

   L'entrepôt par défaut est sélectionné automatiquement à l'ouverture de la caisse. Pratique si vous travaillez toujours depuis le même site.

6. **Validez**
   :::

:::callout type="tip" title="Démarrez simple"
Au début, créez juste un entrepôt par site physique réel. Vous pourrez toujours en ajouter plus tard. Évitez les "entrepôts virtuels" (style "Stock dispo" / "Stock réservé") — ça complique la gestion sans réelle valeur.
:::

## Transférer du stock entre entrepôts

Vous recevez un gros arrivage à l'entrepôt central et voulez approvisionner votre boutique ? Faites un **transfert**.

:::steps

1. Allez dans `Stocks → Mouvements → Nouveau transfert`
2. Sélectionnez l'**entrepôt source** (d'où partent les produits)
3. Sélectionnez l'**entrepôt destination**
4. Ajoutez les **produits** et les **quantités** à transférer
5. Indiquez la **date de transfert**
6. Validez
   :::

LouraTech crée automatiquement :

- Un **mouvement de sortie** dans l'entrepôt source
- Un **mouvement d'entrée** dans l'entrepôt destination

Les deux sont **liés** (vous voyez le lien dans les détails) et un **bon de transfert PDF** est généré.

:::image src="/images/docs/transfer-form.png" alt="Formulaire de transfert" caption="Transfert entre entrepôts — multi-produits en une seule opération." /:::

:::callout type="warning" title="Validez quand le transfert est physique"
Si vos produits voyagent (camion entre deux villes), créez le transfert en **brouillon** au départ. Validez-le seulement à l'arrivée, après comptage. Ça évite d'avoir un stock fantôme dans l'entrepôt destination.
:::

## Suivi du stock par entrepôt

Sur la fiche d'un entrepôt, vous voyez **tous les produits qui y sont stockés** avec leurs quantités exactes.

:::image src="/images/docs/warehouse-detail.png" alt="Fiche entrepôt avec son stock" caption="Fiche entrepôt — stock complet par produit." /:::

Vous pouvez :

- **Filtrer** par catégorie ou par statut (en stock, rupture, surstockage)
- **Exporter** la liste en CSV
- **Lancer un inventaire physique** depuis cet écran

## Inventaire physique d'un entrepôt

Périodiquement (mensuel en boutique, trimestriel en dépôt), faites un **inventaire physique** pour vérifier que le stock théorique correspond au stock réel.

:::steps

1. `Stocks → Inventaires physiques → Nouveau`
2. Choisissez l'**entrepôt** à inventorier
3. Sélectionnez les produits à compter (ou tous)
4. Imprimez la **fiche de comptage** et faites le tour de l'entrepôt
5. Saisissez les **quantités comptées** dans LouraTech
6. Le système calcule **automatiquement les écarts**
7. Validez l'inventaire — les ajustements sont créés en lot
   :::

Un **PDF récapitulatif** est généré pour signature par le compteur et le responsable.

:::callout type="tip" title="Comptez en équipe"
Pour les gros entrepôts, comptez à deux et confrontez les chiffres avant de saisir. Ça réduit drastiquement les erreurs et les contestations.
:::

## Bonnes pratiques

:::callout type="success" title="Nos conseils"

- **Un entrepôt = un lieu physique réel** — c'est la règle d'or
- **Définissez un entrepôt par défaut** — gain de temps en caisse
- **Inventaires mensuels** dans les boutiques à fort trafic
- **Tracez tous les transferts** plutôt que de modifier directement les stocks
- **Sécurisez l'accès** aux entrepôts en limitant les rôles : tous les vendeurs n'ont pas besoin de pouvoir créer des entrepôts
  :::

## Aller plus loin

- [Mouvements de stock](/docs/documentation/inventory/stock) — entrées, sorties, ajustements
- [Caisse](/docs/documentation/inventory/pos) — sélection d'entrepôt en vente
- [Produits](/docs/documentation/inventory/products) — catalogue commun à tous les entrepôts
