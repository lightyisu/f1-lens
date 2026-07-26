// 通用格式化工具

/** 秒数 -> "m:ss.mmm" 圈速格式 */
export function formatLapTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(3).padStart(6, "0")}`;
}

/** 秒数 -> "m:ss" 简短格式（图表坐标轴用） */
export function formatLapTimeShort(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds - m * 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** "2025-03-16" (+ 可选 "04:00:00Z") -> UTC 日期显示 */
export function formatRaceDate(date: string, locale: "zh" | "en" = "zh"): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (locale === "en") {
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  }
  return `${d.getUTCMonth() + 1}月${d.getUTCDate()}日`;
}

/** 比赛开始时间的 Date 对象（无 time 字段时按当天 12:00 UTC 处理） */
export function raceStartDate(date: string, time?: string): Date {
  return new Date(`${date}T${time ?? "12:00:00Z"}`);
}

/** 场次起止时间（按访问者本地时区显示） */
export function formatSessionDateTime(
  date: Date,
  locale: "zh" | "en" = "zh",
): string {
  if (Number.isNaN(date.getTime())) return "—";
  if (locale === "en") {
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
