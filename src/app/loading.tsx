export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-28 bg-black/[0.06] rounded" />
        <div className="h-12 w-56 bg-black/[0.08] rounded-xl" />
      </div>
      <div className="h-40 bg-ink/90 rounded-3xl" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[72px] panel rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
