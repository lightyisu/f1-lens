// 赛道轮廓数据（开源项目 bacinger/f1-circuits，CC BY-SA 4.0）
// 服务端将 GeoJSON 经纬度转为 SVG path，用作装饰背景

const GEOJSON_URL =
  "https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson";

interface CircuitFeature {
  properties: { id: string; Name: string };
  bbox: [number, number, number, number];
  geometry: { type: string; coordinates: [number, number][] };
}

interface CircuitGeoJson {
  features: CircuitFeature[];
}

export interface CircuitOutline {
  path: string;
  viewBox: string;
}

const MAX_POINTS = 400;
/** 匹配阈值：经纬度约 0.5 度（~50km）内视为同一赛道 */
const MATCH_THRESHOLD = 0.5;

/**
 * 按 Jolpica 提供的赛道经纬度，就近匹配赛道并生成归一化的 SVG path。
 * 数据缺失或匹配失败时返回 null，由调用方降级。
 */
export async function getCircuitOutline(
  lat: number,
  lon: number
): Promise<CircuitOutline | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  let data: CircuitGeoJson;
  try {
    const res = await fetch(GEOJSON_URL, { next: { revalidate: 2592000 } });
    if (!res.ok) return null;
    data = await res.json();
  } catch {
    return null;
  }

  let best: CircuitFeature | null = null;
  let bestDist = Infinity;
  for (const f of data.features) {
    if (f.geometry?.type !== "LineString" || !f.bbox) continue;
    const cx = (f.bbox[0] + f.bbox[2]) / 2;
    const cy = (f.bbox[1] + f.bbox[3]) / 2;
    const dist = Math.hypot(cx - lon, cy - lat);
    if (dist < bestDist) {
      bestDist = dist;
      best = f;
    }
  }
  if (!best || bestDist > MATCH_THRESHOLD) return null;

  // 抽稀点数，控制 path 字符串体积
  const coords = best.geometry.coordinates;
  const step = Math.max(1, Math.ceil(coords.length / MAX_POINTS));
  const points = coords.filter((_, i) => i % step === 0);

  // 等距圆柱投影：经度按中心纬度余弦缩放，纬度翻转为屏幕 y 轴
  const midLat = (best.bbox[1] + best.bbox[3]) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const xs = points.map(([pLon]) => pLon * kx);
  const ys = points.map(([, pLat]) => -pLat);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  const scale = 100 / Math.max(w, h);

  const path = points
    .map((_, i) => {
      const x = ((xs[i] - minX) * scale).toFixed(1);
      const y = ((ys[i] - minY) * scale).toFixed(1);
      return `${i === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join("");

  return {
    path,
    viewBox: `0 0 ${(w * scale).toFixed(1)} ${(h * scale).toFixed(1)}`,
  };
}
