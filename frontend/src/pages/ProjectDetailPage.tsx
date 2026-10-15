import Collapse from '../components/Collapse'
import { COMPLETION_CHANGED } from '../lib/offlineCompletion'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Milestone, NoteKind, ProjectDetail, TimelineEntry } from '../types/project'
import { addMilestone, addNote, completeMilestoneNow, deleteNote, deleteProject, getProject, getTimeline, renameMilestone, scheduleMilestoneToday, uncompleteMilestoneNow, unscheduleMilestoneToday, updateNote, updateMilestoneProgress, updateProjectShared } from '../api/projects'
import { getChallengeProjectLinks } from '../api/challenges'
import MilestoneTrack from '../components/MilestoneTrack'
import MilestoneChipGrid from '../components/MilestoneChipGrid'
import NoteEntry from '../components/NoteEntry'
import AutoGrowTextarea from '../components/AutoGrowTextarea'
import { IconArrowRight, IconCheck, IconPlant2, IconPlus } from '@tabler/icons-react'
import { Card, EmptyState, ErrorBanner, PrimaryButton, ProgressBar, SecondaryButton, Segment } from '../components/ui'

const kindLabels: Record<string, string> = {
  AUTO_LOG: '완료',
  NOTE: '메모',
  LINK: '링크',
  RETRO: '회고',
}

