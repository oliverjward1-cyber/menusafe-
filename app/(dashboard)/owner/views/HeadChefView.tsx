import Link from 'next/link'
import { ArrowRight, BookOpen, ClipboardCheck, Package, MenuSquare, CheckCircle2, AlertTriangle } from 'lucide-react'
import { ALLERGENS } from '@/lib/constants/allergens'

export default function HeadChefView({ data }: { data: any }) {
  const { recipes, menus, lastAudit, now } = data

  const approvedRecipes = recipes.filter((r: any) => r.status === 'approved')
  const draftRecipes = recipes.filter((r: any) => r.status === 'draft')
  const publishedMenus = menus.filter((m: any) => m.is_published)

  function addMonths(date: Date, months: number) {
    const d = new Date(date)
    d.setMonth(d.getMonth() + months)
    return d
  }
  const auditOverdue = !lastAudit || addMonths(new Date(lastAudit.completed_at), 1) < now
  const auditPct = lastAudit ? Math.round((lastAudit.score / lastAudit.total) * 100) : null

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 text-xs text-orange-800 font-medium">
        👨‍🍳 Head Chef view — recipes, allergens & kitchen standards
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Approved recipes', value: approvedRecipes.length, ok: approvedRecipes.length > 0, href: '/chef/recipes' },
          { label: 'Draft recipes', value: draftRecipes.length, ok: true, href: '/chef/recipes' },
          { label: 'Published menus', value: publishedMenus.length, ok: publishedMenus.length > 0, href: '/chef/menus' },
        ].map(item => (
          <Link key={item.label} href={item.href} className="bg-white rounded-2xl border border-black/[0.06] p-4 text-center hover:border-mise-mid/30 transition-all">
            <p className={`text-2xl font-bold ${item.ok ? 'text-mise-ink' : 'text-amber-500'}`}>{item.value}</p>
            <p className="text-xs text-mise-ink/40 mt-1">{item.label}</p>
          </Link>
        ))}
      </div>

      {/* Kitchen audit */}
      <div className={`rounded-2xl border p-4 ${auditOverdue ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className={`h-4 w-4 ${auditOverdue ? 'text-red-500' : 'text-green-600'}`} />
            <p className="text-sm font-semibold text-mise-ink">Kitchen Audit</p>
          </div>
          <Link href="/chef/audit" className="text-xs text-mise-mid font-semibold hover:underline flex items-center gap-1">
            {auditOverdue ? 'Run now' : 'View'} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <p className={`text-xs mt-1 ${auditOverdue ? 'text-red-600 font-medium' : 'text-green-700'}`}>
          {lastAudit
            ? `Last: ${auditPct}% · ${auditOverdue ? 'Next audit overdue' : `Next due ${addMonths(new Date(lastAudit.completed_at), 1).toLocaleDateString('en-GB')}`}`
            : 'No audit on record — run one now'}
        </p>
      </div>

      {/* Allergen matrix preview — top 5 dishes */}
      {approvedRecipes.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-mise-ink flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-500" /> Allergen matrix (top 5)
            </p>
            <Link href="/owner/allergen-matrix" className="text-xs text-mise-mid font-semibold hover:underline">Full matrix</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr>
                  <th className="text-left py-1 font-medium text-mise-ink/40 min-w-[100px]">Dish</th>
                  {ALLERGENS.slice(0, 8).map(a => (
                    <th key={a.key} className="px-1 font-medium text-mise-ink/40 text-center" title={a.label}>
                      {a.shortLabel?.slice(0, 3) ?? a.label.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {approvedRecipes.slice(0, 5).map((recipe: any) => {
                  const allergenSet = new Set(
                    (recipe.recipe_ingredients ?? []).flatMap((ri: any) =>
                      ri.ingredients ? ALLERGENS.filter(a => ri.ingredients[a.key]).map(a => a.key) : []
                    )
                  )
                  return (
                    <tr key={recipe.id}>
                      <td className="py-1.5 font-medium text-mise-ink truncate max-w-[100px]">{recipe.name}</td>
                      {ALLERGENS.slice(0, 8).map(a => (
                        <td key={a.key} className="px-1 py-1.5 text-center">
                          {allergenSet.has(a.key) ? <span className="text-red-500 font-bold">●</span> : <span className="text-gray-200">○</span>}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {approvedRecipes.length > 5 && (
            <p className="text-xs text-mise-ink/30 mt-2">+{approvedRecipes.length - 5} more dishes — see full matrix</p>
          )}
        </div>
      )}

      {/* Drafts needing approval */}
      {draftRecipes.length > 0 && (
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 shadow-sm">
          <p className="text-sm font-semibold text-mise-ink mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Recipes awaiting approval
          </p>
          <ul className="space-y-1">
            {draftRecipes.slice(0, 5).map((r: any) => (
              <li key={r.id}>
                <Link href={`/chef/recipes/${r.id}`} className="text-sm text-mise-ink/70 hover:text-mise-mid transition-colors flex items-center justify-between">
                  {r.name} <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: '/chef/ingredients', label: 'Ingredients', icon: Package },
          { href: '/chef/recipes', label: 'All recipes', icon: BookOpen },
          { href: '/chef/menus', label: 'Menus', icon: MenuSquare },
          { href: '/owner/allergen-matrix', label: 'Allergen matrix', icon: BookOpen },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2 bg-white border border-black/[0.06] rounded-xl px-3 py-3 text-sm font-medium text-mise-ink/70 hover:text-mise-ink hover:border-mise-mid/30 transition-all">
            <Icon className="h-4 w-4 text-mise-mid" /> {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
