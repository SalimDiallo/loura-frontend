"use client";

import { useTour } from "@/components/services/organisation/TourProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrganization } from "@/lib/hooks/core";
import {
    Calendar,
    Clock,
    Compass,
    Loader2,
    PanelLeft,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

// Utilitaire pour un affichage fluide et naturel de la date/heure et de la salutation
function getSmoothDateTimeInfo() {
  const now = new Date();

  const prettyDate = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const time = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  function timeToText(date: Date) {
    const heures = date.getHours();
    const minutes = date.getMinutes();

    const nums = [
      "zéro", "une", "deux", "trois", "quatre", "cinq", "six", "sept",
      "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze",
      "seize", "dix-sept", "dix-huit", "dix-neuf"
    ];
    const dizaines = ["", "", "vingt", "trente", "quarante", "cinquante"];

    function numToWord(n: number) {
      if (n < 20) return nums[n];
      let res = dizaines[Math.floor(n / 10)];
      if (n % 10 === 1 && n < 60) return res + "-et-une";
      if (n % 10 !== 0) res += "-" + nums[n % 10];
      return res;
    }

    let hourText = numToWord(heures) + " heure" + (heures > 1 ? "s" : "");
    let minText =
      minutes > 0 ? (minutes < 10 ? " zéro" : " ") + numToWord(minutes) : "";
    return (hourText + minText).trim();
  }

  const timeSpoken = timeToText(now);

  const hour = now.getHours();
  let greeting =
    hour < 6
      ? "Bonne nuit"
      : hour < 12
        ? "Bonjour"
        : hour < 18
          ? "Bon après-midi"
          : hour < 22
            ? "Bonsoir"
            : "Bonne nuit";

  return {
    prettyDate,
    time,
    timeSpoken,
    greeting,
    full: `${greeting}, il est ${time} (${timeSpoken}) – ${prettyDate}`,
  };
}

const ORG_TOUR_STORAGE_KEY = "org-tour-completed";

function OrganizationDashboardPageContent() {
  const { id: orgId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: organization, isLoading } = useOrganization(orgId as string);
  const { startTour } = useTour();

  const [dateTimeInfo, setDateTimeInfo] = useState(getSmoothDateTimeInfo());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateTime = () => setDateTimeInfo(getSmoothDateTimeInfo());
    updateTime();
    intervalRef.current = setInterval(updateTime, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // ── Auto-déclenchement: première entrée OU ?onboarding=1 ──
  const orgIdStr = typeof orgId === "string" ? orgId : "";
  const onboardingFlag = searchParams.get("onboarding") === "1";

  useEffect(() => {
    if (!orgIdStr) return;
    const trigger = () => startTour("sidebar-overview");

    if (onboardingFlag) {
      const t = setTimeout(trigger, 400);
      // Marque comme complété pour éviter double-déclenchement
      try {
        const raw = window.localStorage.getItem(ORG_TOUR_STORAGE_KEY);
        const completed: string[] = raw ? JSON.parse(raw) : [];
        if (!completed.includes(orgIdStr)) {
          completed.push(orgIdStr);
          window.localStorage.setItem(
            ORG_TOUR_STORAGE_KEY,
            JSON.stringify(completed)
          );
        }
      } catch {
        /* ignore */
      }
      router.replace(`/organisation/${orgIdStr}/dashboard`);
      return () => clearTimeout(t);
    }

    try {
      const raw = window.localStorage.getItem(ORG_TOUR_STORAGE_KEY);
      const completed: string[] = raw ? JSON.parse(raw) : [];
      if (!completed.includes(orgIdStr)) {
        const t = setTimeout(trigger, 400);
        completed.push(orgIdStr);
        window.localStorage.setItem(
          ORG_TOUR_STORAGE_KEY,
          JSON.stringify(completed)
        );
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [orgIdStr, onboardingFlag, router, startTour]);

  const formatOrgName = (name: string) =>
    name
      .replace(/-/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/(^|\s)\S/g, (l) => l.toUpperCase());

  const orgName = useMemo(
    () =>
      organization?.name ||
      (typeof orgId === "string" ? formatOrgName(orgId) : "Organisation"),
    [organization?.name, orgId]
  );

  const logoUrl = organization?.logo ?? null;

  return (
    <div className="min-h-[calc(100vh-4rem)] p-8 flex flex-col items-center justify-center bg-background/50">
      <div className="max-w-md w-full flex flex-col items-center gap-8">
        <div className="relative group">
          <div className="relative w-48 h-48 md:w-52 md:h-52 bg-card/60 flex items-center justify-center overflow-hidden ring-1 ring-primary/5">
            {isLoading ? (
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin-smooth" />
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt={orgName}
                className="w-full h-full object-contain p-6 transition duration-500"
                draggable={false}
              />
            ) : (
              <span className="text-5xl font-bold text-primary/20 select-none">
                {orgName
                  .split(" ")
                  .map((w) => w[0])
                  .filter(Boolean)
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{orgName}</h1>
          <p className="text-muted-foreground">
            Tableau de bord de l'organisation
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-center gap-6 text-muted-foreground bg-muted/50 px-6 py-3 border border-border/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary/60" />
              <span className="font-mono text-lg tabular-nums font-medium text-foreground transition-all duration-300">
                {dateTimeInfo.time}
              </span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary/60" />
              <span className="capitalize text-sm">
                {dateTimeInfo.prettyDate}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-medium">{dateTimeInfo.greeting}</span>
            <span className="text-2xl animate-bounce select-none">👋</span>
          </div>
        </div>

        <Card className="w-full border-dashed bg-transparent">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed flex items-center justify-center gap-2">
              <PanelLeft className="h-4 w-4 opacity-60" />
              Utilisez la barre latérale pour naviguer entre les modules. Une
              section <strong>Aide & Onboarding</strong> regroupe toutes les
              visites guidées.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => startTour("sidebar-overview")}
              className="h-8 text-xs font-semibold"
            >
              <Compass className="h-3.5 w-3.5 mr-1.5" />
              Découvrir l'interface
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OrganizationDashboardPage() {
  return (
    <Suspense fallback={null}>
      <OrganizationDashboardPageContent />
    </Suspense>
  );
}
