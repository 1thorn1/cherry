interface Props {
  value: string | null
  onChange: (hour: number | null) => void
}

export default function TimeSelect({ value, onChange }: Props) {
  const current = value ? new Date(value).getHours() : ''

  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      onClick={(e) => e.stopPropagation()}
      className="rounded border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-500"
    >
      <option value="">시간</option>
      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
        <option key={h} value={h}>{h}시</option>
      ))}
    </select>
  )
}
