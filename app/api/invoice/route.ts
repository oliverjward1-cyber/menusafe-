import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { logAiUsage } from '@/lib/ai-usage'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface InvoiceItem {
  name: string
  unitPrice: number
  unitType: 'kg' | 'g' | 'litre' | 'ml' | 'each'
  quantity: number
  totalPrice?: number
  priceVerified?: boolean
  kcalPer100g?: number | null
  allergenCerealsGluten?: boolean
  allergenCrustaceans?: boolean
  allergenEggs?: boolean
  allergenFish?: boolean
  allergenPeanuts?: boolean
  allergenNuts?: boolean
  allergenSoya?: boolean
  allergenMilk?: boolean
  allergenCelery?: boolean
  allergenMustard?: boolean
  allergenSesame?: boolean
  allergenSulphites?: boolean
  allergenLupin?: boolean
  allergenMolluscs?: boolean
}

const ALLERGEN_FIELD_MAP: Record<string, keyof InvoiceItem> = {
  cereals_gluten: 'allergenCerealsGluten',
  crustaceans: 'allergenCrustaceans',
  eggs: 'allergenEggs',
  fish: 'allergenFish',
  peanuts: 'allergenPeanuts',
  nuts: 'allergenNuts',
  soya: 'allergenSoya',
  milk: 'allergenMilk',
  celery: 'allergenCelery',
  mustard: 'allergenMustard',
  sesame: 'allergenSesame',
  sulphites: 'allergenSulphites',
  lupin: 'allergenLupin',
  molluscs: 'allergenMolluscs',
}

const UNIT_TYPES = new Set(['kg', 'g', 'litre', 'ml', 'each'])

const PROMPT = `You are helping a UK restaurant chef digitise their supplier delivery invoice.

Carefully read the invoice image and extract every ingredient or food product line item.

ACCURACY ON NUMBERS IS CRITICAL — these prices are used for food costing and profit margins. For every line, read the QUANTITY and LINE TOTAL exactly as printed, digit by digit. Do not estimate or do mental maths — transcribe what is printed.

For each item return:
- name: clean readable ingredient name (e.g. "Chicken Breast", "Cheddar Cheese", "Double Cream"). Clean up supplier shortcodes (e.g. "CHKN BRST" → "Chicken Breast", "DBL CRM" → "Double Cream"). Use title case.
- quantity: the order quantity exactly as printed in the Qty/Quantity/Ord column — a plain number (e.g. 5, 2, 0.5)
- unitType: one of exactly: kg, g, litre, ml, each
- totalPrice: the LINE TOTAL in GBP exactly as printed for this row — usually the rightmost money column, labelled "Total", "Net", "Amount" or "Value". Read every digit and decimal point carefully.
- unitPrice: price per unit in GBP (totalPrice ÷ quantity) — only used as a fallback if quantity or totalPrice can't be read
- kcalPer100g: estimated kilocalories per 100g based on your knowledge of this ingredient (integer, or null if unknown)
- allergens: array of zero or more of these exact strings for allergens present in this ingredient: "cereals_gluten", "crustaceans", "eggs", "fish", "peanuts", "nuts", "soya", "milk", "celery", "mustard", "sesame", "sulphites", "lupin", "molluscs". Empty array [] if none apply.

How to set quantity / unitType / totalPrice:
- If sold in packs, cases or boxes (e.g. "Ketchup 2x 5L", "Eggs 6x15"), set unitType to "each", quantity to the NUMBER OF PACKS/CASES ordered, and totalPrice to the line total. (unitPrice becomes price-per-case, which is what matters for costing.)
- If sold loose by weight or volume (e.g. "Onions 10kg"), set unitType to kg/g/litre/ml and quantity to the total weight/volume ordered.
- Sanity check: for food ingredients, totalPrice ÷ quantity is almost always between £0.05 and £100. If your figures fall way outside that, re-check for a misread decimal point (e.g. £1.50 vs £15.00) or a misread quantity before finalising.
- Ignore delivery charges, VAT summary lines, grand totals, discounts and non-food items.

Return ONLY a valid JSON array with no other text, markdown or explanation.
Example:
[
  {"name": "Chicken Breast", "quantity": 5, "unitType": "kg", "totalPrice": 37.50, "unitPrice": 7.50, "kcalPer100g": 165, "allergens": []},
  {"name": "Cheddar Cheese", "quantity": 2, "unitType": "kg", "totalPrice": 16.00, "unitPrice": 8.00, "kcalPer100g": 402, "allergens": ["milk"]},
  {"name": "Tomato Ketchup", "quantity": 2, "unitType": "each", "totalPrice": 9.00, "unitPrice": 4.50, "kcalPer100g": 100, "allergens": []}
]

If you cannot read the invoice or find no items, return an empty array: []`

// Recover individual item objects even if the response array got cut off mid-stream
function parseItems(raw: string): unknown[] {
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // fall through to lenient recovery
  }
  const matches = cleaned.match(/\{[^{}]*\}/g)
  if (!matches) return []
  const recovered: unknown[] = []
  for (const m of matches) {
    try { recovered.push(JSON.parse(m)) } catch { /* skip malformed fragment */ }
  }
  return recovered
}

function normaliseItem(raw: any): InvoiceItem | null {
  if (!raw || typeof raw.name !== 'string' || !raw.name.trim()) return null

  const unitType = UNIT_TYPES.has(raw.unitType) ? raw.unitType : 'each'
  const quantity = Number(raw.quantity)
  const totalPrice = Number(raw.totalPrice)
  const modelUnitPrice = Number(raw.unitPrice)

  let unitPrice = Number.isFinite(modelUnitPrice) ? modelUnitPrice : 0
  let priceVerified = false

  // Prefer code-computed division (totalPrice ÷ quantity) over the model's
  // own arithmetic — this is the single biggest source of wrong prices.
  if (Number.isFinite(totalPrice) && totalPrice > 0 && Number.isFinite(quantity) && quantity > 0) {
    unitPrice = Math.round((totalPrice / quantity) * 10000) / 10000
    priceVerified = true
  }

  const item: InvoiceItem = {
    name: raw.name.trim(),
    quantity: Number.isFinite(quantity) ? quantity : 0,
    unitType,
    totalPrice: Number.isFinite(totalPrice) ? totalPrice : undefined,
    unitPrice,
    priceVerified,
    kcalPer100g: typeof raw.kcalPer100g === 'number' ? raw.kcalPer100g : null,
  }

  for (const field of Object.values(ALLERGEN_FIELD_MAP)) {
    ;(item as any)[field] = false
  }
  if (Array.isArray(raw.allergens)) {
    for (const a of raw.allergens) {
      const field = ALLERGEN_FIELD_MAP[a]
      if (field) (item as any)[field] = true
    }
  }

  return item
}

export async function POST(req: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Please upload a JPG, PNG, WebP or PDF file.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = file.type === 'application/pdf' ? 'image/jpeg' : file.type as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
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

    const rawItems = parseItems(responseText)
    if (rawItems.length === 0 && responseText.trim() !== '[]') {
      return NextResponse.json(
        { error: 'Could not read invoice. Please try a clearer photo.' },
        { status: 422 }
      )
    }

    const items = rawItems.map(normaliseItem).filter((i): i is InvoiceItem => i !== null)

    await logAiUsage({ endpoint: 'invoice', restaurantId: null, model: 'claude-haiku-4-5-20251001', inputTokens: message.usage.input_tokens, outputTokens: message.usage.output_tokens })
    return NextResponse.json({ items })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Something went wrong'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
