import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'No ingredient name' }, { status: 400 })

    const anthropic = getClient()

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      system: 'You are a nutrition database. Return ONLY a JSON object, no markdown, no explanation.',
      messages: [{
        role: 'user',
        content: `Estimate the typical kcal per 100g for "${name}" as used in a commercial kitchen (raw/uncooked unless it is something always served cooked like pasta). Return: {"kcal": <integer>}`,
      }],
    })

    const raw = (message.content[0] as { text: string }).text.trim()
    const match = raw.match(/\d+/)
    if (!match) return NextResponse.json({ error: 'Could not estimate' }, { status: 500 })

    return NextResponse.json({ kcal: parseInt(match[0]) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Error' }, { status: 500 })
  }
}
