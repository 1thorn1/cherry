import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import 'fake-indexeddb/auto'
import { request } from '../src/api/client.ts'
import { ApiError } from '../src/api/transport.ts'
import { cacheResponse, forgetOwner, pendingChanges, queueCompletion, readCached, rememberIdentity, syncCompletions } from '../src/lib/offlineCompletion.ts'
import { localTimestamp, overlayToday } from '../src/lib/offlineState.ts'
import { readAll, removeVersion, writePending, writeStore } from '../src/lib/offlineStore.ts'

let online = false
let serverUser = 1
let failure = null
let delayCompletion = null
const calls = []
const windowEvents = new EventTarget()
globalThis.window = windowEvents
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { get onLine() { return online } } })
const date = localTimestamp().slice(0, 10)
const url = `/api/today?date=${date}`
const task = { id: 101, title: 'Offline task', horizon: 'THIS_WEEK', task_date: date, scheduled_start: null, scheduled_end: null, completed_at: null, effective_at: null, routine_id: null, project_id: null, milestone_id: null, notify_offset_min: null, memo: null, sort_order: 0 }
let serverTask = { ...task }
const user = (id) => ({ id, nickname: `User ${id}`, email: null, friend_code: 'TEST', profile_image_url: null })
const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
globalThis.fetch = async (endpoint, options) => {
  calls.push({ endpoint, options })
  if (failure === 'network') throw new TypeError('Network down')
  if (endpoint === '/api/auth/me') return serverUser ? response(user(serverUser)) : response({ message: 'Login required' }, 401)
  if (failure === 'forbidden') return response({ message: 'Forbidden' }, 403)
  if (failure === 'server') return response({ message: 'Try later' }, 503)
  if (failure === 'rejected' && endpoint.startsWith('/api/tasks/')) return response({ message: 'Task not found' }, 404)
  if (endpoint === '/api/tasks/101/complete') {
    if (delayCompletion) await delayCompletion()
    if (!serverTask.completed_at) {
      // 실제 서버처럼 오프셋을 서버 시간대(테스트에선 같은 시간대) 로컬 시각으로 돌려준다
      const time = options?.body ? JSON.parse(options.body).completed_at.slice(0, 19) : localTimestamp()
      serverTask = { ...serverTask, completed_at: time, effective_at: time }
    }
    return response(serverTask)
  }
  if (endpoint === '/api/tasks/101/uncomplete') {
    serverTask = { ...serverTask, completed_at: null, effective_at: null }
    return response(serverTask)
  }
  if (endpoint === url) return response({ date, todo: serverTask.completed_at ? [] : [serverTask], done: serverTask.completed_at ? [serverTask] : [], backlog: [] })
  throw new Error(`Unexpected request ${endpoint}`)
}

beforeEach(async () => {
  await syncCompletions()
  online = false
  failure = null
  delayCompletion = null
  serverUser = 1
  serverTask = { ...task }
  calls.length = 0
  for (const change of await readAll('pending')) await removeVersion(change.key, change.version)
  await forgetOwner()
  await rememberIdentity(user(1))
  await cacheResponse(1, url, { date, todo: [task], done: [], backlog: [] })
})

test('offline completion survives reloading the module and updates cached lists', async () => {
  const changed = await request('/api/tasks/101/complete', { method: 'PATCH' })
  await syncCompletions()
  assert.ok(changed.completed_at)
  assert.equal(calls.length, 0)
  const restored = await import(`../src/lib/offlineCompletion.ts?restored=${Date.now()}`)
  assert.equal(await restored.resolveOwner(), 1)
  const data = await restored.readCached(1, url)
  assert.equal(data.todo.length, 0)
  assert.equal(data.done[0].id, 101)
  assert.equal((await pendingChanges(1)).length, 1)
})

test('rapid complete and cancel keeps only the final intent', async () => {
  await queueCompletion('task', 101, true)
  await queueCompletion('task', 101, false)
  await syncCompletions()
  assert.equal((await pendingChanges(1)).length, 1)
  assert.equal((await request(url)).todo.length, 1)
  online = true
  await syncCompletions()
  assert.deepEqual(calls.filter((call) => call.endpoint.includes('/api/tasks/')).map((call) => call.endpoint), ['/api/tasks/101/uncomplete'])
  assert.equal((await pendingChanges(1)).length, 0)
  assert.equal((await readCached(1, url)).todo.length, 1)
})

test('reconnect sends the original completion time and persists the acknowledgement', async () => {
  const changed = await queueCompletion('task', 101, true)
  await syncCompletions()
  online = true
  await syncCompletions()
  const sent = calls.find((call) => call.endpoint.endsWith('/complete'))
  const sentAt = JSON.parse(sent.options.body).completed_at
  assert.equal(sentAt.slice(0, 19), changed.completed_at)
  assert.match(sentAt, /[+-]\d{2}:\d{2}$/)
  assert.equal((await pendingChanges(1)).length, 0)
  assert.equal((await readCached(1, url)).done[0].completed_at, changed.completed_at)
})

test('network and server failures retain pending changes until a later retry', async () => {
  await queueCompletion('task', 101, true)
  await syncCompletions()
  online = true
  failure = 'network'
  await syncCompletions()
  assert.equal((await pendingChanges(1)).length, 1)
  failure = 'server'
  await syncCompletions()
  assert.equal((await pendingChanges(1)).length, 1)
  failure = null
  await syncCompletions()
  assert.equal((await pendingChanges(1)).length, 0)
})

test('account switching never sends another accounts pending task', async () => {
  await queueCompletion('task', 101, true)
  await syncCompletions()
  online = true
  serverUser = 2
  await syncCompletions()
  assert.equal((await pendingChanges(1)).length, 1)
  assert.equal(calls.some((call) => call.endpoint.includes('/api/tasks/')), false)
  online = false
  await assert.rejects(request(url), /이전에 불러온/)
})

