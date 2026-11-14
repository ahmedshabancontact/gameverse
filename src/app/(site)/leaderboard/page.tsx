import type { Metadata } from "next";
import Link from "next/link";
import { Crown, Medal, TrendingUp, Zap } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { getGameLeaders, getGames, getLeaderboard } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";
import { levelProgress } from "@/lib/level";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Global leaderboard",
  description: "The highest scoring players and the top runs on every GameVerse cabinet.",
};

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  const [players, games] = await Promise.all([getLeaderboard(25), getGames({ sort: "top", limit: 6 })]);
  const gameLeaders = await Promise.all(games.map(async (g) => ({ game: g, rows: await getGameLeaders(g.id, 5) })));
  const myRank = user ? players.findIndex((p) => p.id === user.id) + 1 : 0;

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="micro micro-violet">// Global standings</p>
          <h1 className="display mt-2" style={{ fontSize: "clamp(34px,5vw,64px)" }}>
            Leaderboard
          </h1>
          <p className="mt-3 max-w-[58ch] text-[15px]" style={{ color: "var(--muted)" }}>
            XP decides the ranking. Every run you finish, every achievement you unlock and every daily challenge you
            clear moves you up the board.
          </p>
        </div>
        {user && (
          <div
            className="plate grain min-w-[240px] p-5"
            style={{ background: "linear-gradient(120deg, color-mix(in srgb, var(--violet) 26%, var(--panel)), var(--panel))" }}
          >
            <p className="micro" style={{ color: "var(--violet-hi)" }}>
              // Your position
            </p>
            <div className="mt-3 flex items-center gap-4">
              <Avatar name={user.username} src={user.avatarUrl} size={48} ring />
              <div>
                <p className="text-[15px] font-semibold">{user.username}</p>
                <p className="tabnum text-[13px]" style={{ color: "var(--amber)" }}>
                  {myRank > 0 ? `RANK ${String(myRank).padStart(2, "0")}` : "UNRANKED"}
                </p>
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${levelProgress(user.xp).pct}%`, background: "linear-gradient(90deg,var(--violet),var(--cyan))" }}
              />
            </div>
            <p className="micro mt-2">
              Level {user.level} · <span className="tabnum">{user.xp.toLocaleString()}</span> XP
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        {/* players */}
        <section>
          <div className="plate overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
              <TrendingUp size={16} style={{ color: "var(--cyan)" }} />
              <p className="micro micro-violet">Top players · all time</p>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  {["Rank", "Player", "Level", "XP", "Best score", "Runs"].map((h) => (
                    <th key={h} className="micro px-6 py-3 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-white/[0.03]"
                    style={{
                      borderTop: "1px solid var(--line)",
                      background: user?.id === p.id ? "color-mix(in srgb, var(--violet) 12%, transparent)" : undefined,
                    }}
                  >
                    <td className="px-6 py-3.5">
                      <span
                        className="tabnum inline-flex h-7 w-7 items-center justify-center rounded text-[12px]"
                        style={{
                          background: i === 0 ? "var(--amber)" : i < 3 ? "color-mix(in srgb, var(--violet) 34%, transparent)" : "var(--panel-2)",
                          color: i === 0 ? "#1a1204" : i < 3 ? "#fff" : "var(--muted)",
                          fontWeight: 700,
                        }}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={p.username} src={p.avatarUrl} size={32} />
                        <span className="text-[13.5px] font-medium">{p.username}</span>
                        {p.role === "admin" && <Crown size={13} style={{ color: "var(--amber)" }} />}
                      </div>
                    </td>
                    <td className="tabnum px-6 py-3.5 text-[13px]" style={{ color: "var(--cyan)" }}>
                      {p.level}
                    </td>
                    <td className="tabnum px-6 py-3.5 text-[13px]" style={{ color: "var(--ink)" }}>
                      {p.xp.toLocaleString()}
                    </td>
                    <td className="tabnum px-6 py-3.5 text-[13px]" style={{ color: "var(--amber)" }}>
                      {p.highScore.toLocaleString()}
                    </td>
                    <td className="tabnum px-6 py-3.5 text-[13px]" style={{ color: "var(--muted)" }}>
                      {p.gamesPlayed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* per game */}
        <section>
          <div className="plate overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4" style={{ borderBottom: "1px solid var(--line)" }}>
              <Medal size={16} style={{ color: "var(--amber)" }} />
              <p className="micro micro-violet">Cabinet records</p>
            </div>
            <div className="flex flex-col">
              {gameLeaders.map(({ game, rows }) => (
                <div key={game.id} className="px-6 py-5" style={{ borderTop: "1px solid var(--line)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/games/${game.slug}`} className="text-[14px] font-semibold hover:text-[color:var(--violet-hi)]">
                      {game.title}
                    </Link>
                    <span className="chip" style={{ borderColor: `${game.accent}55`, color: game.accent }}>
                      {game.categoryName}
                    </span>
                  </div>
                  <ul className="mt-3 flex flex-col gap-2">
                    {rows.length ? (
                      rows.map((r, i) => (
                        <li key={`${r.username}-${i}`} className="flex items-center gap-3">
                          <span className="tabnum w-5 text-[11px]" style={{ color: "var(--muted-2)" }}>
                            {i + 1}
                          </span>
                          <Avatar name={r.username ?? "Guest"} src={r.avatarUrl} size={22} />
                          <span className="flex-1 truncate text-[12.5px]" style={{ color: "var(--muted)" }}>
                            {r.username ?? "Guest run"}
                          </span>
                          <span className="tabnum text-[12.5px]" style={{ color: "var(--amber)" }}>
                            {r.score.toLocaleString()}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-[12px]" style={{ color: "var(--muted-2)" }}>
                        No runs posted yet — be the first.
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="plate-flat mt-5 flex items-center gap-3 p-5">
            <Zap size={18} style={{ color: "var(--amber)" }} />
            <p className="text-[12.5px]" style={{ color: "var(--muted)" }}>
              Scores are recorded the moment a run ends. Sign in so your runs count toward the standings.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
