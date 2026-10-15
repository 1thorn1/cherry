import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DndContext, useDraggable, type DragEndEvent } from '@dnd-kit/core'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import {
  IconBell,
  IconCalendar,
  IconChevronDown,
  IconCheck,
  IconClock,
  IconDots,
  IconGripVertical,
  IconListCheck,
  IconNote,
  IconPlus,
  IconRepeat,
  IconTrash,
} from '@tabler/icons-react'
import type { Task } from '../types/task'
import type { Routine, RoutineFreq } from '../types/routine'
import type { Park } from '../types/park'
import type { Project } from '../types/project'
import type { TaskParseResult } from '../types/parse'
import Timetable from '../components/Timetable'
import Collapse from '../components/Collapse'
import { COMPLETION_CHANGED } from '../lib/offlineCompletion'
import TimeSelect from '../components/TimeSelect'
import NotifySelect from '../components/NotifySelect'
import { Card, EmptyState, ErrorBanner, PageHeader, PrimaryButton, ProgressBar, RewardChip, SecondaryButton, Segment } from '../components/ui'
import { getToday, createTask, completeTask, uncompleteTask, deleteTask, scheduleTask, postponeTask, setTaskReminder, setTaskEffectiveTime, setTaskMemo } from '../api/tasks'
import { getRoutines, createRoutine } from '../api/routines'
import { getPark } from '../api/park'
import { setBalance } from '../lib/balance'
import { getProjects } from '../api/projects'
import { parseTask } from '../api/parse'
import { START_HOUR, END_HOUR, hourDroppableId, type TimetableView } from '../lib/timetable'
import { routineRuleLabel } from '../lib/routine'
import { ensurePushSubscription } from '../lib/push'
import { usePersistedState } from '../lib/persistedState'
import { getTodayStr } from '../lib/date'
import { clockLabel } from '../lib/category'
import { DAILY_POINT_CAP, taskReward } from '../lib/reward'

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

// 로컬 타임존을 거치는 new Date()/toISOString() 왕복은 UTC+9에서 자정 근처 하루가 밀리므로
// 날짜 문자열을 UTC 기준으로만 계산한다 (달력 날짜 그 자체를 다루는 것이지 시각이 아니기 때문).
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function tomorrowDate(): string {
  return addDays(getTodayStr(), 1)
}

function thisWeekendDate(): string {
  const today = getTodayStr()
  const [y, m, d] = today.split('-').map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  const diff = day === 0 ? 0 : (6 - day) % 7
  return addDays(today, diff)
}

