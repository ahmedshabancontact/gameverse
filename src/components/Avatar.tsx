const HUES = [
  ["#7C3AED", "#22D3EE"],
  ["#F43F5E", "#FFB020"],
  ["#22D3EE", "#34D399"],
  ["#A78BFA", "#F472B6"],
  ["#FFB020", "#FB923C"],
];

function hashOf(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function Avatar({
  name,
  src,
  size = 40,
  ring = false,
}: {
  name: string;
  src?: string | null;
  size?: number;
  ring?: boolean;
}) {
  const h = hashOf(name || "player");
  const [a, b] = HUES[h % HUES.length];
  const initials = (name || "?")
    .split(/[\s_-]+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  const usePhoto = src && /^https?:\/\//.test(src);

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        boxShadow: ring ? `0 0 0 2px ${a}, 0 0 22px -6px ${a}` : "inset 0 1px 0 rgba(255,255,255,0.12)",
        border: "1px solid var(--line)",
      }}
    >
      {usePhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src as string} alt={name} className="h-full w-full object-cover" />
      ) : (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-label={name} role="img">
          <defs>
            <linearGradient id={`av-${h}`} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor={a} />
              <stop offset="1" stopColor={b} />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="18" fill={`url(#av-${h})`} />
          <path d="M0 40 L64 18 V64 H0Z" fill="rgba(0,0,0,0.22)" />
          <text
            x="32"
            y="41"
            textAnchor="middle"
            fontFamily="Chakra Petch, system-ui, sans-serif"
            fontWeight="700"
            fontSize="26"
            fill="#fff"
            fillOpacity="0.95"
          >
            {initials}
          </text>
        </svg>
      )}
    </span>
  );
}
