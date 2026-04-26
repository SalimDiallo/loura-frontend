Quelques notions à comprendre une bonne fois pour toutes — et tout le reste deviendra évident. Pas de jargon technique, juste des **mots clés** que vous croiserez partout dans l'application.

## L'organisation, votre espace de travail

Une **organisation** correspond à votre entreprise. C'est l'unité principale dans LouraTech : tout y est rattaché — vos employés, vos ventes, vos clients, vos produits.

:::callout type="info" title="Une personne = plusieurs organisations possibles"
Si vous gérez plusieurs structures (par exemple une boutique en France et une au Sénégal), vous pouvez créer **une organisation pour chacune**. Un sélecteur en haut de l'écran vous permet de basculer entre elles. Les données restent **complètement séparées**.
:::

:::image src="/images/docs/org-switcher.png" alt="Sélecteur d'organisations" caption="Le sélecteur d'organisation — bascule rapide entre vos différents espaces." /:::

## Membre, employé : quelle différence ?

C'est subtil mais utile à comprendre :

| Terme           | Définition                                         | Exemple                                   |
| --------------- | -------------------------------------------------- | ----------------------------------------- |
| **Utilisateur** | Compte LouraTech (un email, un mot de passe)       | "Aïssa Diallo, aissa@gmail.com"           |
| **Membre**      | Un utilisateur qui appartient à votre organisation | Aïssa, en tant que membre de "Boutique X" |
| **Employé**     | Un membre rattaché à un poste avec un contrat      | Aïssa, "Vendeuse senior", contrat CDI     |

:::callout type="tip" title="Tous les membres ne sont pas employés"
Vous pouvez inviter un **comptable externe** ou un **consultant** comme membre, sans pour autant en faire un employé. Pratique pour donner un accès limité à des personnes qui ne font pas partie de votre équipe permanente.
:::

## Les rôles : qui peut faire quoi

Chaque membre a **un rôle** qui définit ce qu'il peut voir et modifier dans l'application.

LouraTech propose des rôles standards :

- **Owner (Propriétaire)** — le créateur, accès total, ne peut pas être supprimé
- **Admin** — gère tout sauf les paramètres critiques de l'organisation
- **RH** — peut gérer les employés, contrats, paie et congés
- **Vendeur** — accès à la caisse et aux produits, lecture seule sur le reste
- **Comptable** — accès à la paie et aux rapports financiers en lecture

:::callout type="success" title="Vous pouvez créer vos propres rôles"
Si les rôles standards ne correspondent pas à votre organisation, créez le vôtre. Cochez précisément les permissions souhaitées et donnez-lui un nom parlant : "Responsable boutique", "Stagiaire", etc.
:::

:::video src="oJmNRXcqr18" title="Comprendre et personnaliser les rôles (4 min)" /:::

## Les modules

L'application est découpée en **modules** : ce sont les grandes catégories de fonctionnalités que vous voyez dans la barre latérale.

### Ressources humaines

Tout ce qui concerne **votre équipe** :

- Départements et postes
- Liste des employés et leurs fiches
- Contrats de travail
- Paie (salaires, primes, avances)
- Congés (demandes, soldes, calendrier)

### Stocks & ventes

Tout ce qui concerne **votre activité commerciale** :

- Caisse rapide pour encaisser
- Catalogue produits avec prix et stock
- Entrepôts (vos sites de stockage)
- Mouvements de stock (entrées, sorties)
- Ventes, factures, devis, créances
- Clients et fournisseurs
- Alertes (rupture, seuil bas)
- Rapports

### Paramètres

Configuration de votre organisation :

- Informations générales
- Branding (logo, mentions légales)
- Rôles et permissions

:::image src="/images/docs/sidebar-modules.png" alt="Barre latérale avec les modules" caption="La barre latérale : les modules sont regroupés et collapsibles." /:::

## Les documents

LouraTech génère **automatiquement des documents PDF professionnels** pour la plupart de vos opérations. Vous n'avez rien à faire, ils apparaissent à chaque action :

| Action                  | Document généré      |
| ----------------------- | -------------------- |
| Encaisser une vente     | Facture              |
| Créer un devis          | Devis / Pro forma    |
| Recevoir un acompte     | Reçu de paiement     |
| Embaucher un employé    | Contrat de travail   |
| Verser un salaire       | Bulletin de paie     |
| Inventorier un entrepôt | Rapport d'inventaire |

Tous les documents reprennent **votre logo, vos couleurs et vos mentions légales** — vous gagnez un temps fou et restez 100% pro.

## Le cycle d'une vente, de bout en bout

Pour ancrer tout ça, voici comment les concepts se mettent en mouvement quand vous faites une vente :

:::steps

1. **Un client se présente**

   Vous le sélectionnez dans votre base (ou en créez un nouveau s'il vient pour la première fois).

2. **Vous ajoutez ses articles**

   Depuis la caisse, vous cliquez sur les produits, ajustez les quantités. Le système vérifie en direct le stock disponible dans l'entrepôt sélectionné.

3. **Vous encaissez**

   Choisissez la méthode (comptant, crédit, mixte), confirmez. La facture PDF est générée automatiquement.

4. **Le stock se met à jour**

   Un mouvement de sortie est créé automatiquement, votre catalogue reflète immédiatement le nouveau niveau de stock.

5. **Si crédit : une créance est suivie**

   Le module Créances vous montre tout ce qui reste à encaisser, par client.

6. **Le rapport mensuel s'enrichit**

   Vos rapports de vente intègrent automatiquement cette transaction.
   :::

Vous voyez : tout est **connecté**, vous n'avez pas à reporter manuellement les informations entre les modules.

## Et maintenant ?

Vous avez les bases conceptuelles. Pour passer à la pratique, choisissez un module :

- [Module Employés](/docs/documentation/hr/employees) — votre équipe au quotidien
- [Module Caisse](/docs/documentation/inventory/pos) — encaisser des ventes
- [Module Produits](/docs/documentation/inventory/products) — votre catalogue

Ou revenez au [démarrage rapide](/docs/documentation/quickstart) si vous n'avez pas encore créé votre organisation.
