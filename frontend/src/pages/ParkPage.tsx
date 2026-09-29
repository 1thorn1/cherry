import { useEffect, useState } from 'react'
import { IconPlant2, IconTree } from '@tabler/icons-react'
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
      <h1 className="text-xl font-medium tracking-tight">농장</h1>
      <p className="mb-6 text-xs text-neutral-400">프로젝트가 자라는 곳</p>

      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          { value: park.population, label: '농장 규모' },
          { value: park.today_visitors, label: '오늘 수확량' },
          { value: park.point_balance, label: '체리' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="animate-pop-in rounded-2xl p-4 text-center shadow-[0_6px_18px_-8px_rgba(212,83,126,0.35)]"
            style={{
              background: 'linear-gradient(160deg, #fffaf7 0%, var(--cherry-bg) 100%)',
              animationDelay: `${i * 60}ms`,
            }}
          >
            <p className="text-2xl font-medium" style={{ color: 'var(--cherry)' }}>{stat.value}</p>
            <p className="text-xs text-neutral-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div
        className="mb-10 rounded-3xl p-4"
        style={{ background: 'linear-gradient(160deg, #f6f2e4 0%, #eef2df 100%)' }}
      >
        {park.slots.length === 0 && (
          <p className="py-8 text-center text-xs text-neutral-400">아직 심은 게 없어요</p>
        )}

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {park.slots.map((slot, i) => (
            <div
              key={slot.id}
              className="animate-pop-in flex aspect-square flex-col items-center justify-center rounded-2xl shadow-[0_4px_10px_-4px_rgba(0,0,0,0.15)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.2)]"
              style={{
                background: 'radial-gradient(circle at 32% 28%, #ffffff 0%, var(--cherry-bg) 55%, #f3d3de 100%)',
                animationDelay: `${i * 40}ms`,
              }}
            >
              <span className="animate-sway inline-flex">
                {slot.indoor ? (
                  <IconPlant2 size={28} stroke={1.5} color="var(--cherry)" />
                ) : (
                  <IconTree size={28} stroke={1.5} color="var(--cherry)" />
                )}
              </span>
              <span className="mt-1 text-[10px] text-neutral-400">#{slot.slot_index}</span>
            </div>
          ))}
        </div>
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
              {items.map((item, i) => (
                <div
                  key={item.id}
                  className="animate-pop-in flex items-center gap-2 rounded-2xl bg-white p-3 shadow-[0_3px_10px_-6px_rgba(0,0,0,0.2)] transition-transform duration-200 hover:-translate-y-0.5"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
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
                    <span
                      className="animate-glow-pulse flex-none rounded-full px-2 py-1 text-[11px] font-medium"
                      style={{ background: 'var(--cherry-bg)', color: 'var(--cherry)' }}
                    >
                      착용중
                    </span>
                  ) : item.owned || item.price === 0 ? (
                    <button
                      onClick={() => handleEquip(item)}
                      disabled={busyId === item.id}
                      className="flex-none rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium transition-transform active:scale-95 disabled:opacity-50"
                    >
                      착용
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(item)}
                      disabled={busyId === item.id}
                      className="flex-none rounded-full px-2.5 py-1 text-[11px] font-medium text-white transition-transform active:scale-95 disabled:opacity-50"
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
