import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { IconArrowsMove, IconBox, IconPlant2, IconSparkles, IconTree } from '@tabler/icons-react'
import type { Park } from '../types/park'
import type { Farm, FarmPlot } from '../types/farm'
import { getPark } from '../api/park'
import { setBalance } from '../lib/balance'
import { getFarm, startProduction, movePlot } from '../api/farm'
import { Card, EmptyState, ErrorBanner, PageHeader } from '../components/ui'
import { CoinIcon } from '../components/Coin'
import FarmScene from '../components/FarmScene'

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
        background: 'var(--soil)',
        boxShadow: 'inset 0 -3px 0 var(--soil-deep)',
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className="flex h-full w-full cursor-grab flex-col items-center justify-center rounded-[18%] transition-transform duration-200 active:cursor-grabbing"
    >
      <span className="animate-sway inline-flex">
        {plot.crop_code === 'cherry_tree' ? (
          <IconTree size={28} stroke={1.5} color="var(--farm-barn)" />
        ) : (
          <IconPlant2 size={28} stroke={1.5} color="var(--sprout)" />
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
      className={`aspect-square [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)] ${isOver ? 'ring-2 ring-[var(--wood)]' : ''} ${!plot ? 'border border-dashed border-[var(--line-strong)] bg-[var(--surface-sunken)]' : ''}`}
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

const seasonLabels: Record<string, string> = {
  SPRING: '봄',
  SUMMER: '여름',
  FALL: '가을',
  WINTER: '겨울',
}

export default function ParkPage() {
  const [park, setPark] = useState<Park | null>(null)
  const [farm, setFarm] = useState<Farm | null>(null)
  const [error, setError] = useState('')
  const [makingRecipe, setMakingRecipe] = useState<string | null>(null)
  const [fieldView, setFieldView] = useState<'farm' | 'arrange'>('farm')

  async function loadPark() {
    try {
      const next = await getPark()
      setPark(next)
      setBalance(next.point_balance)
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

  useEffect(() => { loadPark(); loadFarm() }, [])

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

  if (!park || !farm) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
        {error ? <ErrorBanner message={error} /> : <p className="text-xs text-[var(--ink-muted)]">농장을 불러오는 중...</p>}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
      <PageHeader crumb="농장 가꾸기" title="나의 농장" subtitle={`프로젝트가 자라는 곳 · 지금은 ${seasonLabels[farm.season]}`} />

      <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { value: park.population, label: '농장 규모', color: 'var(--wood-deep)', bg: 'var(--wood-soft)' },
          { value: park.today_points_earned, label: '오늘 수확량', color: 'var(--sprout)', bg: 'var(--sprout-soft)' },
          { value: park.point_balance, label: '체리', color: 'var(--coin-ink)', bg: 'var(--coin-soft)' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="animate-pop-in rounded-2xl p-4 text-center sm:p-5"
            style={{
              background: stat.bg,
              animationDelay: `${i * 60}ms`,
            }}
          >
            <p className="font-display text-[24px] leading-8 sm:text-[28px]" style={{ color: stat.color }}>{stat.label === '체리' && <CoinIcon size={18} />}{stat.value}</p>
            <p className="mt-1 text-[12px] text-[var(--ink-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      <Card className="mb-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-4 sm:px-5">
          <div>
            <h2 className="font-display text-[20px] leading-7 text-[var(--ink)]">들판</h2>
            <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">{fieldView === 'farm' ? '계절에 따라 달라지는 나의 농장' : '작물을 끌어 자리를 바꿀 수 있어요.'}</p>
          </div>
          <div className="inline-flex rounded-xl bg-[var(--surface-sunken)] p-1 text-[12px]">
            <button onClick={() => setFieldView('farm')} className={`rounded-lg px-2.5 py-1.5 font-medium ${fieldView === 'farm' ? 'bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-card)]' : 'text-[var(--ink-muted)]'}`}>농장</button>
            <button onClick={() => setFieldView('arrange')} className={`rounded-lg px-2.5 py-1.5 font-medium ${fieldView === 'arrange' ? 'bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow-card)]' : 'text-[var(--ink-muted)]'}`}>배치</button>
          </div>
        </div>
        <div className="overflow-hidden p-4 sm:p-5" style={{ background: 'var(--hay)' }}>
        {farm.plots.length === 0 && (
          <EmptyState icon={<IconPlant2 size={28} stroke={1.5} />} title="아직 심은 게 없어요" hint="프로젝트를 완료하면 농장이 자라요." />
        )}

        {fieldView === 'farm' ? (
          <div className="mx-auto max-w-3xl"><FarmScene plots={farm.plots} season={farm.season} producing={farm.pending_productions.length > 0} /><p className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--ink-muted)]"><IconSparkles size={14} /> 프로젝트를 끝낼수록 작물이 자라요.</p></div>
        ) : (
          <>
            <DndContext onDragEnd={handleDragEnd}>
              <div className="mx-auto grid max-w-lg grid-cols-4 gap-2 py-4">
                {Array.from({ length: GRID_HEIGHT }, (_, y) => Array.from({ length: GRID_WIDTH }, (_, x) => (
                  <PlotCell key={cellId(x, y)} x={x} y={y} plot={farm.plots.find((p) => p.grid_x === x && p.grid_y === y)} />
                )))}
              </div>
            </DndContext>
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[var(--ink-muted)]"><IconArrowsMove size={14} /> 밭을 끌어서 자리를 바꿀 수 있어요</p>
          </>
        )}
        </div>
      </Card>

      {error && <ErrorBanner message={error} />}

      <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card className="p-4 sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-[var(--ink)]"><IconBox size={18} stroke={1.8} /> 창고</h2>
      {Object.keys(farm.inventory).length === 0 ? (
        <EmptyState icon={<IconBox size={24} stroke={1.5} />} title="아직 모은 재료가 없어요" hint="마일스톤을 완료해서 재료를 모아보세요." />
      ) : (
        <div className="flex flex-wrap gap-2">
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

      </Card>
      <Card className="p-4 sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-[var(--ink)]"><IconPlant2 size={18} stroke={1.8} /> 주민</h2>
      {farm.villager_requests.length === 0 ? (
        <EmptyState icon={<IconPlant2 size={24} stroke={1.5} />} title="요즘 오는 주민이 없어요" hint="가공품을 만들면 새로운 주민을 만날 수 있어요." />
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-neutral-400">지금 체리 {park.point_balance}개</p>
          {farm.villager_requests.map((req, i) => (
            <div
              key={req.id}
              className="animate-pop-in rounded-2xl bg-white p-3 text-xs text-neutral-600 border border-[var(--line)] shadow-[var(--shadow-card)]"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="font-medium">{req.villager_name}</span> · {req.recipe_name} 만들어주면 좋아할 것 같아요
            </div>
          ))}
        </div>
      )}
      </Card>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card className="p-4 sm:p-5"><div className="flex items-center justify-between"><div><h2 className="text-[16px] font-semibold text-[var(--ink)]">최근 적립</h2><p className="mt-1 text-[13px] text-[var(--ink-muted)]">오늘 완료한 일에서 모은 체리예요.</p></div><span className="inline-flex items-center gap-1 rounded-lg bg-[var(--coin-soft)] px-2.5 py-1.5 text-[13px] font-semibold text-[var(--coin-ink)]"><CoinIcon size={14} />+{park.today_points_earned}</span></div></Card>
        <Card className="p-4 sm:p-5"><h2 className="text-[16px] font-semibold text-[var(--ink)]">농장 상점</h2><p className="mt-1 text-[13px] text-[var(--ink-muted)]">농작물을 키우는 데 필요한 물건이에요.</p><div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--sprout-soft)] px-3 py-2"><span className="text-[13px] font-medium text-[var(--ink)]">🌱 씨앗 꾸러미</span><span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--coin-ink)]"><CoinIcon size={13} />30</span></div></Card>
      </div>

      <Link to="/shop" className="mb-8 flex items-center justify-between rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] transition-colors hover:bg-[var(--surface-sunken)] sm:p-5"><span><span className="block text-[16px] font-semibold text-[var(--ink)]">테마 상점</span><span className="mt-1 block text-[13px] text-[var(--ink-muted)]">앱의 테마와 아이콘, 효과를 꾸며보세요.</span></span><span className="rounded-xl bg-[var(--wood)] px-3 py-2 text-[13px] font-semibold text-[var(--on-wood)]">쇼핑하러가기</span></Link>

      <h2 className="mb-3 text-[16px] font-semibold text-[var(--ink)]">가공</h2>
      <div className="mb-10 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {farm.recipes.map((recipe, i) => {
          const missing = recipe.ingredients.filter(
            (ing) => (farm.inventory[ing.item_code] ?? 0) < ing.amount,
          )
          const inProgress = farm.pending_productions.find((p) => p.recipe_code === recipe.code)
          return (
            <div
              key={recipe.code}
              className="animate-pop-in rounded-2xl bg-white p-3 border border-[var(--line)] shadow-[var(--shadow-card)]"
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

    </div>
  )
}
