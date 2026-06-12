import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { logAiUsage } from '@/lib/ai-usage'

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function extractJson(text: string): string {
  // Strip markdown code fences if present
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) return match[1].trim()
  // Find first { ... } block
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) return text.slice(start, end + 1)
  return text.trim()
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()

    const body = await req.json()
    const { description, imageBase64, imageMediaType } = body

    if (!description?.trim() && !imageBase64) {
      return NextResponse.json({ error: 'No description or image provided' }, { status: 400 })
    }

    const anthropic = getClient()

    const SYSTEM = `You are a professional chef assistant for a UK restaurant management app. Extract structured recipe information and return ONLY a valid JSON object — no markdown, no explanation, no code fences. Use null for any field you cannot determine.`

    const SCHEMA = `{
  "name": "dish name as a string",
  "description": "one-line menu description",
  "category": "one of: Starters, Mains, Sides, Desserts, Drinks, Snacks, Specials",
  "portionSize": "e.g. 280g, or null",
  "sellPrice": "number in GBP (e.g. 14.5) or null"
}`

    let content: Anthropic.MessageParam['content']

    if (imageBase64) {
      content = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: (imageMediaType ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
            data: imageBase64,
          },
        },
        {
          type: 'text',
          text: `${description?.trim() ? `Additional context: "${description}"\n\n` : ''}This is a photo of a recipe card or dish. Extract the recipe information and return this JSON schema:\n${SCHEMA}`,
        },
      ]
    } else {
      content = `Dish description: "${description}"\n\nReturn this JSON schema:\n${SCHEMA}`
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM,
      messages: [{ role: 'user', content }],
    })

    await logAiUsage({ endpoint: 'ai-describe', restaurantId: profile?.restaurant_id, model: 'claude-haiku-4-5-20251001', inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens })

    const raw = (message.content[0] as { type: string; text: string }).text
    const jsonStr = extractJson(raw)

    try {
      const result = JSON.parse(jsonStr)
      // Normalise sellPrice to a number or null
      if (result.sellPrice && typeof result.sellPrice === 'string') {
        const n = parseFloat(result.sellPrice.replace(/[^0-9.]/g, ''))
        result.sellPrice = isNaN(n) ? null : n
      }
      return NextResponse.json(result)
    } catch {
      console.error('AI JSON parse failed. Raw:', raw)
      return NextResponse.json({ error: 'AI returned invalid JSON — please try again' }, { status: 500 })
    }
  } catch (err: any) {
    console.error('AI describe error:', err)
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 })
  }
}
