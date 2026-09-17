import { request } from './client'
import type { SearchResult } from '../types/search'

export function search(query: string) {
  return request<SearchResult[]>(`/api/search?q=${encodeURIComponent(query)}`)
}
