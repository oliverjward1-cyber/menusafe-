export function HospoPilotLogo({
  className,
  onDark = false,
}: {
  className?: string
  onDark?: boolean
}) {
  return (
    <span className={`inline-flex items-center gap-[11px] ${className ?? ''}`}>
      {/* rounded square + gold star mark (matches the landing page) */}
      <svg width="30" height="30" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="2" y="2" width="40" height="40" rx="10" fill="#1B4332" />
        <path d="M22 9 C 23 18.4 25.6 21 35 22 C 25.6 23 23 25.6 22 35 C 21 25.6 18.4 23 9 22 C 18.4 21 21 18.4 22 9 Z" fill="#D4A017" />
      </svg>
      {/* two-tone wordmark */}
      <span className={`font-sans text-[21px] font-bold tracking-[-0.02em] ${onDark ? 'text-white' : 'text-[#1B4332]'}`}>
        Hospo<b className={onDark ? 'text-hospopilot-fresh' : 'text-[#2D6A4F]'}>Pilot</b>
      </span>
    </span>
  )
}
