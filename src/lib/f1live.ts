// 官方 Livetiming 静态 SessionInfo（免登录）
// https://livetiming.formula1.com/static/SessionInfo.json

const SESSION_INFO_URL =
  "https://livetiming.formula1.com/static/SessionInfo.json";

export type F1SessionStatus =
  | "Inactive"
  | "Started"
  | "Aborted"
  | "Finished"
  | "Finalised"
  | "Ends"
  | string;

export type F1SessionType =
  | "Practice 1"
  | "Practice 2"
  | "Practice 3"
  | "Qualifying"
  | "Sprint Qualifying"
  | "Sprint"
  | "Race"
  | string;

export interface F1SessionInfo {
  Meeting: {
    Name: string;
    Location: string;
    Number: number;
    Country: { Code: string; Name: string };
    Circuit: { ShortName: string };
  };
  SessionStatus: F1SessionStatus;
  ArchiveStatus?: { Status?: string };
  Type: F1SessionType;
  Name: string;
  StartDate: string;
  EndDate: string;
  GmtOffset: string;
  Path: string;
}

/** "2026-07-26T15:00:00" + "02:00:00" -> UTC Date（不依赖本机时区） */
export function sessionLocalToUtc(localIso: string, gmtOffset: string): Date {
  const m = localIso.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
  );
  if (!m) return new Date(NaN);

  const asUtcMs = Date.UTC(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    Number(m[4]),
    Number(m[5]),
    Number(m[6]),
  );

  const sign = gmtOffset.trim().startsWith("-") ? -1 : 1;
  const clean = gmtOffset.replace(/^[+-]/, "");
  const [oh, om, os] = clean.split(":").map(Number);
  const offsetMs =
    sign * ((oh || 0) * 3600 + (om || 0) * 60 + (os || 0)) * 1000;

  // local = UTC + offset ⇒ UTC = local − offset
  return new Date(asUtcMs - offsetMs);
}

export async function getF1SessionInfo(
  opts?: { fresh?: boolean },
): Promise<F1SessionInfo | null> {
  try {
    const res = await fetch(SESSION_INFO_URL, {
      ...(opts?.fresh
        ? { cache: "no-store" as const }
        : { next: { revalidate: 30 } }),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    // 官方响应带 UTF-8 BOM
    const text = new TextDecoder("utf-8").decode(buf).replace(/^\uFEFF/, "");
    return JSON.parse(text) as F1SessionInfo;
  } catch {
    return null;
  }
}

export type F1SessionPhase = "live" | "ended" | "idle";

/** 仅依据官方 SessionInfo 判断场次阶段 */
export function getF1SessionPhase(
  info: F1SessionInfo,
  now = Date.now(),
): F1SessionPhase {
  const status = info.SessionStatus;
  const archive = info.ArchiveStatus?.Status;

  if (
    status === "Finished" ||
    status === "Finalised" ||
    status === "Ends" ||
    status === "Aborted"
  ) {
    return "ended";
  }

  // 归档生成中 / 完成：场次已结束
  if (archive === "Generating" || archive === "Complete") {
    return "ended";
  }

  if (status === "Started") return "live";

  // Inactive 且未归档：用官方时间窗兜底（状态偶发滞后）
  if (status === "Inactive") {
    const start = sessionLocalToUtc(info.StartDate, info.GmtOffset).getTime();
    const end = sessionLocalToUtc(info.EndDate, info.GmtOffset).getTime();
    if (Number.isFinite(start) && Number.isFinite(end)) {
      if (now >= start && now < end) return "live";
      if (now >= end) return "ended";
    }
  }

  return "idle";
}

export function isF1SessionLive(info: F1SessionInfo, now = Date.now()): boolean {
  return getF1SessionPhase(info, now) === "live";
}
