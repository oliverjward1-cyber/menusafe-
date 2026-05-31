import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MenuSafe — Allergen & Recipe Management for UK Restaurants',
  description:
    'Manage recipes, allergens, and GP performance. UK Food Information Regulations 2014 compliant.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  )
}
