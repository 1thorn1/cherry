import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { IconCalendar, IconFolder, IconSettings, IconSun, IconTree } from '@tabler/icons-react'
import { getCatalog } from './api/shop'
import { applyEquippedTheme } from './lib/theme'

const tabs = [
  { to: '/', label: '오늘', end: true, icon: IconSun },
  { to: '/calendar', label: '캘린더', end: false, icon: IconCalendar },
  { to: '/projects', label: '프로젝트', end: false, icon: IconFolder },
  { to: '/park', label: '농장', end: false, icon: IconTree },
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
        className="fixed right-4 top-4 z-10 flex rounded-full bg-white p-2 text-neutral-500 shadow-[0_3px_10px_-4px_rgba(0,0,0,0.2)] transition-transform active:scale-95 aria-[current=page]:bg-[var(--cherry-bg)] aria-[current=page]:text-[var(--cherry)]"
      >
        <IconSettings size={20} stroke={1.75} />
      </NavLink>

      <Outlet />

      <nav className="fixed bottom-0 left-0 right-0 flex bg-white shadow-[0_-4px_16px_-10px_rgba(0,0,0,0.25)]">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-[var(--cherry)]' : 'text-neutral-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className="flex h-7 w-11 items-center justify-center rounded-full transition-colors duration-200"
                    style={{ background: isActive ? 'var(--cherry-bg)' : 'transparent' }}
                  >
                    <Icon size={18} stroke={1.75} />
                  </span>
                  {tab.label}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}
