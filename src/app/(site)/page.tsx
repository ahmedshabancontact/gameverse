import Link from "next/link";
import { ArrowRight, Boxes, Gamepad2, Globe2, Sparkles, Trophy, Users, Zap } from "lucide-react";
import { GameCard, GamePlate, Rail, SectionHead } from "@/components/GameCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import {
  getCategoriesWithCounts,
  getDailyChallenge,
  getFavoriteGameIds,
  getGames,
  getRecentlyPlayed,
} from "@/lib/data";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [featured, trending, popular, fresh, topRated, categories, daily] = await Promise.all([
    getGames({ featured: true, limit: 5, sort: "rating" }),
    getGames({ sort: "trending", limit: 12 }),
    getGames({ sort: "popular", limit: 12 }),
    getGames({ sort: "new", limit: 12 }),
    getGames({ sort: "rating", limit: 12 }),
    getCategoriesWithCounts(),
    getDailyChallenge(),
  ]);

  let recommended = topRated.slice(0, 12);
  let recent: Awaited<ReturnType<typeof getRecentlyPlayed>> = [];
  if (user) {
    const favIds = await getFavoriteGameIds(user.id);
    recent = await getRecentlyPlayed(user.id, 6);
    if (favIds.length) {
      const favGames = await getGames({ ids: favIds });
      const catIds = new Set(favGames.map((g) => g.categoryId));
      const pool = await getGames({ limit: 60 });
      const rec = pool.filter((g) => catIds.has(g.categoryId) && !favIds.includes(g.id));
      if (rec.length >= 4) recommended = rec.slice(0, 12);
    }
  }

  const heroGames = featured.length >= 2 ? featured : trending.slice(0, 5);
  const dailyGame = daily ? await getGames({ ids: [daily.gameId] }) : [];
  const cabinetStats = [
    { label: "Playable games", value: "20", icon: Gamepad2 },
    { label: "Categories", value: String(categories.length), icon: Boxes },
    { label: "Global players", value: "12,480", icon: Users },
    { label: "Scores posted", value: "94,210", icon: Trophy },
  ];

  return (
    <div>
      <HeroCarousel
        games={heroGames}
        daily={
          daily
            ? {
                title: daily.title,
                gameSlug: daily.gameSlug,
                gameTitle: daily.gameTitle,
                targetScore: daily.targetScore,
                xpReward: daily.xpReward,
                description: daily.description,
              }
            : null
        }
      />

      {/* category rail */}
      <section className="mx-auto max-w-[1500px] px-5 pt-12 md:px-10">
        <SectionHead index="// Browse the cabinet" title="Categories" note="14 genres, one keyboard." href="/categories" />
        <Rail label="Game categories">
          {categories.map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="plate-flat group flex min-w-[196px] items-center gap-3 p-3.5 transition-all hover:-translate-y-1">
              <span
                className="flex h-10 w-10 items-center justify-center rounded"
                style={{ background: `color-mix(in srgb, ${c.accent} 22%, transparent)`, border: `1px solid ${c.accent}55` }}
              >
                <Sparkles size={17} style={{ color: c.accent }} />
              </span>
              <span>
                <span className="block text-[13px] font-semibold">{c.name}</span>
                <span className="micro tabnum">{c.count} games</span>
              </span>
            </Link>
          ))}
        </Rail>
      </section>

      {/* trending */}
      <section className="mx-auto max-w-[1500px] px-5 pt-16 md:px-10">
        <SectionHead
          index="// Now trending"
          title="Climbing the board"
          note="Ranked by plays, favourites and reviews over the last 7 days."
          href="/trending"
        />
        <Rail label="Trending games">
          {trending.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </Rail>
      </section>

      {/* daily featured + stats */}
      <section className="mx-auto max-w-[1500px] px-5 pt-16 md:px-10">
        <SectionHead index="// Game of the day" title="Daily featured cabinet" note="Hand-picked every 24 hours." />
        <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
          {dailyGame[0] ? (
            <GamePlate
              game={dailyGame[0]}
              eyebrow={`// ${daily?.title ?? "Daily feature"}`}
              blurb={daily?.description ?? dailyGame[0].tagline}
            />
          ) : (
            <GamePlate game={trending[0]} eyebrow="// Daily feature" />
          )}
          <div className="flex flex-col gap-4">
            <div className="plate grain p-6">
              <p className="micro micro-violet">// Cabinet statistics</p>
              <div className="mt-5 grid grid-cols-2 gap-4">
                {cabinetStats.map((s) => (
                  <div key={s.label} className="plate-flat p-4">
                    <s.icon size={16} style={{ color: "var(--cyan)" }} />
                    <p className="tabnum mt-2 text-[26px] leading-none" style={{ color: "var(--ink)" }}>
                      {s.value}
                    </p>
                    <p className="micro mt-1.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="plate p-6"
              style={{
                background: "linear-gradient(135deg, color-mix(in srgb, var(--violet) 32%, var(--panel)), var(--panel))",
              }}
            >
              <p className="micro" style={{ color: "var(--violet-hi)" }}>
                // Level up
              </p>
              <p className="display mt-2 text-[26px] leading-tight">
                Every run banks XP.
                <br />
                Every level unlocks clout.
              </p>
              <p className="mt-3 text-[13px]" style={{ color: "var(--muted)" }}>
                Finish runs to earn XP, unlock 12 achievements and post your best score to the global leaderboard.
              </p>
              <div className="mt-5 flex gap-2.5">
                <Link href={user ? "/leaderboard" : "/signup"} className="btn btn-primary">
                  {user ? "View leaderboard" : "Create free account"} <ArrowRight size={15} />
                </Link>
                <Link href="/explore" className="btn btn-ghost">
                  Explore all
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* recently played */}
      {recent.length > 0 && (
        <section className="mx-auto max-w-[1500px] px-5 pt-16 md:px-10">
          <SectionHead index="// Welcome back" title="Recently played" href="/history" hrefLabel="Full history" />
          <Rail label="Recently played">
            {recent.map((g) => (
              <GameCard key={g.gameId} game={g as never} />
            ))}
          </Rail>
        </section>
      )}

      {/* popular */}
      <section className="mx-auto max-w-[1500px] px-5 pt-16 md:px-10">
        <SectionHead
          index="// Most popular"
          title="Crowd favourites"
          note="The cabinets with the longest queues."
          href="/explore?sort=popular"
        />
        <Rail label="Most popular games">
          {popular.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </Rail>
      </section>

      {/* recently added */}
      <section className="mx-auto max-w-[1500px] px-5 pt-16 md:px-10">
        <SectionHead index="// Recently added" title="Fresh off the truck" href="/explore?sort=new" />
        <Rail label="Recently added games">
          {fresh.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </Rail>
      </section>

      {/* recommended */}
      <section className="mx-auto max-w-[1500px] px-5 pt-16 md:px-10">
        <SectionHead
          index="// Recommended for you"
          title={user ? `Picked for ${user.username}` : "Where to start"}
          note={user ? "Based on the games you have favourited." : "The highest rated cabinets on the floor."}
        />
        <Rail label="Recommended games">
          {recommended.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </Rail>
      </section>

      {/* closing band */}
      <section className="mx-auto max-w-[1500px] px-5 pt-20 md:px-10">
        <div
          className="plate grain relative overflow-hidden px-8 py-14 text-center"
          style={{
            background: "linear-gradient(120deg, color-mix(in srgb, var(--violet) 26%, var(--panel)) 0%, var(--panel) 55%, color-mix(in srgb, var(--cyan) 14%, var(--panel)) 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{ background: "repeating-linear-gradient(90deg, transparent 0 22px, rgba(255,255,255,0.06) 22px 23px)" }}
          />
          <Globe2 size={30} className="mx-auto" style={{ color: "var(--cyan)" }} />
          <h2 className="display mt-4" style={{ fontSize: "clamp(30px,4.6vw,58px)" }}>
            The cabinet is always on.
          </h2>
          <p className="mx-auto mt-4 max-w-[54ch] text-[15px]" style={{ color: "var(--muted)" }}>
            Twenty original games, fourteen categories, a global leaderboard and a daily challenge — all playable in the
            browser you already have open.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/explore" className="btn btn-primary" style={{ height: 50, padding: "0 30px" }}>
              <Zap size={16} /> Start playing
            </Link>
            <Link href="/leaderboard" className="btn btn-ghost" style={{ height: 50 }}>
              See who is winning
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
