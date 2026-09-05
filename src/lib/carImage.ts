// 本地赛车侧视图：仅 2025 / 2026 赛季赛事卡片使用（public/cars/{season}/{slug}.webp）

/** 有赛车背景的赛季 */
export const CAR_BG_SEASONS = new Set(["2025", "2026"]);

/** Jolpica constructorId -> 本地文件 slug */
const CAR_SLUGS: Record<string, string> = {
  red_bull: "red-bull-racing",
  ferrari: "ferrari",
  mercedes: "mercedes",
  mclaren: "mclaren",
  aston_martin: "aston-martin",
  alpine: "alpine",
  williams: "williams",
  rb: "racing-bulls",
  sauber: "kick-sauber",
  haas: "haas",
  audi: "audi",
  cadillac: "cadillac",
};

export function hasCarBackground(season: string): boolean {
  return CAR_BG_SEASONS.has(season);
}

/** BoxBox 风格车队主题色（constructorId -> hex） */
const TEAM_COLORS: Record<string, string> = {
  red_bull: "#3671C6",
  ferrari: "#FF2800",
  mercedes: "#27F4D2",
  mclaren: "#FF8000",
  aston_martin: "#229971",
  alpine: "#0093CC",
  williams: "#64C4FF",
  rb: "#6692FF",
  sauber: "#52E252",
  haas: "#B6BABD",
  audi: "#00E0B8",
  cadillac: "#9ADfff",
};

export function teamColor(constructorId: string): string {
  return TEAM_COLORS[constructorId] ?? "#A1A1AA";
}

/** 返回本地赛车图路径；非 2025/2026 或未知车队时返回 null */
export function carImageUrl(
  constructorId: string,
  season: string
): string | null {
  if (!hasCarBackground(season)) return null;
  // 2026 起 Kick Sauber 由 Audi 接替
  const id =
    season === "2026" && constructorId === "sauber" ? "audi" : constructorId;
  const slug = CAR_SLUGS[id];
  if (!slug) return null;
  return `/cars/${season}/${slug}.webp`;
}
