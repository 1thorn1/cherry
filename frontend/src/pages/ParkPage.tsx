import { useEffect, useState } from 'react'
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { IconPlant2, IconTree } from '@tabler/icons-react'
import type { Park } from '../types/park'
import type { Farm, FarmPlot } from '../types/farm'
import type { CosmeticItem, CosmeticCategory } from '../types/shop'
import { getPark } from '../api/park'
import { getFarm, startProduction, movePlot } from '../api/farm'
import { getCatalog, purchaseItem, equipItem } from '../api/shop'
import { applyEquippedTheme } from '../lib/theme'

// 서버의 FarmService.GRID_WIDTH/HEIGHT와 맞춘 값. 스펙 9절 "꾸미기"용 배치 그리드.
const GRID_WIDTH = 4
const GRID_HEIGHT = 5

function cellId(x: number, y: number) {
  return `farm-cell-${x}-${y}`
}

function PlotTile({ plot }: { plot: FarmPlot }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: plot.id })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        background: 'radial-gradient(circle at 32% 28%, #ffffff 0%, var(--cherry-bg) 55%, #f3d3de 100%)',
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="flex h-full w-full cursor-grab flex-col items-center justify-center rounded-2xl shadow-[0_4px_10px_-4px_rgba(0,0,0,0.15)] transition-transform duration-200 active:cursor-grabbing"
    >
      <span className="animate-sway inline-flex">
        {plot.crop_code === 'cherry_tree' ? (
          <IconTree size={28} stroke={1.5} color="var(--cherry)" />
        ) : (
          <IconPlant2 size={28} stroke={1.5} color="var(--cherry)" />
        )}
      </span>
      <span className="mt-1 text-[10px] text-neutral-400">#{plot.id}</span>
    </div>
  )
}

function PlotCell({ x, y, plot }: { x: number; y: number; plot: FarmPlot | undefined }) {
  const { setNodeRef, isOver } = useDroppable({ id: cellId(x, y) })
  return (
    <div
      ref={setNodeRef}
      className={`aspect-square rounded-2xl ${isOver ? 'ring-2 ring-[var(--cherry)]' : ''} ${!plot ? 'border border-dashed border-neutral-200' : ''}`}
    >
      {plot && <PlotTile plot={plot} />}
    </div>
  )
}

const itemLabels: Record<string, string> = {
  cherry: '체리',
  sugar: '설탕',
  milk: '우유',
  dough: '반죽',
  cherry_jam: '체리잼',
  cherry_latte: '체리 라떼',
  cherry_pie: '체리 파이',
}

function itemLabel(code: string) {
  return itemLabels[code] ?? code
}

function minutesLeft(doneAt: string) {
  return Math.max(0, Math.ceil((new Date(doneAt).getTime() - Date.now()) / 60000))
}

const categoryLabels: Record<CosmeticCategory, string> = {
  THEME: '테마',
  FONT: '폰트',
  ICON: '아이콘',
  EFFECT: '완료 이펙트',
}

const categoryOrder: CosmeticCategory[] = ['THEME', 'FONT', 'ICON', 'EFFECT']

