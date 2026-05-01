"use client"

import { useFrontendLogs } from "@/lib/hooks/monitoring"
import type { LogLevel } from "@/lib/types/monitoring"
import Link from "next/link"
import { useState } from "react"
import { LogsViewer } from "../_components/logs-viewer"

type Filters = { limit?: number; offset?: number; level?: LogLevel; q?: string }

export default function MonitoringFrontendLogsPage() {
  const [filters, setFilters] = useState<Filters>({ limit: 100, offset: 0 })
  const { data, isLoading } = useFrontendLogs(filters)

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logs frontend</h1>
        </div>
        <Link
          href="/admin/monitoring"
          className="text-sm text-primary hover:underline"
        >
          ← Retour
        </Link>
      </header>

      <LogsViewer
        title="logs/frontend.log"
        description="Logs envoyés par le client (POST /monitoring/logs/frontend/ingest/)."
        data={data}
        isLoading={isLoading}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  )
}
