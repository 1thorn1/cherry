export type CosmeticCategory = 'THEME' | 'FONT' | 'ICON' | 'EFFECT'

export interface CosmeticItem {
  id: number
  category: CosmeticCategory
  code: string
  name: string
  value: string | null
  price: number
  owned: boolean
  equipped: boolean
}
