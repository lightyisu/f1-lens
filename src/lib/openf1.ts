// OpenF1 API 数据层（2023 年起的比赛细节数据）
// 文档: https://openf1.org/docs/

const BASE = "https://api.openf1.org/v1";

export const OPENF1_MIN_SEASON = 2023;

export interface Of1Meeting {
  meeting_key: number;
  meeting_name: string;
  country_name: string;
  circuit_short_name: string;
  date_start: string;
  year: number;
}

export interface Of1Session {
  session_key: number;
  meeting_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
}

export interface Of1Driver {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  team_name: string | null;
  team_colour: string | null;
}

export interface Of1Lap {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  is_pit_out_lap: boolean;
}

export interface Of1Stint {
  driver_number: number;
  stint_number: number;
  compound: string | null;
  lap_start: number;
  lap_end: number;
  tyre_age_at_start: number | null;
}

export interface Of1Pit {
  driver_number: number;
  lap_number: number;
  pit_duration: number | null;
}

export interface Of1Weather {
  date: string;
  air_temperature: number;
  track_temperature: number;
  humidity: number;
  rainfall: number;
  wind_speed: number;
}

export interface Of1RaceControl {
  date: string;
  category: string;
  flag: string | null;
  scope: string | null;
  message: string;
  driver_number: number | null;
  lap_number: number | null;
}

export interface Of1SessionResult {
  position: number;
  driver_number: number;
  duration: number | null;
  gap_to_leader: number | string | null;
}

export interface SessionFastest {
  driverCode: string;
  driverName: string;
  teamColour: string | null;
}

/** OpenF1 请求失败时返回 null，由调用方降级处理 */
async function ofetch<T>(path: string, revalidate = 86400): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * 通过赛季年份 + 正赛日期匹配 OpenF1 的 meeting。
 * meetings 的 date_start 是周五练习赛，正赛在周日，取 5 天内最接近的一场。
 */
async function findMeeting(
  season: string,
  raceDate: string
): Promise<Of1Meeting | null> {
  if (Number(season) < OPENF1_MIN_SEASON) return null;

  const meetings = await ofetch<Of1Meeting[]>(`/meetings?year=${season}`);
  if (!meetings?.length) return null;

  const target = new Date(`${raceDate}T12:00:00Z`).getTime();
  const DAY = 86400_000;
  let best: Of1Meeting | null = null;
  let bestDiff = Infinity;
  for (const m of meetings) {
    const diff = Math.abs(new Date(m.date_start).getTime() - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = m;
    }
  }
  if (!best || bestDiff > 5 * DAY) return null;
  return best;
}

/** 匹配 OpenF1 session_name 到本站场次 key（fp1 / qualifying / race …） */
export function openf1ToSessionKey(sessionName: string): string | null {
  const n = sessionName.toLowerCase();
  if (n === "practice 1") return "fp1";
  if (n === "practice 2") return "fp2";
  if (n === "practice 3") return "fp3";
  if (n.includes("sprint qualifying") || n.includes("sprint shootout"))
    return "sprintQualifying";
  if (n === "sprint") return "sprint";
  if (n === "qualifying") return "qualifying";
  if (n === "race") return "race";
  return null;
}

export async function findRaceSession(
  season: string,
  raceDate: string
): Promise<Of1Session | null> {
  const meeting = await findMeeting(season, raceDate);
  if (!meeting) return null;

  const sessions = await ofetch<Of1Session[]>(
    `/sessions?meeting_key=${meeting.meeting_key}&session_name=Race`
  );
  return sessions?.[0] ?? null;
}

export async function getMeetingSessions(
  season: string,
  raceDate: string
): Promise<Of1Session[]> {
  const meeting = await findMeeting(season, raceDate);
  if (!meeting) return [];
  return (
    (await ofetch<Of1Session[]>(`/sessions?meeting_key=${meeting.meeting_key}`)) ??
    []
  );
}

/** 该场次最快（P1）车手；无成绩时返回 null */
export async function getSessionFastest(
  sessionKey: number
): Promise<SessionFastest | null> {
  const results = await ofetch<Of1SessionResult[]>(
    `/session_result?session_key=${sessionKey}`,
    600
  );
  const p1 = results?.find((r) => r.position === 1);
  if (!p1) return null;

  const drivers = await getDrivers(sessionKey);
  const driver = drivers.find((d) => d.driver_number === p1.driver_number);
  if (!driver?.name_acronym) return null;

  const colour = driver.team_colour
    ? `#${driver.team_colour.replace(/^#/, "")}`
    : null;
  return {
    driverCode: driver.name_acronym.toUpperCase(),
    driverName: driver.full_name,
    teamColour: colour,
  };
}

export async function getDrivers(sessionKey: number): Promise<Of1Driver[]> {
  return (await ofetch<Of1Driver[]>(`/drivers?session_key=${sessionKey}`)) ?? [];
}

export async function getLaps(sessionKey: number): Promise<Of1Lap[]> {
  const laps = await ofetch<Of1Lap[]>(`/laps?session_key=${sessionKey}`);
  // 仅保留图表所需字段，减小传给客户端的数据量
  return (laps ?? []).map((l) => ({
    driver_number: l.driver_number,
    lap_number: l.lap_number,
    lap_duration: l.lap_duration,
    is_pit_out_lap: l.is_pit_out_lap,
  }));
}

export async function getStints(sessionKey: number): Promise<Of1Stint[]> {
  return (await ofetch<Of1Stint[]>(`/stints?session_key=${sessionKey}`)) ?? [];
}

export async function getPits(sessionKey: number): Promise<Of1Pit[]> {
  return (await ofetch<Of1Pit[]>(`/pit?session_key=${sessionKey}`)) ?? [];
}

export async function getWeather(sessionKey: number): Promise<Of1Weather[]> {
  return (await ofetch<Of1Weather[]>(`/weather?session_key=${sessionKey}`)) ?? [];
}

export async function getRaceControl(
  sessionKey: number
): Promise<Of1RaceControl[]> {
  return (
    (await ofetch<Of1RaceControl[]>(`/race_control?session_key=${sessionKey}`)) ??
    []
  );
}
