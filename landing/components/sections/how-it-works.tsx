import Features from "@/landing/components/features-vertical";
import Section from "@/landing/components/section";
import { Sparkles, Upload, Zap } from "lucide-react";

const data = [
  {
    id: 1,
    title: "Inscription rapide",
    content:
      "Créez votre compte en quelques secondes pour rejoindre Louratech.",
    image: "/images/landing/register.png",
    icon: <Upload className="w-6 h-6 text-primary" />,
  },
  {
    id: 2,
    title: "Créez votre organisation",
    content:
      "Définissez et personnalisez votre espace entreprise, ajoutez vos équipes et paramètres clés.",
    image: "/images/landing/organisation.png",
    icon: <Zap className="w-6 h-6 text-primary" />,
  },
  {
    id: 3,
    title: "Gérez et optimisez",
    content:
      "Pilotez vos activités, suivez vos indicateurs et gagnez en efficacité avec une plateforme tout-en-un.",
    image: "/images/landing/hrdash.png",
    icon: <Sparkles className="w-6 h-6 text-primary" />,
  },
];

export default function Component() {
  return (
    <Section title="How it works" subtitle="3 étapes pour démarrer">
      <Features data={data} />
    </Section>
  );
}
