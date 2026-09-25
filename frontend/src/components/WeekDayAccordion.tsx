import { useState } from 'react'
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import type { TimelineEntry } from '../types/project'
import { getIsoWeekDates, WEEKDAY_LABELS } from '../lib/date'
import AutoGrowTextarea from './AutoGrowTextarea'
import NoteEntry from './NoteEntry'

// "N주차" 마일스톤(target_week 있음) 전용 — 한 마일스톤이 7일을 아우르므로, 요일별로
// 접고 펼치면서 그날그날 공부한 내용을 따로따로 기록할 수 있게 한다.
export default function WeekDayAccordion({
  milestoneId,
  targetWeek,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  savingNoteId,
}: {
  milestoneId: number
  targetWeek: string
  notes: TimelineEntry[]
  onAddNote: (milestoneId: number, body: string, noteDate?: string) => Promise<void>
  onUpdateNote: (noteId: number, body: string | null, url: string | null) => Promise<void>
  onDeleteNote: (noteId: number) => Promise<void>
  savingNoteId: number | null
}) {
  const dates = getIsoWeekDates(targetWeek)
  const [openDate, setOpenDate] = useState<string | null>(null)
  const [draftByDate, setDraftByDate] = useState<Record<string, string>>({})

  function toggleDay(date: string) {
    setOpenDate((prev) => (prev === date ? null : date))
  }

  async function handleSubmit(date: string) {
    const draft = (draftByDate[date] ?? '').trim()
    if (!draft || savingNoteId === milestoneId) return
    await onAddNote(milestoneId, draft, date)
    setDraftByDate((prev) => ({ ...prev, [date]: '' }))
  }

  return (
    <div className="space-y-1.5">
      {dates.map((date, i) => {
        const dayNotes = notes.filter((n) => n.note_date === date)
        const hasContent = dayNotes.length > 0
        const isOpen = openDate === date
        const [, month, day] = date.split('-')

        return (
          <div key={date} className="overflow-hidden rounded-lg border border-neutral-200">
            <button
              onClick={() => toggleDay(date)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left"
            >
              <span className="text-xs font-medium text-neutral-600">{WEEKDAY_LABELS[i]}</span>
              <span className="text-[11px] text-neutral-400">{Number(month)}/{Number(day)}</span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: hasContent ? 'var(--cherry)' : '#E5E1D8' }}
              />
              <span className="ml-auto text-neutral-300">
                {isOpen ? <IconChevronUp size={14} stroke={1.75} /> : <IconChevronDown size={14} stroke={1.75} />}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-neutral-100 p-3">
                {dayNotes.length > 0 && (
                  <ul className="mb-2 space-y-1.5">
                    {dayNotes.map((entry) => (
                      <li key={`${entry.kind}-${entry.ref_id}`} className="rounded-lg bg-neutral-50 px-3 py-2">
                        <NoteEntry entry={entry} onUpdate={onUpdateNote} onDelete={onDeleteNote} hideKindLabel showDate />
                      </li>
                    ))}
                  </ul>
                )}
                <AutoGrowTextarea
                  value={draftByDate[date] ?? ''}
                  onChange={(e) => setDraftByDate((prev) => ({ ...prev, [date]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault()
                      handleSubmit(date)
                    }
                  }}
                  placeholder={`${WEEKDAY_LABELS[i]}요일 공부한 내용 (마크다운 지원)`}
                  rows={2}
                  className="mb-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition-shadow focus:border-[var(--cherry)] focus:ring-2 focus:ring-[var(--cherry-bg)]"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-300">⌘/Ctrl + Enter로 저장</span>
                  <button
                    onClick={() => handleSubmit(date)}
                    disabled={savingNoteId === milestoneId}
                    className="rounded-lg border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-500 disabled:opacity-50"
                  >
                    {savingNoteId === milestoneId ? '저장 중...' : '기록'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
