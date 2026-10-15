import assert from 'node:assert/strict'
import test from 'node:test'
import { calendarColumnWidth, layoutOverlaps } from '../src/lib/timetable.ts'

test('overlapping tasks remain separate with readable width for each', () => {
  const blocks = [{ key: 1, startMin: 540, endMin: 600 }, { key: 2, startMin: 550, endMin: 610 }]
  const layout = layoutOverlaps(blocks)
  assert.equal(layout.length, 2)
  assert.deepEqual(layout.map((block) => block.column), [0, 1])
  assert.equal(calendarColumnWidth(blocks), 296)
  assert.equal((calendarColumnWidth(blocks) - 8) / layout[0].columnCount, 144)
})

test('three overlapping tasks get three lanes and preserve their identities', () => {
  const blocks = [1, 2, 3].map((key) => ({ key, startMin: 540, endMin: 600 }))
  assert.deepEqual(layoutOverlaps(blocks).map((block) => block.key), [1, 2, 3])
  assert.equal(calendarColumnWidth(blocks), 440)
})

test('adjacent tasks and empty days use one lane', () => {
  assert.equal(calendarColumnWidth([]), 152)
  const blocks = [{ key: 1, startMin: 540, endMin: 570 }, { key: 2, startMin: 570, endMin: 600 }]
  assert.equal(calendarColumnWidth(blocks), 152)
})

test('routine previews have independent lanes alongside scheduled tasks', () => {
  const blocks = [{ key: 1, startMin: 540, endMin: 600 }, { key: 'preview-2', startMin: 540, endMin: 570 }]
  assert.equal(layoutOverlaps(blocks).length, 2)
  assert.equal(calendarColumnWidth(blocks), 296)
})
