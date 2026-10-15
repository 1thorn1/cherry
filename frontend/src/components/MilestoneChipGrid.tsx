import { useState, type MouseEvent } from 'react'
import { IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp } from '@tabler/icons-react'
import type { Milestone, TimelineEntry } from '../types/project'
import AutoGrowTextarea from './AutoGrowTextarea'
import NoteEntry from './NoteEntry'
import Collapse from './Collapse'

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
    <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)] p-4">
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
              className="flex-1 rounded-lg border border-[var(--line)] px-2 py-1 text-sm outline-none focus:border-[var(--line-strong)]"
            />
            <button
              onClick={handleSaveTitle}
              disabled={renamingId === milestone.id}
              className="text-xs font-medium disabled:opacity-50"
              style={{ color: 'var(--sprout)' }}
            >
              저장
            </button>
            <button onClick={() => setEditingTitle(false)} className="text-xs text-[var(--ink-muted)]">취소</button>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-1.5">
            <p className="text-sm font-medium">{milestone.title}</p>
            <button onClick={startEditTitle} className="text-[11px] text-[var(--ink-faint)] hover:text-[var(--ink-muted)]">
              수정
            </button>
          </div>
        )}
        <button onClick={onClose} className="text-xs text-[var(--ink-faint)]">닫기</button>
      </div>

      {!milestone.completed ? (
        <button
          onClick={() => onSendToday(milestone)}
          disabled={sendingId === milestone.id}
          className={`mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium disabled:opacity-50 ${
            milestone.scheduled_today ? 'bg-[var(--surface-sunken)] text-[var(--ink-muted)]' : 'bg-[var(--surface-sunken)] text-[var(--ink-muted)]'
          }`}
          style={milestone.scheduled_today ? { color: 'var(--sprout)', background: 'var(--sprout-soft)' } : undefined}
        >
          {milestone.scheduled_today ? '오늘 일정에서 빼기' : '오늘 일정에 추가'}
        </button>
      ) : (
        <p className="mb-3 text-xs text-[var(--ink-muted)]">
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
          className="mb-1.5 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none transition-shadow focus:border-[var(--sprout)] focus:ring-2 focus:ring-[var(--sprout-soft)]"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[var(--ink-faint)]">⌘/Ctrl + Enter로 저장</span>
          <button
            onClick={handleSubmitNote}
            disabled={savingNoteId === milestone.id}
            className="rounded-lg border border-[var(--line)] px-3 py-1 text-xs font-medium text-[var(--ink-muted)] disabled:opacity-50"
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
                className="text-[10px] text-[var(--ink-muted)] hover:text-[var(--ink)]"
              >
                {noteSort === 'newest' ? '최신순' : '오래된순'}
              </button>
            </div>
          )}
          <ul className="space-y-3">
            {sortedNotes.map((entry) => (
              <li key={`${entry.kind}-${entry.ref_id}`} className="rounded-lg bg-[var(--surface-sunken)] px-3 py-2">
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
  groupByStatus,
  onChangeProgress,
  progressingId,
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
  groupByStatus?: boolean
  onChangeProgress?: (m: Milestone, inProgress: boolean) => void
  progressingId?: number | null
}) {
  // 칩을 누른 자리 바로 아래에 상세를 끼워 넣고, 여러 개를 동시에 열어둘 수
  // 있어야 한다는 요청(2026-09-29)으로 단일 선택(expandedId)에서 Set으로 바꿨다 —
  // 다른 칩을 눌러도 먼저 열어둔 게 안 닫힌다.
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(0)
  const [pageByWeek, setPageByWeek] = useState<Record<number, number>>({})
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(() => new Set([1]))

  if (milestones.length === 0 && !groupByStatus) {
    return <p className="py-4 text-center text-xs text-[var(--ink-muted)]">마일스톤이 없어요</p>
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
      .map((m) => (
        <Collapse key={m.id} open={expandedIds.has(m.id)}>
        <MilestoneDetail
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
        </Collapse>
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
            className="flex h-7 w-5 shrink-0 items-center justify-center text-[var(--ink-faint)] disabled:opacity-0"
          >
            <IconChevronLeft size={16} stroke={2} />
          </button>

          <div className="flex-1 overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {Array.from({ length: pageCount }).map((_, pageIndex) => (
                <div key={pageIndex} className="grid w-full shrink-0 grid-cols-5 gap-2">
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
                      className="relative flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-[var(--line)] px-1.5 pb-3 pt-7 text-center transition-colors hover:border-[var(--line-strong)]"
                      style={{
                        // 완료 여부는 채우기 색으로만 표시한다(테두리색으로 구분하지 않는다) — 완료
                        // 안 됐다고 흰 배경에 옅은 테두리만 두면 눈에 잘 안 띄어서, 명확한 회색
                        // 채우기를 기본값으로 준다. 선택(패널 열림) 표시만 링(box-shadow)으로 얹는다.
                        // inset을 써서 칩 박스 안쪽으로만 그린다 — 바깥쪽 링은 페이지 캐러셀의
                        // overflow-hidden에 가장자리 칩(첫/끝 칸)의 테두리가 잘려 보이는 문제가 있었다.
                        background: m.completed ? 'var(--sprout-soft)' : 'var(--surface-sunken)',
                        boxShadow: expandedIds.has(m.id) ? 'inset 0 0 0 2px var(--sprout)' : 'none',
                      }}
                    >
                      <button
                        onClick={(e) => handleToggleComplete(e, m)}
                        disabled={completingId === m.id}
                        aria-label={`${m.title} ${m.completed ? '완료 취소' : '완료 처리'}`}
                        className={`absolute left-2 top-2 flex h-5 w-5 items-center justify-center text-white disabled:opacity-50 ${
                          m.completed ? 'rounded-sm' : 'rounded-sm border-[1.5px] border-[var(--line-strong)] bg-[var(--surface)]'
                        }`}
                        style={m.completed ? { background: 'var(--sprout)' } : undefined}
                      >
                        {m.completed && <IconCheck size={12} stroke={3} />}
                      </button>
                      <span className="text-[13px] font-semibold tabular-nums" style={{ color: m.completed ? 'var(--sprout)' : 'var(--ink-faint)' }}>
                        {m.seq}
                      </span>
                      <span className="line-clamp-2 w-full text-[11px] leading-snug text-[var(--ink-muted)]">
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
            className="flex h-7 w-5 shrink-0 items-center justify-center text-[var(--ink-faint)] disabled:opacity-0"
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
                style={{ background: i === currentPage ? 'var(--sprout)' : 'var(--line)' }}
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

  if (groupByStatus) {
    const sections = [
      { key: 'ready', title: '시작 전', color: 'var(--ink-muted)', soft: 'var(--surface-sunken)', empty: '새로 추가한 항목이 여기에 표시돼요.', items: milestones.filter((m) => !m.completed && !m.started_at) },
      { key: 'active', title: '진행 중', color: 'var(--wood)', soft: 'var(--wood-soft)', empty: '시작한 항목이 여기에 표시돼요.', items: milestones.filter((m) => !m.completed && m.started_at) },
      { key: 'done', title: '완료', color: 'var(--sprout)', soft: 'var(--sprout-soft)', empty: '완료한 항목이 여기에 표시돼요.', items: milestones.filter((m) => m.completed) },
    ]
    return (
      <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <section key={section.key} aria-label={section.title} className="min-w-0 rounded-2xl border border-[var(--line)] bg-[var(--surface-sunken)] p-3 lg:min-h-64">
            <div className="mb-3 flex items-center gap-2 px-1 py-1">
              <span className="h-2 w-2 rounded-full" style={{ background: section.color }} />
              <h3 className="text-[14px] font-semibold text-[var(--ink)]">{section.title}</h3>
              <span className="rounded-full px-2 py-0.5 text-[12px] tabular-nums" style={{ color: section.color, background: section.soft }}>{section.items.length}</span>
            </div>
            {section.items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--line-strong)] px-4 py-5 text-[12px] leading-relaxed text-[var(--ink-muted)]">{section.empty}</p>
            ) : (
              <div className="space-y-2">
                {section.items.map((m) => (
                  <div key={m.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => handleToggleComplete(e, m)}
                        disabled={completingId !== null || progressingId != null}
                        aria-label={`${m.title} ${m.completed ? '완료 취소' : '완료 처리'}`}
                        aria-pressed={m.completed}
                        className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border border-[var(--line-strong)] disabled:opacity-50"
                        style={m.completed ? { background: 'var(--sprout)', borderColor: 'var(--sprout)', color: 'white' } : undefined}
                      >{m.completed && <IconCheck size={13} stroke={2.5} />}</button>
                      <div className="min-w-0 flex-1">
                        <button onClick={() => toggleExpanded(m.id)} aria-expanded={expandedIds.has(m.id)} className="flex w-full items-start justify-between gap-2 text-left">
                          <span className={`break-words text-[14px] font-medium ${m.completed ? 'text-[var(--ink-muted)] line-through' : 'text-[var(--ink)]'}`}>{m.title}</span>
                          <IconChevronDown size={16} className={`mt-0.5 flex-none text-[var(--ink-muted)] transition-transform ${expandedIds.has(m.id) ? 'rotate-180' : ''}`} />
                        </button>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {m.scheduled_today && !m.completed && <span className="rounded-md bg-[var(--wood-soft)] px-2 py-0.5 text-[11px] text-[var(--wood)]">오늘 할 일</span>}
                          {(notesByMilestone.get(m.id)?.length ?? 0) > 0 && <span className="text-[11px] text-[var(--ink-muted)]">기록 {notesByMilestone.get(m.id)?.length}개</span>}
                          {!m.completed && <button
                            onClick={() => onChangeProgress?.(m, !m.started_at)}
                            disabled={progressingId != null || completingId !== null}
                            className="rounded-lg bg-[var(--surface-sunken)] px-2.5 py-1 text-[12px] font-medium text-[var(--wood)] disabled:opacity-50"
                          >{progressingId === m.id ? '변경 중...' : m.started_at ? '시작 전으로' : '시작'}</button>}
                          {!m.completed && <button onClick={() => onSendToday(m)} disabled={sendingId !== null} className="text-[12px] text-[var(--ink-muted)] hover:text-[var(--ink)] disabled:opacity-50">{m.scheduled_today ? '오늘 일정에서 빼기' : '오늘 일정에 추가'}</button>}
                          {m.completed_at && <span className="text-[11px] text-[var(--ink-muted)]">{m.completed_at.slice(0, 10)} 완료</span>}
                        </div>
                      </div>
                    </div>
                    {renderOpenDetails([m])}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    )
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
              <div key={week} className="overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                <button
                  onClick={() => toggleWeek(week)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left"
                >
                  <span className="text-[14px] font-semibold text-[var(--ink)]">{week > 0 ? `${week}주차` : '기타'}</span>
                  <span className="text-[11px] text-[var(--ink-muted)]">{doneCount}/{items.length} 완료</span>
                  <span className="ml-auto text-[var(--ink-faint)]">
                    {isOpen ? <IconChevronUp size={14} stroke={1.75} /> : <IconChevronDown size={14} stroke={1.75} />}
                  </span>
                </button>

                <Collapse open={isOpen}>
                  <div className="border-t border-[var(--line)] p-3">
                    {renderCarousel(
                      items,
                      pageByWeek[week] ?? 0,
                      (updater) => setPageByWeek((prev) => ({ ...prev, [week]: updater(prev[week] ?? 0) })),
                      true,
                    )}
                    {renderOpenDetails(items)}
                  </div>
                </Collapse>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
