import { useEffect, useState } from 'react'
import { startOfWeek, addDays, addWeeks, format, isWeekend } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { CalendarDay } from '../types/calendar'
import { getWeek } from '../api/calendar'
import { START_HOUR, END_HOUR, type TimetableView } from '../lib/timetable'

const ROW_HEIGHT = 40

function toMinutes(iso: string) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

function position(startIso: string, endIso: string | null) {
  const startMin = toMinutes(startIso)
  const endMin = endIso ? toMinutes(endIso) : startMin + 30
  const top = ((startMin - START_HOUR * 60) / 60) * ROW_HEIGHT
  const height = Math.max(((endMin - startMin) / 60) * ROW_HEIGHT, 20)
  return { top, height }
}

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [days, setDays] = useState<CalendarDay[]>([])
  const [view, setView] = useState<TimetableView>('scheduled')
  const [error, setError] = useState('')

  async function load() {
    try {
      setDays(await getWeek(format(weekStart, 'yyyy-MM-dd')))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => { load() }, [weekStart])

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-medium tracking-tight">캘린더</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setWeekStart((d) => addWeeks(d, -1))} className="text-xs text-neutral-400">← 이전주</button>
          <span className="text-xs text-neutral-500">
            {format(weekStart, 'M.d')} – {format(addDays(weekStart, 6), 'M.d')}
          </span>
          <button onClick={() => setWeekStart((d) => addWeeks(d, 1))} className="text-xs text-neutral-400">다음주 →</button>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 text-xs">
          <button
            onClick={() => setView('scheduled')}
            className={`rounded-md px-3 py-1 font-medium ${view === 'scheduled' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
          >
            예정
          </button>
          <button
            onClick={() => setView('actual')}
            className={`rounded-md px-3 py-1 font-medium ${view === 'actual' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
          >
            실제
          </button>
        </div>
      </div>

      {error && <p className="mb-4 text-xs text-red-600">{error}</p>}

      <div className="overflow-x-auto">
        <div className="grid" style={{ gridTemplateColumns: '44px repeat(7, minmax(108px, 1fr))', minWidth: 820 }}>
          <div />
          {days.map((day) => {
            const d = new Date(day.date)
            const weekend = isWeekend(d)
            return (
              <div key={day.date} className={`pb-2 text-center text-xs ${weekend ? 'text-neutral-300' : 'text-neutral-500'}`}>
                <div>{format(d, 'EEE', { locale: ko })}</div>
                <div className="font-medium text-neutral-700">{format(d, 'd')}</div>
              </div>
            )
          })}

          <div className="pr-1 text-right text-[10px] text-neutral-300">종일</div>
          {days.map((day) => {
            const weekend = isWeekend(new Date(day.date))
            const allDayTasks = day.tasks.filter((t) => !t.scheduled_start)
            const allDayPreviews = day.previews.filter((p) => !p.default_time)
            return (
              <div
                key={day.date}
                className={`min-h-[30px] border-b border-neutral-100 px-1 py-1 ${weekend ? 'bg-neutral-50' : ''}`}
              >
                {allDayTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`mb-0.5 truncate rounded px-1 text-[10px] ${t.completed_at ? 'text-neutral-300 line-through' : ''}`}
                    style={t.completed_at ? undefined : { background: 'var(--cherry-bg)', color: 'var(--cherry)' }}
                  >
                    {t.title}
                  </div>
                ))}
                {view === 'scheduled' && allDayPreviews.map((p) => (
                  <div
                    key={p.routine_id}
                    className="mb-0.5 truncate rounded border border-dashed border-neutral-300 px-1 text-[10px] text-neutral-400"
                  >
                    {p.title}
                  </div>
                ))}
              </div>
            )
          })}

          <div className="relative">
            {hours.map((h) => (
              <div key={h} className="relative border-t border-neutral-100" style={{ height: ROW_HEIGHT }}>
                <span className="absolute -top-2 right-1 bg-white pl-1 text-[10px] text-neutral-400">{h}</span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const weekend = isWeekend(new Date(day.date))
            const scheduledTasks = day.tasks.filter((t) => t.scheduled_start)
            const completedTasks = day.tasks.filter((t) => t.completed_at)
            const timedPreviews = day.previews.filter((p) => p.default_time)

            return (
              <div key={day.date} className={`relative ${weekend ? 'bg-neutral-50' : ''}`}>
                {hours.map((h) => (
                  <div key={h} className="border-t border-neutral-100" style={{ height: ROW_HEIGHT }} />
                ))}

                {view === 'scheduled' && scheduledTasks.map((t) => {
                  const pos = position(t.scheduled_start as string, t.scheduled_end)
                  return (
                    <div
                      key={t.id}
                      className="absolute left-0.5 right-0.5 overflow-hidden rounded px-1 text-[10px] leading-tight"
                      style={{
                        top: pos.top,
                        height: pos.height,
                        background: t.completed_at ? '#F1EFE8' : 'var(--cherry-bg)',
                        color: t.completed_at ? '#888780' : 'var(--cherry)',
                      }}
                    >
                      {t.title}
                    </div>
                  )
                })}

                {view === 'actual' && completedTasks.map((t) => {
                  const anchor = (t.effective_at ?? t.completed_at) as string
                  const pos = position(anchor, null)
                  return (
                    <div
                      key={t.id}
                      className="absolute left-0.5 right-0.5 overflow-hidden rounded px-1 text-[10px] leading-tight"
                      style={{ top: pos.top, height: pos.height, background: '#F1EFE8', color: '#888780' }}
                    >
                      {t.title}
                    </div>
                  )
                })}

                {view === 'scheduled' && timedPreviews.map((p) => {
                  const pos = position(`${day.date}T${p.default_time}`, null)
                  return (
                    <div
                      key={p.routine_id}
                      className="absolute left-0.5 right-0.5 overflow-hidden rounded border border-dashed border-neutral-300 px-1 text-[10px] text-neutral-400"
                      style={{ top: pos.top, height: pos.height }}
                    >
                      {p.title}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
