import type { ReactNode } from 'react'
import { IconChevronRight } from '@tabler/icons-react'

// 눌러도 바로 안 들어가고 일단 선택(테두리 강조)만 되게, 선택된 걸 한 번 더 눌러야
// 들어가는 카드. 프로젝트 목록과 같이하기 목록에서 같은 모양으로 쓴다.
export function SelectableCard({
  children,
  selected,
  onClick,
}: {
  children: ReactNode
  selected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-neutral-50"
      style={{
        borderColor: selected ? 'var(--cherry)' : '#E5E5E5',
        boxShadow: selected ? '0 0 0 1px var(--cherry)' : 'none',
      }}
    >
      {children}
    </div>
  )
}

export function SelectableCardHint({ selected }: { selected: boolean }) {
  if (!selected) return null
  return (
    <div className="mt-2 flex items-center justify-end gap-0.5 text-[11px] font-medium" style={{ color: 'var(--cherry)' }}>
      한 번 더 누르면 들어가요
      <IconChevronRight size={13} stroke={2} />
    </div>
  )
}
