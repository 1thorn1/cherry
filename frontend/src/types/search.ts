export interface SearchResult {
  type: string
  ref_id: number
  text: string | null
  project_id: number | null
  project_name: string | null
  milestone_title: string | null
  at: string
}
