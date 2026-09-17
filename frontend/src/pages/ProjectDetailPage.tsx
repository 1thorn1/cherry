import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { ProjectDetail } from '../types/project'
import { completeMilestone, getProject } from '../api/projects'

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [detail, setDetail] = useState<ProjectDetail | null>(null)
  const [error, setError] = useState('')

  async function load() {
    try {
      setDetail(await getProject(Number(id)))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => { load() }, [id])

  async function handleComplete(milestoneId: number) {
    await completeMilestone(milestoneId)
    load()
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
        <p className="text-xs text-red-600">{error}</p>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
        <p className="text-xs text-neutral-400">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
      <Link to="/projects" className="text-xs text-neutral-400">← 프로젝트</Link>
      <h1 className="mb-6 mt-2 text-xl font-medium tracking-tight">{detail.project.name}</h1>

      {detail.milestones.length === 0 && (
        <p className="py-8 text-center text-xs text-neutral-400">마일스톤이 없어요</p>
      )}

      {detail.milestones.map((milestone) => (
        <div key={milestone.id} className="flex items-center gap-3 border-b border-neutral-100 py-3">
          <button
            onClick={() => handleComplete(milestone.id)}
            disabled={milestone.completed}
            className="flex h-4 w-4 flex-none items-center justify-center rounded border-[1.5px] border-neutral-300 text-[10px] text-white disabled:border-none"
            style={milestone.completed ? { background: 'var(--cherry)' } : undefined}
            aria-label="마일스톤 완료"
          >
            {milestone.completed ? '✓' : ''}
          </button>
          <span className={`flex-1 text-sm ${milestone.completed ? 'text-neutral-400 line-through' : ''}`}>
            {milestone.title}
          </span>
          {milestone.target_week && (
            <span className="text-[11px] text-neutral-300">{milestone.target_week}</span>
          )}
        </div>
      ))}
    </div>
  )
}
