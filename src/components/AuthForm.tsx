"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, KeyRound, Mail, User as UserIcon } from "lucide-react";
import { loginAction, signupAction, type ActionResult } from "@/lib/actions";

function GoogleButton() {
  return (
    <a href="/api/auth/google" className="btn btn-ghost w-full">
      <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.8Z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1Z" />
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.01l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75Z" />
      </svg>
      Continue with Google
    </a>
  );
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="hairline flex-1" />
      <span className="micro">or</span>
      <div className="hairline flex-1" />
    </div>
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, { ok: false });

  useEffect(() => {
    if (state.ok) router.push("/");
  }, [state.ok, router]);

  const googleError = params.get("error");

  return (
    <div>
      <p className="micro micro-violet">{mode === "login" ? "// Welcome back" : "// New player"}</p>
      <h1 className="display mt-2.5" style={{ fontSize: "clamp(32px,4vw,48px)" }}>
        {mode === "login" ? "Sign in to the cabinet" : "Create your player"}
      </h1>
      <p className="mt-3 text-[14px]" style={{ color: "var(--muted)" }}>
        {mode === "login"
          ? "Pick up where you left off — your scores, XP and favourites are waiting."
          : "Free forever. Save your scores, climb the leaderboard and unlock achievements."}
      </p>

      <GoogleButton />
      <Divider />

      <form action={formAction} className="flex flex-col gap-4">
        {mode === "signup" && (
          <label className="block">
            <span className="micro">Username</span>
            <div className="relative mt-2">
              <UserIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-2)" }} />
              <input name="username" required minLength={3} maxLength={20} className="field" style={{ paddingLeft: 40 }} placeholder="NeonPilot" />
            </div>
          </label>
        )}

        <label className="block">
          <span className="micro">Email</span>
          <div className="relative mt-2">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-2)" }} />
            <input name="email" type="email" required className="field" style={{ paddingLeft: 40 }} placeholder="you@example.com" />
          </div>
        </label>

        <label className="block">
          <span className="micro">Password</span>
          <div className="relative mt-2">
            <KeyRound size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-2)" }} />
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="field"
              style={{ paddingLeft: 40 }}
              placeholder="At least 6 characters"
            />
          </div>
        </label>

        {mode === "signup" && (
          <label className="block">
            <span className="micro">Playing as (optional)</span>
            <input name="alias" className="field mt-2" placeholder="Your arcade alias" />
          </label>
        )}

        {(state.error || googleError) && (
          <div
            className="flex items-start gap-2.5 rounded p-3.5"
            style={{ background: "color-mix(in srgb, var(--rose) 14%, transparent)", border: "1px solid color-mix(in srgb, var(--rose) 40%, transparent)" }}
          >
            <AlertTriangle size={15} style={{ color: "var(--rose)" }} className="mt-0.5 shrink-0" />
            <p className="text-[12.5px]" style={{ color: "var(--rose)" }}>
              {state.error ??
                "Google sign-in is not configured on this deployment. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable it."}
            </p>
          </div>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary w-full" style={{ height: 50 }}>
          {pending ? "Connecting…" : mode === "login" ? "Sign in" : "Create account"}
          <ArrowRight size={16} />
        </button>
      </form>

      <p className="mt-7 text-[13px]" style={{ color: "var(--muted)" }}>
        {mode === "login" ? (
          <>
            No account yet?{" "}
            <Link href="/signup" className="font-semibold" style={{ color: "var(--violet-hi)" }}>
              Create one free
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold" style={{ color: "var(--violet-hi)" }}>
              Sign in
            </Link>
          </>
        )}
      </p>

      <div className="hairline my-7" />
      <p className="micro">Demo account · admin@gameverse.gg / gameverse</p>
    </div>
  );
}
