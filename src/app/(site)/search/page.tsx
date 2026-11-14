import { redirect } from "next/navigation";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const sp = await searchParams;
  redirect(`/explore${sp.q ? `?q=${encodeURIComponent(sp.q)}` : ""}`);
}
