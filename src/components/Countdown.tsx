"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "./LocaleProvider";

function diffParts(target: number) {
  const total = Math.max(0, target - Date.now());
  return {
    days: Math.floor(total / 86400_000),
    hours: Math.floor((total % 86400_000) / 3600_000),
    minutes: Math.floor((total % 3600_000) / 60_000),
    seconds: Math.floor((total % 60_000) / 1000),
  };
}

/** 单个数字位：仅在该位变化时上下翻动 */
function TickDigit({ digit }: { digit: string }) {
  const prev = useRef(digit);
  const [current, setCurrent] = useState(digit);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (digit === prev.current) return;
    prev.current = digit;
    setCurrent(digit);
    setAnimKey((k) => k + 1);
  }, [digit]);

  return (
    <span className="countdown-tick-viewport inline-block overflow-hidden align-bottom">
      <span
        key={`${current}-${animKey}`}
        className={`countdown-tick-digit inline-block ${animKey > 0 ? "is-ticking" : ""}`}
      >
        {current}
      </span>
    </span>
  );
}

/** 整段数值按位渲染，未变化的位保持静止 */
function TickValue({ value }: { value: string }) {
  return (
    <span className="inline-flex tabular-nums">
      {value.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <TickDigit key={i} digit={ch} />
        ) : (
          <span key={i}>{ch}</span>
        )
      )}
    </span>
  );
}

/** 下一场比赛倒计时（客户端渲染，避免 SSR 时间不一致） */
export default function Countdown({
  targetIso,
  variant = "default",
}: {
  targetIso: string;
  variant?: "default" | "hero";
}) {
  const t = useT();
  const target = new Date(targetIso).getTime();
  const [parts, setParts] = useState<ReturnType<typeof diffParts> | null>(null);

  useEffect(() => {
    setParts(diffParts(target));
    const timer = setInterval(() => setParts(diffParts(target)), 1000);
    return () => clearInterval(timer);
  }, [target]);

  const cells = [
    { label: t.days, value: parts?.days },
    { label: t.hours, value: parts?.hours },
    { label: t.minutes, value: parts?.minutes },
    { label: t.seconds, value: parts?.seconds },
  ];

  if (variant === "hero") {
    return (
      <div className="flex gap-4 sm:gap-5">
        {cells.map((c) => (
          <div key={c.label} className="text-center min-w-12">
            <div className="font-display text-4xl sm:text-5xl font-black tabular-nums leading-none tracking-tight">
              <TickValue
                value={
                  c.value === undefined ? "--" : String(c.value).padStart(2, "0")
                }
              />
            </div>
            <div className="font-display text-[10px] tracking-[0.22em] text-white/45 mt-1.5">
              {c.label}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      {cells.map((c) => (
        <div key={c.label} className="text-center">
          <div className="panel rounded-xl px-3 py-2.5 min-w-14 font-display text-2xl font-black tabular-nums text-ink">
            <TickValue
              value={
                c.value === undefined ? "--" : String(c.value).padStart(2, "0")
              }
            />
          </div>
          <div className="font-display text-[10px] tracking-[0.2em] text-muted mt-1.5">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
