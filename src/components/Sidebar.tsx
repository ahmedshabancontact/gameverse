"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Clock,
  Compass,
  Crown,
  Gamepad2,
  Heart,
  LayoutGrid,
  Medal,
  Monitor,
  Settings,
  Shield,
  TrendingUp,
  Trophy,
  User,
  X,
} from "lucide-react";
import { LogoMark, Wordmark } from "./Logo";
import { Avatar } from "./Avatar";
import { levelProgress } from "@/lib/level";

export type NavUser = {
  username: string;
  role: string;
  level: number;
  xp: number;
  avatarUrl: string | null;
} | null;

const MAIN = [
  { href: "/", label: "Home", icon: Gamepad2 },
  { href: "/explore", label: "Explore Games", icon: Compass },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/multiplayer", label: "Multiplayer", icon: Monitor },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

const LIBRARY = [
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/history", label: "Recently Played", icon: Clock },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user, open, onClose }: { user: NavUser; open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const progress = user ? levelProgress(user.xp) : null;

  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(6,6,14,0.72)", backdropFilter: "blur(3px)" }}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col transition-transform duration-300 md:w-[76px] xl:w-[248px] ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{
          background: "var(--panel)",
          borderRight: "1px solid var(--line)",
        }}
      >
        <div className="flex h-[68px] items-center gap-2.5 px-4 md:justify-center xl:justify-start">
          <Link href="/" className="flex items-center gap-2.5" onClick={onClose}>
            <LogoMark size={36} />
            <span className="md:hidden xl:inline">
              <Wordmark />
            </span>
          </Link>
          <button
            className="ml-auto rounded p-1.5 md:hidden"
            onClick={onClose}
            aria-label="Close menu"
            style={{ color: "var(--muted)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="hairline mx-3" />

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="micro mb-2 px-3 md:hidden xl:block">Cabinet</p>
          <div className="flex flex-col gap-1">
            {MAIN.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="nav-item"
                data-active={active(href)}
                title={label}
              >
                <Icon size={18} className="shrink-0" />
                <span className="md:hidden xl:inline">{label}</span>
              </Link>
            ))}
          </div>

          <p className="micro mb-2 mt-6 px-3 md:hidden xl:block">Your library</p>
          <div className="flex flex-col gap-1">
            {LIBRARY.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="nav-item"
                data-active={active(href)}
                title={label}
              >
                <Icon size={18} className="shrink-0" />
                <span className="md:hidden xl:inline">{label}</span>
              </Link>
            ))}
          </div>

          {user?.role === "admin" && (
            <>
              <p className="micro mb-2 mt-6 px-3 md:hidden xl:block">Operations</p>
              <Link href="/admin" className="nav-item" data-active={active("/admin")} title="Admin dashboard">
                <Shield size={18} className="shrink-0" />
                <span className="md:hidden xl:inline">Admin Dashboard</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-3">
          {user ? (
            <Link
              href="/profile"
              className="plate-flat flex items-center gap-2.5 p-2.5 transition-colors hover:border-[color:var(--violet)]"
              title={user.username}
            >
              <Avatar name={user.username} src={user.avatarUrl} size={36} ring />
              <div className="min-w-0 flex-1 md:hidden xl:block">
                <p className="truncate text-[13px] font-semibold">{user.username}</p>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--line)" }}>
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${progress?.pct ?? 0}%`, background: "linear-gradient(90deg,var(--violet),var(--cyan))" }}
                  />
                </div>
                <p className="micro mt-1.5 flex items-center gap-1">
                  <Medal size={10} style={{ color: "var(--amber)" }} />
                  <span className="tabnum">LVL {progress?.level ?? 1}</span>
                  <span style={{ color: "var(--muted-2)" }}>· {user.xp.toLocaleString()} XP</span>
                </p>
              </div>
            </Link>
          ) : (
            <div className="flex flex-col gap-2 md:hidden xl:flex">
              <Link href="/login" className="btn btn-ghost btn-sm w-full">
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm w-full">
                <Crown size={13} /> Create account
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
