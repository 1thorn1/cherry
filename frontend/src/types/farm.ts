export interface FarmPlot {
  id: number
  crop_code: string
  project_id: number | null
  grid_x: number
  grid_y: number
  rotation: number
}

export interface RecipeIngredient {
  item_code: string
  amount: number
}

export interface Recipe {
  code: string
  name: string
  sprite_key: string
  minutes: number
  sell_price: number
  ingredients: RecipeIngredient[]
}

export interface Production {
  id: number
  recipe_code: string
  started_at: string
  done_at: string
}

export interface RecipeDiscovery {
  recipe_code: string
  first_made: string
  total_count: number
}

export interface VillagerRequest {
  id: number
  villager_name: string
  recipe_code: string
  recipe_name: string
  created_at: string
}

export interface Farm {
  plots: FarmPlot[]
  inventory: Record<string, number>
  recipes: Recipe[]
  pending_productions: Production[]
  discoveries: RecipeDiscovery[]
  villager_requests: VillagerRequest[]
}
