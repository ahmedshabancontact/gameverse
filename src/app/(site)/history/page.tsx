import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Play } from "lucide-react";
import { EmptyState } from "@/components/GameCard";
import { SignInPrompt } from "@/components/Interactions";
import { getRecentlyPlayed } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recently played",
  description: "Your GameVerse play history and recent scores.",
};

export default async function HistoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-[1500px] px-5 py-16 md:px-10">
        <p className="micro micro-violet">// Your history</p>
        <h1 className="display mt-2" style={{ fontSize: "clamp(34px,5vw,58px)" }}>
          Recently played
        </h1>
        <div className="mt-8">
          <SignInPrompt title="Sign in to keep a record" />
        </div>
      </div>
    );
  }

  const rows = await getRecentlyPlayed(user.id, 40);

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10">
      <p className="micro micro-violet">// Your history</p>
      <h1 className="display mt-2" style={{ fontSize: "clamp(34px,5vw,58px)" }}>
        Recently played
      </h1>
      <p className="mt-3 max-w-[56ch] text-[15px]" style={{ color: "var(--muted)" }}>
        Every run you finish is logged here, newest first, with the score you posted.
      </p>

      <div className="mt-9">
        {rows.length ? (
          <div className="plate overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  {["Game", "Category", "Score", "XP", "When", ""].map((h) => (
                    <th key={h} className="micro px-6 py-3 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.gameId}-${i}`} className="transition-colors hover:bg-white/[0.03]" style={{ borderTop: "1px solid var(--line)" }}>
                    <td className="px-6 py-4">
                      <Link href={`/games/${r.slug}`} className="flex items-center gap-3">
                        <span
                          className="h-9 w-14 shrink-0 overflow-hidden rounded"
                          style={{ background: "var(--panel-2)", border: "1px solid var(--line)" }}
                        >
                          {r.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="block h-full w-full" style={{ background: `linear-gradient(135deg, ${r.accent}, var(--void-2))` }} />
                          )}
                        </span>
                        <span>
                          <span className="block text-[13.5px] font-semibold">{r.title}</span>
                          <span className="micro">{r.difficulty}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="chip" style={{ borderColor: `${r.accent}55`, color: r.accent }}>
                        {r.categoryName}
                      </span>
                    </td>
                    <td className="tabnum px-6 py-4 text-[13px]" style={{ color: "var(--amber)" }}>
                      {r.score.toLocaleString()}
                    </td>
                    <td className="tabnum px-6 py-4 text-[13px]" style={{ color: "var(--cyan)" }}>
                      {Math.round(r.score / 12) + 30}
                    </td>
                    <td className="px-6 py-4 text-[12px]" style={{ color: "var(--muted)" }}>
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {new Date(r.createdAt).toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/games/${r.slug}`} className="btn btn-ghost btn-sm">
                        <Play size={12} /> Play
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No runs yet"
            body="Play any cabinet and your run will show up here with the score you posted."
            action={
              <Link href="/explore" className="btn btn-primary mt-2">
                Find a game
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
