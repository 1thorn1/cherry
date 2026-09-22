import { request } from './client'
import type { TaskParseResult } from '../types/parse'

export function parseTask(text: string) {
  return request<TaskParseResult>('/api/parse/task', {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}
