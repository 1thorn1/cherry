import { request } from './client'
import type { AuthUser } from '../types/auth'

export function getMe() {
  return request<AuthUser>('/api/auth/me')
}

export function logout() {
  return request<void>('/api/auth/logout', { method: 'POST' })
}
