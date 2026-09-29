import { request } from './client'
import type { Farm } from '../types/farm'

export function getFarm() {
  return request<Farm>('/api/farm')
}

export function startProduction(recipeCode: string) {
  return request<void>('/api/farm/production', {
    method: 'POST',
    body: JSON.stringify({ recipe_code: recipeCode }),
  })
}

export function movePlot(plotId: number, gridX: number, gridY: number) {
  return request<void>(`/api/farm/plots/${plotId}`, {
    method: 'PATCH',
    body: JSON.stringify({ grid_x: gridX, grid_y: gridY }),
  })
}
