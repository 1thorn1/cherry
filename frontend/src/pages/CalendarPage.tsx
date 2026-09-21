import { useEffect, useRef, useState } from 'react'
import { startOfWeek, addDays, addWeeks, addMonths, format, isWeekend } from 'date-fns'
import { ko } from 'date-fns/locale'
import type { CalendarDay, MonthSummary } from '../types/calendar'
import { getWeek, getMonth } from '../api/calendar'
import {
  START_HOUR,
  END_HOUR,
  ROW_HEIGHT,
  layoutOverlaps,
  blockPositionStyle,
  scrollToCurrentHour,
  type TimetableView,
} from '../lib/timetable'

const VISIBLE_HEIGHT = 480
const GRID_COLUMNS = '44px repeat(7, minmax(108px, 1fr))'

function toMinutes(iso: string) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

function range(startIso: string, endIso: string | null) {
  const startMin = toMinutes(startIso)
  const endMin = endIso ? toMinutes(endIso) : startMin + 30
  return { startMin, endMin: Math.max(endMin, startMin + 20) }
}

type Period = 'week' | 'month'

export default function CalendarPage() {
  const [period, setPeriod] = useState<Period>('week')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [monthCursor, setMonthCursor] = useState(() => new Date())
  const [days, setDays] = useState<CalendarDay[]>([])
  const [summary, setSummary] = useState<MonthSummary | null>(null)
  const [view, setView] = useState<TimetableView>('scheduled')
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  async function loadWeek() {
    try {
      setDays(await getWeek(format(weekStart, 'yyyy-MM-dd')))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  async function loadMonth() {
    try {
      setSummary(await getMonth(format(monthCursor, 'yyyy-MM')))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => {
    if (period === 'week') loadWeek()
  }, [weekStart, period])

  useEffect(() => {
    if (period === 'month') loadMonth()
  }, [monthCursor, period])

  useEffect(() => {
    if (period === 'week') scrollToCurrentHour(scrollRef.current)
  }, [period, days])

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-medium tracking-tight">캘린더</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 text-xs">
            <button
              onClick={() => setPeriod('week')}
              className={`rounded-md px-3 py-1 font-medium ${period === 'week' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
            >
              주간
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`rounded-md px-3 py-1 font-medium ${period === 'month' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
            >
              월간
            </button>
          </div>

          {period === 'week' ? (
            <>
              <button onClick={() => setWeekStart((d) => addWeeks(d, -1))} className="text-xs text-neutral-400">← 이전주</button>
              <span className="text-xs text-neutral-500">
                {format(weekStart, 'M.d')} – {format(addDays(weekStart, 6), 'M.d')}
              </span>
              <button onClick={() => setWeekStart((d) => addWeeks(d, 1))} className="text-xs text-neutral-400">다음주 →</button>
            </>
          ) : (
            <>
              <button onClick={() => setMonthCursor((d) => addMonths(d, -1))} className="text-xs text-neutral-400">← 이전달</button>
              <span className="text-xs text-neutral-500">{format(monthCursor, 'yyyy.M')}</span>
              <button onClick={() => setMonthCursor((d) => addMonths(d, 1))} className="text-xs text-neutral-400">다음달 →</button>
            </>
          )}
        </div>
      </div>

      {period === 'week' && (
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
      )}

      {error && <p className="mb-4 text-xs text-red-600">{error}</p>}

      {period === 'week' ? (
        <div className="overflow-x-auto">
          <div style={{ minWidth: 820 }}>
            <div className="grid" style={{ gridTemplateColumns: GRID_COLUMNS }}>
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
            </div>

            <div className="grid" style={{ gridTemplateColumns: GRID_COLUMNS }}>
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
            </div>

            <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: VISIBLE_HEIGHT }}>
              <div className="grid" style={{ gridTemplateColumns: GRID_COLUMNS }}>
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

                  const scheduledBlocks = scheduledTasks.map((t) => ({
                    key: t.id,
                    ...range(t.scheduled_start as string, t.scheduled_end),
                  }))
                  const actualBlocks = completedTasks.map((t) => ({
                    key: t.id,
                    ...range((t.effective_at ?? t.completed_at) as string, null),
                  }))
                  const previewBlocks = timedPreviews.map((p) => ({
                    key: `preview-${p.routine_id}`,
                    ...range(`${day.date}T${p.default_time}`, null),
                  }))

                  const scheduledLayout = new Map(layoutOverlaps(scheduledBlocks).map((l) => [l.key, l]))
                  const actualLayout = new Map(layoutOverlaps(actualBlocks).map((l) => [l.key, l]))
                  const previewLayout = new Map(layoutOverlaps(previewBlocks).map((l) => [l.key, l]))

                  function blockStyle(b: { key: string | number; startMin: number; endMin: number }, layout: Map<string | number, { column: number; columnCount: number }>) {
                    const l = layout.get(b.key) ?? { column: 0, columnCount: 1 }
                    const top = ((b.startMin - START_HOUR * 60) / 60) * ROW_HEIGHT
                    const height = Math.max(((b.endMin - b.startMin) / 60) * ROW_HEIGHT, 20)
                    return blockPositionStyle(top, height, l.column, l.columnCount, { gutter: 2, rightPad: 2 })
                  }

                  return (
                    <div key={day.date} className={`relative ${weekend ? 'bg-neutral-50' : ''}`}>
                      {hours.map((h) => (
                        <div key={h} className="border-t border-neutral-100" style={{ height: ROW_HEIGHT }} />
                      ))}

                      {view === 'scheduled' && scheduledTasks.map((t) => {
                        const b = scheduledBlocks.find((x) => x.key === t.id)!
                        return (
                          <div
                            key={t.id}
                            className="absolute overflow-hidden rounded px-1 text-[10px] leading-tight"
                            style={{
                              ...blockStyle(b, scheduledLayout),
                              background: t.completed_at ? '#F1EFE8' : 'var(--cherry-bg)',
                              color: t.completed_at ? '#888780' : 'var(--cherry)',
                            }}
                          >
                            {t.title}
                          </div>
                        )
                      })}

                      {view === 'actual' && completedTasks.map((t) => {
                        const b = actualBlocks.find((x) => x.key === t.id)!
                        return (
                          <div
                            key={t.id}
                            className="absolute overflow-hidden rounded px-1 text-[10px] leading-tight"
                            style={{ ...blockStyle(b, actualLayout), background: '#F1EFE8', color: '#888780' }}
                          >
                            {t.title}
                          </div>
                        )
                      })}

                      {view === 'scheduled' && timedPreviews.map((p) => {
                        const b = previewBlocks.find((x) => x.key === `preview-${p.routine_id}`)!
                        return (
                          <div
                            key={p.routine_id}
                            className="absolute overflow-hidden rounded border border-dashed border-neutral-300 px-1 text-[10px] text-neutral-400"
                            style={blockStyle(b, previewLayout)}
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
        </div>
      ) : (
        <MonthSummaryView summary={summary} />
      )}
    </div>
  )
}

function MonthSummaryView({ summary }: { summary: MonthSummary | null }) {
  if (!summary) return null

  const total = summary.daily_counts.reduce((sum, d) => sum + d.count, 0)
  const max = Math.max(1, ...summary.daily_counts.map((d) => d.count))

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-neutral-400">이번 달 완료</p>
        <p className="text-2xl font-medium tracking-tight" style={{ color: 'var(--cherry)' }}>{total}개</p>
      </div>

      <div>
        <p className="mb-3 text-xs text-neutral-500">날짜별 완료 개수</p>
        <div className="flex h-32 items-end gap-[3px] overflow-x-auto">
          {summary.daily_counts.map((d) => (
            <div key={d.date} className="flex flex-1 min-w-[6px] flex-col items-center gap-1" title={`${d.date}: ${d.count}개`}>
              <div
                className="w-full rounded-sm"
                style={{
                  height: `${(d.count / max) * 100}%`,
                  minHeight: d.count > 0 ? 3 : 1,
                  background: d.count > 0 ? 'var(--cherry-bg)' : '#F1EFE8',
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-neutral-300">
          <span>{summary.daily_counts[0]?.date.slice(8)}일</span>
          <span>{summary.daily_counts[summary.daily_counts.length - 1]?.date.slice(8)}일</span>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs text-neutral-500">프로젝트 진행률</p>
        {summary.projects.length === 0 ? (
          <p className="text-xs text-neutral-300">진행 중인 마일스톤이 있는 프로젝트가 없어요</p>
        ) : (
          <div className="space-y-3">
            {summary.projects.map((p) => {
              const pct = p.total_milestones === 0 ? 0 : Math.round((p.completed_milestones / p.total_milestones) * 100)
              return (
                <div key={p.project_id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-neutral-700">{p.name}</span>
                    <span className="text-neutral-400">{p.completed_milestones}/{p.total_milestones}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--cherry)' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
