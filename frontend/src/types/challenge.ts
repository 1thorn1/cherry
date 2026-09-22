export type ChallengeType = 'FREE' | 'PROGRESS' | 'EXAM'

export interface Challenge {
  id: number
  title: string
  type: ChallengeType
  total_units: number | null
  target_date: string | null
  invite_code: string
}

export interface MemberProgress {
  nickname: string
  completed_milestones: number
  total_milestones: number
  recent_active_days: boolean[]
  paused: boolean
  me: boolean
}

export interface ChallengeDetail {
  id: number
  title: string
  type: ChallengeType
  invite_code: string
  members: MemberProgress[]
}

export interface ChallengeProjectLink {
  project_id: number
  challenge_id: number
  challenge_title: string
}
