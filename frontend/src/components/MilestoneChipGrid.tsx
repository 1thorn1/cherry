import { useState } from 'react'
import type { Milestone, TimelineEntry } from '../types/project'
import MarkdownBody from './MarkdownBody'

const kindLabels: Record<string, string> = { AUTO_LOG: '완료', NOTE: '메모', LINK: '링크', RETRO: '회고' }

export default function MilestoneChipGrid({
  milestones,
  notesByMilestone,
  onComplete,
  onSendToday,
  onAddNote,
  completingId,
  sendingId,
  sentIds,
  savingNoteId,
}: {
  milestones: Milestone[]
  notesByMilestone: Map<number, TimelineEntry[]>
  onComplete: (m: Milestone) => void
  onSendToday: (m: Milestone) => void
  onAddNote: (milestoneId: number, body: string) => Promise<void>
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

  function toggle(m: Milestone) {
    setExpandedId((prev) => (prev === m.id ? null : m.id))
    setDraft('')
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
          <button
            key={m.id}
            onClick={() => toggle(m)}
            className="flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border p-1 text-center transition-colors"
            style={
              expandedId === m.id
                ? { borderColor: 'var(--cherry)', background: 'var(--cherry-bg)' }
                : m.completed
                  ? { borderColor: 'transparent', background: 'var(--cherry-bg)' }
                  : { borderColor: '#E5E5E5' }
            }
          >
            <span className="text-[10px] font-medium" style={{ color: m.completed ? 'var(--cherry)' : '#999' }}>
              {m.completed ? '✓' : m.seq}
            </span>
            <span className="line-clamp-2 text-[10px] leading-tight text-neutral-500">{m.title}</span>
          </button>
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
                  <button
                    onClick={() => onComplete(selected)}
                    disabled={completingId === selected.id}
                    className="w-full rounded-lg py-2 text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: 'var(--cherry)' }}
                  >
                    {completingId === selected.id ? '처리 중...' : '완료 처리'}
                  </button>
                  <button
                    onClick={() => onSendToday(selected)}
                    disabled={sendingId === selected.id}
                    className="w-full text-center text-[11px] text-neutral-400 disabled:opacity-50"
                  >
                    {sentIds.has(selected.id) ? '오늘 목록에 추가됨' : '오늘 일정에만 추가'}
                  </button>
                </div>
              ) : (
                <p className="mb-3 text-xs text-neutral-400">
                  완료됨{selected.completed_at ? ` · ${selected.completed_at.slice(0, 10)}` : ''}
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
                      <span className="mb-1 inline-block text-[10px] font-medium text-neutral-400">{kindLabels[entry.kind] ?? entry.kind}</span>
                      {entry.kind === 'AUTO_LOG' ? (
                        <p className="text-xs text-neutral-600">
                          {entry.title ?? ''}
                          {entry.count && entry.count > 1 ? ` × ${entry.count}` : ''}
                        </p>
                      ) : entry.kind === 'LINK' ? (
                        <div className="text-xs">
                          {entry.body && <p>{entry.body}</p>}
                          {entry.url && <p className="text-neutral-400">{entry.url}</p>}
                        </div>
                      ) : (
                        entry.body && <MarkdownBody>{entry.body}</MarkdownBody>
                      )}
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
