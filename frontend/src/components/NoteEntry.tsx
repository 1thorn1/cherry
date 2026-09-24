import { useState } from 'react'
import type { TimelineEntry } from '../types/project'
import { toggleMarkdownCheckbox } from '../lib/markdownChecklist'
import AutoGrowTextarea from './AutoGrowTextarea'
import MarkdownBody from './MarkdownBody'

const kindLabels: Record<string, string> = { AUTO_LOG: '완료', NOTE: '메모', LINK: '링크', RETRO: '회고' }

export default function NoteEntry({
  entry,
  onUpdate,
  onDelete,
  hideKindLabel,
  showDate,
}: {
  entry: TimelineEntry
  onUpdate: (noteId: number, body: string | null, url: string | null) => Promise<void>
  onDelete: (noteId: number) => Promise<void>
  hideKindLabel?: boolean
  showDate?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [bodyDraft, setBodyDraft] = useState('')
  const [urlDraft, setUrlDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingCheckbox, setTogglingCheckbox] = useState(false)

  const editable = entry.kind !== 'AUTO_LOG'

  function startEdit() {
    setBodyDraft(entry.body ?? '')
    setUrlDraft(entry.url ?? '')
    setEditing(true)
  }

  async function handleSave() {
    if (saving) return
    if (entry.kind === 'LINK' && !urlDraft.trim()) return
    if (entry.kind !== 'LINK' && !bodyDraft.trim()) return
    setSaving(true)
    try {
      await onUpdate(entry.ref_id, bodyDraft.trim() || null, urlDraft.trim() || null)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (deleting) return
    if (!window.confirm('이 기록을 삭제할까요?')) return
    setDeleting(true)
    try {
      await onDelete(entry.ref_id)
    } finally {
      setDeleting(false)
    }
  }

  async function handleToggleCheckbox(index: number) {
    if (togglingCheckbox || !entry.body) return
    const newBody = toggleMarkdownCheckbox(entry.body, index)
    if (newBody === entry.body) return
    setTogglingCheckbox(true)
    try {
      await onUpdate(entry.ref_id, newBody, entry.url)
    } catch (err) {
      console.error('체크박스 토글 저장 실패:', err)
    } finally {
      setTogglingCheckbox(false)
    }
  }

  if (editing) {
    return (
      <div>
        {entry.kind === 'LINK' && (
          <input
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://..."
            className="mb-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm outline-none transition-shadow focus:border-[var(--cherry)] focus:ring-2 focus:ring-[var(--cherry-bg)]"
          />
        )}
        <AutoGrowTextarea
          value={bodyDraft}
          onChange={(e) => setBodyDraft(e.target.value)}
          rows={entry.kind === 'LINK' ? 2 : 3}
          className="mb-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm outline-none transition-shadow focus:border-[var(--cherry)] focus:ring-2 focus:ring-[var(--cherry-bg)]"
        />
        <div className="flex justify-end gap-2 text-xs">
          <button onClick={() => setEditing(false)} className="text-neutral-400">취소</button>
          <button onClick={handleSave} disabled={saving} className="font-medium disabled:opacity-50" style={{ color: 'var(--cherry)' }}>
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {(!hideKindLabel || showDate || editable) && (
        <div className="mb-1 flex items-center gap-2">
          {!hideKindLabel && (
            <span className="inline-block text-[10px] font-medium text-neutral-400">{kindLabels[entry.kind] ?? entry.kind}</span>
          )}
          {hideKindLabel && showDate && (
            <span className="text-[10px] text-neutral-300">{entry.at.slice(0, 16).replace('T', ' ')}</span>
          )}
          {editable && (
            <div className="ml-auto flex gap-2 text-[10px] text-neutral-300">
              <button onClick={startEdit} className="hover:text-neutral-500">수정</button>
              <button onClick={handleDelete} disabled={deleting} className="hover:text-red-500 disabled:opacity-50">삭제</button>
            </div>
          )}
        </div>
      )}

      {entry.kind === 'AUTO_LOG' && (
        <p className="text-sm text-neutral-600">
          {entry.title ?? ''}
          {entry.count && entry.count > 1 ? ` × ${entry.count}` : ''}
        </p>
      )}
      {entry.kind === 'LINK' && (
        <div className="text-sm">
          {entry.body && <p>{entry.body}</p>}
          {entry.url && <p className="text-xs text-neutral-400">{entry.url}</p>}
        </div>
      )}
      {(entry.kind === 'NOTE' || entry.kind === 'RETRO') && entry.body && (
        <MarkdownBody onToggleCheckbox={handleToggleCheckbox}>{entry.body}</MarkdownBody>
      )}
    </div>
  )
}
