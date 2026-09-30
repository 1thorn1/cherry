import { useState, type MouseEvent } from 'react'
import { IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp } from '@tabler/icons-react'
import type { Milestone, TimelineEntry } from '../types/project'
import AutoGrowTextarea from './AutoGrowTextarea'
import NoteEntry from './NoteEntry'

const ROW_SIZE = 5

// 시험형(EXAM) 마일스톤은 이제 날짜 하나하나("1주차 월요일 (9/29)")라, 개수가
// 많으면(시험이 멀수록 수십 개) 한 번에 다 보여주면 눈에 안 들어온다 — 제목 맨
// 앞의 "N주차"로 주 단위 아코디언 섹션을 만들고, 그 안은 회차형(진도형)과 똑같은
// 옆으로 넘기는 칩 캐러셀로 보여준다(회차형과 형식을 맞춰 달라는 요청, 2026-09-29).
function parseWeekGroup(title: string): number | null {
  const match = title.match(/^(\d+)주차/)
  return match ? Number(match[1]) : null
}

// 마일스톤 하나의 상세(제목 수정, 오늘 일정 추가, 메모) — 칩을 누른 자리 바로
// 아래에 끼워 넣는다. 여러 개를 동시에 열어둘 수 있어야 해서(다른 칩을 눌러도
// 먼저 연 게 안 닫힘) draft·제목수정 같은 입력 상태는 이 컴포넌트 안에 따로
// 둔다 — 하나로 공유하면 두 번째 걸 열 때 첫 번째가 쓰던 초안이 섞인다.
function MilestoneDetail({
  milestone,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onSendToday,
  onRename,
  onClose,
  renamingId,
  sendingId,
  savingNoteId,
}: {
  milestone: Milestone
  notes: TimelineEntry[]
  onAddNote: (milestoneId: number, body: string, noteDate?: string) => Promise<void>
  onUpdateNote: (noteId: number, body: string | null, url: string | null) => Promise<void>
  onDeleteNote: (noteId: number) => Promise<void>
  onSendToday: (m: Milestone) => void
  onRename: (milestoneId: number, title: string) => Promise<void>
  onClose: () => void
  renamingId: number | null
  sendingId: number | null
  savingNoteId: number | null
}) {
  const [draft, setDraft] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(milestone.title)
  const [noteSort, setNoteSort] = useState<'newest' | 'oldest'>('newest')

  const sortedNotes = noteSort === 'oldest' ? [...notes].reverse() : notes

  function startEditTitle() {
    setTitleDraft(milestone.title)
    setEditingTitle(true)
  }

  async function handleSaveTitle() {
    if (renamingId) return
    const trimmed = titleDraft.trim()
    if (!trimmed) return
    await onRename(milestone.id, trimmed)
    setEditingTitle(false)
  }

  async function handleSubmitNote() {
    if (!draft.trim() || savingNoteId === milestone.id) return
    await onAddNote(milestone.id, draft.trim())
    setDraft('')
  }

  return (
    <div className="mt-1.5 rounded-lg border border-neutral-200 p-3 animate-[fade-in_0.25s_ease-out]">
      <div className="mb-2 flex items-center justify-between gap-2">
        {editingTitle ? (
          <div className="flex flex-1 items-center gap-1.5">
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSaveTitle()
                }
              }}
              autoFocus
              placeholder="예: 1강 - 미분 기초"
              className="flex-1 rounded-lg border border-neutral-200 px-2 py-1 text-sm outline-none focus:border-neutral-400"
            />
            <button
              onClick={handleSaveTitle}
              disabled={renamingId === milestone.id}
              className="text-xs font-medium disabled:opacity-50"
              style={{ color: 'var(--cherry)' }}
            >
              저장
            </button>
            <button onClick={() => setEditingTitle(false)} className="text-xs text-neutral-400">취소</button>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-1.5">
            <p className="text-sm font-medium">{milestone.title}</p>
            <button onClick={startEditTitle} className="text-[11px] text-neutral-300 hover:text-neutral-500">
              수정
            </button>
          </div>
        )}
        <button onClick={onClose} className="text-xs text-neutral-300">닫기</button>
      </div>

      {!milestone.completed ? (
        <button
          onClick={() => onSendToday(milestone)}
          disabled={sendingId === milestone.id}
          className={`mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium disabled:opacity-50 ${
            milestone.scheduled_today ? 'bg-neutral-100 text-neutral-400' : 'bg-neutral-100 text-neutral-500'
          }`}
          style={milestone.scheduled_today ? { color: 'var(--cherry)', background: 'var(--cherry-bg)' } : undefined}
        >
          {milestone.scheduled_today ? '오늘 일정에서 빼기' : '오늘 일정에 추가'}
        </button>
      ) : (
        <p className="mb-3 text-xs text-neutral-400">
          완료됨{milestone.completed_at ? ` · ${milestone.completed_at.slice(0, 10)}` : ''}
        </p>
      )}

      <div className="mb-2">
        <AutoGrowTextarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              handleSubmitNote()
            }
          }}
          placeholder="이 구간 메모 (마크다운 지원)"
          rows={3}
          className="mb-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-shadow focus:border-[var(--cherry)] focus:ring-2 focus:ring-[var(--cherry-bg)]"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-neutral-300">⌘/Ctrl + Enter로 저장</span>
          <button
            onClick={handleSubmitNote}
            disabled={savingNoteId === milestone.id}
            className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-500 disabled:opacity-50"
          >
            {savingNoteId === milestone.id ? '저장 중...' : '기록'}
          </button>
        </div>
      </div>

      {sortedNotes.length > 0 && (
        <>
          {sortedNotes.length > 1 && (
            <div className="mb-1.5 flex justify-end">
              <button
                onClick={() => setNoteSort((s) => (s === 'newest' ? 'oldest' : 'newest'))}
                className="text-[10px] text-neutral-400 hover:text-neutral-600"
              >
                {noteSort === 'newest' ? '최신순' : '오래된순'}
              </button>
            </div>
          )}
          <ul className="space-y-1.5">
            {sortedNotes.map((entry) => (
              <li key={`${entry.kind}-${entry.ref_id}`} className="rounded-lg bg-neutral-50 px-3 py-2">
                <NoteEntry entry={entry} onUpdate={onUpdateNote} onDelete={onDeleteNote} hideKindLabel showDate />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default function MilestoneChipGrid({
  milestones,
  notesByMilestone,
  onComplete,
  onUncomplete,
  onSendToday,
  onRename,
  renamingId,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  completingId,
  sendingId,
  savingNoteId,
  groupByWeek,
}: {
  milestones: Milestone[]
  notesByMilestone: Map<number, TimelineEntry[]>
  onComplete: (m: Milestone) => void
  onUncomplete: (m: Milestone) => void
  onSendToday: (m: Milestone) => void
  onRename: (milestoneId: number, title: string) => Promise<void>
  renamingId: number | null
  onAddNote: (milestoneId: number, body: string, noteDate?: string) => Promise<void>
  onUpdateNote: (noteId: number, body: string | null, url: string | null) => Promise<void>
  onDeleteNote: (noteId: number) => Promise<void>
  completingId: number | null
  sendingId: number | null
  savingNoteId: number | null
  // 시험형처럼 날짜 단위로 쪼개져 개수가 많은 마일스톤을 주 단위 아코디언으로 묶어 보여준다.
  groupByWeek?: boolean
}) {
  // 칩을 누른 자리 바로 아래에 상세를 끼워 넣고, 여러 개를 동시에 열어둘 수
  // 있어야 한다는 요청(2026-09-29)으로 단일 선택(expandedId)에서 Set으로 바꿨다 —
  // 다른 칩을 눌러도 먼저 열어둔 게 안 닫힌다.
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(0)
  const [pageByWeek, setPageByWeek] = useState<Record<number, number>>({})
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(() => new Set([1]))

  if (milestones.length === 0) {
    return <p className="py-4 text-center text-xs text-neutral-400">마일스톤이 없어요</p>
  }

  // 칩을 누르면 내용(메모·완료 여부)만 보여주고, 완료/취소는 칩 왼쪽 위의 작은 체크
  // 버튼으로만 일어난다 — 둘을 같은 클릭에 묶어놨더니 "내용만 보려 했는데 취소돼버린다"는
  // 문제가 있었다.
  function toggleExpanded(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleWeek(week: number) {
    setOpenWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(week)) next.delete(week)
      else next.add(week)
      return next
    })
  }

  function handleToggleComplete(e: MouseEvent, m: Milestone) {
    e.stopPropagation()
    if (completingId) return
    if (m.completed) onUncomplete(m)
    else onComplete(m)
  }

  // 열려 있는 마일스톤들의 상세 패널 — 그 칩들이 속한 캐러셀 바로 아래(같은 스코프
  // 안)에서만 그린다. 여러 주차에 걸쳐 열어도 각자 자기 주차 아코디언 밑에 뜬다.
  function renderOpenDetails(items: Milestone[]) {
    return items
      .filter((m) => expandedIds.has(m.id))
      .map((m) => (
        <MilestoneDetail
          key={m.id}
          milestone={m}
          notes={notesByMilestone.get(m.id) ?? []}
          onAddNote={onAddNote}
          onUpdateNote={onUpdateNote}
          onDeleteNote={onDeleteNote}
          onSendToday={onSendToday}
          onRename={onRename}
          onClose={() => toggleExpanded(m.id)}
          renamingId={renamingId}
          sendingId={sendingId}
          savingNoteId={savingNoteId}
        />
      ))
  }

  // 옆으로 넘기는 칩 캐러셀 — 평평한 칩 그리드(진도형·자유형)와 주 단위 아코디언
  // 안(시험형)에서 똑같이 쓴다. stripWeekPrefix는 아코디언 섹션 헤더에 이미 "N주차"가
  // 있으니 칩 안 제목에서는 중복되는 접두어를 뺀다.
  function renderCarousel(
    items: Milestone[],
    page: number,
    setPage: (updater: (prev: number) => number) => void,
    stripWeekPrefix: boolean,
  ) {
    const pageCount = Math.ceil(items.length / ROW_SIZE)
    const hasPages = pageCount > 1
    const currentPage = Math.min(page, pageCount - 1)

    return (
      <>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={!hasPages || currentPage === 0}
            aria-label="이전"
            className="flex h-7 w-5 shrink-0 items-center justify-center text-neutral-300 disabled:opacity-0"
          >
            <IconChevronLeft size={16} stroke={2} />
          </button>

          <div className="flex-1 overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {Array.from({ length: pageCount }).map((_, pageIndex) => (
                <div key={pageIndex} className="grid w-full shrink-0 grid-cols-5 gap-1.5">
                  {items.slice(pageIndex * ROW_SIZE, pageIndex * ROW_SIZE + ROW_SIZE).map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleExpanded(m.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleExpanded(m.id)
                        }
                      }}
                      className="relative flex h-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-transparent p-1 pt-2.5 text-center transition-colors"
                      style={{
                        // 완료 여부는 채우기 색으로만 표시한다(테두리색으로 구분하지 않는다) — 완료
                        // 안 됐다고 흰 배경에 옅은 테두리만 두면 눈에 잘 안 띄어서, 명확한 회색
                        // 채우기를 기본값으로 준다. 선택(패널 열림) 표시만 링(box-shadow)으로 얹는다.
                        // inset을 써서 칩 박스 안쪽으로만 그린다 — 바깥쪽 링은 페이지 캐러셀의
                        // overflow-hidden에 가장자리 칩(첫/끝 칸)의 테두리가 잘려 보이는 문제가 있었다.
                        background: m.completed ? 'var(--cherry-bg)' : '#F1EFE8',
                        boxShadow: expandedIds.has(m.id) ? 'inset 0 0 0 2px var(--cherry)' : 'none',
                      }}
                    >
                      <button
                        onClick={(e) => handleToggleComplete(e, m)}
                        disabled={completingId === m.id}
                        aria-label={m.completed ? '완료 취소' : '완료 처리'}
                        className={`absolute left-1 top-1 flex h-3.5 w-3.5 items-center justify-center text-white disabled:opacity-50 ${
                          m.completed ? 'rounded-sm' : 'rounded-sm border-[1.5px] border-neutral-300 bg-white'
                        }`}
                        style={m.completed ? { background: 'var(--cherry)' } : undefined}
                      >
                        {m.completed && <IconCheck size={8} stroke={3} />}
                      </button>
                      <span className="text-[9px] font-medium" style={{ color: m.completed ? 'var(--cherry)' : '#999' }}>
                        {m.seq}
                      </span>
                      <span className="line-clamp-1 w-full truncate text-[8px] leading-tight text-neutral-500">
                        {stripWeekPrefix ? m.title.replace(/^\d+주차\s*/, '') : m.title}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={!hasPages || currentPage === pageCount - 1}
            aria-label="다음"
            className="flex h-7 w-5 shrink-0 items-center justify-center text-neutral-300 disabled:opacity-0"
          >
            <IconChevronRight size={16} stroke={2} />
          </button>
        </div>

        {hasPages && (
          <div className="mt-1.5 flex justify-center gap-1">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(() => i)}
                aria-label={`${i + 1}페이지`}
                className="h-1.5 w-1.5 rounded-full transition-colors"
                style={{ background: i === currentPage ? 'var(--cherry)' : '#E5E1D8' }}
              />
            ))}
          </div>
        )}
      </>
    )
  }

  const weekGroups: { week: number; items: Milestone[] }[] = []
  if (groupByWeek) {
    const byWeek = new Map<number, Milestone[]>()
    for (const m of milestones) {
      const week = parseWeekGroup(m.title) ?? 0
      byWeek.set(week, [...(byWeek.get(week) ?? []), m])
    }
    for (const [week, items] of byWeek) weekGroups.push({ week, items })
  }

  return (
    <div>
      {!groupByWeek && (
        <>
          {renderCarousel(milestones, page, (updater) => setPage(updater), false)}
          {renderOpenDetails(milestones)}
        </>
      )}

      {groupByWeek && (
        <div className="space-y-1.5">
          {weekGroups.map(({ week, items }) => {
            const doneCount = items.filter((m) => m.completed).length
            const isOpen = openWeeks.has(week)
            return (
              <div key={week} className="overflow-hidden rounded-lg border border-neutral-200">
                <button
                  onClick={() => toggleWeek(week)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left"
                >
                  <span className="text-xs font-medium text-neutral-600">{week > 0 ? `${week}주차` : '기타'}</span>
                  <span className="text-[11px] text-neutral-400">{doneCount}/{items.length} 완료</span>
                  <span className="ml-auto text-neutral-300">
                    {isOpen ? <IconChevronUp size={14} stroke={1.75} /> : <IconChevronDown size={14} stroke={1.75} />}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-100 p-2">
                    {renderCarousel(
                      items,
                      pageByWeek[week] ?? 0,
                      (updater) => setPageByWeek((prev) => ({ ...prev, [week]: updater(prev[week] ?? 0) })),
                      true,
                    )}
                    {renderOpenDetails(items)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
