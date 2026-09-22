import { useEffect, useState } from 'react'
import type { Friend, FriendCode, FriendPark, PendingRequest } from '../types/friend'
import {
  acceptFriendRequest,
  getFriendPark,
  getFriends,
  getMyFriendCode,
  getPendingRequests,
  removeFriendship,
  sendFriendRequest,
  visitFriendPark,
} from '../api/friend'

export default function FriendPage() {
  const [myCode, setMyCode] = useState<FriendCode | null>(null)
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [codeInput, setCodeInput] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [sending, setSending] = useState(false)
  const [openParkId, setOpenParkId] = useState<number | null>(null)
  const [parks, setParks] = useState<Record<number, FriendPark>>({})
  const [visitedIds, setVisitedIds] = useState<Set<number>>(new Set())

  async function loadAll() {
    try {
      const [code, pending, friendList] = await Promise.all([
        getMyFriendCode(),
        getPendingRequests(),
        getFriends(),
      ])
      setMyCode(code)
      setRequests(pending)
      setFriends(friendList)
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => { loadAll() }, [])

  async function handleCopy() {
    if (!myCode) return
    try {
      await navigator.clipboard.writeText(myCode.friend_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 클립보드 접근이 막힌 환경이면 조용히 무시
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!codeInput.trim() || sending) return
    setSending(true)
    setError('')
    try {
      await sendFriendRequest(codeInput.trim())
      setCodeInput('')
      await loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : '요청을 보내지 못했습니다')
    } finally {
      setSending(false)
    }
  }

  async function handleAccept(id: number) {
    if (busyId) return
    setBusyId(id)
    try {
      await acceptFriendRequest(id)
      await loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : '수락하지 못했습니다')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id: number) {
    if (busyId) return
    setBusyId(id)
    try {
      await removeFriendship(id)
      await loadAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : '거절하지 못했습니다')
    } finally {
      setBusyId(null)
    }
  }

  async function handleTogglePark(friendshipId: number) {
    if (openParkId === friendshipId) {
      setOpenParkId(null)
      return
    }
    setOpenParkId(friendshipId)
    if (!parks[friendshipId]) {
      try {
        const park = await getFriendPark(friendshipId)
        setParks((prev) => ({ ...prev, [friendshipId]: park }))
      } catch (e) {
        setError(e instanceof Error ? e.message : '공원을 불러오지 못했습니다')
      }
    }
  }

  async function handleVisit(friendshipId: number) {
    if (busyId) return
    setBusyId(friendshipId)
    try {
      await visitFriendPark(friendshipId)
      setVisitedIds((prev) => new Set(prev).add(friendshipId))
    } catch (e) {
      setError(e instanceof Error ? e.message : '방문하지 못했습니다')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
      <h1 className="mb-6 text-xl font-medium tracking-tight">친구</h1>

      <div className="mb-6 rounded-lg border border-neutral-200 p-4">
        <p className="mb-2 text-xs text-neutral-400">내 친구 코드</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-medium tracking-widest">{myCode?.friend_code ?? '...'}</span>
          <button
            onClick={handleCopy}
            className="rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium"
          >
            {copied ? '복사됨' : '복사'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSend} className="mb-8 flex gap-2">
        <input
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          placeholder="친구 코드 입력"
          className="flex-1 rounded-md border border-neutral-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ background: 'var(--cherry)' }}
        >
          요청
        </button>
      </form>

      {error && (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</p>
      )}

      {requests.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-medium tracking-tight">받은 요청</h2>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.friendship_id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-3">
                <span className="text-sm">{r.requester_nickname}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(r.friendship_id)}
                    disabled={busyId === r.friendship_id}
                    className="rounded-md px-3 py-1 text-[11px] font-medium text-white disabled:opacity-50"
                    style={{ background: 'var(--cherry)' }}
                  >
                    수락
                  </button>
                  <button
                    onClick={() => handleReject(r.friendship_id)}
                    disabled={busyId === r.friendship_id}
                    className="rounded-md bg-neutral-100 px-3 py-1 text-[11px] font-medium disabled:opacity-50"
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2 className="mb-3 text-sm font-medium tracking-tight">친구 목록</h2>
      {friends.length === 0 ? (
        <p className="py-8 text-center text-xs text-neutral-400">아직 친구가 없어요</p>
      ) : (
        <div className="space-y-2">
          {friends.map((f) => (
            <div key={f.friendship_id} className="rounded-lg border border-neutral-200 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">{f.nickname}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTogglePark(f.friendship_id)}
                    className="text-[11px] font-medium" style={{ color: 'var(--cherry)' }}
                  >
                    {openParkId === f.friendship_id ? '닫기' : '공원 구경'}
                  </button>
                  <button
                    onClick={() => handleReject(f.friendship_id)}
                    disabled={busyId === f.friendship_id}
                    className="text-[11px] text-neutral-400 disabled:opacity-50"
                  >
                    삭제
                  </button>
                </div>
              </div>

              {openParkId === f.friendship_id && (
                <div className="mt-3 border-t border-neutral-100 pt-3">
                  {!parks[f.friendship_id] ? (
                    <p className="text-xs text-neutral-400">불러오는 중...</p>
                  ) : (
                    <>
                      <p className="mb-2 text-xs text-neutral-400">
                        인구 <span className="font-medium text-neutral-600">{parks[f.friendship_id].population}</span>
                      </p>
                      {parks[f.friendship_id].slots.length === 0 ? (
                        <p className="mb-3 text-xs text-neutral-400">아직 지어진 기구가 없어요</p>
                      ) : (
                        <div className="mb-3 grid grid-cols-6 gap-2">
                          {parks[f.friendship_id].slots.map((slot) => (
                            <div
                              key={slot.id}
                              className="flex aspect-square flex-col items-center justify-center rounded-md"
                              style={{ background: 'var(--cherry-bg)' }}
                            >
                              <span className="text-base">{slot.indoor ? '🎡' : '🎢'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleVisit(f.friendship_id)}
                        disabled={busyId === f.friendship_id || visitedIds.has(f.friendship_id)}
                        className="w-full rounded-md py-1.5 text-[11px] font-medium text-white disabled:opacity-50"
                        style={{ background: 'var(--cherry)' }}
                      >
                        {visitedIds.has(f.friendship_id) ? '오늘 다녀왔어요' : '놀러가기'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
