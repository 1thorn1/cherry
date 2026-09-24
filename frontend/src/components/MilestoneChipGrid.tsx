import { useState, type MouseEvent } from 'react'
import { IconCheck } from '@tabler/icons-react'
import type { Milestone, TimelineEntry } from '../types/project'
import NoteEntry from './NoteEntry'

export default function MilestoneChipGrid({
  milestones,
  notesByMilestone,
  onComplete,
  onUncomplete,
  onSendToday,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  completingId,
  sendingId,
  sentIds,
  savingNoteId,
}: {
  milestones: Milestone[]
  notesByMilestone: Map<number, TimelineEntry[]>
  onComplete: (m: Milestone) => void
  onUncomplete: (m: Milestone) => void
  onSendToday: (m: Milestone) => void
  onAddNote: (milestoneId: number, body: string) => Promise<void>
  onUpdateNote: (noteId: number, body: string | null, url: string | null) => Promise<void>
  onDeleteNote: (noteId: number) => Promise<void>
  completingId: number | null
  sendingId: number | null
  sentIds: Set<number>
  savingNoteId: number | null
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [draft, setDraft] = useState('')

  if (milestones.length === 0) {
    return <p className="py-4 text-center text-xs text-neutral-400">마일스톤이 없어요</p>
  }

  const selected = milestones.find((m) => m.id === expandedId) ?? null

  // 칩을 누르면 내용(메모·완료 여부)만 보여주고, 완료/취소는 칩 왼쪽 위의 작은 체크
  // 버튼으로만 일어난다 — 둘을 같은 클릭에 묶어놨더니 "내용만 보려 했는데 취소돼버린다"는
  // 문제가 있었다.
  function handleChipClick(m: Milestone) {
    setExpandedId((prev) => (prev === m.id ? null : m.id))
    setDraft('')
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

  const selectedNotes = selected ? notesByMilestone.get(selected.id) ?? [] : []

  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {milestones.map((m) => (
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
            className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border p-1 pt-2.5 text-center transition-colors"
            style={{
              // 채우기 색은 오직 완료 여부만 나타낸다. 선택(패널이 열려있음) 표시는
              // 링(box-shadow)으로 따로 얹어서, "완료돼서 색이 있는 건지 선택돼서
              // 색이 있는 건지" 헷갈리지 않게 분리했다.
              background: m.completed ? 'var(--cherry-bg)' : '#fff',
              borderColor: m.completed ? 'transparent' : '#E5E5E5',
              boxShadow: expandedId === m.id ? '0 0 0 2px var(--cherry)' : 'none',
            }}
          >
            <button
              onClick={(e) => handleToggleComplete(e, m)}
              disabled={completingId === m.id}
              aria-label={m.completed ? '완료 취소' : '완료 처리'}
              className={`absolute left-1 top-1 flex h-4 w-4 items-center justify-center text-white disabled:opacity-50 ${
                m.completed ? 'rounded' : 'rounded border-[1.5px] border-neutral-300 bg-white'
              }`}
              style={m.completed ? { background: 'var(--cherry)' } : undefined}
            >
              {m.completed && <IconCheck size={10} stroke={2.5} />}
            </button>
            <span className="text-[10px] font-medium" style={{ color: m.completed ? 'var(--cherry)' : '#999' }}>
              {m.seq}
            </span>
            <span className="line-clamp-2 text-[10px] leading-tight text-neutral-500">{m.title}</span>
          </div>
        ))}
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: selected ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          {selected && (
            <div className="mt-3 rounded-lg border border-neutral-200 p-3 animate-[fade-in_0.25s_ease-out]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">{selected.title}</p>
                <button onClick={() => setExpandedId(null)} className="text-xs text-neutral-300">닫기</button>
              </div>

              {!selected.completed ? (
                <div className="mb-3 space-y-1.5">
                  <p className="text-xs text-neutral-400">칩 왼쪽 위 체크박스를 누르면 완료 처리돼요</p>
                  <button
                    onClick={() => onSendToday(selected)}
                    disabled={sendingId === selected.id}
                    className="text-left text-[11px] text-neutral-400 disabled:opacity-50"
                  >
                    {sentIds.has(selected.id) ? '오늘 목록에 추가됨' : '오늘 일정에만 추가'}
                  </button>
                </div>
              ) : (
                <p className="mb-3 text-xs text-neutral-400">
                  완료됨{selected.completed_at ? ` · ${selected.completed_at.slice(0, 10)}` : ''} · 체크박스를 다시 누르면 취소돼요
                </p>
              )}

              <div className="mb-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault()
                      handleSubmitNote()
                    }
                  }}
                  placeholder={'이 구간에 남길 메모 (마크다운 지원 — # 제목, - 목록, **굵게**, [ ] 체크박스...)'}
                  rows={6}
                  className="mb-1.5 w-full resize-y rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
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
                <ul className="space-y-1.5">
                  {selectedNotes.map((entry) => (
                    <li key={`${entry.kind}-${entry.ref_id}`} className="rounded-lg bg-neutral-50 px-3 py-2">
                      <NoteEntry entry={entry} onUpdate={onUpdateNote} onDelete={onDeleteNote} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
