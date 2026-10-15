import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { IconBook2, IconCalendarDue, IconFolder, IconStar, IconStarFilled } from '@tabler/icons-react'
import type { OtherProject } from '../types/project'
import { CoinIcon } from './Coin'
import { ProgressBar } from './ui'

const categoryStyles = [
  { bg: 'var(--sprout-soft)', dot: 'var(--sprout)' },
  { bg: 'var(--coin-soft)', dot: 'var(--coin)' },
  { bg: 'var(--sky-soft)', dot: 'var(--sky)' },
  { bg: 'var(--barn-soft)', dot: 'var(--barn)' },
]

function typeCopy(project: OtherProject) {
  if (project.type === 'EXAM') return '시험일까지 차근차근 준비해요.'
  if (project.type === 'PROGRESS') return '정해둔 회차를 하나씩 끝내요.'
  return '작업을 묶어 흐름을 만들어가요.'
}

export default function ProjectListItem({
  project: p, selected, onClick, onToggleStar, secondaryLink, tag,
}: {
  project: OtherProject
  selected: boolean
  onClick: () => void
  onToggleStar: (e: MouseEvent) => void
  secondaryLink?: { to: string; label: string }
  tag?: string
}) {
  const style = categoryStyles[(p.project_id - 1) % categoryStyles.length]
  const pct = p.total_milestones ? Math.round((p.completed_milestones / p.total_milestones) * 100) : 0
  const Icon = p.type === 'PROGRESS' ? IconBook2 : p.type === 'EXAM' ? IconCalendarDue : IconFolder

  return (
    <article
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      role="button"
      tabIndex={0}
      className={`cursor-pointer rounded-2xl border bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 ${selected ? 'border-[var(--wood)] ring-1 ring-[var(--wood)]' : 'border-[var(--line)]'}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl" style={{ background: style.bg, color: style.dot }}>
          <Icon size={21} stroke={1.8} />
        </span>
        <button onClick={onToggleStar} aria-label={p.starred ? '즐겨찾기 해제' : '즐겨찾기 추가'} className="-mr-1 -mt-1 p-1 text-[var(--ink-faint)]">
          {p.starred ? <IconStarFilled size={18} color="var(--coin)" /> : <IconStar size={18} stroke={1.75} />}
        </button>
      </div>

      <h2 className="truncate font-display text-[20px] leading-7 text-[var(--ink)]">{p.name}</h2>
      <p className="mt-1 h-10 text-[13px] leading-5 text-[var(--ink-muted)]">{typeCopy(p)}</p>

      <div className="mt-4">
        <ProgressBar value={p.completed_milestones} max={p.total_milestones || 1} label={`${p.name} 진행률`} />
        <div className="mt-2 flex items-center justify-between text-[12px]">
          <span className="text-[var(--ink-muted)]">{p.total_milestones ? `${p.completed_milestones} / ${p.total_milestones} 완료 · ${pct}%` : '할 일을 추가해보세요'}</span>
          <span className="inline-flex items-center gap-1 font-medium text-[var(--coin-ink)]"><CoinIcon size={13} />{p.completed_milestones * 10}</span>
        </div>
      </div>

      <footer className="mt-4 flex min-h-5 items-center justify-between border-t border-[var(--line)] pt-3 text-[12px] text-[var(--ink-muted)]">
        <span>{p.key_metric}</span>
        {secondaryLink && <Link to={secondaryLink.to} onClick={(e) => e.stopPropagation()} className="rounded-lg bg-[var(--wood-soft)] px-2 py-1 font-medium text-[var(--wood-deep)]">{secondaryLink.label}</Link>}
        {tag && <span className="rounded-lg bg-[var(--surface-sunken)] px-2 py-1">{tag}</span>}
      </footer>
      {selected && <p className="mt-3 text-right text-[11px] font-medium text-[var(--wood)]">한 번 더 누르면 들어가요</p>}
    </article>
  )
}
