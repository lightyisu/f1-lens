// Open-Meteo 天气预报（免 API key）
// https://open-meteo.com/en/docs

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export interface RaceForecast {
  /** 预报对应日期（当地时间，YYYY-MM-DD） */
  date: string;
  /** 最高气温 ℃ */
  tempMax: number;
  /** 最低气温 ℃ */
  tempMin: number;
  /** 最大降水概率 % */
  precipProb: number;
  /** WMO 天气代码 */
  weatherCode: number;
}

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_probability_max: (number | null)[];
  weather_code: (number | null)[];
}

/** 根据赛道经纬度取比赛日当地预报，超预报范围或失败返回 null */
export async function getRaceForecast(
  lat: number,
  long: number,
  raceDate: string,
): Promise<RaceForecast | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(long),
      daily:
        "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
      timezone: "auto",
      forecast_days: "16",
    });
    const res = await fetch(`${FORECAST_URL}?${params}`, {
      next: { revalidate: 3600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { daily?: OpenMeteoDaily };
    const daily = data.daily;
    if (!daily) return null;
    const i = daily.time.indexOf(raceDate);
    if (i === -1) return null; // 超出 16 天预报范围
    const tempMax = daily.temperature_2m_max[i];
    const tempMin = daily.temperature_2m_min[i];
    if (tempMax == null || tempMin == null) return null;
    return {
      date: daily.time[i],
      tempMax,
      tempMin,
      precipProb: daily.precipitation_probability_max[i] ?? 0,
      weatherCode: daily.weather_code[i] ?? 0,
    };
  } catch {
    return null;
  }
}

/** WMO 天气代码 -> 展示 emoji */
export function forecastIcon(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}
