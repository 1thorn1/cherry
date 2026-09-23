import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProjectOverview } from '../types/project'
import { createProject, getProjectOverview, type CreateProjectInput } from '../api/projects'
import { getChallengeProjectLinks } from '../api/challenges'
import type { ChallengeProjectLink } from '../types/challenge'
import MilestoneTrack from '../components/MilestoneTrack'

type Mode = 'FREE' | 'PROGRESS' | 'EXAM'

const LANE_PALETTE = ['#4C8BF5', '#8B6FD4', '#4E8B6B', '#3B7EA1', '#D4537E', '#C97A3D']
const GRID_DAYS = 42 // 6주

function daysBetween(from: string, to: string) {
  return Math.round((new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000)
}

export default function ProjectsPage() {
  const [overview, setOverview] = useState<ProjectOverview | null>(null)
  const [challengeLinks, setChallengeLinks] = useState<ChallengeProjectLink[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [name, setName] = useState('')
  const [mode, setMode] = useState<Mode>('FREE')
  const [totalUnits, setTotalUnits] = useState('')
  const [examDate, setExamDate] = useState('')
  const [milestoneTitles, setMilestoneTitles] = useState<string[]>([])
  const [milestoneDraft, setMilestoneDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      const [projectOverview, links] = await Promise.all([getProjectOverview(), getChallengeProjectLinks()])
      setOverview(projectOverview)
      setChallengeLinks(links)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => { load() }, [])

  function handleAddMilestoneDraft() {
    const trimmed = milestoneDraft.trim()
    if (!trimmed) return
    setMilestoneTitles((prev) => [...prev, trimmed])
    setMilestoneDraft('')
  }

  function handleRemoveMilestoneDraft(index: number) {
    setMilestoneTitles((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleCreate() {
    const trimmed = name.trim()
    if (!trimmed || saving) return

    setSaving(true)
    try {
      const input: CreateProjectInput = { name: trimmed }
      if (mode === 'PROGRESS') {
        input.type = 'PROGRESS'
        input.total_units = Number(totalUnits)
      } else if (mode === 'EXAM') {
        input.type = 'EXAM'
        input.total_units = Number(totalUnits)
        input.exam_date = examDate
      } else if (milestoneTitles.length > 0) {
        input.milestone_titles = milestoneTitles
      }
      await createProject(input)
      setName('')
      setTotalUnits('')
      setExamDate('')
      setMilestoneTitles([])
      setMilestoneDraft('')
      setMode('FREE')
      setShowCreateForm(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '만들지 못했습니다')
    } finally {
      setSaving(false)
    }
  }

  const modeOptions: { value: Mode; label: string }[] = [
    { value: 'FREE', label: '자유롭게' },
    { value: 'PROGRESS', label: '회차가 있어요' },
    { value: 'EXAM', label: '시험일이 있어요' },
  ]

  const isEmpty = overview && !overview.focus && overview.others.length === 0

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-medium tracking-tight">공사 중인 것들</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowCreateForm((v) => !v)} className="text-xs font-medium" style={{ color: 'var(--cherry)' }}>
            {showCreateForm ? '닫기' : '+ 새 프로젝트'}
          </button>
          <Link to="/challenges" className="text-xs text-neutral-400">같이 하기</Link>
          <Link to="/search" className="text-xs text-neutral-400">검색</Link>
        </div>
      </div>

      {showCreateForm && (
        <div className="mb-8 rounded-lg border border-neutral-200 p-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="프로젝트 이름"
            className="mb-3 w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
          />

          <div className="mb-3 flex gap-1 rounded-lg bg-neutral-100 p-1">
            {modeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className={`flex-1 rounded-md py-2 text-xs font-medium ${mode === opt.value ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {mode === 'PROGRESS' && (
            <input
              type="number"
              value={totalUnits}
              onChange={(e) => setTotalUnits(e.target.value)}
              placeholder="총 회차 수 (예: 20)"
              className="mb-3 w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
          )}

          {mode === 'EXAM' && (
            <div className="mb-3 flex gap-2">
              <input
                type="number"
                value={totalUnits}
                onChange={(e) => setTotalUnits(e.target.value)}
                placeholder="단원 수"
                className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            </div>
          )}

          {mode === 'FREE' && (
            <div className="mb-3">
              {milestoneTitles.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {milestoneTitles.map((title, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600"
                    >
                      <span>{i + 1}. {title}</span>
                      <button onClick={() => handleRemoveMilestoneDraft(i)} className="text-neutral-400">✕</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input
                  value={milestoneDraft}
                  onChange={(e) => setMilestoneDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddMilestoneDraft()
                    }
                  }}
                  placeholder="마일스톤 (선택, 예: 1구간 - 기획)"
                  className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
                />
                <button
                  onClick={handleAddMilestoneDraft}
                  className="rounded-lg border border-neutral-200 px-3 text-xs font-medium text-neutral-500"
                >
                  추가
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-neutral-300">비워두면 마일스톤 없이 생성돼요. 나중에 프로젝트 화면에서 추가할 수 있어요</p>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--cherry)' }}
          >
            만들기
          </button>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</p>
      )}

      {!overview && !error && (
        <p className="py-8 text-center text-xs text-neutral-400">불러오는 중...</p>
      )}

      {isEmpty && (
        <p className="py-8 text-center text-xs text-neutral-400">아직 프로젝트가 없어요</p>
      )}

      {overview && overview.overlap_warning && (
        <div className="mb-6 rounded-lg px-4 py-3 text-xs" style={{ background: 'var(--cherry-bg)', color: 'var(--cherry)' }}>
          {overview.overlap_warning}
        </div>
      )}

      {overview && overview.lanes.length > 0 && (
        <div className="mb-8">
          <div className="mb-2 grid grid-cols-6 gap-1">
            {overview.weeks.map((w) => (
              <p key={w} className="text-[10px] text-neutral-400">{w.slice(5).replace('-', '/')}</p>
            ))}
          </div>
          <div className="relative space-y-2">
            <div
              className="pointer-events-none absolute inset-y-0 w-px bg-neutral-300"
              style={{ left: `${(daysBetween(overview.weeks[0], new Date().toISOString().slice(0, 10)) / GRID_DAYS) * 100}%` }}
            />
            {overview.lanes.map((lane, i) => {
              const start = Math.min(Math.max(daysBetween(overview.weeks[0], lane.start_date), 0), GRID_DAYS)
              const end = lane.open_ended || !lane.end_date
                ? GRID_DAYS
                : Math.min(Math.max(daysBetween(overview.weeks[0], lane.end_date), 0), GRID_DAYS)
              const left = (start / GRID_DAYS) * 100
              const width = Math.max(((end - start) / GRID_DAYS) * 100, 2)
              return (
                <div key={lane.project_id} className="relative h-2">
                  <div
                    className="absolute h-2 rounded-full"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      background: LANE_PALETTE[i % LANE_PALETTE.length],
                      opacity: lane.open_ended ? 0.5 : 1,
                    }}
                    title={lane.name}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {overview && overview.focus && (
        <div className="mb-8 rounded-lg border border-neutral-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <Link to={`/projects/${overview.focus.project_id}`} className="text-sm font-medium">
              {overview.focus.name}
            </Link>
            {challengeLinks.find((l) => l.project_id === overview.focus!.project_id) && (
              <Link
                to={`/challenges/${challengeLinks.find((l) => l.project_id === overview.focus!.project_id)!.challenge_id}`}
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: 'var(--cherry-bg)', color: 'var(--cherry)' }}
              >
                같이 하기
              </Link>
            )}
          </div>

          <MilestoneTrack milestones={overview.focus.milestones} />
        </div>
      )}

      {overview && overview.others.map((p) => {
        const link = challengeLinks.find((l) => l.project_id === p.project_id)
        return (
          <div key={p.project_id} className="border-b border-neutral-100 py-3">
            <div className="mb-1.5 flex items-center justify-between">
              <Link to={`/projects/${p.project_id}`} className="text-sm">{p.name}</Link>
              <div className="flex items-center gap-2">
                {link && (
                  <Link
                    to={`/challenges/${link.challenge_id}`}
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: 'var(--cherry-bg)', color: 'var(--cherry)' }}
                  >
                    같이 하기
                  </Link>
                )}
                <span className="text-[11px] text-neutral-400">{p.key_metric}</span>
              </div>
            </div>
            {p.total_milestones > 0 && (
              p.total_milestones <= 20 ? (
                <div className="flex gap-1">
                  {Array.from({ length: p.total_milestones }).map((_, i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: i < p.completed_milestones ? 'var(--cherry)' : '#E5E5E5' }}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(p.completed_milestones / p.total_milestones) * 100}%`, background: 'var(--cherry)' }}
                  />
                </div>
              )
            )}
          </div>
        )
      })}
    </div>
  )
}
