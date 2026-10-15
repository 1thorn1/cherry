import Collapse from '../components/Collapse'
import CalendarDayTasks from '../components/CalendarDayTasks'
import { COMPLETION_CHANGED } from '../lib/offlineCompletion'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react'
import type { CalendarDay, MonthSummary } from '../types/calendar'
import type { Project } from '../types/project'
import type { Task } from '../types/task'
import { getWeek, getMonth } from '../api/calendar'
import { getProjects } from '../api/projects'
import {
  START_HOUR,
  END_HOUR,
  layoutOverlaps,
  blockPositionStyle,
  calendarColumnWidth,
  type TimetableView,
} from '../lib/timetable'
import { usePersistedState } from '../lib/persistedState'
import { CATEGORIES, categoryOf } from '../lib/category'
import { PageHeader, PrimaryButton, Segment } from '../components/ui'

// docs/design-system.md "주간 시간표" — 1시간 = 64px. 오늘 화면 시간표(ROW_HEIGHT 40)보다 넓게 쓴다
const HOUR_HEIGHT = 64
const VISIBLE_HEIGHT = 560
const WEEK_COLUMNS = '64px repeat(7, minmax(96px, 1fr))'
const DAY_COLUMNS = '64px 1fr'

function toMinutes(iso: string) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

function range(startIso: string, endIso: string | null) {
  const startMin = toMinutes(startIso)
  const endMin = endIso ? toMinutes(endIso) : startMin + 30
  return { startMin, endMin: Math.max(endMin, startMin + 20) }
}

function minutesLabel(min: number) {
  const h = Math.floor(min / 60) % 24
  return `${h % 12 === 0 ? 12 : h % 12}:${String(min % 60).padStart(2, '0')}`
}

