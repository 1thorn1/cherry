import { useDroppable } from '@dnd-kit/core'
import type { Task } from '../types/task'
import { START_HOUR, END_HOUR, hourDroppableId, type TimetableView } from '../lib/timetable'

const ROW_HEIGHT = 40
const DEFAULT_DURATION_MIN = 30

function toMinutes(iso: string) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

function anchorTime(task: Task, view: TimetableView) {
  return view === 'scheduled' ? task.scheduled_start : task.effective_at ?? task.completed_at
}

function position(task: Task, view: TimetableView) {
  const anchor = anchorTime(task, view)
  if (!anchor) return null

  const startMin = toMinutes(anchor)
  const durationMin =
    task.scheduled_start && task.scheduled_end
      ? toMinutes(task.scheduled_end) - toMinutes(task.scheduled_start)
      : DEFAULT_DURATION_MIN

  const top = ((startMin - START_HOUR * 60) / 60) * ROW_HEIGHT
  const height = Math.max((durationMin / 60) * ROW_HEIGHT, 24)
  return { top, height }
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
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  const visible = tasks.filter((t) => anchorTime(t, view))

  return (
    <div className="relative">
      {hours.map((h) => (
        <HourRow key={h} hour={h} disabled={view === 'actual'} />
      ))}

      {visible.map((task) => {
        const pos = position(task, view)
        if (!pos) return null
        const isDone = !!task.completed_at
        const style = {
          top: pos.top,
          height: pos.height,
          background: isDone ? '#F1EFE8' : 'var(--cherry-bg)',
          color: isDone ? '#888780' : 'var(--cherry)',
        }

        if (view === 'actual') {
          return (
            <div
              key={task.id}
              className="absolute left-7 right-1 overflow-hidden rounded-md px-2 py-1 text-left text-[11px] leading-tight"
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
            className="absolute left-7 right-1 overflow-hidden rounded-md px-2 py-1 text-left text-[11px] leading-tight"
            style={style}
          >
            {task.title}
          </button>
        )
      })}
    </div>
  )
}
