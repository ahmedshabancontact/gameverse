"use client";

import { useState } from "react";
import type { GameRow } from "@/lib/data";

/** Procedural "cabinet label" art used when a game has no photo thumbnail. */
function ProceduralArt({ seed, accent, title }: { seed: string; accent: string; title: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const motif = h % 4;
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`ga-${h}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0B0B12" />
          <stop offset="60%" stopColor={accent} stopOpacity="0.42" />
          <stop offset="100%" stopColor="#0B0B12" />
        </linearGradient>
        <pattern id={`gs-${h}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="none" />
          <path d="M0 8 L8 0" stroke={accent} strokeOpacity="0.16" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="320" height="200" fill={`url(#ga-${h})`} />
      <rect width="320" height="200" fill={`url(#gs-${h})`} />
      {motif === 0 && (
        <g opacity="0.85">
          <circle cx="160" cy="100" r="62" fill="none" stroke={accent} strokeWidth="2" />
          <circle cx="160" cy="100" r="40" fill="none" stroke={accent} strokeWidth="1.5" strokeDasharray="6 8" />
          <circle cx="160" cy="100" r="14" fill={accent} fillOpacity="0.7" />
        </g>
      )}
      {motif === 1 && (
        <g opacity="0.85">
          {Array.from({ length: 7 }).map((_, i) => (
            <rect key={i} x={40 + i * 36} y={120 - ((i * 37) % 70)} width="18" height={60 + ((i * 37) % 70)} fill={accent} fillOpacity={0.2 + i * 0.09} />
          ))}
        </g>
      )}
      {motif === 2 && (
        <g opacity="0.9">
          <path d="M20 170 L110 40 L200 170 Z" fill="none" stroke={accent} strokeWidth="2.5" />
          <path d="M120 170 L210 60 L300 170 Z" fill={accent} fillOpacity="0.28" />
        </g>
      )}
      {motif === 3 && (
        <g opacity="0.9">
          {Array.from({ length: 5 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, c) => (
              <rect
                key={`${r}-${c}`}
                x={54 + c * 28}
                y={32 + r * 28}
                width="18"
                height="18"
                fill={(r + c + (h % 3)) % 3 === 0 ? accent : "#1a1a28"}
                fillOpacity={(r + c) % 2 === 0 ? 0.85 : 0.35}
              />
            ))
          )}
        </g>
      )}
      <text
        x="20"
        y="182"
        fontFamily="Chakra Petch, system-ui, sans-serif"
        fontWeight="700"
        fontSize="30"
        letterSpacing="4"
        fill="#ffffff"
        fillOpacity="0.16"
      >
        {initials}
      </text>
    </svg>
  );
}

export function GameArt({
  game,
  className = "",
  priority = false,
}: {
  game: Pick<GameRow, "slug" | "title" | "accent" | "thumbnailUrl">;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`}>
      <div className="absolute inset-0">
        <ProceduralArt seed={game.slug} accent={game.accent} title={game.title} />
      </div>
      {game.thumbnailUrl && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={game.thumbnailUrl}
          alt={`${game.title} key art`}
          loading={priority ? "eager" : "lazy"}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
