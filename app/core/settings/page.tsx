"use client";

import { Card } from "@/components/ui/card";
import { Bell, Building, ChevronRight, Lock, Palette, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();

  const settingSections = [
    {
      title: "Mon Profil",
      description: "Gérer vos informations personnelles et vos coordonnées.",
      icon: User,
      href: "/core/profile",
    },
    {
      title: "Sécurité & Mot de passe",
      description: "Mettre à jour votre mot de passe et sécuriser votre compte.",
      icon: Lock,
      href: "/core/change-password",
    },
    {
      title: "Organisations",
      description: "Administrer vos espaces de travail et équipes.",
      icon: Building,
      href: "/core/dashboard/organizations",
    },
    {
      title: "Notifications",
      description: "Configurer vos préférences de communication.",
      icon: Bell,
      href: "#",
    },
    {
      title: "Apparence",
      description: "Personnaliser l'interface de l'application (Thème).",
      icon: Palette,
      href: "#",
    },
    {
      title: "Sessions actives",
      description: "Gérer les appareils connectés à votre compte.",
      icon: Shield,
      href: "#",
    }
  ];

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-4 border-b border-border/40 gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Paramètres
          </h1>
          <p className="text-sm text-muted-foreground">
            Gérez votre compte, vos préférences et la sécurité de vos données.
          </p>
        </div>
      </div>

      {/* Grid des options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingSections.map((section, idx) => (
          <Card 
            key={idx}
            onClick={() => section.href !== "#" && router.push(section.href)}
            className={`p-6 border shadow-sm bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300 group ${section.href !== "#" ? 'cursor-pointer' : 'cursor-default opacity-80 hover:shadow-sm hover:border-border/50'}`}
          >
            <div className="flex flex-col h-full space-y-5">
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center transition-colors group-hover:bg-primary/20">
                  <section.icon className="h-6 w-6 text-primary" />
                </div>
                {section.href !== "#" && (
                  <div className="h-8 w-8 rounded-full flex items-center justify-center transition-colors group-hover:bg-primary/5">
                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 group-hover:text-primary" />
                  </div>
                )}
                {section.href === "#" && (
                   <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-sm">
                     Bientôt
                   </span>
                )}
              </div>
              
              <div className="space-y-1.5 flex-1">
                <h3 className="font-medium text-base text-foreground group-hover:text-primary transition-colors">
                  {section.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-snug">
                  {section.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
