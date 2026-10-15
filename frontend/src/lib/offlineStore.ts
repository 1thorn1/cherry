import type { PendingChange } from './offlineState.ts'
const DB_NAME = 'cherry-offline'
let database: Promise<IDBDatabase> | undefined

function openDatabase() {
  database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      for (const name of ['cache', 'pending', 'meta']) request.result.createObjectStore(name)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => { database = undefined; reject(new Error('기기에 저장하지 못했습니다. 저장 공간을 확인해주세요.')) }
  })
  return database
}

export async function readStore<T>(store: string, key: string): Promise<T | undefined> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).get(key)
    request.onsuccess = () => resolve(request.result as T | undefined)
    request.onerror = () => reject(request.error)
  })
}

export async function readAll<T>(store: string): Promise<T[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(store).objectStore(store).getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

export async function writeStore(store: string, key: string, value: unknown): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite')
    transaction.objectStore(store).put(value, key)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(new Error('기기에 저장하지 못했습니다. 저장 공간을 확인해주세요.'))
    transaction.onabort = () => reject(new Error('기기에 저장하지 못했습니다. 다시 시도해주세요.'))
  })
}

export async function writePending(change: PendingChange): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending', 'readwrite')
    const store = transaction.objectStore('pending')
    const request = store.get(change.key)
    request.onsuccess = () => {
      const current = request.result as PendingChange | undefined
      if (!current || current.queuedAt <= change.queuedAt) store.put(change, change.key)
    }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(new Error('완료 상태를 기기에 저장하지 못했습니다.'))
    transaction.onabort = () => reject(new Error('완료 상태를 기기에 저장하지 못했습니다.'))
  })
}

/** 동기화 중 새 클릭이 들어왔다면 새 버전은 지우지 않는다. */
export async function removeVersion(key: string, version: string): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending', 'readwrite')
    const store = transaction.objectStore('pending')
    const request = store.get(key)
    request.onsuccess = () => { if (request.result?.version === version) store.delete(key) }
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}
