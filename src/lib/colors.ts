// 车队配色与轮胎配色常量

/** Jolpica constructorId -> 品牌色 */
export const TEAM_COLORS: Record<string, string> = {
  red_bull: "#3671C6",
  ferrari: "#E8002D",
  mercedes: "#27F4D2",
  mclaren: "#FF8000",
  aston_martin: "#229971",
  alpine: "#00A1E8",
  williams: "#64C4FF",
  rb: "#6692FF",
  alphatauri: "#5E8FAA",
  sauber: "#52E252",
  alfa: "#C92D4B",
  haas: "#B6BABD",
  racing_point: "#F596C8",
  force_india: "#F596C8",
  renault: "#FFF500",
  toro_rosso: "#469BFF",
  lotus_f1: "#FFB800",
  audi: "#00E701",
  cadillac: "#C8A96A",
};

export const DEFAULT_TEAM_COLOR = "#9CA3AF";

export function teamColor(constructorId: string): string {
  return TEAM_COLORS[constructorId] ?? DEFAULT_TEAM_COLOR;
}

/** 轮胎配方配色（OpenF1 compound 字段） */
export const COMPOUND_COLORS: Record<string, string> = {
  SOFT: "#E8002D",
  MEDIUM: "#FFD12E",
  HARD: "#F0F0EC",
  INTERMEDIATE: "#43B02A",
  WET: "#0067AD",
};

export const COMPOUND_LABELS: Record<string, string> = {
  SOFT: "软胎",
  MEDIUM: "中性胎",
  HARD: "硬胎",
  INTERMEDIATE: "半雨胎",
  WET: "全雨胎",
};
