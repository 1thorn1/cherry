// 라이트/다크 테마 선택. <html data-theme="light|dark"> 하나만 바꾸면 index.css의 토큰이 통째로 바뀐다.
// 'system'이면 OS 설정(prefers-color-scheme)을 읽어서 둘 중 하나로 정하고, OS 설정이 바뀌면 따라간다.
export type ColorScheme = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'cherry.colorScheme'
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

let current: ColorScheme = 'system'

export function getColorScheme(): ColorScheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // 사생활 보호 모드 등에서 localStorage가 막혀 있으면 시스템 설정을 따른다
  }
  return 'system'
}

function paint() {
  const dark = current === 'dark' || (current === 'system' && darkQuery.matches)
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

export function applyColorScheme(scheme: ColorScheme) {
  current = scheme
  paint()
}

export function saveColorScheme(scheme: ColorScheme) {
  try {
    if (scheme === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, scheme)
  } catch {
    // 저장이 안 돼도 이번 화면에는 적용된다
  }
  applyColorScheme(scheme)
}

darkQuery.addEventListener('change', paint)
