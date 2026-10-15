import { useDroppable } from '@dnd-kit/core'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { IconCheck } from '@tabler/icons-react'
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
import { categoryOf } from '../lib/category'

const DEFAULT_DURATION_MIN = 30
const VISIBLE_HEIGHT = 420
const LABEL_GUTTER = 56

function toMinutes(iso: string) {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

function anchorTime(task: Task, view: TimetableView) {
  if (view === 'scheduled') {
    // 예정 시간이 없어도 완료는 했다면, 실제로 한 시각에 완료 표시로 보여준다
    return task.scheduled_start ?? (task.completed_at ? task.effective_at ?? task.completed_at : null)
  }
  return task.effective_at ?? task.completed_at
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

// "오전 9시" — 줄바꿈 금지라 짧게
function hourLabel(h: number) {
  return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}시`
}

function HourRow({ hour, disabled }: { hour: number; disabled: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: hourDroppableId(hour), disabled })
  return (
    <div
      ref={setNodeRef}
      className="relative border-t border-[var(--line)] transition-colors"
      // 할 일 카드를 끌어다 놓을 수 있는 칸 — 올려놓은 동안만 wood-soft로 표시
      style={{ height: ROW_HEIGHT, background: isOver ? 'var(--wood-soft)' : undefined }}
    >
      <span className="absolute -top-2 left-0 whitespace-nowrap bg-[var(--surface)] pr-2 text-[11px] leading-4 text-[var(--ink-muted)]">
        {hourLabel(hour)}
      </span>
    </div>
  )
}

interface Props {
  tasks: Task[]
  view: TimetableView
  onUnschedule: (task: Task) => void
  rewardFor?: (task: Task) => number
  fitViewport?: boolean
}

export default function Timetable({ tasks, view, onUnschedule, rewardFor, fitViewport = false }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [viewportHeight, setViewportHeight] = useState(VISIBLE_HEIGHT)
  useLayoutEffect(() => {
    if (!fitViewport) return
    function resize() {
      const el = scrollRef.current
      if (!el || el.getClientRects().length === 0) return
      // 카드 아래 여백과 바깥 테두리까지 첫 화면 안에 들어오도록 맞춘다.
      const top = el.getBoundingClientRect().top + window.scrollY
      setViewportHeight(Math.max(160, Math.floor(window.innerHeight - top - 48)))
    }
    resize()
    window.addEventListener('resize', resize)
    const observer = new ResizeObserver(resize)
    const page = scrollRef.current?.closest('aside')?.parentElement?.parentElement
    if (page) observer.observe(page)
    return () => {
      window.removeEventListener('resize', resize)
      observer.disconnect()
    }
  }, [fitViewport])
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)
  const visible = tasks.filter((t) => anchorTime(t, view))
  const [currentMin, setCurrentMin] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })

  useEffect(() => {
    scrollToCurrentHour(scrollRef.current)
  }, [])

  // 시간이 지나면 현재 시각선이 같이 옮겨가야 하니 1분마다, 탭이 다시 보일 때마다 갱신한다
  useEffect(() => {
    function sync() {
      const d = new Date()
      setCurrentMin(d.getHours() * 60 + d.getMinutes())
    }
    const id = setInterval(sync, 60_000)
    document.addEventListener('visibilitychange', sync)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [])

  const currentHour = Math.floor(currentMin / 60)
  const currentLineTop = ((currentMin - START_HOUR * 60) / 60) * ROW_HEIGHT
  const showCurrentLine = currentHour >= START_HOUR && currentHour <= END_HOUR

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
    // pt-2: 맨 위 시간 라벨이 -top-2로 줄 위에 떠 있어서 여백 없이는 잘린다
    <div ref={scrollRef} className="overflow-y-auto pt-2" style={fitViewport ? { height: viewportHeight } : { maxHeight: VISIBLE_HEIGHT }}>
      <div className="relative">
        {hours.map((h) => (
          <HourRow key={h} hour={h} disabled={view === 'actual'} />
        ))}

        {/* 현재 시각 — barn 2px 선 + 점 */}
        {showCurrentLine && (
          <div
            className="pointer-events-none absolute right-0 z-10"
            style={{ top: currentLineTop - 1, left: LABEL_GUTTER - 4 }}
          >
            <div className="h-[2px] bg-[var(--barn)]" />
            <div className="absolute -left-[5px] -top-[4px] h-2.5 w-2.5 rounded-full bg-[var(--barn)]" />
          </div>
        )}

        {visible.map((task) => {
          const r = range(task, view)
          const layout = layoutByKey.get(task.id)
          if (!r || !layout) return null

          const top = ((r.startMin - START_HOUR * 60) / 60) * ROW_HEIGHT + 2
          const height = Math.max(((r.endMin - r.startMin) / 60) * ROW_HEIGHT - 4, 24)
          const cat = categoryOf(task)
          const done = task.completed_at !== null
          const style = {
            ...blockPositionStyle(top, height, layout.column, layout.columnCount, { gutter: LABEL_GUTTER, rightPad: 0, gap: 4 }),
            background: cat.soft,
            opacity: done && view === 'scheduled' ? 0.6 : 1,
          }

          // 예정 시간 없이 완료 시각으로만 표시되는 항목 — 실제 일정이 아니므로 해제 불가, 완료 표시만
          const isCompletionMarker = view === 'scheduled' && !task.scheduled_start
          const reward = rewardFor?.(task)

          const content = (
            <>
              <span className={`flex items-center gap-1.5 text-[12px] font-medium leading-4 text-[var(--ink)] ${done ? 'line-through' : ''}`}>
                {isCompletionMarker ? (
                  <IconCheck size={11} stroke={2.5} className="flex-none text-[var(--sprout)]" />
                ) : (
                  <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: cat.dot }} />
                )}
                <span className="truncate">{task.title}</span>
              </span>
              {reward !== undefined && height >= 36 && (
                <span className="mt-0.5 block text-[11px] font-medium leading-4 text-[var(--coin-ink)]">+{reward}</span>
              )}
            </>
          )

          if (view === 'actual' || isCompletionMarker || done) {
            return (
              <div key={task.id} className="absolute overflow-hidden rounded-[8px] px-2 py-1 text-left" style={style}>
                {content}
              </div>
            )
          }

          return (
            <button
              key={task.id}
              onClick={() => onUnschedule(task)}
              title="누르면 시간 배정을 풀어요"
              className="absolute overflow-hidden rounded-[8px] px-2 py-1 text-left transition-opacity hover:opacity-80"
              style={style}
            >
              {content}
            </button>
          )
        })}
      </div>
    </div>
  )
}
