import type { Metadata } from "next";
import { GameCard, SectionHead } from "@/components/GameCard";
import { getGames } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trending",
  description: "The GameVerse cabinets everyone is playing right now, ranked by plays, favourites and reviews.",
};

export default async function TrendingPage() {
  const trending = await getGames({ sort: "trending", limit: 20 });
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10">
      <p className="micro micro-violet">// Live from the floor</p>
      <h1 className="display mt-2" style={{ fontSize: "clamp(34px,5vw,64px)" }}>
        Trending now
      </h1>
      <p className="mt-3 max-w-[62ch] text-[15px]" style={{ color: "var(--muted)" }}>
        Ranked by a blend of plays, favourites and review volume. Updated every time someone presses start.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {trending.map((g, i) => (
          <div key={g.id} className="relative w-full">
            <div className="absolute -left-1 -top-3 z-10">
              <span
                className="tabnum rounded px-2.5 py-1 text-[12px]"
                style={{ background: "var(--amber)", color: "#1a1204", fontWeight: 700 }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>
            <GameCard game={g} size="lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
