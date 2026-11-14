import Link from "next/link";
import { Play, Star, Users, Sparkles } from "lucide-react";
import { GameArt } from "./GameArt";
import type { GameRow } from "@/lib/data";

function Rating({ value, count }: { value: number; count: number }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
      <Star size={12} style={{ color: "var(--amber)" }} fill="var(--amber)" />
      <span className="tabnum" style={{ color: "var(--amber)" }}>
        {Number(value).toFixed(1)}
      </span>
      <span className="tabnum">({count})</span>
    </span>
  );
}

/** The standard game plate used across every rail and grid. */
export function GameCard({ game, size = "md" }: { game: GameRow; size?: "sm" | "md" | "lg" }) {
  const w = size === "lg" ? "w-full" : size === "sm" ? "w-[212px]" : "w-[268px]";
  return (
    <article className={`${w} group`}>
      <Link
        href={`/games/${game.slug}`}
        className="plate block overflow-hidden transition-transform duration-300 hover:-translate-y-1.5"
      >
        <div
          className="relative overflow-hidden"
          style={{ aspectRatio: "16/10", background: "var(--void-2)" }}
        >
          <GameArt game={game} className="transition-transform duration-[900ms] group-hover:scale-[1.07]" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(11,11,18,0) 32%, rgba(11,11,18,0.55) 72%, rgba(11,11,18,0.92) 100%)",
            }}
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <span
              className="chip"
              style={{
                background: "rgba(11,11,18,0.72)",
                borderColor: game.accent,
                color: "#fff",
                backdropFilter: "blur(6px)",
              }}
            >
              {game.categoryName ?? "Game"}
            </span>
          </div>
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
            <div>
              <h3 className="display text-[17px] leading-tight" style={{ color: "#fff" }}>
                {game.title}
              </h3>
              <p className="micro mt-1" style={{ color: "rgba(255,255,255,0.62)" }}>
                {game.players} · {game.difficulty}
              </p>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full opacity-0 transition-all duration-300 group-hover:opacity-100"
              style={{ background: game.accent, boxShadow: `0 0 26px -4px ${game.accent}` }}
            >
              <Play size={16} fill="#fff" color="#fff" />
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 px-3.5 py-3">
          <p className="truncate text-[12px]" style={{ color: "var(--muted)" }}>
            {game.tagline}
          </p>
          <Rating value={Number(game.ratingAvg)} count={game.ratingCount} />
        </div>
      </Link>
    </article>
  );
}

/** Wide editorial plate used for the hero and the daily challenge. */
export function GamePlate({
  game,
  eyebrow,
  blurb,
  compact = false,
}: {
  game: GameRow;
  eyebrow?: string;
  blurb?: string;
  compact?: boolean;
}) {
  return (
    <div className="plate grain relative overflow-hidden">
      <div className="relative" style={{ aspectRatio: compact ? "21/9" : "16/9" }}>
        <GameArt game={game} />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(96deg, rgba(11,11,18,0.96) 4%, rgba(11,11,18,0.72) 40%, rgba(11,11,18,0.12) 78%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: `linear-gradient(180deg, transparent 60%, ${game.accent}22 100%)`,
          }}
        />
        <div className="absolute inset-y-0 left-0 flex max-w-[62%] flex-col justify-center gap-3 p-7 md:p-10">
          {eyebrow && <p className="micro micro-violet">{eyebrow}</p>}
          <h2 className="display" style={{ fontSize: "clamp(28px,4vw,52px)", color: "#fff" }}>
            {game.title}
          </h2>
          <p className="max-w-[46ch] text-[14px] leading-relaxed" style={{ color: "rgba(237,236,245,0.82)" }}>
            {blurb ?? game.tagline}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <Link href={`/games/${game.slug}`} className="btn btn-primary">
              <Play size={15} fill="currentColor" /> Play now
            </Link>
            <Link href={`/games/${game.slug}#reviews`} className="btn btn-ghost">
              <Star size={14} /> {Number(game.ratingAvg).toFixed(1)} · {game.ratingCount} reviews
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Horizontal rail with an editorial section head. */
export function SectionHead({
  index,
  title,
  note,
  href,
  hrefLabel = "See all",
}: {
  index: string;
  title: string;
  note?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-6">
      <div>
        <p className="micro micro-violet">{index}</p>
        <h2 className="display mt-1.5" style={{ fontSize: "clamp(22px,2.4vw,32px)" }}>
          {title}
        </h2>
        {note && (
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px]" style={{ color: "var(--muted)" }}>
            <Sparkles size={13} style={{ color: "var(--cyan)" }} />
            {note}
          </p>
        )}
      </div>
      {href && (
        <Link href={href} className="btn btn-ghost btn-sm shrink-0">
          {hrefLabel}
        </Link>
      )}
    </div>
  );
}

export function Rail({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="rail" role="list" aria-label={label}>
      {children}
    </div>
  );
}

export function PlayerCount({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted)" }}>
      <Users size={12} />
      <span className="tabnum">{count.toLocaleString()}</span>
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="plate-flat flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{ background: "color-mix(in srgb, var(--violet) 22%, transparent)", border: "1px solid var(--line)" }}
      >
        <Sparkles size={22} style={{ color: "var(--violet-hi)" }} />
      </div>
      <h3 className="display text-xl">{title}</h3>
      <p className="max-w-[42ch] text-[13px]" style={{ color: "var(--muted)" }}>
        {body}
      </p>
      {action}
    </div>
  );
}
