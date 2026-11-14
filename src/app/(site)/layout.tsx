import type { ReactNode } from "react";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { LogoMark, Wordmark } from "@/components/Logo";
import { getDailyChallenge } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const daily = await getDailyChallenge();

  return (
    <Shell
      user={
        user
          ? {
              username: user.username,
              role: user.role,
              level: user.level,
              xp: user.xp,
              avatarUrl: user.avatarUrl,
            }
          : null
      }
      daily={
        daily
          ? { title: daily.title, gameSlug: daily.gameSlug, targetScore: daily.targetScore, xpReward: daily.xpReward }
          : null
      }
    >
      {children}
      <footer
        className="mt-20 px-5 py-12 md:px-10"
        style={{ background: "var(--panel)", borderTop: "1px solid var(--line)" }}
      >
        <div className="mx-auto grid max-w-[1500px] gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark size={38} />
              <Wordmark />
            </div>
            <p className="mt-4 max-w-[38ch] text-[13px] leading-relaxed" style={{ color: "var(--muted)" }}>
              A cabinet of 20 original HTML5 games built for the browser. No installs, no downloads — press start and
              chase the high score.
            </p>
            <p className="micro mt-5">// Built with canvas, WebGL-free and keyboard-first</p>
          </div>
          {[
            { head: "Play", links: [["Explore games", "/explore"], ["Trending", "/trending"], ["Multiplayer", "/multiplayer"], ["Daily challenge", "/categories"]] },
            { head: "Compete", links: [["Leaderboard", "/leaderboard"], ["Achievements", "/profile"], ["Recently played", "/history"], ["Favorites", "/favorites"]] },
            { head: "Account", links: [["Sign in", "/login"], ["Create account", "/signup"], ["Settings", "/settings"], ["Admin", "/admin"]] },
          ].map((col) => (
            <div key={col.head}>
              <p className="micro micro-violet">{col.head}</p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-[13px] transition-colors hover:text-[color:var(--violet-hi)]"
                      style={{ color: "var(--muted)" }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="hairline my-8" />
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <p className="micro">© {new Date().getFullYear()} GameVerse Amusements · All games original</p>
          <p className="micro">Cabinet build 1.0 · Next.js · PostgreSQL · 20 games online</p>
        </div>
      </footer>
    </Shell>
  );
}
