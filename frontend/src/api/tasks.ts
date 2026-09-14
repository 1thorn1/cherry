import type { Task, TodayResponse } from '../types/task'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: '요청에 실패했습니다' }))
    throw new Error(error.message)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export function getToday(date: string) {
  return request<TodayResponse>(`/api/today?date=${date}`)
}

export function createTask(title: string, taskDate: string) {
  return request<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title, task_date: taskDate }),
  })
}

export function completeTask(id: number) {
  return request<Task>(`/api/tasks/${id}/complete`, { method: 'PATCH' })
}

export function uncompleteTask(id: number) {
  return request<Task>(`/api/tasks/${id}/uncomplete`, { method: 'PATCH' })
}

export function deleteTask(id: number) {
  return request<void>(`/api/tasks/${id}`, { method: 'DELETE' })
}

export function scheduleTask(id: number, start: string | null, end: string | null) {
  return request<Task>(`/api/tasks/${id}/schedule`, {
    method: 'PATCH',
    body: JSON.stringify({ scheduled_start: start, scheduled_end: end }),
  })
}
