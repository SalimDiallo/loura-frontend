Vos collaborateurs ont droit à des congés — payés, RTT, maladie, etc. Ce module vous aide à **suivre les soldes**, **approuver les demandes** et **éviter les conflits de planning**.

:::video src="oJmNRXcqr18" title="Gérer les congés de A à Z (4 min)" /:::

## Vue d'ensemble

La page Congés affiche :

- **Toutes les demandes** en cours (en attente, approuvées, refusées)
- Un **calendrier d'équipe** pour visualiser qui est absent quand
- Les **soldes** par employé et par type de congé

:::image src="/images/docs/leaves-overview.png" alt="Vue d'ensemble des congés" caption="Page principale des congés — demandes et calendrier en un coup d'œil." /:::

## Types de congés

Vous pouvez configurer autant de **types de congés** que vous voulez. Les plus courants :

| Type                  | Description                      | Décompté du solde  |
| --------------------- | -------------------------------- | ------------------ |
| Congés payés          | Vacances annuelles               | Oui                |
| RTT                   | Récupération du temps de travail | Oui                |
| Maladie               | Arrêt sur certificat médical     | Non (suivi à part) |
| Sans solde            | Congé non rémunéré               | Non                |
| Maternité / Paternité | Congé légal                      | Non                |

Pour ajouter un type personnalisé, allez dans `Paramètres → Congés → Types`.

## Soumettre une demande

Vos collaborateurs peuvent demander des congés depuis leur espace, ou vous pouvez le faire pour eux.

:::steps

1. **Sélectionnez l'employé**

   Si la demande vient d'un membre RH ou Admin pour un autre.

2. **Choisissez le type de congé**

   Le solde restant pour ce type s'affiche automatiquement à droite.

3. **Sélectionnez les dates**

   Date de début et date de fin. Le système calcule le **nombre de jours ouvrés** automatiquement (en excluant samedi/dimanche et les jours fériés).

4. **Ajoutez un motif (optionnel)**

   "Voyage en famille", "Mariage", etc. Utile pour le contexte mais pas obligatoire.

5. **Soumettez la demande**

   Elle apparaît avec le statut "En attente" et le responsable est notifié.
   :::

:::image src="/images/docs/leave-request-form.png" alt="Formulaire de demande de congé" caption="Demande de congé avec affichage du solde restant." /:::

:::callout type="info" title="Solde insuffisant ?"
Si le collaborateur demande plus de jours qu'il n'en a, le système le bloque avec un message clair. Pour autoriser malgré tout, l'admin peut activer "Autoriser le solde négatif" dans les paramètres — utile en cas d'avance exceptionnelle.
:::

## Approuver ou refuser

En tant que responsable, vous voyez toutes les demandes en attente sur votre tableau de bord ou dans la liste des congés.

:::steps

1. **Ouvrez la demande**

   Cliquez sur la ligne pour voir tous les détails : employé, dates, type, motif, jours décomptés.

2. **Vérifiez l'impact sur l'équipe**

   Le calendrier en bas montre si d'autres membres sont déjà absents sur la même période — pratique pour anticiper les manques d'effectifs.

3. **Décidez**
   - **Approuver** → le solde est décrémenté, l'employé est notifié, la demande apparaît dans le calendrier d'équipe
   - **Refuser** → ajoutez un commentaire pour expliquer (recommandé), l'employé est notifié
     :::

:::callout type="warning" title="Une approbation est définitive"
Une fois approuvée, la demande ne peut être annulée que par l'employé lui-même. Si vous changez d'avis, demandez-lui de retirer sa demande.
:::

## Soldes et compteurs

Allez dans `Congés → Soldes` pour voir un **tableau récapitulatif** par employé et par type :

:::image src="/images/docs/leaves-balances.png" alt="Tableau des soldes" caption="Soldes de congés — visualisation rapide des reliquats." /:::

Pour chaque employé, vous voyez :

- **Acquis** — total accumulé sur l'année
- **Pris** — déjà consommé
- **En attente** — réservé par des demandes pas encore approuvées
- **Reste** — disponible pour de nouvelles demandes

### Initialiser les soldes

En début d'année, allez dans **Soldes → Initialiser** pour créditer chaque employé :

- Choisissez le type de congé
- Saisissez le nombre de jours à ajouter
- Sélectionnez les employés concernés (ou tout le monde)

:::callout type="tip" title="Automatisez les soldes mensuels"
Pour les congés payés français (2,5 jours/mois), activez l'**accumulation automatique** : `Paramètres → Congés → Accumulation`. Le solde sera incrémenté chaque mois sans intervention de votre part.
:::

## Calendrier d'équipe

Onglet **Calendrier** : une vue mensuelle qui affiche **toutes les absences** de votre équipe, par couleur selon le type.

:::image src="/images/docs/leaves-calendar.png" alt="Calendrier d'équipe" caption="Le calendrier d'équipe — anticipez les manques d'effectifs." /:::

Filtrez par département pour les grandes équipes, ou exportez en PDF pour l'afficher en salle de pause.

## Bonnes pratiques

:::callout type="success" title="Nos conseils"

- **Configurez les jours fériés** locaux dans les paramètres — sinon ils seront comptés comme des jours travaillés
- **Validez sous 48h** maximum pour respecter vos collaborateurs
- **Utilisez le calendrier** lors de vos réunions d'équipe pour planifier les remplacements
- **Faites le bilan annuel** en décembre pour reporter les soldes non consommés (selon votre politique)
  :::

## Aller plus loin

- [Employés](/docs/documentation/hr/employees) — fiches individuelles
- [Paie](/docs/documentation/hr/payroll) — impact des congés sur le salaire
