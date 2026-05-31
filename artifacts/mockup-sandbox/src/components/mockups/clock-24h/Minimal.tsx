import { useEffect, useState } from "react";

function sectorPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const toRad = (d: number) => (d - 90) * (Math.PI / 180);
  const sx = cx + r * Math.cos(toRad(startDeg));
  const sy = cy + r * Math.sin(toRad(startDeg));
  const ex = cx + r * Math.cos(toRad(endDeg));
  const ey = cy + r * Math.sin(toRad(endDeg));
  const large = (endDeg - startDeg + 360) % 360 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
}

function Clock24Minimal({ now }: { now: Date }) {
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  const minDeg = m * 6 + s * 0.1;
  const secDeg = s * 6;
  // 24h: each hour = 15°, starts at 0° (top = midnight/24)
  const hourDeg = h * 15 + m * 0.25 + s * (0.25 / 60);

  const cx = 160;
  const cy = 160;
  const r = 130;

  const ticks = Array.from({ length: 24 }, (_, i) => {
    const hour = i === 0 ? 24 : i;
    const angle = (i * 15 - 90) * (Math.PI / 180);
    const isMajor = i % 3 === 0;
    const inner = r - (isMajor ? 16 : 6);
    return {
      x1: cx + inner * Math.cos(angle),
      y1: cy + inner * Math.sin(angle),
      x2: cx + r * Math.cos(angle),
      y2: cy + r * Math.sin(angle),
      isMajor,
      label: String(hour),
      lx: cx + (r + 15) * Math.cos(angle),
      ly: cy + (r + 15) * Math.sin(angle),
    };
  });

  const handEnd = (deg: number, len: number) => {
    const a = (deg - 90) * (Math.PI / 180);
    return { x: cx + len * Math.cos(a), y: cy + len * Math.sin(a) };
  };

  const m1 = handEnd(minDeg, 88);
  const s1 = handEnd(secDeg, 100);

  const pad = (n: number) => String(n).padStart(2, "0");

  // Unfilled sector = from hourDeg to 360 (remaining part of day)
  const filledPath = sectorPath(cx, cy, r, 0, hourDeg === 0 ? 0.01 : hourDeg);
  const unfilledPath = hourDeg < 359.99
    ? sectorPath(cx, cy, r, hourDeg, 360)
    : null;

  return (
    <div className="flex flex-col items-center gap-5">
      <svg width="340" height="340" viewBox="0 0 340 340">
        {/* Outer bezel */}
        <circle cx={cx + 10} cy={cy + 10} r={r + 22} fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="1.5" />

        {/* Unfilled sector (remaining day) */}
        {unfilledPath && (
          <path d={unfilledPath} fill="#1f2937" />
        )}
        {/* Filled sector (elapsed time) */}
        <path d={filledPath} fill="#6366f1" />

        {/* Thin divider line at current hour boundary */}
        <line
          x1={cx} y1={cy}
          x2={cx + r * Math.cos((hourDeg - 90) * Math.PI / 180)}
          y2={cy + r * Math.sin((hourDeg - 90) * Math.PI / 180)}
          stroke="white" strokeWidth="1.5" opacity="0.4"
        />

        {/* Tick marks ON TOP of fill */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="white" strokeWidth={t.isMajor ? 2 : 1}
              strokeLinecap="round" opacity={t.isMajor ? 0.9 : 0.4}
            />
            {t.isMajor && (
              <text
                x={t.lx} y={t.ly}
                textAnchor="middle" dominantBaseline="central"
                fontSize="10" fontWeight="700" fill="#374151"
                fontFamily="system-ui, sans-serif"
              >
                {t.label}
              </text>
            )}
          </g>
        ))}

        {/* Minute hand */}
        <line x1={cx} y1={cy} x2={m1.x} y2={m1.y}
          stroke="white" strokeWidth="3" strokeLinecap="round" />
        {/* Second hand */}
        <line x1={cx} y1={cy} x2={s1.x} y2={s1.y}
          stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="6" fill="white" />
        <circle cx={cx} cy={cy} r="3" fill="#fbbf24" />

        {/* Hour label inside filled zone */}
        <text
          x={cx} y={cy + 28}
          textAnchor="middle" fontSize="22" fontWeight="800"
          fill="white" fontFamily="system-ui, sans-serif" opacity="0.9"
        >
          {pad(h)}
        </text>
      </svg>

      <div className="text-2xl font-mono font-bold text-gray-800 tracking-widest">
        {pad(h)}:{pad(m)}:{pad(s)}
      </div>
      <div className="text-[11px] text-gray-400 tracking-widest uppercase">
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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 px-10 py-8 flex flex-col items-center gap-2">
        <p className="text-[9px] font-bold text-gray-400 tracking-[0.25em] uppercase mb-1">24-Hour Sector Clock</p>
        <Clock24Minimal now={now} />
        <p className="text-[9px] text-gray-300 tracking-widest mt-1">Filled = elapsed · Dark = remaining</p>
      </div>
    </div>
  );
}
