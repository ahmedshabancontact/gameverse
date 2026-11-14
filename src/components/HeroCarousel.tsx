"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Gamepad2, Play, Star, Users, Zap } from "lucide-react";
import { GameArt } from "./GameArt";
import type { GameRow } from "@/lib/data";

export function HeroCarousel({
  games,
  daily,
}: {
  games: GameRow[];
  daily: { title: string; gameSlug: string; gameTitle: string; targetScore: number; xpReward: number; description: string } | null;
}) {
  const [i, setI] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = games.length;

  const go = useCallback((n: number) => setI((p) => (n + count) % count), [count]);

  useEffect(() => {
    if (count < 2) return;
    timer.current = setInterval(() => go(i + 1), 7200);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [i, go, count]);

  if (!count) return null;
  const game = games[i];

  return (
    <section className="relative">
      <div className="relative overflow-hidden" style={{ minHeight: 520 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={game.id}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 0.8, 0.2, 1] }}
            className="absolute inset-0"
          >
            <GameArt game={game} priority />
          </motion.div>
        </AnimatePresence>

        {/* diagonal scanline scrim */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(96deg, #0B0B12 2%, rgba(11,11,18,0.93) 34%, rgba(11,11,18,0.62) 60%, rgba(76,29,149,0.34) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage: "repeating-linear-gradient(112deg, rgba(167,139,250,0.55) 0 1px, transparent 1px 9px)",
            maskImage: "linear-gradient(90deg, transparent 35%, black 100%)",
            WebkitMaskImage: "linear-gradient(90deg, transparent 35%, black 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{ background: "linear-gradient(180deg, transparent, var(--void))" }}
        />

        <div className="relative z-10 mx-auto grid max-w-[1500px] items-center gap-8 px-5 py-14 md:px-10 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-7">
            <motion.p
              key={`eyebrow-${game.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="micro micro-violet"
            >
              // Featured cabinet · {game.categoryName}
            </motion.p>
            <motion.h1
              key={`title-${game.id}`}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.6, ease: [0.22, 0.8, 0.2, 1] }}
              className="display mt-3"
              style={{ fontSize: "clamp(44px,7.4vw,96px)", color: "#fff", textShadow: "0 0 60px rgba(124,58,237,0.5)" }}
            >
              {game.title}
            </motion.h1>
            <motion.p
              key={`desc-${game.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-5 max-w-[54ch] text-[15px] leading-relaxed md:text-[17px]"
              style={{ color: "rgba(237,236,245,0.8)" }}
            >
              {game.tagline} {game.description.split(".")[0]}.
            </motion.p>

            <motion.div
              key={`meta-${game.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="mt-7 flex flex-wrap items-center gap-2.5"
            >
              <Link href={`/games/${game.slug}`} className="btn btn-primary" style={{ height: 50, padding: "0 28px" }}>
                <Play size={17} fill="currentColor" /> Play now
              </Link>
              <Link href={`/games/${game.slug}#reviews`} className="btn btn-ghost" style={{ height: 50 }}>
                <Star size={15} /> {Number(game.ratingAvg).toFixed(1)}
              </Link>
              <span className="chip">
                <Users size={12} /> {game.players}
              </span>
              <span className="chip">
                <Gamepad2 size={12} /> {game.difficulty}
              </span>
              <span className="chip">
                <span className="tabnum">{game.playsCount.toLocaleString()}</span> plays
              </span>
            </motion.div>

            <div className="mt-8 flex items-center gap-3">
              <div className="flex items-center gap-2">
                {games.map((g, idx) => (
                  <button
                    key={g.id}
                    onClick={() => setI(idx)}
                    aria-label={`Show ${g.title}`}
                    className="h-[3px] rounded-full transition-all duration-300"
                    style={{
                      width: idx === i ? 42 : 16,
                      background: idx === i ? "var(--violet-hi)" : "var(--line)",
                      boxShadow: idx === i ? "0 0 14px var(--violet-hi)" : "none",
                    }}
                  />
                ))}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={() => go(i - 1)} className="btn btn-ghost btn-sm" aria-label="Previous game">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => go(i + 1)} className="btn btn-ghost btn-sm" aria-label="Next game">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="hidden lg:col-span-5 lg:block">
            <motion.div
              key={`plate-${game.id}`}
              initial={{ opacity: 0, x: 40, rotate: -1.2 }}
              animate={{ opacity: 1, x: 0, rotate: -1.2 }}
              transition={{ delay: 0.18, duration: 0.7, ease: [0.22, 0.8, 0.2, 1] }}
              className="plate grain overflow-hidden"
              style={{ boxShadow: `0 50px 90px -50px ${game.accent}` }}
            >
              <div className="relative" style={{ aspectRatio: "4/5" }}>
                <GameArt game={game} />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(180deg, rgba(11,11,18,0) 45%, rgba(11,11,18,0.9) 100%)" }}
                />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="micro" style={{ color: "rgba(255,255,255,0.6)" }}>
                    Top score
                  </p>
                  <p className="tabnum text-[30px] leading-none" style={{ color: "#FFB020" }}>
                    {game.topScore.toLocaleString()}
                  </p>
                </div>
                <div
                  className="absolute right-4 top-4 rounded px-2.5 py-1.5"
                  style={{ background: "rgba(11,11,18,0.7)", border: "1px solid var(--line)" }}
                >
                  <p className="micro" style={{ color: "var(--cyan)" }}>
                    {game.engine.toUpperCase()} ENGINE
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* coin-slot daily challenge overlapping the hero */}
      {daily && (
        <div className="mx-auto -mt-9 max-w-[1500px] px-5 md:px-10">
          <div
            className="plate grain relative flex flex-wrap items-center gap-x-6 gap-y-4 px-6 py-5"
            style={{
              background: "linear-gradient(100deg, var(--panel) 0%, color-mix(in srgb, var(--amber) 10%, var(--panel)) 100%)",
              borderColor: "color-mix(in srgb, var(--amber) 34%, var(--line))",
            }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded"
              style={{ background: "color-mix(in srgb, var(--amber) 22%, transparent)", border: "1px solid color-mix(in srgb, var(--amber) 45%, transparent)" }}
            >
              <Zap size={20} style={{ color: "var(--amber)" }} />
            </div>
            <div className="min-w-[220px] flex-1">
              <p className="micro" style={{ color: "var(--amber)" }}>
                // Daily challenge · resets at midnight
              </p>
              <p className="mt-1 text-[15px] font-semibold">{daily.title}</p>
              <p className="mt-0.5 text-[13px]" style={{ color: "var(--muted)" }}>
                {daily.description}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <p className="micro">Target</p>
                <p className="tabnum text-[20px]" style={{ color: "var(--ink)" }}>
                  {daily.targetScore.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="micro">Reward</p>
                <p className="tabnum text-[20px]" style={{ color: "var(--amber)" }}>
                  +{daily.xpReward} XP
                </p>
              </div>
              <Link href={`/games/${daily.gameSlug}`} className="btn btn-primary">
                Accept
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
