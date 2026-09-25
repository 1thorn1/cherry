import { useEffect, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createChallenge, getChallengeProjectLinks, joinChallenge, type CreateChallengeInput } from '../api/challenges'
import { getProjectOverview, updateProjectStarred } from '../api/projects'
import type { ChallengeProjectLink } from '../types/challenge'
import type { ProjectOverview } from '../types/project'
import ProjectListItem from '../components/ProjectListItem'

type Mode = 'FREE' | 'PROGRESS' | 'EXAM'

export default function ChallengesPage() {
  const navigate = useNavigate()
  // 같이 하기 목록도 프로젝트 목록과 같은 데이터(내 프로젝트 전체 + 챌린지 연결 정보)에서
  // "챌린지에 연결된 것만" 걸러서 보여준다 — 두 화면이 서로 다른 API를 따로 불러서
  // 카드 모양도, 진행률 표시도 다 달랐던 게 "연동이 안 된" 느낌의 원인이었다.
  const [overview, setOverview] = useState<ProjectOverview | null>(null)
  const [challengeLinks, setChallengeLinks] = useState<ChallengeProjectLink[]>([])
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState<Mode>('FREE')
  const [totalUnits, setTotalUnits] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [selectedChallengeId, setSelectedChallengeId] = useState<number | null>(null)

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

  function handleChallengeClick(id: number) {
    if (selectedChallengeId === id) {
      navigate(`/challenges/${id}`)
    } else {
      setSelectedChallengeId(id)
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

  async function handleCreate() {
    if (saving) return
    const trimmed = title.trim()
    if (!trimmed) {
      setError('방 이름을 입력해주세요')
      return
    }
    if (mode === 'PROGRESS' && !totalUnits.trim()) {
      setError('총 회차 수를 입력해주세요')
      return
    }
    if (mode === 'EXAM' && !targetDate) {
      setError('시험일을 입력해주세요')
      return
    }

    setSaving(true)
    try {
      const input: CreateChallengeInput = { title: trimmed }
      if (mode === 'PROGRESS') {
        input.type = 'PROGRESS'
        input.total_units = Number(totalUnits)
      } else if (mode === 'EXAM') {
        input.type = 'EXAM'
        input.target_date = targetDate
      }
      const created = await createChallenge(input)
      setTitle('')
      setTotalUnits('')
      setTargetDate('')
      setMode('FREE')
      navigate(`/challenges/${created.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '만들지 못했습니다')
    } finally {
      setSaving(false)
    }
  }

  async function handleJoin() {
    const trimmed = inviteCode.trim()
    if (!trimmed || joining) return

    setJoining(true)
    try {
      const joined = await joinChallenge(trimmed)
      setInviteCode('')
      navigate(`/challenges/${joined.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '참여하지 못했습니다')
    } finally {
      setJoining(false)
    }
  }

  const modeOptions: { value: Mode; label: string }[] = [
    { value: 'FREE', label: '자유형' },
    { value: 'PROGRESS', label: '회차별' },
    { value: 'EXAM', label: '시험일' },
  ]

  const challengeProjects = overview
    ? challengeLinks
        .map((link) => {
          const project = overview.others.find((p) => p.project_id === link.project_id)
          return project ? { project, link } : null
        })
        .filter((entry): entry is { project: (typeof overview.others)[number]; link: ChallengeProjectLink } => entry !== null)
    : []

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
      <Link to="/projects" className="text-xs text-neutral-400">← 프로젝트</Link>
      <h1 className="mb-6 mt-2 text-xl font-medium tracking-tight">같이 하기</h1>

      <div className="mb-6 rounded-lg border border-neutral-200 p-4">
        <p className="mb-3 text-xs text-neutral-400">초대 코드로 참여</p>
        <div className="flex gap-2">
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="초대 코드 입력"
            className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm"
          />
          <button
            onClick={handleJoin}
            disabled={joining}
            className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: 'var(--cherry)' }}
          >
            참여
          </button>
        </div>
      </div>

      <div className="mb-8 rounded-lg border border-neutral-200 p-4">
        <p className="mb-3 text-xs text-neutral-400">방 만들기</p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="방 이름 (예: 오픽 스터디)"
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
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="mb-3 w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
          />
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

      {!overview && !error && (
        <p className="py-8 text-center text-xs text-neutral-400">불러오는 중...</p>
      )}

      {overview && challengeProjects.length === 0 && (
        <p className="py-8 text-center text-xs text-neutral-400">아직 참여 중인 방이 없어요</p>
      )}

      {challengeProjects.length > 0 && (
        <div className="space-y-2">
          {challengeProjects.map(({ project: p, link }) => (
            <ProjectListItem
              key={p.project_id}
              project={p}
              selected={selectedChallengeId === link.challenge_id}
              onClick={() => handleChallengeClick(link.challenge_id)}
              onToggleStar={(e) => handleToggleStar(e, p.project_id, p.starred)}
              secondaryLink={{ to: `/projects/${p.project_id}`, label: '내 프로젝트' }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
