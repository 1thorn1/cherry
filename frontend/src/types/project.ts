export type ProjectType = 'FREE' | 'PROGRESS' | 'EXAM'

export interface Project {
  id: number
  name: string
  type: ProjectType
  color: string
  total_units: number | null
  exam_date: string | null
  status: string
  shared: boolean
  work_days: number[]
  created_at: string
}

export interface Milestone {
  id: number
  seq: number
  title: string
  target_week: string | null
  completed: boolean
  completed_at: string | null
  scheduled_today: boolean
}

export interface ProjectDetail {
  project: Project
  milestones: Milestone[]
}

export type NoteKind = 'NOTE' | 'LINK' | 'RETRO'

export interface TimelineEntry {
  kind: 'AUTO_LOG' | NoteKind
  ref_id: number
  title: string | null
  body: string | null
  url: string | null
  count: number | null
  milestone_id: number | null
  note_date: string | null
  at: string
}

export interface ProjectLane {
  project_id: number
  name: string
  color: string
  start_date: string
  end_date: string | null
  open_ended: boolean
}

export interface MilestoneTrack {
  seq: number
  title: string
  completed: boolean
}

export interface FocusProject {
  project_id: number
  name: string
  type: ProjectType
  milestones: MilestoneTrack[]
  cart_index: number
}

export interface OtherProject {
  project_id: number
  name: string
  type: ProjectType
  color: string
  completed_milestones: number
  total_milestones: number
  key_metric: string
}

export interface ProjectOverview {
  overlap_warning: string | null
  weeks: string[]
  lanes: ProjectLane[]
  focus: FocusProject | null
  others: OtherProject[]
}
