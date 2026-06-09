export function HospoPilotLogo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      {/* 2×2 grid mark */}
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="0"  y="0"  width="10" height="10" rx="2.5" fill="#52B788" />
        <rect x="12" y="0"  width="10" height="10" rx="2.5" fill="#2D6A4F" />
        <rect x="0"  y="12" width="10" height="10" rx="2.5" fill="#2D6A4F" />
        <rect x="12" y="12" width="10" height="10" rx="2.5" fill="#D4A017" />
      </svg>
      {/* wordmark */}
      <span
        className="font-sans font-semibold tracking-[0.16em] text-white"
        style={{ fontSize: '1.05rem', letterSpacing: '0.16em' }}
      >
        HospoPilot
      </span>
    </span>
  )
}
