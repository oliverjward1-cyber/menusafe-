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

  if (!file) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const mediaType = (file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif') || 'image/jpeg'

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
            text: `This is a restaurant menu. Extract every dish you can see.

For each dish return a JSON array of objects with these fields:
- name: dish name (string)
- category: section of the menu it appears in e.g. "Starters", "Mains", "Desserts", "Sides", "Sharing", "Brunch" etc. (string)
- price: sell price as a number in pounds, no currency symbol. null if not visible. (number | null)
- description: brief description if one is shown, otherwise null (string | null)

Return ONLY valid JSON. No explanation, no markdown, just the raw JSON array.
Example: [{"name":"Pan-roasted hake","category":"Mains","price":18.50,"description":"Sea salt, brown butter, greens"}]`,
          },
        ],
      },
    ],
  })

  await logAiUsage({ endpoint: 'menu-import', restaurantId: profile.restaurant_id, model: 'claude-haiku-4-5-20251001', inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  try {
    const dishes = JSON.parse(text)
    return NextResponse.json({ dishes })
  } catch {
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        const dishes = JSON.parse(match[0])
        return NextResponse.json({ dishes })
      } catch { /* fall through */ }
    }
    return NextResponse.json({ error: 'Could not parse menu', raw: text }, { status: 422 })
  }
}
