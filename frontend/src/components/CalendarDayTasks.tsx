import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconPlus, IconX } from '@tabler/icons-react'
import type { Task, TodayResponse } from '../types/task'
import type { RoutinePreview } from '../types/calendar'
import { completeTask, createTask, getToday, setTaskMemo, uncompleteTask } from '../api/tasks'
import { getPark } from '../api/park'
import { setBalance } from '../lib/balance'
import Collapse from './Collapse'
import { ErrorBanner, PrimaryButton } from './ui'

export default function CalendarDayTasks({ date, selectedId, contextTasks, previews, onClose, onChange }: {
  date: string
  selectedId: number | null
  contextTasks: Task[]
  previews: RoutinePreview[]
  onClose: () => void
  onChange: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const selectedRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<number | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [data, setData] = useState<TodayResponse | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [drag, setDrag] = useState(0)
  const [closing, setClosing] = useState(false)
  const [memoId, setMemoId] = useState<number | null>(null)
  const [memo, setMemo] = useState('')

  useEffect(() => {
    let active = true
    const dialog = dialogRef.current
    dialog?.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    getToday(date).then((next) => { if (active) setData(next) })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : '불러오지 못했습니다') })
    return () => {
      active = false
      document.body.style.overflow = previousOverflow
      if (closeTimer.current) clearTimeout(closeTimer.current)
      dialog?.close()
    }
  }, [date])

  useEffect(() => {
    if (data && selectedId !== null) selectedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [data, selectedId])

  function close() {
    if (closing) return
    setClosing(true)
    closeTimer.current = setTimeout(() => {
      dialogRef.current?.close()
      onClose()
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220)
  }

  async function update(action: () => Promise<unknown>) {
    if (!date || busy) return
    setBusy(true)
    setError('')
    try {
      await action()
      setData(await getToday(date))
      onChange()
      getPark().then((park) => setBalance(park.point_balance)).catch(() => {})
    } catch (e) {
      setError(e instanceof Error ? e.message : '변경하지 못했습니다')
    } finally {
      setBusy(false)
    }
  }

  function taskRow(task: Task) {
    const done = Boolean(task.completed_at)
    const time = done ? task.effective_at ?? task.completed_at : task.scheduled_start
    return (
      <div key={task.id} ref={selectedId === task.id ? selectedRef : undefined} className={`rounded-xl border bg-[var(--surface)] p-3 ${selectedId === task.id ? 'border-[var(--wood)]' : 'border-[var(--line)]'}`}>
        <div className="flex items-start gap-3">
          <button disabled={busy} aria-label={`${task.title} ${done ? '완료 취소' : '완료'}`} aria-pressed={done}
            onClick={() => void update(() => done ? uncompleteTask(task.id) : completeTask(task.id))}
            className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-lg border disabled:opacity-50 ${done ? 'border-[var(--sprout)] bg-[var(--sprout)] text-[var(--on-wood)]' : 'border-[var(--line-strong)]'}`}>
            {done && <IconCheck size={16} />}
          </button>
          <div className="min-w-0 flex-1">
            <p className={`break-words text-[15px] leading-[22px] ${done ? 'text-[var(--ink-muted)] line-through' : 'text-[var(--ink)]'}`}>{task.title}</p>
            {time && <p className="mt-1 text-[13px] leading-[18px] tabular-nums text-[var(--ink-muted)]">{time.slice(11, 16)}{done ? ' 완료' : task.scheduled_end ? `–${task.scheduled_end.slice(11, 16)}` : ''}</p>}
            {task.memo && <p className="mt-2 whitespace-pre-wrap break-words text-[13px] text-[var(--ink-muted)]">{task.memo}</p>}
            <button onClick={() => { setMemoId(memoId === task.id ? null : task.id); setMemo(task.memo ?? '') }} className="mt-2 text-[12px] text-[var(--wood)]">{memoId === task.id ? '접기' : task.memo ? '메모 수정' : '메모 추가'}</button>
          </div>
        </div>
        <Collapse open={memoId === task.id} focusOnOpen>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); void update(async () => { await setTaskMemo(task.id, memo.trim()); setMemoId(null) }) }}>
            <input value={memoId === task.id ? memo : ''} onChange={(e) => setMemo(e.target.value)} aria-label="메모" className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 text-[14px]" />
            <PrimaryButton type="submit" disabled={busy} className="!h-8 !px-3 !text-[12px]">저장</PrimaryButton>
          </form>
        </Collapse>
      </div>
    )
  }

  const displayedIds = new Set([...(data?.todo ?? []), ...(data?.done ?? [])].map((task) => task.id))
  const otherScheduledTasks = contextTasks.filter((task) => !displayedIds.has(task.id))
  const generatedRoutineIds = new Set([...(data?.todo ?? []), ...(data?.done ?? [])].map((task) => task.routine_id))
  const pendingPreviews = previews.filter((preview) => !generatedRoutineIds.has(preview.routine_id))

  return (
    <dialog ref={dialogRef} aria-labelledby="calendar-day-tasks-title" className="calendar-day-dialog" onCancel={(e) => { e.preventDefault(); close() }}
      onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className={`calendar-day-sheet ${closing ? 'calendar-day-sheet-closing' : ''}`} style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}>
        <div className="touch-none border-b border-[var(--line)] px-5 pb-4 pt-3"
          onPointerDown={(e) => { if ((e.target as HTMLElement).closest('button')) return; dragStart.current = e.clientY; e.currentTarget.setPointerCapture(e.pointerId) }}
          onPointerMove={(e) => { if (dragStart.current !== null) setDrag(Math.max(0, e.clientY - dragStart.current)) }}
          onPointerUp={() => { dragStart.current = null; if (drag > 90) close(); setDrag(0) }}
          onPointerCancel={() => { dragStart.current = null; setDrag(0) }}>
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--line-strong)]" />
          <div className="flex items-center justify-between gap-2">
            <div><h2 id="calendar-day-tasks-title" className="text-[18px] font-semibold text-[var(--ink)]">{date?.replaceAll('-', '.')} 할 일</h2>
              {data && <p className="mt-1 text-[12px] text-[var(--ink-muted)]">할 일 {data.todo.length}개 · 완료 {data.done.length}개</p>}</div>
            <button onClick={close} aria-label="닫기" className="rounded-lg p-2 text-[var(--ink-muted)]"><IconX size={20} /></button>
          </div>
        </div>
        <div className="min-h-0 overflow-y-auto px-5 py-4">
          {error && <ErrorBanner message={error} />}
          {!data && !error && <p className="py-5 text-[13px] text-[var(--ink-muted)]">불러오는 중...</p>}
          {data && <div className="space-y-5">
            <section><h3 className="mb-2 text-[13px] font-semibold text-[var(--ink)]">할 일</h3><div className="space-y-2">{data.todo.map(taskRow)}</div>{!data.todo.length && <p className="text-[13px] text-[var(--ink-muted)]">등록된 할 일이 없어요.</p>}</section>
            <section><h3 className="mb-2 text-[13px] font-semibold text-[var(--ink)]">완료</h3><div className="space-y-2">{data.done.map(taskRow)}</div>{!data.done.length && <p className="text-[13px] text-[var(--ink-muted)]">완료한 일이 없어요.</p>}</section>
            {otherScheduledTasks.length > 0 && <section><h3 className="mb-2 text-[13px] font-semibold text-[var(--ink)]">이 날짜에 예정된 항목</h3><div className="space-y-2">{otherScheduledTasks.map(taskRow)}</div></section>}
            {pendingPreviews.length > 0 && <section><h3 className="mb-2 text-[13px] font-semibold text-[var(--ink)]">반복 일정 미리보기</h3><div className="space-y-2">{pendingPreviews.map((preview) => <div key={preview.routine_id} className="rounded-xl border border-dashed border-[var(--line-strong)] p-3"><p className="break-words text-[15px] leading-[22px] text-[var(--ink)]">{preview.title}</p>{preview.default_time && <p className="mt-1 text-[12px] text-[var(--ink-muted)]">{preview.default_time.slice(0, 5)}</p>}</div>)}</div></section>}
          </div>}
        </div>
        <form className="flex gap-2 border-t border-[var(--line)] px-5 py-4" onSubmit={(e) => { e.preventDefault(); if (date && title.trim()) void update(async () => { await createTask(title.trim(), date); setTitle('') }) }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="새 할 일" placeholder="새 할 일 추가" className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] px-3 text-[14px]" />
          <PrimaryButton type="submit" disabled={busy || !title.trim()}><IconPlus size={16} />추가</PrimaryButton>
        </form>
      </div>
    </dialog>
  )
}
