const OPTIONS: { label: string; value: number | null }[] = [
  { label: '안 함', value: null },
  { label: '정시', value: 0 },
  { label: '10분 전', value: 10 },
  { label: '30분 전', value: 30 },
]

interface Props {
  value: number | null
  onChange: (offset: number | null) => void
}

export default function NotifySelect({ value, onChange }: Props) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      onClick={(e) => e.stopPropagation()}
      className="rounded border border-neutral-200 px-1.5 py-0.5 text-[11px] text-neutral-500"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.label} value={opt.value ?? ''}>
          {value !== null && opt.value === null ? '알림 끄기' : opt.label}
        </option>
      ))}
    </select>
  )
}
