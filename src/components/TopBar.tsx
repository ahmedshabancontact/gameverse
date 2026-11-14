"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, LogOut, Menu, Moon, Search, Sun, Volume2, VolumeX, Zap } from "lucide-react";
import { Avatar } from "./Avatar";
import { useSettings } from "./ThemeContext";
import { logoutAction } from "@/lib/actions";
import type { NavUser } from "./Sidebar";

export function TopBar({
  user,
  daily,
  onMenu,
}: {
  user: NavUser;
  daily: { title: string; gameSlug: string; targetScore: number; xpReward: number } | null;
  onMenu: () => void;
}) {
  const router = useRouter();
  const { theme, set, sound } = useSettings();
  const [q, setQ] = useState("");
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-30 flex h-[68px] items-center gap-3 px-4 md:px-7"
      style={{
        background: "color-mix(in srgb, var(--panel) 88%, transparent)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <button
        onClick={onMenu}
        className="rounded p-2 md:hidden"
        aria-label="Open navigation"
        style={{ color: "var(--ink)" }}
      >
        <Menu size={20} />
      </button>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/search?q=${encodeURIComponent(q)}`);
        }}
        className="relative flex-1 md:max-w-[420px]"
      >
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-2)" }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="field"
          style={{ paddingLeft: 38, height: 42 }}
          placeholder="Search 20 games…"
          aria-label="Search games"
        />
      </form>

      {daily && (
        <Link
          href={`/games/${daily.gameSlug}`}
          className="hidden items-center gap-2 rounded px-3 py-2 lg:flex"
          style={{
            border: "1px solid color-mix(in srgb, var(--amber) 42%, transparent)",
            background: "color-mix(in srgb, var(--amber) 12%, transparent)",
          }}
        >
          <Zap size={14} style={{ color: "var(--amber)" }} />
          <span className="micro" style={{ color: "var(--amber)" }}>
            Daily · {daily.title}
          </span>
          <span className="tabnum text-[11px]" style={{ color: "var(--ink)" }}>
            +{daily.xpReward} XP
          </span>
        </Link>
      )}

      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => set({ sound: !sound })}
          className="rounded p-2 transition-colors hover:bg-white/5"
          aria-label={sound ? "Mute sound" : "Enable sound"}
          style={{ color: sound ? "var(--cyan)" : "var(--muted-2)" }}
        >
          {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button
          onClick={() => set({ theme: theme === "dark" ? "light" : "dark" })}
          className="rounded p-2 transition-colors hover:bg-white/5"
          aria-label="Toggle colour theme"
          style={{ color: "var(--muted)" }}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative rounded p-2 transition-colors hover:bg-white/5"
            aria-label="Notifications"
            style={{ color: "var(--muted)" }}
          >
            <Bell size={18} />
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--amber)", boxShadow: "0 0 10px var(--amber)" }}
            />
          </button>
          {bellOpen && (
            <>
              <button className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} aria-label="Close notifications" />
              <div className="plate absolute right-0 top-12 z-50 w-[300px] p-4">
                <p className="micro micro-violet">Notifications</p>
                <ul className="mt-3 flex flex-col gap-3">
                  {daily && (
                    <li className="text-[13px]">
                      <p className="font-semibold">{daily.title}</p>
                      <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted)" }}>
                        Score {daily.targetScore.toLocaleString()} points to bank {daily.xpReward} XP.
                      </p>
                    </li>
                  )}
                  <li className="text-[13px]">
                    <p className="font-semibold">Cabinet update</p>
                    <p className="mt-0.5 text-[12px]" style={{ color: "var(--muted)" }}>
                      20 playable games are live across 14 categories.
                    </p>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {user ? (
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)} aria-label="Account menu" className="flex items-center gap-2">
              <Avatar name={user.username} src={user.avatarUrl} size={34} />
            </button>
            {menuOpen && (
              <>
                <button className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
                <div className="plate absolute right-0 top-12 z-50 w-[220px] p-2">
                  <div className="px-3 py-2">
                    <p className="text-[13px] font-semibold">{user.username}</p>
                    <p className="micro mt-1">Level {user.level} · {user.xp.toLocaleString()} XP</p>
                  </div>
                  <div className="hairline my-1" />
                  <Link href="/profile" className="nav-item" onClick={() => setMenuOpen(false)}>
                    Profile
                  </Link>
                  <Link href="/settings" className="nav-item" onClick={() => setMenuOpen(false)}>
                    Settings
                  </Link>
                  <form action={logoutAction}>
                    <button type="submit" className="nav-item w-full" style={{ color: "var(--rose)" }}>
                      <LogOut size={16} /> Sign out
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost btn-sm">
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-primary btn-sm">
              Join free
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
