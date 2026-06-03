'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { slugify } from '@/lib/utils'
import { MiseLogo } from '@/components/MiseLogo'

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
    <div className="min-h-screen bg-mise-ink flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <MiseLogo className="mb-3 scale-125" />
          <p className="text-mise-fresh/70 text-sm mt-1 font-sans">Create your account</p>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 shadow-xl p-8">
          {/* Role selector */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-300 mb-3">I am a&hellip;</p>
            <div className="grid grid-cols-2 gap-3">
              {(['owner', 'chef'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-lg border-2 p-3 text-sm font-medium transition-colors ${
                    role === r
                      ? 'border-mise-fresh bg-mise-mid/30 text-white'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
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

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-mise-fresh hover:text-mise-gold font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
