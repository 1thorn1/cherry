export interface AuthUser {
  id: number
  nickname: string
  email: string | null
  friend_code: string
  profile_image_url: string | null
}
