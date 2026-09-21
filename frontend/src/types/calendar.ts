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

export interface DailyCount {
  date: string
  count: number
  titles: string[]
}

export interface ProjectProgress {
  project_id: number
  name: string
  color: string
  type: string
  completed_milestones: number
  total_milestones: number
}

export interface MonthSummary {
  month: string
  daily_counts: DailyCount[]
  projects: ProjectProgress[]
}
