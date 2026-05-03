"use client"
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import { QueryProvider } from "@/components/providers";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { FrontendErrorReporter } from "@/lib/monitoring/error-reporter";
import { cn } from "@/lib/utils";
import {
  JetBrains_Mono,
  Playfair_Display,
  Space_Grotesk,
} from "next/font/google";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import "./globals.css";

// Police principale : Space Grotesk depuis next/google-fonts
const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

// Police monospace pour le code
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
})

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
})


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const router = useRouter()

  // Raccourci global B pour retour en arrière
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignorer si on est dans un champ de saisie
      const target = e.target as HTMLElement
      const isInputField =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable

      if (isInputField) return

      // B = Retour en arrière (navigation)
      if (
        e.key.toLowerCase() === "b" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        e.preventDefault()
        router.back()
      }
    },
    [router]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown)
    return () => document.removeEventListener("keydown", handleGlobalKeyDown)
  }, [handleGlobalKeyDown])

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn(
        spaceGrotesk.variable,
        jetbrainsMono.variable,
        playfairDisplay.variable
      )}
    >
      <head>
        {/* Viewport mobile : autorise pinch-zoom mais évite le double-tap zoom
            indésirable, occupe toute la zone safe (notch). */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        {/* Manifest PWA */}
        <link rel="manifest" href="/manifest.webmanifest" />

        {/* Couleur de la barre système (Android Chrome / Edge) — adaptative
            light/dark via media queries. */}
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#0f172a"
          media="(prefers-color-scheme: dark)"
        />

        {/* iOS : permet l'installation depuis Safari "Sur l'écran d'accueil"
            avec une apparence native. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="LouraTech" />
        <link rel="apple-touch-icon" href="/images/logo-icon.png" />

        {/* Favicon */}
        <link rel="icon" type="image/png" href="/images/logo-icon.png" />
        <link rel="shortcut icon" href="/images/logo-icon.png" />

        {/* Empêche le format auto-détecté des numéros sur iOS qui casse l'UX */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        <QueryProvider>
          <ThemeProvider>
            <FrontendErrorReporter />
            {children}
            <Toaster richColors position="top-center" />
            <PwaRegister />
            <InstallBanner />
            <FeedbackWidget />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
