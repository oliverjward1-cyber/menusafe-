'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { UtensilsCrossed } from 'lucide-react'
import { slugify } from '@/lib/utils'

type Role = 'owner' | 'chef'

export default function SignupPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('owner')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantCode, setRestaurantCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    try {
      // 1. Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError || !authData.user) {
        throw new Error(signUpError?.message || 'Failed to create account')
      }

      const userId = authData.user.id

      let restaurantId: string

      if (role === 'owner') {
        // Create new restaurant
        const slug = slugify(restaurantName)
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .insert({ name: restaurantName, slug, target_gp: 70 })
          .select('id')
          .single()

        if (restaurantError) {
          throw new Error('That restaurant name is already taken. Please choose another.')
        }

        restaurantId = restaurant.id
      } else {
        // Join existing restaurant by code (slug)
        const { data: restaurant, error: restaurantError } = await supabase
          .from('restaurants')
          .select('id')
          .eq('slug', restaurantCode.toLowerCase().trim())
          .single()

        if (restaurantError || !restaurant) {
          throw new Error('Restaurant code not found. Please check with your owner.')
        }

        restaurantId = restaurant.id
      }

      // 2. Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        restaurant_id: restaurantId,
        role,
        full_name: fullName,
      })

      if (profileError) {
        throw new Error('Failed to save your profile. Please try again.')
      }

      router.push('/')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-xl mb-4">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">Get started with MenuSafe</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          {/* Role selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">I am a&hellip;</p>
            <div className="grid grid-cols-2 gap-3">
              {(['owner', 'chef'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                    role === r
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {r === 'owner' ? '👤 Owner' : '👨‍🍳 Chef / Staff'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <Input
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Smith"
              required
            />
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@restaurant.com"
              required
              autoComplete="email"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />

            {role === 'owner' ? (
              <Input
                label="Restaurant name"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="The Crown & Anchor"
                required
                hint="This creates your restaurant's unique link"
              />
            ) : (
              <Input
                label="Restaurant code"
                value={restaurantCode}
                onChange={(e) => setRestaurantCode(e.target.value)}
                placeholder="the-crown-and-anchor"
                required
                hint="Ask your owner for the restaurant code"
              />
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              Create account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
