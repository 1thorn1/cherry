import { useDroppable } from '@dnd-kit/core'
import { useEffect, useRef } from 'react'
import type { Task } from '../types/task'
import {
  START_HOUR,
  END_HOUR,
  ROW_HEIGHT,
  hourDroppableId,
  layoutOverlaps,
  blockPositionStyle,
  scrollToCurrentHour,
  type TimetableView,
} from '../lib/timetable'

const DEFAULT_DURATION_MIN = 30
const VISIBLE_HEIGHT = 480

function toMinutes(iso: string) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

function anchorTime(task: Task, view: TimetableView) {
  return view === 'scheduled' ? task.scheduled_start : task.effective_at ?? task.completed_at
}

function range(task: Task, view: TimetableView) {
  const anchor = anchorTime(task, view)
  if (!anchor) return null

  const startMin = toMinutes(anchor)
  const durationMin =
    task.scheduled_start && task.scheduled_end
      ? toMinutes(task.scheduled_end) - toMinutes(task.scheduled_start)
      : DEFAULT_DURATION_MIN

  return { startMin, endMin: startMin + Math.max(durationMin, 20) }
}

function HourRow({ hour, disabled }: { hour: number; disabled: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: hourDroppableId(hour), disabled })
  return (
    <div
      ref={setNodeRef}
      className={`relative border-t border-neutral-100 ${isOver ? 'bg-[var(--cherry-bg)]' : ''}`}
      style={{ height: ROW_HEIGHT }}
    >
      <span className="absolute -top-2 left-0 bg-white pr-2 text-[10px] text-neutral-400">
        {hour}
      </span>
    </div>
  )
}

interface Props {
  tasks: Task[]
  view: TimetableView
  onUnschedule: (task: Task) => void
}

export default function Timetable({ tasks, view, onUnschedule }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  const visible = tasks.filter((t) => anchorTime(t, view))

  useEffect(() => {
    scrollToCurrentHour(scrollRef.current)
  }, [])

  const layouts = layoutOverlaps(
    visible
      .map((t) => {
        const r = range(t, view)
        return r ? { key: t.id, ...r } : null
      })
      .filter((b): b is { key: number; startMin: number; endMin: number } => b !== null),
  )
  const layoutByKey = new Map(layouts.map((l) => [l.key, l]))

  return (
    <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: VISIBLE_HEIGHT }}>
      <div className="relative">
        {hours.map((h) => (
          <HourRow key={h} hour={h} disabled={view === 'actual'} />
        ))}

        {visible.map((task) => {
          const r = range(task, view)
          const layout = layoutByKey.get(task.id)
          if (!r || !layout) return null

          const top = ((r.startMin - START_HOUR * 60) / 60) * ROW_HEIGHT
          const height = Math.max(((r.endMin - r.startMin) / 60) * ROW_HEIGHT, 24)
          const style = {
            ...blockPositionStyle(top, height, layout.column, layout.columnCount, { gutter: 28, rightPad: 4 }),
            background: task.completed_at ? '#F1EFE8' : 'var(--cherry-bg)',
            color: task.completed_at ? '#888780' : 'var(--cherry)',
          }

          if (view === 'actual') {
            return (
              <div
                key={task.id}
                className="absolute overflow-hidden rounded-md px-2 py-1 text-left text-[11px] leading-tight"
                style={style}
              >
                {task.title}
              </div>
            )
          }

          return (
            <button
              key={task.id}
              onClick={() => onUnschedule(task)}
              className="absolute overflow-hidden rounded-md px-2 py-1 text-left text-[11px] leading-tight"
              style={style}
            >
              {task.title}
            </button>
          )
        })}
      </div>
    </div>
  )
}
