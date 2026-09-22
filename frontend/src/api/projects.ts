import { request } from './client'
import type { Milestone, NoteKind, Project, ProjectDetail, TimelineEntry } from '../types/project'

export function getProjects() {
  return request<Project[]>('/api/projects')
}

export function getProject(id: number) {
  return request<ProjectDetail>(`/api/projects/${id}`)
}

export interface CreateProjectInput {
  name: string
  type?: 'PROGRESS' | 'EXAM'
  total_units?: number
  exam_date?: string
}

export function createProject(input: CreateProjectInput) {
  return request<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateProjectShared(id: number, shared: boolean) {
  return request<Project>(`/api/projects/${id}/shared`, {
    method: 'PATCH',
    body: JSON.stringify({ shared }),
  })
}

export function completeMilestone(id: number) {
  return request<Milestone>(`/api/milestones/${id}/complete`, { method: 'PATCH' })
}

export function getTimeline(projectId: number) {
  return request<TimelineEntry[]>(`/api/projects/${projectId}/timeline`)
}

export function addNote(projectId: number, kind: NoteKind, body: string | null, url: string | null) {
  return request<void>(`/api/projects/${projectId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ kind, body, url }),
  })
}
