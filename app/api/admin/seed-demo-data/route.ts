import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const STAFF = [
  { name: 'Aisha Khan', role: 'manager' },
  { name: 'Tom Reilly', role: 'head_chef' },
  { name: 'Priya Patel', role: 'chef' },
  { name: 'Liam O\'Connor', role: 'chef' },
  { name: 'Sofia Rossi', role: 'chef' },
  { name: 'Jamal Edwards', role: 'chef' },
  { name: 'Megan Clarke', role: 'chef' },
  { name: 'Daniel Wright', role: 'chef' },
  { name: 'Hannah Wilson', role: 'foh' },
  { name: 'Oscar Bennett', role: 'foh' },
  { name: 'Ruby Thompson', role: 'foh' },
  { name: 'Ethan Walsh', role: 'foh' },
  { name: 'Chloe Davies', role: 'foh' },
  { name: 'Nathan Murphy', role: 'foh' },
  { name: 'Grace Robinson', role: 'foh' },
]

function daysAgo(n: number, hour = 9, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('role, restaurant_id').eq('id', user.id).single()

  if (profile?.role !== 'owner' || !profile.restaurant_id) {
    return NextResponse.json({ error: 'Forbidden: owners only' }, { status: 403 })
  }

  const rid = profile.restaurant_id
  const admin = createAdminClient()
  const names: string[] = []

  // --- Staff ---
  // Fetch all existing auth users once so we can match by email if already registered
  const { data: { users: existingUsers } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const existingByEmail = new Map(existingUsers.map(u => [u.email, u.id]))

  for (let i = 0; i < STAFF.length; i++) {
    const staff = STAFF[i]
    const email = `demo${i + 1}.${rid.slice(0, 8)}@example.com`

    let userId: string | undefined

    const existing = existingByEmail.get(email)
    if (existing) {
      userId = existing
    } else {
      const { data: created } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        password: `Demo${i + 1}Pass!${rid.slice(0, 4)}`,
        user_metadata: { full_name: staff.name, demo: true },
      })
      userId = created?.user?.id
    }

    if (!userId) continue

    await admin.from('profiles').upsert({
      id: userId,
      restaurant_id: rid,
      role: staff.role,
      full_name: staff.name,
    })
    names.push(staff.name)
  }

  // --- Ingredients ---
  const ingredients = [
    { name: 'Chicken Breast', cost_per_unit: 4.50, unit_type: 'kg', allergen_cereals_gluten: false, allergen_eggs: false, allergen_milk: false },
    { name: 'Salmon Fillet', cost_per_unit: 12.00, unit_type: 'kg', allergen_fish: true, allergen_milk: false },
    { name: 'Hake Fillet', cost_per_unit: 9.50, unit_type: 'kg', allergen_fish: true, allergen_milk: false },
    { name: 'Beef Mince', cost_per_unit: 6.00, unit_type: 'kg', allergen_cereals_gluten: false },
    { name: 'Double Cream', cost_per_unit: 2.20, unit_type: 'litre', allergen_milk: true },
    { name: 'Butter', cost_per_unit: 3.50, unit_type: 'kg', allergen_milk: true },
    { name: 'Plain Flour', cost_per_unit: 0.80, unit_type: 'kg', allergen_cereals_gluten: true },
    { name: 'Free Range Eggs', cost_per_unit: 0.30, unit_type: 'each', allergen_eggs: true },
    { name: 'Whole Milk', cost_per_unit: 0.95, unit_type: 'litre', allergen_milk: true },
    { name: 'Cheddar Cheese', cost_per_unit: 8.00, unit_type: 'kg', allergen_milk: true },
    { name: 'Tiger Prawns', cost_per_unit: 18.00, unit_type: 'kg', allergen_crustaceans: true },
    { name: 'Peanut Oil', cost_per_unit: 4.00, unit_type: 'litre', allergen_peanuts: true },
    { name: 'Sesame Seeds', cost_per_unit: 5.00, unit_type: 'kg', allergen_sesame: true },
    { name: 'Soy Sauce', cost_per_unit: 3.00, unit_type: 'litre', allergen_soya: true, allergen_cereals_gluten: true },
    { name: 'Baby Spinach', cost_per_unit: 3.50, unit_type: 'kg' },
    { name: 'Garlic', cost_per_unit: 6.00, unit_type: 'kg' },
    { name: 'White Onion', cost_per_unit: 1.20, unit_type: 'kg' },
    { name: 'Cherry Tomatoes', cost_per_unit: 3.80, unit_type: 'kg' },
    { name: 'Lemon', cost_per_unit: 0.40, unit_type: 'each' },
    { name: 'Olive Oil', cost_per_unit: 7.00, unit_type: 'litre' },
  ]

  const { data: insertedIngredients } = await admin.from('ingredients').insert(
    ingredients.map(ing => ({
      restaurant_id: rid,
      allergen_celery: false,
      allergen_cereals_gluten: false,
      allergen_crustaceans: false,
      allergen_eggs: false,
      allergen_fish: false,
      allergen_lupin: false,
      allergen_milk: false,
      allergen_molluscs: false,
      allergen_mustard: false,
      allergen_nuts: false,
      allergen_peanuts: false,
      allergen_sesame: false,
      allergen_soya: false,
      allergen_sulphites: false,
      ...ing,
    }))
  ).select('id, name')

  // --- Recipes ---
  const recipeData = [
    { name: 'Pan-roasted Hake', category: 'mains', sell_price: 18.50, declared_allergens: ['fish', 'milk'], description: 'Pan-roasted hake fillet with lemon butter sauce and wilted spinach.' },
    { name: 'Prawn & Sesame Stir Fry', category: 'mains', sell_price: 16.00, declared_allergens: ['crustaceans', 'sesame', 'soya'], description: 'Tiger prawns with sesame seeds, soy sauce, garlic and noodles.' },
    { name: 'Classic Beef Burger', category: 'mains', sell_price: 14.00, declared_allergens: ['cereals_gluten', 'eggs', 'milk'], description: 'Beef mince patty with cheddar, lettuce and house sauce.' },
    { name: 'Garlic Butter Salmon', category: 'mains', sell_price: 21.00, declared_allergens: ['fish', 'milk'], description: 'Salmon fillet with garlic butter, cherry tomatoes and baby spinach.' },
    { name: 'Chicken Piccata', category: 'mains', sell_price: 17.50, declared_allergens: ['milk', 'eggs'], description: 'Pan-fried chicken breast with lemon caper cream sauce.' },
    { name: 'Cheese Sauce', category: 'sauces', sell_price: 3.00, declared_allergens: ['milk', 'cereals_gluten'], description: 'Classic béchamel with mature cheddar.' },
    { name: 'House Vinaigrette', category: 'sauces', sell_price: 1.50, declared_allergens: [], description: 'Olive oil, lemon juice and fresh herbs.' },
    { name: 'Garden Salad', category: 'starters', sell_price: 7.00, declared_allergens: [], description: 'Mixed leaves, cherry tomatoes and house vinaigrette.' },
    { name: 'Prawn Cocktail', category: 'starters', sell_price: 9.50, declared_allergens: ['crustaceans', 'eggs'], description: 'Tiger prawns with Marie Rose sauce and lemon.' },
    { name: 'Chocolate Fondant', category: 'desserts', sell_price: 8.00, declared_allergens: ['cereals_gluten', 'eggs', 'milk'], description: 'Warm chocolate fondant with vanilla cream.' },
  ]

  const { data: insertedRecipes } = await admin.from('recipes').insert(
    recipeData.map(r => ({
      restaurant_id: rid,
      status: 'approved',
      is_active: true,
      approved_at: daysAgo(20, 10),
      ...r,
    }))
  ).select('id, name')

  // --- Recipe ingredients (wire up a few) ---
  if (insertedIngredients && insertedRecipes) {
    const ingMap = Object.fromEntries(insertedIngredients.map(i => [i.name, i.id]))
    const recMap = Object.fromEntries(insertedRecipes.map(r => [r.name, r.id]))

    const recipeIngredients = [
      { recipe: 'Pan-roasted Hake', ingredient: 'Hake Fillet', qty: 0.2, unit: 'kg' },
      { recipe: 'Pan-roasted Hake', ingredient: 'Butter', qty: 0.03, unit: 'kg' },
      { recipe: 'Pan-roasted Hake', ingredient: 'Lemon', qty: 0.5, unit: 'each' },
      { recipe: 'Pan-roasted Hake', ingredient: 'Baby Spinach', qty: 0.08, unit: 'kg' },
      { recipe: 'Garlic Butter Salmon', ingredient: 'Salmon Fillet', qty: 0.2, unit: 'kg' },
      { recipe: 'Garlic Butter Salmon', ingredient: 'Butter', qty: 0.04, unit: 'kg' },
      { recipe: 'Garlic Butter Salmon', ingredient: 'Garlic', qty: 0.02, unit: 'kg' },
      { recipe: 'Chicken Piccata', ingredient: 'Chicken Breast', qty: 0.2, unit: 'kg' },
      { recipe: 'Chicken Piccata', ingredient: 'Double Cream', qty: 0.1, unit: 'litre' },
      { recipe: 'Classic Beef Burger', ingredient: 'Beef Mince', qty: 0.18, unit: 'kg' },
      { recipe: 'Classic Beef Burger', ingredient: 'Cheddar Cheese', qty: 0.04, unit: 'kg' },
      { recipe: 'Cheese Sauce', ingredient: 'Whole Milk', qty: 0.3, unit: 'litre' },
      { recipe: 'Cheese Sauce', ingredient: 'Cheddar Cheese', qty: 0.1, unit: 'kg' },
      { recipe: 'Cheese Sauce', ingredient: 'Plain Flour', qty: 0.03, unit: 'kg' },
    ].filter(ri => recMap[ri.recipe] && ingMap[ri.ingredient])

    if (recipeIngredients.length) {
      await admin.from('recipe_ingredients').insert(
        recipeIngredients.map(ri => ({
          recipe_id: recMap[ri.recipe],
          ingredient_id: ingMap[ri.ingredient],
          quantity: ri.qty,
          unit_type: ri.unit,
        }))
      )
    }
  }

  // --- Menus ---
  const { data: insertedMenus } = await admin.from('menus').insert([
    { restaurant_id: rid, name: 'Main Menu', description: 'Our full à la carte menu', daypart: 'all-day', is_published: true },
    { restaurant_id: rid, name: 'Lunch Menu', description: 'Weekday lunch specials', daypart: 'lunch', is_published: true },
    { restaurant_id: rid, name: 'Specials Board', description: 'Weekly chef specials', daypart: 'specials', is_published: false },
  ]).select('id, name')

  if (insertedMenus && insertedRecipes) {
    const mainMenu = insertedMenus.find(m => m.name === 'Main Menu')
    const lunchMenu = insertedMenus.find(m => m.name === 'Lunch Menu')
    if (mainMenu) {
      await admin.from('menu_recipes').insert(
        insertedRecipes.slice(0, 8).map(r => ({ menu_id: mainMenu.id, recipe_id: r.id }))
      )
    }
    if (lunchMenu) {
      await admin.from('menu_recipes').insert(
        insertedRecipes.slice(0, 4).map(r => ({ menu_id: lunchMenu.id, recipe_id: r.id }))
      )
    }
  }

  // --- Audit questions ---
  const auditQuestions = [
    { key: 'temp_records', label: 'Temperature records are up to date', category: 'Food Safety', position: 1 },
    { key: 'fridge_temps', label: 'Fridge and freezer temperatures are within range', category: 'Food Safety', position: 2, requires_photo_on_fail: true },
    { key: 'date_labels', label: 'All food items are correctly date labelled', category: 'Food Safety', position: 3 },
    { key: 'allergen_matrix', label: 'Allergen matrix is current and accessible', category: 'Allergens', position: 4 },
    { key: 'allergen_training', label: 'All staff have completed allergen training this month', category: 'Allergens', position: 5 },
    { key: 'cross_contact', label: 'Cross-contact procedures are being followed', category: 'Allergens', position: 6, requires_photo_on_fail: true },
    { key: 'cleaning_schedule', label: 'Cleaning schedule is signed off for today', category: 'Cleaning', position: 7 },
    { key: 'surfaces_clean', label: 'All food contact surfaces are clean and sanitised', category: 'Cleaning', position: 8, requires_photo_on_fail: true },
    { key: 'equipment_clean', label: 'Equipment (slicers, mixers, etc.) is clean', category: 'Cleaning', position: 9 },
    { key: 'handwashing', label: 'Handwashing facilities are stocked and accessible', category: 'Hygiene', position: 10 },
    { key: 'uniform', label: 'All staff wearing clean uniform and PPE', category: 'Hygiene', position: 11 },
    { key: 'pest_evidence', label: 'No evidence of pest activity', category: 'Hygiene', position: 12, requires_photo_on_fail: true },
    { key: 'delivery_records', label: 'Delivery records are complete and up to date', category: 'Documentation', position: 13 },
    { key: 'haccp_reviewed', label: 'HACCP plan has been reviewed in the last 12 months', category: 'Documentation', position: 14 },
    { key: 'incidents_logged', label: 'Any incidents from the last week have been logged', category: 'Documentation', position: 15 },
    { key: 'probe_calibrated', label: 'Temperature probe has been calibrated this week', category: 'Equipment', position: 16 },
    { key: 'equipment_working', label: 'All equipment is in working order', category: 'Equipment', position: 17 },
    { key: 'waste_managed', label: 'Waste is being managed correctly and bins are not overflowing', category: 'Hygiene', position: 18 },
  ]

  await admin.from('audit_questions').insert(
    auditQuestions.map(q => ({ restaurant_id: rid, ...q }))
  )

  // --- Quiz questions ---
  const quizQuestions = [
    {
      quiz_type: 'front_of_house',
      question: 'A customer tells you they have a severe nut allergy. What should you do first?',
      options: ['Tell them all our dishes are nut-free', 'Check the allergen matrix and inform the chef before taking the order', 'Suggest they order something simple', 'Ask them to sign a waiver'],
      correct_index: 1,
    },
    {
      quiz_type: 'front_of_house',
      question: 'Which of the following is NOT one of the 14 UK regulated allergens?',
      options: ['Celery', 'Mustard', 'Tomato', 'Lupin'],
      correct_index: 2,
    },
    {
      quiz_type: 'front_of_house',
      question: 'What does Owen\'s Law require food businesses to do?',
      options: ['Display calorie counts', 'Provide written allergen information on the menu', 'Offer a vegan option', 'Display food hygiene ratings'],
      correct_index: 1,
    },
    {
      quiz_type: 'front_of_house',
      question: 'A customer has a fish allergy and asks if the chips are safe. What do you do?',
      options: ['Say yes, chips are always safe', 'Check if the chips are cooked in the same oil as fish', 'Tell them to avoid all fried food', 'Ignore the question'],
      correct_index: 1,
    },
    {
      quiz_type: 'front_of_house',
      question: 'Where should you find allergen information for our dishes?',
      options: ['Ask the manager', 'The allergen matrix kept in the kitchen and front of house', 'Google the dish', 'The supplier website'],
      correct_index: 1,
    },
    {
      quiz_type: 'kitchen',
      question: 'What temperature should a fridge be maintained at?',
      options: ['0–5°C', '5–10°C', '10–15°C', 'Below -18°C'],
      correct_index: 0,
    },
    {
      quiz_type: 'kitchen',
      question: 'What is the minimum core temperature for cooked chicken?',
      options: ['65°C', '70°C', '75°C', '80°C'],
      correct_index: 2,
    },
    {
      quiz_type: 'kitchen',
      question: 'How often should temperature probes be calibrated?',
      options: ['Once a year', 'Monthly', 'Weekly or before each service', 'Never — they are factory calibrated'],
      correct_index: 2,
    },
    {
      quiz_type: 'kitchen',
      question: 'A delivery arrives with packaging that is damaged. What should you do?',
      options: ['Accept it and use it quickly', 'Reject it or quarantine it and log it in the delivery record', 'Put it straight into the fridge', 'Ask a colleague to deal with it'],
      correct_index: 1,
    },
    {
      quiz_type: 'kitchen',
      question: 'When should you wash your hands in the kitchen?',
      options: ['Just at the start of your shift', 'Before handling food, after touching raw meat, after using the toilet, after touching your face', 'Only when they look dirty', 'Once per hour'],
      correct_index: 1,
    },
  ]

  await admin.from('quiz_questions').insert(
    quizQuestions.map(q => ({ restaurant_id: rid, ...q }))
  )

  // --- Staff quiz attempts ---
  const staffNames = names.length ? names : STAFF.map(s => s.name)
  const quizAttempts: any[] = []
  for (let i = 0; i < 20; i++) {
    const score = Math.floor(Math.random() * 3) + 7
    quizAttempts.push({
      restaurant_id: rid,
      staff_name: pick(staffNames, i),
      score,
      total_questions: 10,
      passed: score >= 7,
      assessment_type: i % 2 === 0 ? 'Allergen Knowledge' : 'Food Safety',
      created_at: daysAgo(Math.floor(i * 1.5), 10 + (i % 3)),
    })
  }
  await admin.from('staff_quiz_attempts').insert(quizAttempts)

  // --- Staff module completions ---
  const modules = ['celery', 'cereals_gluten', 'crustaceans', 'eggs', 'fish', 'milk', 'nuts', 'peanuts']
  const completions: any[] = []
  staffNames.slice(0, 8).forEach((name, ni) => {
    modules.slice(0, 4 + (ni % 4)).forEach((mod, mi) => {
      completions.push({
        restaurant_id: rid,
        staff_name: name,
        module_slug: mod,
        score: Math.floor(Math.random() * 2) + 8,
        completed_at: daysAgo(15 - mi * 2, 11),
      })
    })
  })
  await admin.from('staff_module_completions').insert(completions)

  // --- HACCP plans ---
  await admin.from('haccp_plans').insert([
    {
      restaurant_id: rid,
      title: 'Main Kitchen HACCP Plan',
      last_reviewed_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reviewed_by: pick(staffNames, 0),
      notes: 'Annual review completed. No critical changes required.',
    },
    {
      restaurant_id: rid,
      title: 'Allergen Control HACCP',
      last_reviewed_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      reviewed_by: pick(staffNames, 1),
      notes: 'Updated following menu change in March.',
    },
  ])

  // --- Probe calibrations ---
  const calibrations: any[] = []
  for (let i = 0; i < 4; i++) {
    calibrations.push({
      restaurant_id: rid,
      ice_point: Number((Math.random() * 1.5 - 0.5).toFixed(1)),
      boiling_point: Number((Math.random() * 1.5 + 99.5).toFixed(1)),
      recorded_by: pick(staffNames, i),
      calibrated_at: daysAgo(i * 5 + 1, 8, 30),
    })
  }
  await admin.from('probe_calibrations').insert(calibrations)

  // --- 3 weeks of compliance logs ---
  const LOCATIONS = ['Walk-in fridge', 'Freezer 1', 'Freezer 2', 'Hot hold', 'Prep fridge', 'Display chiller']
  const SUPPLIERS = ['Fresh Direct Foods', 'Harbour Fish Co.', 'Greenfield Farms', 'Metro Meats', 'Bakers Supply Ltd']
  const CLEANING_TASKS = ['Deep clean fryers', 'Wipe down pass', 'Sanitise prep surfaces', 'Clean walk-in fridge', 'Mop kitchen floor', 'Descale coffee machine']

  const tempLogs: any[] = []
  const cleaningLogs: any[] = []
  const deliveries: any[] = []
  const incidents: any[] = []
  const audits: any[] = []
  const auditAnswers: any[] = []

  for (let day = 20; day >= 0; day--) {
    LOCATIONS.slice(0, 4).forEach((loc, idx) => {
      const isAmPm = idx < 2
      tempLogs.push({
        restaurant_id: rid,
        location: loc,
        temperature: Number((Math.random() * 3 + (loc.includes('Freezer') ? -22 : loc.includes('Hot') ? 68 : 2)).toFixed(1)),
        unit: 'C',
        check_type: idx === 0 ? 'am' : idx === 1 ? 'pm' : 'spot',
        recorded_by: pick(staffNames, day + idx),
        logged_at: daysAgo(day, isAmPm ? (idx === 0 ? 8 : 17) : 12, 30),
      })
    })

    const tasksToday = day % 3 === 0 ? 3 : 2
    for (let t = 0; t < tasksToday; t++) {
      cleaningLogs.push({
        restaurant_id: rid,
        task_name: pick(CLEANING_TASKS, day + t),
        signed_by: pick(staffNames, day + t + 3),
        completed_at: daysAgo(day, 15, t * 15),
      })
    }

    if (day % 2 === 0) {
      deliveries.push({
        restaurant_id: rid,
        supplier: pick(SUPPLIERS, day),
        items: 'Mixed produce, dairy & dry goods',
        temperature: Number((Math.random() * 2 + 2).toFixed(1)),
        temp_acceptable: true,
        condition: day === 6 ? 'borderline' : 'acceptable',
        received_by: pick(staffNames, day + 5),
        delivered_at: daysAgo(day, 10, 0),
      })
    }
  }

  // Weekly audits with answers
  for (let w = 0; w < 3; w++) {
    const day = 18 - w * 7
    const auditScore = 16 - w
    const { data: auditRow } = await admin.from('kitchen_audits').insert({
      restaurant_id: rid,
      completed_by: pick(staffNames, w),
      score: auditScore,
      total: auditQuestions.length,
      status: auditScore >= 16 ? 'green' : auditScore >= 13 ? 'amber' : 'red',
      notes: 'Routine weekly kitchen audit.',
      completed_at: daysAgo(day, 14, 0),
    }).select('id').single()

    if (auditRow) {
      auditQuestions.forEach((q, qi) => {
        auditAnswers.push({
          audit_id: auditRow.id,
          question_key: q.key,
          answer: qi < auditScore ? 'pass' : 'fail',
          notes: qi >= auditScore ? 'Action required — see corrective notes.' : null,
        })
      })
    }
  }

  // Incidents
  const incidentData = [
    { day: 15, type: 'near_miss', severity: 'low', title: 'Wet floor near fryer station', description: 'Spillage near the fryer not immediately cleaned up. No injury occurred.', action: 'Area cleaned and wet floor sign placed. Briefed team on spillage protocol.' },
    { day: 9, type: 'equipment', severity: 'medium', title: 'Walk-in fridge door seal worn', description: 'Door seal on walk-in fridge showing visible wear — temperature slightly elevated at 7°C.', action: 'Temporary fix applied. Maintenance called to replace seal. Food stock checked and safe.' },
    { day: 2, type: 'contamination', severity: 'high', title: 'Raw chicken stored above salad prep', description: 'Raw chicken found stored on a shelf above ready-to-eat salad items in prep fridge.', action: 'Salad items discarded. Storage reorganised. Staff retrained on correct storage hierarchy.' },
  ]

  incidentData.forEach(({ day, type, severity, title, description, action }) => {
    incidents.push({
      restaurant_id: rid,
      type,
      severity,
      title,
      description,
      reported_by: pick(staffNames, day),
      action_taken: action,
      resolved: day > 3,
      resolved_at: day > 3 ? daysAgo(day - 1, 12, 0) : null,
      occurred_at: daysAgo(day, 13, 0),
    })
  })

  await Promise.all([
    tempLogs.length && admin.from('temperature_logs').insert(tempLogs),
    cleaningLogs.length && admin.from('cleaning_logs').insert(cleaningLogs),
    deliveries.length && admin.from('delivery_records').insert(deliveries),
    incidents.length && admin.from('incidents').insert(incidents),
    auditAnswers.length && admin.from('kitchen_audit_answers').insert(auditAnswers),
  ].filter(Boolean))

  return NextResponse.json({
    ok: true,
    staffCreated: names.length,
    ingredients: ingredients.length,
    recipes: recipeData.length,
    menus: 3,
    auditQuestions: auditQuestions.length,
    quizQuestions: quizQuestions.length,
    quizAttempts: quizAttempts.length,
    moduleCompletions: completions.length,
    haccpPlans: 2,
    probeCalibrations: calibrations.length,
    tempLogs: tempLogs.length,
    cleaningLogs: cleaningLogs.length,
    deliveries: deliveries.length,
    incidents: incidents.length,
    audits: 3,
  })
}
