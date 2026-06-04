import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

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

  const list = ingredients.map(i => `${i.id}: ${i.name}`).join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `You are a professional chef. Categorise each ingredient below as either "chilled", "ambient", or "frozen" based on how it is typically stored in a commercial kitchen.

Rules:
- chilled: refrigerated items (dairy, fresh meat, fish, fresh veg, eggs, opened sauces, fresh herbs)
- frozen: items kept in freezer (frozen meat, frozen fish, ice cream, frozen veg, frozen pastry)
- ambient: room temperature (dried spices, tinned goods, oils, vinegar, flour, sugar, dried pasta, rice, nuts, sealed sauces)

Return ONLY a JSON object mapping ingredient ID to storage type. No other text.
Example: {"abc-123": "chilled", "def-456": "ambient"}

Ingredients:
${list}`,
    }],
  })

  const text = (message.content[0] as { type: string; text: string }).text.trim()
  let mapping: Record<string, string>
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('no JSON found')
    mapping = JSON.parse(jsonMatch[0])
  } catch {
    return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 })
  }

  let updated = 0
  for (const [id, storage_type] of Object.entries(mapping)) {
    if (!['chilled', 'ambient', 'frozen'].includes(storage_type)) continue
    await supabase.from('ingredients').update({ storage_type }).eq('id', id).eq('restaurant_id', rid)
    updated++
  }

  return NextResponse.json({ updated })
}
