import { request } from './client'
import type { Park } from '../types/park'

export function getPark() {
  return request<Park>('/api/park')
}
