import type { Metadata } from "next";
import Link from "next/link";
import { Lock, ShieldAlert } from "lucide-react";
import { AdminConsole } from "@/components/AdminConsole";
import { getAdminTables } from "@/lib/actions";
import { getAdminStats } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin dashboard",
  description: "Private GameVerse operations console.",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-[720px] px-5 py-20 md:px-10">
        <div className="plate grain p-10 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "color-mix(in srgb, var(--rose) 18%, transparent)", border: "1px solid color-mix(in srgb, var(--rose) 40%, transparent)" }}
          >
            <ShieldAlert size={24} style={{ color: "var(--rose)" }} />
          </div>
          <p className="micro mt-6" style={{ color: "var(--rose)" }}>
            // Restricted area
          </p>
          <h1 className="display mt-2 text-[38px]">Administrator access required</h1>
          <p className="mx-auto mt-4 max-w-[46ch] text-[14px]" style={{ color: "var(--muted)" }}>
            This console manages the game catalogue, the community and the platform itself. Sign in with an
            administrator account to continue.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="btn btn-primary">
              <Lock size={14} /> Sign in as admin
            </Link>
            <Link href="/" className="btn btn-ghost">
              Back to the floor
            </Link>
          </div>
          <p className="micro mt-8">Demo credentials · admin@gameverse.gg / gameverse</p>
        </div>
      </div>
    );
  }

  const [stats, tables] = await Promise.all([getAdminStats(), getAdminTables()]);

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="micro micro-violet">// Operations console</p>
          <h1 className="display mt-2" style={{ fontSize: "clamp(32px,4.6vw,56px)" }}>
            Admin dashboard
          </h1>
          <p className="mt-3 max-w-[62ch] text-[14px]" style={{ color: "var(--muted)" }}>
            Catalogue, community and platform controls. Signed in as <strong>{user.username}</strong> — changes apply
            immediately across the site.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/" className="btn btn-ghost btn-sm">
            View site
          </Link>
          <Link href="/leaderboard" className="btn btn-ghost btn-sm">
            Leaderboard
          </Link>
        </div>
      </div>

      <div className="mt-9">
        <AdminConsole
          stats={stats}
          games={tables.allGames as never}
          categories={tables.allCategories as never}
          users={tables.allUsers as never}
          reviews={tables.allReviews as never}
        />
      </div>
    </div>
  );
}
