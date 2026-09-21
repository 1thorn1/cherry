import { request } from './client'
import type { CalendarDay, MonthSummary } from '../types/calendar'

export function getWeek(start: string) {
  return request<CalendarDay[]>(`/api/calendar?start=${start}`)
}

export function getMonth(month: string) {
  return request<MonthSummary>(`/api/calendar/month?month=${month}`)
}
