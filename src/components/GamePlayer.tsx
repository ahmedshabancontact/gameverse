"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { engines } from "@/games/registry";
import type { GameConfig, GameHandle } from "@/games/kit";
import { blip } from "@/games/kit";
import { submitScoreAction } from "@/lib/actions";
import { useSettings } from "./ThemeContext";

export type PlayerGame = {
  id: number;
  title: string;
  slug: string;
  engine: string;
  config: GameConfig;
  accent: string;
  instructions: string;
  tagline: string;
};

function Ticker({ value, accent }: { value: number; accent: string }) {
  const [shown, setShown] = useState(value);
  const ref = useRef(value);
  useEffect(() => {
    let raf = 0;
    const start = ref.current;
    const delta = value - start;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 420);
      const eased = 1 - Math.pow(1 - k, 3);
      const v = Math.round(start + delta * eased);
      setShown(v);
      ref.current = v;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return (
    <span key={shown} className="tabnum score-flash" style={{ color: accent, textShadow: `0 0 22px ${accent}88` }}>
      {shown.toLocaleString()}
    </span>
  );
}

export function GamePlayer({ game, loggedIn }: { game: PlayerGame; loggedIn: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<GameHandle | null>(null);
  const startedAt = useRef<number>(0);
  const { sound, set } = useSettings();

  const [phase, setPhase] = useState<"idle" | "playing" | "paused" | "over">("idle");
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState("Insert coin to begin");
  const [full, setFull] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [result, setResult] = useState<{ xp: number; level: number; unlocked: string[]; guest: boolean } | null>(null);
  const [engineError, setEngineError] = useState<string | null>(null);

  useEffect(() => {
    blip.enabled = sound;
  }, [sound]);

  useEffect(() => {
    const onFull = () => setFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFull);
    return () => document.removeEventListener("fullscreenchange", onFull);
  }, []);

  // cabinet hotkeys: P = pause/resume, F = fullscreen, M = mute
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const k = e.key.toLowerCase();
      if (k === "p") {
        e.preventDefault();
        if (phaseRef.current === "playing") {
          handleRef.current?.pause();
          setStatus("Paused");
          setPhase("paused");
        } else if (phaseRef.current === "paused") {
          handleRef.current?.resume();
          setStatus("Good luck");
          setPhase("playing");
        }
      } else if (k === "f") {
        e.preventDefault();
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
        else void wrapRef.current?.requestFullscreen?.().catch(() => {});
      } else if (k === "m") {
        set({ sound: !sound });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [set, sound]);

  useEffect(() => {
    return () => {
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, []);

  const finish = useCallback(
    async (finalScore: number, duration: number) => {
      setPhase("over");
      setStatus("Run complete");
      try {
        const res = await submitScoreAction({ gameId: game.id, score: finalScore, duration });
        if (res.ok) setResult({ xp: res.xp, level: res.level, unlocked: res.unlocked, guest: res.guest });
      } catch {
        /* score submission is best-effort */
      }
    },
    [game.id]
  );

  const start = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setResult(null);
    setScore(0);
    startedAt.current = Date.now();

    const api = {
      setScore: (n: number) => setScore(n),
      setStatus: (t: string) => setStatus(t),
      onOver: (r: { score: number; stats: Record<string, number> }) => {
        void finish(r.score, Math.round((Date.now() - startedAt.current) / 1000));
      },
      sound,
      paused: false,
    };

    if (handleRef.current) {
      handleRef.current.restart();
      handleRef.current.resume();
    } else {
      const factory = engines[game.engine];
      if (!factory) {
        setEngineError(`Engine "${game.engine}" is not installed on this cabinet.`);
        return;
      }
      try {
        handleRef.current = factory(canvas, api, game.config ?? {});
      } catch (err) {
        setEngineError(err instanceof Error ? err.message : "The game failed to boot.");
        return;
      }
    }
    setPhase("playing");
    setStatus("Good luck");
    blip.enabled = sound;
    blip.play(660, 0.12);
  }, [finish, game.config, game.engine, sound]);

  const togglePause = () => {
    if (phase === "playing") {
      handleRef.current?.pause();
      setPhase("paused");
      setStatus("Paused");
    } else if (phase === "paused") {
      handleRef.current?.resume();
      setPhase("playing");
    } else {
      start();
    }
  };

  const restart = () => {
    setResult(null);
    if (handleRef.current) {
      handleRef.current.restart();
      handleRef.current.resume();
      startedAt.current = Date.now();
      setScore(0);
      setPhase("playing");
    } else start();
  };

  const toggleFull = async () => {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    else await wrapRef.current?.requestFullscreen?.().catch(() => {});
  };

  return (
    <div>
      {/* cabinet bezel */}
      <div
        ref={wrapRef}
        className="relative overflow-hidden rounded-[6px]"
        style={{
          background: "#05060c",
          border: "1px solid var(--line)",
          boxShadow: "0 40px 90px -50px rgba(124,58,237,0.85), var(--bevel)",
        }}
      >
        {/* marquee strip */}
        <div
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ background: "var(--panel)", borderBottom: "1px solid var(--line)" }}
        >
          <div className="flex items-center gap-1.5">
            {["#F43F5E", "#FFB020", "#34D399"].map((c) => (
              <span key={c} className="h-2 w-2 rounded-full" style={{ background: c, opacity: 0.75 }} />
            ))}
          </div>
          <p className="micro micro-violet truncate">Now playing · {game.title}</p>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-baseline gap-2 sm:flex">
              <span className="micro">Score</span>
              <span className="text-[18px] leading-none">
                <Ticker value={score} accent="#FFB020" />
              </span>
            </div>
            <button
              onClick={() => set({ sound: !sound })}
              className="rounded p-1.5"
              style={{ color: sound ? "var(--cyan)" : "var(--muted-2)" }}
              aria-label={sound ? "Mute" : "Unmute"}
            >
              {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button onClick={() => setShowHelp(true)} className="btn btn-ghost btn-sm hidden sm:inline-flex">
              How to play
            </button>
            <button onClick={toggleFull} className="rounded p-1.5" style={{ color: "var(--muted)" }} aria-label="Fullscreen">
              {full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* CRT screen */}
        <div className="scanlines vignette relative w-full" style={{ aspectRatio: "16/10", background: "#05060c" }}>
          <canvas ref={canvasRef} className="crt-canvas" />

          {phase === "idle" && !engineError && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 px-6 text-center"
              style={{ background: "radial-gradient(120% 90% at 50% 40%, rgba(76,29,149,0.55), rgba(5,6,12,0.94))" }}
            >
              <p className="micro micro-violet">Ready player one</p>
              <h2 className="display" style={{ fontSize: "clamp(30px,5vw,62px)", color: "#fff" }}>
                {game.title}
              </h2>
              <p className="max-w-[52ch] text-[14px]" style={{ color: "rgba(237,236,245,0.78)" }}>
                {game.tagline}
              </p>
              <button onClick={start} className="btn btn-primary pulse-ring" style={{ height: 52, padding: "0 34px" }}>
                <Play size={18} fill="currentColor" /> Insert coin
              </button>
              <p className="micro">Fullscreen · Score saving · Global leaderboard</p>
            </div>
          )}

          {phase === "paused" && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
              style={{ background: "rgba(5,6,12,0.82)" }}
            >
              <p className="display text-3xl">PAUSED</p>
              <div className="flex gap-3">
                <button onClick={togglePause} className="btn btn-primary">
                  <Play size={16} /> Resume
                </button>
                <button onClick={restart} className="btn btn-ghost">
                  <RotateCcw size={16} /> Restart
                </button>
              </div>
            </div>
          )}

          {phase === "over" && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-6 text-center"
              style={{ background: "radial-gradient(110% 90% at 50% 45%, rgba(76,29,149,0.5), rgba(5,6,12,0.95))" }}
            >
              <p className="micro micro-violet">Run complete</p>
              <p className="tabnum" style={{ fontSize: "clamp(44px,8vw,86px)", color: "#FFB020", textShadow: "0 0 44px rgba(255,176,32,0.55)" }}>
                {score.toLocaleString()}
              </p>
              <p className="micro">Final score</p>

              {result ? (
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="flex items-center gap-2 rounded px-3.5 py-2"
                    style={{ background: "color-mix(in srgb, var(--cyan) 16%, transparent)", border: "1px solid color-mix(in srgb, var(--cyan) 40%, transparent)" }}
                  >
                    <Zap size={15} style={{ color: "var(--cyan)" }} />
                    <span className="tabnum text-[13px]" style={{ color: "var(--cyan)" }}>
                      +{result.xp} XP
                    </span>
                    <span className="micro" style={{ color: "var(--muted)" }}>
                      Level {result.level}
                    </span>
                  </div>
                  {result.unlocked.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {result.unlocked.map((u) => (
                        <span key={u} className="chip" style={{ borderColor: "var(--amber)", color: "var(--amber)" }}>
                          <Trophy size={11} /> {u}
                        </span>
                      ))}
                    </div>
                  )}
                  {result.guest && (
                    <p className="text-[12px]" style={{ color: "var(--muted)" }}>
                      Sign in to bank this score and climb the leaderboard.
                    </p>
                  )}
                </div>
              ) : (
                <div className="loading-bar h-1 w-[180px] rounded" style={{ background: "var(--line)" }} />
              )}

              <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                <button onClick={restart} className="btn btn-primary">
                  <RotateCcw size={16} /> Play again
                </button>
                <button onClick={() => setShowHelp(true)} className="btn btn-ghost">
                  How to play
                </button>
              </div>
            </div>
          )}

          {engineError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <X size={28} style={{ color: "var(--rose)" }} />
              <p className="display text-xl">Cabinet error</p>
              <p className="max-w-[46ch] text-[13px]" style={{ color: "var(--muted)" }}>
                {engineError}
              </p>
              <button onClick={() => setEngineError(null)} className="btn btn-ghost">
                Try again
              </button>
            </div>
          )}
        </div>

        {/* control deck */}
        <div
          className="flex flex-wrap items-center gap-2.5 px-4 py-3"
          style={{ background: "var(--panel)", borderTop: "1px solid var(--line)" }}
        >
          <button onClick={togglePause} className="btn btn-primary btn-sm">
            {phase === "playing" ? <Pause size={14} /> : <Play size={14} />}
            {phase === "playing" ? "Pause" : phase === "paused" ? "Resume" : "Play"}
          </button>
          <button onClick={restart} className="btn btn-ghost btn-sm">
            <RotateCcw size={14} /> Restart
          </button>
          <button onClick={toggleFull} className="btn btn-ghost btn-sm">
            <Maximize2 size={14} /> Fullscreen
          </button>
          <p className="ml-auto truncate text-[12px]" style={{ color: "var(--muted)" }}>
            {status}
          </p>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" style={{ background: "rgba(5,6,12,0.82)" }}>
          <div className="plate max-h-[80vh] w-full max-w-[560px] overflow-y-auto p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="micro micro-violet">Cabinet instructions</p>
                <h3 className="display mt-1 text-2xl">{game.title}</h3>
              </div>
              <button onClick={() => setShowHelp(false)} aria-label="Close instructions" style={{ color: "var(--muted)" }}>
                <X size={20} />
              </button>
            </div>
            <div className="hairline my-5" />
            <p className="whitespace-pre-line text-[14px] leading-relaxed" style={{ color: "var(--muted)" }}>
              {game.instructions}
            </p>
            <div className="hairline my-5" />
            <p className="micro">Keys</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Arrows / WASD", "Space", "P — pause", "R — restart", "F — fullscreen", "M — mute", "Mouse / touch"].map((k) => (
                <span key={k} className="chip">
                  {k}
                </span>
              ))}
            </div>
            {!loggedIn && (
              <p className="mt-6 text-[12px]" style={{ color: "var(--muted)" }}>
                You are playing as a guest. Create a free account to save scores, earn XP and unlock achievements.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
