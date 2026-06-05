import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { logAiUsage } from '@/lib/ai-usage'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  if (!profile?.restaurant_id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('image') as File | null
  const dishNamesRaw = formData.get('dishNames') as string | null

  if (!file) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = (file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif') || 'image/jpeg'
  const dishNames = dishNamesRaw ? JSON.parse(dishNamesRaw) : []

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          {
            type: 'text',
            text: `This is a restaurant allergen information sheet. It shows which dishes contain which allergens.

The 14 UK regulated allergens and their keys are:
- celery → "celery"
- cereals containing gluten (wheat, rye, barley, oats) → "cereals_gluten"
- crustaceans / shellfish → "crustaceans"
- eggs → "eggs"
- fish → "fish"
- lupin → "lupin"
- milk / dairy → "milk"
- molluscs → "molluscs"
- mustard → "mustard"
- tree nuts (almonds, cashews, walnuts etc) → "nuts"
- peanuts → "peanuts"
- sesame → "sesame"
- soya → "soya"
- sulphur dioxide / sulphites → "sulphites"

${dishNames.length > 0 ? `Known dishes in this restaurant: ${dishNames.join(', ')}` : ''}

Extract each dish and its allergens. Return a JSON array:
[{"dish": "dish name exactly as shown", "allergens": ["celery", "milk", ...]}]

Only include allergens that are marked as present (●, ✓, Y, X, or any positive indicator).
Return ONLY valid JSON. No explanation, no markdown.`,
          },
        ],
      },
    ],
  })

  await logAiUsage({ endpoint: 'allergen-import', restaurantId: profile.restaurant_id, model: 'claude-haiku-4-5-20251001', inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const results = JSON.parse(text)
    return NextResponse.json({ results })
  } catch {
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        const results = JSON.parse(match[0])
        return NextResponse.json({ results })
      } catch { /* fall through */ }
    }
    return NextResponse.json({ error: 'Could not parse allergen sheet', raw: text }, { status: 422 })
  }
}
