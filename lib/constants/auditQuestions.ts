export interface AuditQuestion {
  key: string
  label: string
  category: string
  requiresPhotoOnFail?: boolean
}

export type AuditType = 'general' | 'allergen' | 'gp_leaky_pipe'

export const AUDIT_TYPE_LABELS: Record<AuditType, string> = {
  general: 'General Kitchen Audit',
  allergen: 'Allergen Audit',
  gp_leaky_pipe: 'GP / Leaky Pipe Audit',
}

export const AUDIT_TYPE_DESCRIPTIONS: Record<AuditType, string> = {
  general: 'Food safety, hygiene, storage and cleaning checks',
  allergen: 'Allergen labelling, separation and staff knowledge checks',
  gp_leaky_pipe: 'Portion control, waste, stock and margin-protection checks',
}

export const GENERAL_AUDIT_QUESTIONS: AuditQuestion[] = [
  // Temperature Control
  { key: 'temp_fridge', category: 'Temperature Control', label: 'Fridge temperatures checked and within range (1–8°C)', requiresPhotoOnFail: true },
  { key: 'temp_freezer', category: 'Temperature Control', label: 'Freezer temperatures within range (−18°C or below)', requiresPhotoOnFail: true },
  { key: 'temp_probe', category: 'Temperature Control', label: 'Probe thermometer available, clean and calibrated' },
  { key: 'temp_records', category: 'Temperature Control', label: 'Temperature records completed and up to date', requiresPhotoOnFail: true },

  // Personal Hygiene
  { key: 'hygiene_uniform', category: 'Personal Hygiene', label: 'All staff wearing clean uniforms and aprons' },
  { key: 'hygiene_handwash', category: 'Personal Hygiene', label: 'Correct handwashing procedures being followed' },
  { key: 'hygiene_basin', category: 'Personal Hygiene', label: 'Dedicated handwash basin accessible, stocked with soap and paper towels', requiresPhotoOnFail: true },
  { key: 'hygiene_illness', category: 'Personal Hygiene', label: 'No staff with illness/symptoms handling food' },

  // Storage
  { key: 'storage_separation', category: 'Storage', label: 'Raw meat stored below cooked and ready-to-eat foods', requiresPhotoOnFail: true },
  { key: 'storage_covered', category: 'Storage', label: 'All food covered and labelled with use-by dates', requiresPhotoOnFail: true },
  { key: 'storage_fifo', category: 'Storage', label: 'First in, first out (FIFO) being followed' },

  // Preparation & Cross-Contamination
  { key: 'prep_colour_coded', category: 'Preparation & Cross-Contamination', label: 'Colour-coded chopping boards and knives in use and in good condition', requiresPhotoOnFail: true },
  { key: 'prep_surfaces', category: 'Preparation & Cross-Contamination', label: 'Prep surfaces cleaned and sanitised between tasks' },

  // Cleaning
  { key: 'cleaning_schedule', category: 'Cleaning', label: 'Cleaning schedule up to date and signed off', requiresPhotoOnFail: true },
  { key: 'cleaning_waste', category: 'Cleaning', label: 'Waste bins emptied and clean' },

  // Pest Control
  { key: 'pest_evidence', category: 'Pest Control', label: 'No evidence of pest activity in kitchen or storage areas', requiresPhotoOnFail: true },
]

