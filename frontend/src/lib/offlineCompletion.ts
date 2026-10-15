import { ApiError, rawRequest } from '../api/transport.ts'
import type { AuthUser } from '../types/auth.ts'
import type { CalendarDay } from '../types/calendar.ts'
import type { Task, TodayResponse } from '../types/task.ts'
import type { Routine } from '../types/routine.ts'
import { readAll, readStore, removeVersion, writePending, writeStore } from './offlineStore.ts'
import { localTimestamp, overlayToday, pendingTask, type PendingChange } from './offlineState.ts'

interface CachedResponse { owner: number; url: string; data: unknown; storedAt?: number }
interface SyncStatus { count: number; syncing: boolean; online: boolean; error: string }
let owner: number | null | undefined
let identity: Promise<number | null> | undefined
let flushing: Promise<void> | undefined
let lastQueuedAt = 0
let channel: BroadcastChannel | undefined
let status: SyncStatus = { count: 0, syncing: false, online: true, error: '' }
const listeners = new Set<() => void>()
export const COMPLETION_CHANGED = 'cherry:completion-changed'

export function getSyncStatus() { return status }
export function subscribeSyncStatus(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener) } }
function setStatus(next: Partial<SyncStatus>) { status = { ...status, ...next }; listeners.forEach((listener) => listener()) }
function changed() { window.dispatchEvent(new Event(COMPLETION_CHANGED)); channel?.postMessage('changed') }

export async function resolveOwner(force = false): Promise<number | null> {
  if (!force && owner !== undefined) return owner
  if (identity) return identity
  identity = (async () => {
    try {
      if (!navigator.onLine) {
        owner = (await readStore<number | null>('meta', 'owner')) ?? null
        return owner
      }
      const user = await rawRequest<AuthUser>('/api/auth/me')
      owner = user.id
      await writeStore('meta', 'owner', user.id).catch(() => {})
      await cacheResponse(user.id, '/api/auth/me', user).catch(() => {})
      return user.id
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.status === 401) {
          owner = null
          await writeStore('meta', 'owner', null).catch(() => {})
          return null
        }
        throw e
      }
      owner = (await readStore<number | null>('meta', 'owner')) ?? null
      return owner
    } finally {
      identity = undefined
    }
  })()
  return identity
}

export async function rememberIdentity(user: AuthUser) {
  owner = user.id
  await writeStore('meta', 'owner', user.id).catch(() => {})
}

export async function forgetOwner() {
  owner = null
  await writeStore('meta', 'owner', null)
  setStatus({ count: 0, error: '' })
}

export async function cacheResponse(userId: number, url: string, data: unknown) {
  await writeStore('cache', `${userId}:${url}`, { owner: userId, url, data, storedAt: Date.now() } satisfies CachedResponse)
}

function isTask(value: unknown): value is Task {
  return Boolean(value && typeof value === 'object' && 'scheduled_start' in value && 'completed_at' in value && 'task_date' in value)
}

function collectTasks(data: unknown): Task[] {
  if (isTask(data)) return [data]
  if (Array.isArray(data)) return data.flatMap(collectTasks)
  if (data && typeof data === 'object') return Object.values(data).flatMap(collectTasks)
  return []
}

function applyObject(value: unknown, changes: PendingChange[]): unknown {
  if (isTask(value)) {
    const change = [...changes].reverse().find((entry) => entry.target === 'task' ? entry.id === value.id : entry.id === value.milestone_id)
    return change ? pendingTask(value, change) : value
  }
  if (Array.isArray(value)) return value.map((entry) => applyObject(entry, changes))
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if ('seq' in record && 'completed' in record && typeof record.id === 'number') {
      const change = [...changes].reverse().find((entry) => entry.target === 'milestone' && entry.id === record.id)
      if (change) return { ...record, completed: change.completed, completed_at: change.completed ? change.occurredAt : null }
    }
    return Object.fromEntries(Object.entries(record).map(([key, entry]) => [key, applyObject(entry, changes)]))
  }
  return value
}

export function projectCached(url: string, data: unknown, changes: PendingChange[]): unknown {
  if (url.startsWith('/api/today?')) return overlayToday(data as TodayResponse, changes)
  if (url.startsWith('/api/calendar?') && Array.isArray(data)) {
    return (data as CalendarDay[]).map((day) => {
      const today = overlayToday({ date: day.date, todo: day.tasks, done: day.actual_tasks, backlog: [] }, changes)
      const scheduled = new Map((applyObject(day.tasks, changes) as Task[]).map((task) => [task.id, task]))
      for (const change of changes) {
        if (change.target === 'task' && change.task?.task_date === day.date) scheduled.set(change.id, pendingTask(change.task, change))
      }
      return { ...day, tasks: [...scheduled.values()], actual_tasks: today.done }
    })
  }
  return applyObject(data, changes)
}

export async function pendingChanges(userId: number) {
  return (await readAll<PendingChange>('pending')).filter((change) => change.owner === userId).sort((a, b) => a.queuedAt - b.queuedAt)
}

export async function readCached<T>(userId: number, url: string): Promise<T | undefined> {
  let saved = await readStore<CachedResponse>('cache', `${userId}:${url}`)
  if (!saved && url.startsWith('/api/today?')) {
    const date = new URLSearchParams(url.split('?')[1]).get('date')
    for (const cached of await readAll<CachedResponse>('cache')) {
      if (cached.owner !== userId || !cached.url.startsWith('/api/calendar?')) continue
      const day = (cached.data as CalendarDay[]).find((entry) => entry.date === date)
      if (day) {
        saved = { owner: userId, url, data: { date: day.date, todo: day.tasks.filter((task) => !task.completed_at), done: day.actual_tasks, backlog: [] } }
        break
      }
    }
  }
  if (!saved) return undefined
  return projectCached(url, saved.data, await pendingChanges(userId)) as T
}

