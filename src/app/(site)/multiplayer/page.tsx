import type { Metadata } from "next";
import { Users } from "lucide-react";
import { GameCard, SectionHead } from "@/components/GameCard";
import { getGames } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Multiplayer",
  description: "Local multiplayer and competitive cabinets — pass the keyboard, post the score, own the board.",
};

export default async function MultiplayerPage() {
  const multiplayer = await getGames({ players: "2 Players", limit: 20 });
  const competitive = await getGames({ sort: "top", limit: 8 });

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10">
      <div
        className="plate grain relative overflow-hidden px-7 py-10"
        style={{ background: "linear-gradient(115deg, color-mix(in srgb, var(--rose) 22%, var(--panel)), var(--panel) 70%)" }}
      >
        <p className="micro" style={{ color: "var(--rose)" }}>
          // Shared cabinet
        </p>
        <h1 className="display mt-2" style={{ fontSize: "clamp(32px,5vw,58px)" }}>
          Multiplayer &amp; competitive
        </h1>
        <p className="mt-3 max-w-[62ch] text-[15px]" style={{ color: "var(--muted)" }}>
          Two-player hot-seat cabinets, head-to-head board games and score attacks built for the leaderboard. Pass the
          keyboard and settle it.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="chip">
            <Users size={12} /> Local co-op
          </span>
          <span className="chip">Score attack</span>
          <span className="chip">Global rankings</span>
        </div>
      </div>

      <section className="mt-12">
        <SectionHead index="// Two players" title="Hot-seat cabinets" note="One keyboard, two contenders." />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {multiplayer.map((g) => (
            <div key={g.id} className="w-full">
              <GameCard game={g} size="lg" />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <SectionHead index="// High score attack" title="Cabinets with a record to beat" href="/leaderboard" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {competitive.map((g) => (
            <div key={g.id} className="w-full">
              <GameCard game={g} size="lg" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
