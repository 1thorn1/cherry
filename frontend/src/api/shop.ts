import { request } from './client'
import type { CosmeticItem } from '../types/shop'

export function getCatalog() {
  return request<CosmeticItem[]>('/api/shop')
}

export function purchaseItem(id: number) {
  return request<CosmeticItem>(`/api/shop/${id}/purchase`, { method: 'POST' })
}

export function equipItem(id: number) {
  return request<CosmeticItem>(`/api/shop/${id}/equip`, { method: 'PATCH' })
}
