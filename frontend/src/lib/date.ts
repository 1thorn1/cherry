// new Date().toISOString().slice(0, 10)은 UTC 기준이라 KST(UTC+9) 자정~오전 9시 사이엔
// 하루 전 날짜를 돌려준다 — "오늘"을 구하는 곳에서 이 방식을 쓰면 안 된다.
// getFullYear/getMonth/getDate는 로컬 타임존 기준이라 이 문제가 없다.
export function getTodayStr(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
