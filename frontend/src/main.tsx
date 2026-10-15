import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { applyColorScheme, getColorScheme } from './lib/colorScheme'

// 첫 화면을 그리기 전에 테마를 정해야 라이트→다크로 번쩍이지 않는다
applyColorScheme(getColorScheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
