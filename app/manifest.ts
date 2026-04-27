import type { MetadataRoute } from "next";

/**
 * Manifeste Web App pour rendre LouraTech installable comme PWA
 * (bureau Windows/macOS/Linux et mobiles Android/iOS).
 *
 * Référencé automatiquement par Next.js sur `/manifest.webmanifest`.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LouraTech — Gestion d'entreprise",
    short_name: "LouraTech",
    description:
      "Plateforme de gestion d'organisations et de ressources humaines.",
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "fr-FR",
    dir: "ltr",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/images/logo-icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/logo-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
