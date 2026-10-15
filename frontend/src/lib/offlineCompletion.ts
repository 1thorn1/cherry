import { ApiError, rawRequest } from '../api/transport.ts'
import type { AuthUser } from '../types/auth.ts'
import type { CalendarDay } from '../types/calendar.ts'
import type { Task, TodayResponse } from '../types/task.ts'
import type { Routine } from '../types/routine.ts'
import { readAll, readStore, removeVersion, writePending, writeStore } from './offlineStore.ts'
import { localTimestamp, overlayToday, pendingTask, withOffset, type PendingChange } from './offlineState.ts'

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

function mentions(value: unknown, change: PendingChange): boolean {
  if (isTask(value)) return change.target === 'task' ? value.id === change.id : value.milestone_id === change.id
  if (Array.isArray(value)) return value.some((entry) => mentions(entry, change))
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (change.target === 'milestone' && 'seq' in record && 'completed' in record && record.id === change.id) return true
    return Object.values(record).some((entry) => mentions(entry, change))
  }
  return false
}

// 오늘·캘린더는 완료 날짜에 따라 다른 날 목록으로 옮겨질 수 있어 항상 다시 계산하고,
// 나머지는 그 할 일/마일스톤이 들어 있는 응답만 고쳐 쓴다. 전체를 매번 다시 쓰면
// 캐시가 커질수록 동기화가 느려진다.
function affects(entry: CachedResponse, change: PendingChange) {
  return entry.url.startsWith('/api/today?') || entry.url.startsWith('/api/calendar?') || mentions(entry.data, change)
}

async function applyAccepted(userId: number, accepted: PendingChange, serverTask: unknown, cache?: CachedResponse[]) {
  const entries = cache ?? (await readAll<CachedResponse>('cache')).filter((entry) => entry.owner === userId)
  for (const entry of entries) {
    if (!affects(entry, accepted)) continue
    // 동기화 도중 화면이 새로 받아 저장한 응답을 옛 사본으로 덮지 않게 저장 직전에 다시 읽는다.
    const latest = await readStore<CachedResponse>('cache', `${userId}:${entry.url}`) ?? entry
    entry.data = projectCached(entry.url, latest.data, [accepted])
    await cacheResponse(userId, entry.url, entry.data)
  }
  if (isTask(serverTask)) await cacheResponse(userId, `/api/task-cache/${serverTask.id}`, serverTask)
}

function completionUrl(target: 'task' | 'milestone', id: number, completed: boolean) {
  return `/api/${target === 'task' ? 'tasks' : 'milestones'}/${id}/${completed ? 'complete' : 'uncomplete'}`
}

// 온라인이면 서버에 바로 보내서 거절(400·404 등)을 화면이 그대로 받게 한다. 큐는 연결이
// 없을 때만 쓴다. 이미 대기 중인 변경이 있으면 순서가 뒤섞이지 않게 같이 큐로 보낸다.
export async function sendCompletion(target: 'task' | 'milestone', id: number, completed: boolean): Promise<Task | undefined> {
  if (!navigator.onLine) return queueCompletion(target, id, completed)
  const userId = await resolveOwner()
  if (!userId || (await pendingChanges(userId)).length) return queueCompletion(target, id, completed)
  let task: Task | undefined
  try {
    task = await rawRequest<Task | undefined>(completionUrl(target, id, completed), { method: 'PATCH' })
  } catch (e) {
    if (e instanceof ApiError) throw e
    return queueCompletion(target, id, completed)
  }
  const occurredAt = (isTask(task) && task.completed_at) || localTimestamp()
  await applyAccepted(userId, {
    key: `${userId}:${target}:${id}`, version: '', owner: userId, target, id, completed, occurredAt, queuedAt: Date.now(),
    task: isTask(task) ? task : undefined, effectiveAt: (isTask(task) && task.effective_at) || undefined,
  }, task).catch(() => {})
  changed()
  return task
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
  const cache = (await readAll<CachedResponse>('cache')).filter((entry) => entry.owner === userId)
  try {
    while (true) {
      const changes = await pendingChanges(userId)
      if (!changes.length) break
      for (const change of changes) {
        if (owner !== userId) return
        try {
          const task = await rawRequest<Task | undefined>(completionUrl(change.target, change.id, change.completed), {
            method: 'PATCH',
            ...(change.completed ? { body: JSON.stringify({ completed_at: withOffset(change.occurredAt) }) } : {}),
          })
          const accepted = { ...change, ...(isTask(task) ? { task, occurredAt: task.completed_at ?? change.occurredAt, effectiveAt: task.effective_at ?? undefined } : {}) }
          await applyAccepted(userId, accepted, task, cache)
          await removeVersion(change.key, change.version)
          await refreshStatus()
          changed()
        } catch (e) {
          if (!(e instanceof ApiError)) { setStatus({ online: false, error: '연결이 돌아오면 저장한 완료 내역을 다시 전송해요.' }); return }
          if (e.status === 401) { setStatus({ error: '로그인이 필요해요. 완료 내역은 기기에 보관되어 있어요.' }); return }
          if (e.status === 408 || e.status === 429 || e.status >= 500) { setStatus({ error: e.message }); return }
          // 서버가 거절한 변경(다른 기기에서 지운 할 일 등)은 다시 보내도 같은 결과다. 큐에서
          // 빼서 화면이 서버 상태로 돌아가게 한다 — 남겨두면 30초마다 재전송하면서 계속
          // "완료"로 보인다.
          await removeVersion(change.key, change.version)
          setStatus({ error: `완료를 저장하지 못해 되돌렸어요: ${e.message}` })
          await refreshStatus()
          changed()
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
