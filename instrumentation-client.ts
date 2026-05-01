/**
 * Instrumentation client (browser). Chargé par Next 15+ avant l'hydratation.
 */
import "./sentry.client.config";

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://6b075108a3c55c08358d9aa469f4204e@o4511308286590976.ingest.us.sentry.io/4511308489883648",

  integrations: [
    Sentry.replayIntegration(),
  ],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});