import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getQualifyingResults,
  getRaceInfo,
  getRaceResults,
} from "@/lib/jolpica";
import { OPENF1_MIN_SEASON } from "@/lib/openf1";
import { formatRaceDate } from "@/lib/format";
import { teamColor } from "@/lib/colors";
import { getDictionary } from "@/lib/i18n";
import { localizeRaceName } from "@/lib/i18n/raceNames";
import ResultsTabs from "@/components/ResultsTabs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ season: string; round: string }>;
}): Promise<Metadata> {
  const { season, round } = await params;
  if (!/^\d{4}$/.test(season) || !/^\d{1,2}$/.test(round)) {
    return { title: "Race" };
  }

  const [{ locale }, race] = await Promise.all([
    getDictionary(),
    getRaceInfo(season, round),
  ]);
  if (!race) return { title: "Race" };

  const name = localizeRaceName(race.raceName, race.Circuit.circuitId, locale);
  const title = `${name} · ${season} R${round.padStart(2, "0")}`;
  const description =
    locale === "zh"
      ? `${season} ${name}正赛与排位成绩 · ${race.Circuit.circuitName}`
      : `${season} ${name} race & qualifying results at ${race.Circuit.circuitName}`;

  return {
    title,
    description,
    alternates: { canonical: `/race/${season}/${round}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/race/${season}/${round}`,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function RacePage({
  params,
}: {
  params: Promise<{ season: string; round: string }>;
}) {
  const { season, round } = await params;
  if (!/^\d{4}$/.test(season) || !/^\d{1,2}$/.test(round)) notFound();

  const [{ locale, t }, raceResult, qualiResult] = await Promise.all([
    getDictionary(),
    getRaceResults(season, round),
    getQualifyingResults(season, round),
  ]);

  const race = raceResult ?? qualiResult ?? (await getRaceInfo(season, round));
  if (!race) notFound();

  const analysisAvailable = Number(season) >= OPENF1_MIN_SEASON;
  const winner = raceResult?.Results?.[0];
  const pole = qualiResult?.QualifyingResults?.[0];

  return (
    <div className="space-y-8">
      <nav className="animate-fade-up font-display text-[11px] tracking-[0.18em] text-muted">
        <Link
          href={`/?season=${season}`}
          className="hover:text-ink transition-colors"
        >
          {t.seasonNav(season)}
        </Link>
        <span className="mx-2 text-black/15">/</span>
        <span className="text-ink/80">
          {t.round} {round.padStart(2, "0")}
        </span>
      </nav>

      <header className="animate-fade-up space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="font-display text-[12px] tracking-[0.22em] text-ink font-bold mb-3">
              {race.Circuit.Location.country}
              <span className="text-muted mx-2 font-semibold">|</span>
              {race.Circuit.circuitName}
            </p>
            <h1 className="font-display text-4xl sm:text-6xl font-black tracking-tight leading-none text-ink">
              {localizeRaceName(
                race.raceName,
                race.Circuit.circuitId,
                locale
              )}
            </h1>
            <p className="text-sm text-muted mt-3">
              {race.Circuit.Location.locality}
              <span className="mx-2 text-black/15">·</span>
              {season}
              <span className="mx-2 text-black/15">·</span>
              {formatRaceDate(race.date, locale)}
            </p>
          </div>
          {analysisAvailable ? (
            <Link
              href={`/race/${season}/${round}/analysis`}
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-display text-sm font-bold tracking-[0.1em] px-5 py-2.5 rounded-xl transition-colors"
            >
              {t.analysis}
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <span
              className="inline-flex items-center bg-card text-muted font-display text-sm font-semibold tracking-[0.08em] px-5 py-2.5 rounded-xl cursor-not-allowed"
              title={t.analysisUnavailableHint}
            >
              {t.analysisUnavailable}
            </span>
          )}
        </div>

        {(winner || pole) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5 border-t border-border-soft pt-6">
            {[
              {
                label: t.round,
                value: round.padStart(2, "0"),
              },
              {
                label: t.date,
                value: formatRaceDate(race.date, locale),
              },
              {
                label: t.winner,
                value: winner
                  ? winner.Driver.familyName.toUpperCase()
                  : "—",
                color: winner
                  ? teamColor(winner.Constructor.constructorId)
                  : undefined,
              },
              {
                label: t.pole,
                value: pole ? pole.Driver.familyName.toUpperCase() : "—",
                color: pole
                  ? teamColor(pole.Constructor.constructorId)
                  : undefined,
              },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-[10px] tracking-[0.2em] text-muted">
                  {stat.label}
                </div>
                <div
                  className="mt-1 font-display text-xl sm:text-2xl font-black tracking-tight truncate"
                  style={{ color: stat.color ?? "var(--ink)" }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </header>

      <div className="animate-fade-up-delay">
        <ResultsTabs
          results={raceResult?.Results ?? []}
          qualifying={qualiResult?.QualifyingResults ?? []}
        />
      </div>
    </div>
  );
}
