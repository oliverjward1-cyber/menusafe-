import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

function extractJson(text: string) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) return fence[1].trim()
  const braces = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (braces !== -1 && end !== -1) return text.slice(braces, end + 1)
  return text.trim()
}

export async function POST(req: NextRequest) {
  try {
    const { frontImage, frontMediaType, labelImage, labelMediaType } = await req.json()

    if (!frontImage && !labelImage) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    const anthropic = getClient()

    const imageContent: Anthropic.ImageBlockParam[] = []
    if (frontImage) {
      imageContent.push({
        type: 'image',
        source: { type: 'base64', media_type: (frontMediaType ?? 'image/jpeg') as any, data: frontImage },
      })
    }
    if (labelImage) {
      imageContent.push({
        type: 'image',
        source: { type: 'base64', media_type: (labelMediaType ?? 'image/jpeg') as any, data: labelImage },
      })
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: 'You are a food product scanner for a UK commercial kitchen management app. Extract ingredient data from product photos. Return ONLY valid JSON, no markdown, no explanation.',
      messages: [{
        role: 'user',
        content: [
          ...imageContent,
          {
            type: 'text',
            text: `Scan these product images and extract the following. Return ONLY this JSON:
{
  "name": "product/ingredient name",
  "kcalPer100g": <integer or null>,
  "unitType": "kg" | "g" | "ml" | "litre" | "each",
  "allergens": ["allergen_cereals_gluten","allergen_milk","allergen_eggs","allergen_fish","allergen_crustaceans","allergen_molluscs","allergen_nuts","allergen_peanuts","allergen_soya","allergen_celery","allergen_mustard","allergen_sesame","allergen_sulphites","allergen_lupin"],
  "notes": "any other useful info e.g. brand, pack size"
}

For allergens: only include keys from the list above that ARE present. Use the exact key names.
For unitType: pick the most appropriate based on whether it is a liquid, solid, or countable item.`
          }
        ],
      }],
    })

    const raw = (message.content[0] as { text: string }).text
    const jsonStr = extractJson(raw)

    try {
      const result = JSON.parse(jsonStr)
      return NextResponse.json(result)
    } catch {
      console.error('scan-product JSON parse failed:', raw)
      return NextResponse.json({ error: 'Could not read product — try a clearer photo' }, { status: 500 })
    }
  } catch (err: any) {
    console.error('scan-product error:', err)
    return NextResponse.json({ error: err.message ?? 'Error' }, { status: 500 })
  }
}
