import type { Task } from '../types/task'

const START_HOUR = 8
const END_HOUR = 20
const ROW_HEIGHT = 40

function toMinutes(iso: string) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

function position(task: Task) {
  if (!task.scheduled_start) return null
  const startMin = toMinutes(task.scheduled_start)
  const endMin = task.scheduled_end ? toMinutes(task.scheduled_end) : startMin + 30
  const top = ((startMin - START_HOUR * 60) / 60) * ROW_HEIGHT
  const height = Math.max(((endMin - startMin) / 60) * ROW_HEIGHT, 24)
  return { top, height }
}

interface Props {
  tasks: Task[]
  onUnschedule: (task: Task) => void
}

export default function Timetable({ tasks, onUnschedule }: Props) {
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  const scheduled = tasks.filter((t) => t.scheduled_start)

  return (
    <div className="relative">
      {hours.map((h) => (
        <div key={h} className="relative border-t border-neutral-100" style={{ height: ROW_HEIGHT }}>
          <span className="absolute -top-2 left-0 bg-white pr-2 text-[10px] text-neutral-400">
            {h}
          </span>
        </div>
      ))}

      {scheduled.map((task) => {
        const pos = position(task)
        if (!pos) return null
        const isDone = !!task.completed_at
        return (
          <button
            key={task.id}
            onClick={() => onUnschedule(task)}
            className="absolute left-7 right-1 overflow-hidden rounded-md px-2 py-1 text-left text-[11px] leading-tight"
            style={{
              top: pos.top,
              height: pos.height,
              background: isDone ? '#F1EFE8' : 'var(--cherry-bg)',
              color: isDone ? '#888780' : 'var(--cherry)',
            }}
          >
            {task.title}
          </button>
        )
      })}
    </div>
  )
}
