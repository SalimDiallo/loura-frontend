"use client";

import { API_CONFIG } from "@/lib/api/config";
import { useOrganization } from "@/lib/hooks/core";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

// Fonctions améliorées pour afficher l'heure précise + salutation dynamique
function getCreativeDateTimeInfo() {
  const now = new Date();

  // Formatage amélioré de la date, ex : "Mardi 2 avril 2024"
  const prettyDate = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Affichage de l'heure avec secondes "14:37:05"
  const time = now
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // Affichage de l'heure à la fois en numérique et en version parlée
  function timeToText(date: Date) {
    const heures = date.getHours();
    const minutes = date.getMinutes();
    const nums = [
      "zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept",
      "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze",
      "seize", "dix-sept", "dix-huit", "dix-neuf"
    ];
    function numToWord(n: number) {
      if (n < 20) return nums[n];
      if (n < 60) {
        const dizaine = ["", "", "vingt", "trente", "quarante", "cinquante"];
        let word = dizaine[Math.floor(n/10)];
        if (n % 10 === 1 && n < 60) return word + "-et-une";
        if (n % 10 !== 0) word += "-" + nums[n%10];
        return word;
      }
      return n.toString();
    }
    return `${numToWord(heures)} heure${heures > 1 ? "s" : ""} ${minutes > 0 ? (minutes < 10 ? "zéro-" : "") + numToWord(minutes) + "" : ""}`.trim();
  }
  const timeSpoken = timeToText(now);

  // Salutation dynamique
  const hour = now.getHours();
  let greeting = "";
  if (hour < 6) greeting = "Bonne nuit";
  else if (hour < 12) greeting = "Bonjour";
  else if (hour < 18) greeting = "Bon après-midi";
  else if (hour < 22) greeting = "Bonsoir";
  else greeting = "Bonne nuit";

  return {
    prettyDate,
    time,
    timeSpoken,
    greeting,
    full: `${greeting}, il est ${time} (${timeSpoken}) – ${prettyDate}`,
  };
}

export default function OrganizationDashboardPage() {
  const { id: orgId } = useParams();
  const { data: organization, isLoading } = useOrganization(orgId as string);

  const [dateTimeInfo, setDateTimeInfo] = useState(getCreativeDateTimeInfo());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateTime = () => setDateTimeInfo(getCreativeDateTimeInfo());
    updateTime();
    intervalRef.current = setInterval(updateTime, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatOrgName = (name: string) =>
    name.replace(/-/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/(^|\s)\S/g, (l) => l.toUpperCase());

  const orgName =
    organization?.name ||
    (typeof orgId === "string" ? formatOrgName(orgId) : "Organisation");

  const logoUrl = organization?.logo
    ? organization.logo.startsWith("http")
      ? organization.logo
      : `${API_CONFIG.baseURL}/media/${organization.logo}`
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-8 flex flex-col items-center justify-center bg-background/50">
      <div className="max-w-md w-full flex flex-col items-center gap-8">
        {/* Logo Section */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative w-40 h-40 rounded-full border bg-card flex items-center justify-center overflow-hidden shadow-sm">
            {isLoading ? (
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            ) : logoUrl ? (
              <img src={logoUrl} alt={orgName} className="w-full h-full object-contain p-6" />
            ) : (
              <span className="text-5xl font-bold text-primary/20">
                {orgName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{orgName}</h1>
          <p className="text-muted-foreground">Tableau de bord de l'organisation</p>
        </div>

        {/* Date & Time Section */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-center gap-6 text-muted-foreground bg-muted/30 px-6 py-3 rounded-full border border-border/50 shadow-inner">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary/60" />
              <span className="font-mono text-lg tabular-nums font-medium text-foreground">{dateTimeInfo.time}</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary/60" />
              <span className="capitalize text-sm">{dateTimeInfo.prettyDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-2xl font-medium">{dateTimeInfo.greeting}</span>
            <span className="text-2xl animate-bounce">👋</span>
          </div>
        </div>

        <Card className="w-full border-dashed bg-transparent">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Utilisez la barre latérale pour naviguer entre les différents modules de gestion de votre organisation.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}