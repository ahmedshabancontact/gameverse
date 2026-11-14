export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role="img"
      aria-label="GameVerse emblem"
    >
      <defs>
        <linearGradient id="gvPlate" x1="6" y1="3" x2="58" y2="61" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" />
          <stop offset="0.55" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#4C1D95" />
        </linearGradient>
        <linearGradient id="gvSheen" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" stopOpacity="0.95" />
          <stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* cabinet plate — chamfered hex */}
      <path
        d="M32 2.5 58.5 16.25 58.5 39.8 32 61.5 5.5 39.8 5.5 16.25Z"
        fill="url(#gvPlate)"
        stroke="#C4B5FD"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      {/* screen cut-out */}
      <path d="M32 12.2 49.4 21.1 49.4 36.2 32 51.6 14.6 36.2 14.6 21.1Z" fill="#0B0B12" />
      {/* V chevron — the mark */}
      <path
        d="M20.6 22.2h7.1l4.3 11.4 4.3-11.4h7.1L34.9 42.1h-5.8L20.6 22.2Z"
        fill="url(#gvPlate)"
      />
      <path d="M20.6 22.2h7.1l4.3 11.4 1.6-4.2-3-8.1-8.2 12.2-1.8-11.3Z" fill="url(#gvSheen)" />
      {/* coin slot */}
      <rect x="29.2" y="44.8" width="5.6" height="2.6" rx="1.3" fill="#FFB020" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-baseline gap-[1px] leading-none">
      <span
        className="display"
        style={{ fontSize: compact ? 18 : 21, letterSpacing: "0.02em", color: "var(--ink)" }}
      >
        GAME
      </span>
      <span
        className="display"
        style={{
          fontSize: compact ? 18 : 21,
          letterSpacing: "0.02em",
          color: "var(--violet-hi)",
          textShadow: "0 0 18px rgba(124,58,237,0.55)",
        }}
      >
        VERSE
      </span>
    </span>
  );
}

export function LogoLockup({ size = 38 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark size={size} />
      <Wordmark />
    </span>
  );
}
