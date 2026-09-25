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

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// "2026-W39" 같은 ISO 주차 문자열을 그 주 월~일 7일의 날짜 문자열로 바꾼다. 여기서도
// UTC 메서드(toISOString 등)는 안 쓴다 — getTodayStr 위 주석과 같은 이유.
export function getIsoWeekDates(isoWeek: string): string[] {
  const [yearStr, weekStr] = isoWeek.split('-W')
  const year = Number(yearStr)
  const week = Number(weekStr)

  // ISO 8601: 1월 4일은 항상 그 해의 1주차에 속한다.
  const jan4 = new Date(year, 0, 4)
  const jan4Day = jan4.getDay() || 7 // 일요일(0)을 7로
  const week1Monday = new Date(year, 0, 4 - (jan4Day - 1))

  const monday = new Date(week1Monday)
  monday.setDate(week1Monday.getDate() + (week - 1) * 7)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return toDateStr(d)
  })
}

export const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']
