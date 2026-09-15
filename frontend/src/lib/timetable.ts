export const START_HOUR = 8
export const END_HOUR = 20

export type TimetableView = 'scheduled' | 'actual'

export function hourDroppableId(hour: number) {
  return `hour-${hour}`
}
