import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState, GameCard } from "@/components/GameCard";
import { SignInPrompt } from "@/components/Interactions";
import { getFavoriteGameIds, getGames } from "@/lib/data";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Favorites",
  description: "Your saved GameVerse cabinets.",
};

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-[1500px] px-5 py-16 md:px-10">
        <p className="micro micro-violet">// Your library</p>
        <h1 className="display mt-2" style={{ fontSize: "clamp(34px,5vw,58px)" }}>
          Favorites
        </h1>
        <div className="mt-8">
          <SignInPrompt title="Sign in to see your shelf" />
        </div>
      </div>
    );
  }

  const ids = await getFavoriteGameIds(user.id);
  const games = ids.length ? await getGames({ ids }) : [];

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10">
      <p className="micro micro-violet">// Your library</p>
      <h1 className="display mt-2" style={{ fontSize: "clamp(34px,5vw,58px)" }}>
        Favorites
      </h1>
      <p className="mt-3 max-w-[56ch] text-[15px]" style={{ color: "var(--muted)" }}>
        {games.length
          ? `${games.length} cabinet${games.length === 1 ? "" : "s"} on your shelf. Tap the heart on any game to add it here.`
          : "Nothing saved yet. Tap the heart on any game to pin it to this shelf."}
      </p>

      <div className="mt-9">
        {games.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {games.map((g) => (
              <div key={g.id} className="w-full">
                <GameCard game={g} size="lg" />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Your shelf is empty"
            body="Head to the cabinet floor and hit the heart on anything that looks worth a run."
            action={
              <Link href="/explore" className="btn btn-primary mt-2">
                Explore games
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
