"use client"

import { useEffect } from "react"
import { setupGlobalErrorHandlers } from "./logger"

/**
 * Monte les handlers globaux ``window.onerror`` + ``unhandledrejection``.
 * À inclure une seule fois (root layout). Sans rendu visuel.
 */
export function FrontendErrorReporter() {
  useEffect(() => {
    setupGlobalErrorHandlers()
  }, [])
  return null
}
