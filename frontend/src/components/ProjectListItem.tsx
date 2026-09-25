import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import type { OtherProject } from '../types/project'
import { SelectableCard, SelectableCardHint } from './SelectableCard'

// 프로젝트 목록과 같이 하기 목록이 서로 다른 카드 모양을 쓰고 있어서 "같이 보는" 느낌이
// 안 났다는 피드백으로, 두 목록이 같은 카드를 공유하게 뺐다. 다른 점은 클릭 시 이동 위치
// (프로젝트 상세 vs 챌린지 상세)와 secondaryLink(반대쪽으로 가는 작은 배지)뿐이다.
export default function ProjectListItem({
  project: p,
  selected,
  onClick,
  onToggleStar,
  secondaryLink,
}: {
  project: OtherProject
  selected: boolean
  onClick: () => void
  onToggleStar: (e: MouseEvent) => void
  secondaryLink?: { to: string; label: string }
}) {
  return (
    <SelectableCard selected={selected} onClick={onClick}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <button onClick={onToggleStar} aria-label={p.starred ? '즐겨찾기 해제' : '즐겨찾기 추가'} className="shrink-0">
            {p.starred ? (
              <IconStarFilled size={16} style={{ color: 'var(--cherry)' }} />
            ) : (
              <IconStar size={16} stroke={1.75} className="text-neutral-300" />
            )}
          </button>
          <span className="truncate text-sm">{p.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {secondaryLink && (
            <Link
              to={secondaryLink.to}
              onClick={(e) => e.stopPropagation()}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: 'var(--cherry-bg)', color: 'var(--cherry)' }}
            >
              {secondaryLink.label}
            </Link>
          )}
          <span className="text-[11px] text-neutral-400">{p.key_metric}</span>
        </div>
      </div>
      {p.total_milestones > 0 && (
        p.total_milestones <= 20 ? (
          <div className="flex gap-1">
            {Array.from({ length: p.total_milestones }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: i < p.completed_milestones ? 'var(--cherry)' : '#E5E5E5' }}
              />
            ))}
          </div>
        ) : (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${(p.completed_milestones / p.total_milestones) * 100}%`, background: 'var(--cherry)' }}
            />
          </div>
        )
      )}
      <SelectableCardHint selected={selected} />
    </SelectableCard>
  )
}
