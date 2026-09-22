import { useEffect, useState } from 'react'
import { DndContext, useDraggable, type DragEndEvent } from '@dnd-kit/core'
import { IconBell, IconCheck, IconClock, IconGripVertical, IconNote, IconRepeat } from '@tabler/icons-react'
import type { Task } from '../types/task'
import type { Routine, RoutineFreq } from '../types/routine'
import type { Park } from '../types/park'
import type { TaskParseResult } from '../types/parse'
import Timetable from '../components/Timetable'
import TimeSelect from '../components/TimeSelect'
import NotifySelect from '../components/NotifySelect'
import { getToday, createTask, completeTask, uncompleteTask, deleteTask, scheduleTask, setTaskReminder, setTaskEffectiveTime, setTaskMemo } from '../api/tasks'
import { getRoutines, createRoutine } from '../api/routines'
import { getPark } from '../api/park'
import { parseTask } from '../api/parse'
import { START_HOUR, END_HOUR, hourDroppableId, type TimetableView } from '../lib/timetable'
import { routineRuleLabel } from '../lib/routine'
import { ensurePushSubscription } from '../lib/push'

const today = new Date().toISOString().slice(0, 10)
const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

function formatSuggestion(s: TaskParseResult): string {
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

function TaskRow({
  task,
  routineLabel,
  suggestion,
  onToggle,
  onSchedule,
  onSetReminder,
  onDelete,
  onApplySuggestion,
  onDismissSuggestion,
}: {
  task: Task
  routineLabel: string | null
  suggestion: TaskParseResult | null
  onToggle: (task: Task) => void
  onSchedule: (task: Task, hour: number | null) => void
  onSetReminder: (task: Task, offset: number | null) => void
  onDelete: (id: number) => void
  onApplySuggestion: (task: Task) => void
  onDismissSuggestion: (id: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="border-b border-neutral-100 py-3"
    >
      <div className="group flex items-center gap-3">
        <button
          onClick={() => onToggle(task)}
          className="h-4 w-4 flex-none rounded border-[1.5px] border-neutral-300 hover:border-neutral-500"
          aria-label="완료"
        />
        <span
          {...listeners}
          {...attributes}
          className="touch-none select-none text-neutral-300 cursor-grab active:cursor-grabbing"
          aria-label="드래그해서 시간 배정"
        >
          <IconGripVertical size={14} stroke={1.75} />
        </span>
        <span className="flex-1 text-sm">
          {task.title}
          {routineLabel && (
            <span className="ml-2 inline-flex items-center gap-0.5 text-[11px] text-neutral-400">
              <IconRepeat size={12} stroke={1.75} />{routineLabel}
            </span>
          )}
          {task.notify_offset_min !== null && (
            <span className="ml-2 inline-flex text-neutral-400" aria-label="알림 켜짐">
              <IconBell size={12} stroke={1.75} />
            </span>
          )}
        </span>
        <TimeSelect value={task.scheduled_start} onChange={(hour) => onSchedule(task, hour)} />
        {task.scheduled_start && (
          <NotifySelect value={task.notify_offset_min} onChange={(offset) => onSetReminder(task, offset)} />
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="text-xs text-neutral-300 opacity-0 transition group-hover:opacity-100"
        >
          삭제
        </button>
      </div>

      {suggestion && (
        <div className="ml-7 mt-2 flex items-center gap-2 text-[11px]">
          <span className="text-neutral-400">{formatSuggestion(suggestion)}로 예정할까요?</span>
          <button
            onClick={() => onApplySuggestion(task)}
            className="rounded-full px-2 py-0.5 font-medium text-white"
            style={{ background: 'var(--cherry)' }}
          >
            적용
          </button>
          <button
            onClick={() => onDismissSuggestion(task.id)}
            className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-400"
          >
            무시
          </button>
        </div>
      )}
    </div>
  )
}

export default function TodayPage() {
  const [todo, setTodo] = useState<Task[]>([])
  const [done, setDone] = useState<Task[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'todo' | 'done' | 'timetable'>('todo')
  const [view, setView] = useState<TimetableView>('scheduled')
  const [saving, setSaving] = useState(false)
  const [suggestions, setSuggestions] = useState<Record<number, TaskParseResult>>({})
  const [openChipTaskId, setOpenChipTaskId] = useState<number | null>(null)
  const [editingTimeTaskId, setEditingTimeTaskId] = useState<number | null>(null)
  const [openMemoTaskId, setOpenMemoTaskId] = useState<number | null>(null)
  const [memoDraft, setMemoDraft] = useState('')

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

  async function load() {
    try {
      const data = await getToday(today)
      setTodo(data.todo)
      setDone(data.done)
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
      setPark(await getPark())
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => { load(); loadRoutines(); loadPark() }, [])

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

  async function handleAdd() {
    const title = input.trim()
    if (!title || saving) return
    setSaving(true)
    try {
      const created = await createTask(title, today)
      setInput('')
      await load()
      try {
        const parsed = await parseTask(title)
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
    if (task.completed_at) {
      await uncompleteTask(task.id)
      if (openChipTaskId === task.id) setOpenChipTaskId(null)
      if (openMemoTaskId === task.id) setOpenMemoTaskId(null)
    } else {
      const updated = await completeTask(task.id)
      setOpenMemoTaskId(updated.id)
      setMemoDraft('')
    }
    load()
    loadPark()
  }

  async function saveMemo(task: Task) {
    const memo = memoDraft.trim()
    setOpenMemoTaskId(null)
    if (memo === (task.memo ?? '')) return
    await setTaskMemo(task.id, memo)
    load()
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

  async function handleSchedule(task: Task, hour: number | null) {
    if (hour === null) {
      await scheduleTask(task.id, null, null)
    } else {
      const start = `${today}T${String(hour).padStart(2, '0')}:00:00`
      const end = `${today}T${String(hour + 1).padStart(2, '0')}:00:00`
      await scheduleTask(task.id, start, end)
    }
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

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">

      <header className="mb-6">
        <h1 className="text-xl font-medium tracking-tight">체리</h1>
        <p className="mt-1 text-xs text-neutral-500">{today}</p>
        {park && (
          <p className="mt-1 text-xs text-neutral-400">
            오늘 방문객 {park.today_visitors} · 체리 {park.point_balance}
          </p>
        )}
      </header>

      <div className="mb-6 flex gap-2">
        <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return
              if (e.key === 'Enter') handleAdd()
            }}
            placeholder="할 일 적기"
            className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
        />
        <button
            onClick={handleAdd}
            disabled={saving}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--cherry)' }}
        >
          추가
        </button>
      </div>

      <button
        onClick={() => setShowRoutineForm((v) => !v)}
        className="mb-4 text-xs text-neutral-400"
      >
        {showRoutineForm ? '반복 만들기 닫기' : '+ 반복 만들기'}
      </button>

      {showRoutineForm && (
        <div className="mb-6 rounded-lg border border-neutral-200 p-4">
          <input
            value={routineTitle}
            onChange={(e) => setRoutineTitle(e.target.value)}
            placeholder="반복할 일 (예: 스트레칭)"
            className="mb-3 w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
          />

          <div className="mb-3 flex gap-1 rounded-lg bg-neutral-100 p-1">
            {(['DAILY', 'WEEKLY', 'MONTHLY'] as RoutineFreq[]).map((freq) => (
              <button
                key={freq}
                onClick={() => setRoutineFreq(freq)}
                className={`flex-1 rounded-md py-2 text-xs font-medium ${routineFreq === freq ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
              >
                {freq === 'DAILY' ? '매일' : freq === 'WEEKLY' ? '요일' : '매월'}
              </button>
            ))}
          </div>

          {routineFreq === 'WEEKLY' && (
            <div className="mb-3 flex gap-1">
              {WEEKDAY_LABELS.map((label, i) => (
                <button
                  key={label}
                  onClick={() => toggleWeekday(i)}
                  className="h-8 flex-1 rounded-lg text-xs font-medium"
                  style={
                    routineWeekdays.has(i)
                      ? { background: 'var(--cherry-bg)', color: 'var(--cherry)' }
                      : { background: '#F5F5F4', color: '#a3a3a3' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {routineFreq === 'MONTHLY' && (
            <input
              type="number"
              min={1}
              max={31}
              value={routineMonthDay}
              onChange={(e) => setRoutineMonthDay(e.target.value)}
              placeholder="매월 며칠 (1~31)"
              className="mb-3 w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
          )}

          <input
            type="time"
            value={routineDefaultTime}
            onChange={(e) => setRoutineDefaultTime(e.target.value)}
            className="mb-3 w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
          />

          {routineDefaultTime && (
            <div className="mb-3">
              <p className="mb-1.5 text-[11px] text-neutral-400">완료로 기록할 시각</p>
              <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
                <button
                  onClick={() => setRoutineTimeBasis('CHECKED')}
                  className={`flex-1 rounded-md py-2 text-xs font-medium ${routineTimeBasis === 'CHECKED' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
                >
                  체크한 시각
                </button>
                <button
                  onClick={() => setRoutineTimeBasis('SCHEDULED')}
                  className={`flex-1 rounded-md py-2 text-xs font-medium ${routineTimeBasis === 'SCHEDULED' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
                >
                  예정 시각 ({routineDefaultTime})
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleCreateRoutine}
            disabled={routineSaving}
            className="w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--cherry)' }}
          >
            반복 만들기
          </button>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</p>
      )}

      <div className="mb-4 flex gap-1 rounded-lg bg-neutral-100 p-1 lg:hidden">
        <button
          onClick={() => setTab('todo')}
          className={`flex-1 rounded-md py-2 text-xs font-medium ${tab === 'todo' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
        >
          할 일 {todo.length}
        </button>
        <button
          onClick={() => setTab('done')}
          className={`flex-1 rounded-md py-2 text-xs font-medium ${tab === 'done' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
        >
          완료 {done.length}
        </button>
        <button
          onClick={() => setTab('timetable')}
          className={`flex-1 rounded-md py-2 text-xs font-medium ${tab === 'timetable' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
        >
          시간표
        </button>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid gap-8 lg:grid-cols-3">

          <section className={tab === 'todo' ? '' : 'hidden lg:block'}>
            <p className="mb-3 hidden text-xs text-neutral-500 lg:block">할 일 {todo.length}</p>
            {todo.length === 0 && (
              <p className="py-8 text-center text-xs text-neutral-400">할 일이 없어요</p>
            )}
            {todo.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                routineLabel={routineLabelFor(task)}
                suggestion={suggestions[task.id] ?? null}
                onToggle={handleToggle}
                onSchedule={handleSchedule}
                onSetReminder={handleSetReminder}
                onDelete={handleDelete}
                onApplySuggestion={handleApplySuggestion}
                onDismissSuggestion={handleDismissSuggestion}
              />
            ))}
          </section>

          <section className={tab === 'done' ? '' : 'hidden lg:block'}>
            <p className="mb-3 hidden text-xs text-neutral-500 lg:block">완료 {done.length}</p>
            {done.length === 0 && (
              <p className="py-8 text-center text-xs text-neutral-400">아직 없어요</p>
            )}
            {done.map((task) => (
              <div key={task.id} className="border-b border-neutral-100 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(task)}
                    className="flex h-4 w-4 flex-none items-center justify-center rounded text-white"
                    style={{ background: 'var(--cherry)' }}
                    aria-label="완료 취소"
                  >
                    <IconCheck size={10} stroke={2.5} />
                  </button>
                  <span className="flex-1 text-sm text-neutral-400 line-through">
                    {task.title}
                    {routineLabelFor(task) && (
                      <span className="ml-2 inline-flex items-center gap-0.5 text-[11px] text-neutral-300">
                        <IconRepeat size={11} stroke={1.75} />{routineLabelFor(task)}
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-neutral-300">
                    {(task.effective_at ?? task.completed_at)?.slice(11, 16)}
                  </span>
                  <button
                    onClick={() => toggleMemoEditor(task)}
                    className="flex text-neutral-300"
                    aria-label="메모 수정"
                  >
                    <IconNote size={13} stroke={1.75} />
                  </button>
                  <button
                    onClick={() => setOpenChipTaskId(openChipTaskId === task.id ? null : task.id)}
                    className="flex text-neutral-300"
                    aria-label="완료 시각 수정"
                  >
                    <IconClock size={13} stroke={1.75} />
                  </button>
                </div>

                {openMemoTaskId === task.id ? (
                  <input
                    autoFocus
                    value={memoDraft}
                    onChange={(e) => setMemoDraft(e.target.value)}
                    onBlur={() => saveMemo(task)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    placeholder="메모 (선택)"
                    className="ml-7 mt-2 w-[calc(100%-1.75rem)] rounded-md border border-neutral-200 px-2 py-1 text-[11px] outline-none focus:border-neutral-400"
                  />
                ) : task.memo ? (
                  <p className="ml-7 mt-1 text-[11px] text-neutral-400">{task.memo}</p>
                ) : null}

                {openChipTaskId === task.id && (
                  <div className="ml-7 mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="mr-0.5 text-[11px] text-neutral-400">언제로 기록할까요?</span>
                    {task.scheduled_start && (
                      <button
                        onClick={() => applyEffectiveTime(task, task.scheduled_start!)}
                        className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600"
                      >
                        예정대로
                      </button>
                    )}
                    <button
                      onClick={() => applyEffectiveTime(task, task.completed_at!)}
                      className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600"
                    >
                      지금
                    </button>
                    {editingTimeTaskId === task.id ? (
                      <input
                        type="time"
                        autoFocus
                        onChange={(e) => e.target.value && applyEffectiveTime(task, `${task.task_date ?? today}T${e.target.value}:00`)}
                        className="rounded-md border border-neutral-200 px-1.5 py-1 text-[11px]"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingTimeTaskId(task.id)}
                        className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600"
                      >
                        직접입력
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </section>

          <section className={tab === 'timetable' ? '' : 'hidden lg:block'}>
            <div className="mb-3 flex items-center justify-between">
              <p className="hidden text-xs text-neutral-500 lg:block">시간표</p>
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
            <Timetable tasks={[...todo, ...done]} view={view} onUnschedule={(t) => handleSchedule(t, null)} />
          </section>

        </div>
      </DndContext>
    </div>
  )
}
