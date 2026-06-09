'use client'

import { useState } from 'react'

const QUESTIONS = [
  {
    id: 'temps',
    area: 'Fridge & freezer temps',
    q: `If the EHO walked in today, could you show your fridge and freezer temperatures from last Tuesday?`,
  },
  {
    id: 'allergens',
    area: 'Allergen matrix',
    q: `Is your allergen matrix up to date with the menu you're serving right now?`,
  },
  {
    id: 'staff',
    area: 'Staff allergen knowledge',
    q: `Could every member of staff on shift correctly answer "does this dish contain nuts?" right now?`,
  },
  {
    id: 'cleaning',
    area: 'Cleaning records',
    q: `Can you produce a signed cleaning record for this week in under a minute?`,
  },
  {
    id: 'deliveries',
    area: 'Delivery checks',
    q: `If a delivery turned up off-temperature, would there be a record that you checked and rejected it?`,
  },
  {
    id: 'proof',
    area: 'Due-diligence trail',
    q: `Is your due-diligence proof timestamped and complete — not three months patchy in a ring binder?`,
  },
]

export function EhoReadinessScore() {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [done, setDone] = useState(false)

  const total = QUESTIONS.length
  const current = QUESTIONS[index]

  function answer(ready: boolean) {
    setAnswers((prev) => ({ ...prev, [current.id]: ready }))
    if (index + 1 < total) setIndex(index + 1)
    else setDone(true)
  }

  function reset() {
    setIndex(0)
    setAnswers({})
    setDone(false)
  }

  const readyCount = Object.values(answers).filter(Boolean).length
  const score = Math.round((readyCount / total) * 100)
  const gaps = QUESTIONS.filter((item) => answers[item.id] === false)

  const band =
    score >= 80
      ? { color: '#1F8A5B', label: 'Inspection-ready', line: "You're on top of it. HospoPilot keeps it that way — without the ring binder." }
      : score >= 50
      ? { color: '#C8881C', label: 'A few gaps to close', line: "Your kitchen isn't the problem — the paper trail is. Here's where you'd be exposed." }
      : { color: '#C5362A', label: 'Exposed on the paperwork', line: "You're not alone — most kitchens have gaps in the proof, not the cooking. HospoPilot closes them." }

  return (
    <div className="bg-white border border-[#E3E9EC] rounded-xl shadow-[0_2px_5px_rgba(20,40,30,0.05),0_12px_30px_-12px_rgba(20,40,30,0.18)] overflow-hidden text-left">
      {/* header */}
      <div className="px-[22px] pt-[18px] pb-4 border-b border-[#E3E9EC] flex items-center gap-[10px]">
        <span className="font-['IBM_Plex_Mono'] text-[10.5px] font-semibold tracking-[0.08em] uppercase text-[#136B43] bg-[#E7F4EC] rounded-full px-3 py-1.5">
          Free · 30-second check
        </span>
        <span className="ml-auto font-['IBM_Plex_Mono'] text-[11px] tracking-[0.05em] uppercase text-[#97A1A7]">
          {done ? 'Your result' : `${index + 1} / ${total}`}
        </span>
      </div>

      {!done ? (
        <div className="px-[22px] py-6">
          {/* progress */}
          <div className="h-1 w-full bg-[#EDF1F2] rounded-full mb-6 overflow-hidden">
            <div
              className="h-1 bg-[#2D6A4F] rounded-full transition-all duration-300"
              style={{ width: `${(index / total) * 100}%` }}
            />
          </div>

          <p className="text-[19px] leading-[1.32] font-bold text-[#1B4332] min-h-[100px] sm:min-h-[76px]">
            {current.q}
          </p>

          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={() => answer(true)}
              className="py-3 rounded-lg font-bold text-[15px] text-white bg-[#1B4332] hover:bg-[#14342A] transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => answer(false)}
              className="py-3 rounded-lg font-bold text-[15px] text-[#1B4332] bg-white border-[1.5px] border-[#C7D0D5] hover:border-[#1B4332] transition-colors"
            >
              Not really
            </button>
          </div>
        </div>
      ) : (
        <div className="px-[22px] py-6">
          <div className="flex items-center gap-4">
            <div
              className="flex-none w-[72px] h-[72px] rounded-full grid place-items-center font-bold text-[21px] text-white tabular-nums"
              style={{ backgroundColor: band.color }}
            >
              {score}%
            </div>
            <div>
              <p className="font-bold text-[#141A1E] text-[17px]">{band.label}</p>
              <p className="text-[13.5px] text-[#677077] leading-[1.45] mt-0.5">{band.line}</p>
            </div>
          </div>

          {gaps.length > 0 ? (
            <div className="mt-5">
              <p className="font-['IBM_Plex_Mono'] text-[11px] font-semibold tracking-[0.06em] uppercase text-[#97A1A7] mb-2">
                Where you&apos;d be exposed
              </p>
              <ul className="space-y-1.5">
                {gaps.map((g) => (
                  <li key={g.id} className="flex items-center gap-2.5 text-[14px] text-[#3A474E]">
                    <span className="w-[7px] h-[7px] rounded-full flex-none bg-[#C5362A]" />
                    {g.area}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-2.5 text-[14px] text-[#136B43]">
              <span className="w-[7px] h-[7px] rounded-full flex-none bg-[#1F8A5B]" />
              Nothing flagged — you could prove all six today.
            </div>
          )}

          <a
            href="/signup"
            className="mt-6 w-full inline-flex items-center justify-center gap-[9px] bg-[#1B4332] text-white font-bold text-[15px] px-6 py-[14px] rounded-lg hover:bg-[#14342A] transition-colors no-underline"
          >
            {gaps.length > 0 ? 'Close these gaps — 14 days free' : 'Keep it this way — start free'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h9M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <button
            onClick={reset}
            className="mt-3 w-full text-center text-[13px] text-[#677077] hover:text-[#1B4332] transition-colors"
          >
            Retake the check
          </button>
        </div>
      )}
    </div>
  )
}
