import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CheckCircle, XCircle, QrCode } from 'lucide-react'
import QrCodeDisplay from './QrCodeDisplay'

export default async function StaffQuizPage() {
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
    .limit(50)

  const quizUrl = `/quiz/${restaurant?.slug}`

  const passRate =
    attempts && attempts.length > 0
      ? Math.round((attempts.filter((a) => a.passed).length / attempts.length) * 100)
      : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff Allergen Quiz</h1>
        <p className="text-gray-500 mt-1">Share the link or QR code with your staff</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* QR code card */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quiz access</h2>
          <QrCodeDisplay quizUrl={quizUrl} restaurantSlug={restaurant?.slug ?? ''} />
        </Card>

        {/* Stats card */}
        <Card>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Results summary</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Total attempts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{attempts?.length ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Passed</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                {attempts?.filter((a) => a.passed).length ?? 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pass rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {passRate !== null ? `${passRate}%` : '—'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Attempts table */}
      <Card padding={false}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Audit trail</h2>
          <p className="text-sm text-gray-500">Staff who have completed the quiz</p>
        </div>
        {!attempts || attempts.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No quiz attempts yet. Share the link with your staff.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Staff member</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Result</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{attempt.staff_name}</td>
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
  )
}
