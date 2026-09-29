import { useState, type MouseEvent } from 'react'
import { IconCheck, IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp } from '@tabler/icons-react'
import type { Milestone, TimelineEntry } from '../types/project'
import AutoGrowTextarea from './AutoGrowTextarea'
import NoteEntry from './NoteEntry'
import WeekDayAccordion from './WeekDayAccordion'

// 시험형(EXAM) 마일스톤은 이제 날짜 하나하나("1주차 월요일 (9/29)")라, 개수가
// 많으면(시험이 멀수록 수십 개) 평평한 칩 그리드로는 한눈에 보기 힘들다 — 제목
// 맨 앞의 "N주차"로 주 단위 아코디언 섹션을 만들어 묶어서 보여준다.
function parseWeekGroup(title: string): number | null {
  const match = title.match(/^(\d+)주차/)
  return match ? Number(match[1]) : null
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
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')
  const [page, setPage] = useState(0)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [noteSort, setNoteSort] = useState<'newest' | 'oldest'>('newest')
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(() => new Set([1]))

  if (milestones.length === 0) {
    return <p className="py-4 text-center text-xs text-neutral-400">마일스톤이 없어요</p>
  }

  const ROW_SIZE = 5
  const pageCount = Math.ceil(milestones.length / ROW_SIZE)
  const hasPages = pageCount > 1
  const currentPage = Math.min(page, pageCount - 1)

  const selected = milestones.find((m) => m.id === expandedId) ?? null

  // 칩을 누르면 내용(메모·완료 여부)만 보여주고, 완료/취소는 칩 왼쪽 위의 작은 체크
  // 버튼으로만 일어난다 — 둘을 같은 클릭에 묶어놨더니 "내용만 보려 했는데 취소돼버린다"는
  // 문제가 있었다.
  function handleChipClick(m: Milestone) {
    setExpandedId((prev) => (prev === m.id ? null : m.id))
    setDraft('')
    setEditingTitle(false)
  }

  function toggleWeek(week: number) {
    setOpenWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(week)) next.delete(week)
      else next.add(week)
      return next
    })
  }

  function startEditTitle(m: Milestone) {
    setTitleDraft(m.title)
    setEditingTitle(true)
  }

  async function handleSaveTitle() {
    if (!selected || renamingId) return
    const trimmed = titleDraft.trim()
    if (!trimmed) return
    await onRename(selected.id, trimmed)
    setEditingTitle(false)
  }

  function goToPage(next: number) {
    setPage(Math.max(0, Math.min(pageCount - 1, next)))
  }

  function handleToggleComplete(e: MouseEvent, m: Milestone) {
    e.stopPropagation()
    if (completingId) return
    if (m.completed) onUncomplete(m)
    else onComplete(m)
  }

  async function handleSubmitNote() {
    if (!selected || !draft.trim() || savingNoteId === selected.id) return
    await onAddNote(selected.id, draft.trim())
    setDraft('')
  }

  // 백엔드가 최신순으로 내려주므로, "오래된순"일 때만 뒤집는다.
  const rawSelectedNotes = selected ? notesByMilestone.get(selected.id) ?? [] : []
  const selectedNotes = noteSort === 'oldest' ? [...rawSelectedNotes].reverse() : rawSelectedNotes

  // 선택된 마일스톤의 상세(제목 수정, 오늘 일정 추가, 메모) — 평평한 칩 그리드의
  // 하단 패널과 주 단위 아코디언의 행 안쪽 패널이 내용을 그대로 공유한다.
  function renderDetailBody() {
    if (!selected) return null
    return (
      <>
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
                disabled={renamingId === selected.id}
                className="text-xs font-medium disabled:opacity-50"
                style={{ color: 'var(--cherry)' }}
              >
                저장
              </button>
              <button onClick={() => setEditingTitle(false)} className="text-xs text-neutral-400">취소</button>
            </div>
          ) : (
            <div className="flex flex-1 items-center gap-1.5">
              <p className="text-sm font-medium">{selected.title}</p>
              <button onClick={() => startEditTitle(selected)} className="text-[11px] text-neutral-300 hover:text-neutral-500">
                수정
              </button>
            </div>
          )}
          <button onClick={() => setExpandedId(null)} className="text-xs text-neutral-300">닫기</button>
        </div>

        {!selected.completed ? (
          <button
            onClick={() => onSendToday(selected)}
            disabled={sendingId === selected.id}
            className={`mb-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium disabled:opacity-50 ${
              selected.scheduled_today ? 'bg-neutral-100 text-neutral-400' : 'bg-neutral-100 text-neutral-500'
            }`}
            style={selected.scheduled_today ? { color: 'var(--cherry)', background: 'var(--cherry-bg)' } : undefined}
          >
            {selected.scheduled_today ? '오늘 일정에서 빼기' : '오늘 일정에 추가'}
          </button>
        ) : (
          <p className="mb-3 text-xs text-neutral-400">
            완료됨{selected.completed_at ? ` · ${selected.completed_at.slice(0, 10)}` : ''}
          </p>
        )}

        {selected.target_week ? (
          <WeekDayAccordion
            milestoneId={selected.id}
            targetWeek={selected.target_week}
            notes={rawSelectedNotes}
            onAddNote={onAddNote}
            onUpdateNote={onUpdateNote}
            onDeleteNote={onDeleteNote}
            savingNoteId={savingNoteId}
          />
        ) : (
          <>
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
                  disabled={savingNoteId === selected.id}
                  className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-500 disabled:opacity-50"
                >
                  {savingNoteId === selected.id ? '저장 중...' : '기록'}
                </button>
              </div>
            </div>

            {selectedNotes.length > 0 && (
              <>
                {selectedNotes.length > 1 && (
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
                  {selectedNotes.map((entry) => (
                    <li key={`${entry.kind}-${entry.ref_id}`} className="rounded-lg bg-neutral-50 px-3 py-2">
                      <NoteEntry entry={entry} onUpdate={onUpdateNote} onDelete={onDeleteNote} hideKindLabel showDate />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
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
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={!hasPages || currentPage === 0}
          aria-label="이전 회차"
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
                {milestones.slice(pageIndex * ROW_SIZE, pageIndex * ROW_SIZE + ROW_SIZE).map((m) => (
                  <div
                    key={m.id}
                    onClick={() => handleChipClick(m)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleChipClick(m)
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
                      boxShadow: expandedId === m.id ? 'inset 0 0 0 2px var(--cherry)' : 'none',
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
                    <span className="line-clamp-1 w-full truncate text-[8px] leading-tight text-neutral-500">{m.title}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={!hasPages || currentPage === pageCount - 1}
          aria-label="다음 회차"
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
              onClick={() => goToPage(i)}
              aria-label={`${i + 1}페이지`}
              className="h-1.5 w-1.5 rounded-full transition-colors"
              style={{ background: i === currentPage ? 'var(--cherry)' : '#E5E1D8' }}
            />
          ))}
        </div>
      )}
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
                  <div className="space-y-1 border-t border-neutral-100 p-2">
                    {items.map((m) => (
                      <div key={m.id}>
                        <div
                          onClick={() => handleChipClick(m)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleChipClick(m)
                            }
                          }}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
                          style={{ background: expandedId === m.id ? 'var(--cherry-bg)' : 'transparent' }}
                        >
                          <button
                            onClick={(e) => handleToggleComplete(e, m)}
                            disabled={completingId === m.id}
                            aria-label={m.completed ? '완료 취소' : '완료 처리'}
                            className={`flex h-4 w-4 flex-none items-center justify-center text-white disabled:opacity-50 ${
                              m.completed ? 'rounded-sm' : 'rounded-sm border-[1.5px] border-neutral-300 bg-white'
                            }`}
                            style={m.completed ? { background: 'var(--cherry)' } : undefined}
                          >
                            {m.completed && <IconCheck size={10} stroke={3} />}
                          </button>
                          <span
                            className={`flex-1 text-xs ${m.completed ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}
                          >
                            {m.title.replace(/^\d+주차\s*/, '')}
                          </span>
                          {m.scheduled_today && (
                            <span className="flex-none text-[10px] font-medium" style={{ color: 'var(--cherry)' }}>
                              오늘
                            </span>
                          )}
                        </div>

                        {expandedId === m.id && (
                          <div className="mt-1.5 rounded-lg border border-neutral-200 p-3 animate-[fade-in_0.25s_ease-out]">
                            {renderDetailBody()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!groupByWeek && (
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: selected ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          {selected && (
            <div className="mt-3 rounded-lg border border-neutral-200 p-3 animate-[fade-in_0.25s_ease-out]">
              {renderDetailBody()}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
