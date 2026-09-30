import { useDroppable } from '@dnd-kit/core'
import { useEffect, useRef, useState } from 'react'
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

const DEFAULT_DURATION_MIN = 30
const VISIBLE_HEIGHT = 480

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

function HourRow({ hour, disabled, isCurrentHour }: { hour: number; disabled: boolean; isCurrentHour: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: hourDroppableId(hour), disabled })
  return (
    <div
      ref={setNodeRef}
      className="relative border-t"
      // 드래그 중 드롭 대상 표시(isOver)가 우선이고, 현재 시간대 표시는 그게 없을 때만
      // 얹는다 — 둘 다 배경색이라 겹치면 드롭 피드백이 가려진다.
      style={{
        height: ROW_HEIGHT,
        borderColor: 'var(--border)',
        background: isOver ? 'var(--cherry-soft)' : !isOver && isCurrentHour ? 'var(--surface-muted)' : undefined,
      }}
    >
      <span
        className="absolute -top-2 left-0 pr-2 text-[11px]"
        style={{ background: 'var(--surface)', color: 'var(--text-faint)' }}
      >
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
  const now = new Date()
  const [currentMin, setCurrentMin] = useState(() => now.getHours() * 60 + now.getMinutes())

  useEffect(() => {
    scrollToCurrentHour(scrollRef.current)
  }, [])

  // 시간이 지나면(특히 정각을 넘기면) 반투명 표시와 현재 시각선이 같이 옮겨가야 하니
  // 1분마다, 탭이 다시 보일 때마다 갱신한다 — TodayPage의 날짜 갱신과 같은 패턴.
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
    // pt-2: 0시 줄의 시각 레이블이 -top-2로 줄 위쪽에 떠 있는데, 스크롤 컨테이너 맨 위라
    // 여백 없이는 그 위로 나갈 자리가 없어 잘려 보였다. 패딩으로 숨 쉴 자리를 준다.
    <div ref={scrollRef} className="overflow-y-auto pt-2" style={{ maxHeight: VISIBLE_HEIGHT }}>
      <div className="relative">
        {hours.map((h) => (
          <HourRow key={h} hour={h} disabled={view === 'actual'} isCurrentHour={h === currentHour} />
        ))}

        {/* 디자인 시스템 "주간 시간표" 규칙 — 현재 시각에 --cherry 가로선 */}
        {showCurrentLine && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-10"
            style={{ top: currentLineTop, height: 2, background: 'var(--cherry)' }}
          />
        )}

        {visible.map((task) => {
          const r = range(task, view)
          const layout = layoutByKey.get(task.id)
          if (!r || !layout) return null

          const top = ((r.startMin - START_HOUR * 60) / 60) * ROW_HEIGHT
          const height = Math.max(((r.endMin - r.startMin) / 60) * ROW_HEIGHT, 24)
          const style = {
            ...blockPositionStyle(top, height, layout.column, layout.columnCount, { gutter: 28, rightPad: 4 }),
            background: task.completed_at ? 'var(--done-soft)' : 'var(--cherry-soft)',
            color: task.completed_at ? 'var(--done)' : 'var(--cherry)',
          }

          // 예정 시간 없이 완료 시각으로만 표시되는 항목 — 실제 일정이 아니므로 해제 불가, 완료 표시만
          const isCompletionMarker = view === 'scheduled' && !task.scheduled_start

          if (view === 'actual' || isCompletionMarker) {
            return (
              <div
                key={task.id}
                className="absolute flex items-center gap-1 overflow-hidden rounded-[6px] px-2 py-1 text-left text-[11px] font-medium leading-tight"
                style={style}
              >
                {isCompletionMarker && <IconCheck size={11} stroke={2.5} className="flex-none" />}
                <span className="truncate">{task.title}</span>
              </div>
            )
          }

          return (
            <button
              key={task.id}
              onClick={() => onUnschedule(task)}
              className="absolute overflow-hidden rounded-[6px] px-2 py-1 text-left text-[11px] font-medium leading-tight"
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
