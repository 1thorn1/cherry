export interface Task {
  id: number
  title: string
  horizon: string
  task_date: string | null
  scheduled_start: string | null
  scheduled_end: string | null
  completed_at: string | null
  effective_at: string | null
  routine_id: number | null
  notify_offset_min: number | null
  memo: string | null
  sort_order: number
}

export interface TodayResponse {
  date: string
  todo: Task[]
  done: Task[]
}
