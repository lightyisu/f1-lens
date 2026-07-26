/** 站点 SEO 常量与 URL 解析 */

export const SITE_NAME = "F1 Lens";

export const SITE_DESCRIPTION =
  "F1 Lens is a simple way to get Formula 1 schedules, race results, and session analysis — with a clean, minimal presentation.";

export const SITE_DESCRIPTION_ZH =
  "F1 Lens：简洁查看 Formula 1 赛程、正赛成绩与比赛分析。";

/** 生产域名优先 NEXT_PUBLIC_SITE_URL，其次 Vercel 注入域名 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return `https://${prod.replace(/^https?:\/\//, "")}`;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;

  return "http://localhost:3000";
}
