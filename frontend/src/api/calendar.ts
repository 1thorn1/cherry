import { request } from './client'
import type { CalendarDay } from '../types/calendar'

export function getWeek(start: string) {
  return request<CalendarDay[]>(`/api/calendar?start=${start}`)
}
