import type { Routine } from '../types/routine'

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

export function weekdaysLabel(mask: number): string {
  return WEEKDAY_LABELS.filter((_, i) => (mask & (1 << i)) !== 0).join('·')
}

export function routineRuleLabel(routine: Routine): string {
  if (routine.freq === 'DAILY') return '매일'
  if (routine.freq === 'WEEKLY') return routine.weekdays ? weekdaysLabel(routine.weekdays) : '매주'
  return routine.month_day ? `매월 ${routine.month_day}일` : '매월'
}
