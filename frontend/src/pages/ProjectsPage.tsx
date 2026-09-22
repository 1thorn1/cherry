import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Project } from '../types/project'
import { createProject, getProjects, type CreateProjectInput } from '../api/projects'
import { getChallengeProjectLinks } from '../api/challenges'
import type { ChallengeProjectLink } from '../types/challenge'

type Mode = 'FREE' | 'PROGRESS' | 'EXAM'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [challengeLinks, setChallengeLinks] = useState<ChallengeProjectLink[]>([])
  const [name, setName] = useState('')
  const [mode, setMode] = useState<Mode>('FREE')
  const [totalUnits, setTotalUnits] = useState('')
  const [examDate, setExamDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      const [projectList, links] = await Promise.all([getProjects(), getChallengeProjectLinks()])
      setProjects(projectList)
      setChallengeLinks(links)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => { load() }, [])

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
      }
      await createProject(input)
      setName('')
      setTotalUnits('')
      setExamDate('')
      setMode('FREE')
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

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-medium tracking-tight">공사 중인 것들</h1>
        <div className="flex items-center gap-3">
          <Link to="/challenges" className="text-xs text-neutral-400">같이 하기</Link>
          <Link to="/search" className="text-xs text-neutral-400">검색</Link>
        </div>
      </div>

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

        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--cherry)' }}
        >
          만들기
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</p>
      )}

      {projects.length === 0 && (
        <p className="py-8 text-center text-xs text-neutral-400">아직 프로젝트가 없어요</p>
      )}

      {projects.map((project) => {
        const challengeLink = challengeLinks.find((l) => l.project_id === project.id)
        return (
          <div key={project.id} className="flex items-center justify-between border-b border-neutral-100 py-3 text-sm">
            <Link to={`/projects/${project.id}`} className="flex-1">{project.name}</Link>
            <div className="flex items-center gap-2">
              {challengeLink && (
                <Link
                  to={`/challenges/${challengeLink.challenge_id}`}
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: 'var(--cherry-bg)', color: 'var(--cherry)' }}
                >
                  같이 하기
                </Link>
              )}
              <span className="text-[11px] text-neutral-400">
                {project.type === 'PROGRESS' && `${project.total_units}강`}
                {project.type === 'EXAM' && `D-day ${project.exam_date}`}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