export default function ParkPage() {
  const [park, setPark] = useState<Park | null>(null)
  const [farm, setFarm] = useState<Farm | null>(null)
  const [catalog, setCatalog] = useState<CosmeticItem[]>([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<number | null>(null)
  const [makingRecipe, setMakingRecipe] = useState<string | null>(null)

  async function loadPark() {
    try {
      setPark(await getPark())
    } catch (e) {
      setError(e instanceof Error ? e.message : '불러오지 못했습니다')
    }
  }

  async function loadFarm() {
    try {
      setFarm(await getFarm())
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

  useEffect(() => { loadPark(); loadFarm(); loadCatalog() }, [])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const match = String(over.id).match(/^farm-cell-(\d+)-(\d+)$/)
    if (!match) return
    const [, xStr, yStr] = match
    try {
      await movePlot(Number(active.id), Number(xStr), Number(yStr))
      await loadFarm()
    } catch (e) {
      setError(e instanceof Error ? e.message : '옮기지 못했습니다')
    }
  }

  async function handleStartProduction(recipeCode: string) {
    if (makingRecipe) return
    setMakingRecipe(recipeCode)
    try {
      await startProduction(recipeCode)
      await loadFarm()
    } catch (e) {
      setError(e instanceof Error ? e.message : '만들지 못했습니다')
    } finally {
      setMakingRecipe(null)
    }
  }

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

  if (!park || !farm) {
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
        {farm.plots.length === 0 && (
          <p className="mb-3 text-center text-xs text-neutral-400">아직 심은 게 없어요</p>
        )}

        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))` }}>
            {Array.from({ length: GRID_HEIGHT }, (_, y) =>
              Array.from({ length: GRID_WIDTH }, (_, x) => (
                <PlotCell key={cellId(x, y)} x={x} y={y} plot={farm.plots.find((p) => p.grid_x === x && p.grid_y === y)} />
              )),
            )}
          </div>
        </DndContext>
        <p className="mt-2 text-[10px] text-neutral-300">밭을 끌어서 자리를 바꿀 수 있어요</p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-xs text-red-600">{error}</p>
      )}

      <h2 className="mb-3 text-sm font-medium tracking-tight">창고</h2>
      {Object.keys(farm.inventory).length === 0 ? (
        <p className="mb-8 text-xs text-neutral-300">아직 모은 재료가 없어요. 마일스톤을 완료해서 체리를 모아보세요</p>
      ) : (
        <div className="mb-8 flex flex-wrap gap-2">
          {Object.entries(farm.inventory).map(([code, amount]) => (
            <span
              key={code}
              className="rounded-full px-3 py-1 text-[11px] font-medium"
              style={{ background: 'var(--cherry-bg)', color: 'var(--cherry)' }}
            >
              {itemLabel(code)} {amount}
            </span>
          ))}
        </div>
      )}

      <h2 className="mb-3 text-sm font-medium tracking-tight">주민</h2>
      {farm.villager_requests.length === 0 ? (
        <p className="mb-8 text-xs text-neutral-300">요즘 오는 사람이 없어요</p>
      ) : (
        <div className="mb-8 space-y-2">
          <p className="text-[11px] text-neutral-400">지금 체리 {park.point_balance}개</p>
          {farm.villager_requests.map((req, i) => (
            <div
              key={req.id}
              className="animate-pop-in rounded-2xl bg-white p-3 text-xs text-neutral-600 shadow-[0_3px_10px_-6px_rgba(0,0,0,0.2)]"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="font-medium">{req.villager_name}</span> · {req.recipe_name} 만들어주면 좋아할 것 같아요
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 text-sm font-medium tracking-tight">가공</h2>
      <div className="mb-10 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {farm.recipes.map((recipe, i) => {
          const missing = recipe.ingredients.filter(
            (ing) => (farm.inventory[ing.item_code] ?? 0) < ing.amount,
          )
          const inProgress = farm.pending_productions.find((p) => p.recipe_code === recipe.code)
          return (
            <div
              key={recipe.code}
              className="animate-pop-in rounded-2xl bg-white p-3 shadow-[0_3px_10px_-6px_rgba(0,0,0,0.2)]"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-medium">{recipe.name}</p>
                <span className="text-[11px] text-neutral-400">체리 {recipe.sell_price}</span>
              </div>
              <p className="mb-2 text-[11px] text-neutral-400">
                {recipe.ingredients.map((ing) => `${itemLabel(ing.item_code)} ${ing.amount}`).join(' + ')}
              </p>
              {inProgress ? (
                <span className="inline-block rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-500">
                  가공 중 · {minutesLeft(inProgress.done_at)}분 후 완성
                </span>
              ) : (
                <button
                  onClick={() => handleStartProduction(recipe.code)}
                  disabled={missing.length > 0 || makingRecipe === recipe.code}
                  className="rounded-full px-3 py-1 text-[11px] font-medium text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
                  style={{ background: missing.length > 0 ? undefined : 'var(--cherry)' }}
                >
                  만들기
                </button>
              )}
            </div>
          )
        })}
      </div>

      {farm.discoveries.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-3 text-sm font-medium tracking-tight">도감</h2>
          <div className="flex flex-wrap gap-2">
            {farm.discoveries.map((d) => (
              <span key={d.recipe_code} className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] text-neutral-500">
                {itemLabel(d.recipe_code)} · {d.total_count}개 만듦
              </span>
            ))}
          </div>
        </div>
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
