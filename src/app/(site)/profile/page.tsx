import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, Clock, Flame, Gamepad2, Heart, Pencil, Trophy, Zap } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { ProfileForm } from "@/components/AccountForms";
import { GameCard, Rail, SectionHead, EmptyState } from "@/components/GameCard";
import { SignInPrompt } from "@/components/Interactions";
import { getFavoriteGameIds, getGames, getRecentlyPlayed, getUserStats } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";
import { levelProgress } from "@/lib/level";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your GameVerse player profile, stats, achievements and shelves.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-[1500px] px-5 py-16 md:px-10">
        <p className="micro micro-violet">// Player card</p>
        <h1 className="display mt-2" style={{ fontSize: "clamp(34px,5vw,58px)" }}>
          Profile
        </h1>
        <div className="mt-8">
          <SignInPrompt title="Sign in to see your player card" />
        </div>
      </div>
    );
  }

  const [stats, favIds, recent] = await Promise.all([
    getUserStats(user.id),
    getFavoriteGameIds(user.id),
    getRecentlyPlayed(user.id, 8),
  ]);
  const favGames = favIds.length ? await getGames({ ids: favIds }) : [];
  const progress = levelProgress(user.xp);
  const unlocked = stats.achievements.filter((a) => a.unlocked);

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10">
      {/* player card */}
      <div
        className="plate grain relative overflow-hidden px-7 py-9"
        style={{
          background:
            "linear-gradient(118deg, color-mix(in srgb, var(--violet) 30%, var(--panel)) 0%, var(--panel) 52%, color-mix(in srgb, var(--cyan) 14%, var(--panel)) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{ background: "repeating-linear-gradient(112deg, rgba(167,139,250,0.6) 0 1px, transparent 1px 11px)" }}
        />
        <div className="relative flex flex-wrap items-center gap-7">
          <Avatar name={user.username} src={user.avatarUrl} size={104} ring />
          <div className="min-w-[220px] flex-1">
            <p className="micro micro-violet">// Player card</p>
            <h1 className="display mt-1.5" style={{ fontSize: "clamp(30px,4.4vw,52px)" }}>
              {user.username}
            </h1>
            <p className="mt-2 max-w-[52ch] text-[14px]" style={{ color: "var(--muted)" }}>
              {user.bio || "No tagline yet — tell the floor who you are."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="chip" style={{ borderColor: "color-mix(in srgb, var(--amber) 45%, transparent)", color: "var(--amber)" }}>
                <Trophy size={11} /> Level {progress.level}
              </span>
              <span className="chip">
                <Zap size={11} /> <span className="tabnum">{user.xp.toLocaleString()}</span> XP
              </span>
              <span className="chip">
                <Flame size={11} /> <span className="tabnum">{user.coins.toLocaleString()}</span> coins
              </span>
              {user.role === "admin" && (
                <Link href="/admin" className="chip" style={{ borderColor: "var(--violet)", color: "var(--violet-hi)" }}>
                  Admin console
                </Link>
              )}
            </div>
          </div>
          <div className="min-w-[240px]">
            <div className="flex items-center justify-between">
              <p className="micro">Progress to level {progress.level + 1}</p>
              <span className="tabnum text-[11px]" style={{ color: "var(--cyan)" }}>
                {progress.pct}%
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
              <div
                className="h-full rounded-full transition-[width] duration-1000"
                style={{ width: `${progress.pct}%`, background: "linear-gradient(90deg,var(--violet),var(--cyan))" }}
              />
            </div>
            <p className="micro mt-2.5">
              <span className="tabnum">{progress.into.toLocaleString()}</span> / <span className="tabnum">{progress.need.toLocaleString()}</span> XP
            </p>
          </div>
        </div>
      </div>

      {/* stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Runs played", value: stats.runs, icon: Gamepad2, color: "var(--cyan)" },
          { label: "Best score", value: stats.best, icon: Trophy, color: "var(--amber)" },
          { label: "Total score", value: stats.totalScore, icon: Flame, color: "var(--violet-hi)" },
          { label: "Minutes played", value: Math.round(stats.minutes / 60), icon: Clock, color: "var(--mint)" },
          { label: "Achievements", value: unlocked.length, icon: Award, color: "var(--rose)" },
        ].map((s) => (
          <div key={s.label} className="plate-flat p-5">
            <s.icon size={16} style={{ color: s.color }} />
            <p className="tabnum mt-2.5 text-[26px] leading-none">{Number(s.value).toLocaleString()}</p>
            <p className="micro mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* achievements */}
        <section>
          <SectionHead index="// Achievements" title="Trophy case" note={`${unlocked.length} of ${stats.achievements.length} unlocked.`} />
          <div className="grid gap-3 sm:grid-cols-2">
            {stats.achievements.map((a) => (
              <div
                key={a.id}
                className="plate-flat flex items-start gap-3.5 p-4"
                style={{
                  opacity: a.unlocked ? 1 : 0.55,
                  borderColor: a.unlocked ? "color-mix(in srgb, var(--amber) 34%, var(--line))" : "var(--line)",
                }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded"
                  style={{
                    background: a.unlocked ? "color-mix(in srgb, var(--amber) 24%, transparent)" : "var(--panel)",
                    border: `1px solid ${a.unlocked ? "color-mix(in srgb, var(--amber) 42%, transparent)" : "var(--line)"}`,
                  }}
                >
                  <Award size={17} style={{ color: a.unlocked ? "var(--amber)" : "var(--muted-2)" }} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold">{a.name}</p>
                    <span className="micro" style={{ color: a.unlocked ? "var(--amber)" : "var(--muted-2)" }}>
                      {a.tier}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px]" style={{ color: "var(--muted)" }}>
                    {a.description}
                  </p>
                  <p className="micro mt-1.5">+{a.xpReward} XP</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <SectionHead index="// Recently played" title="Your last runs" href="/history" hrefLabel="Full history" />
            {recent.length ? (
              <div className="plate overflow-hidden">
                <ul>
                  {recent.map((r, i) => (
                    <li key={`${r.gameId}-${i}`} className="flex items-center gap-4 px-5 py-3.5" style={{ borderTop: i ? "1px solid var(--line)" : "none" }}>
                      <Avatar name={r.title} size={30} />
                      <div className="flex-1">
                        <Link href={`/games/${r.slug}`} className="text-[13px] font-semibold hover:text-[color:var(--violet-hi)]">
                          {r.title}
                        </Link>
                        <p className="micro mt-0.5">
                          {new Date(r.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                      <span className="tabnum text-[13px]" style={{ color: "var(--amber)" }}>
                        {r.score.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <EmptyState title="No runs yet" body="Play a cabinet and your run history will fill up here." />
            )}
          </div>
        </section>

        {/* edit */}
        <aside className="flex flex-col gap-6">
          <ProfileForm username={user.username} bio={user.bio ?? ""} avatarUrl={user.avatarUrl ?? ""} />
          <div className="plate-flat p-5">
            <div className="flex items-center gap-2.5">
              <Pencil size={15} style={{ color: "var(--violet-hi)" }} />
              <p className="micro micro-violet">Account</p>
            </div>
            <dl className="mt-4 flex flex-col gap-3">
              {[
                ["Email", user.email],
                ["Member since", new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })],
                ["Last active", new Date(user.lastActiveAt).toLocaleDateString(undefined, { day: "2-digit", month: "short" })],
                ["Role", user.role],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-4">
                  <dt className="micro">{k}</dt>
                  <dd className="truncate text-[12.5px]">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>

      {/* favorites */}
      <section className="mt-16">
        <SectionHead index="// Your shelf" title="Favorite cabinets" href="/favorites" hrefLabel="Manage" />
        {favGames.length ? (
          <Rail label="Favorite games">
            {favGames.map((g) => (
              <GameCard key={g.id} game={g} />
            ))}
          </Rail>
        ) : (
          <EmptyState
            title="Nothing on the shelf yet"
            body="Tap the heart on any cabinet and it lands here for quick access."
            action={
              <Link href="/explore" className="btn btn-primary mt-2">
                <Heart size={14} /> Find games
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
