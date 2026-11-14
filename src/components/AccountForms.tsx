"use client";

import { useState, useTransition } from "react";
import { Check, Monitor, Moon, Palette, Save, Sun, Volume2, VolumeX, Zap } from "lucide-react";
import { saveSettingsAction, updateProfileAction } from "@/lib/actions";
import { useSettings } from "./ThemeContext";
import type { ActionResult } from "@/lib/actions";

export function ProfileForm({ username, bio, avatarUrl }: { username: string; bio: string; avatarUrl: string }) {
  const [state, setState] = useState({ username, bio, avatarUrl });
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => setMsg(await updateProfileAction({ ok: false }, fd)));
      }}
      className="plate grain p-6"
    >
      <p className="micro micro-violet">// Player identity</p>
      <div className="mt-5 flex flex-col gap-4">
        <label className="block">
          <span className="micro">Username</span>
          <input
            name="username"
            value={state.username}
            onChange={(e) => setState((s) => ({ ...s, username: e.target.value }))}
            className="field mt-2"
          />
        </label>
        <label className="block">
          <span className="micro">Tagline / bio</span>
          <textarea
            name="bio"
            rows={3}
            value={state.bio}
            onChange={(e) => setState((s) => ({ ...s, bio: e.target.value }))}
            className="field mt-2"
            style={{ height: "auto", paddingTop: 12, paddingBottom: 12, resize: "vertical" }}
          />
        </label>
        <label className="block">
          <span className="micro">Avatar image URL (optional)</span>
          <input
            name="avatarUrl"
            value={state.avatarUrl}
            onChange={(e) => setState((s) => ({ ...s, avatarUrl: e.target.value }))}
            placeholder="https://…"
            className="field mt-2"
          />
        </label>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary">
          <Save size={14} /> {pending ? "Saving…" : "Save profile"}
        </button>
        {msg && (
          <p className="text-[12px]" style={{ color: msg.ok ? "var(--mint)" : "var(--rose)" }}>
            {msg.ok ? "Profile updated." : msg.error}
          </p>
        )}
      </div>
    </form>
  );
}

export function SettingsPanel({ signedIn }: { signedIn: boolean }) {
  const { theme, set, sound, motion, volume } = useSettings();
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  const commit = (patch: { theme?: "dark" | "light"; sound?: boolean; motion?: boolean; volume?: number }) => {
    set(patch);
    if (!signedIn) return;
    start(async () => {
      await saveSettingsAction(patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="plate grain p-6">
        <div className="flex items-center gap-2.5">
          <Palette size={16} style={{ color: "var(--violet-hi)" }} />
          <p className="micro micro-violet">Appearance</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {([
            { id: "dark", label: "Cabinet dark", note: "Graphite panels, neon glow", icon: Moon },
            { id: "light", label: "Manual light", note: "Cream paper, printed ink", icon: Sun },
          ] as const).map((opt) => (
            <button
              key={opt.id}
              onClick={() => commit({ theme: opt.id })}
              className="plate-flat flex items-center gap-3 p-4 text-left transition-all"
              style={{
                borderColor: theme === opt.id ? "var(--violet)" : "var(--line)",
                boxShadow: theme === opt.id ? "0 0 0 3px color-mix(in srgb, var(--violet) 22%, transparent)" : undefined,
              }}
            >
              <opt.icon size={18} style={{ color: theme === opt.id ? "var(--violet-hi)" : "var(--muted)" }} />
              <span>
                <span className="block text-[13px] font-semibold">{opt.label}</span>
                <span className="micro">{opt.note}</span>
              </span>
              {theme === opt.id && <Check size={16} className="ml-auto" style={{ color: "var(--violet-hi)" }} />}
            </button>
          ))}
        </div>
      </section>

      <section className="plate grain p-6">
        <div className="flex items-center gap-2.5">
          <Volume2 size={16} style={{ color: "var(--cyan)" }} />
          <p className="micro micro-violet">Sound</p>
        </div>
        <div className="mt-5 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold">Cabinet sound effects</p>
              <p className="micro mt-1">Blips, sweeps and jingles from the game engines</p>
            </div>
            <button
              onClick={() => commit({ sound: !sound })}
              className="btn btn-ghost btn-sm"
              aria-pressed={sound}
            >
              {sound ? <Volume2 size={14} /> : <VolumeX size={14} />} {sound ? "On" : "Muted"}
            </button>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <p className="micro">Master volume</p>
              <span className="tabnum text-[12px]" style={{ color: "var(--cyan)" }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => set({ volume: Number(e.target.value) / 100 })}
              className="mt-3 w-full accent-[color:var(--cyan)]"
              aria-label="Master volume"
            />
          </div>
        </div>
      </section>

      <section className="plate grain p-6">
        <div className="flex items-center gap-2.5">
          <Zap size={16} style={{ color: "var(--amber)" }} />
          <p className="micro micro-violet">Motion &amp; accessibility</p>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-semibold">Interface animation</p>
            <p className="micro mt-1">Turn off to reduce movement across the site</p>
          </div>
          <button onClick={() => commit({ motion: !motion })} className="btn btn-ghost btn-sm" aria-pressed={motion}>
            <Monitor size={14} /> {motion ? "Full motion" : "Reduced"}
          </button>
        </div>
      </section>

      {signedIn && (
        <p className="flex items-center gap-2 text-[12px]" style={{ color: saved ? "var(--mint)" : "var(--muted-2)" }}>
          {saved ? <Check size={13} /> : null}
          {saved ? "Preferences saved to your account." : "Preferences sync to your account automatically."}
        </p>
      )}
    </div>
  );
}
