export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-3">
        <div className="h-3 w-72 bg-black/[0.06] rounded" />
        <div className="h-10 w-80 bg-black/[0.08] rounded-xl" />
      </div>
      <div className="h-[28rem] panel rounded-3xl bg-white" />
      <div className="h-96 panel rounded-3xl bg-white" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-48 panel rounded-3xl bg-white" />
        <div className="h-48 panel rounded-3xl bg-white" />
      </div>
    </div>
  );
}
