import type { Metadata } from 'next'
import { Cormorant_Garamond, Hanken_Grotesk } from 'next/font/google'
import './globals.css'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
})

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hanken',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'mise — Allergen & Recipe Management for UK Restaurants',
  description:
    'Manage recipes, allergens, and GP performance. UK Food Information Regulations 2014 compliant.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB" className={`${cormorant.variable} ${hanken.variable}`}>
      <body>{children}</body>
    </html>
  )
}
