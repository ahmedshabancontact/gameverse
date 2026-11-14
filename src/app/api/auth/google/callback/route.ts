import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stored = request.headers.get("cookie")?.match(/gv_oauth_state=([^;]+)/)?.[1];

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) return NextResponse.redirect(new URL("/login?error=google-not-configured", origin));
  if (!code || !state || !stored || state !== stored) {
    return NextResponse.redirect(new URL("/login?error=google-state", origin));
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return NextResponse.redirect(new URL("/login?error=google-token", origin));
  const token = (await tokenRes.json()) as { access_token: string };

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { authorization: `Bearer ${token.access_token}` },
  });
  if (!profileRes.ok) return NextResponse.redirect(new URL("/login?error=google-profile", origin));
  const profile = (await profileRes.json()) as {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };

  const [existingByGoogle] = await db.select().from(users).where(eq(users.googleId, profile.id)).limit(1);
  if (existingByGoogle) {
    if (existingByGoogle.banned) return NextResponse.redirect(new URL("/login?error=banned", origin));
    await createSession(existingByGoogle.id);
    return NextResponse.redirect(new URL("/", origin));
  }

  const [existingByEmail] = await db.select().from(users).where(eq(users.email, profile.email.toLowerCase())).limit(1);
  if (existingByEmail) {
    await db
      .update(users)
      .set({ googleId: profile.id, avatarUrl: profile.picture ?? existingByEmail.avatarUrl })
      .where(eq(users.id, existingByEmail.id));
    await createSession(existingByEmail.id);
    return NextResponse.redirect(new URL("/", origin));
  }

  const base = (profile.name ?? profile.email.split("@")[0]).replace(/[^\w-]/g, "").slice(0, 18) || "player";
  let username = base;
  let n = 1;
  while (true) {
    const clash = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
    if (!clash.length) break;
    username = `${base}${++n}`;
  }

  const [created] = await db
    .insert(users)
    .values({
      email: profile.email.toLowerCase(),
      username,
      googleId: profile.id,
      avatarUrl: profile.picture ?? "",
      bio: "",
    })
    .returning();

  await createSession(created.id);
  return NextResponse.redirect(new URL("/", origin));
}
