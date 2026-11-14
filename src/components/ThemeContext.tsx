"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Settings = {
  theme: "dark" | "light";
  sound: boolean;
  motion: boolean;
  volume: number;
};
type Ctx = Settings & {
  set: (patch: Partial<Settings>) => void;
};

const ThemeCtx = createContext<Ctx>({
  theme: "dark",
  sound: true,
  motion: true,
  volume: 0.6,
  set: () => {},
});

export function SettingsProvider({
  children,
  initial,
}: {
  children: React.ReactNode;
  initial?: Partial<Settings>;
}) {
  const [state, setState] = useState<Settings>({
    theme: initial?.theme ?? "dark",
    sound: initial?.sound ?? true,
    motion: initial?.motion ?? true,
    volume: initial?.volume ?? 0.6,
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = state.theme;
    root.dataset.motion = state.motion ? "on" : "off";
    try {
      localStorage.setItem("gv_settings", JSON.stringify(state));
    } catch {
      /* storage blocked */
    }
  }, [state]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("gv_settings");
      if (raw && !initial) {
        const parsed = JSON.parse(raw) as Settings;
        setState((s) => ({ ...s, ...parsed }));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = useCallback((patch: Partial<Settings>) => setState((s) => ({ ...s, ...patch })), []);
  const value = useMemo(() => ({ ...state, set }), [state, set]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useSettings = () => useContext(ThemeCtx);
