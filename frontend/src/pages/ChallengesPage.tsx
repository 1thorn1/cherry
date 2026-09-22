import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Challenge } from '../types/challenge'
import { createChallenge, getChallenges, joinChallenge, type CreateChallengeInput } from '../api/challenges'

type Mode = 'FREE' | 'PROGRESS' | 'EXAM'

export default function ChallengesPage() {
  const navigate = useNavigate()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState<Mode>('FREE')
  const [totalUnits, setTotalUnits] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    try {
      setChallenges(await getChallenges())
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    const trimmed = title.trim()
    if (!trimmed || saving) return

    setSaving(true)
    try {
      const input: CreateChallengeInput = { title: trimmed }
      if (mode === 'PROGRESS') {
        input.type = 'PROGRESS'
        input.total_units = Number(totalUnits)
      } else if (mode === 'EXAM') {
        input.type = 'EXAM'
        input.total_units = Number(totalUnits)
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
    { value: 'FREE', label: '자유롭게' },
    { value: 'PROGRESS', label: '회차가 있어요' },
    { value: 'EXAM', label: '시험일이 있어요' },
  ]

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
      <h1 className="mb-6 text-xl font-medium tracking-tight">같이 하기</h1>

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
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
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

      {challenges.length === 0 ? (
        <p className="py-8 text-center text-xs text-neutral-400">아직 참여 중인 방이 없어요</p>
      ) : (
        challenges.map((challenge) => (
          <Link
            key={challenge.id}
            to={`/challenges/${challenge.id}`}
            className="flex items-center justify-between border-b border-neutral-100 py-3 text-sm"
          >
            <span>{challenge.title}</span>
            <span className="text-[11px] text-neutral-400">{challenge.invite_code}</span>
          </Link>
        ))
      )}
    </div>
  )
}
