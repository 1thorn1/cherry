export const START_HOUR = 0
export const END_HOUR = 23
export const ROW_HEIGHT = 40

export type TimetableView = 'scheduled' | 'actual'

export function hourDroppableId(hour: number) {
  return `hour-${hour}`
}

export interface TimedBlock {
  key: string | number
  startMin: number
  endMin: number
}

export interface BlockLayout {
  key: string | number
  column: number
  columnCount: number
}

/**
 * 시간이 겹치는 블록끼리 그룹을 묶고, 그룹 안에서 그리디 인터벌 컬러링으로
 * 컬럼을 배정한다 (구글 캘린더가 겹치는 일정을 나란히 배치하는 방식과 동일).
 */
export function layoutOverlaps(blocks: TimedBlock[]): BlockLayout[] {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
  const layouts: BlockLayout[] = []

  let group: TimedBlock[] = []
  let groupEnd = -Infinity

  function flushGroup() {
    if (group.length === 0) return
    const columnEnds: number[] = []
    const assigned: { block: TimedBlock; column: number }[] = []

    for (const block of group) {
      let column = columnEnds.findIndex((end) => end <= block.startMin)
      if (column === -1) {
        column = columnEnds.length
        columnEnds.push(block.endMin)
      } else {
        columnEnds[column] = block.endMin
      }
      assigned.push({ block, column })
    }

    const columnCount = columnEnds.length
    for (const { block, column } of assigned) {
      layouts.push({ key: block.key, column, columnCount })
    }
    group = []
  }

  for (const block of sorted) {
    if (group.length === 0 || block.startMin < groupEnd) {
      group.push(block)
      groupEnd = Math.max(groupEnd, block.endMin)
    } else {
      flushGroup()
      group = [block]
      groupEnd = block.endMin
    }
  }
  flushGroup()

  return layouts
}

interface BlockStyleOptions {
  gutter?: number
  rightPad?: number
  gap?: number
}

/**
 * 시간표 상의 top/height와 겹침 컬럼 정보를 실제 CSS 스타일(px/calc)로 변환한다.
 * gutter: 왼쪽 시각 레이블용 여백, rightPad: 오른쪽 여백, gap: 컬럼 사이 간격
 */
export function blockPositionStyle(
  top: number,
  height: number,
  column: number,
  columnCount: number,
  { gutter = 0, rightPad = 0, gap = 2 }: BlockStyleOptions = {},
) {
  const sidePad = gutter + rightPad
  const fraction = 1 / columnCount
  const left = `calc(${gutter}px + (100% - ${sidePad}px) * ${fraction * column})`
  const width =
    column < columnCount - 1
      ? `calc((100% - ${sidePad}px) * ${fraction} - ${gap}px)`
      : `calc((100% - ${sidePad}px) * ${fraction})`

  return { top, height, left, width }
}

export function scrollToCurrentHour(el: HTMLElement | null, rowHeight = ROW_HEIGHT, startHour = START_HOUR) {
  if (!el) return
  const currentHour = new Date().getHours()
  el.scrollTop = Math.max(0, (currentHour - startHour - 1) * rowHeight)
}
