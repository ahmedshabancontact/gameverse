export default function Loading() {
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-12 md:px-10">
      <div className="loading-bar h-1 w-full max-w-[280px] rounded" style={{ background: "var(--line)" }} />
      <div className="mt-8 h-[420px] w-full animate-pulse rounded" style={{ background: "var(--panel-2)" }} />
      <div className="mt-10 flex gap-5 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[220px] w-[268px] shrink-0 animate-pulse rounded" style={{ background: "var(--panel-2)" }} />
        ))}
      </div>
      <p className="micro mt-10">Booting the cabinet…</p>
    </div>
  );
}
