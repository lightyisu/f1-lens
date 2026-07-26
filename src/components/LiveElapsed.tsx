"use client";

import { useEffect, useState } from "react";

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 进行中场次已进行时长（客户端每秒刷新） */
export default function LiveElapsed({ startIso }: { startIso: string }) {
  const start = new Date(startIso).getTime();
  const [elapsed, setElapsed] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setElapsed(formatElapsed(Date.now() - start));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [start]);

  return (
    <div className="font-display text-4xl sm:text-5xl font-black tabular-nums leading-none tracking-tight">
      {elapsed ?? "--:--"}
    </div>
  );
}
