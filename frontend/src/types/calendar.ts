import type { Task } from './task'

export interface RoutinePreview {
  routine_id: number
  title: string
  default_time: string | null
}

export interface CalendarDay {
  date: string
  tasks: Task[]
  previews: RoutinePreview[]
}
