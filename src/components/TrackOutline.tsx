// 赛道轮廓装饰：public/tracks/{circuitId}.svg（白色描边，低透明度展示）
import { existsSync } from "node:fs";
import path from "node:path";

export function hasTrackSvg(circuitId: string): boolean {
  return existsSync(
    path.join(process.cwd(), "public", "tracks", `${circuitId}.svg`)
  );
}

export default function TrackOutline({
  circuitId,
  className,
}: {
  circuitId: string;
  className?: string;
}) {
  if (!hasTrackSvg(circuitId)) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      aria-hidden
      alt=""
      src={`/tracks/${circuitId}.svg`}
      className={`pointer-events-none absolute select-none ${className}`}
    />
  );
}
