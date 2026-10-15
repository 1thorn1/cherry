import { useEffect, useState } from 'react'
import { IconShoppingBag } from '@tabler/icons-react'
import { getCatalog, purchaseItem, equipItem } from '../api/shop'
import { getPark } from '../api/park'
import { applyEquippedTheme } from '../lib/theme'
import { setBalance } from '../lib/balance'
import type { CosmeticCategory, CosmeticItem } from '../types/shop'
import { Card, ErrorBanner, PageHeader, PrimaryButton } from '../components/ui'
import { CoinIcon } from '../components/Coin'

const labels: Record<CosmeticCategory, string> = { THEME: '테마', FONT: '글꼴', ICON: '아이콘', EFFECT: '완료 이펙트' }
const order: CosmeticCategory[] = ['THEME', 'FONT', 'ICON', 'EFFECT']

export default function ShopPage() {
  const [items, setItems] = useState<CosmeticItem[]>([])
  const [balance, setLocalBalance] = useState(0)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState('')
  async function load() { try { const [catalog, park] = await Promise.all([getCatalog(), getPark()]); setItems(catalog); setLocalBalance(park.point_balance); setBalance(park.point_balance); applyEquippedTheme(catalog) } catch (e) { setError(e instanceof Error ? e.message : '상점을 불러오지 못했습니다') } }
  useEffect(() => { load() }, [])
  async function act(item: CosmeticItem) { setBusy(item.id); try { if (item.owned || item.price === 0) await equipItem(item.id); else await purchaseItem(item.id); await load() } catch (e) { setError(e instanceof Error ? e.message : '처리하지 못했습니다') } finally { setBusy(null) } }
  return <div className="mx-auto max-w-5xl px-5 py-6 lg:px-8 lg:py-10">
    <PageHeader crumb="상점" title="농장 상점" subtitle="모은 체리로 농장의 분위기를 꾸며보세요." action={<span className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--coin-soft)] px-3 text-[14px] font-semibold text-[var(--coin-ink)]"><CoinIcon size={16} />{balance.toLocaleString()}</span>} />
    {error && <ErrorBanner message={error} />}
    {order.map(category => { const group = items.filter(i => i.category === category); return group.length ? <section key={category} className="mb-8"><h2 className="mb-3 text-[16px] font-semibold text-[var(--ink)]">{labels[category]}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{group.map(item => <Card key={item.id} className="p-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--wood-soft)]" style={item.value ? { background: item.value } : undefined}><IconShoppingBag size={19} color="var(--wood-deep)" /></span><div className="min-w-0 flex-1"><p className="font-medium text-[var(--ink)]">{item.name}</p><p className="mt-1 text-[12px] text-[var(--ink-muted)]">{item.price ? `체리 ${item.price}` : '무료'}</p></div></div><div className="mt-4">{item.equipped ? <span className="inline-flex rounded-lg bg-[var(--sprout-soft)] px-2.5 py-2 text-[12px] font-semibold text-[var(--sprout)]">사용 중</span> : <PrimaryButton onClick={() => act(item)} disabled={busy === item.id} className="h-9 w-full text-[13px]">{item.owned || item.price === 0 ? '적용하기' : <><CoinIcon size={14} />{item.price} · 구매</>}</PrimaryButton>}</div></Card>)}</div></section> : null })}
  </div>
}
