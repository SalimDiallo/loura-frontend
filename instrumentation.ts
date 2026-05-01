/**
 * Hook d'instrumentation Next.js — chargé une seule fois au boot par runtime.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Note : on n'utilise pas de top-level `export ... from "@sentry/nextjs"` car
 * le bundle edge de Sentry n'expose pas les mêmes symboles que le bundle Node.
 * Ré-exporter `captureRequestError` au niveau du module casse le build edge
 * ("Export onRequestError doesn't exist in target module"). À la place, on
 * implémente `onRequestError` comme une fonction async qui appelle le hook
 * Sentry à l'intérieur, après import dynamique conditionné au runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

export async function onRequestError(
  ...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>
) {
  // Sentry expose `captureRequestError` côté Node uniquement. En edge on no-op.
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  const { captureRequestError } = await import("@sentry/nextjs")
  return captureRequestError(...args)
}