// "오전 8시" / "오후 1시" — 시간 라벨은 줄바꿈 금지라 짧게
function hourLabel(h: number) {
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}시`
}

// 캘린더 주말 흐림(A-6-2): 프로젝트에 속한 항목만, 그 프로젝트의 work_days에
// 없는 요일이면 흐리게 표시한다. 프로젝트가 없는 항목은 판단 기준이 없어 흐리지 않는다.
function isNonWorkDay(projectId: number | null, isoDay: number, projects: Project[]): boolean {
  if (projectId === null) return false
  const project = projects.find((p) => p.id === projectId)
  if (!project) return false
  return !project.work_days.includes(isoDay)
}

// 현재 시각선이 1분마다 따라 내려오도록 분 단위로 다시 그린다
function useNowMinutes() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

type Period = 'day' | 'week' | 'month'

const PERIOD_LABELS: { value: Period; label: string }[] = [
  { value: 'day', label: '일' },
  { value: 'week', label: '주' },
  { value: 'month', label: '월' },
]

export default function CalendarPage() {
  const navigate = useNavigate()
  // 모바일은 PDF대로 요일 스트립 + 하루 타임라인이 기본, 데스크톱은 주간 격자가 기본
  const [period, setPeriod] = usePersistedState<Period>(
    'calendar.period',
    window.innerWidth < 1024 ? 'day' : 'week',
  )
  // 일·주 보기가 같이 쓰는 "고른 날짜". 주의 시작은 여기서 계산한다
  const [cursor, setCursor] = useState(() => new Date())
  const [monthCursor, setMonthCursor] = useState(() => new Date())
  const [days, setDays] = useState<CalendarDay[]>([])
  const [summary, setSummary] = useState<MonthSummary | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [view] = usePersistedState<TimetableView>('schedule.view', 'scheduled')
  const [error, setError] = useState('')
  const [panelDate, setPanelDate] = useState<string | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [compact, setCompact] = useState(() => window.innerWidth < 1024)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 1023px)')
    const update = () => setCompact(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const scrollRef = useRef<HTMLDivElement>(null)
  // 종일 줄에서 완료된 항목이 쌓이면 지저분해 보여서, 날짜별로 접어둘 수 있게 한다
  // (기본은 접힌 상태 — 아직 안 끝난 항목만 항상 보이고 완료는 눌러야 펼쳐짐).
  const [expandedAllDay, setExpandedAllDay] = useState<Set<string>>(new Set())
  const now = useNowMinutes()

  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 })
  const weekKey = format(weekStart, 'yyyy-MM-dd')
  const cursorStr = format(cursor, 'yyyy-MM-dd')
  const todayStr = format(now, 'yyyy-MM-dd')
  const nowMin = now.getHours() * 60 + now.getMinutes()

  function handleSelectDate(date: Date) {
    setCursor(date)
    setPeriod('week')
  }

  function toggleAllDayExpanded(date: string) {
    setExpandedAllDay((prev) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  // 써놓은 일정(할 일)을 누르면 그날 투두 화면으로 바로 간다 — 아직 실제로 만들어지지
  // 않은 반복 미리보기(점선 테두리)는 누를 대상이 없으니 여기 해당 안 됨.
  function goToDayToday(dateStr: string) {
    navigate(`/?date=${dateStr}`)
  }

  function openDayTasks(date: string, taskId: number | null = null) {
    setSelectedTaskId(taskId)
    setPanelDate(date)
  }

  function step(direction: 1 | -1) {
    if (period === 'month') setMonthCursor((d) => addMonths(d, direction))
    else if (period === 'week') setCursor((d) => addWeeks(d, direction))
    else setCursor((d) => addDays(d, direction))
  }

  function goToday() {
    setCursor(new Date())
    setMonthCursor(new Date())
  }

  async function loadWeek() {
    try {
      setDays(await getWeek(weekKey))
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
    if (period !== 'month') loadWeek()
  }, [weekKey, period])

  useEffect(() => {
    if (period === 'month') loadMonth()
  }, [monthCursor, period])
  useEffect(() => {
    const refresh = () => { if (period === 'month') void loadMonth(); else void loadWeek() }
    window.addEventListener(COMPLETION_CHANGED, refresh)
    return () => window.removeEventListener(COMPLETION_CHANGED, refresh)
  }, [weekKey, monthCursor, period])

  useEffect(() => {
    // 지금보다 두 시간 앞부터 보여주고, 맨 위 시간 라벨이 잘리지 않게 조금 더 올린다
    if (period === 'month' || !scrollRef.current) return
    const hour = new Date().getHours()
    scrollRef.current.scrollTop = Math.max(0, (hour - START_HOUR - 2) * HOUR_HEIGHT - 12)
  }, [period, days])

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

  // 툴바 제목 — 주가 두 달에 걸치면 "2026년 9월 – 10월"
  const weekEnd = addDays(weekStart, 6)
  const periodTitle =
    period === 'month'
      ? format(monthCursor, 'yyyy년 M월')
      : period === 'week' && !isSameMonth(weekStart, weekEnd)
        ? `${format(weekStart, 'yyyy년 M월')} – ${format(weekEnd, 'M월')}`
        : format(period === 'week' ? weekStart : cursor, 'yyyy년 M월')

  const visibleDays = period === 'day' ? days.filter((d) => d.date === cursorStr) : days
  const weekTaskCount = days.reduce((sum, d) => sum + d.tasks.length, 0)
  const weekDoneCount = days.reduce((sum, d) => sum + d.actual_tasks.length, 0)
  const subtitle =
    period === 'month'
      ? '날짜를 누르면 그 주 시간표로 넘어가요'
      : period === 'day'
        ? `${cursorStr === todayStr ? '오늘' : format(cursor, 'M월 d일')} 일정 ${visibleDays[0]?.tasks.length ?? 0}개`
        : `이번 주 일정 ${weekTaskCount}개 · 완료 ${weekDoneCount}개`

  // 하루 칸 하나의 시간 블록들 — 주간 격자와 하루 타임라인이 같이 쓴다
  function renderDayBlocks(day: CalendarDay) {
    const isoDay = getISODay(new Date(day.date))
    const scheduledTasks = day.tasks.filter((t) => t.scheduled_start)
    // actual_tasks는 예정된 날이 아니라 실제로 완료 처리한 날 기준으로 이미 묶여
    // 있다 — day.tasks에서 completed_at으로 거르면 이월된 태스크가 원래 예정일에
    // 표시돼 월간 완료 집계와 날짜가 어긋난다.
    const completedTasks = day.actual_tasks
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

    const scheduledLayout = new Map(layoutOverlaps([...scheduledBlocks, ...previewBlocks]).map((l) => [l.key, l]))
    const actualLayout = new Map(layoutOverlaps(actualBlocks).map((l) => [l.key, l]))
    const previewLayout = scheduledLayout

    function blockStyle(b: { key: string | number; startMin: number; endMin: number }, layout: Map<string | number, { column: number; columnCount: number }>) {
      const l = layout.get(b.key) ?? { column: 0, columnCount: 1 }
      const top = ((b.startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT + 2
      const height = Math.max(((b.endMin - b.startMin) / 60) * HOUR_HEIGHT - 4, 22)
      return blockPositionStyle(top, height, l.column, l.columnCount, { gutter: 4, rightPad: 4, gap: 3 })
    }

    // 지난 일정(끝난 시각이 지금보다 이전)은 흐리게, 완료한 일정은 취소선
    const isPast = (endMin: number) => day.date < todayStr || (day.date === todayStr && endMin <= nowMin)

    function renderTaskBlock(task: Task, b: { key: number; startMin: number; endMin: number }, layout: typeof scheduledLayout, done: boolean) {
      const cat = categoryOf(task)
      const style = blockStyle(b, layout)
      const dim = done || isPast(b.endMin) || isNonWorkDay(task.project_id, isoDay, projects)
      return (
        <button
          key={task.id}
          onClick={() => done ? openDayTasks(day.date, task.id) : goToDayToday(day.date)}
          className={`absolute overflow-hidden rounded-[8px] px-2 py-0.5 text-left transition-opacity hover:opacity-80 lg:py-1 ${dim ? 'opacity-80 lg:opacity-60' : ''}`}
          style={{ ...style, background: cat.soft, color: 'var(--ink)' }}
        >
          <span className={`flex items-start gap-1.5 text-[13px] font-medium leading-4 lg:text-[12px] ${done ? 'line-through' : ''}`}>
            <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full" style={{ background: cat.dot }} />
            <span className={style.height >= 56 ? 'min-w-0 line-clamp-2 break-words lg:line-clamp-none lg:truncate' : 'min-w-0 truncate'}>{task.title}</span>
          </span>
          {style.height >= 38 && (
            <span className="mt-0.5 block text-[12px] leading-4 tabular-nums lg:text-[11px] text-[var(--ink-muted)]">
              {minutesLabel(b.startMin)}–{minutesLabel(b.endMin)}
            </span>
          )}
        </button>
      )
    }


    return (
      <>
        {view === 'scheduled' && scheduledTasks.map((t) => (
          renderTaskBlock(t, scheduledBlocks.find((x) => x.key === t.id)!, scheduledLayout, t.completed_at !== null)
        ))}

        {view === 'actual' && completedTasks.map((t) => (
          renderTaskBlock(t, actualBlocks.find((x) => x.key === t.id)!, actualLayout, true)
        ))}

        {/* 아직 만들어지지 않은 반복 미리보기 — 점선 테두리 */}
        {view === 'scheduled' && timedPreviews.map((p) => {
          const b = previewBlocks.find((x) => x.key === `preview-${p.routine_id}`)!
          return (
            <div
              key={p.routine_id}
              className="absolute overflow-hidden rounded-[8px] border border-dashed border-[var(--line-strong)] px-2 py-1 text-[13px] leading-4 text-[var(--ink-muted)] lg:text-[12px]"
              style={blockStyle(b, previewLayout)}
            >
              <span className="block truncate">{p.title}</span>
            </div>
          )
        })}

        {/* 현재 시각 — barn 2px 선 + 왼쪽 점 */}
        {day.date === todayStr && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-10"
            style={{ top: ((nowMin - START_HOUR * 60) / 60) * HOUR_HEIGHT - 1 }}
            aria-label={`지금 ${minutesLabel(nowMin)}`}
          >
            <div className="h-[2px] bg-[var(--barn)]" />
            <div className="absolute -left-[5px] -top-[4px] h-2.5 w-2.5 rounded-full bg-[var(--barn)]" />
          </div>
        )}
      </>
    )
  }

  // 종일 줄 한 칸
  function renderAllDayCell(day: CalendarDay) {
    const isoDay = getISODay(new Date(day.date))
    // 아직 안 끝난 종일 항목은 예정일(taskDate) 기준, 완료된 항목은 실제 완료일
    // 기준으로 보여준다 — 안 그러면 이월해서 나중에 끝낸 종일 항목이 월간 완료
    // 집계와 다른 날짜에 표시된다(시간표 타임드 블록과 같은 이유).
    const pendingAllDay = day.tasks.filter((t) => !t.scheduled_start && !t.completed_at)
    // "완료 N개" 뱃지는 지금 보는 탭의 시간표에 실제 나오는 완료 블록 개수와
    // 맞춘다 — 예정 탭은 시간 있는 완료만, 실제 탭은 day.actual_tasks
    // 전체가 블록으로 나오니 그대로 쓴다. 탭마다 숫자는 다를 수 있지만, 그
    // 탭 안에서는 뱃지=블록 개수가 항상 맞아야 헷갈리지 않는다.
    const completedInView = view === 'scheduled'
      ? day.tasks.filter((t) => t.scheduled_start && t.completed_at)
      : day.actual_tasks
    const isAllDayExpanded = expandedAllDay.has(day.date)
    const allDayPreviews = day.previews.filter((p) => !p.default_time)

    return (
      <div className="flex min-h-[36px] flex-col gap-1 p-1">
        {pendingAllDay.map((t) => {
          const cat = categoryOf(t)
          return (
            <button
              key={t.id}
              onClick={() => goToDayToday(day.date)}
              className={`flex items-center gap-1.5 rounded-[8px] px-2 py-0.5 text-left text-[13px] font-medium leading-5 hover:opacity-80 lg:text-[12px] lg:leading-4 ${isNonWorkDay(t.project_id, isoDay, projects) ? 'opacity-40' : ''}`}
              style={{ background: cat.soft, color: 'var(--ink)' }}
            >
              <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: cat.dot }} />
              <span className="truncate">{t.title}</span>
            </button>
          )
        })}
        {completedInView.length > 0 && (
          <>
            <button
              onClick={() => toggleAllDayExpanded(day.date)}
              className="self-start px-1 text-[12px] font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
            >
              {isAllDayExpanded ? '접기' : `완료 ${completedInView.length}개`}
            </button>
            <Collapse open={isAllDayExpanded}><div className="flex flex-col gap-1">{completedInView.map((t) => (
              <button
                key={t.id}
                onClick={() => openDayTasks(day.date, t.id)}
                className="truncate px-2 text-left text-[13px] leading-5 text-[var(--ink-muted)] line-through lg:text-[12px] hover:opacity-70"
              >
                {t.title}
              </button>
            ))}</div></Collapse>
          </>
        )}
        {view === 'scheduled' && allDayPreviews.map((p) => (
          <div
            key={p.routine_id}
            className="truncate rounded-[8px] border border-dashed border-[var(--line-strong)] px-2 py-0.5 text-[12px] text-[var(--ink-muted)]"
          >
            {p.title}
          </div>
        ))}
      </div>
    )
  }

  // 시간표 본체 — 주간은 7칸, 하루는 1칸
  function renderGrid(gridDays: CalendarDay[], columns: string, minWidth: number | undefined) {
    const showHeader = period === 'week'
    if (compact) {
      const widths = gridDays.map((day) => {
        const blocks = view === 'actual'
          ? day.actual_tasks.map((task) => ({ key: task.id, ...range((task.effective_at ?? task.completed_at) as string, null) }))
          : [
            ...day.tasks.filter((task) => task.scheduled_start).map((task) => ({ key: task.id, ...range(task.scheduled_start!, task.scheduled_end) })),
            ...day.previews.filter((preview) => preview.default_time).map((preview) => ({ key: 'preview-' + preview.routine_id, ...range(day.date + 'T' + preview.default_time, null) })),
          ]
        return calendarColumnWidth(blocks)
      })
      columns = '56px ' + widths.map((width) => 'minmax(' + width + 'px, 1fr)').join(' ')
      minWidth = 56 + widths.reduce((total, width) => total + width, 0)
    }
    return (
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        {compact && (minWidth ?? 0) > window.innerWidth - 40 && <p className="border-b border-[var(--line)] px-3 py-2 text-[12px] text-[var(--ink-muted)]">좌우로 밀어 일정을 확인하세요.</p>}
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="시간표, 좌우 스크롤 가능">
          <div style={{ minWidth }}>
            {showHeader && (
              <div className="grid border-b border-[var(--line)]" style={{ gridTemplateColumns: columns }}>
                <div />
                {gridDays.map((day) => {
                  const d = new Date(day.date)
                  const isToday = day.date === todayStr
                  return (
                    <div
                      key={day.date}
                      className={`flex items-center justify-center gap-1.5 border-l border-[var(--line)] py-2.5 text-[13px] ${isWeekend(d) ? 'bg-[var(--bg)]' : ''}`}
                    >
                      <span className={isToday ? 'font-semibold text-[var(--wood)]' : 'text-[var(--ink-muted)]'}>
                        {format(d, 'EEE', { locale: ko })}
                      </span>
                      {isToday ? (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--wood)] font-display text-[17px] tabular-nums lg:text-[15px] text-[var(--on-wood)]">
                          {format(d, 'd')}
                        </span>
                      ) : (
                        <span className="font-display text-[17px] tabular-nums text-[var(--ink)] lg:text-[15px]">{format(d, 'd')}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="grid border-b border-[var(--line)]" style={{ gridTemplateColumns: columns }}>
              <div className="flex items-start justify-end pr-2 pt-2 text-[12px] font-medium text-[var(--ink-muted)] lg:text-[11px]">종일</div>
              {gridDays.map((day) => (
                <div
                  key={day.date}
                  className={`border-l border-[var(--line)] ${period === 'week' && isWeekend(new Date(day.date)) ? 'bg-[var(--bg)]' : ''}`}
                >
                  {renderAllDayCell(day)}
                </div>
              ))}
            </div>

            <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: VISIBLE_HEIGHT }}>
              <div className="grid" style={{ gridTemplateColumns: columns }}>
                <div>
                  {hours.map((h) => (
                    <div key={h} className="relative" style={{ height: HOUR_HEIGHT }}>
                      {h > START_HOUR && (
                        <span className="absolute -top-2 right-2 whitespace-nowrap text-[12px] font-medium leading-4 tabular-nums lg:text-[11px] text-[var(--ink-muted)]">
                          {hourLabel(h)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {gridDays.map((day) => (
                  <div
                    key={day.date}
                    className={`relative border-l border-[var(--line)] ${period === 'week' && isWeekend(new Date(day.date)) ? 'bg-[var(--bg)]' : ''}`}
                  >
                    {hours.map((h) => (
                      <div key={h} className={h > START_HOUR ? 'border-t border-[var(--line)]' : ''} style={{ height: HOUR_HEIGHT }} />
                    ))}
                    {renderDayBlocks(day)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-10">
      <PageHeader
        crumb="캘린더"
        title="캘린더"
        subtitle={subtitle}
        action={
          <PrimaryButton
            onClick={() => goToDayToday(period === 'month' ? todayStr : cursorStr)}
            className="hidden sm:inline-flex"
          >
            <IconPlus size={18} stroke={2} />새 일정
          </PrimaryButton>
        }
      />

      {/* 툴바: 기간 제목 · 이전/다음 · 오늘 | 범례 · 일/주/월 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="mr-1 font-display text-[20px] leading-7 tabular-nums text-[var(--ink)]">{periodTitle}</h2>
          <button
            onClick={() => step(-1)}
            aria-label="이전"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]"
          >
            <IconChevronLeft size={16} stroke={1.8} />
          </button>
          <button
            onClick={() => step(1)}
            aria-label="다음"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)]"
          >
            <IconChevronRight size={16} stroke={1.8} />
          </button>
          <button
            onClick={goToday}
            className="h-8 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--ink)]"
          >
            오늘
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {period !== 'month' && (
            <ul className="hidden items-center gap-1.5 lg:flex" aria-label="분류 범례">
              {Object.values(CATEGORIES).map((cat) => (
                <li
                  key={cat.label}
                  className="flex items-center gap-1.5 rounded-[8px] bg-[var(--surface-sunken)] px-2 py-1 text-[12px] font-medium text-[var(--ink)]"
                >
                  <span className="h-2 w-2 rounded-[2px]" style={{ background: cat.dot }} />
                  {cat.label}
                </li>
              ))}
            </ul>
          )}
          <Segment options={PERIOD_LABELS} value={period} onChange={setPeriod} label="기간" />
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-[var(--barn-soft)] px-3 py-2 text-[13px] text-[var(--ink)]">
          불러오지 못했어요 · {error}
        </p>
      )}

      {period === 'day' && (
        <>
          {/* 요일 스트립 — 고른 날은 wood 칸, 일정이 있는 날엔 점 */}
          <div className="mb-4 grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d) => {
              const dateStr = format(d, 'yyyy-MM-dd')
              const selected = dateStr === cursorStr
              const hasTasks = (days.find((x) => x.date === dateStr)?.tasks.length ?? 0) > 0
              return (
                <button
                  key={dateStr}
                  onClick={() => setCursor(d)}
                  className={`flex flex-col items-center gap-0.5 rounded-xl py-2 ${
                    selected ? 'bg-[var(--wood)] text-[var(--on-wood)]' : 'text-[var(--ink)]'
                  }`}
                >
                  <span className={`text-[13px] font-medium lg:text-[12px] ${selected ? '' : 'text-[var(--ink-muted)]'}`}>
                    {format(d, 'EEE', { locale: ko })}
                  </span>
                  <span className="font-display text-[20px] leading-7 tabular-nums">{format(d, 'd')}</span>
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: hasTasks ? (selected ? 'var(--on-wood)' : 'var(--ink-muted)') : 'transparent' }}
                  />
                </button>
              )
            })}
          </div>
          {renderGrid(visibleDays, DAY_COLUMNS, undefined)}
          {/* 모바일 추가 바 — 고른 날의 할 일 화면으로 가서 적는다 */}
          <button
            onClick={() => goToDayToday(cursorStr)}
            className="mt-4 flex w-full items-center gap-2 rounded-2xl bg-[var(--surface-sunken)] px-5 py-4 text-left text-[15px] text-[var(--ink-faint)] sm:hidden"
          >
            <IconPlus size={20} stroke={1.8} className="text-[var(--ink-muted)]" />새 일정 추가...
          </button>
        </>
      )}

      {period === 'week' && renderGrid(days, WEEK_COLUMNS, 760)}

      {period === 'month' && (
        <MonthSummaryView summary={summary} monthCursor={monthCursor} onSelectDate={handleSelectDate} />
      )}
      {panelDate && <CalendarDayTasks key={panelDate} date={panelDate} selectedId={selectedTaskId}
        contextTasks={Array.from(new Map(days.filter((day) => day.date === panelDate).flatMap((day) => [...day.tasks, ...day.actual_tasks]).map((task) => [task.id, task])).values())}
        previews={days.find((day) => day.date === panelDate)?.previews ?? []}
        onClose={() => setPanelDate(null)} onChange={() => { void loadWeek(); if (period === 'month') void loadMonth() }} />}
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
    <div className="space-y-6">
      <div className="inline-flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-4 shadow-[var(--shadow-card)]">
        <p className="text-[13px] text-[var(--ink-muted)]">이번 달 완료</p>
        <p className="font-display text-[28px] leading-[34px] tabular-nums text-[var(--ink)]">{total}개</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <div className="grid grid-cols-7 border-b border-[var(--line)] text-center text-[12px] text-[var(--ink-muted)]">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-2">{label}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {gridDays.map((d, i) => {
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
                className={`flex aspect-square flex-col items-start overflow-hidden p-1 text-left transition-colors hover:bg-[var(--surface-sunken)] lg:aspect-auto lg:min-h-[104px] lg:p-2 ${
                  i % 7 !== 0 ? 'border-l border-[var(--line)]' : ''
                } ${i >= 7 ? 'border-t border-[var(--line)]' : ''} ${isWeekend(d) ? 'bg-[var(--bg)]' : ''}`}
              >
                {isToday ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--wood)] font-display text-[13px] text-[var(--on-wood)]">
                    {format(d, 'd')}
                  </span>
                ) : (
                  <span className={`font-display text-[13px] leading-6 ${inMonth ? 'text-[var(--ink)]' : 'text-[var(--ink-faint)]'}`}>
                    {format(d, 'd')}
                  </span>
                )}

                {/* 모바일: 칸이 작아서 완료 개수 배지만 */}
                {count > 0 && (
                  <span className="mt-1 rounded-[6px] bg-[var(--sprout-soft)] px-1.5 text-[11px] font-medium text-[var(--ink)] lg:hidden">
                    {count}
                  </span>
                )}

                {/* 데스크탑: 칸이 커서 완료한 일정 제목을 그대로 나열 */}
                {titles.length > 0 && (
                  <ul className="mt-1 hidden w-full space-y-0.5 lg:block">
                    {titles.map((title, j) => (
                      <li
                        key={j}
                        className="flex items-center gap-1 truncate rounded-[6px] bg-[var(--sprout-soft)] px-1.5 text-[11px] leading-[18px] text-[var(--ink)]"
                      >
                        <span className="h-1 w-1 flex-none rounded-full bg-[var(--sprout)]" />
                        <span className="truncate">{title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h3 className="mb-3 text-[16px] font-semibold">프로젝트 진행률</h3>
        {summary.projects.length === 0 ? (
          <p className="text-[13px] text-[var(--ink-muted)]">진행 중인 마일스톤이 있는 프로젝트가 없어요</p>
        ) : (
          <div className="space-y-4">
            {summary.projects.map((p) => {
              const pct = p.total_milestones === 0 ? 0 : Math.round((p.completed_milestones / p.total_milestones) * 100)
              return (
                <div key={p.project_id}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-[var(--ink)]">{p.name}</span>
                    <span className="tabular-nums text-[var(--ink-muted)]">
                      {p.completed_milestones} / {p.total_milestones} · {pct}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-sunken)]">
                    <div className="h-full rounded-full bg-[var(--sprout)]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
