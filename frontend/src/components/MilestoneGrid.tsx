import { useEffect, useState } from 'react'
import type { Milestone } from '../types/project'

type WeekKey = 'last' | 'this' | 'next'

function isoWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function progressLabel(list: Milestone[]) {
  return `${list.filter((m) => m.completed).length} / ${list.length}`
}

export default function MilestoneGrid({
  projectId,
  milestones,
  onSendToday,
  sendingId,
  sentIds,
}: {
  projectId: number
  milestones: Milestone[]
  onSendToday: (m: Milestone) => void
  sendingId: number | null
  sentIds: Set<number>
}) {
  const storageKey = `project-grid-collapsed-${projectId}`
  const [collapsed, setCollapsed] = useState(false)
  const [selectedWeek, setSelectedWeek] = useState<WeekKey>('this')

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(storageKey) === '1')
    } catch {
      // 프라이빗 모드 등에서 접근 불가하면 기본값(펼침) 유지
    }
  }, [storageKey])

  function toggleCollapsed(next: boolean) {
    setCollapsed(next)
    try {
      localStorage.setItem(storageKey, next ? '1' : '0')
    } catch {
      // 조용히 무시
    }
  }

  const now = new Date()
  const thisWeek = isoWeekLabel(now)
  const lastWeek = isoWeekLabel(addDays(now, -7))
  const nextWeek = isoWeekLabel(addDays(now, 7))

  const groups: Record<string, Milestone[]> = {}
  for (const m of milestones) {
    const key = m.target_week ?? '기타'
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }

  const thisWeekMilestones = groups[thisWeek] ?? []
  const lastWeekMilestones = groups[lastWeek] ?? []
  const nextWeekMilestones = groups[nextWeek] ?? []
  const laterMilestones = Object.keys(groups)
    .filter((w) => w !== lastWeek && w !== thisWeek && w !== nextWeek)
    .sort()
    .flatMap((w) => groups[w])

  function renderMilestoneRow(m: Milestone) {
    return (
      <div key={m.id} className="flex items-center justify-between border-b border-neutral-100 py-2.5">
        <span className={`text-sm ${m.completed ? 'text-neutral-400 line-through' : ''}`}>{m.title}</span>
        {!m.completed && (
          <button
            onClick={() => onSendToday(m)}
            disabled={sendingId === m.id}
            className="flex-none rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium disabled:opacity-50"
          >
            {sentIds.has(m.id) ? '추가됨' : '오늘로 보내기'}
          </button>
        )}
      </div>
    )
  }

  const sections: { key: WeekKey; label: string; milestones: Milestone[]; highlight?: boolean }[] = [
    { key: 'last', label: '지난주', milestones: lastWeekMilestones },
    { key: 'this', label: '이번주', milestones: thisWeekMilestones, highlight: true },
    { key: 'next', label: '다음주', milestones: nextWeekMilestones },
  ]

  return (
    <div>
      {thisWeekMilestones.length > 0 && (
        <p className="mb-4 text-xs text-neutral-500">
          이번주 목표: {thisWeekMilestones.length}개 중 <span className="font-medium" style={{ color: 'var(--cherry)' }}>{thisWeekMilestones.filter((m) => m.completed).length}개 완료</span>
        </p>
      )}

      {collapsed ? (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-neutral-500">
              {sections.find((s) => s.key === selectedWeek)?.label} {progressLabel(sections.find((s) => s.key === selectedWeek)?.milestones ?? [])}
            </p>
            <select
              value={selectedWeek}
              onChange={(e) => {
                const value = e.target.value
                if (value === 'all') {
                  toggleCollapsed(false)
                } else {
                  setSelectedWeek(value as WeekKey)
                }
              }}
              className="rounded-md border border-neutral-200 px-2 py-1 text-[11px]"
            >
              <option value="last">지난주 ({progressLabel(lastWeekMilestones)})</option>
              <option value="this">이번주 ({progressLabel(thisWeekMilestones)})</option>
              <option value="next">다음주 ({progressLabel(nextWeekMilestones)})</option>
              <option value="all">모두 펼치기</option>
            </select>
          </div>
          {(() => {
            const active = sections.find((s) => s.key === selectedWeek)?.milestones ?? []
            return active.length > 0
              ? active.map(renderMilestoneRow)
              : <p className="py-4 text-center text-xs text-neutral-400">해당 주에 마일스톤이 없어요</p>
          })()}
        </div>
      ) : (
        <div>
          <button onClick={() => toggleCollapsed(true)} className="mb-3 text-xs text-neutral-400">접기</button>
          {sections.map((s) => s.milestones.length > 0 && (
            <div key={s.key} className="mb-4">
              <p className="mb-1 text-xs font-medium" style={{ color: s.highlight ? 'var(--cherry)' : '#999' }}>
                {s.label} ({progressLabel(s.milestones)})
              </p>
              {s.milestones.map(renderMilestoneRow)}
            </div>
          ))}
          {laterMilestones.length > 0 && (
            <div className="mb-4">
              <p className="mb-1 text-xs font-medium text-neutral-400">
                {laterMilestones[0].title}–{laterMilestones[laterMilestones.length - 1].title} 더 보기
              </p>
              {laterMilestones.map(renderMilestoneRow)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
