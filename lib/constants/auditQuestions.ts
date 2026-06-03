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
  { key: 'temp_probe', category: 'Temperature Control', label: 'Probe thermometer available, clean and calibrated' },
  { key: 'temp_defrost', category: 'Temperature Control', label: 'Food being defrosted safely (in fridge, not at room temperature)' },
  { key: 'temp_records', category: 'Temperature Control', label: 'Temperature records completed and up to date', requiresPhotoOnFail: true },

  // Personal Hygiene
  { key: 'hygiene_uniform', category: 'Personal Hygiene', label: 'All staff wearing clean uniforms and aprons' },
  { key: 'hygiene_handwash', category: 'Personal Hygiene', label: 'Correct handwashing procedures being followed' },
  { key: 'hygiene_basin', category: 'Personal Hygiene', label: 'Dedicated handwash basin accessible, stocked with soap and paper towels', requiresPhotoOnFail: true },
  { key: 'hygiene_signage', category: 'Personal Hygiene', label: 'Handwashing signs displayed at all wash stations' },
  { key: 'hygiene_jewellery', category: 'Personal Hygiene', label: 'No jewellery worn (except plain wedding band)' },
  { key: 'hygiene_illness', category: 'Personal Hygiene', label: 'No staff with illness/symptoms handling food' },
  { key: 'hygiene_training', category: 'Personal Hygiene', label: 'Staff food hygiene training records up to date and available' },

  // Storage
  { key: 'storage_separation', category: 'Storage', label: 'Raw meat stored below cooked and ready-to-eat foods', requiresPhotoOnFail: true },
  { key: 'storage_covered', category: 'Storage', label: 'All food covered and labelled with use-by dates', requiresPhotoOnFail: true },
  { key: 'storage_fifo', category: 'Storage', label: 'First in, first out (FIFO) being followed' },
  { key: 'storage_floor', category: 'Storage', label: 'No food stored directly on the floor' },

  // Preparation & Cross-Contamination
  { key: 'prep_colour_coded', category: 'Preparation & Cross-Contamination', label: 'Colour-coded chopping boards and knives in use and in good condition', requiresPhotoOnFail: true },
  { key: 'prep_raw_rte', category: 'Preparation & Cross-Contamination', label: 'Raw and ready-to-eat foods kept clearly separated during preparation' },
  { key: 'prep_surfaces', category: 'Preparation & Cross-Contamination', label: 'Prep surfaces cleaned and sanitised between tasks' },

  // Cleaning
  { key: 'cleaning_schedule', category: 'Cleaning', label: 'Cleaning schedule up to date and signed off', requiresPhotoOnFail: true },
  { key: 'cleaning_surfaces', category: 'Cleaning', label: 'All food contact surfaces clean and sanitised' },
  { key: 'cleaning_equipment', category: 'Cleaning', label: 'Equipment clean and in good working condition' },
  { key: 'cleaning_waste', category: 'Cleaning', label: 'Waste bins emptied and clean' },

  // Allergen Management
  { key: 'allergen_info', category: 'Allergen Management', label: 'Allergen information accurate and up to date for all dishes' },
  { key: 'allergen_signage', category: 'Allergen Management', label: 'Allergen notices visible and accessible to customers' },
  { key: 'allergen_staff', category: 'Allergen Management', label: 'Staff aware of allergen procedures and able to handle customer queries' },
  { key: 'allergen_equipment', category: 'Allergen Management', label: 'Separate equipment or colour coding in use for allergen-free preparation' },

  // HACCP & Records
  { key: 'haccp_sfbb', category: 'HACCP & Records', label: 'Safer Food Better Business (SFBB) pack or equivalent in use and up to date', requiresPhotoOnFail: true },
  { key: 'haccp_docs', category: 'HACCP & Records', label: 'HACCP documents accessible and reviewed within last 12 months', requiresPhotoOnFail: true },
  { key: 'haccp_deliveries', category: 'HACCP & Records', label: 'Delivery records completed and signed' },
  { key: 'haccp_labels', category: 'HACCP & Records', label: 'Date labelling in use throughout the kitchen' },

  // Pest Control
  { key: 'pest_evidence', category: 'Pest Control', label: 'No evidence of pest activity in kitchen or storage areas', requiresPhotoOnFail: true },
  { key: 'pest_records', category: 'Pest Control', label: 'Pest control contractor records up to date' },
]

export const AUDIT_CATEGORIES = Array.from(new Set(AUDIT_QUESTIONS.map(q => q.category)))
