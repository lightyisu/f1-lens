"use client";

import { useRouter } from "next/navigation";
import { useT } from "./LocaleProvider";

const FIRST_SEASON = 2010;

export default function SeasonSelect({ season }: { season: string }) {
  const router = useRouter();
  const t = useT();
  const current = new Date().getFullYear();
  const seasons: string[] = [];
  for (let y = current; y >= FIRST_SEASON; y--) seasons.push(String(y));

  return (
    <select
      value={season}
      onChange={(e) => router.push(`/?season=${e.target.value}`)}
      className="panel rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide text-ink outline-none focus:border-accent cursor-pointer appearance-none pr-9"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%2371717a' stroke-width='1.5' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        backgroundSize: "12px 8px",
      }}
      aria-label={t.selectSeason}
    >
      {seasons.map((y) => (
        <option key={y} value={y}>
          {t.seasonOption(y)}
        </option>
      ))}
    </select>
  );
}
