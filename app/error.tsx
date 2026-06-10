"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { monLog } from "@/lib/monitoring/logger"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    monLog.exception(error, {
      source: "app/error.tsx",
      digest: error.digest,
    })
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Une erreur est survenue</CardTitle>
          <CardDescription>
            L&apos;incident a été signalé automatiquement à l&apos;équipe.
            Vous pouvez réessayer ou revenir à l&apos;accueil.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button onClick={() => reset()}>Réessayer</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Retour à l&apos;accueil
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
