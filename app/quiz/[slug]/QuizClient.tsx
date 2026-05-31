'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { UtensilsCrossed, CheckCircle, XCircle } from 'lucide-react'

interface Question {
  question: string
  options: string[]
  correctIndex: number
}

interface Props {
  restaurantId: string
  restaurantName: string
  questions: Question[]
}

type Stage = 'name' | 'quiz' | 'result'

const PASS_SCORE = 0.8

export default function QuizClient({ restaurantId, restaurantName, questions }: Props) {
  const supabase = createClient()
  const [stage, setStage] = useState<Stage>('name')
  const [staffName, setStaffName] = useState('')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(
    new Array(questions.length).fill(null)
  )
  const [selected, setSelected] = useState<number | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [score, setScore] = useState(0)

  const question = questions[current]

  function selectOption(i: number) {
    if (showAnswer) return
    setSelected(i)
  }

  function confirmAnswer() {
    if (selected === null) return
    const newAnswers = [...answers]
    newAnswers[current] = selected
    setAnswers(newAnswers)
    setShowAnswer(true)
  }

  function nextQuestion() {
    setShowAnswer(false)
    setSelected(null)
    if (current + 1 < questions.length) {
      setCurrent(current + 1)
    } else {
      finishQuiz()
    }
  }

  async function finishQuiz() {
    const correct = answers.filter((a, i) => a === questions[i].correctIndex).length
    const passed = correct / questions.length >= PASS_SCORE
    setScore(correct)
    setStage('result')

    setSubmitting(true)
    await supabase.from('staff_quiz_attempts').insert({
      restaurant_id: restaurantId,
      staff_name: staffName.trim(),
      score: correct,
      total_questions: questions.length,
      passed,
    })
    setSubmitting(false)
  }

  if (stage === 'name') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-xl mb-4">
              <UtensilsCrossed className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">{restaurantName}</h1>
            <p className="text-gray-500 mt-1">Allergen awareness quiz</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="e.g. Sarah Jones"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                onKeyDown={(e) => e.key === 'Enter' && staffName.trim() && setStage('quiz')}
              />
            </div>
            <p className="text-xs text-gray-500">
              You&apos;ll answer {questions.length} questions about allergens in our dishes. You need{' '}
              {Math.ceil(questions.length * PASS_SCORE)}/{questions.length} to pass.
            </p>
            <Button
              onClick={() => setStage('quiz')}
              disabled={!staffName.trim()}
              size="lg"
              className="w-full"
            >
              Start quiz
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'result') {
    const correct = score
    const passed = correct / questions.length >= PASS_SCORE

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            {passed ? (
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {passed ? 'Quiz passed!' : 'Not quite'}
            </h2>
            <p className="text-gray-500 mt-2">
              {staffName}, you scored {correct} out of {questions.length}
            </p>
            <div
              className={`mt-6 rounded-lg px-4 py-3 text-sm font-medium ${
                passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {passed
                ? 'Well done! Your result has been recorded.'
                : `You need ${Math.ceil(questions.length * PASS_SCORE)} correct answers to pass. Please try again.`}
            </div>
            {!passed && (
              <Button
                onClick={() => {
                  setStage('quiz')
                  setCurrent(0)
                  setAnswers(new Array(questions.length).fill(null))
                  setSelected(null)
                  setShowAnswer(false)
                }}
                className="mt-4 w-full"
              >
                Try again
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Quiz stage
  const isCorrect = showAnswer && selected === question.correctIndex

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto pt-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
            <span>{restaurantName}</span>
            <span>
              {current + 1} / {questions.length}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="font-semibold text-gray-900 text-lg leading-snug mb-6">
            {question.question}
          </p>

          <div className="space-y-3">
            {question.options.map((option, i) => {
              let style =
                'flex items-center gap-3 w-full rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors text-left '
              if (!showAnswer) {
                style +=
                  selected === i
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 cursor-pointer'
              } else {
                if (i === question.correctIndex) {
                  style += 'border-green-500 bg-green-50 text-green-700'
                } else if (i === selected && selected !== question.correctIndex) {
                  style += 'border-red-400 bg-red-50 text-red-700'
                } else {
                  style += 'border-gray-200 text-gray-400'
                }
              }

              return (
                <button key={i} className={style} onClick={() => selectOption(i)} disabled={showAnswer}>
                  <span className="h-6 w-6 rounded-full border-2 border-current flex items-center justify-center shrink-0 text-xs font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </button>
              )
            })}
          </div>

          {showAnswer && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${
                isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {isCorrect
                ? '✓ Correct!'
                : `✗ The correct answer is: ${question.options[question.correctIndex]}`}
            </div>
          )}

          <div className="mt-6">
            {!showAnswer ? (
              <Button
                onClick={confirmAnswer}
                disabled={selected === null}
                className="w-full"
              >
                Confirm answer
              </Button>
            ) : (
              <Button onClick={nextQuestion} className="w-full">
                {current + 1 < questions.length ? 'Next question →' : 'See results'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
