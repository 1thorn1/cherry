import { Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import TodayPage from './pages/TodayPage'
import CalendarPage from './pages/CalendarPage'
import ProjectsPage from './pages/ProjectsPage'
import ParkPage from './pages/ParkPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TodayPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="park" element={<ParkPage />} />
      </Route>
    </Routes>
  )
}
