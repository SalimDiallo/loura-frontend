import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="flex-1 flex items-center justify-center">
        <div className="container max-w-4xl px-6 py-12 flex flex-col justify-center items-center w-full">
          <div className="space-y-8 w-full">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-4">
                Conditions Générales d&apos;Utilisation
              </h1>
              <p className="text-muted-foreground">
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            <div className="prose prose-neutral dark:prose-invert max-w-none mx-auto">
              <section className="space-y-4">
                <h2 className="text-2xl font-semibold mt-8">1. Objet</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Les présentes Conditions Générales d&apos;Utilisation (CGU) ont pour objet de définir les modalités et conditions d&apos;utilisation de la plateforme LouraTech, ainsi que les droits et obligations des utilisateurs.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold mt-8">2. Acceptation des conditions</h2>
                <p className="text-muted-foreground leading-relaxed">
                  L&apos;utilisation de la plateforme LouraTech implique l&apos;acceptation pleine et entière des présentes CGU. Si vous n&apos;acceptez pas ces conditions, vous ne devez pas utiliser ce service.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold mt-8">3. Inscription et compte utilisateur</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pour accéder aux services de LouraTech, vous devez créer un compte en fournissant des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toutes les activités effectuées sous votre compte.
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Vous devez être âgé d&apos;au moins 18 ans pour créer un compte</li>
                  <li>Vous devez fournir des informations exactes et complètes</li>
                  <li>Vous êtes responsable de la sécurité de votre mot de passe</li>
                  <li>Vous devez nous informer immédiatement de toute utilisation non autorisée de votre compte</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold mt-8">4. Services proposés</h2>
                <p className="text-muted-foreground leading-relaxed">
                  LouraTech propose une plateforme de gestion d&apos;entreprise permettant notamment :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>La gestion multi-entreprises</li>
                  <li>La gestion d&apos;équipes</li>
                  <li>Des tableaux de bord en temps réel</li>
                  <li>Des fonctionnalités de sécurité avancées</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold mt-8">5. Obligations de l&apos;utilisateur</h2>
                <p className="text-muted-foreground leading-relaxed">
                  En utilisant LouraTech, vous vous engagez à :
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Respecter les lois et règlements en vigueur</li>
                  <li>Ne pas porter atteinte aux droits de tiers</li>
                  <li>Ne pas utiliser le service à des fins illégales ou frauduleuses</li>
                  <li>Ne pas tenter d&apos;accéder de manière non autorisée au système ou aux données d&apos;autres utilisateurs</li>
                  <li>Ne pas diffuser de contenu inapproprié, offensant ou illégal</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold mt-8">6. Propriété intellectuelle</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Tous les éléments de la plateforme LouraTech (textes, graphismes, logos, icônes, images, clips audio et vidéo, téléchargements, données) sont la propriété exclusive de LouraTech ou de ses concédants de licence et sont protégés par les lois françaises et internationales sur la propriété intellectuelle.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold mt-8">7. Protection des données personnelles</h2>
                <p className="text-muted-foreground leading-relaxed">
                  LouraTech s&apos;engage à protéger vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD). Pour plus d&apos;informations, veuillez consulter notre{' '}
                  <Link href="/docs/legals/privacy" className="text-primary hover:underline">
                    Politique de Confidentialité
                  </Link>.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold mt-8">8. Limitation de responsabilité</h2>
                <p className="text-muted-foreground leading-relaxed">
                  LouraTech ne saurait être tenu responsable des dommages directs ou indirects résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser la plateforme. Nous nous efforçons de maintenir la disponibilité du service, mais ne garantissons pas un accès ininterrompu.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold mt-8">9. Résiliation</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Vous pouvez résilier votre compte à tout moment. LouraTech se réserve le droit de suspendre ou de résilier votre accès en cas de violation des présentes CGU.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold mt-8">10. Modifications des CGU</h2>
                <p className="text-muted-foreground leading-relaxed">
                  LouraTech se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification importante. L&apos;utilisation continue du service après ces modifications vaut acceptation des nouvelles conditions.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold mt-8">11. Droit applicable et juridiction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Les présentes CGU sont régies par le droit français. Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence exclusive des tribunaux français.
                </p>
              </section>

              <section className="space-y-4">
                <h2 className="text-2xl font-semibold mt-8">12. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Pour toute question concernant ces CGU, vous pouvez nous contacter à l&apos;adresse suivante : legal@louratech.com
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
  );
}
