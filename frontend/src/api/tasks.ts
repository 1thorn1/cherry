import type { Task, TodayResponse } from '../types/task'
import { request } from './client'

export function getToday(date: string) {
  return request<TodayResponse>(`/api/today?date=${date}`)
}

export function createTask(title: string, taskDate: string, projectId?: number, milestoneId?: number) {
  return request<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({
      title,
      task_date: taskDate,
      project_id: projectId ?? null,
      milestone_id: milestoneId ?? null,
    }),
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

export function scheduleTask(id: number, start: string | null, end: string | null, taskDate?: string) {
  return request<Task>(`/api/tasks/${id}/schedule`, {
    method: 'PATCH',
    body: JSON.stringify({ scheduled_start: start, scheduled_end: end, task_date: taskDate ?? null }),
  })
}

export function setTaskEffectiveTime(id: number, effectiveAt: string) {
  return request<Task>(`/api/tasks/${id}/effective-time`, {
    method: 'PATCH',
    body: JSON.stringify({ effective_at: effectiveAt }),
  })
}

export function postponeTask(id: number, taskDate: string | null) {
  return request<Task>(`/api/tasks/${id}/postpone`, {
    method: 'PATCH',
    body: JSON.stringify({ task_date: taskDate }),
  })
}

export function setTaskMemo(id: number, memo: string) {
  return request<Task>(`/api/tasks/${id}/memo`, {
    method: 'PATCH',
    body: JSON.stringify({ memo }),
  })
}

export function setTaskReminder(id: number, notifyOffsetMin: number | null) {
  return request<Task>(`/api/tasks/${id}/reminder`, {
    method: 'PATCH',
    body: JSON.stringify({ notify_offset_min: notifyOffsetMin }),
  })
}
