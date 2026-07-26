import type { MetadataRoute } from "next";
import { getSchedule } from "@/lib/jolpica";
import { OPENF1_MIN_SEASON } from "@/lib/openf1";
import { getSiteUrl } from "@/lib/seo";

/** 当前年 + 近两年赛程页，避免 sitemap 过大 */
async function seasonEntries(season: number): Promise<MetadataRoute.Sitemap> {
  try {
    const races = await getSchedule(String(season));
    const base = getSiteUrl();
    return races.flatMap((race) => {
      const raceUrl = `${base}/race/${race.season}/${race.round}`;
      const entries: MetadataRoute.Sitemap = [
        {
          url: raceUrl,
          lastModified: race.date ? new Date(race.date) : new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
        },
      ];
      if (Number(race.season) >= OPENF1_MIN_SEASON) {
        entries.push({
          url: `${raceUrl}/analysis`,
          lastModified: race.date ? new Date(race.date) : new Date(),
          changeFrequency: "monthly",
          priority: 0.6,
        });
      }
      return entries;
    });
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const year = new Date().getUTCFullYear();
  const seasons = [year, year - 1, year - 2].filter((y) => y >= 1950);

  const nested = await Promise.all(seasons.map((s) => seasonEntries(s)));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...nested.flat(),
  ];
}
