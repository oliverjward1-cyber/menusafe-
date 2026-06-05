import { createAdminClient } from '@/lib/supabase/admin'

// Haiku 4.5 pricing (per million tokens)
const INPUT_COST_PER_M = 0.80
const OUTPUT_COST_PER_M = 4.00

export function calcCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1_000_000) * INPUT_COST_PER_M +
         (outputTokens / 1_000_000) * OUTPUT_COST_PER_M
}

export async function logAiUsage({
  endpoint,
  restaurantId,
  model,
  inputTokens,
  outputTokens,
}: {
  endpoint: string
  restaurantId?: string | null
  model: string
  inputTokens: number
  outputTokens: number
}) {
  try {
    const supabase = createAdminClient()
    await supabase.from('ai_usage_logs').insert({
      endpoint,
      restaurant_id: restaurantId ?? null,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: calcCost(inputTokens, outputTokens),
    })
  } catch {
    // Non-blocking — never let logging failure break the user flow
  }
}
