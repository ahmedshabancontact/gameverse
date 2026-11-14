"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, MessageSquare, Send, Star, Trash2 } from "lucide-react";
import { deleteReviewAction, submitReviewAction, toggleFavoriteAction } from "@/lib/actions";

export function FavoriteButton({
  gameId,
  initial,
  initialCount,
  block = false,
}: {
  gameId: number;
  initial: boolean;
  initialCount: number;
  block?: boolean;
}) {
  const [fav, setFav] = useState(initial);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await toggleFavoriteAction(gameId);
          if (res.ok) {
            setFav(Boolean(res.favorited));
            setCount((c) => c + (res.favorited ? 1 : -1));
            setError(null);
          } else setError(res.error ?? "Something went wrong.");
        })
      }
      className={`btn ${block ? "w-full" : ""} ${fav ? "btn-primary" : "btn-ghost"}`}
      aria-pressed={fav}
      title={error ?? (fav ? "Remove from favorites" : "Add to favorites")}
    >
      <Heart size={15} fill={fav ? "currentColor" : "none"} />
      {fav ? "In favorites" : "Add to favorites"}
      <span className="tabnum opacity-70">{count}</span>
    </button>
  );
}

export function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          style={{ cursor: onChange ? "pointer" : "default", color: n <= shown ? "var(--amber)" : "var(--line)" }}
          disabled={!onChange}
        >
          <Star size={onChange ? 22 : 14} fill={n <= shown ? "var(--amber)" : "none"} />
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({ gameId }: { gameId: number }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await submitReviewAction(gameId, rating, body);
          if (res.ok) {
            setBody("");
            setMsg({ ok: true, text: "Review posted — thanks for the signal." });
          } else setMsg({ ok: false, text: res.error ?? "Could not post the review." });
        });
      }}
      className="plate-flat p-5"
    >
      <p className="micro micro-violet">Write a review</p>
      <div className="mt-3 flex items-center gap-3">
        <StarRating value={rating} onChange={setRating} />
        <span className="tabnum text-[12px]" style={{ color: "var(--muted)" }}>
          {rating}.0 / 5.0
        </span>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={1200}
        placeholder="How does this cabinet play? Controls, difficulty, replay value…"
        className="field mt-3"
        style={{ height: "auto", paddingTop: 12, paddingBottom: 12, resize: "vertical" }}
      />
      <div className="mt-3 flex items-center gap-3">
        <button type="submit" disabled={pending || !body.trim()} className="btn btn-primary btn-sm">
          <Send size={13} /> {pending ? "Posting…" : "Post review"}
        </button>
        {msg && (
          <p className="text-[12px]" style={{ color: msg.ok ? "var(--mint)" : "var(--rose)" }}>
            {msg.text}
          </p>
        )}
      </div>
    </form>
  );
}

export function ReviewItem({
  review,
  canDelete,
}: {
  review: { id: number; rating: number; body: string; createdAt: Date | string; username: string; likes: number };
  canDelete: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <article className="plate-flat p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold">{review.username}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <StarRating value={review.rating} />
            <span className="micro">
              {new Date(review.createdAt).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={() => start(() => deleteReviewAction(review.id).then(() => {}))}
            disabled={pending}
            className="rounded p-2 transition-colors hover:bg-white/5"
            style={{ color: "var(--muted-2)" }}
            aria-label="Delete review"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
      <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
        {review.body}
      </p>
      <div className="mt-3 flex items-center gap-1.5 text-[11px]" style={{ color: "var(--muted-2)" }}>
        <MessageSquare size={12} />
        <span className="tabnum">{review.likes}</span> found this useful
      </div>
    </article>
  );
}

export function SignInPrompt({ title = "Join the cabinet" }: { title?: string }) {
  return (
    <div className="plate-flat flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p className="display text-lg">{title}</p>
        <p className="mt-1 text-[13px]" style={{ color: "var(--muted)" }}>
          Sign in to save favourites, post reviews, earn XP and post scores to the global leaderboard.
        </p>
      </div>
      <div className="flex gap-2">
        <Link href="/login" className="btn btn-ghost btn-sm">
          Sign in
        </Link>
        <Link href="/signup" className="btn btn-primary btn-sm">
          Create account
        </Link>
      </div>
    </div>
  );
}
