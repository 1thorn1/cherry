import type { Task } from './task'

export interface RoutinePreview {
  routine_id: number
  title: string
  default_time: string | null
}

export interface CalendarDay {
  date: string
  tasks: Task[]
  // "실제" 탭 전용 — 예정된 날(taskDate)이 아니라 실제로 완료 처리한 날 기준으로 묶인 목록.
  // 이월된 태스크를 나중에 완료하면 tasks(taskDate 기준)와 이 목록에 담기는 날짜가 갈린다.
  actual_tasks: Task[]
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