function daysBetween(startIso: string, endIso: string): number {
  const days = (new Date(endIso).getTime() - new Date(startIso).getTime()) / 86400000
  return Math.max(1, Math.round(days))
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)
  const navigate = useNavigate()

  const [tab, setTab] = useState<'progress' | 'timeline'>('progress')
  const [detail, setDetail] = useState<ProjectDetail | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [error, setError] = useState('')
  // 같이 하기로 만든(아직 참여 중인) 프로젝트는 "← 프로젝트" 대신 "← 같이 하기"로
  // 돌아가야 자연스럽다 — 애초에 이 프로젝트로 들어온 맥락이 같이 하기 쪽이라서.
  const [challengeId, setChallengeId] = useState<number | null>(null)

  const [noteKind, setNoteKind] = useState<NoteKind>('NOTE')
  const [noteBody, setNoteBody] = useState('')
  const [noteUrl, setNoteUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [sharingToggle, setSharingToggle] = useState(false)
  const [milestoneDraft, setMilestoneDraft] = useState('')
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [sendingId, setSendingId] = useState<number | null>(null)
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [savingNoteId, setSavingNoteId] = useState<number | null>(null)
  const [progressingId, setProgressingId] = useState<number | null>(null)
  const [renamingId, setRenamingId] = useState<number | null>(null)

  async function loadDetail() {
    try {
      const [project, links] = await Promise.all([getProject(projectId), getChallengeProjectLinks()])
      setDetail(project)
      setChallengeId(links.find((l) => l.project_id === projectId && !l.left)?.challenge_id ?? null)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  async function loadTimeline() {
    try {
      setTimeline(await getTimeline(projectId))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => { loadDetail(); loadTimeline() }, [id])
  useEffect(() => {
    const refresh = () => { void loadDetail(); void loadTimeline() }
    window.addEventListener(COMPLETION_CHANGED, refresh)
    return () => window.removeEventListener(COMPLETION_CHANGED, refresh)
  }, [id])

  async function handleSendToday(milestone: Milestone) {
    if (sendingId) return
    setSendingId(milestone.id)
    try {
      if (milestone.scheduled_today) {
        await unscheduleMilestoneToday(milestone.id)
      } else {
        await scheduleMilestoneToday(milestone.id)
      }
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : '오늘 일정 변경에 실패했습니다')
    } finally {
      setSendingId(null)
    }
  }

  async function handleCompleteMilestone(milestone: Milestone) {
    if (completingId) return
    setCompletingId(milestone.id)
    try {
      await completeMilestoneNow(milestone.id)
      await Promise.all([loadDetail(), loadTimeline()])
    } catch (e) {
      setError(e instanceof Error ? e.message : '완료 처리하지 못했습니다')
    } finally {
      setCompletingId(null)
    }
  }

  async function handleUncompleteMilestone(milestone: Milestone) {
    if (completingId) return
    setCompletingId(milestone.id)
    try {
      await uncompleteMilestoneNow(milestone.id)
      await Promise.all([loadDetail(), loadTimeline()])
    } catch (e) {
      setError(e instanceof Error ? e.message : '완료를 취소하지 못했습니다')
    } finally {
      setCompletingId(null)
    }
  }

  async function handleAddMilestoneNote(milestoneId: number, body: string, noteDate?: string) {
    if (savingNoteId) return
    setSavingNoteId(milestoneId)
    try {
      await addNote(projectId, 'NOTE', body, null, milestoneId, noteDate)
      await loadTimeline()
    } catch (e) {
      setError(e instanceof Error ? e.message : '기록하지 못했습니다')
    } finally {
      setSavingNoteId(null)
    }
  }

  async function handleToggleShared() {
    if (!detail || sharingToggle) return
    setSharingToggle(true)
    try {
      const updated = await updateProjectShared(projectId, !detail.project.shared)
      setDetail({ ...detail, project: updated })
    } catch (e) {
      setError(e instanceof Error ? e.message : '설정을 저장하지 못했습니다')
    } finally {
      setSharingToggle(false)
    }
  }

  async function handleDelete() {
    if (!detail || deleting) return
    if (!window.confirm(`"${detail.project.name}" 프로젝트를 삭제할까요? 완료 기록은 남지만 프로젝트 목록에서는 사라져요.`)) return
    setDeleting(true)
    try {
      await deleteProject(projectId)
      navigate('/projects')
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제하지 못했습니다')
      setDeleting(false)
    }
  }

  async function handleAddMilestone() {
    const trimmed = milestoneDraft.trim()
    if (!trimmed || addingMilestone) return
    setAddingMilestone(true)
    try {
      await addMilestone(projectId, trimmed)
      setMilestoneDraft('')
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : '마일스톤을 추가하지 못했습니다')
    } finally {
      setAddingMilestone(false)
    }
  }

  async function handleChangeProgress(milestone: Milestone, inProgress: boolean) {
    if (progressingId !== null) return
    setError('')
    setProgressingId(milestone.id)
    try {
      const updated = await updateMilestoneProgress(projectId, milestone.id, inProgress)
      setDetail((current) => current ? {
        ...current,
        milestones: current.milestones.map((m) => m.id === milestone.id
          ? { ...m, started_at: updated.started_at }
          : m),
      } : current)
    } catch (e) {
      setError(e instanceof Error ? e.message : '진행 상태를 변경하지 못했습니다')
    } finally {
      setProgressingId(null)
    }
  }

  async function handleRenameMilestone(milestoneId: number, title: string) {
    if (renamingId) return
    setRenamingId(milestoneId)
    try {
      await renameMilestone(projectId, milestoneId, title)
      await loadDetail()
    } catch (e) {
      setError(e instanceof Error ? e.message : '제목을 바꾸지 못했습니다')
    } finally {
      setRenamingId(null)
    }
  }

  async function handleAddNote() {
    if (saving) return
    if (noteKind === 'LINK' && !noteUrl.trim()) return
    if (noteKind !== 'LINK' && !noteBody.trim()) return

    setSaving(true)
    try {
      await addNote(projectId, noteKind, noteBody.trim() || null, noteUrl.trim() || null)
      setNoteBody('')
      setNoteUrl('')
      await loadTimeline()
    } catch (e) {
      setError(e instanceof Error ? e.message : '기록하지 못했습니다')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateNote(noteId: number, body: string | null, url: string | null) {
    try {
      await updateNote(projectId, noteId, body, url)
      await loadTimeline()
    } catch (e) {
      setError(e instanceof Error ? e.message : '수정하지 못했습니다')
    }
  }

  async function handleDeleteNote(noteId: number) {
    try {
      await deleteNote(projectId, noteId)
      await loadTimeline()
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제하지 못했습니다')
    }
  }

  // 마일스톤 구간 구분선 라벨 (A-6-4). 구간 시작은 이전 마일스톤 완료 시각, 첫 구간은 프로젝트 생성 시각.
  function segmentLabel(milestoneId: number | null): string | null {
    if (!detail || milestoneId === null) return null
    const sorted = [...detail.milestones].sort((a, b) => a.seq - b.seq)
    const index = sorted.findIndex((m) => m.id === milestoneId)
    if (index === -1) return null
    const milestone = sorted[index]
    const segmentStart = sorted[index - 1]?.completed_at ?? detail.project.created_at
    if (milestone.completed && milestone.completed_at) {
      return `${milestone.title} · 완료 · ${daysBetween(segmentStart, milestone.completed_at)}일`
    }
    return milestone.title
  }

  const timelineWithDividers = timeline.reduce<{ entry: TimelineEntry; dividerLabel: string | null }[]>(
    (acc, entry) => {
      const prevEntry = acc[acc.length - 1]?.entry
      const changed = !prevEntry || prevEntry.milestone_id !== entry.milestone_id
      acc.push({ entry, dividerLabel: changed ? segmentLabel(entry.milestone_id) : null })
      return acc
    },
    [],
  )

  // 완료 여부는 칩 자체(체크박스 + "완료됨" 문구)에서 이미 보여주므로, 마일스톤 패널의
  // 메모 목록엔 자동 완료 기록(AUTO_LOG)까지 또 띄우지 않고 사용자가 직접 남긴 메모만 둔다.
  const notesByMilestone = new Map<number, TimelineEntry[]>()
  for (const entry of timeline) {
    if (entry.milestone_id === null || entry.kind === 'AUTO_LOG') continue
    const list = notesByMilestone.get(entry.milestone_id) ?? []
    list.push(entry)
    notesByMilestone.set(entry.milestone_id, list)
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
        {error ? <p className="text-xs text-red-600">{error}</p> : <p className="text-xs text-[var(--ink-muted)]">불러오는 중...</p>}
      </div>
    )
  }

  const completedCount = detail.milestones.filter((m) => m.completed).length
  const nextMilestone = detail.milestones.find((m) => !m.completed && m.started_at) ?? detail.milestones.find((m) => !m.completed)
  const todayCount = detail.milestones.filter((m) => m.scheduled_today && !m.completed).length
  const typeLabel = { FREE: '자유 프로젝트', PROGRESS: '진도형 프로젝트', EXAM: '시험 준비' }[detail.project.type]

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-10">
      {challengeId ? (
        <Link to={`/challenges/${challengeId}`} className="text-xs text-[var(--ink-muted)]">← 같이 하기</Link>
      ) : (
        <Link to="/projects" className="text-xs text-[var(--ink-muted)]">← 프로젝트</Link>
      )}
      <div className="mb-6 mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--sprout)]"><IconPlant2 size={15} />{typeLabel}</p>
          <h1 className="font-display text-[34px] leading-[42px] text-[var(--ink)]">{detail.project.name}</h1>
          <p className="mt-2 text-[13px] text-[var(--ink-muted)]">진행 상황과 할 일, 관련 기록을 한곳에서 관리하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[11px] font-medium text-[var(--ink-faint)] hover:text-red-500 disabled:opacity-50"
          >
            삭제
          </button>
        <button
          onClick={handleToggleShared}
          disabled={sharingToggle}
          className="rounded-md px-2.5 py-1 text-[11px] font-medium disabled:opacity-50"
          style={detail.project.shared
            ? { background: 'var(--sprout-soft)', color: 'var(--sprout)' }
            : { background: 'var(--surface-sunken)', color: 'var(--ink-muted)' }}
        >
          {detail.project.shared ? '친구에게 공유중' : '비공개'}
        </button>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className={`grid items-start gap-6 ${detail.project.type === 'FREE' ? '' : 'lg:grid-cols-[minmax(0,1fr)_300px]'}`}>
      <div className="min-w-0 space-y-4">
      {challengeId === null && <Card className="relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-6 -top-8 h-36 w-36 rounded-full bg-[var(--sprout-soft)] opacity-60" />
        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[16px] font-semibold text-[var(--ink)]">진행 현황</h2>
            <span className="rounded-full bg-[var(--sprout-soft)] px-2.5 py-1 text-[12px] font-semibold text-[var(--sprout)]">{detail.milestones.length ? Math.round(completedCount / detail.milestones.length * 100) : 0}%</span>
          </div>
          <p className="mb-4 mt-3 font-display text-[30px] tabular-nums text-[var(--ink)]">{completedCount}<span className="ml-2 font-sans text-[14px] text-[var(--ink-muted)]">/ {detail.milestones.length}개 완료</span></p>
          <ProgressBar value={completedCount} max={detail.milestones.length} label="프로젝트 진행률" />
          <p className="mt-3 text-[13px] text-[var(--ink-muted)]">{nextMilestone ? `다음 할 일 · ${nextMilestone.title}` : detail.milestones.length ? '모든 항목을 완료했어요. 기록 탭에서 이전 내용을 확인할 수 있어요.' : '항목을 추가해 프로젝트를 정리하세요.'}</p>
        </div>
      </Card>}

      <Segment full label="프로젝트 보기" value={tab} onChange={setTab} options={[{ value: 'progress', label: '진행' }, { value: 'timeline', label: '기록' }]} />

      {tab === 'progress' && (
        <Card className="p-4 sm:p-5">
          <h2 className="text-[16px] font-semibold text-[var(--ink)]">프로젝트 항목</h2>
          <p className="mb-4 mt-1 text-[13px] text-[var(--ink-muted)]">항목을 눌러 메모를 확인하거나 수정할 수 있어요.</p>
          {detail.milestones.length > 0 && <MilestoneTrack milestones={detail.milestones} />}
          {detail.project.type === 'FREE' && (
            <div className="mt-3 flex gap-2">
              <input
                value={milestoneDraft}
                onChange={(e) => setMilestoneDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddMilestone()
                  }
                }}
                placeholder="새 항목 추가 (예: 디자인 정리)"
                className="min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-sunken)] px-3 py-2.5 text-[14px] outline-none focus:border-[var(--line-strong)]"
              />
              <button
                onClick={handleAddMilestone}
                disabled={addingMilestone}
                className="rounded-lg border border-[var(--line)] px-3 text-xs font-medium text-[var(--ink-muted)] disabled:opacity-50"
              >
                추가
              </button>
            </div>
          )}
          <div className="mt-4">
            <MilestoneChipGrid
              milestones={detail.milestones}
              notesByMilestone={notesByMilestone}
              onComplete={handleCompleteMilestone}
              onUncomplete={handleUncompleteMilestone}
              onSendToday={handleSendToday}
              onRename={handleRenameMilestone}
              renamingId={renamingId}
              onAddNote={handleAddMilestoneNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
              completingId={completingId}
              sendingId={sendingId}
              savingNoteId={savingNoteId}
              groupByStatus={detail.project.type === 'FREE'}
              onChangeProgress={handleChangeProgress}
              progressingId={progressingId}
              groupByWeek={detail.project.type === 'EXAM'}
            />
          </div>
        </Card>
      )}

      {tab === 'timeline' && (
        <div>
          <div className="mb-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] sm:p-5">
            <h2 className="mb-1 text-[16px] font-semibold text-[var(--ink)]">기록 추가</h2>
            <p className="mb-4 text-[13px] text-[var(--ink-muted)]">진행 내용과 참고할 자료를 남겨보세요.</p>
            <div className="mb-3"><Segment full label="기록 종류" value={noteKind} onChange={setNoteKind} options={[{ value: 'NOTE', label: '메모' }, { value: 'LINK', label: '링크' }]} /></div>

            <Collapse open={noteKind === 'LINK'}>
              <input
                value={noteUrl}
                onChange={(e) => setNoteUrl(e.target.value)}
                placeholder="https://..."
                className="mb-3 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none transition-shadow focus:border-[var(--sprout)] focus:ring-2 focus:ring-[var(--sprout-soft)]"
              />
            </Collapse>

            <AutoGrowTextarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder={noteKind === 'LINK' ? '한 줄 설명' : '결정한 것, 막힌 것, 정리... (마크다운 지원)'}
              rows={noteKind === 'LINK' ? 2 : 4}
              className="mb-3 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-sm outline-none transition-shadow focus:border-[var(--sprout)] focus:ring-2 focus:ring-[var(--sprout-soft)]"
            />

            <PrimaryButton onClick={handleAddNote} disabled={saving} className="w-full">
              <IconPlus size={16} />{saving ? '기록 중...' : '기록 남기기'}
            </PrimaryButton>
          </div>

          {timeline.length === 0 && (
            <EmptyState icon={<IconPlant2 size={26} />} title="아직 기록이 없어요" hint="메모를 남기거나 구간을 완료하면 여기에 쌓여요." />
          )}

          {timelineWithDividers.map(({ entry, dividerLabel }) => (
            <div key={`${entry.kind}-${entry.ref_id}`}>
              {dividerLabel && (
                <div className="mb-2 mt-5 flex items-center gap-2 text-[11px] font-medium text-[var(--ink-muted)] first:mt-0">
                  <span className="h-px flex-1 bg-[var(--line)]" />
                  {dividerLabel}
                  <span className="h-px flex-1 bg-[var(--line)]" />
                </div>
              )}
              <div className="mb-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      background: entry.kind === 'AUTO_LOG' ? 'var(--surface-sunken)' : 'var(--sprout-soft)',
                      color: entry.kind === 'AUTO_LOG' ? 'var(--ink-muted)' : 'var(--sprout)',
                    }}
                  >
                    {kindLabels[entry.kind] ?? entry.kind}
                  </span>
                  <span className="text-[11px] text-[var(--ink-faint)]">{entry.at.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <NoteEntry entry={entry} onUpdate={handleUpdateNote} onDelete={handleDeleteNote} hideKindLabel />
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
      <aside className={detail.project.type === 'FREE' ? 'grid min-w-0 gap-4 sm:grid-cols-2' : 'space-y-4'}>
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-[var(--ink)]"><IconPlant2 size={18} className="text-[var(--sprout)]" />다음 할 일</h2>
          {nextMilestone ? <>
            <p className="text-[15px] font-semibold leading-relaxed text-[var(--ink)]">{nextMilestone.title}</p>
            <p className="mb-4 mt-2 text-[13px] text-[var(--ink-muted)]">오늘 할 일에 추가해 이어서 진행하세요.</p>
            <SecondaryButton onClick={() => handleSendToday(nextMilestone)} disabled={sendingId !== null} className="w-full">{nextMilestone.scheduled_today ? '오늘 일정에서 빼기' : '오늘 일정에 추가'}<IconArrowRight size={15} /></SecondaryButton>
          </> : <p className="text-[13px] text-[var(--ink-muted)]">{detail.milestones.length ? '모든 항목을 완료했어요.' : '항목을 추가해주세요.'}</p>}
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-[16px] font-semibold text-[var(--ink)]">프로젝트 한눈에</h2>
          <dl className="space-y-3 text-[13px]">
            <div className="flex justify-between"><dt className="text-[var(--ink-muted)]">오늘 이어갈 일</dt><dd className="font-semibold tabular-nums text-[var(--wood)]">{todayCount}개</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--ink-muted)]">남은 구간</dt><dd className="font-semibold tabular-nums text-[var(--ink)]">{detail.milestones.length - completedCount}개</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--ink-muted)]">전체 기록</dt><dd className="font-semibold tabular-nums text-[var(--ink)]">{timeline.length}개</dd></div>
            {detail.project.exam_date && <div className="flex justify-between"><dt className="text-[var(--ink-muted)]">시험 날짜</dt><dd className="font-semibold text-[var(--ink)]">{detail.project.exam_date}</dd></div>}
          </dl>
          <Link to="/" className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--wood)]"><IconCheck size={15} />오늘 할 일 보러 가기<IconArrowRight size={14} /></Link>
        </Card>
      </aside>
      </div>
    </div>
  )
}
