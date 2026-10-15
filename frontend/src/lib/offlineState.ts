import type { Task, TodayResponse } from '../types/task.ts'

export interface PendingChange {
  key: string
  version: string
  owner: number
  target: 'task' | 'milestone'
  id: number
  completed: boolean
  occurredAt: string
  queuedAt: number
  effectiveAt?: string
  task?: Task
}

export function localTimestamp(now = new Date()): string {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 19)
}

export function pendingTask(task: Task, change: PendingChange): Task {
  return { ...task, completed_at: change.completed ? change.occurredAt : null, effective_at: change.completed ? change.effectiveAt ?? change.occurredAt : null }
}

export function overlayToday(data: TodayResponse, changes: PendingChange[]): TodayResponse {
  const tasks = new Map([...data.todo, ...data.done, ...data.backlog].map((task) => [task.id, task]))
  for (const change of changes) {
    if (change.target === 'task' && change.task) tasks.set(change.id, pendingTask(tasks.get(change.id) ?? change.task, change))
    if (change.target === 'milestone') {
      for (const task of tasks.values()) if (task.milestone_id === change.id) tasks.set(task.id, pendingTask(task, change))
    }
  }
  const dateOfCompletion = (task: Task) => (task.effective_at ?? task.completed_at)?.slice(0, 10)
  return {
    ...data,
    todo: [...tasks.values()].filter((task) => !task.completed_at && task.task_date === data.date).sort((a, b) => a.sort_order - b.sort_order),
    done: [...tasks.values()].filter((task) => Boolean(task.completed_at) && dateOfCompletion(task) === data.date),
    backlog: data.backlog.map((task) => tasks.get(task.id) ?? task).filter((task) => !task.completed_at),
  }
}
