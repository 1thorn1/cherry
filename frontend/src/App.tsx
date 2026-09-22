import { Routes, Route } from 'react-router-dom'
import Layout from './Layout'
import TodayPage from './pages/TodayPage'
import CalendarPage from './pages/CalendarPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import SearchPage from './pages/SearchPage'
import ParkPage from './pages/ParkPage'
import SettingsPage from './pages/SettingsPage'
import ChallengesPage from './pages/ChallengesPage'
import ChallengeDetailPage from './pages/ChallengeDetailPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TodayPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="park" element={<ParkPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="challenges" element={<ChallengesPage />} />
        <Route path="challenges/:id" element={<ChallengeDetailPage />} />
      </Route>
    </Routes>
  )
}
