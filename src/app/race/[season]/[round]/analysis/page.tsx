import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getRaceResults, getRaceInfo } from "@/lib/jolpica";
import {
  findRaceSession,
  getDrivers,
  getLaps,
  getPits,
  getRaceControl,
  getStints,
  getWeather,
  OPENF1_MIN_SEASON,
  type Of1RaceControl,
  type Of1Weather,
} from "@/lib/openf1";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import { localizeRaceName } from "@/lib/i18n/raceNames";
import LapChart from "@/components/LapChart";
import StintChart from "@/components/StintChart";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ season: string; round: string }>;
}): Promise<Metadata> {
  const { season, round } = await params;
  if (
    !/^\d{4}$/.test(season) ||
    !/^\d{1,2}$/.test(round) ||
    Number(season) < OPENF1_MIN_SEASON
  ) {
    return { title: "Analysis" };
  }

  const [{ locale }, race] = await Promise.all([
    getDictionary(),
    getRaceInfo(season, round),
  ]);
  if (!race) return { title: "Analysis" };

  const name = localizeRaceName(race.raceName, race.Circuit.circuitId, locale);
  const title =
    locale === "zh" ? `${name} · 比赛分析` : `${name} · Session Analysis`;
  const description =
    locale === "zh"
      ? `${season} ${name}圈速对比、配胎策略与赛控消息`
      : `${season} ${name} lap times, tyre strategy, and race control`;

  return {
    title,
    description,
    alternates: { canonical: `/race/${season}/${round}/analysis` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/race/${season}/${round}/analysis`,
    },
    twitter: {
      title,
      description,
    },
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel rounded-3xl p-4 sm:p-6 bg-white">
      <h2 className="font-display text-[11px] tracking-[0.24em] text-muted font-semibold mb-5">
        {title}
      </h2>
      {children}
    </section>
  );
}

function WeatherSummary({
  weather,
  t,
}: {
  weather: Of1Weather[];
  t: Dictionary;
}) {
  if (weather.length === 0) {
    return (
      <p className="text-muted py-6 text-center tracking-wide">{t.noWeather}</p>
    );
  }
  const avg = (fn: (w: Of1Weather) => number) =>
    weather.reduce((s, w) => s + fn(w), 0) / weather.length;
  const hasRain = weather.some((w) => w.rainfall > 0);
  const cells = [
    { label: t.airTemp, value: `${avg((w) => w.air_temperature).toFixed(1)} °C` },
    {
      label: t.trackTemp,
      value: `${avg((w) => w.track_temperature).toFixed(1)} °C`,
    },
    { label: t.humidity, value: `${avg((w) => w.humidity).toFixed(0)} %` },
    { label: t.wind, value: `${avg((w) => w.wind_speed).toFixed(1)} m/s` },
    { label: t.rainfall, value: hasRain ? t.rainYes : t.rainNo },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {cells.map((c) => (
        <div key={c.label}>
          <div className="font-display text-[10px] tracking-[0.18em] text-muted">
            {c.label}
          </div>
          <div className="mt-1 font-display text-xl font-black tabular-nums text-ink">
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function keyMessages(rc: Of1RaceControl[]): Of1RaceControl[] {
  return rc
    .filter(
      (m) =>
        m.category === "SafetyCar" ||
        m.flag === "RED" ||
        m.flag === "CHEQUERED" ||
        /PENALTY|INVESTIGAT|COLLISION|DELETED|VIRTUAL SAFETY CAR/i.test(
          m.message
        )
    )
    .slice(0, 40);
}

function RaceControlList({
  rc,
  t,
}: {
  rc: Of1RaceControl[];
  t: Dictionary;
}) {
  const items = keyMessages(rc);
  if (items.length === 0) {
    return (
      <p className="text-muted py-6 text-center tracking-wide">
        {t.noRaceControl}
      </p>
    );
  }
  return (
    <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {items.map((m, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="shrink-0 w-12 text-right font-mono text-muted text-xs pt-0.5">
            {m.lap_number ? `L${m.lap_number}` : "-"}
          </span>
          <span className="text-zinc-700 leading-snug">{m.message}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ season: string; round: string }>;
}) {
  const { season, round } = await params;
  if (!/^\d{4}$/.test(season) || !/^\d{1,2}$/.test(round)) notFound();
  if (Number(season) < OPENF1_MIN_SEASON) notFound();

  const { locale, t } = await getDictionary();
  const raceResult = await getRaceResults(season, round);
  const race = raceResult ?? (await getRaceInfo(season, round));
  if (!race) notFound();

  const session = await findRaceSession(season, race.date);
  const raceTitle = localizeRaceName(
    race.raceName,
    race.Circuit.circuitId,
    locale
  );

  const finishOrder =
    raceResult?.Results?.map((r) => Number(r.number)).filter(
      (n) => !Number.isNaN(n)
    ) ?? [];

  const header = (
    <div className="space-y-5 animate-fade-up">
      <nav className="font-display text-[11px] tracking-[0.18em] text-muted">
        <Link
          href={`/?season=${season}`}
          className="hover:text-ink transition-colors"
        >
          {t.seasonNav(season)}
        </Link>
        <span className="mx-2 text-black/15">/</span>
        <Link
          href={`/race/${season}/${round}`}
          className="hover:text-ink transition-colors"
        >
          {raceTitle}
        </Link>
        <span className="mx-2 text-black/15">/</span>
        <span className="text-ink/80">{t.analysis}</span>
      </nav>
      <div>
        <p className="font-display text-[11px] tracking-[0.28em] text-accent font-semibold mb-2">
          {t.sessionAnalysis}
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight leading-none text-ink">
          {raceTitle}
        </h1>
      </div>
    </div>
  );

  if (!session) {
    return (
      <div className="space-y-8">
        {header}
        <div className="panel rounded-3xl p-12 text-center text-muted tracking-wide bg-white">
          {t.noOpenf1}
        </div>
      </div>
    );
  }

  const [drivers, laps, stints, pits, weather, raceControl] =
    await Promise.all([
      getDrivers(session.session_key),
      getLaps(session.session_key),
      getStints(session.session_key),
      getPits(session.session_key),
      getWeather(session.session_key),
      getRaceControl(session.session_key),
    ]);

  const defaultSelected = (
    finishOrder.length > 0
      ? finishOrder
      : [...new Set(laps.map((l) => l.driver_number))]
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      {header}

      <div className="animate-fade-up-delay space-y-6">
        <Section title={t.lapComparison}>
          <LapChart
            laps={laps}
            drivers={drivers}
            defaultSelected={defaultSelected}
          />
        </Section>

        <Section title={t.tyreStrategy}>
          <StintChart
            stints={stints}
            pits={pits}
            drivers={drivers}
            order={finishOrder}
            t={t}
          />
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title={t.weatherAvg}>
            <WeatherSummary weather={weather} t={t} />
          </Section>
          <Section title={t.raceControl}>
            <RaceControlList rc={raceControl} t={t} />
          </Section>
        </div>
      </div>
    </div>
  );
}
