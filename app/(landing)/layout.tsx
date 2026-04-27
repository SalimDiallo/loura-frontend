import { TailwindIndicator } from "@/landing/components/tailwind-indicator";
import { constructMetadata } from "@/landing/lib/utils";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = constructMetadata({});

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // NOTE : pas de <html>/<body> ici — la root layout (app/layout.tsx) les
  // fournit déjà. En avoir une seconde paire dans un route group provoque un
  // DOM imbriqué invalide et un mismatch d'hydratation en production
  // ("Application error: a client-side exception has occurred").
  // Idem pour ThemeProvider : un seul (root) suffit, sinon les deux
  // next-themes se battent pour la classe de <html>.
  return (
    <>
      <link rel="preconnect" href="https://rsms.me/" />
      <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      <div className="min-h-screen w-full mx-auto scroll-smooth">
        {children}
      </div>
      <TailwindIndicator />
    </>
  );
}
