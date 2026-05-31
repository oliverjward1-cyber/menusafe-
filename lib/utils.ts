import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function calcFoodCostPercent(foodCost: number, sellPrice: number): number {
  if (sellPrice <= 0) return 0
  return (foodCost / sellPrice) * 100
}

export function calcGpPercent(foodCost: number, sellPrice: number): number {
  return 100 - calcFoodCostPercent(foodCost, sellPrice)
}

export function calcSuggestedPrice(foodCost: number, targetGpPercent: number): number {
  if (targetGpPercent >= 100) return 0
  return foodCost / (1 - targetGpPercent / 100)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
