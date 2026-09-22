export interface FriendCode {
  friend_code: string
}

export interface PendingRequest {
  friendship_id: number
  requester_nickname: string
  requested_at: string
}

export interface Friend {
  friendship_id: number
  nickname: string
  since: string
}
