interface Props {
  value: string | null
  onChange: (hour: number | null) => void
  // 종료 시각 선택칸에서 시작 시각보다 이른 값을 못 고르게 막을 때 쓴다.
  minHour?: number
}

export default function TimeSelect({ value, onChange, minHour }: Props) {
  const current = value ? new Date(value).getHours() : ''
  const hours = Array.from({ length: 24 }, (_, i) => i).filter((h) => minHour === undefined || h > minHour)

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      onClick={(e) => e.stopPropagation()}
      style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      className="rounded-[6px] border bg-transparent px-1.5 py-0.5 text-[11px]"
    >
      <option value="">시간</option>
      {hours.map((h) => (
        <option key={h} value={h}>{h}시</option>
      ))}
    </select>
  )
}
