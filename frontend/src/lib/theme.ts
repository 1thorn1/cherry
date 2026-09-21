import type { CosmeticItem } from '../types/shop'

export function applyEquippedTheme(items: CosmeticItem[]) {
  const theme = items.find((item) => item.category === 'THEME' && item.equipped)
  if (theme?.value) {
    document.documentElement.style.setProperty('--cherry', theme.value)
  }
}
