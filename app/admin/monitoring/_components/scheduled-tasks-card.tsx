"use client"

import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { useTasksStatus } from "@/lib/hooks/monitoring"
import type { BeatTaskStatus, TaskRunStatus } from "@/lib/types/monitoring"

function runBadge(status: TaskRunStatus) {
  if (status === "success") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Succès</Badge>
  }
  if (status === "running") {
    return <Badge variant="secondary">En cours</Badge>
  }
  return <Badge variant="destructive">Échec</Badge>
}

function formatRelative(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return `il y a ${Math.floor(seconds)} s`
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)} h`
  return `il y a ${Math.floor(seconds / 86400)} j`
}

function shortTaskName(task: string): string {
  return task.split(".").pop() ?? task
}

function TaskRow({ task }: { task: BeatTaskStatus }) {
  return (
    <li className="flex items-center justify-between gap-4 text-sm">
      <span className="min-w-0">
        <span className="block truncate font-mono text-xs" title={task.task}>
          {shortTaskName(task.task)}
        </span>
        <span className="text-xs text-muted-foreground">
          {task.last_run
            ? `${formatRelative(task.last_run.started_at)}${
                task.last_run.duration_ms !== null
                  ? ` · ${task.last_run.duration_ms} ms`
                  : ""
              }`
            : "jamais exécutée"}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {task.last_run ? runBadge(task.last_run.status) : null}
        {task.stale ? <Badge variant="destructive">Stale</Badge> : null}
      </span>
    </li>
  )
}

export function ScheduledTasksCard() {
  const tasks = useTasksStatus()
  const beat = tasks.data?.beat ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tâches planifiées</CardTitle>
        <CardDescription>
          Beat Celery — « Stale » si aucun run depuis plus de 26 h.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : tasks.isError ? (
          <p className="text-sm text-destructive">
            Impossible de charger le statut des tâches.
          </p>
        ) : beat.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune tâche planifiée.
          </p>
        ) : (
          <ul className="space-y-3">
            {beat.map((task) => (
              <TaskRow key={task.name} task={task} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
