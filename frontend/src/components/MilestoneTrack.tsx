import RunningDog from './RunningDog'
import { usePersistedState } from '../lib/persistedState'

interface TrackMilestone {
  seq: number
  title: string
  completed: boolean
}

export default function MilestoneTrack({ milestones }: { milestones: TrackMilestone[] }) {
  const [animal, setAnimal] = usePersistedState<'dog' | 'cat'>('project.progressAnimal', 'dog')
  if (milestones.length === 0) {
    return <p className="py-4 text-center text-xs text-[var(--ink-muted)]">마일스톤이 없어요</p>
  }

  const completedCount = milestones.filter((m) => m.completed).length
  const progress = completedCount / milestones.length

  return (
    <div>
      <div className="mb-1 flex justify-end gap-1" role="group" aria-label="진행 표시 동물 선택">
        {([{ value: 'dog', label: '강아지' }, { value: 'cat', label: '고양이' }] as const).map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={animal === option.value}
            onClick={() => setAnimal(option.value)}
            className={`rounded-md px-2 py-1 text-[11px] transition-colors ${animal === option.value ? 'bg-[var(--sprout-soft)] font-medium text-[var(--sprout)]' : 'text-[var(--ink-muted)] hover:bg-[var(--surface-sunken)]'}`}
          >{option.label}</button>
        ))}
      </div>
      <div className="milestone-track overflow-x-auto" role="progressbar" aria-label="프로젝트 진행률" aria-valuemin={0} aria-valuemax={milestones.length} aria-valuenow={completedCount} aria-valuetext={`${milestones.length}개 중 ${completedCount}개 완료`}>
        <div className="milestone-track-inner" style={{ minWidth: Math.max(40, milestones.length * 12) }}>
          <div className="relative">
            <div className="milestone-dog-rail" aria-hidden="true">
              <div
                className="milestone-dog-marker absolute flex items-center"
                style={{ left: `${progress * 100}%`, transform: 'translateX(-50%)' }}
              >
                <RunningDog responsive animal={animal === 'cat' ? 'cat' : 'dog'} />
              </div>
            </div>
            <div className="flex gap-1">
              {milestones.map((m) => (
                <div
                  key={m.seq}
                  className="h-3 min-w-0 flex-1 rounded-sm border transition-colors duration-300"
                  style={{
                    background: m.completed ? 'var(--sprout)' : 'var(--sprout-soft)',
                    borderColor: m.completed ? 'var(--sprout)' : 'var(--line)',
                  }}
                  title={`${m.title} · ${m.completed ? '완료' : '미완료'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    <p className="mt-2 text-[11px] text-[var(--ink-muted)]">{completedCount} / {milestones.length}개 완료</p>
    </div>
  )
}
