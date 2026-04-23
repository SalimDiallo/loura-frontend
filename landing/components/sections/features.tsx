import Features from "@/landing/components/features-horizontal";
import Section from "@/landing/components/section";
import { Building2, FileEdit, Layers, UserPlus2 } from "lucide-react";

const data = [
  {
    id: 1,
    title: "Créer une organisation",
    content:
      "Démarrez en quelques clics : nom, informations, configuration de base de votre entreprise sur Loura.",
    image: "/images/landing/organisation.png",
    icon: <Building2 className="h-6 w-6 text-primary" />,
  },
  {
    id: 2,
    title: "Ajouter des employés",
    content:
      "Ajoutez rapidement vos collaborateurs et renseignez leurs postes, contacts, contrats et accès.",
    image: "/images/landing/employees.png",
    icon: <UserPlus2 className="h-6 w-6 text-primary" />,
  },
  {
    id: 3,
    title: "Gérer la paie et les congés",
    content:
      "Automatisez la paie, suivez les absences et obtenez un résumé clair des soldes de congés.",
    image: "/images/landing/paie.png",
    icon: <Layers className="h-6 w-6 text-primary" />,
  },
  {
    id: 4,
    title: "Générer les documents de contrat",
    content:
      "Générez des contrats de travail personnalisés ou autres documents RH, prêts à être signés par vos employés.",
    image: "/images/landing/contrats.png",
    icon: <FileEdit className="h-6 w-6 text-primary" />,
  },
];

export default function FeaturesWorkflowSection() {
  return (
    <Section
      title="Le workflow Loura"
      subtitle="De la création de votre organisation à la gestion RH sans friction"
    >
      <Features collapseDelay={5000} linePosition="bottom" data={data} />
    </Section>
  );
}
