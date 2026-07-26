import type { Of1Driver, Of1Pit, Of1Stint } from "@/lib/openf1";
import { COMPOUND_COLORS } from "@/lib/colors";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface Props {
  stints: Of1Stint[];
  pits: Of1Pit[];
  drivers: Of1Driver[];
  /** 按正赛完赛顺序排列的车手号码 */
  order: number[];
  t: Dictionary;
}

/** 配胎 / 进站策略图（纯 CSS 甘特图，服务端渲染） */
export default function StintChart({
  stints,
  pits,
  drivers,
  order,
  t,
}: Props) {
  if (stints.length === 0) {
    return (
      <p className="text-muted py-8 text-center tracking-wide">
        {t.noStintData}
      </p>
    );
  }

  const driverMap = new Map(drivers.map((d) => [d.driver_number, d]));
  const totalLaps = Math.max(...stints.map((s) => s.lap_end));
  const pitCount = new Map<number, number>();
  for (const p of pits) {
    pitCount.set(p.driver_number, (pitCount.get(p.driver_number) ?? 0) + 1);
  }

  const stintsByDriver = new Map<number, Of1Stint[]>();
  for (const s of stints) {
    const arr = stintsByDriver.get(s.driver_number) ?? [];
    arr.push(s);
    stintsByDriver.set(s.driver_number, arr);
  }
  const rows = [
    ...order.filter((n) => stintsByDriver.has(n)),
    ...[...stintsByDriver.keys()]
      .filter((n) => !order.includes(n))
      .sort((a, b) => a - b),
  ];

  return (
    <div>
      <div className="space-y-1.5">
        {rows.map((num) => {
          const d = driverMap.get(num);
          const driverStints = (stintsByDriver.get(num) ?? []).sort(
            (a, b) => a.stint_number - b.stint_number
          );
          return (
            <div key={num} className="flex items-center gap-2.5 text-xs">
              <span className="w-10 shrink-0 font-mono font-bold text-ink">
                {d?.name_acronym ?? num}
              </span>
              <div className="flex-1 flex h-5 rounded-md overflow-hidden bg-black/[0.04]">
                {driverStints.map((s) => {
                  const lapCount = s.lap_end - s.lap_start + 1;
                  const compound = s.compound?.toUpperCase() ?? "";
                  const compoundLabel =
                    t.compounds[compound] ??
                    (compound || t.unknownCompound);
                  return (
                    <div
                      key={s.stint_number}
                      className="h-full border-r border-white/70 flex items-center justify-center overflow-hidden"
                      style={{
                        width: `${(lapCount / totalLaps) * 100}%`,
                        backgroundColor: COMPOUND_COLORS[compound] ?? "#52525b",
                      }}
                      title={t.stintTitle(
                        compoundLabel,
                        s.lap_start,
                        s.lap_end,
                        lapCount
                      )}
                    >
                      <span className="text-[10px] font-mono text-black/70 px-1">
                        {lapCount >= 5 ? lapCount : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
              <span className="w-16 shrink-0 text-right text-muted font-mono">
                {t.pits(pitCount.get(num) ?? 0)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-5 text-xs text-muted">
        {Object.entries(t.compounds).map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ backgroundColor: COMPOUND_COLORS[key] }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
