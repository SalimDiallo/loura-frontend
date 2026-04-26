Le module **Paie** vous permet de verser les salaires, gérer les avances et générer les bulletins automatiquement — le tout en quelques clics.

:::video src="oJmNRXcqr18" title="Verser un salaire en 2 minutes" /:::

## Vue d'ensemble

La page Paie regroupe **deux types d'opérations** :

- **Paiements de salaires** — versements réguliers (mensuels, hebdomadaires, etc.)
- **Avances** — paiements anticipés qui seront déduits du prochain salaire

Pour chacun, vous voyez le montant, l'employé concerné, la date, le statut, et un bouton pour télécharger le justificatif PDF.

:::image src="/images/docs/payroll-overview.png" alt="Vue d'ensemble de la paie" caption="Page principale du module paie — paiements et avances regroupés." /:::

## Verser un salaire

C'est l'opération la plus fréquente. Cliquez sur **Nouveau paiement** en haut à droite.

:::steps

1. **Sélectionnez l'employé**

   La liste affiche tous vos employés actifs. Tapez les premières lettres pour filtrer rapidement.

2. **Indiquez la période concernée**

   Par exemple "Mars 2026". Cette info apparaît sur le bulletin et facilite vos audits.

3. **Saisissez le montant brut**

   Le montant sera affiché tel quel sur le bulletin. Si vous gérez les charges sociales en externe, mettez directement le net à payer.

4. **Ajoutez d'éventuelles primes ou retenues**

   Section optionnelle : prime de vente, retenue d'absence, remboursement de frais, etc. Chaque ligne aura sa propre catégorie.

5. **Validez**

   Le bulletin PDF est généré immédiatement. Vous pouvez le télécharger, l'imprimer, ou l'envoyer par email.
   :::

:::image src="/images/docs/payroll-form.png" alt="Formulaire de paiement de salaire" caption="Le formulaire de paiement — clair, avec calcul automatique du net." /:::

## Gérer les avances

Une avance est un **paiement anticipé** qui sera déduit du prochain salaire. C'est un cycle en 4 étapes :

:::steps

1. **L'employé fait sa demande**

   Soit directement dans son espace, soit vous la créez pour lui depuis `Paie → Nouvelle avance`.

2. **Vous validez ou refusez**

   Vous voyez la demande dans l'onglet **Avances** avec son motif. Vous pouvez approuver ou refuser avec un commentaire.

3. **Vous versez le montant**

   Une fois approuvée, vous marquez l'avance comme "Versée" en indiquant la date et la méthode (espèces, virement, etc.).

4. **L'avance est récupérée**

   Lors du prochain salaire, l'avance est **automatiquement déduite** du montant brut. Tout est tracé sur le bulletin.
   :::

:::callout type="tip" title="Définissez une politique d'avances"
Pour éviter les abus, fixez une règle claire (par exemple : maximum 30% du salaire mensuel, une seule avance par mois) et communiquez-la à votre équipe. LouraTech ne bloque pas automatiquement, mais affiche tout l'historique pour vous aider à décider.
:::

## Bulletins de paie

Chaque paiement génère un **bulletin PDF** avec :

- Vos informations d'employeur (logo, adresse, identifiant fiscal)
- Les informations de l'employé (nom, matricule, poste)
- La période et la date de paiement
- Le détail : brut, primes, retenues, avances déduites, net à payer
- Vos mentions légales en pied de page

:::image src="/images/docs/bulletin-example.png" alt="Exemple de bulletin de paie" caption="Un bulletin de paie LouraTech — sobre, complet, conforme." /:::

:::callout type="warning" title="Conservation légale"
Dans la plupart des pays, vous devez **conserver les bulletins de paie au moins 5 ans**. LouraTech le fait pour vous indéfiniment, mais nous recommandons d'**exporter régulièrement** une copie vers votre archivage personnel (Drive, NAS, etc.).
:::

## Bonnes pratiques

:::callout type="success" title="Pour gagner du temps"

- **Préparez les paiements en lot** en fin de mois plutôt qu'au cas par cas
- **Utilisez les périodes nommées** ("Mars 2026") plutôt que des dates pour faciliter la lecture
- **Rapprochez régulièrement** vos paiements LouraTech avec vos relevés bancaires
- **Configurez votre branding** avant d'émettre les premiers bulletins — sinon ils auront un look générique
  :::

## Aller plus loin

- [Employés](/docs/documentation/hr/employees) — créer et gérer les profils
- [Contrats](/docs/documentation/hr/contracts) — base salariale officielle
- [Congés](/docs/documentation/hr/leaves) — impact sur la paie
