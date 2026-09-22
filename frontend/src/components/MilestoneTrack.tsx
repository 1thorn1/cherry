import { IconRollercoaster } from '@tabler/icons-react'

interface TrackMilestone {
  seq: number
  title: string
  completed: boolean
}

export default function MilestoneTrack({ milestones }: { milestones: TrackMilestone[] }) {
  if (milestones.length === 0) {
    return <p className="py-4 text-center text-xs text-neutral-400">마일스톤이 없어요</p>
  }

  const cartIndex = milestones.filter((m) => m.completed).length

  return (
    <div className="overflow-x-auto pt-5">
      <div className="relative" style={{ minWidth: milestones.length * 16 }}>
        <div
          className="absolute -top-5 flex flex-col items-center text-[var(--cherry)]"
          style={{ left: `${(cartIndex / milestones.length) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <IconRollercoaster size={16} stroke={1.75} />
        </div>
        <div className="flex gap-0.5">
          {milestones.map((m) => (
            <div
              key={m.seq}
              className="h-2 flex-1 rounded-sm"
              style={m.completed ? { background: 'var(--cherry)' } : { border: '1.5px dashed #D8D5CC' }}
              title={m.title}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
