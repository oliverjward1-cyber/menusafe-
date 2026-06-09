import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) return fence[1].trim()
  const start = text.indexOf('{'); const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1) return text.slice(start, end + 1)
  return text.trim()
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('restaurant_id').eq('id', user.id).single()
  const rid = profile?.restaurant_id
  if (!rid) return NextResponse.json({ error: 'No restaurant' }, { status: 400 })

  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, name')
    .eq('restaurant_id', rid)

  if (!ingredients || ingredients.length === 0) {
    return NextResponse.json({ updated: 0 })
  }

  const anthropic = getClient()
  const CHUNK = 50
  const mapping: Record<string, string> = {}

  for (let i = 0; i < ingredients.length; i += CHUNK) {
    const batch = ingredients.slice(i, i + CHUNK)
    const list = batch.map(ing => `${ing.id}: ${ing.name}`).join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      system: 'You are a professional chef. Return ONLY valid JSON, no markdown, no explanation.',
      messages: [{
        role: 'user',
        content: `Categorise each ingredient as "chilled", "ambient", or "frozen":
- chilled: dairy, fresh meat, fish, fresh veg, eggs, fresh herbs, opened sauces
- frozen: frozen meat, frozen fish, ice cream, frozen veg, frozen pastry
- ambient: dried spices, tinned goods, oils, vinegar, flour, sugar, dried pasta, rice, nuts, sealed sauces

Return ONLY a JSON object: {"<id>": "chilled"|"ambient"|"frozen"}

Ingredients:
${list}`,
      }],
    })

    const text = (message.content[0] as { type: string; text: string }).text.trim()
    let chunk: Record<string, string>
    try {
      chunk = JSON.parse(extractJson(text))
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 })
    }
    Object.assign(mapping, chunk)
  }

  let updated = 0
  for (const [id, storage_type] of Object.entries(mapping)) {
    if (!['chilled', 'ambient', 'frozen'].includes(storage_type)) continue
    await supabase.from('ingredients').update({ storage_type }).eq('id', id).eq('restaurant_id', rid)
    updated++
  }

  return NextResponse.json({ updated })
}
