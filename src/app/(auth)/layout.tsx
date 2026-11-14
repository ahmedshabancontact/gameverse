import type { ReactNode } from "react";
import Link from "next/link";
import { LogoLockup } from "@/components/Logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2" style={{ background: "var(--void)" }}>
      {/* art panel */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/hero-marquee.jpg"
          alt="A row of glowing arcade cabinets at night"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: "60% 50%" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(120deg, rgba(11,11,18,0.96) 0%, rgba(76,29,149,0.5) 46%, rgba(11,11,18,0.72) 100%)",
          }}
        />
        <div className="scanlines absolute inset-0" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link href="/">
            <LogoLockup />
          </Link>
          <div>
            <p className="micro micro-violet">// Player one, identify yourself</p>
            <h1 className="display mt-4" style={{ fontSize: "clamp(38px,4.2vw,66px)", color: "#fff" }}>
              The cabinet
              <br />
              is always on.
            </h1>
            <p className="mt-6 max-w-[42ch] text-[15px] leading-relaxed" style={{ color: "rgba(237,236,245,0.78)" }}>
              Twenty original games, a global leaderboard, XP, achievements and a daily challenge. Your account carries
              your scores across every device.
            </p>
            <div className="mt-9 flex flex-wrap gap-2.5">
              {["20 playable games", "Global leaderboard", "12 achievements", "Daily challenges"].map((t) => (
                <span key={t} className="chip" style={{ background: "rgba(11,11,18,0.55)", color: "rgba(237,236,245,0.86)" }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <p className="micro" style={{ color: "rgba(237,236,245,0.5)" }}>
            © GameVerse Amusements · Free to play, forever
          </p>
        </div>
      </div>

      {/* form panel */}
      <div className="flex items-center justify-center px-5 py-12 md:px-12">
        <div className="w-full max-w-[460px]">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/">
              <LogoLockup />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
