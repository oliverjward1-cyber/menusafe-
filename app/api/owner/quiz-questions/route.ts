import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_QUESTIONS: Record<string, { question: string; options: string[]; correctIndex: number }[]> = {
  front_of_house: [
    {
      question: 'How many allergens must UK food businesses declare by law under the Food Information Regulations?',
      options: ['8', '12', '14', '16'],
      correctIndex: 2,
    },
    {
      question: 'A guest tells you they have a nut allergy. What is the most appropriate first step?',
      options: [
        "Recommend dishes that don't list nuts on the menu",
        'Inform the kitchen immediately and flag the table',
        'Advise the restaurant cannot accommodate allergies',
        'Point them to the allergen menu board and let them decide',
      ],
      correctIndex: 1,
    },
    {
      question: "Which of these is a legal requirement introduced by Natasha's Law in October 2021?",
      options: [
        'Full ingredient lists printed on all menus',
        'Allergen labelling on all pre-packed for direct sale (PPDS) foods',
        'A dedicated allergen menu in every restaurant',
        'Training certificates displayed for all food handlers',
      ],
      correctIndex: 1,
    },
    {
      question: 'A customer says they are intolerant to lactose. Which allergen category does this fall under?',
      options: ['Sulphites', 'Soybeans', 'Milk', 'It is not one of the 14 allergens'],
      correctIndex: 2,
    },
    {
      question: 'A customer asks if a dish is gluten-free. What is the correct response?',
      options: [
        "Confirm it is gluten-free if wheat isn't listed in the menu description",
        "Tell them you'll check with the kitchen before taking their order",
        "Say you can't guarantee anything and leave it at that",
        'Point to the GF symbol if it appears on the menu',
      ],
      correctIndex: 1,
    },
    {
      question: 'Which of the following is classified as a tree nut under UK allergen law?',
      options: ['Peanut', 'Coconut', 'Almond', 'Sesame'],
      correctIndex: 2,
    },
    {
      question: 'A customer tells you mid-meal that they forgot to mention a fish allergy. What should you do?',
      options: [
        'Explain the dish has already been prepared so nothing can be done',
        'Check the dish ingredients and escalate to the manager or kitchen immediately',
        'Tell them to avoid the fish portion of the dish',
        'Offer a complimentary dessert as an apology',
      ],
      correctIndex: 1,
    },
    {
      question: 'Above what concentration must sulphur dioxide (sulphites) be declared as an allergen?',
      options: ['5mg/kg or litre', '10mg/kg or litre', '25mg/kg or litre', '50mg/kg or litre'],
      correctIndex: 1,
    },
  ],
  kitchen: [
    {
      question: 'What is cross-contamination in the context of food allergens?',
      options: [
        'Mixing two sauces in the same pan',
        'When an allergen is unintentionally transferred to a dish it should not be in',
        'Using the same oil to fry different menu items',
        'Storing raw and cooked meat on adjacent shelves',
      ],
      correctIndex: 1,
    },
    {
      question: 'A ticket arrives marked with a peanut allergy. What should you do before preparing the dish?',
      options: [
        'Remove any visible peanuts from the dish after plating',
        'Clean the prep area, use separate utensils, and verify every ingredient',
        'Put on gloves and proceed as normal',
        'Ask front of house to re-take the order to be sure',
      ],
      correctIndex: 1,
    },
    {
      question: 'Which of the following should typically be treated as containing gluten in a UK kitchen?',
      options: ['Rice', 'Oats', 'Buckwheat', 'Potato starch'],
      correctIndex: 1,
    },
    {
      question: 'A customer has a sesame allergy. Which of these kitchen ingredients should you check first?',
      options: ['Soy sauce', 'Tahini', 'Oyster sauce', 'All of the above'],
      correctIndex: 1,
    },
    {
      question: 'Can oil used to fry battered fish (containing gluten) also be used to fry chips for a coeliac customer?',
      options: [
        'Yes, if the chips are cooked quickly',
        'Yes, if the oil is filtered first',
        'No — the oil becomes contaminated with gluten',
        'Only if the oil is at a very high temperature',
      ],
      correctIndex: 2,
    },
    {
      question: 'Which kitchen practice best reduces allergen cross-contamination risk?',
      options: [
        'Wearing gloves for all food preparation',
        'Using colour-coded boards and utensils dedicated to allergen-free dishes',
        'Washing all equipment with hot water between uses',
        'Storing allergen-containing ingredients on the top shelf',
      ],
      correctIndex: 1,
    },
    {
      question: 'Lupin is one of the 14 allergens. Where is it most commonly found in a restaurant kitchen?',
      options: [
        'Pasta and wheat-based bread',
        'Some flour blends and pastry products',
        'Salad dressings and vinaigrettes',
        'Soft cheeses and dairy',
      ],
      correctIndex: 1,
    },
  ],
}

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('restaurant_id', profile.restaurant_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const grouped = {
    front_of_house: data?.filter((q) => q.quiz_type === 'front_of_house') ?? [],
    kitchen: data?.filter((q) => q.quiz_type === 'kitchen') ?? [],
  }

  return NextResponse.json({ questions: grouped })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const adminClient = createAdminClient()
  const body = await req.json()
  const { action, quizType, question, id } = body

  if (action === 'seed') {
    if (!quizType || !DEFAULT_QUESTIONS[quizType]) {
      return NextResponse.json({ error: 'Invalid quizType' }, { status: 400 })
    }

    const { data: existing } = await adminClient
      .from('quiz_questions')
      .select('id')
      .eq('restaurant_id', profile.restaurant_id)
      .eq('quiz_type', quizType)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ message: 'Already seeded' })
    }

    const rows = DEFAULT_QUESTIONS[quizType].map((q) => ({
      restaurant_id: profile.restaurant_id,
      quiz_type: quizType,
      question: q.question,
      options: q.options,
      correct_index: q.correctIndex,
    }))

    const { error } = await adminClient.from('quiz_questions').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: 'Seeded' })
  }

  if (action === 'add') {
    const { question: text, options, correctIndex } = question ?? {}
    if (!text || !options || correctIndex === undefined || !quizType) {
      return NextResponse.json({ error: 'question, options, correctIndex, quizType required' }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from('quiz_questions')
      .insert({
        restaurant_id: profile.restaurant_id,
        quiz_type: quizType,
        question: text,
        options,
        correct_index: correctIndex,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ question: data })
  }

  if (action === 'edit') {
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const { question: text, options, correctIndex } = question ?? {}

    const updates: Record<string, unknown> = {}
    if (text !== undefined) updates.question = text
    if (options !== undefined) updates.options = options
    if (correctIndex !== undefined) updates.correct_index = correctIndex

    const { data, error } = await adminClient
      .from('quiz_questions')
      .update(updates)
      .eq('id', id)
      .eq('restaurant_id', profile.restaurant_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ question: data })
  }

  if (action === 'delete') {
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const { error } = await adminClient
      .from('quiz_questions')
      .delete()
      .eq('id', id)
      .eq('restaurant_id', profile.restaurant_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: 'Deleted' })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
