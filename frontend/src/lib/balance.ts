import { useSyncExternalStore } from 'react'

// 체리 잔액은 틀(사이드바·상단 바)과 각 화면(오늘·농장)이 함께 보여준다.
// 화면마다 따로 들고 있으면 할 일을 완료했을 때 틀의 숫자만 옛 값으로 남으므로,
// 잔액 하나를 여기 모아두고 getPark()로 새 값을 받은 쪽이 setBalance로 알려준다.
let balance: number | null = null
const listeners = new Set<() => void>()

export function setBalance(value: number) {
  if (value === balance) return
  balance = value
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useBalance() {
  return useSyncExternalStore(subscribe, () => balance)
}
