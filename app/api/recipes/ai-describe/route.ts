import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { description } = await req.json()
  if (!description?.trim()) return NextResponse.json({ error: 'No description provided' }, { status: 400 })

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a professional chef assistant for a UK restaurant management app. Based on the dish description below, extract structured recipe information.

Dish description: "${description}"

Return ONLY a JSON object with these fields (use null for anything unknown):
{
  "name": "dish name",
  "description": "one-line description suitable for a menu",
  "category": one of "Starters"|"Mains"|"Desserts"|"Specials"|"Events"|"Sides"|"Drinks"|"Snacks",
  "portionSize": "e.g. 280g or null",
  "sellPrice": number in pounds or null
}

No other text. Just the JSON.`,
    }],
  })

  const text = (message.content[0] as { type: string; text: string }).text.trim()
  try {
    const result = JSON.parse(text)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 })
  }
}
