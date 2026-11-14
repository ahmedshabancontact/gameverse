import type { Metadata } from "next";
import { GameCard, EmptyState } from "@/components/GameCard";
import { FilterBar } from "@/components/FilterBar";
import { getCategories, getGames } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore games",
  description: "Browse all 20 GameVerse browser games by category, rating, popularity and newest releases.",
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const categories = await getCategories();
  const games = await getGames({
    q: sp.q,
    category: sp.category,
    sort: (sp.sort as "trending" | "popular" | "new" | "rating" | "top") ?? "trending",
    limit: 60,
  });

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10">
      <p className="micro micro-violet">// The full cabinet</p>
      <h1 className="display mt-2" style={{ fontSize: "clamp(34px,5vw,64px)" }}>
        Explore games
      </h1>
      <p className="mt-3 max-w-[62ch] text-[15px]" style={{ color: "var(--muted)" }}>
        Every game on GameVerse is playable in the browser, in full screen, with saved scores and global rankings. Filter
        by genre, sort by what the floor is playing, and press start.
      </p>

      <div className="mt-8">
        <FilterBar categories={categories.map((c) => ({ slug: c.slug, name: c.name, accent: c.accent }))} />
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="micro">
          <span className="tabnum">{games.length}</span> cabinet{games.length === 1 ? "" : "s"} found
          {sp.category ? ` · ${sp.category}` : ""}
        </p>
      </div>

      {games.length ? (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {games.map((g) => (
            <div key={g.id} className="w-full">
              <GameCard game={g} size="lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="Nothing on this shelf"
            body="No games match those filters. Try a different category or clear the search."
          />
        </div>
      )}
    </div>
  );
}
