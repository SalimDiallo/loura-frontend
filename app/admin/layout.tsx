"use client"

import { useCurrentUser } from "@/lib/hooks/auth/useCurrentUser"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * Layout admin — réservé aux superadmins (``is_superuser=True``).
 *
 * Tout utilisateur non superadmin est redirigé vers ``/core/dashboard``.
 * Le serveur DRF refuse aussi les requêtes (permission ``IsSuperUser``),
 * cette garde évite juste l'affichage d'une coquille vide pendant que
 * les requêtes échouent en 403.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { data: user, isLoading } = useCurrentUser()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/auth")
      return
    }
    if (!user.is_superuser) {
      router.replace("/core/dashboard")
    }
  }, [isLoading, user, router])

  if (isLoading || !user || !user.is_superuser) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Vérification des accès…
      </div>
    )
  }

  return <>{children}</>
}
