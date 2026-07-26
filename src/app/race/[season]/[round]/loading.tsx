export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-3 w-40 bg-black/[0.06] rounded" />
      <div className="space-y-3">
        <div className="h-3 w-64 bg-black/[0.06] rounded" />
        <div className="h-12 w-80 bg-black/[0.08] rounded-xl" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-border-soft pt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-2.5 w-12 bg-black/[0.06] rounded" />
            <div className="h-7 w-24 bg-black/[0.08] rounded" />
          </div>
        ))}
      </div>
      <div className="h-96 panel rounded-3xl bg-white" />
    </div>
  );
}
