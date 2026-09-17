import { request } from './client'
import type { Milestone, Project, ProjectDetail } from '../types/project'

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

export function completeMilestone(id: number) {
  return request<Milestone>(`/api/milestones/${id}/complete`, { method: 'PATCH' })
}
