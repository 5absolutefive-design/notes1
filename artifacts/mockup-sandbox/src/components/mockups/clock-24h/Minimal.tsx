import { useEffect, useState } from "react";

function Clock24Minimal({ now }: { now: Date }) {
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  const secDeg = s * 6;
  const minDeg = m * 6 + s * 0.1;
  // 24-hour: full rotation in 24h → each hour = 15°
  const hourDeg = h * 15 + m * 0.25 + s * (0.25 / 60);

  const cx = 160;
  const cy = 160;
  const r = 140;

  const ticks = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 15 - 90) * (Math.PI / 180);
    const isMajor = i % 6 === 0;
    const isMid = i % 3 === 0 && !isMajor;
    const inner = r - (isMajor ? 18 : isMid ? 11 : 7);
    const outer = r;
    return {
      x1: cx + inner * Math.cos(angle),
      y1: cy + inner * Math.sin(angle),
      x2: cx + outer * Math.cos(angle),
      y2: cy + outer * Math.sin(angle),
      isMajor,
      isMid,
      label: i === 0 ? "0" : String(i),
      lx: cx + (r - 30) * Math.cos(angle),
      ly: cy + (r - 30) * Math.sin(angle),
    };
  });

  const handEnd = (deg: number, len: number) => {
    const a = (deg - 90) * (Math.PI / 180);
    return { x: cx + len * Math.cos(a), y: cy + len * Math.sin(a) };
  };

  const h1 = handEnd(hourDeg, 70);
  const m1 = handEnd(minDeg, 100);
  const s1 = handEnd(secDeg, 118);

  const pad = (n: number) => String(n).padStart(2, "0");
  const timeStr = `${pad(h)}:${pad(m)}:${pad(s)}`;

  return (
    <div className="flex flex-col items-center gap-5">
      <svg width="320" height="320" viewBox="0 0 320 320">
        {/* Face */}
        <circle cx={cx} cy={cy} r={r} fill="white" stroke="#e5e7eb" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={r - 4} fill="none" stroke="#f3f4f6" strokeWidth="1" />

        {/* Ticks + labels */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.isMajor ? "#1f2937" : t.isMid ? "#6b7280" : "#d1d5db"}
              strokeWidth={t.isMajor ? 2.5 : t.isMid ? 1.5 : 1}
              strokeLinecap="round"
            />
            {t.isMajor && (
              <text
                x={t.lx} y={t.ly}
                textAnchor="middle" dominantBaseline="central"
                fontSize="11" fontWeight="600" fill="#374151"
                fontFamily="system-ui, sans-serif"
              >
                {t.label}
              </text>
            )}
          </g>
        ))}

        {/* 24h label */}
        <text x={cx} y={cy + 38} textAnchor="middle" fontSize="9" fill="#9ca3af" fontFamily="system-ui" letterSpacing="2">
          24H
        </text>

        {/* Hour hand */}
        <line x1={cx} y1={cy} x2={h1.x} y2={h1.y}
          stroke="#1f2937" strokeWidth="5" strokeLinecap="round" />
        {/* Minute hand */}
        <line x1={cx} y1={cy} x2={m1.x} y2={m1.y}
          stroke="#374151" strokeWidth="3" strokeLinecap="round" />
        {/* Second hand */}
        <line x1={cx} y1={cy} x2={s1.x} y2={s1.y}
          stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r="5" fill="#1f2937" />
        <circle cx={cx} cy={cy} r="2" fill="#ef4444" />
      </svg>

      <div className="text-3xl font-mono font-bold text-gray-800 tracking-widest">
        {timeStr}
      </div>
      <div className="text-xs text-gray-400 tracking-widest uppercase">
        {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </div>
    </div>
  );
}

export function Minimal() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 px-12 py-10 flex flex-col items-center gap-2">
        <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mb-2">24-Hour Analog Clock</p>
        <Clock24Minimal now={now} />
        <p className="text-[10px] text-gray-300 mt-2 tracking-widest">1 rotation = 24 hours</p>
      </div>
    </div>
  );
}
