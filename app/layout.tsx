"use client"
import { QueryProvider } from "@/components/providers";
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
      lang="en"
      suppressHydrationWarning
      className={cn(
        spaceGrotesk.variable,
        jetbrainsMono.variable,
        playfairDisplay.variable
      )}
    >
      <body>
        <QueryProvider>
          <ThemeProvider>
            <FrontendErrorReporter />
            {children}
            <Toaster richColors position="top-center" />
            <PwaRegister />
          </ThemeProvider>
        </QueryProvider>


      </body>
    </html>
  )
}
