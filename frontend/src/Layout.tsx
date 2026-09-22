import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { IconSettings } from '@tabler/icons-react'
import { getCatalog } from './api/shop'
import { applyEquippedTheme } from './lib/theme'

const tabs = [
  { to: '/', label: '오늘', end: true },
  { to: '/calendar', label: '캘린더', end: false },
  { to: '/projects', label: '프로젝트', end: false },
  { to: '/park', label: '공원', end: false },
]

export default function Layout() {
  useEffect(() => {
    getCatalog().then(applyEquippedTheme).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen pb-20">
      <NavLink
        to="/settings"
        aria-label="설정"
        className="fixed right-4 top-4 z-10 flex rounded-full bg-white p-2 text-neutral-500 shadow-sm aria-[current=page]:bg-[var(--cherry-bg)] aria-[current=page]:text-[var(--cherry)]"
      >
        <IconSettings size={20} stroke={1.75} />
      </NavLink>

      <Outlet />

      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-neutral-100 bg-white">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className="flex-1 py-3 text-center text-[11px] text-neutral-400 aria-[current=page]:text-[var(--cherry)]"
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
