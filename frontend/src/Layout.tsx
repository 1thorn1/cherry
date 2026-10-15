import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  IconCalendar,
  IconFolder,
  IconListCheck,
  IconMenu2,
  IconPlant2,
  IconSearch,
  IconSettings,
  IconTrophy,
  IconX,
} from '@tabler/icons-react'
import { getCatalog } from './api/shop'
import { getPark } from './api/park'
import { getProjects } from './api/projects'
import { applyEquippedTheme } from './lib/theme'
import { setBalance, useBalance } from './lib/balance'
import { BalanceBadge, CoinIcon } from './components/Coin'
import type { Project } from './types/project'
import OfflineStatus from './components/OfflineStatus'
import { getRoutines } from './api/routines'

// docs/design-system.md "틀" — 데스크톱(≥1024)은 왼쪽 사이드바, 모바일은 상단 잔액 바 + 하단 탭 바.
// 네 개의 주 메뉴는 두 곳이 같은 목록을 쓴다.
const tabs = [
  { to: '/', label: '오늘', end: true, icon: IconListCheck },
  { to: '/calendar', label: '캘린더', end: false, icon: IconCalendar },
  { to: '/projects', label: '프로젝트', end: false, icon: IconFolder },
  { to: '/park', label: '농장', end: false, icon: IconPlant2 },
]

// 사이드바에만 있는 보조 메뉴 (모바일에선 ≡ 서랍으로 연다)
const moreLinks = [
  { to: '/search', label: '검색', end: false, icon: IconSearch },
  { to: '/challenges', label: '같이 하기', end: false, icon: IconTrophy },
  { to: '/settings', label: '설정', end: false, icon: IconSettings },
]

// "내 프로젝트" 점 색 — 분류색 네 가지를 차례로 돌려 쓴다. 이름이 옆에 있어 색만으로 구분하지 않는다
const projectDots = ['var(--sprout)', 'var(--coin)', 'var(--sky)', 'var(--barn)']

function menuClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] transition-colors ${
    isActive
      ? 'bg-[var(--wood-soft)] font-semibold text-[var(--wood-deep)]'
      : 'text-[var(--ink-muted)] hover:bg-[var(--surface-sunken)]'
  }`
}

function SidebarContent({ projects, balance }: { projects: Project[]; balance: number | null }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link to="/" className="flex items-center gap-2.5 px-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--wood)] text-[var(--on-wood)]">
          <IconPlant2 size={18} stroke={1.8} />
        </span>
        <span className="font-display text-[18px] text-[var(--ink)]">체리</span>
      </Link>

      <nav aria-label="메뉴">
        <p className="mb-1.5 px-3 text-[12px] font-medium text-[var(--ink-muted)]">메뉴</p>
        <div className="flex flex-col gap-0.5">
          {[...tabs, ...moreLinks].map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className={menuClass}>
                <Icon size={18} stroke={1.8} />
                {item.label === '농장' ? '농장 가꾸기' : item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {projects.length > 0 && (
        <nav aria-label="내 프로젝트" className="min-h-0 overflow-y-auto">
          <p className="mb-1.5 px-3 text-[12px] font-medium text-[var(--ink-muted)]">내 프로젝트</p>
          <div className="flex flex-col gap-0.5">
            {projects.map((project, i) => (
              <NavLink key={project.id} to={`/projects/${project.id}`} className={menuClass}>
                <span
                  className="h-2.5 w-2.5 flex-none rounded-[3px]"
                  style={{ background: projectDots[i % projectDots.length] }}
                />
                <span className="truncate">{project.name}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      {/* 잔액은 모든 화면에 한 번 이상 — 데스크톱에선 사이드바 하단이 그 자리 */}
      <Link to="/park" className="mt-auto block rounded-2xl bg-[var(--coin-soft)] p-4">
        <p className="text-[12px] font-medium text-[var(--coin-ink)]">농장 자금</p>
        <p className="mt-1 flex items-center gap-2 font-display text-[28px] leading-[34px] tabular-nums text-[var(--ink)]">
          <CoinIcon size={20} />
          {balance === null ? '—' : balance.toLocaleString()}
        </p>
      </Link>
    </div>
  )
}

export default function Layout() {
  const balance = useBalance()
  const location = useLocation()
  const [projects, setProjects] = useState<Project[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    getCatalog().then(applyEquippedTheme).catch(() => {})
    getRoutines().catch(() => {})
  }, [])

  // 화면을 옮길 때마다 잔액·프로젝트 목록을 새로 받아 틀의 숫자가 늦지 않게 한다
  useEffect(() => {
    getPark().then((park) => setBalance(park.point_balance)).catch(() => {})
    getProjects()
      .then((list) => setProjects([...list].sort((a, b) => Number(b.starred) - Number(a.starred)).slice(0, 8)))
      .catch(() => {})
  }, [location.pathname])

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-60 flex-none border-r border-[var(--line)] bg-[var(--surface)] lg:block">
        <SidebarContent projects={projects} balance={balance} />
      </aside>

      <div className="min-w-0 flex-1 pb-24 lg:pb-0">
        {/* 모바일 상단 바: ≡ 서랍 · 잔액 배지 · 설정 */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-[var(--bg)] px-3 py-2 lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="메뉴 열기"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ink)]"
          >
            <IconMenu2 size={22} stroke={1.8} />
          </button>
          <Link to="/park">
            <BalanceBadge value={balance} />
          </Link>
          <NavLink
            to="/settings"
            aria-label="설정"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ink)] aria-[current=page]:text-[var(--wood)]"
          >
            <IconSettings size={22} stroke={1.8} />
          </NavLink>
        </header>

        <OfflineStatus />
        <Outlet />
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="메뉴">
          <button
            aria-label="메뉴 닫기"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-[var(--ink)]/30"
          />
          <aside
            // 서랍 안의 어떤 링크든 누르면 이동과 함께 닫는다
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('a')) setDrawerOpen(false)
            }}
            className="animate-drawer-in absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[var(--surface)] shadow-[var(--shadow-pop)]"
          >
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="메뉴 닫기"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--ink-muted)]"
            >
              <IconX size={20} stroke={1.8} />
            </button>
            <SidebarContent projects={projects} balance={balance} />
          </aside>
        </div>
      )}

      <nav
        aria-label="주 메뉴"
        className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[var(--line)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors duration-200 ${
                  isActive ? 'font-semibold text-[var(--cherry)]' : 'font-medium text-[var(--ink-muted)]'
                }`
              }
            >
              <Icon size={22} stroke={1.8} />
              {tab.label}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
