import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/', label: '오늘', end: true },
  { to: '/calendar', label: '캘린더', end: false },
  { to: '/projects', label: '프로젝트', end: false },
  { to: '/park', label: '공원', end: false },
]

export default function Layout() {
  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Outlet />

      <nav className="fixed bottom-0 left-0 right-0 flex border-t border-neutral-100 bg-white lg:hidden">
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
