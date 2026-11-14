import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock, Flag, Gamepad2, Star, Trophy, Users, Zap } from "lucide-react";
import { GameCard, Rail, SectionHead } from "@/components/GameCard";
import { GamePlayer, type PlayerGame } from "@/components/GamePlayer";
import { FavoriteButton, ReviewForm, ReviewItem, SignInPrompt } from "@/components/Interactions";
import { Avatar } from "@/components/Avatar";
import { getFavoriteGameIds, getGameBySlug, getGameLeaders, getGames, getReviews } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";
import { ENGINE_BLURB } from "@/games/registry";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) return { title: "Game not found" };
  return {
    title: `${game.title} — play free in the browser`,
    description: game.tagline + " " + game.description.slice(0, 120),
    openGraph: { title: game.title, description: game.tagline, images: game.thumbnailUrl ? [game.thumbnailUrl] : [] },
  };
}

export default async function GamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game || !game.isActive) notFound();

  const user = await getCurrentUser();
  const [reviews, leaders, related, favIds] = await Promise.all([
    getReviews(game.id),
    getGameLeaders(game.id, 8),
    getGames({ category: game.categorySlug as string, limit: 10 }),
    user ? getFavoriteGameIds(user.id) : Promise.resolve([] as number[]),
  ]);

  const playerGame: PlayerGame = {
    id: game.id,
    title: game.title,
    slug: game.slug,
    engine: game.engine,
    config: (game.config ?? {}) as PlayerGame["config"],
    accent: game.accent,
    instructions: game.instructions,
    tagline: game.tagline,
  };

  const relatedGames = related.filter((g) => g.id !== game.id).slice(0, 8);
  const avg = Number(game.ratingAvg);

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-10">
      <Link
        href={`/categories/${game.categorySlug}`}
        className="micro inline-flex items-center gap-1.5 transition-colors hover:text-[color:var(--violet-hi)]"
      >
        <ChevronLeft size={13} /> {game.categoryName}
      </Link>

      <div className="mt-5 grid gap-8 xl:grid-cols-[1.62fr_1fr]">
        <div>
          <GamePlayer game={playerGame} loggedIn={Boolean(user)} />

          <div className="mt-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="micro" style={{ color: game.accent }}>
                  // {ENGINE_BLURB[game.engine] ?? game.engine}
                </p>
                <h1 className="display mt-2" style={{ fontSize: "clamp(32px,4.6vw,58px)" }}>
                  {game.title}
                </h1>
                <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {game.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <FavoriteButton gameId={game.id} initial={favIds.includes(game.id)} initialCount={game.favoritesCount} />
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Rating", value: avg.toFixed(1), sub: `${game.ratingCount} reviews`, icon: Star, color: "var(--amber)" },
                { label: "Plays", value: game.playsCount.toLocaleString(), sub: "total runs", icon: Gamepad2, color: "var(--cyan)" },
                { label: "Top score", value: game.topScore.toLocaleString(), sub: "cabinet record", icon: Trophy, color: "var(--violet-hi)" },
                { label: "Difficulty", value: game.difficulty, sub: game.players, icon: Users, color: "var(--mint)" },
              ].map((s) => (
                <div key={s.label} className="plate-flat p-4">
                  <s.icon size={15} style={{ color: s.color }} />
                  <p className="tabnum mt-2 text-[22px] leading-none">{s.value}</p>
                  <p className="micro mt-1.5">{s.label}</p>
                  <p className="micro mt-0.5" style={{ color: "var(--muted-2)" }}>
                    {s.sub}
                  </p>
                </div>
              ))}
            </div>

            <div className="plate grain mt-7 p-6">
              <p className="micro micro-violet">// How to play</p>
              <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>
                {game.instructions}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Arrow keys / WASD", "Space", "Mouse / touch", "P — pause", "R — restart", "F — fullscreen", "M — mute"].map((k) => (
                  <span key={k} className="chip">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* reviews */}
          <section id="reviews" className="mt-12 scroll-mt-24">
            <SectionHead
              index="// Player reviews"
              title="What the floor thinks"
              note={`${avg.toFixed(1)} average across ${game.ratingCount} rating${game.ratingCount === 1 ? "" : "s"}.`}
            />
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="tabnum" style={{ fontSize: 46, color: "var(--amber)" }}>
                  {avg.toFixed(1)}
                </span>
                <div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} size={15} fill={n <= Math.round(avg) ? "var(--amber)" : "none"} style={{ color: n <= Math.round(avg) ? "var(--amber)" : "var(--line)" }} />
                    ))}
                  </div>
                  <p className="micro mt-1.5">out of 5.0</p>
                </div>
              </div>
              <div className="flex-1">
                {[5, 4, 3, 2, 1].map((n) => {
                  const count = reviews.filter((r) => r.rating === n).length;
                  const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
                  return (
                    <div key={n} className="flex items-center gap-2.5 py-1">
                      <span className="tabnum micro w-3">{n}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--amber)" }} />
                      </div>
                      <span className="tabnum micro w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-7">
              {user ? (
                <ReviewForm gameId={game.id} />
              ) : (
                <SignInPrompt title="Sign in to leave a review" />
              )}
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {reviews.length ? (
                reviews.map((r) => (
                  <ReviewItem key={r.id} review={r} canDelete={user?.id === r.userId || user?.role === "admin"} />
                ))
              ) : (
                <p className="plate-flat p-6 text-[13px]" style={{ color: "var(--muted)" }}>
                  No reviews yet. Be the first to rate this cabinet.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* sidebar */}
        <aside className="flex flex-col gap-6">
          <div className="plate overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
              <Trophy size={15} style={{ color: "var(--amber)" }} />
              <p className="micro micro-violet">Cabinet records</p>
            </div>
            <ul className="p-2">
              {leaders.length ? (
                leaders.map((l, i) => (
                  <li key={`${l.username}-${i}`} className="flex items-center gap-3 px-3 py-2.5">
                    <span
                      className="tabnum flex h-6 w-6 items-center justify-center rounded text-[11px]"
                      style={{
                        background: i === 0 ? "var(--amber)" : "var(--panel-2)",
                        color: i === 0 ? "#1a1204" : "var(--muted)",
                        fontWeight: 700,
                      }}
                    >
                      {i + 1}
                    </span>
                    <Avatar name={l.username ?? "Guest"} src={l.avatarUrl} size={26} />
                    <span className="flex-1 truncate text-[12.5px]">{l.username ?? "Guest run"}</span>
                    <span className="tabnum text-[12.5px]" style={{ color: "var(--amber)" }}>
                      {l.score.toLocaleString()}
                    </span>
                  </li>
                ))
              ) : (
                <li className="px-4 py-6 text-center text-[12.5px]" style={{ color: "var(--muted-2)" }}>
                  No runs recorded yet. The board is yours.
                </li>
              )}
            </ul>
            <div className="px-5 pb-5">
              <Link href="/leaderboard" className="btn btn-ghost btn-sm w-full">
                Full leaderboard
              </Link>
            </div>
          </div>

          <div className="plate grain p-5">
            <p className="micro micro-violet">// Game details</p>
            <dl className="mt-4 flex flex-col gap-3">
              {[
                ["Genre", game.categoryName ?? "—"],
                ["Engine", game.engine],
                ["Players", game.players],
                ["Difficulty", game.difficulty],
                ["Released", new Date(game.releasedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })],
                ["Status", game.isActive ? "Live on the floor" : "Under maintenance"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <dt className="micro">{k}</dt>
                  <dd className="text-[12.5px]" style={{ color: "var(--ink)" }}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="hairline my-4" />
            <div className="flex flex-wrap gap-2">
              <span className="chip">
                <Clock size={11} /> Endless
              </span>
              <span className="chip">
                <Zap size={11} /> XP enabled
              </span>
              <span className="chip">
                <Flag size={11} /> Score saving
              </span>
            </div>
          </div>

          <div
            className="plate p-5"
            style={{ background: "linear-gradient(140deg, color-mix(in srgb, var(--violet) 22%, var(--panel)), var(--panel))" }}
          >
            <p className="micro" style={{ color: "var(--violet-hi)" }}>
              // Pro tip
            </p>
            <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
              Press <strong style={{ color: "var(--ink)" }}>F</strong> inside the cabinet for fullscreen, and hit{" "}
              <strong style={{ color: "var(--ink)" }}>R</strong> the instant a run ends — the restart is instant and the
              score still saves.
            </p>
          </div>
        </aside>
      </div>

      {relatedGames.length > 0 && (
        <section className="mt-16">
          <SectionHead index="// Keep playing" title="Related cabinets" note={`More from ${game.categoryName}.`} href={`/categories/${game.categorySlug}`} />
          <Rail label="Related games">
            {relatedGames.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </Rail>
        </section>
      )}
    </div>
  );
}
