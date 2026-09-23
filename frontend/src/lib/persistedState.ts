import { useState } from 'react'

// 예정/실제, 주간/월간 같은 화면 토글은 페이지를 벗어났다 돌아와도
// 사용자가 골랐던 그대로 유지되어야 한다. 브라우저별 UI 취향이라
// 서버에 저장할 값은 아니라서 localStorage로 충분하다.
export function usePersistedState<T extends string>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      return (localStorage.getItem(key) as T | null) ?? defaultValue
    } catch {
      return defaultValue
    }
  })

  function update(next: T) {
    setValue(next)
    try {
      localStorage.setItem(key, next)
    } catch {
      // 저장 실패(프라이빗 모드 등)는 무시 — 이번 세션 동안만 유지된다
    }
  }

  return [value, update]
}
