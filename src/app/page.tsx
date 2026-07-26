import Link from "next/link";
import {
  getSchedule,
  getSeasonWinners,
  type Race,
  type RaceWinner,
} from "@/lib/jolpica";
import {
  formatRaceDate,
  formatSessionDateTime,
  raceStartDate,
} from "@/lib/format";
import { getCircuitOutline } from "@/lib/circuit";
import { carImageUrl, hasCarBackground } from "@/lib/carImage";
import { getDictionary, type Dictionary, type Locale } from "@/lib/i18n";
import { localizeRaceName } from "@/lib/i18n/raceNames";
import {
  getF1SessionInfo,
  getF1SessionPhase,
  sessionLocalToUtc,
} from "@/lib/f1live";
import SeasonSelect from "@/components/SeasonSelect";
import Countdown from "@/components/Countdown";
import LiveElapsed from "@/components/LiveElapsed";
import CarImage from "@/components/CarImage";

export const dynamic = "force-dynamic";

function f1SessionLabel(type: string, name: string, t: Dictionary): string {
  const key = `${type} ${name}`.toLowerCase();
  if (key.includes("practice 1") || name === "Practice 1") return t.sessionFp1;
  if (key.includes("practice 2") || name === "Practice 2") return t.sessionFp2;
  if (key.includes("practice 3") || name === "Practice 3") return t.sessionFp3;
  if (key.includes("sprint qualifying") || key.includes("sprint shootout"))
    return t.sessionSprintQualifying;
  if (type === "Sprint" || name === "Sprint") return t.sessionSprint;
  if (type === "Qualifying" || name === "Qualifying") return t.sessionQualifying;
  if (type === "Race" || name === "Race") return t.sessionRace;
  return name || type;
}

