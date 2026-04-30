import Features from "@/landing/components/features-horizontal";
import Section from "@/landing/components/section";
import { Building2, FileEdit, Layers, UserPlus2 } from "lucide-react";

const data = [
  {
    id: 1,
    title: "Créer une organisation",
    content: "Lancez votre société en 1 clic.",
    image: "/images/landing/organisation.png",
    icon: <Building2 className="h-6 w-6 text-primary" />,
  },
  {
    id: 2,
    title: "Ajouter des employés",
    content: "Ajoutez vos collaborateurs facilement.",
    image: "/images/landing/employees.png",
    icon: <UserPlus2 className="h-6 w-6 text-primary" />,
  },
  {
    id: 3,
    title: "Gérer la paie et les congés",
    content: "Automatisez paie & absences.",
    image: "/images/landing/paie.png",
    icon: <Layers className="h-6 w-6 text-primary" />,
  },
  {
    id: 4,
    title: "Générer les documents de contrat",
    content: "Générez contrats & docs RH.",
    image: "/images/landing/contrats.png",
    icon: <FileEdit className="h-6 w-6 text-primary" />,
  },
];

export default function FeaturesWorkflowSection() {
  return (
    <Section
      title="Le workflow Loura"
      subtitle="De la création à la gestion RH simplifiée"
    >
      <Features collapseDelay={5000} linePosition="bottom" data={data} />
    </Section>
  );
}
