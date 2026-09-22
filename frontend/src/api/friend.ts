import { request } from './client'
import type { Friend, FriendCode, FriendPark, PendingRequest, SharingSettings } from '../types/friend'

export function getMyFriendCode() {
  return request<FriendCode>('/api/friends/code')
}

export function sendFriendRequest(friendCode: string) {
  return request<void>('/api/friends', {
    method: 'POST',
    body: JSON.stringify({ friend_code: friendCode }),
  })
}

export function getPendingRequests() {
  return request<PendingRequest[]>('/api/friends/requests')
}

export function acceptFriendRequest(friendshipId: number) {
  return request<void>(`/api/friends/${friendshipId}/accept`, { method: 'PATCH' })
}

export function removeFriendship(friendshipId: number) {
  return request<void>(`/api/friends/${friendshipId}`, { method: 'DELETE' })
}

export function getFriends() {
  return request<Friend[]>('/api/friends')
}

export function getFriendPark(friendshipId: number) {
  return request<FriendPark>(`/api/friends/${friendshipId}/park`)
}

export function visitFriendPark(friendshipId: number) {
  return request<void>(`/api/friends/${friendshipId}/visit`, { method: 'POST' })
}

export function getSharingSettings() {
  return request<SharingSettings>('/api/friends/settings')
}

export function updateSharingSettings(settings: SharingSettings) {
  return request<SharingSettings>('/api/friends/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}
