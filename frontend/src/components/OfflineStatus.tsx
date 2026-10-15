import { useEffect, useSyncExternalStore } from 'react'
import { getSyncStatus, startCompletionSync, subscribeSyncStatus, syncCompletions } from '../lib/offlineCompletion'

export default function OfflineStatus() {
  const status = useSyncExternalStore(subscribeSyncStatus, getSyncStatus)
  useEffect(startCompletionSync, [])
  if (status.online && !status.count && !status.error) return null
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] bg-[var(--wood-soft)] px-5 py-2 text-[12px] text-[var(--ink)] lg:px-8">
      <span>{status.error || (status.syncing ? `완료 내역 ${status.count}개 동기화 중…` : status.count ? `기기에 저장됨 · 완료 내역 ${status.count}개 전송 대기` : '오프라인 · 저장된 목록에서 완료·취소할 수 있어요.')}</span>
      {status.online && status.count > 0 && <button disabled={status.syncing} onClick={() => void syncCompletions()} className="font-semibold text-[var(--wood)] disabled:opacity-50">다시 동기화</button>}
    </div>
  )
}
