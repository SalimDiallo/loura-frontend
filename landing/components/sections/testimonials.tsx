"use client";

import Marquee from "@/landing/components/magicui/marquee";
import Section from "@/landing/components/section";
import { cn } from "@/landing/lib/utils";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";

export const Highlight = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        "bg-primary/20 p-1 py-0.5 font-bold text-primary dark:bg-primary/20 dark:text-primary",
        className
      )}
    >
      {children}
    </span>
  );
};

export interface TestimonialCardProps {
  name: string;
  role: string;
  img?: string;
  description: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const TestimonialCard = ({
  description,
  name,
  img,
  role,
  className,
  ...props // Capture the rest of the props
}: TestimonialCardProps) => (
  <div
    className={cn(
      "mb-4 flex w-full cursor-pointer break-inside-avoid flex-col items-center justify-between gap-6 rounded-xl p-4",
      // light styles
      " border border-neutral-200 bg-white",
      // dark styles
      "dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
      className
    )}
    {...props} // Spread the rest of the props here
  >
    <div className="select-none text-sm font-normal text-neutral-700 dark:text-neutral-400">
      {description}
      <div className="flex flex-row py-1">
        <Star className="size-4 text-yellow-500 fill-yellow-500" />
        <Star className="size-4 text-yellow-500 fill-yellow-500" />
        <Star className="size-4 text-yellow-500 fill-yellow-500" />
        <Star className="size-4 text-yellow-500 fill-yellow-500" />
        <Star className="size-4 text-yellow-500 fill-yellow-500" />
      </div>
    </div>

    <div className="flex w-full select-none items-center justify-start gap-5">
      <Image
        width={40}
        height={40}
        src={img || ""}
        alt={name}
        className="h-10 w-10 rounded-full ring-1 ring-border ring-offset-4"
      />

      <div>
        <p className="font-medium text-neutral-500">{name}</p>
        <p className="text-xs font-normal text-neutral-400">{role}</p>
      </div>
    </div>
  </div>
);

const testimonials = [
  {
    name: "Alex Rivera",
    role: "CTO chez InnovateTech",
    img: "https://randomuser.me/api/portraits/men/91.jpg",
    description: (
      <p>
        Les analyses pilotées par l'IA de #QuantumInsights ont révolutionné notre cycle de développement produit.
        <Highlight>
          Les insights sont désormais plus précis et rapides que jamais.
        </Highlight>{" "}
        Un véritable atout pour les entreprises technologiques.
      </p>
    ),
  },
  {
    name: "Samantha Lee",
    role: "Directrice Marketing chez NextGen Solutions",
    img: "https://randomuser.me/api/portraits/women/12.jpg",
    description: (
      <p>
        L’intégration du modèle de prédiction client d’#AIStream a considérablement amélioré notre stratégie de ciblage.
        <Highlight>Nous observons une augmentation de 50% du taux de conversion !</Highlight> Je recommande vivement leurs solutions.
      </p>
    ),
  },
  {
    name: "Raj Patel",
    role: "Fondateur & CEO chez StartUp Grid",
    img: "https://randomuser.me/api/portraits/men/45.jpg",
    description: (
      <p>
        En tant que startup, nous devons avancer vite. L’assistant de codage automatisé de #CodeAI nous aide à y parvenir.
        <Highlight>Notre vitesse de développement a doublé.</Highlight> Outil essentiel pour toute startup.
      </p>
    ),
  },
  {
    name: "Emily Chen",
    role: "Product Manager chez Digital Wave",
    img: "https://randomuser.me/api/portraits/women/83.jpg",
    description: (
      <p>
        La synthèse vocale pilotée par IA de #VoiceGen a simplifié la création de produits mondiaux.
        <Highlight>La localisation est désormais fluide et efficace.</Highlight> Un must-have pour les équipes produit globales.
      </p>
    ),
  },
  {
    name: "Michael Brown",
    role: "Data Scientist chez FinTech Innovations",
    img: "https://randomuser.me/api/portraits/men/1.jpg",
    description: (
      <p>
        L’utilisation de l’IA de #DataCrunch pour nos modèles financiers nous a conféré un avantage en précision prédictive.
        <Highlight>
          Nos stratégies d'investissement sont désormais pilotées par l'analyse de données en temps réel.
        </Highlight>{" "}
        Une transformation pour la finance.
      </p>
    ),
  },
  {
    name: "Linda Wu",
    role: "VP des Opérations chez LogiChain Solutions",
    img: "https://randomuser.me/api/portraits/women/5.jpg",
    description: (
      <p>
        Les outils d’optimisation de la chaîne d’approvisionnement de #LogiTech ont drastiquement réduit nos coûts opérationnels.
        <Highlight>
          L’efficacité et la précision logistique n’ont jamais été aussi élevées.
        </Highlight>{" "}
      </p>
    ),
  },
  {
    name: "Carlos Gomez",
    role: "Responsable R&D chez EcoInnovate",
    img: "https://randomuser.me/api/portraits/men/14.jpg",
    description: (
      <p>
        En intégrant les solutions énergétiques durables de #GreenTech, notre empreinte carbone a fortement diminué.
        <Highlight>
          Nous ouvrons la voie aux pratiques professionnelles écoresponsables.
        </Highlight>{" "}
        Précurseurs du changement dans notre secteur.
      </p>
    ),
  },
  {
    name: "Aisha Khan",
    role: "Directrice Marketing chez Fashion Forward",
    img: "https://randomuser.me/api/portraits/women/56.jpg",
    description: (
      <p>
        L’IA d’analyse de marché de #TrendSetter a transformé notre gestion des tendances mode.
        <Highlight>
          Nos campagnes sont désormais pilotées par les données avec un taux d’engagement bien supérieur.
        </Highlight>{" "}
        Une révolution pour le marketing de la mode.
      </p>
    ),
  },
  {
    name: "Tom Chen",
    role: "Directeur IT chez HealthTech Solutions",
    img: "https://randomuser.me/api/portraits/men/18.jpg",
    description: (
      <p>
        L’implémentation de #MediCareAI dans nos systèmes de soins a nettement amélioré les résultats des patients.
        <Highlight>
          Technologie et santé main dans la main pour une meilleure prise en charge.
        </Highlight>{" "}
        Un jalon majeur pour la technologie médicale.
      </p>
    ),
  },
  {
    name: "Sofia Patel",
    role: "CEO chez EduTech Innovations",
    img: "https://randomuser.me/api/portraits/women/73.jpg",
    description: (
      <p>
        Les plans d’apprentissage personnalisés, pilotés par l’IA de #LearnSmart, ont doublé nos indicateurs de performance étudiants.
        <Highlight>
          Une éducation adaptée aux besoins de chaque apprenant.
        </Highlight>{" "}
        La transformation du paysage éducatif.
      </p>
    ),
  },
  {
    name: "Jake Morrison",
    role: "CTO chez SecureNet Tech",
    img: "https://randomuser.me/api/portraits/men/25.jpg",
    description: (
      <p>
        Grâce aux systèmes de sécurité alimentés par l’IA de #CyberShield, notre niveau de protection des données est inégalé.
        <Highlight>Garantir la sécurité et la confiance dans l’espace numérique.</Highlight>{" "}
        Redéfinir les standards de la cybersécurité.
      </p>
    ),
  },
  {
    name: "Nadia Ali",
    role: "Product Manager chez Creative Solutions",
    img: "https://randomuser.me/api/portraits/women/78.jpg",
    description: (
      <p>
        L’IA de #DesignPro a fluidifié nos processus créatifs, optimisant productivité et innovation.
        <Highlight>Allier créativité et technologie.</Highlight> Révolutionnaire pour les industries créatives.
      </p>
    ),
  },
  {
    name: "Omar Farooq",
    role: "Fondateur chez Startup Hub",
    img: "https://randomuser.me/api/portraits/men/54.jpg",
    description: (
      <p>
        Les insights de #VentureAI sur l’écosystème des startups ont été précieux pour notre croissance et nos stratégies de financement.
        <Highlight>Donner le pouvoir aux startups grâce à la data.</Highlight> Un catalyseur pour réussir.
      </p>
    ),
  },
];

export default function Testimonials() {
  return (
    <Section
      title="Témoignages"
      subtitle="Ce que disent nos clients"
      className="max-w-8xl"
    >
      <div className="relative mt-6 max-h-screen overflow-hidden">
        <div className="gap-4 md:columns-2 xl:columns-3 2xl:columns-4">
          {Array(Math.ceil(testimonials.length / 3))
            .fill(0)
            .map((_, i) => (
              <Marquee
                vertical
                key={i}
                className={cn({
                  "[--duration:60s]": i === 1,
                  "[--duration:30s]": i === 2,
                  "[--duration:70s]": i === 3,
                })}
              >
                {testimonials.slice(i * 3, (i + 1) * 3).map((card, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{
                      delay: Math.random() * 0.8,
                      duration: 1.2,
                    }}
                  >
                    <TestimonialCard {...card} />
                  </motion.div>
                ))}
              </Marquee>
            ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 w-full bg-gradient-to-t from-background from-20%"></div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 w-full bg-gradient-to-b from-background from-20%"></div>
      </div>
    </Section>
  );
}
