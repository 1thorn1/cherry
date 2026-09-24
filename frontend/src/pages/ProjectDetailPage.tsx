import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { Milestone, NoteKind, ProjectDetail, TimelineEntry } from '../types/project'
import { addMilestone, addNote, completeMilestoneNow, deleteNote, deleteProject, getProject, getTimeline, renameMilestone, scheduleMilestoneToday, uncompleteMilestoneNow, unscheduleMilestoneToday, updateNote, updateProjectShared, updateProjectWorkDays } from '../api/projects'
import MilestoneTrack from '../components/MilestoneTrack'
import MilestoneChipGrid from '../components/MilestoneChipGrid'
import NoteEntry from '../components/NoteEntry'

const kindLabels: Record<string, string> = {
  AUTO_LOG: '완료',
  NOTE: '메모',
  LINK: '링크',
  RETRO: '회고',
}

const WORK_DAY_LABELS: { day: number; label: string }[] = [
  { day: 1, label: '월' },
  { day: 2, label: '화' },
  { day: 3, label: '수' },
  { day: 4, label: '목' },
  { day: 5, label: '금' },
  { day: 6, label: '토' },
  { day: 7, label: '일' },
]

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

  const [noteKind, setNoteKind] = useState<NoteKind>('NOTE')
  const [noteBody, setNoteBody] = useState('')
  const [noteUrl, setNoteUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [sharingToggle, setSharingToggle] = useState(false)
  const [workDaysSaving, setWorkDaysSaving] = useState(false)
  const [milestoneDraft, setMilestoneDraft] = useState('')
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [sendingId, setSendingId] = useState<number | null>(null)
  const [completingId, setCompletingId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [savingNoteId, setSavingNoteId] = useState<number | null>(null)
  const [renamingId, setRenamingId] = useState<number | null>(null)

  async function loadDetail() {
    try {
      setDetail(await getProject(projectId))
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

  async function handleAddMilestoneNote(milestoneId: number, body: string) {
    if (savingNoteId) return
    setSavingNoteId(milestoneId)
    try {
      await addNote(projectId, 'NOTE', body, null, milestoneId)
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

  async function handleToggleWorkDay(day: number) {
    if (!detail || workDaysSaving) return
    const current = detail.project.work_days
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day]
    if (next.length === 0) return
    setWorkDaysSaving(true)
    try {
      const updated = await updateProjectWorkDays(projectId, next)
      setDetail({ ...detail, project: updated })
    } catch (e) {
      setError(e instanceof Error ? e.message : '작업 요일을 저장하지 못했습니다')
    } finally {
      setWorkDaysSaving(false)
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

  const notesByMilestone = new Map<number, TimelineEntry[]>()
  for (const entry of timeline) {
    if (entry.milestone_id === null) continue
    const list = notesByMilestone.get(entry.milestone_id) ?? []
    list.push(entry)
    notesByMilestone.set(entry.milestone_id, list)
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
        {error ? <p className="text-xs text-red-600">{error}</p> : <p className="text-xs text-neutral-400">불러오는 중...</p>}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
      <Link to="/projects" className="text-xs text-neutral-400">← 프로젝트</Link>
      <div className="mb-6 mt-2 flex items-center justify-between">
        <h1 className="text-xl font-medium tracking-tight">{detail.project.name}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-[11px] font-medium text-neutral-300 hover:text-red-500 disabled:opacity-50"
          >
            삭제
          </button>
        <button
          onClick={handleToggleShared}
          disabled={sharingToggle}
          className="rounded-md px-2.5 py-1 text-[11px] font-medium disabled:opacity-50"
          style={detail.project.shared
            ? { background: 'var(--cherry-bg)', color: 'var(--cherry)' }
            : { background: '#F1EFE8', color: '#888780' }}
        >
          {detail.project.shared ? '친구에게 공유중' : '비공개'}
        </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</p>
      )}

      <div className="mb-6 flex gap-1 rounded-lg bg-neutral-100 p-1">
        <button
          onClick={() => setTab('progress')}
          className={`flex-1 rounded-md py-2 text-xs font-medium ${tab === 'progress' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
        >
          진행
        </button>
        <button
          onClick={() => setTab('timeline')}
          className={`flex-1 rounded-md py-2 text-xs font-medium ${tab === 'timeline' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
        >
          기록
        </button>
      </div>

      {tab === 'progress' && (
        <div>
          {detail.project.type === 'EXAM' && (
            <div className="mb-4 flex items-center gap-2">
              <span className="text-[11px] text-neutral-400">작업 요일</span>
              <div className="flex gap-1">
                {WORK_DAY_LABELS.map(({ day, label }) => {
                  const active = detail.project.work_days.includes(day)
                  return (
                    <button
                      key={day}
                      onClick={() => handleToggleWorkDay(day)}
                      disabled={workDaysSaving}
                      className="h-6 w-6 rounded-full text-[10px] font-medium disabled:opacity-50"
                      style={active
                        ? { background: 'var(--cherry-bg)', color: 'var(--cherry)' }
                        : { background: '#F1EFE8', color: '#B8B6AC' }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <MilestoneTrack milestones={detail.milestones} />
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
                placeholder="새 마일스톤 (예: 2구간 - 디자인)"
                className="flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
              <button
                onClick={handleAddMilestone}
                disabled={addingMilestone}
                className="rounded-lg border border-neutral-200 px-3 text-xs font-medium text-neutral-500 disabled:opacity-50"
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
            />
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div>
          <div className="mb-6 rounded-lg border border-neutral-200 p-4">
            <div className="mb-3 flex gap-1 rounded-lg bg-neutral-100 p-1">
              <button
                onClick={() => setNoteKind('NOTE')}
                className={`flex-1 rounded-md py-2 text-xs font-medium ${noteKind === 'NOTE' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
              >
                메모
              </button>
              <button
                onClick={() => setNoteKind('LINK')}
                className={`flex-1 rounded-md py-2 text-xs font-medium ${noteKind === 'LINK' ? 'bg-white shadow-sm' : 'text-neutral-500'}`}
              >
                링크
              </button>
            </div>

            {noteKind === 'LINK' && (
              <input
                value={noteUrl}
                onChange={(e) => setNoteUrl(e.target.value)}
                placeholder="https://..."
                className="mb-3 w-full rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
              />
            )}

            <textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder={noteKind === 'LINK' ? '한 줄 설명' : '결정한 것, 막힌 것, 정리... (마크다운 지원 — # 제목, - 목록, **굵게**...)'}
              rows={noteKind === 'LINK' ? 3 : 6}
              className="mb-3 w-full resize-y rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
            />

            <button
              onClick={handleAddNote}
              disabled={saving}
              className="w-full rounded-lg py-2.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--cherry)' }}
            >
              기록하기
            </button>
          </div>

          {timeline.length === 0 && (
            <p className="py-8 text-center text-xs text-neutral-400">아직 기록이 없어요</p>
          )}

          {timelineWithDividers.map(({ entry, dividerLabel }) => (
            <div key={`${entry.kind}-${entry.ref_id}`}>
              {dividerLabel && (
                <div className="mb-2 mt-5 flex items-center gap-2 text-[11px] font-medium text-neutral-400 first:mt-0">
                  <span className="h-px flex-1 bg-neutral-200" />
                  {dividerLabel}
                  <span className="h-px flex-1 bg-neutral-200" />
                </div>
              )}
              <div className="border-b border-neutral-100 py-3">
                <div className="mb-1 flex items-center gap-2">
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      background: entry.kind === 'AUTO_LOG' ? '#F1EFE8' : 'var(--cherry-bg)',
                      color: entry.kind === 'AUTO_LOG' ? '#888780' : 'var(--cherry)',
                    }}
                  >
                    {kindLabels[entry.kind] ?? entry.kind}
                  </span>
                  <span className="text-[11px] text-neutral-300">{entry.at.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <NoteEntry entry={entry} onUpdate={handleUpdateNote} onDelete={handleDeleteNote} hideKindLabel />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
