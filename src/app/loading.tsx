export default function Loading() {
  return (
    <div className="flex flex-1 flex-col justify-center animate-pulse">
      <div className="mx-auto h-14 w-full rounded-full bg-black/[0.06] sm:h-16" />
      <div className="mt-6 flex items-stretch justify-center gap-3">
        <div className="h-[11.5rem] min-w-0 flex-1 rounded-[1.75rem] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]" />
        <div className="h-[11.5rem] min-w-0 flex-[1.7] rounded-[1.75rem] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]" />
        <div className="h-[11.5rem] min-w-0 flex-1 rounded-[1.75rem] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]" />
        <div className="h-[11.5rem] min-w-0 flex-1 rounded-[1.75rem] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]" />
      </div>
    </div>
  );
}
