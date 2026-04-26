"use client";

import GuidedTour from "@/components/GuidedTour";
import { getTourById, type TourDef } from "@/lib/tours/registry";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

// ============================================================================
// CONTEXT
// ============================================================================

type TourContextValue = {
  startTour: (tourId: string) => void;
  stopTour: () => void;
  activeTourId: string | null;
};

const TourContext = createContext<TourContextValue | null>(null);

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    return {
      startTour: () => {
        if (typeof window !== "undefined") {
          console.warn("TourProvider non monté");
        }
      },
      stopTour: () => {},
      activeTourId: null,
    };
  }
  return ctx;
}

// ============================================================================
// PROVIDER
// ============================================================================

const PENDING_TOUR_KEY = "pending-tour";

export default function TourProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const orgId = (params?.id as string) || "";

  const [activeTourId, setActiveTourId] = useState<string | null>(null);
  const [activeTour, setActiveTour] = useState<TourDef | null>(null);
  const [delayActive, setDelayActive] = useState(false);

  // Démarre un tour. Si la page actuelle ≠ startPath, on navigue puis on lance.
  const startTour = useCallback(
    (tourId: string) => {
      const tour = getTourById(tourId);
      if (!tour) return;

      const target = tour.startPath(orgId);

      if (pathname === target) {
        setActiveTourId(tourId);
        setActiveTour(tour);
        setDelayActive(true);
      } else {
        // Stocke le tour à reprendre, puis navigue
        try {
          sessionStorage.setItem(PENDING_TOUR_KEY, tourId);
        } catch {
          /* ignore */
        }
        router.push(target);
      }
    },
    [orgId, pathname, router]
  );

  const stopTour = useCallback(() => {
    setActiveTourId(null);
    setActiveTour(null);
    setDelayActive(false);
  }, []);

  // Reprise d'un tour différé après navigation
  useEffect(() => {
    let pending: string | null = null;
    try {
      pending = sessionStorage.getItem(PENDING_TOUR_KEY);
    } catch {
      /* ignore */
    }
    if (!pending) return;
    const tour = getTourById(pending);
    if (!tour) {
      sessionStorage.removeItem(PENDING_TOUR_KEY);
      return;
    }
    if (pathname === tour.startPath(orgId)) {
      sessionStorage.removeItem(PENDING_TOUR_KEY);
      const t = setTimeout(() => {
        setActiveTourId(pending);
        setActiveTour(tour);
        setDelayActive(true);
      }, 350);
      return () => clearTimeout(t);
    }
  }, [pathname, orgId]);

  // Petit délai pour laisser le DOM se stabiliser
  useEffect(() => {
    if (!delayActive) return;
    const t = setTimeout(() => setDelayActive(false), 250);
    return () => clearTimeout(t);
  }, [delayActive]);

  return (
    <TourContext.Provider value={{ startTour, stopTour, activeTourId }}>
      {children}
      {activeTour && !delayActive && (
        <GuidedTour steps={activeTour.steps} onFinish={stopTour} />
      )}
    </TourContext.Provider>
  );
}