async function refreshStatus() {
  const userId = await resolveOwner()
  const changes = userId ? await pendingChanges(userId) : []
  setStatus({ count: changes.length, online: navigator.onLine })
}

export async function queueCompletion(target: 'task' | 'milestone', id: number, completed: boolean): Promise<Task | undefined> {
  const occurredAt = localTimestamp()
  const queuedAt = lastQueuedAt = Math.max(Date.now(), lastQueuedAt + 1)
  const userId = await resolveOwner()
  if (!userId) throw new Error('로그인한 뒤 완료할 수 있습니다.')
  const key = `${userId}:${target}:${id}`
  const old = await readStore<PendingChange>('pending', key)
  const cache = (await readAll<CachedResponse>('cache')).filter((entry) => entry.owner === userId)
    .sort((a, b) => (b.storedAt ?? 0) - (a.storedAt ?? 0) || Number(b.url.startsWith('/api/today?')) - Number(a.url.startsWith('/api/today?')))
  const task = target === 'task' ? old?.task ?? cache.flatMap((entry) => collectTasks(entry.data)).find((entry) => entry.id === id) : undefined
  if (target === 'task' && !task) throw new Error('저장된 할 일을 찾지 못했습니다. 목록을 새로고침해주세요.')
  const routine = task?.routine_id ? (cache.find((entry) => entry.url === '/api/routines')?.data as Routine[] | undefined)?.find((entry) => entry.id === task.routine_id) : undefined
  const change: PendingChange = {
    key, version: crypto.randomUUID(), owner: userId, target, id, completed, occurredAt, queuedAt, task,
    effectiveAt: routine?.time_basis === 'SCHEDULED' && task?.scheduled_start ? task.scheduled_start : occurredAt,
  }
  await writePending(change)
  await refreshStatus()
  changed()
  void syncCompletions()
  return task ? pendingTask(task, change) : undefined
}

async function syncBatch() {
  if (!navigator.onLine) { setStatus({ online: false }); return }
  const knownOwner = await resolveOwner()
  if (!knownOwner || !(await pendingChanges(knownOwner)).length) return
  const userId = await resolveOwner(true)
  if (!userId) { setStatus({ syncing: false, error: '로그인 후 저장한 완료 내역을 동기화할 수 있어요.' }); return }
  if (userId !== knownOwner) { await refreshStatus(); changed(); return }
  setStatus({ syncing: true, online: true, error: '' })
  const blocked = new Set<string>()
  try {
    while (true) {
      const changes = (await pendingChanges(userId)).filter((change) => !blocked.has(change.version))
      if (!changes.length) break
      for (const change of changes) {
        if (owner !== userId) return
        try {
          const url = `/api/${change.target === 'task' ? 'tasks' : 'milestones'}/${change.id}/${change.completed ? 'complete' : 'uncomplete'}`
          const task = await rawRequest<Task | undefined>(url, {
            method: 'PATCH',
            ...(change.completed ? { body: JSON.stringify({ completed_at: change.occurredAt }) } : {}),
          })
          const accepted = { ...change, ...(isTask(task) ? { task, occurredAt: task.completed_at ?? change.occurredAt, effectiveAt: task.effective_at ?? undefined } : {}) }
          for (const cached of await readAll<CachedResponse>('cache')) {
            if (cached.owner === userId) await cacheResponse(userId, cached.url, projectCached(cached.url, cached.data, [accepted]))
          }
          if (isTask(task)) await cacheResponse(userId, `/api/task-cache/${task.id}`, task)
          await removeVersion(change.key, change.version)
          await refreshStatus()
          changed()
        } catch (e) {
          if (!(e instanceof ApiError)) { setStatus({ online: false, error: '연결이 돌아오면 저장한 완료 내역을 다시 전송해요.' }); return }
          setStatus({ error: e.status === 401 ? '로그인이 필요해요. 완료 내역은 기기에 보관되어 있어요.' : e.message })
          if (e.status === 401 || e.status >= 500) return
          blocked.add(change.version)
        }
      }
    }
  } finally {
    setStatus({ syncing: false })
  }
}

export function syncCompletions(): Promise<void> {
  if (!flushing) {
    flushing = (navigator.locks ? navigator.locks.request('cherry-completion-sync', syncBatch) : syncBatch())
      .catch((e) => setStatus({ error: e instanceof Error ? e.message : '동기화하지 못했습니다.' }))
      .finally(() => { flushing = undefined })
  }
  return flushing
}

export function startCompletionSync() {
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('cherry-completion')
    channel.onmessage = () => { void refreshStatus().catch(() => {}); window.dispatchEvent(new Event(COMPLETION_CHANGED)) }
  }
  const retry = () => { void refreshStatus().catch(() => {}); void syncCompletions() }
  const offline = () => setStatus({ online: false })
  const visible = () => { if (document.visibilityState === 'visible') retry() }
  window.addEventListener('online', retry)
  window.addEventListener('offline', offline)
  document.addEventListener('visibilitychange', visible)
  const interval = window.setInterval(() => { if (navigator.onLine) retry() }, 30_000)
  retry()
  return () => {
    window.removeEventListener('online', retry)
    window.removeEventListener('offline', offline)
    document.removeEventListener('visibilitychange', visible)
    clearInterval(interval)
    channel?.close()
    channel = undefined
  }
}
