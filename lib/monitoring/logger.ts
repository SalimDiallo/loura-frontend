/**
 * Logger frontend qui POSTe les events vers ``/monitoring/logs/frontend/ingest/``.
 *
 * - ``monLog.info / warn / error`` : usage explicite depuis le code applicatif.
 * - ``setupGlobalErrorHandlers()`` : attache ``window.onerror`` et
 *   ``unhandledrejection`` pour capturer les exceptions non interceptées.
 *
 * Tout est best-effort et ne doit JAMAIS casser l'app : toute erreur réseau
 * est avalée silencieusement.
 */
import {
  monitoringService,
  type FrontendLogPayload,
} from "@/lib/services/monitoring/monitoring.service"
import type { LogLevel } from "@/lib/types/monitoring"

const RECENT_DEDUP_MS = 2_000
const recentSignatures = new Map<string, number>()

function shouldDrop(signature: string): boolean {
  const now = Date.now()
  for (const [sig, ts] of recentSignatures) {
    if (now - ts > RECENT_DEDUP_MS) recentSignatures.delete(sig)
  }
  if (recentSignatures.has(signature)) return true
  recentSignatures.set(signature, now)
  return false
}

async function send(
  level: LogLevel,
  message: string,
  opts: Partial<FrontendLogPayload> = {}
) {
  if (typeof window === "undefined") return
  const signature = `${level}|${message}`.slice(0, 200)
  if (shouldDrop(signature)) return

  // Capture côté Sentry si configuré.
  if (level === "ERROR" || level === "CRITICAL" || level === "WARNING") {
    try {
      const Sentry = await import("@sentry/nextjs")
      const sentryLevel = level === "WARNING" ? "warning" : "error"
      Sentry.captureMessage(message, sentryLevel)
    } catch {
      // Sentry pas chargé / pas configuré : on continue avec l'ingest local.
    }
  }

  try {
    await monitoringService.ingestFrontendLog({
      level,
      message: message.slice(0, 10_000),
      url: opts.url ?? window.location.href,
      user_agent: opts.user_agent ?? navigator.userAgent,
      exc_type: opts.exc_type,
      traceback: opts.traceback,
      context: opts.context,
    })
  } catch {
    // Volontairement silencieux : ne pas spammer la console.
  }
}

export const monLog = {
  info: (message: string, context?: Record<string, unknown>) =>
    void send("INFO", message, { context }),
  warn: (message: string, context?: Record<string, unknown>) =>
    void send("WARNING", message, { context }),
  error: (message: string, context?: Record<string, unknown>) =>
    void send("ERROR", message, { context }),
  exception: (err: unknown, context?: Record<string, unknown>) => {
    if (err instanceof Error) {
      return void send("ERROR", err.message, {
        exc_type: err.name,
        traceback: err.stack ?? "",
        context,
      })
    }
    return void send("ERROR", String(err), { context })
  },
}

let installed = false

export function setupGlobalErrorHandlers() {
  if (installed || typeof window === "undefined") return
  installed = true

  window.addEventListener("error", (event) => {
    const err = event.error
    if (err instanceof Error) {
      void send("ERROR", err.message, {
        exc_type: err.name,
        traceback: err.stack ?? "",
        context: {
          source: "window.onerror",
          filename: event.filename,
          lineno: event.lineno,
        },
      })
    } else {
      void send("ERROR", event.message || "Unknown window error", {
        context: { source: "window.onerror" },
      })
    }
  })

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason
    if (reason instanceof Error) {
      void send("ERROR", reason.message, {
        exc_type: reason.name,
        traceback: reason.stack ?? "",
        context: { source: "unhandledrejection" },
      })
    } else {
      void send("ERROR", String(reason), {
        context: { source: "unhandledrejection" },
      })
    }
  })
}
