export const ALLERGENS = [
  {
    key: 'allergen_celery' as const,
    label: 'Celery',
    shortLabel: 'Celery',
    description: 'Celery and celeriac (including stalks, leaves, seeds and roots)',
  },
  {
    key: 'allergen_cereals_gluten' as const,
    label: 'Cereals containing gluten',
    shortLabel: 'Gluten',
    description: 'Wheat (spelt and khorasan), rye, barley, oats',
  },
  {
    key: 'allergen_crustaceans' as const,
    label: 'Crustaceans',
    shortLabel: 'Crustaceans',
    description: 'Crabs, lobster, prawns, scampi, shrimp',
  },
  {
    key: 'allergen_eggs' as const,
    label: 'Eggs',
    shortLabel: 'Eggs',
    description: 'Eggs from poultry',
  },
  {
    key: 'allergen_fish' as const,
    label: 'Fish',
    shortLabel: 'Fish',
    description: 'All fish species',
  },
  {
    key: 'allergen_lupin' as const,
    label: 'Lupin',
    shortLabel: 'Lupin',
    description: 'Lupin seeds and flour',
  },
  {
    key: 'allergen_milk' as const,
    label: 'Milk',
    shortLabel: 'Milk',
    description: 'Milk and dairy products including lactose',
  },
  {
    key: 'allergen_molluscs' as const,
    label: 'Molluscs',
    shortLabel: 'Molluscs',
    description: 'Clams, mussels, oysters, scallops, squid',
  },
  {
    key: 'allergen_mustard' as const,
    label: 'Mustard',
    shortLabel: 'Mustard',
    description: 'Mustard plant, seeds and products',
  },
  {
    key: 'allergen_nuts' as const,
    label: 'Tree nuts',
    shortLabel: 'Tree nuts',
    description: 'Almonds, hazelnuts, walnuts, cashews, pecans, Brazils, pistachios, macadamia',
  },
  {
    key: 'allergen_peanuts' as const,
    label: 'Peanuts',
    shortLabel: 'Peanuts',
    description: 'Peanuts and groundnuts',
  },
  {
    key: 'allergen_sesame' as const,
    label: 'Sesame seeds',
    shortLabel: 'Sesame',
    description: 'Sesame seeds and products',
  },
  {
    key: 'allergen_soya' as const,
    label: 'Soybeans',
    shortLabel: 'Soya',
    description: 'Soya and products thereof',
  },
  {
    key: 'allergen_sulphites' as const,
    label: 'Sulphur dioxide/sulphites',
    shortLabel: 'Sulphites',
    description: 'Sulphur dioxide and sulphites at >10mg/kg or >10mg/litre',
  },
] as const

export type AllergenKey = (typeof ALLERGENS)[number]['key']

export const ALLERGEN_KEYS = ALLERGENS.map((a) => a.key) as AllergenKey[]

export const UNIT_TYPES = ['kg', 'g', 'ml', 'litre', 'each'] as const
export type UnitType = (typeof UNIT_TYPES)[number]

export const RECIPE_CATEGORIES = [
  'Starters',
  'Mains',
  'Sides',
  'Desserts',
  'Drinks',
  'Snacks',
  'Specials',
  'Events',
] as const
