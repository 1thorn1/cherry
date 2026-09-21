import { useEffect, useState } from 'react'
import type { Park } from '../types/park'
import { getPark } from '../api/park'

export default function ParkPage() {
  const [park, setPark] = useState<Park | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getPark()
      .then(setPark)
      .catch((e) => setError(e instanceof Error ? e.message : '불러오지 못했습니다'))
  }, [])

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
        <p className="text-xs text-red-600">{error}</p>
      </div>
    )
  }

  if (!park) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
        <p className="text-xs text-neutral-400">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
      <h1 className="mb-6 text-xl font-medium tracking-tight">공원</h1>

      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-neutral-200 p-4 text-center">
          <p className="text-2xl font-medium" style={{ color: 'var(--cherry)' }}>{park.population}</p>
          <p className="text-xs text-neutral-400">인구</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 text-center">
          <p className="text-2xl font-medium" style={{ color: 'var(--cherry)' }}>{park.today_visitors}</p>
          <p className="text-xs text-neutral-400">오늘 방문객</p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 text-center">
          <p className="text-2xl font-medium" style={{ color: 'var(--cherry)' }}>{park.point_balance}</p>
          <p className="text-xs text-neutral-400">체리</p>
        </div>
      </div>

      {park.slots.length === 0 && (
        <p className="py-8 text-center text-xs text-neutral-400">아직 지어진 기구가 없어요</p>
      )}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {park.slots.map((slot) => (
          <div
            key={slot.id}
            className="flex aspect-square flex-col items-center justify-center rounded-lg"
            style={{ background: 'var(--cherry-bg)' }}
          >
            <span className="text-2xl">{slot.indoor ? '🎡' : '🎢'}</span>
            <span className="mt-1 text-[10px] text-neutral-400">#{slot.slot_index}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
