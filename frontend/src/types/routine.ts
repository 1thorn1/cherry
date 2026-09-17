export type RoutineFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface Routine {
  id: number
  title: string
  freq: RoutineFreq
  weekdays: number | null
  month_day: number | null
  default_time: string | null
  time_basis: string
  started_on: string
  ended_on: string | null
  paused: boolean
}
