import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/ui/Logo';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-6">
          <Logo showTitle className="flex items-center gap-2" />
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border border-border hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-4xl px-6 py-12">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-muted-foreground">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold mt-8">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                LouraTech s'engage à protéger la vie privée de ses utilisateurs. Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles conformément au Règlement Général sur la Protection des Données (RGPD).
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold mt-8">2. Responsable du traitement</h2>
              <p className="text-muted-foreground leading-relaxed">
                Le responsable du traitement des données est LouraTech, joignable à l'adresse : privacy@louratech.com
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold mt-8">3. Données collectées</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous collectons les types de données suivants :
              </p>

              <h3 className="text-xl font-semibold mt-6">3.1 Données d'identification</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Mot de passe (crypté)</li>
                <li>Type d'utilisateur (admin, employé)</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">3.2 Données d'utilisation</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Logs de connexion</li>
                <li>Adresse IP</li>
                <li>Type de navigateur et système d'exploitation</li>
                <li>Pages visitées et temps passé sur la plateforme</li>
                <li>Actions effectuées sur la plateforme</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6">3.3 Données d'entreprise</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Nom de l'organisation</li>
                <li>Informations de contact de l'entreprise</li>
                <li>Données métier saisies dans la plateforme</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold mt-8">4. Finalités du traitement</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vos données personnelles sont collectées et traitées pour les finalités suivantes :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Création et gestion de votre compte utilisateur</li>
                <li>Fourniture des services de la plateforme</li>
                <li>Amélioration de nos services et développement de nouvelles fonctionnalités</li>
                <li>Communication avec vous concernant votre compte ou nos services</li>
                <li>Respect de nos obligations légales</li>
                <li>Sécurité et prévention de la fraude</li>
                <li>Analyses statistiques et études d'usage</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold mt-8">5. Base légale du traitement</h2>
              <p className="text-muted-foreground leading-relaxed">
                Le traitement de vos données personnelles repose sur :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Le contrat :</strong> l'exécution du contrat de service entre vous et LouraTech</li>
                <li><strong>L'intérêt légitime :</strong> l'amélioration de nos services et la sécurité de la plateforme</li>
                <li><strong>Le consentement :</strong> pour certaines communications marketing (avec possibilité de retrait)</li>
                <li><strong>L'obligation légale :</strong> pour respecter nos obligations légales et réglementaires</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold mt-8">6. Partage des données</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous ne vendons pas vos données personnelles. Nous pouvons partager vos données avec :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Membres de votre organisation :</strong> selon les permissions définies</li>
                <li><strong>Prestataires de services :</strong> hébergement, analyse, support client (sous contrat strict de confidentialité)</li>
                <li><strong>Autorités légales :</strong> si requis par la loi ou pour protéger nos droits</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold mt-8">7. Durée de conservation</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous conservons vos données personnelles :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Données de compte :</strong> pendant toute la durée de votre utilisation du service, puis 3 ans après la fermeture du compte</li>
                <li><strong>Données de facturation :</strong> 10 ans conformément aux obligations légales</li>
                <li><strong>Logs de connexion :</strong> 12 mois maximum</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold mt-8">8. Sécurité des données</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Chiffrement SSL/TLS pour toutes les communications</li>
                <li>Chiffrement des mots de passe avec des algorithmes robustes</li>
                <li>Contrôles d'accès stricts aux données</li>
                <li>Surveillance et audits de sécurité réguliers</li>
                <li>Sauvegardes régulières et sécurisées</li>
                <li>Formation du personnel sur la protection des données</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold mt-8">9. Vos droits</h2>
              <p className="text-muted-foreground leading-relaxed">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> corriger vos données inexactes ou incomplètes</li>
                <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données (sous certaines conditions)</li>
                <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
                <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible</li>
                <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                <li><strong>Droit de retirer votre consentement :</strong> à tout moment pour les traitements basés sur le consentement</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Pour exercer ces droits, contactez-nous à : privacy@louratech.com
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold mt-8">10. Cookies et technologies similaires</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous utilisons des cookies et technologies similaires pour :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement de la plateforme (authentification, sécurité)</li>
                <li><strong>Cookies de performance :</strong> pour analyser l'utilisation et améliorer nos services</li>
                <li><strong>Cookies de préférence :</strong> pour mémoriser vos choix (langue, thème)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold mt-8">11. Transferts internationaux</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vos données sont hébergées au sein de l'Union Européenne. Si un transfert hors UE s'avère nécessaire, nous nous assurerons que des garanties appropriées sont en place conformément au RGPD.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold mt-8">12. Modifications de la politique</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous pouvons modifier cette politique de confidentialité pour refléter les changements de nos pratiques ou pour des raisons légales. Nous vous informerons de tout changement important par email ou via la plateforme.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold mt-8">13. Contact et réclamation</h2>
              <p className="text-muted-foreground leading-relaxed">
                Pour toute question concernant cette politique ou pour exercer vos droits :
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Email : privacy@louratech.com</li>
                <li>Délégué à la Protection des Données : dpo@louratech.com</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                Vous avez également le droit de déposer une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL) si vous estimez que vos droits ne sont pas respectés.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background">
        <div className="container px-6 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} LouraTech. Tous droits réservés.
            </p>
            <div className="flex gap-6">
              <Link
                href="/docs/legals/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                CGU
              </Link>
              <Link
                href="/docs/legals/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
