import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'
import QrCodeDisplay from './QrCodeDisplay'
import { RemindButton } from './RemindButton'
import PrintButton from '@/components/ui/PrintButton'

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function complianceStatus(expiryDate: Date): 'valid' | 'expiring' | 'expired' {
  const now = new Date()
  const thirtyDays = new Date()
  thirtyDays.setDate(thirtyDays.getDate() + 30)
  if (expiryDate < now) return 'expired'
  if (expiryDate < thirtyDays) return 'expiring'
  return 'valid'
}

export default async function StaffQuizPage({
  searchParams,
}: {
  searchParams: { tab?: string; type?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('restaurant_id')
    .eq('id', user.id)
    .single()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, slug')
    .eq('id', profile?.restaurant_id ?? '')
    .single()

  const { data: attempts } = await supabase
    .from('staff_quiz_attempts')
    .select('*')
    .eq('restaurant_id', profile?.restaurant_id ?? '')
    .order('completed_at', { ascending: false })

  const fohUrl = `/quiz/${restaurant?.slug}?type=front_of_house`
  const kitchenUrl = `/quiz/${restaurant?.slug}?type=kitchen`
  const activeTab = searchParams.tab === 'compliance' ? 'compliance' : 'setup'
  const typeFilter = searchParams.type ?? null // 'front_of_house' | 'kitchen' | null

  // Build compliance records: latest PASSED attempt per (staff_name, quiz_type)
  type ComplianceRecord = {
    staffName: string
    quizType: string
    quizLabel: string
    passedAt: Date
    expiryDate: Date
    status: 'valid' | 'expiring' | 'expired'
    score: number
    total: number
  }

  const complianceMap = new Map<string, ComplianceRecord>()
  for (const attempt of attempts ?? []) {
    if (!attempt.passed) continue
    const key = `${attempt.staff_name}__${attempt.quiz_type}`
    if (!complianceMap.has(key)) {
      const passedAt = new Date(attempt.completed_at)
      const expiryDate = addMonths(passedAt, 6)
      complianceMap.set(key, {
        staffName: attempt.staff_name,
        quizType: attempt.quiz_type,
        quizLabel: attempt.quiz_type === 'front_of_house' ? 'Front of House' : 'Kitchen',
        passedAt,
        expiryDate,
        status: complianceStatus(expiryDate),
        score: attempt.score,
        total: attempt.total_questions,
      })
    }
  }
  const complianceRecords = Array.from(complianceMap.values()).sort((a, b) =>
    a.staffName.localeCompare(b.staffName)
  )

  const filteredAttempts = typeFilter
    ? (attempts ?? []).filter(a => a.quiz_type === typeFilter)
    : (attempts ?? [])

  const totalAttempts = filteredAttempts.length
  const totalPassed = filteredAttempts.filter((a) => a.passed).length
  const passRate = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : null
  const typeLabel = typeFilter === 'front_of_house' ? 'Front of House' : typeFilter === 'kitchen' ? 'Kitchen' : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-mise-ink">
            {typeLabel ? `${typeLabel} Quiz` : 'Staff Allergen Quiz'}
          </h1>
          <p className="text-mise-ink/50 mt-1">
            {typeLabel ? `Results filtered to ${typeLabel} staff` : 'Manage quizzes and track staff compliance'}
          </p>
          {typeLabel && (
            <a href="/owner/staff-quiz" className="text-xs text-mise-mid hover:underline mt-0.5 inline-block">
              ← Show all quiz types
            </a>
          )}
        </div>
        <PrintButton label="Print compliance records" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 no-print">
        <a
          href="?tab=setup"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'setup'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Quiz Setup
        </a>
        <a
          href="?tab=compliance"
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'compliance'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Staff Compliance
          {complianceRecords.some((r) => r.status !== 'valid') && (
            <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-100 text-red-700 text-xs">
              !
            </span>
          )}
        </a>
      </div>

      {activeTab === 'setup' && (
        <div className="space-y-6">
          {/* QR codes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-base font-semibold text-mise-ink mb-1">Front of House quiz</h2>
              <p className="text-xs text-gray-500 mb-4">For waitstaff, hosts, and floor team</p>
              <QrCodeDisplay quizUrl={fohUrl} restaurantSlug={restaurant?.slug ?? ''} />
            </Card>
            <Card>
              <h2 className="text-base font-semibold text-mise-ink mb-1">Kitchen Staff quiz</h2>
              <p className="text-xs text-gray-500 mb-4">For chefs, prep staff, and kitchen team</p>
              <QrCodeDisplay quizUrl={kitchenUrl} restaurantSlug={restaurant?.slug ?? ''} />
            </Card>
          </div>

          {/* Stats */}
          <Card>
            <h2 className="text-base font-semibold text-mise-ink mb-4">Overall results</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-mise-ink/50">Total attempts</p>
                <p className="text-2xl font-display font-semibold text-mise-ink mt-1">{totalAttempts}</p>
              </div>
              <div>
                <p className="text-xs text-mise-ink/50">Passed</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{totalPassed}</p>
              </div>
              <div>
                <p className="text-xs text-mise-ink/50">Pass rate</p>
                <p className="text-2xl font-display font-semibold text-mise-ink mt-1">
                  {passRate !== null ? `${passRate}%` : '—'}
                </p>
              </div>
            </div>
          </Card>

          {/* Audit trail */}
          <Card padding={false}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-mise-ink">Audit trail</h2>
              <p className="text-sm text-mise-ink/50">All quiz attempts</p>
            </div>
            {filteredAttempts.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                No quiz attempts yet. Share the QR codes with your staff.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Staff member</th>
                      {!typeFilter && <th className="text-left px-4 py-3 font-medium text-gray-600">Quiz type</th>}
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Result</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAttempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{attempt.staff_name}</td>
                        {!typeFilter && (
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {attempt.quiz_type === 'front_of_house' ? 'Front of House' : 'Kitchen'}
                          </td>
                        )}
                        <td className="px-4 py-3 text-gray-600">
                          {attempt.score}/{attempt.total_questions}
                        </td>
                        <td className="px-4 py-3">
                          {attempt.passed ? (
                            <Badge variant="green">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Passed
                            </Badge>
                          ) : (
                            <Badge variant="red">
                              <XCircle className="h-3 w-3 inline mr-1" />
                              Failed
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(attempt.completed_at).toLocaleString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <Card padding={false}>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-mise-ink">Staff compliance</h2>
              <p className="text-sm text-mise-ink/50">
                Certificates valid for 6 months from last passed quiz
              </p>
            </div>
            {complianceRecords.length === 0 ? (
              <div className="py-12 text-center text-gray-500 text-sm">
                No passed quizzes yet. Staff compliance will appear here once someone passes.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Staff member</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Quiz</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Passed</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Expires</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {complianceRecords.map((r) => (
                      <tr key={`${r.staffName}__${r.quizType}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{r.staffName}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{r.quizLabel}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {r.passedAt.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {r.expiryDate.toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3">
                          {r.status === 'valid' && (
                            <Badge variant="green">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Valid
                            </Badge>
                          )}
                          {r.status === 'expiring' && (
                            <Badge variant="yellow">
                              <Clock className="h-3 w-3 inline mr-1" />
                              Expiring soon
                            </Badge>
                          )}
                          {r.status === 'expired' && (
                            <Badge variant="red">
                              <AlertTriangle className="h-3 w-3 inline mr-1" />
                              Expired
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {(r.status === 'expiring' || r.status === 'expired') && (
                            <RemindButton
                              staffName={r.staffName}
                              restaurantName={restaurant?.name ?? ''}
                              quizUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/quiz/${restaurant?.slug}`}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
