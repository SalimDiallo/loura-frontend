/**
 * Sentry config — runtime client (browser).
 * Démarré automatiquement par `instrumentation-client.ts`.
 */
import * as Sentry from "@sentry/nextjs"

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development",
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0"
    ),
    // Replays sont volumineux et facturés — désactivés par défaut. Activer
    // ponctuellement pour debug en passant `NEXT_PUBLIC_SENTRY_REPLAYS=1`.
    replaysOnErrorSampleRate:
      process.env.NEXT_PUBLIC_SENTRY_REPLAYS === "1" ? 1.0 : 0,
    replaysSessionSampleRate: 0,
  })
}
