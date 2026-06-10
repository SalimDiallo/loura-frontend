// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // DSN uniquement via env (SENTRY_DSN ou NEXT_PUBLIC_SENTRY_DSN) — sans
  // valeur, Sentry est désactivé. Plus de DSN hardcodé dans le code.
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || "development",

  // 10 % des transactions tracées (1 = 100 % épuise vite le quota Sentry).
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.1"),

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
})
