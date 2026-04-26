Tout ce qui fait **bouger votre stock** est tracé ici : marchandises reçues, casses, pertes, ajustements après inventaire. C'est votre **journal de bord** pour comprendre comment et pourquoi votre stock évolue.

:::video src="oJmNRXcqr18" title="Maîtriser les mouvements de stock (5 min)" /:::

## Les 4 types de mouvements

| Type           | Quand l'utiliser                               | Effet sur le stock                    |
| -------------- | ---------------------------------------------- | ------------------------------------- |
| **Entrée**     | Réception fournisseur, retour client, don reçu | Augmente                              |
| **Sortie**     | Perte, casse, vol, don offert                  | Diminue                               |
| **Ajustement** | Correction après inventaire physique           | Augmente ou diminue                   |
| **Transfert**  | Déplacement entre deux de vos entrepôts        | Diminue source / augmente destination |

:::callout type="info" title="Les ventes sont automatiques"
Vos ventes en caisse créent **automatiquement** des mouvements de sortie. Vous n'avez **rien à saisir manuellement** — c'est tracé en arrière-plan.
:::

## Vue d'ensemble

La page Mouvements liste toutes les variations chronologiquement, du plus récent au plus ancien.

:::image src="/images/docs/movements-list.png" alt="Liste des mouvements de stock" caption="Liste chronologique avec type, statut et entrepôt." /:::

Vous pouvez **filtrer** par type, par statut, par entrepôt ou par produit, et **rechercher** par référence.

## Le workflow Brouillon → Validé

Chaque mouvement passe par deux états :

```
Brouillon → Validé (irréversible)
         ↘ Annulé
```

### Brouillon

- Modifiable et supprimable
- **N'impacte pas** encore le stock
- Utile pour préparer une réception en plusieurs fois

### Validé

- **Impacte le stock immédiatement**
- Plus modifiable (on préserve la traçabilité)
- Peut être **annulé** (création d'un mouvement inverse)

:::callout type="tip" title="Brouillon, c'est votre brouillon"
Si vous recevez un gros stock en plusieurs livraisons sur la journée, créez un mouvement brouillon, ajoutez les produits au fur et à mesure, validez à la fin. Vous évitez les erreurs et n'impactez le stock qu'en une fois.
:::

## Créer un mouvement

Cliquez sur **Nouveau mouvement** en haut à droite.

:::steps

1. **Choisissez le type**

   Entrée, Sortie ou Ajustement (les transferts ont leur propre formulaire dédié).

2. **Sélectionnez l'entrepôt concerné**

   L'entrepôt dont le stock va varier.

3. **Ajoutez les produits**

   Pour chacun, indiquez la quantité. Pour un ajustement, indiquez la quantité **d'écart** (positive pour ajouter, négative pour retirer).

4. **Renseignez le motif**

   Texte libre mais important pour la traçabilité : "Réception fournisseur ABC", "Casse présentoir vitrine", "Don à association XYZ"…

5. **Pièce jointe (optionnel)**

   Vous pouvez attacher un PDF (bon de livraison fournisseur, photo de la casse, etc.).

6. **Validez ou enregistrez en brouillon**
   - **Brouillon** → préparation, pas d'impact stock
   - **Valider** → impact immédiat
     :::

:::image src="/images/docs/movement-form.png" alt="Formulaire de mouvement" caption="Création d'un mouvement multi-produits." /:::

## Annuler un mouvement validé

Vous avez fait une erreur sur un mouvement déjà validé ? Vous pouvez l'**annuler** :

→ Bouton **Annuler** sur la fiche du mouvement

LouraTech ne supprime pas le mouvement (pour la traçabilité), il crée un **mouvement inverse** qui rétablit le stock comme avant.

:::callout type="warning" title="Pas de suppression possible"
Une fois validé, un mouvement reste dans l'historique pour toujours. C'est volontaire : ça garantit que votre stock théorique correspond toujours à la somme de tous les mouvements. C'est aussi nécessaire pour les audits comptables.
:::

## Inventaire physique

Pour rapprocher votre **stock théorique** (ce que dit LouraTech) de votre **stock réel** (ce que vous avez physiquement) :

:::steps

1. Allez dans `Stocks → Inventaires physiques → Nouveau`
2. Choisissez l'**entrepôt** à inventorier
3. Sélectionnez les produits à compter (ou tous)
4. **Imprimez la fiche de comptage** avec les quantités théoriques masquées
5. Faites le tour de l'entrepôt et **comptez physiquement**
6. Saisissez les **quantités comptées** dans LouraTech
7. Le système affiche les **écarts** automatiquement
8. Validez l'inventaire — les **ajustements sont créés en lot**
   :::

:::image src="/images/docs/physical-inventory.png" alt="Écran d'inventaire physique" caption="Inventaire avec écarts mis en évidence." /:::

Un **PDF récapitulatif** est généré pour signature par le compteur et le responsable du stock.

:::callout type="tip" title="Comptez sans regarder le théorique"
La fiche de comptage masque volontairement les quantités attendues. C'est important : sinon, le compteur a tendance à inscrire la quantité théorique sans vraiment vérifier. L'écart aveugle vous donne une image fidèle de la réalité.
:::

## Surveiller les écarts

Si vos inventaires révèlent **régulièrement des écarts importants**, c'est un signal :

- **Pertes / vols** non déclarés
- **Erreurs de saisie** lors des entrées
- **Manque de rigueur** dans les sorties (échantillons, dons non tracés)

Faites une réunion d'équipe pour identifier la cause et corriger les processus.

## Bonnes pratiques

:::callout type="success" title="Nos conseils"

- **Toujours saisir un motif** — c'est ce qui rend l'historique exploitable
- **Inventaires mensuels** dans les boutiques à fort trafic, **trimestriels** ailleurs
- **Pièces jointes systématiques** pour les entrées importantes (bons fournisseurs)
- **Annulez plutôt que de "corriger"** — la traçabilité prime sur la propreté apparente
- **Audit annuel** : exportez tous les mouvements et croisez avec votre comptabilité
  :::

## Aller plus loin

- [Entrepôts](/docs/documentation/inventory/warehouses) — gestion des sites
- [Produits](/docs/documentation/inventory/products) — activation du suivi de stock
- [Caisse](/docs/documentation/inventory/pos) — ventes (qui créent des mouvements automatiques)
