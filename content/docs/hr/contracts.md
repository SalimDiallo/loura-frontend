Centralisez **tous les contrats de travail** de votre équipe : CDI, CDD, stages, freelances. LouraTech génère les PDF automatiquement, vous garde un historique propre, et vous alerte avant les expirations.

:::video src="oJmNRXcqr18" title="Créer son premier contrat de travail (3 min)" /:::

## Vue d'ensemble

La page Contrats liste tous les contrats actifs, expirés et résiliés. Pour chacun, vous voyez :

- L'**employé** concerné
- Le **type** (CDI, CDD, stage…)
- Les **dates** de début et de fin
- Le **statut** (Brouillon, Actif, Expiré, Résilié)
- Un bouton pour télécharger le **PDF**

:::image src="/images/docs/contracts-list.png" alt="Liste des contrats" caption="La liste des contrats avec filtres par statut et type." /:::

## Créer un contrat

Cliquez sur **Nouveau contrat** en haut à droite.

:::steps

1. **Sélectionnez l'employé**

   Si la personne n'a pas encore été invitée, allez d'abord dans `Employés → Inviter`.

2. **Choisissez le type de contrat**
   - **CDI** — durée indéterminée
   - **CDD** — durée déterminée, dates obligatoires
   - **Stage** — convention spécifique
   - **Freelance** — prestation ponctuelle ou récurrente
   - **Autre** — type personnalisé

3. **Renseignez les dates**

   Date de début obligatoire. Date de fin pour les CDD/Stages. Pour les CDI, la fin reste vide jusqu'à éventuelle résiliation.

4. **Indiquez le poste et la rémunération**

   Le poste vient de votre catalogue (`Postes`). La rémunération sert de base aux bulletins de paie.

5. **Période d'essai (optionnel)**

   Très recommandé pour les CDI. Indiquez la durée (en mois) et la possibilité de renouvellement.

6. **Clauses spécifiques**

   Champ libre pour les clauses particulières (non-concurrence, mobilité, exclusivité…).

7. **Validez**

   Le PDF est généré automatiquement avec votre branding et toutes les mentions légales standards.
   :::

:::image src="/images/docs/contract-form.png" alt="Formulaire de création de contrat" caption="Création d'un contrat — tous les champs essentiels en une page." /:::

## Statuts d'un contrat

```
Brouillon → Actif → Expiré
                  ↘ Résilié
```

| Statut        | Signification                                                                   |
| ------------- | ------------------------------------------------------------------------------- |
| **Brouillon** | Créé mais non finalisé — modifiable, pas de PDF officiel                        |
| **Actif**     | En cours de validité — PDF émis, employé notifié                                |
| **Expiré**    | CDD arrivé à échéance sans renouvellement                                       |
| **Résilié**   | Terminé avant la date prévue (démission, licenciement, rupture conventionnelle) |

:::callout type="info" title="Un contrat actif n'est pas modifiable"
Pour préserver la valeur juridique du document, un contrat actif ne peut plus être modifié. Si vous devez ajuster quelque chose, créez un **avenant**.
:::

## Avenants

Un **avenant** est une modification d'un contrat existant : changement de poste, augmentation, passage à temps partiel, etc.

:::steps

1. Ouvrez le contrat à modifier
2. Cliquez sur **Créer un avenant**
3. Indiquez ce qui change (poste, rémunération, horaires…)
4. Datez la prise d'effet
5. Validez — un PDF d'avenant est généré, lié au contrat principal
   :::

:::callout type="tip" title="L'historique reste visible"
Le contrat initial et tous ses avenants restent accessibles. Vous voyez l'évolution complète de la relation contractuelle, ce qui est très utile en cas d'audit ou de contentieux.
:::

## Renouvellement des CDD

Pour ne jamais oublier une fin de CDD, LouraTech vous envoie une **alerte 30 jours avant l'échéance** par email.

Vous avez alors trois options :

:::steps

1. **Renouveler en nouveau CDD**

   Bouton "Renouveler" → un nouveau contrat est créé avec les mêmes paramètres et de nouvelles dates.

2. **Convertir en CDI**

   Bouton "Convertir en CDI" → un avenant transforme le contrat en CDI, sans interruption.

3. **Laisser expirer**

   Aucune action — le contrat passera automatiquement en statut "Expiré" à la date de fin.
   :::

:::callout type="warning" title="Respectez le délai de carence"
Dans plusieurs pays (France notamment), un délai légal doit s'écouler entre deux CDD sur le même poste. Renseignez-vous selon votre juridiction avant un renouvellement.
:::

## Résilier un contrat

Pour terminer un contrat avant son échéance :

:::steps

1. Ouvrez le contrat
2. Cliquez sur **Résilier**
3. Choisissez le motif (démission, rupture conventionnelle, fin de période d'essai, licenciement…)
4. Indiquez la date effective
5. Ajoutez un commentaire si besoin
6. Confirmez
   :::

Un **document de fin de contrat** est généré automatiquement et l'employé est notifié.

## Bonnes pratiques

:::callout type="success" title="Nos conseils"

- **Toujours saisir la période d'essai** pour les CDI — c'est plus simple à gérer dès le début
- **Numérotez vos contrats** (CDI-2026-001, CDD-2026-001…) pour faciliter les audits
- **Conservez les pièces jointes** — vous pouvez attacher la copie scannée du contrat signé manuellement
- **Utilisez les avenants** plutôt que de créer de nouveaux contrats — la traçabilité est meilleure
- **Vérifiez les alertes de fin** chaque semaine en consultant la liste filtrée par "Expire bientôt"
  :::

## Aller plus loin

- [Employés](/docs/documentation/hr/employees) — fiches employés et historique
- [Paie](/docs/documentation/hr/payroll) — base salariale issue du contrat
