import Collapse from '../components/Collapse'
import { addDays, format } from 'date-fns'
import { useEffect, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconFolderPlus, IconPlus } from '@tabler/icons-react'
import type { ProjectOverview } from '../types/project'
import { createProject, getProjectOverview, updateProjectStarred, type CreateProjectInput } from '../api/projects'
import { getChallengeProjectLinks } from '../api/challenges'
import type { ChallengeProjectLink } from '../types/challenge'
import ProjectListItem from '../components/ProjectListItem'
import { Card, EmptyState, ErrorBanner, PageHeader, PrimaryButton, Segment } from '../components/ui'

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
      <PageHeader
        crumb="프로젝트"
        title="프로젝트"
        subtitle="프로젝트 단위로 할 일을 묶고, 끝낸 만큼 농장 자금을 모아요."
        action={
          <PrimaryButton onClick={() => setShowCreateForm((v) => !v)}>
            <IconPlus size={17} stroke={2} />
            {showCreateForm ? '닫기' : '새 프로젝트'}
          </PrimaryButton>
        }
      />

      <div className="mb-6 flex gap-3 text-[13px]">
        <Link to="/challenges" className="font-medium text-[var(--wood)] hover:underline">같이 하기</Link>
        <Link to="/search" className="text-[var(--ink-muted)] hover:text-[var(--ink)] hover:underline">검색</Link>
      </div>

      <Collapse open={showCreateForm}>
        <Card className="mb-8 p-4 sm:p-5">
          <form onSubmit={(e) => { e.preventDefault(); handleCreate() }}>
          <h2 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-[var(--ink)]">
            <IconFolderPlus size={19} stroke={1.8} /> 새 프로젝트 만들기
          </h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="프로젝트 이름"
            className="mb-3 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--line-strong)] focus:ring-2 focus:ring-[var(--wood-soft)]"
          />

          <div className="mb-3">
            <Segment options={modeOptions} value={mode} onChange={setMode} label="프로젝트 방식" full />
          </div>

          <Collapse open={mode === 'PROGRESS'}>
            <input
              type="number"
              value={totalUnits}
              onChange={(e) => setTotalUnits(e.target.value)}
              placeholder="총 회차 수 (예: 20)"
              className="mb-3 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--line-strong)] focus:ring-2 focus:ring-[var(--wood-soft)]"
            />
          </Collapse>

          <Collapse open={mode === 'EXAM'}>
            <input
              type="date"
              min={format(new Date(), 'yyyy-MM-dd')}
              max={format(addDays(new Date(), 180), 'yyyy-MM-dd')}
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="mb-3 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[15px] text-[var(--ink)] outline-none focus:border-[var(--line-strong)] focus:ring-2 focus:ring-[var(--wood-soft)]"
            />
          </Collapse>

          <Collapse open={mode === 'FREE'}>
            <div className="mb-3">
              {milestoneTitles.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {milestoneTitles.map((title, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-[var(--surface-sunken)] px-3 py-1.5 text-xs text-[var(--ink-soft)]"
                    >
                      <span>{i + 1}. {title}</span>
                      <button onClick={() => handleRemoveMilestoneDraft(i)} className="text-[var(--ink-muted)]" aria-label={`${title} 삭제`}>✕</button>
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
                  className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[15px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] focus:border-[var(--line-strong)] focus:ring-2 focus:ring-[var(--wood-soft)]"
                />
                <button
                  onClick={handleAddMilestoneDraft}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink)]"
                >
                  추가
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--ink-muted)]">비워두면 마일스톤 없이 생성돼요. 나중에 프로젝트 화면에서 추가할 수 있어요.</p>
            </div>
          </Collapse>

          <PrimaryButton type="submit" disabled={saving} className="btn-3d w-full">
            {saving ? '만드는 중…' : '프로젝트 만들기'}
          </PrimaryButton>
          </form>
        </Card>
      </Collapse>

      {error && <ErrorBanner message={error} />}

      {!overview && !error && (
        <p className="py-8 text-center text-xs text-neutral-400">불러오는 중...</p>
      )}

      {isEmpty && <EmptyState icon={<IconFolderPlus size={28} stroke={1.5} />} title="아직 프로젝트가 없어요" hint="첫 프로젝트를 만들고 할 일을 묶어보세요." />}

      {overview && overview.overlap_warning && (
        <div className="mb-6 rounded-lg px-4 py-3 text-xs" style={{ background: 'var(--cherry-bg)', color: 'var(--cherry)' }}>
          {overview.overlap_warning}
        </div>
      )}

      {starredProjects.length > 0 && (
        <div className="mb-8">
          <p className="mb-2 text-[11px] font-medium text-neutral-400">즐겨찾기</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
