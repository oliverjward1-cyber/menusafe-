import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface InvoiceItem {
  name: string
  unitPrice: number
  unitType: 'kg' | 'g' | 'litre' | 'ml' | 'each'
  quantity: number
  totalPrice?: number
}

const PROMPT = `You are helping a UK restaurant chef digitise their supplier delivery invoice.

Carefully read the invoice image and extract every ingredient or food product line item.

For each item return:
- name: clean readable ingredient name (e.g. "Chicken Breast", "Cheddar Cheese", "Double Cream")
- unitPrice: the price PER UNIT in GBP as a number (e.g. if it says £15.00 for 2kg, the unitPrice is 7.50 per kg)
- unitType: one of exactly: kg, g, litre, ml, each
- quantity: how many units were ordered
- totalPrice: the line total in GBP if shown

Rules:
- Convert all prices to per-unit (per kg, per litre, per each etc)
- If an item is sold by the case or box, set unitType to "each" and unitPrice to price per item
- Ignore delivery charges, VAT summaries, totals, and non-food items
- Clean up supplier shortcodes (e.g. "CHKN BRST" → "Chicken Breast", "DBL CRM" → "Double Cream")
- Use title case for names

Return ONLY a valid JSON array with no other text, markdown or explanation.
Example format:
[
  {"name": "Chicken Breast", "unitPrice": 7.50, "unitType": "kg", "quantity": 5, "totalPrice": 37.50},
  {"name": "Double Cream", "unitPrice": 2.40, "unitType": "litre", "quantity": 6, "totalPrice": 14.40}
]

If you cannot read the invoice or find no items, return an empty array: []`

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to your environment variables.' },
      { status: 500 }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('invoice') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Please upload a JPG, PNG, WebP or PDF file.' },
        { status: 400 }
      )
    }

    // Convert to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = file.type === 'application/pdf' ? 'image/jpeg' : file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: PROMPT,
            },
          ],
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Parse JSON from response
    let items: InvoiceItem[] = []
    try {
      // Strip any accidental markdown code fences
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      items = JSON.parse(cleaned)
      if (!Array.isArray(items)) items = []
    } catch {
      return NextResponse.json(
        { error: 'Could not read invoice. Please try a clearer photo.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ items })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
