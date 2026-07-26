// Jolpica F1 API (Ergast 兼容) 数据层
// 文档: https://github.com/jolpica/jolpica-f1

const BASE = "https://api.jolpi.ca/ergast/f1";

export interface Circuit {
  circuitId: string;
  circuitName: string;
  Location: {
    lat: string;
    long: string;
    locality: string;
    country: string;
  };
}

export interface SessionSchedule {
  date: string;
  time?: string;
}

export interface Race {
  season: string;
  round: string;
  raceName: string;
  Circuit: Circuit;
  date: string;
  time?: string;
  FirstPractice?: SessionSchedule;
  SecondPractice?: SessionSchedule;
  ThirdPractice?: SessionSchedule;
  Qualifying?: SessionSchedule;
  Sprint?: SessionSchedule;
  SprintQualifying?: SessionSchedule;
}

export interface Driver {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  givenName: string;
  familyName: string;
  nationality: string;
}

export interface Constructor {
  constructorId: string;
  name: string;
  nationality: string;
}

export interface RaceResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: Driver;
  Constructor: Constructor;
  grid: string;
  laps: string;
  status: string;
  Time?: { millis: string; time: string };
  FastestLap?: {
    rank?: string;
    lap: string;
    Time: { time: string };
  };
}

export interface QualifyingResult {
  number: string;
  position: string;
  Driver: Driver;
  Constructor: Constructor;
  Q1?: string;
  Q2?: string;
  Q3?: string;
}

export interface RaceWithResults extends Race {
  Results?: RaceResult[];
  QualifyingResults?: QualifyingResult[];
}

interface MRData<T> {
  MRData: { RaceTable?: T; total: string };
}

/** 历史赛季缓存 1 天，当前赛季缓存 5 分钟 */
function revalidateFor(season: string): number {
  const current = new Date().getUTCFullYear();
  return Number(season) >= current ? 300 : 86400;
}

async function jfetch<T>(path: string, revalidate: number): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate } });
  if (!res.ok) {
    throw new Error(`Jolpica API ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

/** 某赛季完整赛程 */
export async function getSchedule(season: string): Promise<Race[]> {
  const data = await jfetch<MRData<{ Races: Race[] }>>(
    `/${season}.json?limit=100`,
    revalidateFor(season)
  );
  return data.MRData.RaceTable?.Races ?? [];
}

/** 单站正赛结果（无结果时返回 null） */
export async function getRaceResults(
  season: string,
  round: string
): Promise<RaceWithResults | null> {
  const data = await jfetch<MRData<{ Races: RaceWithResults[] }>>(
    `/${season}/${round}/results.json?limit=100`,
    revalidateFor(season)
  );
  return data.MRData.RaceTable?.Races?.[0] ?? null;
}

/** 单站排位赛结果（无数据时返回 null） */
export async function getQualifyingResults(
  season: string,
  round: string
): Promise<RaceWithResults | null> {
  const data = await jfetch<MRData<{ Races: RaceWithResults[] }>>(
    `/${season}/${round}/qualifying.json?limit=100`,
    revalidateFor(season)
  );
  return data.MRData.RaceTable?.Races?.[0] ?? null;
}

/** 单站基本信息（从赛程中取，用于结果尚未产生的场次） */
export async function getRaceInfo(
  season: string,
  round: string
): Promise<Race | null> {
  const races = await getSchedule(season);
  return races.find((r) => r.round === round) ?? null;
}

export interface RaceWinner {
  constructorId: string;
  constructorName: string;
  driverName: string;
  /** 三字缩写，如 RUS / VER */
  driverCode: string;
}

/** 全赛季各站冠军（round -> winner），一次请求获取 */
export async function getSeasonWinners(
  season: string
): Promise<Map<string, RaceWinner>> {
  const winners = new Map<string, RaceWinner>();
  try {
    const data = await jfetch<MRData<{ Races: RaceWithResults[] }>>(
      `/${season}/results/1.json?limit=100`,
      revalidateFor(season)
    );
    for (const race of data.MRData.RaceTable?.Races ?? []) {
      const r = race.Results?.[0];
      if (!r) continue;
      const code =
        r.Driver.code?.toUpperCase() ||
        r.Driver.familyName.slice(0, 3).toUpperCase();
      winners.set(race.round, {
        constructorId: r.Constructor.constructorId,
        constructorName: r.Constructor.name,
        driverName: `${r.Driver.givenName} ${r.Driver.familyName}`,
        driverCode: code,
      });
    }
  } catch {
    // 冠军数据仅用于卡片装饰，失败时静默降级
  }
  return winners;
}
