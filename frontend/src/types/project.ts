export type ProjectType = 'FREE' | 'PROGRESS' | 'EXAM'

export interface Project {
  id: number
  name: string
  type: ProjectType
  color: string
  total_units: number | null
  exam_date: string | null
  status: string
}

export interface Milestone {
  id: number
  seq: number
  title: string
  target_week: string | null
  completed: boolean
}

export interface ProjectDetail {
  project: Project
  milestones: Milestone[]
}
