import Features from "@/landing/components/features-vertical";
import Section from "@/landing/components/section";
import { Sparkles, Upload, Zap } from "lucide-react";

const data = [
  {
    id: 1,
    title: "Inscription rapide",
    content: "Compte créé en secondes.",
    image: "/images/landing/register.png",
    icon: <Upload className="w-6 h-6 text-primary" />,
  },
  {
    id: 2,
    title: "Créez votre organisation",
    content: "Espace configuré, équipe ajoutée.",
    image: "/images/landing/organisation.png",
    icon: <Zap className="w-6 h-6 text-primary" />,
  },
  {
    id: 3,
    title: "Gérez et optimisez",
    content: "Pilotez & suivez simplement.",
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
