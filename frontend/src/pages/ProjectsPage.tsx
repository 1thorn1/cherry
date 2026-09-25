import { useEffect, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { ProjectOverview } from '../types/project'
import { createProject, getProjectOverview, updateProjectStarred, type CreateProjectInput } from '../api/projects'
import { getChallengeProjectLinks } from '../api/challenges'
import type { ChallengeProjectLink } from '../types/challenge'
import ProjectListItem from '../components/ProjectListItem'

type Mode = 'FREE' | 'PROGRESS' | 'EXAM'

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<ProjectOverview | null>(null)
  const [challengeLinks, setChallengeLinks] = useState<ChallengeProjectLink[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
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

  // 프로젝트를 눌러도 바로 들어가지 않고 일단 "선택"만 되게 하고(테두리로 표시),
  // 선택된 걸 한 번 더 누르면 그때 상세 화면으로 들어간다 — 잘못 눌러서 바로
  // 넘어가버리는 걸 막아달라는 요청.
  //
  // 아직 참여 중인 같이 하기 프로젝트는 클릭하면 내 프로젝트 화면이 아니라 챌린지 상세
  // (다 같이 이름·진행도 보고 잠시 쉬기도 하는 곳)로 바로 들어간다 — 같이 하기 목록
  // 카드와 똑같은 동작. 내 프로젝트 화면은 카드의 "내 프로젝트" 배지로 간다.
  // 나간 방의 프로젝트는(link.left) 그냥 평범한 프로젝트처럼 내 프로젝트 화면으로 간다 —
  // 나간 챌린지는 더 이상 상세를 볼 수 없기 때문.
  function handleProjectClick(projectId: number) {
    if (selectedProjectId === projectId) {
      const link = challengeLinks.find((l) => l.project_id === projectId)
      navigate(link && !link.left ? `/challenges/${link.challenge_id}` : `/projects/${projectId}`)
    } else {
      setSelectedProjectId(projectId)
    }
  }

  async function handleToggleStar(e: MouseEvent, projectId: number, starred: boolean) {
    e.stopPropagation()
    try {
      await updateProjectStarred(projectId, !starred)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '즐겨찾기 설정에 실패했습니다')
    }
  }

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
    if (saving) return
    const trimmed = name.trim()
    if (!trimmed) {
      setError('프로젝트 이름을 입력해주세요')
      return
    }
    if (mode === 'PROGRESS' && !totalUnits.trim()) {
      setError('총 회차 수를 입력해주세요')
      return
    }
    if (mode === 'EXAM' && !examDate) {
      setError('시험일을 입력해주세요')
      return
    }

    setSaving(true)
    try {
      const input: CreateProjectInput = { name: trimmed }
      if (mode === 'PROGRESS') {
        input.type = 'PROGRESS'
        input.total_units = Number(totalUnits)
      } else if (mode === 'EXAM') {
        input.type = 'EXAM'
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
    { value: 'FREE', label: '자유형' },
    { value: 'PROGRESS', label: '회차별' },
    { value: 'EXAM', label: '시험일' },
  ]

  const isEmpty = overview && overview.others.length === 0
  const starredProjects = overview ? overview.others.filter((p) => p.starred) : []
  const restProjects = overview ? overview.others.filter((p) => !p.starred) : []

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
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="mb-3 w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
            />
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

      {starredProjects.length > 0 && (
        <div className="mb-8">
          <p className="mb-2 text-[11px] font-medium text-neutral-400">즐겨찾기</p>
          <div className="space-y-2">
            {starredProjects.map((p) => (
              <ProjectListItem
                key={p.project_id}
                project={p}
                selected={selectedProjectId === p.project_id}
                onClick={() => handleProjectClick(p.project_id)}
                onToggleStar={(e) => handleToggleStar(e, p.project_id, p.starred)}
                {...cardLinkProps(p.project_id, challengeLinks.find((l) => l.project_id === p.project_id))}
              />
            ))}
          </div>
        </div>
      )}

      {restProjects.length > 0 && (
        <div>
          {starredProjects.length > 0 && <p className="mb-2 text-[11px] font-medium text-neutral-400">프로젝트</p>}
          <div className="space-y-2">
            {restProjects.map((p) => (
              <ProjectListItem
                key={p.project_id}
                project={p}
                selected={selectedProjectId === p.project_id}
                onClick={() => handleProjectClick(p.project_id)}
                onToggleStar={(e) => handleToggleStar(e, p.project_id, p.starred)}
                {...cardLinkProps(p.project_id, challengeLinks.find((l) => l.project_id === p.project_id))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// 아직 참여 중인 같이 하기 프로젝트는 카드 클릭이 챌린지 상세로 가버리므로, 내 프로젝트
// 화면(마일스톤·메모)으로 갈 수 있는 배지를 대신 붙여준다. 라벨은 "내 프로젝트"가 아니라
// "같이하기"로 — 이 목록은 이미 전부 "내 프로젝트"라서 그 말은 정보가 없고, 이 카드가
// 같이 하기에 연결돼 있다는 게 실제로 알려주고 싶은 정보다. 나간 경우의 "지난 같이 하기"
// 태그와도 이름이 짝을 이룬다.
function cardLinkProps(projectId: number, link: ChallengeProjectLink | undefined) {
  if (!link) return {}
  if (link.left) return { tag: '지난 같이 하기' }
  return { secondaryLink: { to: `/projects/${projectId}`, label: '같이하기' } }
}