test('login expiry retains the original accounts queue', async () => {
  await queueCompletion('task', 101, true)
  await syncCompletions()
  online = true
  serverUser = 0
  await syncCompletions()
  assert.equal((await pendingChanges(1)).length, 1)
  assert.equal(calls.some((call) => call.endpoint.includes('/api/tasks/')), false)
  serverUser = 1
  await rememberIdentity(user(1))
  await syncCompletions()
  assert.equal((await pendingChanges(1)).length, 0)
})

test('HTTP authorization errors never fall back to a cached response', async () => {
  online = true
  failure = 'forbidden'
  await assert.rejects(request(url), (error) => error instanceof ApiError && error.status === 403)
})

test('a newer click during synchronization cannot be deleted by an older acknowledgement', async () => {
  await queueCompletion('task', 101, true)
  await syncCompletions()
  let release
  let entered
  const started = new Promise((resolve) => { entered = resolve })
  const gate = new Promise((resolve) => { release = resolve })
  delayCompletion = async () => { entered(); await gate }
  online = true
  const sync = syncCompletions()
  await started
  await queueCompletion('task', 101, false)
  release()
  await sync
  assert.equal((await pendingChanges(1)).length, 0)
  assert.equal(serverTask.completed_at, null)
  assert.equal((await readCached(1, url)).todo.length, 1)
})

test('offline calendar data can supply the selected days todo panel', async () => {
  const otherDate = '2026-09-01'
  const calendarTask = { ...task, task_date: otherDate }
  await cacheResponse(1, '/api/calendar?start=2026-08-31', [{ date: otherDate, tasks: [calendarTask], actual_tasks: [], previews: [] }])
  const data = await readCached(1, `/api/today?date=${otherDate}`)
  assert.equal(data.todo[0].id, 101)
})

test('completion uses the checked date and honors routine scheduled time', () => {
  const change = { key: 'k', version: 'v', owner: 1, target: 'task', id: 101, completed: true, occurredAt: '2026-10-01T00:02:00', task: { ...task, task_date: '2026-09-30' } }
  assert.equal(overlayToday({ date: '2026-09-30', todo: [change.task], done: [], backlog: [] }, [change]).done.length, 0)
  assert.equal(overlayToday({ date: '2026-10-01', todo: [], done: [], backlog: [] }, [change]).done.length, 1)
  const routine = { ...change, effectiveAt: '2026-09-30T22:00:00' }
  assert.equal(overlayToday({ date: '2026-09-30', todo: [change.task], done: [], backlog: [] }, [routine]).done[0].effective_at, routine.effectiveAt)
})

test('acknowledgements delete only the exact version that was sent', async () => {
  await writeStore('pending', 'version-test', { key: 'version-test', version: 'new', owner: 1 })
  await removeVersion('version-test', 'old')
  assert.ok((await readAll('pending')).some((change) => change.key === 'version-test'))
  await removeVersion('version-test', 'new')
  assert.equal((await readAll('pending')).some((change) => change.key === 'version-test'), false)
})

test('a delayed older write cannot replace the most recent click', async () => {
  const newer = { key: 'ordered-write', version: 'new', owner: 1, target: 'task', id: 101, completed: false, occurredAt: localTimestamp(), queuedAt: 200 }
  await writePending(newer)
  await writePending({ ...newer, version: 'old', completed: true, queuedAt: 100 })
  const saved = (await readAll('pending')).find((change) => change.key === newer.key)
  assert.equal(saved.version, 'new')
  assert.equal(saved.completed, false)
})

test('completion keeps the click time when storage preparation crosses midnight', async () => {
  const OriginalDate = Date
  let time = new OriginalDate(2026, 9, 6, 23, 59, 59).getTime()
  globalThis.Date = class extends OriginalDate {
    constructor(...args) { super(...(args.length ? args : [time])) }
    static now() { return time }
  }
  try {
    const completion = queueCompletion('task', 101, true)
    time += 3000
    await completion
    assert.equal((await pendingChanges(1))[0].occurredAt, '2026-10-06T23:59:59')
  } finally {
    globalThis.Date = OriginalDate
  }
})

test('failed local storage does not report completion or enqueue a change', async () => {
  const originalPut = IDBObjectStore.prototype.put
  IDBObjectStore.prototype.put = function (...args) {
    if (this.name === 'pending') {
      this.transaction.abort()
      return undefined
    }
    return originalPut.apply(this, args)
  }
  try {
    await assert.rejects(queueCompletion('task', 101, true), /저장하지 못했습니다/)
    assert.equal((await pendingChanges(1)).length, 0)
    assert.equal((await readCached(1, url)).todo[0].completed_at, null)
  } finally {
    IDBObjectStore.prototype.put = originalPut
  }
})

test('online completion goes straight to the server and surfaces its rejection', async () => {
  online = true
  failure = 'rejected'
  await assert.rejects(request('/api/tasks/101/complete', { method: 'PATCH' }), (error) => error instanceof ApiError && error.status === 404)
  assert.equal((await pendingChanges(1)).length, 0)
  failure = null
  const done = await request('/api/tasks/101/complete', { method: 'PATCH' })
  assert.ok(done.completed_at)
  assert.equal((await pendingChanges(1)).length, 0)
  assert.equal((await readCached(1, url)).done[0].id, 101)
})

test('a queued change the server rejects is dropped instead of retried forever', async () => {
  await queueCompletion('task', 101, true)
  await syncCompletions()
  online = true
  failure = 'rejected'
  await syncCompletions()
  assert.equal((await pendingChanges(1)).length, 0)
  assert.equal((await readCached(1, url)).todo[0].completed_at, null)
})
