"use client";

import { useEffect } from "react";

/**
 * Enregistre le service worker `/sw.js` côté client (production uniquement).
 *
 * En dev on ne registre pas le SW pour éviter de mettre en cache du HMR
 * partiel. Cela évite aussi les erreurs si Next.js renvoie un 404 sur le SW
 * pendant un build à chaud.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          // Volontairement silencieux : un échec ne doit pas casser l'app.
        });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
