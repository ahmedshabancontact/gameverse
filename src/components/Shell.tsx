"use client";

import { useState } from "react";
import { Sidebar, type NavUser } from "./Sidebar";
import { TopBar } from "./TopBar";

export function Shell({
  user,
  daily,
  children,
}: {
  user: NavUser;
  daily: { title: string; gameSlug: string; targetScore: number; xpReward: number } | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "var(--void)" }}>
      <Sidebar user={user} open={open} onClose={() => setOpen(false)} />
      <div className="md:pl-[76px] xl:pl-[248px]">
        <TopBar user={user} daily={daily} onMenu={() => setOpen(true)} />
        <main className="min-h-[calc(100vh-68px)]">{children}</main>
      </div>
    </div>
  );
}
