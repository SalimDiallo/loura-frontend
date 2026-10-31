"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect } from "react"

/**
 * Raccourcis clavier globaux de l'application.
 * Isolé dans un composant client pour que le layout racine reste un
 * Server Component (requis par next/font dans Next 16).
 */
export function GlobalKeyboardShortcuts() {
  const router = useRouter()

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

  return null
}
