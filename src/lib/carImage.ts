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