function RaceRow({
  race,
  finished,
  winner,
  t,
  locale,
}: {
  race: Race;
  finished: boolean;
  winner?: RaceWinner;
  t: Dictionary;
  locale: Locale;
}) {
  const carSrc =
    finished && winner && hasCarBackground(race.season)
      ? carImageUrl(winner.constructorId, race.season)
      : null;
  const name = localizeRaceName(
    race.raceName,
    race.Circuit.circuitId,
    locale
  );
  return (
    <Link
      href={`/race/${race.season}/${race.round}`}
      className="group panel relative overflow-hidden rounded-2xl p-5 pb-24 flex flex-col gap-3 transition-colors duration-200 hover:border-accent/35 hover:bg-white"
    >
      {carSrc && winner && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] select-none">
          <span className="driver-code-outline absolute inset-x-0 -bottom-3 text-center font-display text-[4.75rem] sm:text-[5.5rem] font-black tracking-[0.06em] leading-none">
            {winner.driverCode}
          </span>
          <CarImage
            src={carSrc}
            alt={t.carAlt(winner.constructorName)}
            className="absolute right-0 -bottom-2 -mr-3 w-[72%] max-w-60 z-10"
          />
        </div>
      )}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <div className="font-display text-[10px] tracking-[0.22em] text-muted">
            {t.round}
          </div>
          <div className="font-display text-4xl font-black tabular-nums leading-none mt-0.5 text-ink">
            {race.round.padStart(2, "0")}
          </div>
        </div>
        <div
          className={`font-display text-[10px] tracking-[0.18em] font-semibold px-2.5 py-1 rounded-md ${
            finished
              ? "bg-accent-soft text-accent"
              : "bg-black/[0.04] text-muted"
          }`}
        >
          {finished ? t.finished : t.upcoming}
        </div>
      </div>

      <div className="relative z-10">
        <div className="font-display text-lg font-bold tracking-[0.04em] leading-snug text-ink group-hover:text-accent transition-colors">
          {name}
        </div>
      </div>
    </Link>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const currentYear = String(new Date().getFullYear());
  const { season: seasonParam } = await searchParams;
  const season =
    seasonParam && /^\d{4}$/.test(seasonParam) ? seasonParam : currentYear;
  const { locale, t } = await getDictionary();

  const [races, winners, f1Session] = await Promise.all([
    getSchedule(season),
    hasCarBackground(season)
      ? getSeasonWinners(season)
      : Promise.resolve(new Map<string, RaceWinner>()),
    season === currentYear ? getF1SessionInfo() : Promise.resolve(null),
  ]);
  const now = Date.now();
  const isFinished = (r: Race) =>
    raceStartDate(r.date, r.time).getTime() + 3 * 3600_000 < now;
  const nextIndex = races.findIndex((r) => !isFinished(r));
  const nextRace = nextIndex === -1 ? undefined : races[nextIndex];
  const visibleRaces = nextIndex === -1 ? races : races.slice(0, nextIndex + 1);
  const upcomingRaces = nextIndex === -1 ? [] : races.slice(nextIndex + 1);

  // Banner 状态只认官方 SessionInfo（与当前下一站轮次对齐时）
  const f1Phase =
    f1Session && nextRace && String(f1Session.Meeting.Number) === nextRace.round
      ? getF1SessionPhase(f1Session, now)
      : "idle";
  const sessionBanner =
    f1Session && (f1Phase === "live" || f1Phase === "ended")
      ? {
          phase: f1Phase as "live" | "ended",
          label: f1SessionLabel(f1Session.Type, f1Session.Name, t),
          start: sessionLocalToUtc(f1Session.StartDate, f1Session.GmtOffset),
          end: sessionLocalToUtc(f1Session.EndDate, f1Session.GmtOffset),
          round: String(f1Session.Meeting.Number),
          circuitName: f1Session.Meeting.Circuit.ShortName,
        }
      : null;

  const circuitOutline =
    nextRace && season === currentYear
      ? await getCircuitOutline(
          Number(nextRace.Circuit.Location.lat),
          Number(nextRace.Circuit.Location.long)
        )
      : null;

  return (
    <div className="space-y-8">
      <div className="animate-fade-up flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.28em] text-accent font-semibold mb-2">
            {t.seasonSchedule}
          </p>
          <h1 className="font-display text-5xl sm:text-6xl font-black tracking-tight leading-none text-ink">
            {season}
            <span className="text-muted font-bold text-2xl sm:text-3xl ml-3 tracking-[0.12em]">
              {t.season}
            </span>
          </h1>
        </div>
        <SeasonSelect season={season} />
      </div>

      {nextRace && season === currentYear && (
        <section className="animate-fade-up-delay relative overflow-hidden rounded-3xl bg-ink p-6 sm:p-8 text-white">
          {circuitOutline && (
            <svg
              viewBox={circuitOutline.viewBox}
              preserveAspectRatio="xMidYMid meet"
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-10 h-[150%] w-auto opacity-[0.13] rotate-[8deg]"
            >
              <path
                d={circuitOutline.path}
                fill="none"
                stroke="white"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="font-display text-[11px] tracking-[0.28em] font-semibold text-white/70 mb-3 flex items-center gap-2">
                {sessionBanner?.phase === "live" ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                    </span>
                    <span>
                      {t.liveNow} · {sessionBanner.label} · R
                      {sessionBanner.round}
                    </span>
                  </>
                ) : sessionBanner?.phase === "ended" ? (
                  <span>
                    {t.sessionEnded} · {sessionBanner.label} · R
                    {sessionBanner.round}
                  </span>
                ) : (
                  <span>
                    {t.nextRace} · R{nextRace.round}
                  </span>
                )}
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight leading-none">
                {localizeRaceName(
                  nextRace.raceName,
                  nextRace.Circuit.circuitId,
                  locale
                )}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/65">
                {sessionBanner ? (
                  <>
                    {sessionBanner.label}
                    <span className="mx-2 text-white/30">·</span>
                    {sessionBanner.circuitName}
                  </>
                ) : (
                  <>
                    {nextRace.Circuit.circuitName}
                    <span className="mx-2 text-white/30">·</span>
                    {formatRaceDate(nextRace.date, locale)}
                  </>
                )}
              </p>
              {sessionBanner && (
                <p className="mt-2 font-display text-xs sm:text-sm tracking-[0.04em] text-white/45 tabular-nums">
                  <span className="text-white/35 tracking-[0.16em] uppercase mr-2">
                    {t.sessionSchedule}
                  </span>
                  {formatSessionDateTime(sessionBanner.start, locale)}
                  <span className="mx-2 text-white/25">–</span>
                  {formatSessionDateTime(sessionBanner.end, locale)}
                </p>
              )}
            </div>
            <div>
              {sessionBanner?.phase === "live" ? (
                <>
                  <div className="font-display text-[10px] tracking-[0.22em] text-white/55 mb-2">
                    {t.elapsed}
                  </div>
                  <LiveElapsed startIso={sessionBanner.start.toISOString()} />
                </>
              ) : sessionBanner?.phase === "ended" ? (
                <>
                  <div className="font-display text-[10px] tracking-[0.22em] text-white/45 mb-2">
                    {sessionBanner.label}
                  </div>
                  <div className="font-display text-4xl sm:text-5xl font-black tracking-tight leading-none">
                    {t.sessionEnded}
                  </div>
                </>
              ) : (
                <>
                  <div className="font-display text-[10px] tracking-[0.22em] text-white/45 mb-2">
                    {t.countdown}
                  </div>
                  <Countdown
                    targetIso={raceStartDate(
                      nextRace.date,
                      nextRace.time
                    ).toISOString()}
                    variant="hero"
                  />
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {races.length === 0 ? (
        <p className="text-muted py-16 text-center tracking-wide">
          {t.noSchedule(season)}
        </p>
      ) : (
        <div className="space-y-3 animate-fade-up-delay">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleRaces.map((race) => (
              <RaceRow
                key={race.round}
                race={race}
                finished={isFinished(race)}
                winner={winners.get(race.round)}
                t={t}
                locale={locale}
              />
            ))}
          </div>
          {upcomingRaces.length > 0 && (
            <details className="group pt-1">
              <summary className="flex items-center justify-center gap-2 py-4 text-sm text-muted hover:text-ink cursor-pointer select-none list-none tracking-wide transition-colors">
                <span className="group-open:hidden">
                  {t.expandUpcoming(upcomingRaces.length)}
                </span>
                <span className="hidden group-open:inline">
                  {t.collapseUpcoming}
                </span>
                <span className="text-[10px] transition-transform group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingRaces.map((race) => (
                  <RaceRow
                    key={race.round}
                    race={race}
                    finished={false}
                    t={t}
                    locale={locale}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
