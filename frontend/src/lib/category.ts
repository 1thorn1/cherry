import type { Task } from '../types/task'

// 분류색 네 가지(design-system.md "일정·프로젝트 분류색")를 우리 데이터에 맞춰 붙인다.
// PDF의 업무/회의/개인/마감 분류는 데이터에 없어서, 할 일이 어디서 왔는지로 나눈다.
// 색만으로 구분하지 않도록 범례나 이름을 항상 같이 보여준다.
export const CATEGORIES = {
  milestone: { label: '마일스톤', dot: 'var(--barn)', soft: 'var(--barn-soft)' },
  project: { label: '프로젝트', dot: 'var(--sprout)', soft: 'var(--sprout-soft)' },
  routine: { label: '반복', dot: 'var(--sky)', soft: 'var(--sky-soft)' },
  personal: { label: '개인', dot: 'var(--coin)', soft: 'var(--coin-soft)' },
} as const

export type Category = (typeof CATEGORIES)[keyof typeof CATEGORIES]

export function categoryOf(task: Pick<Task, 'milestone_id' | 'project_id' | 'routine_id'>): Category {
  if (task.milestone_id !== null) return CATEGORIES.milestone
  if (task.project_id !== null) return CATEGORIES.project
  if (task.routine_id !== null) return CATEGORIES.routine
  return CATEGORIES.personal
}

// 프로젝트 목록·사이드바처럼 "여러 개를 차례로 구분"할 때 쓰는 순서
export const CATEGORY_CYCLE: Category[] = [CATEGORIES.project, CATEGORIES.personal, CATEGORIES.routine, CATEGORIES.milestone]

// "오전 9:00" / "오후 1:30"
export function clockLabel(iso: string) {
  const d = new Date(iso)
  const h = d.getHours()
  const m = d.getMinutes()
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')}`
}
