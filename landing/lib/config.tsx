import { Icons } from "@/landing/components/icons";
import { FaTwitter } from "react-icons/fa";
import { FaYoutube } from "react-icons/fa6";
import { RiInstagramFill } from "react-icons/ri";

export const BLUR_FADE_DELAY = 0.15;

export const siteConfig = {
  name: "Louratech",
  description: "Digitalisez et optimisez la gestion d'entreprise avec Louratech, la solution SaaS tout-en-un.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  keywords: [
    "SaaS",
    "Gestion d'entreprise",
    "Louratech",
    "RH",
    "Stock",
    "CRM",
    "Services",
    "Projets",
    "Facturation",
    "Digitalisation"
  ],
  links: {
    email: "contact@louratech.com",
    twitter: "https://twitter.com/louratech",
    discord: "#", // À compléter si Discord existe
    github: "#",
    instagram: "https://instagram.com/louratech/",
  },
  header: [
    {
      trigger: "Modules",
      content: {
        main: {
          icon: <Icons.logo className="h-6 w-6" />,
          title: "Modules Intégrés & Intelligents",
          description: "Gérez l'ensemble de votre entreprise sur une seule plateforme.",
          href: "#",
        },
        items: [
          {
            href: "#",
            title: "Ressources humaines",
            description: "Pilotez vos équipes, congés et paies facilement.",
          },
          {
            href: "#",
            title: "Gestion de Stock",
            description: "Suivi des inventaires, alertes, entrées/sorties centralisées.",
          },
          {
            href: "#",
            title: "CRM & Clients",
            description: "Centralisez la relation client, suivez vos opportunités et ventes.",
          },
          {
            href: "#",
            title: "Facturation",
            description: "Éditez devis et factures, suivez les paiements & relances.",
          },
          {
            href: "#",
            title: "Gestion de Projets",
            description: "Planifiez, suivez l’avancement et collaborez efficacement.",
          },
          {
            href: "#",
            title: "Reporting & Tableaux de bord",
            description: "Visualisez vos indicateurs clés pour piloter l’activité.",
          },
        ],
      },
    },
    {
      trigger: "Solutions",
      content: {
        items: [
          {
            title: "Petites entreprises",
            href: "#",
            description: "Une solution simple et évolutive pour PME & TPE.",
          },
          {
            title: "PME et ETI",
            href: "#",
            description: "Modules avancés pour accompagner votre croissance.",
          },
          {
            title: "Cabinets de services",
            href: "#",
            description: "Optimisez votre gestion d’interventions et de missions.",
          },
          {
            title: "Centres de formation",
            href: "#",
            description: "Gérez cours, plannings et suivi administratif.",
          },
          {
            title: "Agences",
            href: "#",
            description: "Centralisez RH, stocks, projets et ventes en une seule suite.",
          },
          {
            title: "Indépendants",
            href: "#",
            description: "Un outil complet pour les entrepreneurs solo.",
          },
        ],
      },
    },
    {
      href: "/blog",
      label: "Blog",
    },
  ],
  pricing: [
    {
      name: "DÉCOUVERTE",
      href: "#",
      price: "19€",
      period: "mois",
      yearlyPrice: "16€",
      features: [
        "1 utilisateur",
        "5Go de stockage",
        "Assistance standard",
        "Accès modules de base",
        "Gestion basique de clients",
      ],
      description: "Idéal pour démarrer ou gérer une petite structure.",
      buttonText: "Essayer",
      isPopular: false,
    },
    {
      name: "PRO",
      href: "#",
      price: "49€",
      period: "mois",
      yearlyPrice: "40€",
      features: [
        "Jusqu'à 10 utilisateurs",
        "50Go de stockage",
        "Support prioritaire",
        "Tous les modules Louratech inclus",
        "Automatisations avancées",
      ],
      description: "La formule préférée des entreprises en croissance.",
      buttonText: "Choisir",
      isPopular: true,
    },
    {
      name: "ENTREPRISE",
      href: "#",
      price: "Sur devis",
      period: "",
      yearlyPrice: "",
      features: [
        "Utilisateurs illimités",
        "Stockage dédié",
        "Support 24/7 Premium",
        "Intégrations personnalisées",
        "Accès API & reporting avancé",
      ],
      description: "Pour les organisations avec besoins spécifiques et grande échelle.",
      buttonText: "Contactez-nous",
      isPopular: false,
    },
  ],
  faqs: [
    {
      question: "Qu'est-ce que Louratech ?",
      answer: (
        <span>
          Louratech est une solution SaaS complète pour digitaliser et optimiser la gestion des entreprises. Elle regroupe différents modules tels que RH, gestion de stocks, CRM, projets ou encore facturation, pour centraliser tous vos processus administratifs et opérationnels.
        </span>
      ),
    },
    {
      question: "Comment puis-je démarrer avec Louratech ?",
      answer: (
        <span>
          Il vous suffit de créer un compte sur notre site, de choisir l'offre qui convient à vos besoins, puis de suivre notre guide de prise en main rapide. Notre équipe vous accompagne à chaque étape de l’intégration si besoin.
        </span>
      ),
    },
    {
      question: "Pour quels types d'entreprises Louratech est-il adapté ?",
      answer: (
        <span>
          Louratech s'adresse aussi bien aux TPE/PME, qu’aux indépendants, cabinets de services, agences ou centres de formation souhaitant centraliser et automatiser leur gestion quotidienne.
        </span>
      ),
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: (
        <span>
          Oui, nous appliquons les meilleures pratiques de sécurité et de confidentialité pour garantir la protection de vos données, avec sauvegardes automatiques et chiffrement.
        </span>
      ),
    },
    {
      question: "Quel support proposez-vous ?",
      answer: (
        <span>
          Notre support client répond rapidement à toutes vos questions par email ou chat, et nous proposons également des ressources, vidéos et documentation détaillée pour vous aider à prendre en main Louratech.
        </span>
      ),
    },
  ],
  footer: [
    {
      title: "Produit",
      links: [
        { href: "#", text: "Modules", icon: null },
        { href: "#", text: "Tarifs", icon: null },
        { href: "#", text: "Documentation", icon: null },
        { href: "#", text: "API", icon: null },
      ],
    },
    {
      title: "Entreprise",
      links: [
        { href: "#", text: "À propos", icon: null },
        { href: "#", text: "Carrières", icon: null },
        { href: "#", text: "Blog", icon: null },
        { href: "#", text: "Presse", icon: null },
        { href: "#", text: "Partenaires", icon: null },
      ],
    },
    {
      title: "Ressources",
      links: [
        { href: "#", text: "Communauté", icon: null },
        { href: "#", text: "Contact", icon: null },
        { href: "#", text: "Assistance", icon: null },
        { href: "#", text: "Statut", icon: null },
      ],
    },
    {
      title: "Réseaux sociaux",
      links: [
        {
          href: "https://twitter.com/louratech",
          text: "Twitter",
          icon: <FaTwitter />,
        },
        {
          href: "https://instagram.com/louratech/",
          text: "Instagram",
          icon: <RiInstagramFill />,
        },
        {
          href: "#",
          text: "Youtube",
          icon: <FaYoutube />,
        },
      ],
    },
  ],
};

export type SiteConfig = typeof siteConfig;
