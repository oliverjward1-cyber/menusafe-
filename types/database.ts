export type Role = 'owner' | 'manager' | 'head_chef' | 'chef' | 'foh'

export const STAFF_ROLES: { value: Role; label: string }[] = [
  { value: 'manager', label: 'Manager' },
  { value: 'head_chef', label: 'Head Chef' },
  { value: 'chef', label: 'Kitchen Staff' },
  { value: 'foh', label: 'Front of House' },
]

export interface Restaurant {
  id: string
  name: string
  slug: string
  target_gp: number
  created_at: string
}

export interface Profile {
  id: string
  restaurant_id: string | null
  role: Role
  full_name: string | null
  created_at: string
}

export interface Ingredient {
  id: string
  restaurant_id: string
  name: string
  cost_per_unit: number
  unit_type: string
  allergen_celery: boolean
  allergen_cereals_gluten: boolean
  allergen_crustaceans: boolean
  allergen_eggs: boolean
  allergen_fish: boolean
  allergen_lupin: boolean
  allergen_milk: boolean
  allergen_molluscs: boolean
  allergen_mustard: boolean
  allergen_nuts: boolean
  allergen_peanuts: boolean
  allergen_sesame: boolean
  allergen_soya: boolean
  allergen_sulphites: boolean
  kcal_per_100g: number | null
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  category: string | null
  portion_size: string | null
  sell_price: number | null
  status: 'draft' | 'approved' | 'rejected'
  is_active: boolean
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  ingredient_id: string
  quantity: number
  unit_type: string
  ingredients?: Ingredient
}

export interface RecipeWithIngredients extends Recipe {
  recipe_ingredients: (RecipeIngredient & { ingredients: Ingredient })[]
}

export interface StaffQuizAttempt {
  id: string
  restaurant_id: string
  staff_name: string
  score: number
  total_questions: number
  passed: boolean
  completed_at: string
}
