import { request } from './client'
import type { AuthUser } from '../types/auth'

export function getMe() {
  return request<AuthUser>('/api/auth/me')
}

export function logout() {
  return request<void>('/api/auth/logout', { method: 'POST' })
}

export function updateNickname(nickname: string) {
  return request<AuthUser>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify({ nickname }),
  })
}

export function uploadProfileImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request<AuthUser>('/api/users/me/profile-image', {
    method: 'POST',
    body: formData,
    headers: {},
  })
}
