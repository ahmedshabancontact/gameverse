import Link from "next/link";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center"
      style={{ background: "var(--void)" }}
    >
      <LogoMark size={54} />
      <p className="micro micro-violet mt-8">// Error 404 · cabinet not found</p>
      <h1 className="display mt-4" style={{ fontSize: "clamp(46px,9vw,110px)", color: "#fff", textShadow: "0 0 60px rgba(124,58,237,0.55)" }}>
        GAME OVER
      </h1>
      <p className="mt-6 max-w-[48ch] text-[15px]" style={{ color: "var(--muted)" }}>
        That page is not on the floor. It may have been moved, unpublished, or never existed in the first place.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Back to the arcade
        </Link>
        <Link href="/explore" className="btn btn-ghost">
          Browse all games
        </Link>
      </div>
    </div>
  );
}
