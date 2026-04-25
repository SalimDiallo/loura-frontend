
export default function PrivacyPage() {
  return (
    <main className="flex-1 flex items-center justify-center">
    <div className="container max-w-4xl px-6 py-12 flex flex-col justify-center items-center w-full">
      <div className="space-y-8 w-full">
        <div className="">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Politique de Confidentialité
          </h1>
          <p className="text-muted-foreground">
            Dernière mise à jour :{' '}
            {new Date().toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none mx-auto ">
          {/* ... all the sections remain unchanged ... */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              LouraTech s&apos;engage à respecter et à protéger la vie privée de ses utilisateurs. Cette politique de confidentialité détaille notre façon de collecter, d&apos;utiliser, de partager et de sécuriser vos informations personnelles, en se conformant rigoureusement au Règlement Général sur la Protection des Données (RGPD).
            </p>
          </section>

          <section className="space-y-4 ">
            <h2 className="text-2xl font-semibold mt-8">2. Responsable du traitement</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le responsable du traitement des données est LouraTech, joignable à l&apos;adresse : <a href="mailto:privacy@louratech.com" className="underline">privacy@louratech.com</a>
            </p>
          </section>

          <section className="space-y-4 ">
            <h2 className="text-2xl font-semibold mt-8">3. Données collectées</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous collectons les types de données suivants :
            </p>

            <h3 className="text-xl font-semibold mt-6">3.1 Données d&apos;identification</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-left inline-block">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Mot de passe (crypté)</li>
              <li>Type d&apos;utilisateur (admin, employé)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">3.2 Données d&apos;utilisation</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-left inline-block">
              <li>Logs de connexion</li>
              <li>Adresse IP</li>
              <li>Type de navigateur et système d&apos;exploitation</li>
              <li>Pages visitées et temps passé sur la plateforme</li>
              <li>Actions effectuées sur la plateforme</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">3.3 Données d&apos;entreprise</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-left inline-block">
              <li>Nom de l&apos;organisation</li>
              <li>Informations de contact de l&apos;entreprise</li>
              <li>Données métier saisies dans la plateforme</li>
            </ul>
          </section>

          <section className="space-y-4 ">
            <h2 className="text-2xl font-semibold mt-8">4. Finalités du traitement</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vos données personnelles sont collectées et traitées pour les finalités suivantes :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-left inline-block">
              <li>Création et gestion de votre compte utilisateur</li>
              <li>Fourniture des services de la plateforme</li>
              <li>Amélioration de nos services et développement de nouvelles fonctionnalités</li>
              <li>Communication avec vous concernant votre compte ou nos services</li>
              <li>Respect de nos obligations légales</li>
              <li>Sécurité et prévention de la fraude</li>
              <li>Analyses statistiques et études d&apos;usage</li>
            </ul>
          </section>

          <section className="space-y-4 ">
            <h2 className="text-2xl font-semibold mt-8">5. Base légale du traitement</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le traitement de vos données personnelles repose sur :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-left inline-block">
              <li><strong>Le contrat :</strong> l&apos;exécution du contrat de service entre vous et LouraTech</li>
              <li><strong>L&apos;intérêt légitime :</strong> l&apos;amélioration de nos services et la sécurité de la plateforme</li>
              <li><strong>Le consentement :</strong> pour certaines communications marketing (avec possibilité de retrait)</li>
              <li><strong>L&apos;obligation légale :</strong> pour respecter nos obligations légales et réglementaires</li>
            </ul>
          </section>

          <section className="space-y-4 ">
            <h2 className="text-2xl font-semibold mt-8">6. Partage des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous ne vendons pas vos données personnelles. Nous pouvons partager vos données avec :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-left inline-block">
              <li><strong>Membres de votre organisation :</strong> selon les permissions définies</li>
              <li><strong>Prestataires de services :</strong> hébergement, analyse, support client (sous contrat strict de confidentialité)</li>
              <li><strong>Autorités légales :</strong> si requis par la loi ou pour protéger nos droits</li>
            </ul>
          </section>

          <section className="space-y-4 ">
            <h2 className="text-2xl font-semibold mt-8">7. Durée de conservation</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous conservons vos données personnelles :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-left inline-block">
              <li><strong>Données de compte :</strong> pendant toute la durée de votre utilisation du service, puis 3 ans après la fermeture du compte</li>
              <li><strong>Données de facturation :</strong> 10 ans conformément aux obligations légales</li>
              <li><strong>Logs de connexion :</strong> 12 mois maximum</li>
            </ul>
          </section>

          <section className="space-y-4 ">
            <h2 className="text-2xl font-semibold mt-8">8. Sécurité des données</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-left inline-block">
              <li>Chiffrement SSL/TLS pour toutes les communications</li>
              <li>Chiffrement des mots de passe avec des algorithmes robustes</li>
              <li>Contrôles d&apos;accès stricts aux données</li>
              <li>Surveillance et audits de sécurité réguliers</li>
              <li>Sauvegardes régulières et sécurisées</li>
              <li>Formation du personnel sur la protection des données</li>
            </ul>
          </section>

          <section className="space-y-4 ">
            <h2 className="text-2xl font-semibold mt-8">9. Vos droits</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-left inline-block">
              <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> corriger vos données inexactes ou incomplètes</li>
              <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données (sous certaines conditions)</li>
              <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible</li>
              <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos données</li>
              <li><strong>Droit de retirer votre consentement :</strong> à tout moment pour les traitements basés sur le consentement</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Pour exercer ces droits, contactez-nous à : <a href="mailto:privacy@louratech.com" className="underline">privacy@louratech.com</a>
            </p>
          </section>

          <section className="space-y-4 ">
            <h2 className="text-2xl font-semibold mt-8">10. Cookies et technologies similaires</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous utilisons des cookies et technologies similaires pour :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-left inline-block">
              <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement de la plateforme (authentification, sécurité)</li>
              <li><strong>Cookies de performance :</strong> pour analyser l&apos;utilisation et améliorer nos services</li>
              <li><strong>Cookies de préférence :</strong> pour mémoriser vos choix (langue, thème)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Vous pouvez gérer vos préférences de cookies via les paramètres de votre navigateur.
            </p>
          </section>

          <section className="space-y-4 ">
            <h2 className="text-2xl font-semibold mt-8">11. Transferts internationaux</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vos données sont hébergées au sein de l&apos;Union Européenne. Si un transfert hors UE s&apos;avère nécessaire, nous nous assurerons que des garanties appropriées sont en place conformément au RGPD.
            </p>
          </section>

          <section className="space-y-4 ">
            <h2 className="text-2xl font-semibold mt-8">12. Modifications de la politique</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nous pouvons modifier cette politique de confidentialité pour refléter les changements de nos pratiques ou pour des raisons légales. Nous vous informerons de tout changement important par email ou via la plateforme.
            </p>
          </section>

          <section className="space-y-4 ">
            <h2 className="text-2xl font-semibold mt-8">13. Contact et réclamation</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question concernant cette politique ou pour exercer vos droits :
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground text-left inline-block">
              <li>Email : <a href="mailto:privacy@louratech.com" className="underline">privacy@louratech.com</a></li>
              <li>Délégué à la Protection des Données : <a href="mailto:dpo@louratech.com" className="underline">dpo@louratech.com</a></li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Vous avez également le droit de déposer une réclamation auprès de la Commission Nationale de l&apos;Informatique et des Libertés (CNIL) si vous estimez que vos droits ne sont pas respectés.
            </p>
          </section>
        </div>
      </div>
    </div>
  </main>
  );
}
