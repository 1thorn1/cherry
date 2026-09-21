import { useEffect, useState } from 'react'
import type { Park } from '../types/park'
import type { CosmeticItem, CosmeticCategory } from '../types/shop'
import { getPark } from '../api/park'
import { getCatalog, purchaseItem, equipItem } from '../api/shop'
import { applyEquippedTheme } from '../lib/theme'

const categoryLabels: Record<CosmeticCategory, string> = {
  THEME: '테마',
  FONT: '폰트',
  ICON: '아이콘',
  EFFECT: '완료 이펙트',
}

const categoryOrder: CosmeticCategory[] = ['THEME', 'FONT', 'ICON', 'EFFECT']

export default function ParkPage() {
  const [park, setPark] = useState<Park | null>(null)
  const [catalog, setCatalog] = useState<CosmeticItem[]>([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)

  async function loadPark() {
    try {
      setPark(await getPark())
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  async function loadCatalog() {
    try {
      const items = await getCatalog()
      setCatalog(items)
      applyEquippedTheme(items)
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  useEffect(() => { loadPark(); loadCatalog() }, [])

  async function handlePurchase(item: CosmeticItem) {
    if (busyId) return
    setBusyId(item.id)
    try {
      await purchaseItem(item.id)
      await Promise.all([loadPark(), loadCatalog()])
    } catch (e) {
      setError(e instanceof Error ? e.message : '구매하지 못했습니다')
    } finally {
      setBusyId(null)
    }
  }

  async function handleEquip(item: CosmeticItem) {
    if (busyId) return
    setBusyId(item.id)
    try {
      await equipItem(item.id)
      await loadCatalog()
    } catch (e) {
      setError(e instanceof Error ? e.message : '착용하지 못했습니다')
    } finally {
      setBusyId(null)
    }
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

      <div className="mb-10 grid grid-cols-3 gap-3 sm:grid-cols-4">
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

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</p>
      )}

      <h2 className="mb-4 text-sm font-medium tracking-tight">상점</h2>

      {categoryOrder.map((category) => {
        const items = catalog.filter((item) => item.category === category)
        if (items.length === 0) return null
        return (
          <div key={category} className="mb-6">
            <p className="mb-2 text-xs text-neutral-500">{categoryLabels[category]}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 rounded-lg border border-neutral-200 p-3">
                  {item.category === 'THEME' && item.value && (
                    <span
                      className="h-6 w-6 flex-none rounded-full border border-neutral-200"
                      style={{ background: item.value }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{item.name}</p>
                    <p className="text-[11px] text-neutral-400">{item.price === 0 ? '무료' : `체리 ${item.price}`}</p>
                  </div>
                  {item.equipped ? (
                    <span className="flex-none text-[11px] font-medium" style={{ color: 'var(--cherry)' }}>착용중</span>
                  ) : item.owned || item.price === 0 ? (
                    <button
                      onClick={() => handleEquip(item)}
                      disabled={busyId === item.id}
                      className="flex-none rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium disabled:opacity-50"
                    >
                      착용
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={busyId === item.id}
                      className="flex-none rounded-md px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
                      style={{ background: 'var(--cherry)' }}
                    >
                      구매
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
