import { useEffect, useState } from 'react'
import { IconCarouselHorizontal, IconRollercoaster } from '@tabler/icons-react'
import type { Friend, FriendCode, FriendPark, PendingRequest, SharingSettings } from '../types/friend'
import type { AuthUser } from '../types/auth'
import {
  acceptFriendRequest,
  getFriendPark,
  getFriends,
  getMyFriendCode,
  getPendingRequests,
  getSharingSettings,
  removeFriendship,
  sendFriendRequest,
  updateSharingSettings,
  visitFriendPark,
} from '../api/friend'
import { getMe, logout, updateNickname, uploadProfileImage } from '../api/auth'

const settingLabels: { key: keyof SharingSettings; label: string; hint: string }[] = [
  { key: 'share_park', label: '공원 보여주기', hint: '기구, 인구' },
  { key: 'share_activity_count', label: '오늘 활동량 공개', hint: '개수만. 내용은 안 보여요' },
  { key: 'share_task_titles', label: '일정 제목 공개', hint: '공유로 설정한 프로젝트만' },
]

export default function SettingsPage() {
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
  const [settings, setSettings] = useState<SharingSettings | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [editingNickname, setEditingNickname] = useState(false)
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [savingNickname, setSavingNickname] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  async function loadAll() {
    try {
      const [code, pending, friendList, sharingSettings] = await Promise.all([
        getMyFriendCode(),
        getPendingRequests(),
        getFriends(),
        getSharingSettings(),
      ])
      setMyCode(code)
      setRequests(pending)
      setFriends(friendList)
      setSettings(sharingSettings)
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    getMe()
      .then(setAuthUser)
      .catch(() => setAuthUser(null))
      .finally(() => setAuthChecked(true))
  }, [])

  function startEditingNickname() {
    if (!authUser) return
    setNicknameDraft(authUser.nickname)
    setEditingNickname(true)
  }

  async function handleSaveNickname() {
    const trimmed = nicknameDraft.trim()
    if (!trimmed || savingNickname) return
    setSavingNickname(true)
    try {
      setAuthUser(await updateNickname(trimmed))
      setEditingNickname(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '닉네임을 저장하지 못했습니다')
    } finally {
      setSavingNickname(false)
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || uploadingImage) return
    setUploadingImage(true)
    try {
      setAuthUser(await uploadProfileImage(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : '사진을 올리지 못했습니다')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
      setAuthUser(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : '로그아웃하지 못했습니다')
    } finally {
      setLoggingOut(false)
    }
  }

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
        setOpenParkId(null)
      }
    }
  }

  async function handleToggleSetting(key: keyof SharingSettings) {
    if (!settings || savingSettings) return
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    setSavingSettings(true)
    try {
      await updateSharingSettings(next)
    } catch (e) {
      setSettings(settings)
      setError(e instanceof Error ? e.message : '설정을 저장하지 못했습니다')
    } finally {
      setSavingSettings(false)
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
      <h1 className="mb-6 text-xl font-medium tracking-tight">설정</h1>

      {authChecked && (
        <div className="mb-6 rounded-lg border border-neutral-200 p-4">
          {authUser ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="group relative h-12 w-12 flex-none cursor-pointer overflow-hidden rounded-full bg-neutral-100">
                  {authUser.profile_image_url ? (
                    <img src={authUser.profile_image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm font-medium text-neutral-400">
                      {authUser.nickname.slice(0, 1)}
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[9px] font-medium text-white opacity-0 group-hover:opacity-100">
                    {uploadingImage ? '업로드 중' : '사진 변경'}
                  </span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleImageChange}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>

                <div>
                  {editingNickname ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        value={nicknameDraft}
                        onChange={(e) => setNicknameDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.nativeEvent.isComposing) return
                          if (e.key === 'Enter') handleSaveNickname()
                        }}
                        autoFocus
                        className="rounded-md border border-neutral-200 px-2 py-1 text-sm outline-none focus:border-neutral-400"
                      />
                      <button
                        onClick={handleSaveNickname}
                        disabled={savingNickname}
                        className="rounded-md px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
                        style={{ background: 'var(--cherry)' }}
                      >
                        저장
                      </button>
                    </div>
                  ) : (
                    <button onClick={startEditingNickname} className="text-sm font-medium hover:underline">
                      {authUser.nickname}
                    </button>
                  )}
                  {authUser.email && <p className="text-[11px] text-neutral-400">{authUser.email}</p>}
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-md bg-neutral-100 px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-400">로그인하면 프로필과 친구 목록이 계정에 저장돼요</p>
              <a
                href="/oauth2/authorization/google"
                className="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                style={{ background: 'var(--cherry)' }}
              >
                Google로 로그인
              </a>
            </div>
          )}
        </div>
      )}

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

      {settings && (
        <div className="mb-8 rounded-lg border border-neutral-200 p-4">
          <p className="mb-3 text-xs text-neutral-400">공개 설정</p>
          <div className="space-y-3">
            {settingLabels.map(({ key, label, hint }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm">{label}</p>
                  <p className="text-[11px] text-neutral-400">{hint}</p>
                </div>
                <button
                  onClick={() => handleToggleSetting(key)}
                  disabled={savingSettings}
                  className="relative h-6 w-11 flex-none rounded-full transition-colors disabled:opacity-50"
                  style={{ background: settings[key] ? 'var(--cherry)' : '#E5E5E5' }}
                  aria-pressed={settings[key]}
                  aria-label={label}
                >
                  <span
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform"
                    style={{ transform: settings[key] ? 'translateX(22px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <div className="flex items-center gap-2">
                  <span className="text-sm">{f.nickname}</span>
                  {f.today_activity_count !== null && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">
                      오늘 {f.today_activity_count}개
                    </span>
                  )}
                </div>
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
                              {slot.indoor ? (
                                <IconCarouselHorizontal size={18} stroke={1.5} color="var(--cherry)" />
                              ) : (
                                <IconRollercoaster size={18} stroke={1.5} color="var(--cherry)" />
                              )}
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
