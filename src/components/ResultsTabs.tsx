"use client";

import { useState } from "react";
import type { QualifyingResult, RaceResult } from "@/lib/jolpica";
import { teamColor } from "@/lib/colors";
import { useLocale, useT } from "./LocaleProvider";
import type { Dictionary, Locale } from "@/lib/i18n/dictionaries";

function formatPositionText(
  positionText: string,
  locale: Locale,
  t: Dictionary,
): string {
  if (locale === "zh" && (positionText === "R" || positionText === "W")) {
    return t.retired;
  }
  return positionText;
}

/** 发车位 + 相对完赛升降：升红、降绿、不变 - */
function formatGridWithDelta(
  grid: string,
  position: string,
  positionText: string,
) {
  const g = Number(grid);
  const gridLabel =
    Number.isFinite(g) && g > 0 ? String(g) : grid && grid !== "0" ? grid : "—";

  if (positionText === "W" || !Number.isFinite(g) || g <= 0) {
    return gridLabel;
  }
  const p = Number(position);
  if (!Number.isFinite(p) || p <= 0) return gridLabel;

  const d = g - p;
  if (d > 0) {
    return (
      <>
        {gridLabel}{" "}
        <span className="text-red-600">(↑{d})</span>
      </>
    );
  }
  if (d < 0) {
    return (
      <>
        {gridLabel}{" "}
        <span className="text-emerald-600">(↓{Math.abs(d)})</span>
      </>
    );
  }
  return (
    <>
      {gridLabel} <span className="text-muted">(-)</span>
    </>
  );
}

interface Props {
  results: RaceResult[];
  qualifying: QualifyingResult[];
}

function TeamCell({
  constructorId,
  name,
}: {
  constructorId: string;
  name: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block w-1 h-4 rounded-sm shrink-0"
        style={{ backgroundColor: teamColor(constructorId) }}
      />
      <span>{name}</span>
    </span>
  );
}

function RaceTable({
  results,
  t,
  locale,
}: {
  results: RaceResult[];
  t: Dictionary;
  locale: Locale;
}) {
  if (results.length === 0) {
    return (
      <p className="text-muted py-14 text-center tracking-wide">
        {t.noRaceResults}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="text-left font-display text-[11px] tracking-[0.16em] text-muted border-b border-border-soft">
            <th className="py-3 pr-3 font-semibold">{t.pos}</th>
            <th className="py-3 pr-3 font-semibold">{t.driver}</th>
            <th className="py-3 pr-3 font-semibold">{t.team}</th>
            <th className="py-3 pr-3 font-semibold">{t.grid}</th>
            <th className="py-3 pr-3 font-semibold">{t.timeStatus}</th>
            <th className="py-3 pr-3 font-semibold">{t.fastestLap}</th>
            <th className="py-3 font-semibold text-right">{t.points}</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr
              key={`${r.Driver.driverId}-${i}`}
              className="border-b border-border-soft/70 hover:bg-black/[0.02] transition-colors"
            >
              <td className="py-3.5 pr-3 font-display text-lg font-black text-ink w-12">
                {formatPositionText(r.positionText, locale, t)}
              </td>
              <td className="py-3.5 pr-3">
                <span className="font-semibold text-ink">
                  {r.Driver.givenName} {r.Driver.familyName}
                </span>
                <span className="ml-2 text-xs text-muted font-mono">
                  #{r.number}
                </span>
              </td>
              <td className="py-3.5 pr-3 text-zinc-600">
                <TeamCell
                  constructorId={r.Constructor.constructorId}
                  name={r.Constructor.name}
                />
              </td>
              <td className="py-3.5 pr-3 font-mono tabular-nums text-zinc-700">
                {formatGridWithDelta(r.grid, r.position, r.positionText)}
              </td>
              <td className="py-3.5 pr-3 font-mono text-zinc-700">
                {r.Time?.time ?? r.status}
              </td>
              <td className="py-3.5 pr-3 font-mono text-muted">
                {r.FastestLap ? (
                  <span
                    className={
                      r.FastestLap.rank === "1"
                        ? "font-bold text-violet-600"
                        : undefined
                    }
                  >
                    {r.FastestLap.Time.time}
                  </span>
                ) : (
                  "-"
                )}
              </td>
              <td className="py-3.5 font-mono font-bold text-right text-ink">
                {Number(r.points) > 0 ? r.points : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QualiTable({
  qualifying,
  t,
}: {
  qualifying: QualifyingResult[];
  t: Dictionary;
}) {
  if (qualifying.length === 0) {
    return (
      <p className="text-muted py-14 text-center tracking-wide">
        {t.noQualiResults}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="text-left font-display text-[11px] tracking-[0.16em] text-muted border-b border-border-soft">
            <th className="py-3 pr-3 font-semibold">{t.pos}</th>
            <th className="py-3 pr-3 font-semibold">{t.driver}</th>
            <th className="py-3 pr-3 font-semibold">{t.team}</th>
            <th className="py-3 pr-3 font-semibold">Q1</th>
            <th className="py-3 pr-3 font-semibold">Q2</th>
            <th className="py-3 font-semibold">Q3</th>
          </tr>
        </thead>
        <tbody>
          {qualifying.map((q, i) => (
            <tr
              key={`${q.Driver.driverId}-${i}`}
              className="border-b border-border-soft/70 hover:bg-black/[0.02] transition-colors"
            >
              <td className="py-3.5 pr-3 font-display text-lg font-black text-ink w-12">
                {q.position}
              </td>
              <td className="py-3.5 pr-3 font-semibold text-ink">
                {q.Driver.givenName} {q.Driver.familyName}
              </td>
              <td className="py-3.5 pr-3 text-zinc-600">
                <TeamCell
                  constructorId={q.Constructor.constructorId}
                  name={q.Constructor.name}
                />
              </td>
              <td className="py-3.5 pr-3 font-mono text-muted">
                {q.Q1 ?? "-"}
              </td>
              <td className="py-3.5 pr-3 font-mono text-muted">
                {q.Q2 ?? "-"}
              </td>
              <td className="py-3.5 font-mono text-zinc-700">{q.Q3 ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ResultsTabs({ results, qualifying }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const [tab, setTab] = useState<"race" | "quali">("race");

  return (
    <div className="panel rounded-3xl p-4 sm:p-6 bg-white">
      <div className="flex gap-1 mb-5 p-1 rounded-xl bg-card w-fit">
        {(
          [
            ["race", t.raceResults],
            ["quali", t.qualifying],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`font-display px-4 py-2 rounded-lg text-sm font-bold tracking-[0.08em] transition-colors cursor-pointer ${
              tab === key
                ? "bg-accent text-white"
                : "text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "race" ? (
        <RaceTable results={results} t={t} locale={locale} />
      ) : (
        <QualiTable qualifying={qualifying} t={t} />
      )}
    </div>
  );
}
