"use client";

import { useState, useTransition } from "react";
import {
  BadgeCheck,
  Boxes,
  Eye,
  EyeOff,
  Gamepad2,
  Heart,
  Plus,
  Save,
  Shield,
  Star,
  Trash2,
  TrendingUp,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import {
  deleteCategoryAction,
  deleteGameAction,
  hideReviewAction,
  saveCategoryAction,
  saveGameAction,
  setUserRoleAction,
  toggleBanAction,
  toggleFeaturedAction,
  toggleGameActiveAction,
} from "@/lib/actions";

type Game = {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  instructions: string;
  categoryId: number;
  engine: string;
  config: unknown;
  thumbnailUrl: string;
  accent: string;
  players: string;
  difficulty: string;
  isFeatured: boolean;
  isActive: boolean;
  playsCount: number;
  favoritesCount: number;
  ratingAvg: string;
  ratingCount: number;
  topScore: number;
};
type Category = { id: number; slug: string; name: string; description: string; icon: string; accent: string };
type UserRow = {
  id: string;
  username: string;
  email: string;
  role: string;
  xp: number;
  level: number;
  gamesPlayed: number;
  banned: boolean;
  lastActiveAt: Date | string;
};
type ReviewRow = {
  id: number;
  body: string;
  rating: number;
  hidden: boolean;
  createdAt: Date | string;
  username: string;
  gameTitle: string;
};

const ENGINES = ["snake", "breakout", "blocks", "memory", "duel", "shooter", "racer", "runner", "sim", "voxel", "maze", "sports"];

const emptyGame = {
  title: "",
  slug: "",
  tagline: "",
  description: "",
  instructions: "",
  categoryId: 1,
  engine: "snake",
  thumbnailUrl: "",
  accent: "#7C3AED",
  players: "1 Player",
  difficulty: "Medium",
  isFeatured: false,
  isActive: true,
  config: "{}",
};

export function AdminConsole({
  stats,
  games,
  categories,
  users,
  reviews,
}: {
  stats: {
    users: { total: number; active: number };
    games: { total: number; active: number };
    plays: { total: number };
    reviews: { total: number };
  };
  games: Game[];
  categories: Category[];
  users: UserRow[];
  reviews: ReviewRow[];
}) {
  const [tab, setTab] = useState<"overview" | "games" | "categories" | "users" | "reviews">("overview");
  const [editing, setEditing] = useState<typeof emptyGame & { id?: number } | null>(null);
  const [catForm, setCatForm] = useState({ name: "", slug: "", description: "", icon: "sparkles", accent: "#7C3AED" });
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, label: string) =>
    start(async () => {
      const res = await fn();
      setMsg(res.ok ? label : (res.error ?? "Something went wrong."));
      if (res.ok) setEditing(null);
    });

  return (
    <div>
      {/* stat strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Registered users", value: stats.users.total, sub: `${stats.users.active} active this week`, icon: Users, color: "var(--cyan)" },
          { label: "Games published", value: stats.games.total, sub: `${stats.games.active} live`, icon: Gamepad2, color: "var(--violet-hi)" },
          { label: "Runs recorded", value: stats.plays.total, sub: "all time", icon: TrendingUp, color: "var(--amber)" },
          { label: "Reviews posted", value: stats.reviews.total, sub: "community", icon: Star, color: "var(--mint)" },
        ].map((s) => (
          <div key={s.label} className="plate grain p-5">
            <s.icon size={17} style={{ color: s.color }} />
            <p className="tabnum mt-3 text-[30px] leading-none">{s.value.toLocaleString()}</p>
            <p className="micro mt-2">{s.label}</p>
            <p className="micro mt-1" style={{ color: "var(--muted-2)" }}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* tabs */}
      <div className="mt-8 flex flex-wrap gap-2">
        {([
          ["overview", "Overview", Trophy],
          ["games", "Games", Gamepad2],
          ["categories", "Categories", Boxes],
          ["users", "Users", UserCog],
          ["reviews", "Reviews", Star],
        ] as const).map(([id, label, Icon]) => (
          <button key={id} className="chip" data-active={tab === id} onClick={() => setTab(id)}>
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {msg && (
        <p className="mt-4 text-[12.5px]" style={{ color: "var(--mint)" }}>
          {msg}
        </p>
      )}

      {/* overview */}
      {tab === "overview" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="plate p-6">
            <p className="micro micro-violet">// Top cabinets by plays</p>
            <ul className="mt-4 flex flex-col gap-3">
              {[...games]
                .sort((a, b) => b.playsCount - a.playsCount)
                .slice(0, 8)
                .map((g, i) => (
                  <li key={g.id} className="flex items-center gap-3">
                    <span className="tabnum w-5 text-[11px]" style={{ color: "var(--muted-2)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 truncate text-[13px]">{g.title}</span>
                    <span className="tabnum text-[12px]" style={{ color: "var(--amber)" }}>
                      {g.playsCount.toLocaleString()}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
          <div className="plate p-6">
            <p className="micro micro-violet">// Recently active players</p>
            <ul className="mt-4 flex flex-col gap-3">
              {users.slice(0, 8).map((u) => (
                <li key={u.id} className="flex items-center gap-3">
                  <span className="flex-1 truncate text-[13px]">{u.username}</span>
                  <span className="micro">Level {u.level}</span>
                  <span className="tabnum text-[12px]" style={{ color: "var(--cyan)" }}>
                    {u.xp.toLocaleString()} XP
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* games */}
      {tab === "games" && (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <p className="micro">Total {games.length} games</p>
            <button onClick={() => setEditing({ ...emptyGame })} className="btn btn-primary btn-sm">
              <Plus size={14} /> Add game
            </button>
          </div>

          {editing && (
            <div className="plate grain mt-5 p-6">
              <p className="micro micro-violet">{editing.id ? `// Edit ${editing.title}` : "// New cabinet"}</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {[
                  ["title", "Title"],
                  ["slug", "Slug"],
                  ["tagline", "Tagline"],
                  ["thumbnailUrl", "Thumbnail URL"],
                  ["accent", "Accent colour"],
                  ["engine", "Engine"],
                  ["players", "Players"],
                  ["difficulty", "Difficulty"],
                ].map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="micro">{label}</span>
                    {key === "engine" ? (
                      <select
                        className="field mt-2"
                        value={String(editing[key as keyof typeof editing] ?? "")}
                        onChange={(e) => setEditing({ ...editing, engine: e.target.value })}
                      >
                        {ENGINES.map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="field mt-2"
                        value={String(editing[key as keyof typeof editing] ?? "")}
                        onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                      />
                    )}
                  </label>
                ))}
                <label className="block">
                  <span className="micro">Category</span>
                  <select
                    className="field mt-2"
                    value={editing.categoryId}
                    onChange={(e) => setEditing({ ...editing, categoryId: Number(e.target.value) })}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="micro">Engine config (JSON)</span>
                  <input
                    className="field mt-2"
                    value={editing.config}
                    onChange={(e) => setEditing({ ...editing, config: e.target.value })}
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="micro">Description</span>
                  <textarea
                    rows={3}
                    className="field mt-2"
                    style={{ height: "auto", paddingTop: 12, paddingBottom: 12 }}
                    value={editing.description}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="micro">Instructions</span>
                  <textarea
                    rows={3}
                    className="field mt-2"
                    style={{ height: "auto", paddingTop: 12, paddingBottom: 12 }}
                    value={editing.instructions}
                    onChange={(e) => setEditing({ ...editing, instructions: e.target.value })}
                  />
                </label>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-[12px]">
                  <input
                    type="checkbox"
                    checked={editing.isFeatured}
                    onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-[12px]">
                  <input
                    type="checkbox"
                    checked={editing.isActive}
                    onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })}
                  />
                  Published
                </label>
                <div className="ml-auto flex gap-2">
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () =>
                          saveGameAction({
                            ...editing,
                            id: editing.id,
                            config: editing.config,
                          }),
                        editing.id ? "Game updated." : "Game created."
                      )
                    }
                  >
                    <Save size={13} /> Save game
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="plate mt-5 overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead>
                <tr>
                  {["Game", "Category", "Engine", "Plays", "Rating", "Flags", "Actions"].map((h) => (
                    <th key={h} className="micro px-5 py-3 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.id} style={{ borderTop: "1px solid var(--line)" }}>
                    <td className="px-5 py-3.5">
                      <p className="text-[13px] font-semibold">{g.title}</p>
                      <p className="micro mt-0.5">/{g.slug}</p>
                    </td>
                    <td className="px-5 py-3.5 text-[12px]" style={{ color: "var(--muted)" }}>
                      {categories.find((c) => c.id === g.categoryId)?.name}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="chip">{g.engine}</span>
                    </td>
                    <td className="tabnum px-5 py-3.5 text-[12px]">{g.playsCount.toLocaleString()}</td>
                    <td className="tabnum px-5 py-3.5 text-[12px]" style={{ color: "var(--amber)" }}>
                      {Number(g.ratingAvg).toFixed(1)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        {g.isFeatured && (
                          <span className="chip" style={{ borderColor: "var(--amber)", color: "var(--amber)" }}>
                            Featured
                          </span>
                        )}
                        <span className="chip" style={{ color: g.isActive ? "var(--mint)" : "var(--rose)" }}>
                          {g.isActive ? "Live" : "Hidden"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() =>
                            setEditing({
                              ...emptyGame,
                              ...g,
                              config: JSON.stringify(g.config ?? {}),
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => run(() => toggleFeaturedAction(g.id), "Featured flag toggled.")}
                          title="Toggle featured"
                        >
                          <BadgeCheck size={13} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => run(() => toggleGameActiveAction(g.id), "Publish state toggled.")}
                          title="Toggle published"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--rose)" }}
                          onClick={() => run(() => deleteGameAction(g.id), "Game deleted.")}
                          title="Delete game"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* categories */}
      {tab === "categories" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="plate overflow-hidden">
            <ul>
              {categories.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--line)" }}>
                  <span className="h-3 w-3 rounded-full" style={{ background: c.accent }} />
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold">{c.name}</p>
                    <p className="micro mt-0.5">/{c.slug}</p>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: "var(--rose)" }}
                    onClick={() => run(() => deleteCategoryAction(c.id), "Category removed.")}
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="plate grain p-6">
            <p className="micro micro-violet">// Add category</p>
            <div className="mt-4 flex flex-col gap-3">
              {(["name", "slug", "description", "icon", "accent"] as const).map((k) => (
                <label key={k} className="block">
                  <span className="micro">{k}</span>
                  <input
                    className="field mt-2"
                    value={catForm[k]}
                    onChange={(e) => setCatForm({ ...catForm, [k]: e.target.value })}
                  />
                </label>
              ))}
            </div>
            <button
              className="btn btn-primary mt-5 w-full"
              disabled={pending}
              onClick={() => run(() => saveCategoryAction(catForm), "Category saved.")}
            >
              <Plus size={14} /> Save category
            </button>
          </div>
        </div>
      )}

      {/* users */}
      {tab === "users" && (
        <div className="plate mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr>
                {["Player", "Email", "Role", "Level", "Runs", "Status", "Actions"].map((h) => (
                  <th key={h} className="micro px-5 py-3 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td className="px-5 py-3.5 text-[13px] font-semibold">{u.username}</td>
                  <td className="px-5 py-3.5 text-[12px]" style={{ color: "var(--muted)" }}>
                    {u.email}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="chip" style={{ color: u.role === "admin" ? "var(--amber)" : "var(--muted)" }}>
                      {u.role === "admin" ? <Shield size={11} /> : null}
                      {u.role}
                    </span>
                  </td>
                  <td className="tabnum px-5 py-3.5 text-[12px]">{u.level}</td>
                  <td className="tabnum px-5 py-3.5 text-[12px]">{u.gamesPlayed}</td>
                  <td className="px-5 py-3.5">
                    <span className="micro" style={{ color: u.banned ? "var(--rose)" : "var(--mint)" }}>
                      {u.banned ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5">
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => run(() => setUserRoleAction(u.id, u.role === "admin" ? "user" : "admin"), "Role updated.")}
                      >
                        {u.role === "admin" ? "Demote" : "Promote"}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: u.banned ? "var(--mint)" : "var(--rose)" }}
                        onClick={() => run(() => toggleBanAction(u.id), "Account status updated.")}
                      >
                        {u.banned ? "Unban" : "Suspend"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* reviews */}
      {tab === "reviews" && (
        <div className="mt-6 flex flex-col gap-3">
          {reviews.map((r) => (
            <div key={r.id} className="plate-flat flex items-start gap-4 p-5">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-[13px] font-semibold">{r.username}</p>
                  <span className="micro">on {r.gameTitle}</span>
                  <span className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        fill={i < r.rating ? "var(--amber)" : "none"}
                        style={{ color: i < r.rating ? "var(--amber)" : "var(--line)" }}
                      />
                    ))}
                  </span>
                  {r.hidden && (
                    <span className="chip" style={{ color: "var(--rose)" }}>
                      Hidden
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[13px]" style={{ color: "var(--muted)" }}>
                  {r.body}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => run(() => hideReviewAction(r.id, !r.hidden), "Review visibility updated.")}
                >
                  {r.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                  {r.hidden ? "Show" : "Hide"}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: "var(--rose)" }}
                  onClick={() => run(() => hideReviewAction(r.id, true), "Review hidden.")}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          {!reviews.length && (
            <div className="plate-flat p-8 text-center">
              <Heart size={20} className="mx-auto" style={{ color: "var(--muted-2)" }} />
              <p className="mt-3 text-[13px]" style={{ color: "var(--muted)" }}>
                No reviews to moderate yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