export const ALLERGEN_AUDIT_QUESTIONS: AuditQuestion[] = [
  { key: 'allergen_info', category: 'Allergen Information', label: 'Allergen information accurate and up to date for all dishes' },
  { key: 'allergen_signage', category: 'Allergen Information', label: 'Allergen notices visible and accessible to customers' },
  { key: 'allergen_menu_matrix', category: 'Allergen Information', label: 'Allergen matrix/menu matches the dishes currently being served' },
  { key: 'allergen_specials', category: 'Allergen Information', label: 'Allergen info available for specials and seasonal dishes' },

  { key: 'allergen_staff_knowledge', category: 'Staff Knowledge', label: 'Staff can correctly explain allergens in at least 3 random dishes' },
  { key: 'allergen_staff_training', category: 'Staff Knowledge', label: 'Allergen training records up to date for all staff' },
  { key: 'allergen_new_starters', category: 'Staff Knowledge', label: 'New starters briefed on allergen procedures before working unsupervised' },

  { key: 'allergen_storage_separation', category: 'Preparation & Storage', label: 'Allergen ingredients stored separately or clearly labelled', requiresPhotoOnFail: true },
  { key: 'allergen_equipment', category: 'Preparation & Storage', label: 'Separate equipment or colour coding in use for allergen-free preparation', requiresPhotoOnFail: true },
  { key: 'allergen_prep_area', category: 'Preparation & Storage', label: 'Dedicated allergen-free prep area used and kept clear when in use' },
  { key: 'allergen_cross_contam', category: 'Preparation & Storage', label: 'No evidence of cross-contamination risk (shared fryers, utensils, surfaces)' },

  { key: 'allergen_recipe_cards', category: 'Recipe Accuracy', label: 'Recipe cards/specs reflect actual ingredients used (no undeclared substitutions)' },
  { key: 'allergen_supplier_specs', category: 'Recipe Accuracy', label: 'Supplier spec sheets checked when ingredients change' },

  { key: 'allergen_order_process', category: 'Customer Process', label: 'Clear process for handling allergen requests from front of house to kitchen' },
  { key: 'allergen_incident_log', category: 'Customer Process', label: 'Allergen incidents/near-misses logged and reviewed' },
]

export const GP_AUDIT_QUESTIONS: AuditQuestion[] = [
  { key: 'gp_portion_specs', category: 'Portion Control', label: 'Portions match recipe specs (weighed/measured, not eyeballed)' },
  { key: 'gp_recipe_cards', category: 'Portion Control', label: 'Recipe cards followed — no unauthorised substitutions' },
  { key: 'gp_yield_checks', category: 'Portion Control', label: 'Yield checks on high-cost items (meat, fish) done periodically' },

  { key: 'gp_waste_log', category: 'Waste & Stock', label: 'Waste log completed and reviewed daily', requiresPhotoOnFail: true },
  { key: 'gp_stock_take', category: 'Waste & Stock', label: 'Stock take completed on schedule, variance reviewed' },
  { key: 'gp_storage_rotation', category: 'Waste & Stock', label: 'Storage and rotation prevents spoilage write-offs' },
  { key: 'gp_overproduction', category: 'Waste & Stock', label: 'Over-production / unsold prep tracked and minimised' },

  { key: 'gp_deliveries', category: 'Purchasing', label: 'Goods received checked against delivery notes & invoiced prices' },

  { key: 'gp_pours', category: 'Bar & Service Controls', label: 'Free-pour vs measured spirits — optics/jiggers in use' },
  { key: 'gp_comps_voids', category: 'Bar & Service Controls', label: 'Comps/voids/discounts recorded and authorised by manager' },
  { key: 'gp_menu_pricing', category: 'Bar & Service Controls', label: 'Menu prices match POS pricing' },

  { key: 'gp_staff_meals', category: 'Staffing', label: 'Staff meals recorded and costed' },
]

export const AUDIT_QUESTION_SETS: Record<AuditType, AuditQuestion[]> = {
  general: GENERAL_AUDIT_QUESTIONS,
  allergen: ALLERGEN_AUDIT_QUESTIONS,
  gp_leaky_pipe: GP_AUDIT_QUESTIONS,
}

// Backwards-compatible export (defaults to general set)
export const AUDIT_QUESTIONS = GENERAL_AUDIT_QUESTIONS

export const AUDIT_CATEGORIES = Array.from(new Set(AUDIT_QUESTIONS.map(q => q.category)))
