import Link from "next/link";
import {
  getSchedule,
  getSeasonWinners,
  type Race,
  type RaceWinner,
} from "@/lib/jolpica";
import { formatRaceDate, raceStartDate } from "@/lib/format";
import { carImageUrl, hasCarBackground, teamColor } from "@/lib/carImage";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import { localizeRaceName } from "@/lib/i18n/raceNames";
import {
  getF1SessionInfo,
  getF1SessionPhase,
} from "@/lib/f1live";
import { getRaceForecast, forecastIcon } from "@/lib/weather";
import {
  getMeetingSessions,
  getSessionFastest,
  openf1ToSessionKey,
  type SessionFastest,
} from "@/lib/openf1";
import SeasonSelect from "@/components/SeasonSelect";
import Countdown from "@/components/Countdown";
import TrackOutline from "@/components/TrackOutline";
import CarImage from "@/components/CarImage";

export const dynamic = "force-dynamic";

// 服务端动态页取当前时间（收拢在辅助函数里，避免渲染期直接调用不纯函数）
function nowMs() {
  return Date.now();
}

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

interface RaceSessionItem {
  key: string;
  label: string;
  date: Date;
}

/** 获取比赛周末所有场次，按时间先后升序排列 */
function getUpcomingSessions(race: Race, t: Dictionary): RaceSessionItem[] {
  const sources: Array<
    [string, string, { date: string; time?: string } | undefined]
  > = [
    ["fp1", t.sessionFp1, race.FirstPractice],
    ["sprintQualifying", t.sessionSprintQualifying, race.SprintQualifying],
    ["fp2", t.sessionFp2, race.SecondPractice],
    ["sprint", t.sessionSprint, race.Sprint],
    ["fp3", t.sessionFp3, race.ThirdPractice],
    ["qualifying", t.sessionQualifying, race.Qualifying],
    ["race", t.sessionRace, { date: race.date, time: race.time }],
  ];

  return sources
    .flatMap(([key, label, session]) =>
      session
        ? [
            {
              key,
              label,
              date: raceStartDate(session.date, session.time),
            },
          ]
        : []
    )
    .filter((s) => !Number.isNaN(s.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

function sessionShortCode(key: string): string {
  switch (key) {
    case "fp1":
      return "FP1";
    case "fp2":
      return "FP2";
    case "fp3":
      return "FP3";
    case "sprintQualifying":
      return "SQ";
    case "sprint":
      return "SPR";
    case "qualifying":
      return "QUA";
    case "race":
      return "RACE";
    default:
      return key.toUpperCase();
  }
}

function formatSessionShortTime(date: Date, locale: "zh" | "en" = "zh"): string {
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(locale === "en" ? "en-GB" : "zh-CN", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

const spotlightCard =
  "soft-card group relative flex h-[11.5rem] max-w-full min-w-0 shrink-0 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-white p-5 text-ink transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)]";
const sideCard = `${spotlightCard} w-[13.5rem]`;
const mainCard = `${spotlightCard} w-[20rem]`;

function SessionCard({
  session,
  status,
  isLive,
  circuitId,
  season,
  round,
  locale,
  t,
  fastest,
}: {
  session: RaceSessionItem;
  status: "finished" | "live" | "focus" | "upcoming";
  isLive: boolean;
  circuitId: string;
  season: string;
  round: string;
  locale: "zh" | "en";
  t: Dictionary;
  fastest?: SessionFastest | null;
}) {
  const isHighlight = status === "focus" || status === "live";

  if (isHighlight) {
    return (
      <Link
        href={`/race/${season}/${round}`}
        className={`soft-card group relative flex h-[11.5rem] w-[18rem] shrink-0 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-white p-5 text-ink transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)] ${
          isLive ? "ring-1 ring-accent/40" : ""
        }`}
      >
        <TrackOutline
          circuitId={circuitId}
          className="right-4 top-4 h-8 w-auto brightness-0 opacity-20"
        />
        <div className="relative z-10 pr-10">
          {isLive ? (
            <div className="flex items-center gap-1.5 text-[13px] text-accent">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              <span>{t.liveNow} · {session.label}</span>
            </div>
          ) : (
            <span className="text-[13px] text-ink/45">
              {session.label} · {sessionShortCode(session.key)}
            </span>
          )}
        </div>
        <div className="relative z-10 mt-auto">
          {isLive ? (
            <span className="font-display text-2xl font-black tracking-tight text-accent">
              {t.liveNow}
            </span>
          ) : (
            <Countdown
              targetIso={session.date.toISOString()}
              variant="compact"
              className="text-[0.95rem] whitespace-nowrap"
            />
          )}
        </div>
      </Link>
    );
  }

  const finished = status === "finished";

  return (
    <Link
      href={`/race/${season}/${round}`}
      aria-label={
        fastest
          ? `${session.label} · ${fastest.driverName}`
          : session.label
      }
      className="soft-card group relative flex h-[11.5rem] w-[5.5rem] shrink-0 flex-col justify-between overflow-hidden rounded-[1.75rem] bg-white px-3 py-5 text-ink transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)]"
    >
      <span className="text-[12px] text-ink/40">
        {sessionShortCode(session.key)}
      </span>
      {fastest ? (
        <span
          className="font-display text-xl font-black leading-none tracking-[0.04em]"
          style={
            fastest.teamColour ? { color: fastest.teamColour } : undefined
          }
        >
          {fastest.driverCode}
        </span>
      ) : (
        <span className="text-xs text-ink/30">
          {finished ? t.finished : t.upcoming}
        </span>
      )}
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
  const now = nowMs();
  const isFinished = (r: Race) =>
    raceStartDate(r.date, r.time).getTime() + 3 * 3600_000 < now;
  const nextIndex = races.findIndex((r) => !isFinished(r));
  const nextRace = nextIndex === -1 ? undefined : races[nextIndex];
  const nextNextRace = nextIndex === -1 ? undefined : races[nextIndex + 1];
  // 下一站比赛日当地天气预报（赛道经纬度 -> Open-Meteo，超预报范围返回 null）
  const forecast = nextRace
    ? await getRaceForecast(
        Number(nextRace.Circuit.Location.lat),
        Number(nextRace.Circuit.Location.long),
        nextRace.date,
      )
    : null;
  // 上一场比赛：下一站的前一站，展示在下一场大卡片左侧
  const prevRace = nextIndex > 0 ? races[nextIndex - 1] : undefined;
  const prevWinner = prevRace ? winners.get(prevRace.round) : undefined;
  const prevCarSrc =
    prevRace && prevWinner && season === prevRace.season
      ? carImageUrl(prevWinner.constructorId, prevRace.season)
      : null;

  // 获取比赛周末当前即将到来的下一个场次（优先一练 FP1，随着周末推进到排位赛、正赛）
  const upcomingSessions = nextRace ? getUpcomingSessions(nextRace, t) : [];
  const nextSession = upcomingSessions.find((s) => s.date.getTime() > now);
  const targetSession =
    nextSession ??
    (upcomingSessions.length > 0
      ? upcomingSessions[upcomingSessions.length - 1]
      : undefined);
  const targetDateIso =
    nextSession?.date.toISOString() ??
    (nextRace ? raceStartDate(nextRace.date, nextRace.time).toISOString() : "");

  // 直播状态只认官方 SessionInfo（与当前下一站轮次对齐时）
  const f1Phase: ReturnType<typeof getF1SessionPhase> =
    f1Session && nextRace && String(f1Session.Meeting.Number) === nextRace.round
      ? getF1SessionPhase(f1Session, now)
      : "idle";
  const liveLabel =
    f1Session && f1Phase === "live"
      ? f1SessionLabel(f1Session.Type, f1Session.Name, t)
      : null;

  // 比赛日（比赛周末）判定：首个练习赛前 24 小时至正赛结束后 3 小时
  const firstSessionTime = upcomingSessions[0]?.date.getTime();
  const raceEndTime = nextRace
    ? raceStartDate(nextRace.date, nextRace.time).getTime() + 3 * 3600_000
    : 0;
  const isRaceWeekend = Boolean(
    nextRace &&
    season === currentYear &&
    firstSessionTime &&
    now >= firstSessionTime - 24 * 3600_000 &&
    now <= raceEndTime
  );

  const sessionCards = isRaceWeekend
    ? upcomingSessions.map((s) => {
        const durationMs = (s.key === "race" ? 3 : 1.5) * 3600_000;
        const isPast = s.date.getTime() + durationMs < now;
        const isLive = Boolean(
          f1Phase === "live" &&
          f1Session &&
          String(f1Session.Meeting.Number) === nextRace?.round &&
          f1SessionLabel(f1Session.Type, f1Session.Name, t) === s.label
        );
        const isFocus = isLive || (!isPast && nextSession?.key === s.key);
        const status: "finished" | "live" | "focus" | "upcoming" = isLive
          ? "live"
          : isPast
            ? "finished"
            : isFocus
              ? "focus"
              : "upcoming";
        return {
          session: s,
          status,
          isLive,
        };
      })
    : [];

  const sessionFastest = new Map<string, SessionFastest>();
  if (nextRace && sessionCards.some((c) => c.status === "finished")) {
    const of1Sessions = await getMeetingSessions(
      nextRace.season,
      nextRace.date
    );
    const finished = sessionCards.filter((c) => c.status === "finished");
    const winners = await Promise.all(
      finished.map(async (card) => {
        const of1 = of1Sessions.find(
          (s) => openf1ToSessionKey(s.session_name) === card.session.key
        );
        if (!of1) return null;
        const fastest = await getSessionFastest(of1.session_key);
        return fastest
          ? ([card.session.key, fastest] as const)
          : null;
      })
    );
    for (const row of winners) {
      if (row) sessionFastest.set(row[0], row[1]);
    }
  }

  return (
    <div className="animate-fade-up flex w-full flex-1 flex-col justify-center">
      {/* 搜索框与下方卡片同宽，避免视觉上被卡片压得很小 */}
      <div className="mx-auto mb-6 w-full">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted sm:h-6 sm:w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            aria-label={t.searchAria}
            placeholder={t.searchPlaceholder}
            className="h-14 w-full rounded-full border-0 bg-white pl-14 pr-6 text-base text-ink shadow-[0_8px_28px_rgba(15,23,42,0.06)] outline-none transition-all duration-200 placeholder:text-muted/70 hover:shadow-[0_14px_36px_rgba(15,23,42,0.1)] focus:shadow-[0_14px_36px_rgba(15,23,42,0.1)] sm:h-16 sm:pl-[3.75rem] sm:text-lg"
          />
        </div>
      </div>

      {nextRace && season === currentYear && (
        <div className="mx-auto flex w-full flex-wrap items-stretch justify-center gap-3">
          {prevRace && (
            <Link
              href={`/race/${prevRace.season}/${prevRace.round}`}
              className={sideCard}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[13px] leading-snug text-ink/50">
                  {localizeRaceName(
                    prevRace.raceName,
                    prevRace.Circuit.circuitId,
                    locale
                  )}
                </span>
                <span className="shrink-0 text-[12px] text-ink/30">
                  {t.finished}
                </span>
              </div>
              <div className="mt-auto flex items-end justify-between gap-2">
                <div>
                  {prevWinner ? (
                    <span
                      className="font-display text-3xl font-black leading-none tracking-tight"
                      style={{ color: teamColor(prevWinner.constructorId) }}
                    >
                      {prevWinner.driverCode}
                    </span>
                  ) : (
                    <span className="font-display text-3xl font-black leading-none tracking-tight text-ink">
                      {prevRace.round.padStart(2, "0")}
                    </span>
                  )}
                  <div className="mt-1 text-xs tabular-nums text-ink/35">
                    {formatRaceDate(prevRace.date, locale)}
                  </div>
                </div>
                {prevCarSrc && prevWinner && (
                  <CarImage
                    src={prevCarSrc}
                    alt={t.carAlt(prevWinner.constructorName)}
                    className="mb-0.5 h-7 w-auto max-w-[4.75rem] object-contain object-right drop-shadow-sm"
                  />
                )}
              </div>
            </Link>
          )}
          <Link
            href={`/race/${nextRace.season}/${nextRace.round}`}
            className={mainCard}
          >
            <TrackOutline
              circuitId={nextRace.Circuit.circuitId}
              className="right-4 top-4 h-8 w-auto brightness-0 opacity-20"
            />
            <div className="relative z-10 flex items-start justify-between gap-8 pr-10">
              <span className="text-[13px] leading-snug text-ink/50">
                {localizeRaceName(
                  nextRace.raceName,
                  nextRace.Circuit.circuitId,
                  locale
                )}
              </span>
              {f1Phase === "live" && (
                <span className="relative mt-1 flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                </span>
              )}
            </div>
            <div className="relative z-10 mt-auto">
              {f1Phase === "live" ? (
                <div className="font-display text-3xl font-black tracking-tight text-accent">
                  {t.liveNow}
                </div>
              ) : nextSession ? (
                <Countdown
                  targetIso={targetDateIso}
                  variant="compact"
                  className="text-xl"
                />
              ) : (
                <div className="font-display text-2xl font-black tracking-tight text-ink/40">
                  {t.sessionEnded}
                </div>
              )}
            </div>
          </Link>
          <div className={sideCard}>
            <div className="flex items-start justify-between gap-2">
              <span className="text-[13px] text-ink/50">{t.raceWeather}</span>
              {forecast ? (
                <span className="text-lg leading-none" aria-hidden>
                  {forecastIcon(forecast.weatherCode)}
                </span>
              ) : (
                <span className="text-[12px] text-ink/30">R{nextRace.round}</span>
              )}
            </div>
            {forecast ? (
              <div className="mt-auto flex items-end justify-between gap-2">
                <div>
                  <span className="font-display text-3xl font-black tabular-nums leading-none tracking-tight">
                    {Math.round(forecast.tempMax)}°
                  </span>
                  <span className="ml-1 text-sm font-semibold text-ink/30">
                    {Math.round(forecast.tempMin)}°
                  </span>
                </div>
                <span className="text-xs tabular-nums text-[#3b82f6]">
                  {t.precipProb(forecast.precipProb)}
                </span>
              </div>
            ) : (
              <span className="mt-auto text-sm text-ink/40">{t.noForecast}</span>
            )}
          </div>
          {nextNextRace && (
            <Link
              href={`/race/${nextNextRace.season}/${nextNextRace.round}`}
              className={sideCard}
            >
              <TrackOutline
                circuitId={nextNextRace.Circuit.circuitId}
                className="right-4 top-4 h-8 w-auto brightness-0 opacity-20"
              />
              <div className="relative z-10 pr-10">
                <span className="text-[13px] leading-snug text-ink/50">
                  {localizeRaceName(
                    nextNextRace.raceName,
                    nextNextRace.Circuit.circuitId,
                    locale
                  )}
                </span>
              </div>
              <div className="relative z-10 mt-auto flex items-end justify-between gap-2">
                <span className="font-display text-2xl font-black leading-none tracking-tight tabular-nums">
                  {nextNextRace.round.padStart(2, "0")}
                </span>
                <span className="text-xs tabular-nums text-[#3b82f6]">
                  {formatRaceDate(nextNextRace.date, locale)}
                </span>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* 比赛日/比赛周末：把当前大奖赛的所有比赛拆分成多个卡片，已结束的在左边 */}
      {nextRace && season === currentYear && isRaceWeekend && sessionCards.length > 0 && (
        <div className="mx-auto mt-6 w-full">
          <div className="mx-auto mb-3 flex w-full max-w-6xl items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-xs font-black tracking-wider text-accent">
                R{nextRace.round}
              </span>
              <span className="text-black/20">·</span>
              <h3 className="font-display text-sm font-bold text-ink sm:text-base">
                {locale === "zh" ? "本站各场次赛程" : "Weekend Sessions"}
              </h3>
            </div>
            <span className="text-xs text-muted tabular-nums">
              {localizeRaceName(nextRace.raceName, nextRace.Circuit.circuitId, locale)}
            </span>
          </div>

          <div className="no-scrollbar flex w-full flex-nowrap items-stretch justify-start gap-3 overflow-x-auto sm:flex-wrap sm:justify-center">
            {sessionCards.map((item) => (
              <SessionCard
                key={item.session.key}
                session={item.session}
                status={item.status}
                isLive={item.isLive}
                circuitId={nextRace.Circuit.circuitId}
                season={nextRace.season}
                round={nextRace.round}
                locale={locale}
                t={t}
                fastest={sessionFastest.get(item.session.key)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 赛季赛程面板暂时不显示 */}
      {false && (
      <section className="panel rounded-2xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-black tracking-tight leading-none text-ink">
              {season}
              <span className="text-muted font-bold text-sm ml-1.5 tracking-[0.12em]">
                {t.season}
              </span>
            </h1>
          <SeasonSelect season={season} small />
        </div>

        {races.length === 0 ? (
          <p className="mt-4 text-sm text-muted">{t.noSchedule(season)}</p>
        ) : (
          <div className="mt-3 max-h-[26rem] overflow-y-auto grid grid-cols-2 gap-2 pr-1">
            {races.map((race, i) => {
              const finished = isFinished(race);
              const isNext = i === nextIndex;
              const winner = finished ? winners.get(race.round) : undefined;
              const carSrc =
                winner && season === race.season
                  ? carImageUrl(winner.constructorId, race.season)
                  : null;
              return (
                <Link
                  key={race.round}
                  href={`/race/${race.season}/${race.round}`}
                  className={`group relative flex flex-col gap-1 overflow-hidden rounded-2xl border p-3 shadow-[0_2px_10px_rgba(0,0,0,0.18)] transition-all duration-200 hover:-translate-y-0.5 ${
                    isNext
                      ? "border-accent/60 bg-ink hover:shadow-[0_4px_16px_rgba(225,6,0,0.25)]"
                      : "border-white/[0.06] bg-ink hover:shadow-[0_4px_14px_rgba(0,0,0,0.3)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-display text-[11px] font-bold tabular-nums leading-none tracking-[0.08em] ${
                        isNext ? "text-accent" : "text-white/35"
                      }`}
                    >
                      {race.round.padStart(2, "0")}
                    </span>
                    {finished ? (
                      <span className="font-display text-[8px] tracking-[0.14em] text-white/25">
                        {t.finished}
                      </span>
                    ) : isNext ? (
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                      </span>
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
                    )}
                  </div>
                  <span
                    className={`text-[12px] font-semibold leading-snug transition-colors ${
                      isNext
                        ? "text-white group-hover:text-accent"
                        : finished
                          ? "text-white/45 group-hover:text-white/70"
                          : "text-white/85 group-hover:text-accent"
                    }`}
                  >
                    {localizeRaceName(
                      race.raceName,
                      race.Circuit.circuitId,
                      locale
                    )}
                  </span>
                  <div className="mt-auto flex items-end justify-between gap-1 pt-1">
                    <span className="text-[10px] tabular-nums text-white/35">
                      {formatRaceDate(race.date, locale)}
                    </span>
                    {carSrc && winner && (
                      <span
                        className="relative -mb-1.5 -mr-1 flex h-6 w-16 items-end justify-end"
                        style={{ color: teamColor(winner.constructorId) }}
                      >
                        <span
                          aria-hidden
                          className="absolute bottom-0 right-0 select-none font-display text-3xl font-black leading-none tracking-[0.04em]"
                          style={{
                            color: "transparent",
                            WebkitTextStroke: `1.5px ${teamColor(winner.constructorId)}80`,
                          }}
                        >
                          {winner.driverCode}
                        </span>
                        <CarImage
                          src={carSrc}
                          alt={t.carAlt(winner.constructorName)}
                          className="relative z-10 h-4 w-auto drop-shadow-sm"
                        />
                      </span>
                    )}
                  </div>
                </Link>
              );
              })}
          </div>
        )}
      </section>
      )}
    </div>
  );
}
