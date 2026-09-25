import { request } from './client'
import type { Challenge, ChallengeDetail, ChallengeProjectLink, ChallengeType } from '../types/challenge'

export interface CreateChallengeInput {
  title: string
  type?: Exclude<ChallengeType, 'FREE'>
  total_units?: number
  target_date?: string
}

export function getChallengeProjectLinks() {
  return request<ChallengeProjectLink[]>('/api/challenges/project-links')
}

export function createChallenge(input: CreateChallengeInput) {
  return request<Challenge>('/api/challenges', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function joinChallenge(inviteCode: string) {
  return request<Challenge>('/api/challenges/join', {
    method: 'POST',
    body: JSON.stringify({ invite_code: inviteCode }),
  })
}

export function getChallenge(id: number) {
  return request<ChallengeDetail>(`/api/challenges/${id}`)
}

export function setChallengePaused(id: number, paused: boolean) {
  return request<void>(`/api/challenges/${id}/pause`, {
    method: 'PATCH',
    body: JSON.stringify({ paused }),
  })
}

export function leaveChallenge(id: number) {
  return request<void>(`/api/challenges/${id}/leave`, { method: 'DELETE' })
}

export function setChallengeMemo(id: number, memo: string) {
  return request<void>(`/api/challenges/${id}/memo`, {
    method: 'PATCH',
    body: JSON.stringify({ memo }),
  })
}
