import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ChallengeDetail } from '../types/challenge'
import { getChallenge, leaveChallenge, setChallengeMemo, setChallengePaused } from '../api/challenges'

export default function ChallengeDetailPage() {
  const { id } = useParams()
  const challengeId = Number(id)
  const navigate = useNavigate()

  const [detail, setDetail] = useState<ChallengeDetail | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [memoDraft, setMemoDraft] = useState('')
  const [editingMemo, setEditingMemo] = useState(false)
  const [savingMemo, setSavingMemo] = useState(false)

  async function load() {
    try {
      setDetail(await getChallenge(challengeId))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => { load() }, [id])

  async function handleCopy() {
    if (!detail) return
    try {
      await navigator.clipboard.writeText(detail.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 클립보드 접근이 막힌 환경이면 조용히 무시
    }
  }

  async function handleTogglePause(currentlyPaused: boolean) {
    if (busy) return
    setBusy(true)
    try {
      await setChallengePaused(challengeId, !currentlyPaused)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '변경하지 못했습니다')
    } finally {
      setBusy(false)
    }
  }

  function startEditingMemo(current: string | null) {
    setMemoDraft(current ?? '')
    setEditingMemo(true)
  }

  async function handleSaveMemo() {
    if (savingMemo) return
    setSavingMemo(true)
    try {
      await setChallengeMemo(challengeId, memoDraft.trim())
      setEditingMemo(false)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '메모를 저장하지 못했습니다')
    } finally {
      setSavingMemo(false)
    }
  }

  async function handleLeave() {
    if (busy) return
    setBusy(true)
    try {
      await leaveChallenge(challengeId)
      navigate('/challenges')
    } catch (e) {
      setError(e instanceof Error ? e.message : '나가지 못했습니다')
      setBusy(false)
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

  const me = detail.members.find((m) => m.me)

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
      <Link to="/challenges" className="text-xs text-neutral-400">← 같이 하기</Link>
      <h1 className="mb-2 mt-2 text-xl font-medium tracking-tight">{detail.title}</h1>

      <div className="mb-6 flex items-center gap-2">
        <span className="text-xs text-neutral-400">초대 코드</span>
        <span className="text-sm font-medium tracking-widest">{detail.invite_code}</span>
        <button onClick={handleCopy} className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium">
          {copied ? '복사됨' : '복사'}
        </button>
      </div>

      <div className="space-y-3">
        {detail.members.map((member) => (
          <div key={member.nickname} className="rounded-lg border border-neutral-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                {member.nickname}
                {member.me && <span className="ml-1 text-[11px] text-neutral-400">(나)</span>}
              </span>
              <div className="flex items-center gap-2">
                {member.paused && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">
                    잠시 쉬는 중
                  </span>
                )}
                <span className="text-[11px] text-neutral-400">
                  {member.completed_milestones} / {member.total_milestones}회
                </span>
              </div>
            </div>

            <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: member.total_milestones > 0
                    ? `${Math.min(100, (member.completed_milestones / member.total_milestones) * 100)}%`
                    : '0%',
                  background: 'var(--cherry)',
                }}
              />
            </div>

            <div className="mb-3 flex gap-1.5">
              {member.recent_active_days.map((active, i) => (
                <span
                  key={i}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: active ? 'var(--cherry)' : '#E5E5E5' }}
                />
              ))}
            </div>

            {member.me && editingMemo ? (
              <div className="flex gap-2">
                <input
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return
                    if (e.key === 'Enter') handleSaveMemo()
                  }}
                  placeholder="다른 멤버에게 남길 한 줄 (예: 오늘은 3과 복습만)"
                  className="flex-1 rounded-md border border-neutral-200 px-3 py-1.5 text-xs outline-none focus:border-neutral-400"
                  autoFocus
                />
                <button
                  onClick={handleSaveMemo}
                  disabled={savingMemo}
                  className="rounded-md px-3 text-xs font-medium text-white disabled:opacity-50"
                  style={{ background: 'var(--cherry)' }}
                >
                  저장
                </button>
              </div>
            ) : (
              <button
                onClick={() => member.me && startEditingMemo(member.shared_memo)}
                className={`text-left text-xs ${member.shared_memo ? 'text-neutral-500' : 'text-neutral-300'} ${member.me ? '' : 'cursor-default'}`}
                disabled={!member.me}
              >
                {member.shared_memo ?? (member.me ? '+ 한 줄 남기기' : '')}
              </button>
            )}
          </div>
        ))}
      </div>

      {me && (
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => handleTogglePause(me.paused)}
            disabled={busy}
            className="flex-1 rounded-md bg-neutral-100 py-2.5 text-xs font-medium disabled:opacity-50"
          >
            {me.paused ? '다시 시작하기' : '잠시 쉬기'}
          </button>
          <button
            onClick={handleLeave}
            disabled={busy}
            className="flex-1 rounded-md py-2.5 text-xs font-medium text-neutral-400 disabled:opacity-50"
          >
            나가기
          </button>
        </div>
      )}
    </div>
  )
}
