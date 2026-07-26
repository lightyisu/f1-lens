"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Of1Driver, Of1Lap } from "@/lib/openf1";
import { formatLapTime, formatLapTimeShort } from "@/lib/format";
import { useT } from "./LocaleProvider";

interface Props {
  laps: Of1Lap[];
  drivers: Of1Driver[];
  /** 默认勾选的车手号码（正赛前几名） */
  defaultSelected: number[];
}

function driverColor(d: Of1Driver | undefined): string {
  return d?.team_colour ? `#${d.team_colour}` : "#9CA3AF";
}

export default function LapChart({ laps, drivers, defaultSelected }: Props) {
  const t = useT();
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(defaultSelected)
  );

  const driverMap = useMemo(() => {
    const m = new Map<number, Of1Driver>();
    drivers.forEach((d) => m.set(d.driver_number, d));
    return m;
  }, [drivers]);

  // 过滤掉进出站/安全车等异常慢圈（> 最快圈 1.35 倍），保持图表可读
  const { chartData, sortedDrivers } = useMemo(() => {
    const valid = laps.filter(
      (l) => l.lap_duration !== null && l.lap_duration > 0
    );
    const fastest = Math.min(...valid.map((l) => l.lap_duration!), Infinity);
    const cutoff = fastest * 1.35;

    const byLap = new Map<number, Record<string, number>>();
    for (const l of valid) {
      if (l.lap_duration! > cutoff) continue;
      const row = byLap.get(l.lap_number) ?? {};
      row[String(l.driver_number)] = l.lap_duration!;
      byLap.set(l.lap_number, row);
    }
    const data = [...byLap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([lap, row]) => ({ lap, ...row }));

    const nums = [...new Set(laps.map((l) => l.driver_number))].sort(
      (a, b) => {
        const ia = defaultSelected.indexOf(a);
        const ib = defaultSelected.indexOf(b);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a - b;
      }
    );
    return { chartData: data, sortedDrivers: nums };
  }, [laps, defaultSelected]);

  const toggle = (num: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  if (chartData.length === 0) {
    return (
      <p className="text-muted py-8 text-center tracking-wide">{t.noLapData}</p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {sortedDrivers.map((num) => {
          const d = driverMap.get(num);
          const active = selected.has(num);
          return (
            <button
              key={num}
              onClick={() => toggle(num)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                active
                  ? "border-transparent text-black"
                  : "border-border-soft text-muted hover:text-ink bg-white"
              }`}
              style={active ? { backgroundColor: driverColor(d) } : undefined}
              title={d?.full_name ?? t.driverFallback(num)}
            >
              {d?.name_acronym ?? num}
            </button>
          );
        })}
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="#ececee" strokeDasharray="3 3" />
            <XAxis
              dataKey="lap"
              stroke="#71717a"
              fontSize={12}
              label={{
                value: t.lapAxis,
                position: "insideBottomRight",
                offset: -2,
                fill: "#71717a",
                fontSize: 12,
              }}
            />
            <YAxis
              stroke="#71717a"
              fontSize={12}
              domain={["dataMin - 0.5", "dataMax + 0.5"]}
              tickFormatter={(v: number) => formatLapTimeShort(v)}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e4e4e7",
                borderRadius: 12,
                fontSize: 12,
                color: "#0d0d0f",
              }}
              labelFormatter={(lap) => t.lapLabel(String(lap))}
              formatter={(value, name) => [
                formatLapTime(Number(value)),
                driverMap.get(Number(name))?.name_acronym ?? name,
              ]}
            />
            {[...selected].map((num) => (
              <Line
                key={num}
                type="monotone"
                dataKey={String(num)}
                stroke={driverColor(driverMap.get(num))}
                strokeWidth={1.8}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[11px] tracking-wide text-muted/70 mt-3">
        {t.lapChartHint}
      </p>
    </div>
  );
}
