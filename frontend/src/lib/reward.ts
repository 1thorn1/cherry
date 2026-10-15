import type { Task } from '../types/task'

// 보상 칩(+N)에 보여줄 "대략 이만큼 받아요" 값. 실제 적립은 서버 ParkService가 정하고,
// 여기 숫자는 그 규칙을 그대로 따라 계산한 예상치다. 서버 값이 바뀌면 같이 바꿔야 한다.
//   일반 할 일 2 · 반복 1 × (1 + 농장 규모 × 0.01), 하루 100 상한
//   마일스톤 완료 50 (고정)
const BASE_PER_TASK = 2
const BASE_PER_ROUTINE = 1
const POPULATION_BONUS_RATE = 0.01
export const DAILY_POINT_CAP = 100
export const MILESTONE_REWARD = 50

export function taskReward(task: Pick<Task, 'routine_id'>, population: number) {
  const base = task.routine_id !== null ? BASE_PER_ROUTINE : BASE_PER_TASK
  return Math.max(1, Math.floor(base * (1 + population * POPULATION_BONUS_RATE)))
}
