import { request } from './client'
import type { Routine, RoutineFreq } from '../types/routine'

export function getRoutines() {
  return request<Routine[]>('/api/routines')
}

export interface CreateRoutineInput {
  title: string
  freq: RoutineFreq
  weekdays?: number
  month_day?: number
  default_time?: string
  time_basis?: 'CHECKED' | 'SCHEDULED'
  started_on: string
}

export function createRoutine(input: CreateRoutineInput) {
  return request<Routine>('/api/routines', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function togglePauseRoutine(id: number) {
  return request<Routine>(`/api/routines/${id}/pause`, { method: 'PATCH' })
}
