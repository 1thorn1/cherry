import { useEffect, useRef, useState } from 'react'
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  format,
  isWeekend,
  isSameMonth,
  isAfter,
  getISODay,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import type { CalendarDay, MonthSummary } from '../types/calendar'
import type { Project } from '../types/project'
import { getWeek, getMonth } from '../api/calendar'
import { getProjects } from '../api/projects'
import {
  START_HOUR,
  END_HOUR,
  ROW_HEIGHT,
  layoutOverlaps,
  blockPositionStyle,
  scrollToCurrentHour,
  type TimetableView,
} from '../lib/timetable'
import { usePersistedState } from '../lib/persistedState'

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

// 캘린더 주말 흐림(A-6-2): 프로젝트에 속한 항목만, 그 프로젝트의 work_days에
// 없는 요일이면 흐리게 표시한다. 프로젝트가 없는 항목은 판단 기준이 없어 흐리지 않는다.
function isNonWorkDay(projectId: number | null, isoDay: number, projects: Project[]): boolean {
  if (projectId === null) return false
  const project = projects.find((p) => p.id === projectId)
  if (!project) return false
  return !project.work_days.includes(isoDay)
}

type Period = 'week' | 'month'

export default function CalendarPage() {
  const [period, setPeriod] = usePersistedState<Period>('calendar.period', 'week')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [monthCursor, setMonthCursor] = useState(() => new Date())
  const [days, setDays] = useState<CalendarDay[]>([])
  const [summary, setSummary] = useState<MonthSummary | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [view, setView] = usePersistedState<TimetableView>('calendar.view', 'scheduled')
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  function handleSelectDate(date: Date) {
    setWeekStart(startOfWeek(date, { weekStartsOn: 1 }))
    setPeriod('week')
  }

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
    getProjects().then(setProjects).catch(() => {})
  }, [])

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
                  <div key={day.date} className={`pb-2 pl-1 text-left text-xs ${weekend ? 'text-neutral-300' : 'text-neutral-500'}`}>
                    <div>{format(d, 'EEE', { locale: ko })}</div>
                    <div className="font-medium text-neutral-700">{format(d, 'd')}</div>
                  </div>
                )
              })}
            </div>

            <div className="grid" style={{ gridTemplateColumns: GRID_COLUMNS }}>
              <div className="pr-1 text-right text-[10px] text-neutral-300">종일</div>
              {days.map((day) => {
                const isoDay = getISODay(new Date(day.date))
                const allDayTasks = day.tasks.filter((t) => !t.scheduled_start)
                const allDayPreviews = day.previews.filter((p) => !p.default_time)
                return (
                  <div
                    key={day.date}
                    className="min-h-[30px] border-b border-neutral-100 px-1 py-1"
                  >
                    {allDayTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`mb-0.5 truncate rounded px-1 text-[10px] ${t.completed_at ? 'text-neutral-300 line-through' : ''} ${isNonWorkDay(t.project_id, isoDay, projects) ? 'opacity-40' : ''}`}
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
                  const isoDay = getISODay(new Date(day.date))
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
                    <div key={day.date} className="relative">
                      {hours.map((h) => (
                        <div key={h} className="border-t border-neutral-100" style={{ height: ROW_HEIGHT }} />
                      ))}

                      {view === 'scheduled' && scheduledTasks.map((t) => {
                        const b = scheduledBlocks.find((x) => x.key === t.id)!
                        return (
                          <div
                            key={t.id}
                            className={`absolute overflow-hidden rounded px-1 text-[10px] leading-tight ${isNonWorkDay(t.project_id, isoDay, projects) ? 'opacity-40' : ''}`}
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
                            className={`absolute overflow-hidden rounded px-1 text-[10px] leading-tight ${isNonWorkDay(t.project_id, isoDay, projects) ? 'opacity-40' : ''}`}
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
        <MonthSummaryView summary={summary} monthCursor={monthCursor} onSelectDate={handleSelectDate} />
      )}
    </div>
  )
}

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

function MonthSummaryView({
  summary,
  monthCursor,
  onSelectDate,
}: {
  summary: MonthSummary | null
  monthCursor: Date
  onSelectDate: (date: Date) => void
}) {
  if (!summary) return null

  const total = summary.daily_counts.reduce((sum, d) => sum + d.count, 0)
  const dailyByDate = new Map(summary.daily_counts.map((d) => [d.date, d]))
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const gridStart = startOfWeek(startOfMonth(monthCursor), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(monthCursor), { weekStartsOn: 1 })
  const gridDays: Date[] = []
  for (let d = gridStart; !isAfter(d, gridEnd); d = addDays(d, 1)) gridDays.push(d)

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-neutral-400">이번 달 완료</p>
        <p className="text-2xl font-medium tracking-tight" style={{ color: 'var(--cherry)' }}>{total}개</p>
      </div>

      <div>
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] text-neutral-400">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {gridDays.map((d) => {
            const dateStr = format(d, 'yyyy-MM-dd')
            const inMonth = isSameMonth(d, monthCursor)
            const daily = dailyByDate.get(dateStr)
            const count = daily?.count ?? 0
            const titles = daily?.titles ?? []
            const isToday = dateStr === todayStr
            return (
              <button
                key={dateStr}
                onClick={() => onSelectDate(d)}
                className="flex aspect-square flex-col items-start overflow-hidden rounded-lg border p-1 text-left transition-colors hover:bg-neutral-50 lg:aspect-auto lg:min-h-[104px] lg:p-2"
                style={{ borderColor: isToday ? 'var(--cherry)' : 'transparent' }}
              >
                <div className={`text-[11px] ${inMonth ? 'text-neutral-600' : 'text-neutral-300'}`}>
                  {format(d, 'd')}
                </div>

                {/* 모바일: 칸이 작아서 완료 개수 배지만 */}
                {count > 0 && (
                  <div
                    className="mt-1 inline-block rounded px-1 text-[10px] font-medium lg:hidden"
                    style={{ background: 'var(--cherry-bg)', color: 'var(--cherry)' }}
                  >
                    {count}
                  </div>
                )}

                {/* 데스크탑: 칸이 커서 완료한 일정 제목을 그대로 나열 */}
                {titles.length > 0 && (
                  <ul className="mt-1 hidden space-y-0.5 lg:block">
                    {titles.map((title, i) => (
                      <li key={i} className="truncate rounded px-1 text-[10px] leading-tight" style={{ background: 'var(--cherry-bg)', color: 'var(--cherry)' }}>
                        {title}
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[10px] text-neutral-300">날짜를 누르면 그 주의 시간표로 이동해요</p>
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