// `#프로젝트명`으로 즉시 묶기 (A-6-1). 이미 있는 프로젝트 이름과 정확히 일치할 때만 태그하고,
// 일치하는 게 없으면 오타로 새 프로젝트가 몰래 생기는 걸 막기 위해 그냥 글자 그대로 둔다.
function extractProjectTag(title: string, projects: Project[]): { cleanTitle: string; projectId?: number } {
  const match = title.match(/#(\S+)/)
  if (!match) return { cleanTitle: title }
  const project = projects.find((p) => p.name === match[1])
  if (!project) return { cleanTitle: title }
  const cleanTitle = title.replace(match[0], '').replace(/\s+/g, ' ').trim()
  return { cleanTitle: cleanTitle || title, projectId: project.id }
}

function formatSuggestion(s: TaskParseResult): string {
  const today = getTodayStr()
  const parts: string[] = []
  if (s.task_date && s.task_date !== today) {
    const diffDays = Math.round(
      (new Date(`${s.task_date}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) / 86400000
    )
    if (diffDays === 1) parts.push('내일')
    else if (diffDays === 2) parts.push('모레')
    else parts.push(s.task_date.slice(5).replace('-', '/'))
  }
  if (s.scheduled_time) {
    const [h, m] = s.scheduled_time.split(':').map(Number)
    const period = h < 12 ? '오전' : '오후'
    const h12 = h % 12 === 0 ? 12 : h % 12
    parts.push(m === 0 ? `${period} ${h12}시` : `${period} ${h12}시 ${m}분`)
  }
  return parts.join(' ')
}

// 작은 알약 버튼 — 미루기·완료 시각 같은 빠른 선택지
function ChipButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-8 rounded-lg bg-[var(--surface-sunken)] px-3 text-[13px] font-medium text-[var(--ink)] hover:bg-[var(--line)]"
    >
      {children}
    </button>
  )
}

// 카드 아래 메타 줄: 시계 · 시간 · 프로젝트 · 반복 · 알림
function MetaLine({ children }: { children: ReactNode }) {
  return (
    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] leading-[18px] text-[var(--ink-muted)]">
      {children}
    </div>
  )
}

function Dot() {
  return <span aria-hidden="true">·</span>
}

// design_system.pdf "할 일 카드" — 체크 원 · 제목 · 시간(·프로젝트) · 보상 칩.
// 시간·알림·미루기·삭제 같은 기존 기능은 카드를 누르면 아래로 열리는 편집 칸에 모았다.
function TaskCard({
  task,
  reward,
  routineLabel,
  projectName,
  suggestion,
  expanded,
  onToggleExpand,
  onToggle,
  onSchedule,
  onScheduleEnd,
  onSetReminder,
  onDelete,
  onApplySuggestion,
  onDismissSuggestion,
  onPostpone,
}: {
  task: Task
  reward: number
  routineLabel: string | null
  projectName: string | null
  suggestion: TaskParseResult | null
  expanded: boolean
  onToggleExpand: (id: number) => void
  onToggle: (task: Task) => void
  onSchedule: (task: Task, hour: number | null) => void
  onScheduleEnd: (task: Task, hour: number | null) => void
  onSetReminder: (task: Task, offset: number | null) => void
  onDelete: (id: number) => void
  onApplySuggestion: (task: Task) => void
  onDismissSuggestion: (id: number) => void
  onPostpone: (task: Task, taskDate: string | null) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 20 : undefined,
      }}
      className={`group relative rounded-2xl border bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow-card)] transition-colors lg:px-5 ${
        expanded ? 'border-[var(--line-strong)]' : 'border-[var(--line)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggle(task)}
          className="h-[26px] w-[26px] flex-none rounded-full border-[1.5px] border-[var(--line-strong)] transition-colors hover:border-[var(--sprout)] hover:bg-[var(--sprout-soft)]"
          aria-label={`${task.title} 완료`}
        />

        <button onClick={() => onToggleExpand(task.id)} className="min-w-0 flex-1 text-left" aria-expanded={expanded}>
          <span className="block truncate text-[15px] leading-[22px] text-[var(--ink)]">{task.title}</span>
          <MetaLine>
            <IconClock size={14} stroke={1.8} className="flex-none" />
            <span className="tabular-nums">
              {task.scheduled_start
                ? `${clockLabel(task.scheduled_start)}${task.scheduled_end ? ` – ${clockLabel(task.scheduled_end)}` : ''}`
                : '시간 미정'}
            </span>
            {projectName && (<><Dot /><span className="max-w-[160px] truncate">{projectName}</span></>)}
            {routineLabel && (<><Dot /><IconRepeat size={13} stroke={1.8} className="flex-none" /><span>{routineLabel}</span></>)}
            {task.notify_offset_min !== null && <IconBell size={13} stroke={1.8} className="flex-none" aria-label="알림 켜짐" />}
          </MetaLine>
        </button>

        <div className="flex flex-none items-center gap-1.5">
          <RewardChip amount={reward} />
          <span
            {...listeners}
            {...attributes}
            className="hidden cursor-grab touch-none select-none p-1 text-[var(--ink-faint)] opacity-0 transition-opacity active:cursor-grabbing group-hover:opacity-100 lg:inline-flex"
            aria-label="시간표로 끌어서 시간 정하기"
          >
            <IconGripVertical size={16} stroke={1.8} />
          </span>
          <button
            onClick={() => onToggleExpand(task.id)}
            className="rounded-lg p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-sunken)]"
            aria-label="편집"
          >
            <IconDots size={18} stroke={1.8} />
          </button>
        </div>
      </div>

      {suggestion && (
        <div className="ml-[38px] mt-3 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-[var(--ink-muted)]">{formatSuggestion(suggestion)}로 예정할까요?</span>
          <button
            onClick={() => onApplySuggestion(task)}
            className="h-7 rounded-lg bg-[var(--wood)] px-2.5 text-[12px] font-semibold text-[var(--on-wood)]"
          >
            적용
          </button>
          <button
            onClick={() => onDismissSuggestion(task.id)}
            className="h-7 rounded-lg bg-[var(--surface-sunken)] px-2.5 text-[12px] font-medium text-[var(--ink-muted)]"
          >
            무시
          </button>
        </div>
      )}

      <Collapse open={expanded}>
        <div className="ml-[38px] mt-3 space-y-3 border-t border-[var(--line)] pt-3">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-[var(--ink-muted)]">
            <span className="w-12 flex-none font-medium text-[var(--ink)]">시간</span>
            <TimeSelect value={task.scheduled_start} onChange={(hour) => onSchedule(task, hour)} />
            {task.scheduled_start && (
              <>
                <span>–</span>
                <TimeSelect
                  value={task.scheduled_end}
                  onChange={(hour) => onScheduleEnd(task, hour)}
                  minHour={new Date(task.scheduled_start).getHours()}
                />
                <IconBell size={14} stroke={1.8} className="ml-1" />
                <NotifySelect value={task.notify_offset_min} onChange={(offset) => onSetReminder(task, offset)} />
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <span className="w-12 flex-none font-medium text-[var(--ink)]">미루기</span>
            <ChipButton onClick={() => onPostpone(task, tomorrowDate())}>내일</ChipButton>
            <ChipButton onClick={() => onPostpone(task, thisWeekendDate())}>이번 주말</ChipButton>
            <ChipButton onClick={() => onPostpone(task, null)}>이번주로</ChipButton>
            <input
              type="date"
              aria-label="다른 날로 미루기"
              onChange={(e) => e.target.value && onPostpone(task, e.target.value)}
              className="h-8 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 text-[13px] text-[var(--ink)]"
            />
          </div>
          <button
            onClick={() => onDelete(task.id)}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--barn)] hover:underline"
          >
            <IconTrash size={14} stroke={1.8} />삭제
          </button>
        </div>
      </Collapse>
    </div>
  )
}

export default function TodayPage() {
  const today = getTodayStr()
  const [todo, setTodo] = useState<Task[]>([])
  const [done, setDone] = useState<Task[]>([])
  const [backlog, setBacklog] = useState<Task[]>([])
  const [postponeMenuTaskId, setPostponeMenuTaskId] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'all' | 'todo' | 'done' | 'schedule'>('all')
  const [backlogOpen, setBacklogOpen] = useState(false)

  // 모바일 시간표 탭을 열어 둔 상태에서 데스크톱으로 넓히면, 데스크톱에는 탭이 없으므로
  // 자연스럽게 전체 목록으로 돌린다.
  useEffect(() => {
    function resetScheduleTabOnDesktop() {
      if (window.innerWidth >= 1024) setTab((current) => current === 'schedule' ? 'all' : current)
    }
    resetScheduleTabOnDesktop()
    window.addEventListener('resize', resetScheduleTabOnDesktop)
    return () => window.removeEventListener('resize', resetScheduleTabOnDesktop)
  }, [])
  const [view] = usePersistedState<TimetableView>('schedule.view', 'scheduled')
  const [saving, setSaving] = useState(false)
  const [suggestions, setSuggestions] = useState<Record<number, TaskParseResult>>({})
  const [openChipTaskId, setOpenChipTaskId] = useState<number | null>(null)
  const [editingTimeTaskId, setEditingTimeTaskId] = useState<number | null>(null)
  const [openMemoTaskId, setOpenMemoTaskId] = useState<number | null>(null)
  const [memoDraft, setMemoDraft] = useState('')
  // 편집 칸(시간·알림·미루기·삭제)이 열린 할 일 카드 — 한 번에 하나만
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  const [routines, setRoutines] = useState<Routine[]>([])
  const [showRoutineForm, setShowRoutineForm] = useState(false)
  const [routineTitle, setRoutineTitle] = useState('')
  const [routineFreq, setRoutineFreq] = useState<RoutineFreq>('DAILY')
  const [routineWeekdays, setRoutineWeekdays] = useState<Set<number>>(new Set())
  const [routineMonthDay, setRoutineMonthDay] = useState('')
  const [routineDefaultTime, setRoutineDefaultTime] = useState('')
  const [routineTimeBasis, setRoutineTimeBasis] = useState<'CHECKED' | 'SCHEDULED'>('CHECKED')
  const [routineSaving, setRoutineSaving] = useState(false)

  const [park, setPark] = useState<Park | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewDate, setViewDate] = useState(() => searchParams.get('date') || today)
  const [showDatePicker, setShowDatePicker] = useState(false)

  // 캘린더에서 특정 날짜의 일정을 눌러 "/?date=2026-09-28" 같은 링크로 들어온 경우.
  // 이미 오늘 화면에 있는 상태에서 또 다른 날짜로 들어와도(라우트가 안 바뀌어 리마운트가
  // 안 됨) 반영되도록 쿼리 파라미터가 바뀔 때마다 확인한다.
  useEffect(() => {
    const d = searchParams.get('date')
    if (d && d !== viewDate) setViewDate(d)
  }, [searchParams, viewDate])

  // "오늘로"/날짜 선택으로 직접 옮길 땐 URL의 date 파라미터도 같이 갱신(또는 제거)한다 —
  // 안 그러면 위 useEffect가 "URL엔 아직 옛날 날짜가 남아있다"며 방금 옮긴 걸 바로
  // 되돌려버린다(캘린더에서 특정 날짜로 들어온 뒤로는 오늘로도, 다른 날짜로도 못 바뀌던
  // 버그의 원인).
  function goToDate(date: string) {
    setViewDate(date)
    const next = new URLSearchParams(searchParams)
    if (date === today) next.delete('date')
    else next.set('date', date)
    setSearchParams(next, { replace: true })
  }

  async function load() {
    try {
      const data = await getToday(viewDate)
      setTodo(data.todo)
      setDone(data.done)
      setBacklog(data.backlog)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  async function loadRoutines() {
    try {
      setRoutines(await getRoutines())
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  async function loadPark() {
    try {
      const next = await getPark()
      setPark(next)
      setBalance(next.point_balance)
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  async function loadProjects() {
    try {
      setProjects(await getProjects())
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => { loadRoutines(); loadPark(); loadProjects() }, [])
  useEffect(() => { load() }, [viewDate])
  useEffect(() => {
    const refresh = () => { void load(); void loadPark() }
    window.addEventListener(COMPLETION_CHANGED, refresh)
    return () => window.removeEventListener(COMPLETION_CHANGED, refresh)
  }, [viewDate])

  // 탭을 자정 넘겨 계속 켜둔 채로 있으면(특히 PWA) "오늘"을 보고 있던 화면이 어제 날짜에
  // 멈춰 있었다 — 1분마다, 그리고 탭이 다시 보일 때마다 날짜가 바뀌었는지 확인해서
  // "오늘"을 보던 중이었다면 자동으로 새 날짜로 넘어가게 한다(직접 다른 날짜를 보고
  // 있었다면 그 화면은 그대로 둔다).
  useEffect(() => {
    function syncToday() {
      const fresh = getTodayStr()
      if (viewDate !== today || fresh === today) return
      setViewDate(fresh)
      // 새 "오늘"로 넘어가는 것뿐이니 URL에 남아있을 수 있는 옛 date 파라미터도 지운다 —
      // 안 지우면 다음 날 자정에도 이 효과가 "특정 날짜를 보는 중"으로 오인해 다시는
      // 자동으로 안 넘어간다.
      if (searchParams.get('date')) {
        const next = new URLSearchParams(searchParams)
        next.delete('date')
        setSearchParams(next, { replace: true })
      }
    }
    const id = setInterval(syncToday, 60_000)
    document.addEventListener('visibilitychange', syncToday)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', syncToday)
    }
  }, [today, viewDate, searchParams, setSearchParams])

  function toggleWeekday(index: number) {
    setRoutineWeekdays((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  async function handleCreateRoutine() {
    const title = routineTitle.trim()
    if (!title || routineSaving) return
    if (routineFreq === 'WEEKLY' && routineWeekdays.size === 0) return
    if (routineFreq === 'MONTHLY' && !routineMonthDay) return

    setRoutineSaving(true)
    try {
      const weekdaysMask = [...routineWeekdays].reduce((acc, i) => acc | (1 << i), 0)
      await createRoutine({
        title,
        freq: routineFreq,
        weekdays: routineFreq === 'WEEKLY' ? weekdaysMask : undefined,
        month_day: routineFreq === 'MONTHLY' ? Number(routineMonthDay) : undefined,
        default_time: routineDefaultTime || undefined,
        time_basis: routineDefaultTime ? routineTimeBasis : undefined,
        started_on: today,
      })
      setRoutineTitle('')
      setRoutineWeekdays(new Set())
      setRoutineMonthDay('')
      setRoutineDefaultTime('')
      setRoutineTimeBasis('CHECKED')
      setShowRoutineForm(false)
      await Promise.all([load(), loadRoutines()])
    } catch (e) {
      setError(e instanceof Error ? e.message : '반복을 만들지 못했습니다')
    } finally {
      setRoutineSaving(false)
    }
  }

  function routineLabelFor(task: Task) {
    if (!task.routine_id) return null
    const routine = routines.find((r) => r.id === task.routine_id)
    return routine ? routineRuleLabel(routine) : null
  }

  // 완료 영역의 반복 항목은 규칙이 아니라 누적 표기를 보여준다 (A-6-1). 끊긴 일수는 세지 않는다.
  function routineMonthLabelFor(task: Task) {
    if (!task.routine_id) return null
    const routine = routines.find((r) => r.id === task.routine_id)
    return routine ? `이번 달 ${routine.month_completed_count}일` : null
  }

  function projectNameFor(task: Task) {
    if (!task.project_id) return null
    return projects.find((p) => p.id === task.project_id)?.name ?? null
  }

  async function handleAdd() {
    const raw = input.trim()
    if (!raw || saving) return
    setSaving(true)
    try {
      const { cleanTitle, projectId } = extractProjectTag(raw, projects)
      const created = await createTask(cleanTitle, viewDate, projectId)
      setInput('')
      await load()
      try {
        const parsed = await parseTask(cleanTitle)
        const worthShowing = (parsed.task_date && parsed.task_date !== today) || parsed.scheduled_time
        if (worthShowing) {
          setSuggestions((prev) => ({ ...prev, [created.id]: parsed }))
        }
      } catch {
        // 파싱 실패는 조용히 무시 — 저장은 이미 끝났음 (A-6-10 원칙)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '추가하지 못했습니다')
    } finally {
      setSaving(false)
    }
  }

  async function handleApplySuggestion(task: Task) {
    const suggestion = suggestions[task.id]
    if (!suggestion) return
    const date = suggestion.task_date ?? today
    let start: string | null = null
    let end: string | null = null
    if (suggestion.scheduled_time) {
      const [h, m] = suggestion.scheduled_time.split(':').map(Number)
      start = `${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
      end = `${date}T${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
    }
    await scheduleTask(task.id, start, end, suggestion.task_date ?? undefined)
    handleDismissSuggestion(task.id)
    await load()
  }

  function handleDismissSuggestion(taskId: number) {
    setSuggestions((prev) => {
      const next = { ...prev }
      delete next[taskId]
      return next
    })
  }

  async function handleToggle(task: Task) {
    try {
      if (task.completed_at) {
        await uncompleteTask(task.id)
        if (openChipTaskId === task.id) setOpenChipTaskId(null)
        if (openMemoTaskId === task.id) setOpenMemoTaskId(null)
      } else {
        const updated = await completeTask(task.id)
        if (navigator.onLine) setOpenMemoTaskId(updated.id)
        setMemoDraft('')
      }
      void load()
      void loadPark()
    } catch (e) {
      setError(e instanceof Error ? e.message : '완료 상태를 저장하지 못했습니다')
    }
  }

  async function saveMemo(task: Task) {
    const memo = memoDraft.trim()
    setOpenMemoTaskId(null)
    if (memo === (task.memo ?? '')) return
    try {
      await setTaskMemo(task.id, memo)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '메모를 저장하지 못했습니다')
    }
  }

  function toggleMemoEditor(task: Task) {
    if (openMemoTaskId === task.id) {
      setOpenMemoTaskId(null)
    } else {
      setOpenMemoTaskId(task.id)
      setMemoDraft(task.memo ?? '')
    }
  }

  async function applyEffectiveTime(task: Task, effectiveAt: string) {
    await setTaskEffectiveTime(task.id, effectiveAt)
    setOpenChipTaskId(null)
    setEditingTimeTaskId(null)
    load()
  }

  async function handleDelete(id: number) {
    await deleteTask(id)
    load()
  }

  function togglePostponeMenu(id: number) {
    setPostponeMenuTaskId((prev) => (prev === id ? null : id))
  }

  async function handlePostpone(task: Task, taskDate: string | null) {
    await postponeTask(task.id, taskDate)
    setPostponeMenuTaskId(null)
    load()
  }

  async function handlePullIn(task: Task) {
    await postponeTask(task.id, today)
    load()
  }

  async function handleSchedule(task: Task, hour: number | null) {
    if (hour === null) {
      await scheduleTask(task.id, null, null)
    } else {
      const start = `${viewDate}T${String(hour).padStart(2, '0')}:00:00`
      const end = `${viewDate}T${String(hour + 1).padStart(2, '0')}:00:00`
      await scheduleTask(task.id, start, end)
    }
    load()
  }

  async function handleScheduleEnd(task: Task, hour: number | null) {
    if (!task.scheduled_start) return
    const datePart = task.scheduled_start.slice(0, 10)
    const end = hour === null ? null : `${datePart}T${String(hour).padStart(2, '0')}:00:00`
    await scheduleTask(task.id, task.scheduled_start, end)
    load()
  }

  async function handleSetReminder(task: Task, offset: number | null) {
    if (offset !== null) {
      const ok = await ensurePushSubscription()
      if (!ok) {
        setError('알림 권한이 필요해요')
        return
      }
    }
    await setTaskReminder(task.id, offset)
    load()
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
    const hour = hours.find((h) => hourDroppableId(h) === over.id)
    if (hour === undefined) return
    const task = todo.find((t) => t.id === Number(active.id))
    if (!task) return
    handleSchedule(task, hour)
  }

  const population = park?.population ?? 0
  const rewardOf = (task: Task) => taskReward(task, population)
  // 오늘 수확: 끝낸 것 / 전체, 받은 체리 / 다 끝내면 받을 체리 (하루 상한 반영)
  const totalCount = todo.length + done.length
  const earned = Math.min(done.reduce((sum, t) => sum + rewardOf(t), 0), DAILY_POINT_CAP)
  const possible = Math.min(earned + todo.reduce((sum, t) => sum + rewardOf(t), 0), DAILY_POINT_CAP)
  const isToday = viewDate === today
  const dateLabel = format(new Date(`${viewDate}T00:00:00`), 'yyyy년 M월 d일 EEEE', { locale: ko })

  const harvestCaption =
    totalCount === 0
      ? '할 일을 적으면 여기서 수확을 셀게요.'
      : todo.length === 0
        ? '다 끝냈어요! 오늘 수확 완료.'
        : `모두 끝내면 체리 ${possible - earned}개를 더 받아요.`

  function focusAddInput() {
    setTab('all')
    setShowAddForm(true)
    requestAnimationFrame(() => {
      addInputRef.current?.focus()
      addInputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }

  function toggleExpanded(id: number) {
    setExpandedTaskId((prev) => (prev === id ? null : id))
  }

  const todoCards = todo.map((task) => (
    <TaskCard
      key={task.id}
      task={task}
      reward={rewardOf(task)}
      routineLabel={routineLabelFor(task)}
      projectName={projectNameFor(task)}
      suggestion={suggestions[task.id] ?? null}
      expanded={expandedTaskId === task.id}
      onToggleExpand={toggleExpanded}
      onToggle={handleToggle}
      onSchedule={handleSchedule}
      onScheduleEnd={handleScheduleEnd}
      onSetReminder={handleSetReminder}
      onDelete={handleDelete}
      onApplySuggestion={handleApplySuggestion}
      onDismissSuggestion={handleDismissSuggestion}
      onPostpone={handlePostpone}
    />
  ))

  const doneCards = done.map((task) => (
    <div key={task.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3.5 shadow-[var(--shadow-card)] lg:px-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleToggle(task)}
          className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-[var(--sprout)] text-[var(--on-sprout)]"
          aria-label={`${task.title} 완료 취소`}
        >
          <IconCheck size={15} stroke={2.6} />
        </button>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[15px] leading-[22px] text-[var(--ink-faint)] line-through">{task.title}</span>
          <MetaLine>
            <IconClock size={14} stroke={1.8} className="flex-none" />
            <span className="tabular-nums">{clockLabel((task.effective_at ?? task.completed_at)!)}</span>
            {projectNameFor(task) && (<><Dot /><span className="max-w-[160px] truncate">{projectNameFor(task)}</span></>)}
            {routineMonthLabelFor(task) && (<><Dot /><IconRepeat size={13} stroke={1.8} className="flex-none" /><span>{routineMonthLabelFor(task)}</span></>)}
          </MetaLine>
          {task.memo && openMemoTaskId !== task.id && (
            <p className="mt-1 flex items-center gap-1 text-[13px] text-[var(--ink-muted)]">
              <IconNote size={13} stroke={1.8} className="flex-none" />{task.memo}
            </p>
          )}
        </div>
        <div className="flex flex-none items-center gap-1">
          <RewardChip amount={rewardOf(task)} received />
          <button
            onClick={() => toggleMemoEditor(task)}
            className="rounded-lg p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-sunken)]"
            aria-label="메모 쓰기"
          >
            <IconNote size={17} stroke={1.8} />
          </button>
          <button
            onClick={() => setOpenChipTaskId(openChipTaskId === task.id ? null : task.id)}
            className="rounded-lg p-1 text-[var(--ink-muted)] hover:bg-[var(--surface-sunken)]"
            aria-label="완료 시각 고치기"
          >
            <IconClock size={17} stroke={1.8} />
          </button>
        </div>
      </div>

      <Collapse open={openMemoTaskId === task.id} focusOnOpen>
        <input
          value={memoDraft}
          onChange={(e) => setMemoDraft(e.target.value)}
          onBlur={() => saveMemo(task)}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          placeholder="한 줄 메모 (선택)"
          className="ml-[38px] mt-3 h-9 w-[calc(100%-38px)] rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
        />
      </Collapse>

      <Collapse open={openChipTaskId === task.id}>
        <div className="ml-[38px] mt-3 flex flex-wrap items-center gap-2 text-[13px]">
          <span className="text-[var(--ink-muted)]">언제로 기록할까요?</span>
          {task.scheduled_start && <ChipButton onClick={() => applyEffectiveTime(task, task.scheduled_start!)}>예정대로</ChipButton>}
          <ChipButton onClick={() => applyEffectiveTime(task, task.completed_at!)}>지금</ChipButton>
          {editingTimeTaskId === task.id ? (
            <input
              type="time"
              autoFocus
              onChange={(e) => e.target.value && applyEffectiveTime(task, `${task.task_date ?? viewDate}T${e.target.value}:00`)}
              className="h-8 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 text-[13px] text-[var(--ink)]"
            />
          ) : (
            <ChipButton onClick={() => setEditingTimeTaskId(task.id)}>직접 입력</ChipButton>
          )}
        </div>
      </Collapse>
    </div>
  ))

  const showTodo = tab === 'all' || tab === 'todo'
  const showDone = tab === 'all' || tab === 'done'

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
      <PageHeader
        crumb="할 일"
        title={isToday ? '오늘 할 일' : '할 일'}
        subtitle={
          <>
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span>{dateLabel}</span>
              <button
                onClick={() => setShowDatePicker((v) => !v)}
                className="rounded p-0.5 text-[var(--ink-muted)] hover:text-[var(--ink)]"
                aria-label="날짜 고르기"
              >
                <IconCalendar size={15} stroke={1.8} />
              </button>
              {!isToday && (
                <button
                  onClick={() => { goToDate(today); setShowDatePicker(false) }}
                  className="font-semibold text-[var(--wood)] hover:underline"
                >
                  오늘로
                </button>
              )}
              <span className="hidden lg:inline">· 할 일을 끝내면 체리가 쌓여요.</span>
            </span>
            <Collapse open={showDatePicker} focusOnOpen>
              <input
                type="date"
                value={viewDate}
                onChange={(e) => {
                  if (e.target.value) {
                    goToDate(e.target.value)
                    setShowDatePicker(false)
                  }
                }}
                className="mt-2 block h-9 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 text-[13px] text-[var(--ink)]"
              />
            </Collapse>
          </>
        }
        action={
          <PrimaryButton onClick={focusAddInput}>
            <IconPlus size={18} stroke={2} />새 할 일
          </PrimaryButton>
        }
      />

      {error && <ErrorBanner message={error} />}

      {(tab === 'all' || tab === 'todo') && (
        <div className="mb-4 max-w-2xl">
            {(tab === 'all' || tab === 'todo') && (
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setShowRoutineForm((v) => !v)} aria-expanded={showRoutineForm} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 text-[12px] font-medium text-[var(--ink)]">
                  <IconRepeat size={14} stroke={1.8} />반복
                  <IconChevronDown size={14} className={`transition-transform duration-200 ${showRoutineForm ? 'rotate-180' : ''}`} />
                </button>
                {backlog.length > 0 && <button onClick={() => setBacklogOpen((v) => !v)} aria-expanded={backlogOpen} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 text-[12px] font-medium text-[var(--ink)]">
                  당겨오기 <span className="text-[var(--ink-muted)]">{backlog.length}</span>
                  <IconChevronDown size={14} className={`transition-transform duration-200 ${backlogOpen ? 'rotate-180' : ''}`} />
                </button>}
              </div>
            )}
            {(tab === 'all' || tab === 'todo') && backlog.length > 0 && (
              <Collapse open={backlogOpen} className="!mt-0"><div className="pt-4">
              <Card className="p-3.5">
                <button onClick={() => setBacklogOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
                  <span className="text-[14px] font-semibold text-[var(--ink)]">이번 주에서 당겨오기 <span className="ml-1 rounded-full bg-[var(--barn-soft)] px-1.5 py-0.5 text-[11px] tabular-nums">{backlog.length}개</span></span>
                  <IconChevronDown size={16} className={`text-[var(--ink-muted)] transition-transform ${backlogOpen ? 'rotate-180' : ''}`} />
                </button>
                <ul className="mt-2 divide-y divide-[var(--line)]">
                  {backlog.map((task) => (
                    <li key={task.id} className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-[var(--ink)]">{task.title}</p>
                          <p className="text-[12px] text-[var(--ink-muted)]">
                            {task.task_date ? task.task_date.slice(5).replace('-', '/') : '이번 주'}
                          </p>
                        </div>
                        <button
                          onClick={() => handlePullIn(task)}
                          className="h-8 flex-none rounded-lg bg-[var(--wood)] px-3 text-[12px] font-semibold text-[var(--on-wood)]"
                        >
                          오늘로
                        </button>
                        <button
                          onClick={() => togglePostponeMenu(task.id)}
                          className="rounded-lg p-1.5 text-[var(--ink-muted)] hover:bg-[var(--surface-sunken)]"
                          aria-label="다른 날로"
                        >
                          <IconCalendar size={16} stroke={1.8} />
                        </button>
                        <button onClick={() => handleDelete(task.id)} className="rounded-lg p-1.5 text-[var(--barn)] hover:bg-[var(--barn-soft)]" aria-label={`${task.title} 일정 삭제`}>
                          <IconTrash size={16} stroke={1.8} />
                        </button>
                      </div>
                      <Collapse open={postponeMenuTaskId === task.id}>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <ChipButton onClick={() => handlePostpone(task, tomorrowDate())}>내일</ChipButton>
                          <ChipButton onClick={() => handlePostpone(task, thisWeekendDate())}>이번 주말</ChipButton>
                          <input
                            type="date"
                            aria-label="다른 날로 가져가기"
                            onChange={(e) => e.target.value && handlePostpone(task, e.target.value)}
                            className="h-8 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 text-[13px] text-[var(--ink)]"
                          />
                        </div>
                      </Collapse>
                    </li>
                  ))}
                </ul>
              </Card>
              </div></Collapse>
            )}
            {(tab === 'all' || tab === 'todo') && <Collapse open={showRoutineForm} className="!mt-0"><div className="pt-4"><Card className="p-3.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-[14px] font-semibold text-[var(--ink)]">반복</h2>
                  <p className="text-[12px] text-[var(--ink-muted)]">매일·요일·매월 돌아오는 할 일</p>
                </div>
                <SecondaryButton onClick={() => setShowRoutineForm((v) => !v)} className="!h-8 !rounded-lg !px-2.5 !text-[12px]">
                  {showRoutineForm ? '닫기' : <><IconRepeat size={14} stroke={1.8} />만들기</>}
                </SecondaryButton>
              </div>

              <div className="mt-3 space-y-2.5">
                  <input
                    value={routineTitle}
                    onChange={(e) => setRoutineTitle(e.target.value)}
                    placeholder="반복할 일 (예: 스트레칭)"
                    className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--line-strong)]"
                  />
                  <Segment
                    full
                    label="반복 주기"
                    value={routineFreq}
                    onChange={setRoutineFreq}
                    options={[
                      { value: 'DAILY' as RoutineFreq, label: '매일' },
                      { value: 'WEEKLY' as RoutineFreq, label: '요일' },
                      { value: 'MONTHLY' as RoutineFreq, label: '매월' },
                    ]}
                  />
                  <Collapse open={routineFreq === 'WEEKLY'}>
                    <div className="flex gap-1">
                      {WEEKDAY_LABELS.map((label, i) => (
                        <button
                          key={label}
                          onClick={() => toggleWeekday(i)}
                          aria-pressed={routineWeekdays.has(i)}
                          className={`h-8 flex-1 rounded-lg text-[13px] font-medium ${
                            routineWeekdays.has(i)
                              ? 'bg-[var(--wood)] text-[var(--on-wood)]'
                              : 'bg-[var(--surface-sunken)] text-[var(--ink-muted)]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </Collapse>
                  <Collapse open={routineFreq === 'MONTHLY'}>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={routineMonthDay}
                      onChange={(e) => setRoutineMonthDay(e.target.value)}
                      placeholder="매월 며칠 (1~31)"
                      className="h-10 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-[15px] text-[var(--ink)] outline-none focus:border-[var(--line-strong)]"
                    />
                  </Collapse>
                  <label className="flex items-center gap-2 text-[13px] text-[var(--ink-muted)]">
                    기본 시각
                    <input
                      type="time"
                      value={routineDefaultTime}
                      onChange={(e) => setRoutineDefaultTime(e.target.value)}
                      className="h-9 flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-[14px] text-[var(--ink)] outline-none focus:border-[var(--line-strong)]"
                    />
                  </label>
                  <Collapse open={Boolean(routineDefaultTime)}>
                    <div>
                      <p className="mb-1.5 text-[12px] text-[var(--ink-muted)]">완료로 기록할 시각</p>
                      <Segment
                        full
                        label="완료로 기록할 시각"
                        value={routineTimeBasis}
                        onChange={setRoutineTimeBasis}
                        options={[
                          { value: 'CHECKED' as const, label: '체크한 시각' },
                          { value: 'SCHEDULED' as const, label: `예정 시각 (${routineDefaultTime})` },
                        ]}
                      />
                    </div>
                  </Collapse>
                  <PrimaryButton onClick={handleCreateRoutine} disabled={routineSaving} className="w-full">
                    반복 만들기
                  </PrimaryButton>
                </div>
            </Card></div></Collapse>}

        </div>
      )}

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* ── 왼쪽: 수확(모바일) · 탭 · 할 일 카드 · 추가 바 ── */}
          <div className="min-w-0 space-y-3">
            <Card className="p-4 lg:hidden">
              <div className="mb-2 flex items-center justify-between text-[13px]">
                <span className="font-semibold text-[var(--ink)] tabular-nums">
                  {isToday ? '오늘' : '이날'} {done.length} / {totalCount} 완료
                </span>
                <span className="font-semibold text-[var(--coin-ink)] tabular-nums">+{earned} / {possible} 체리</span>
              </div>
              <ProgressBar value={done.length} max={totalCount} label="오늘 수확 진행률" />
            </Card>

            <div className="lg:hidden"><Segment full label="할 일 보기" value={tab} onChange={setTab} options={[{ value: 'all', label: '전체' }, { value: 'todo', label: `할 일 ${todo.length}` }, { value: 'done', label: `완료 ${done.length}` }, { value: 'schedule', label: '시간표' }]} /></div>
            <div className="hidden lg:block"><Segment full label="할 일 보기" value={tab === 'schedule' ? 'all' : tab} onChange={setTab} options={[{ value: 'all', label: '전체' }, { value: 'todo', label: `할 일 ${todo.length}` }, { value: 'done', label: `완료 ${done.length}` }]} /></div>

            {tab !== 'done' && tab !== 'schedule' && (
              <Collapse open={showAddForm} className="!mt-0"><div className="pt-3">
              <form onSubmit={(e) => { e.preventDefault(); void handleAdd() }} className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                <input
                  ref={addInputRef}
                  aria-label="새 할 일"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault() }}
                  placeholder="새 할 일 추가... (#프로젝트로 묶기)"
                  className="min-w-0 flex-1 bg-transparent text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
                />
                <PrimaryButton type="submit" disabled={saving || !input.trim()} className="!h-8 !px-3 !text-[13px]">추가</PrimaryButton>
                <SecondaryButton onClick={() => setShowAddForm(false)} className="!h-8 !px-2">닫기</SecondaryButton>
              </form>
              </div></Collapse>
            )}

            {tab === 'schedule' ? (
              <Card className="p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div><h2 className="text-[16px] font-semibold text-[var(--ink)]">{isToday ? '오늘 시간표' : '이날 시간표'}</h2><p className="mt-1 text-[12px] text-[var(--ink-muted)]">할 일을 끌어다 놓으면 시간이 정해져요.</p></div>

                </div>
                <Timetable tasks={[...todo, ...done]} view={view} onUnschedule={(t) => handleSchedule(t, null)} rewardFor={rewardOf} />
              </Card>
            ) : <>{showTodo && todoCards}{showDone && doneCards}</>}

            {tab === 'todo' && todo.length === 0 && (
              <EmptyState icon={<IconListCheck size={28} stroke={1.6} />} title="아직 없어요" hint="오늘 할 일을 하나 적어보세요" />
            )}
            {tab === 'done' && done.length === 0 && (
              <EmptyState icon={<IconCheck size={28} stroke={1.6} />} title="아직 없어요" hint="할 일을 끝내면 여기 쌓여요" />
            )}
            {tab === 'all' && totalCount === 0 && (
              <EmptyState icon={<IconListCheck size={28} stroke={1.6} />} title="아직 없어요" hint="오늘 할 일을 하나 적어보세요" />
            )}


          </div>

          {/* ── 오른쪽: 오늘 일정 · 오늘 수확 ── */}
          <aside className="min-w-0 space-y-4">
            {/* 데스크톱은 캘린더의 ‘일’ 보기처럼 우측 일간 시간축을 항상 함께 본다.
                모바일에서는 전용 시간표 탭으로만 열어 목록 스크롤을 줄인다. */}
            <Card className="hidden p-5 lg:block">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-[var(--ink)]">{isToday ? '오늘 일정' : '이날 일정'}</h2>
                  <p className="mt-1 text-[12px] text-[var(--ink-muted)]">하루 일정을 시간순으로 확인하세요.</p>
                </div>

              </div>
              <Timetable fitViewport tasks={[...todo, ...done]} view={view} onUnschedule={(t) => handleSchedule(t, null)} rewardFor={rewardOf} />
            </Card>


            <Card className="hidden p-5 lg:block">
              <h2 className="mb-3 text-[16px] font-semibold text-[var(--ink)]">{isToday ? '오늘 수확' : '이날 수확'}</h2>
              <div className="mb-3 flex items-end justify-between">
                <span className="font-display text-[28px] leading-[34px] tabular-nums text-[var(--ink)]">
                  {done.length} / {totalCount}
                </span>
                <span className="text-[13px] font-semibold tabular-nums text-[var(--coin-ink)]">+{earned} / {possible} 체리</span>
              </div>
              <ProgressBar value={done.length} max={totalCount} label="오늘 수확 진행률" />
              <p className="mt-3 text-[12px] text-[var(--ink-muted)]">{harvestCaption}</p>
            </Card>






          </aside>
        </div>
      </DndContext>
    </div>
  )
}
