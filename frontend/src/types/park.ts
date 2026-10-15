export interface ParkSlot {
  id: number
  slot_index: number
  ride_code: string
  indoor: boolean
}

export interface Park {
  population: number
  point_balance: number
  today_visitors: number
  today_points_earned: number
  slots: ParkSlot[]
}
