import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { NoteKind, ProjectDetail, TimelineEntry } from '../types/project'
import { addNote, completeMilestone, getProject, getTimeline } from '../api/projects'

const kindLabels: Record<string, string> = {
  AUTO_LOG: '완료',
  NOTE: '메모',
  LINK: '링크',
  RETRO: '회고',
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const projectId = Number(id)

  const [tab, setTab] = useState<'progress' | 'timeline'>('progress')
  const [detail, setDetail] = useState<ProjectDetail | null>(null)
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [error, setError] = useState('')

  const [noteKind, setNoteKind] = useState<NoteKind>('NOTE')
  const [noteBody, setNoteBody] = useState('')
  const [noteUrl, setNoteUrl] = useState('')
  const [saving, setSaving] = useState(false)

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
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => { loadDetail() }, [id])
  useEffect(() => { if (tab === 'timeline') loadTimeline() }, [id, tab])

  async function handleComplete(milestoneId: number) {
    await completeMilestone(milestoneId)
    loadDetail()
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
              placeholder={noteKind === 'LINK' ? '한 줄 설명' : '결정한 것, 막힌 것, 정리...'}
              rows={3}
              className="mb-3 w-full resize-none rounded-lg border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-neutral-400"
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

          {timeline.map((entry) => (
            <div key={`${entry.kind}-${entry.ref_id}`} className="border-b border-neutral-100 py-3">
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
              {entry.kind === 'AUTO_LOG' && <p className="text-sm text-neutral-600">{entry.title}</p>}
              {entry.kind === 'LINK' && (
                <div>
                  {entry.body && <p className="text-sm">{entry.body}</p>}
                  {entry.url && <p className="text-xs text-neutral-400">{entry.url}</p>}
                </div>
              )}
              {(entry.kind === 'NOTE' || entry.kind === 'RETRO') && (
                <p className="whitespace-pre-wrap text-sm">{entry.body}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
