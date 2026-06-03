export interface AuditQuestion {
  key: string
  label: string
  category: string
  requiresPhotoOnFail?: boolean
}

export const AUDIT_QUESTIONS: AuditQuestion[] = [
  // Temperature Control
  { key: 'temp_fridge', category: 'Temperature Control', label: 'Fridge temperatures checked and within range (1–8°C)', requiresPhotoOnFail: true },
  { key: 'temp_freezer', category: 'Temperature Control', label: 'Freezer temperatures within range (−18°C or below)', requiresPhotoOnFail: true },
  { key: 'temp_hot_hold', category: 'Temperature Control', label: 'Hot holding above 63°C where applicable' },
  { key: 'temp_records', category: 'Temperature Control', label: 'Temperature records completed and up to date', requiresPhotoOnFail: true },

  // Personal Hygiene
  { key: 'hygiene_uniform', category: 'Personal Hygiene', label: 'All staff wearing clean uniforms and aprons' },
  { key: 'hygiene_handwash', category: 'Personal Hygiene', label: 'Correct handwashing procedures being followed' },
  { key: 'hygiene_jewellery', category: 'Personal Hygiene', label: 'No jewellery worn (except plain wedding band)' },
  { key: 'hygiene_illness', category: 'Personal Hygiene', label: 'No staff with illness/symptoms handling food' },

  // Storage
  { key: 'storage_separation', category: 'Storage', label: 'Raw meat stored below cooked and ready-to-eat foods', requiresPhotoOnFail: true },
  { key: 'storage_covered', category: 'Storage', label: 'All food covered and labelled with use-by dates', requiresPhotoOnFail: true },
  { key: 'storage_fifo', category: 'Storage', label: 'First in, first out (FIFO) being followed' },
  { key: 'storage_floor', category: 'Storage', label: 'No food stored directly on the floor' },

  // Cleaning
  { key: 'cleaning_schedule', category: 'Cleaning', label: 'Cleaning schedule up to date and signed off', requiresPhotoOnFail: true },
  { key: 'cleaning_surfaces', category: 'Cleaning', label: 'All food contact surfaces clean and sanitised' },
  { key: 'cleaning_equipment', category: 'Cleaning', label: 'Equipment clean and in good working condition' },
  { key: 'cleaning_waste', category: 'Cleaning', label: 'Waste bins emptied and clean' },

  // Allergen Management
  { key: 'allergen_info', category: 'Allergen Management', label: 'Allergen information accurate and up to date for all dishes' },
  { key: 'allergen_staff', category: 'Allergen Management', label: 'Staff aware of allergen procedures and customer queries' },
  { key: 'allergen_equipment', category: 'Allergen Management', label: 'Separate equipment or colour coding in use for allergens' },

  // HACCP & Records
  { key: 'haccp_docs', category: 'HACCP & Records', label: 'HACCP documents accessible and up to date', requiresPhotoOnFail: true },
  { key: 'haccp_deliveries', category: 'HACCP & Records', label: 'Delivery records completed and signed' },
  { key: 'haccp_labels', category: 'HACCP & Records', label: 'Date labelling in use throughout the kitchen' },

  // Pest Control
  { key: 'pest_evidence', category: 'Pest Control', label: 'No evidence of pest activity in kitchen or storage areas', requiresPhotoOnFail: true },
  { key: 'pest_records', category: 'Pest Control', label: 'Pest control records up to date' },
]

export const AUDIT_CATEGORIES = [...new Set(AUDIT_QUESTIONS.map(q => q.category))]
