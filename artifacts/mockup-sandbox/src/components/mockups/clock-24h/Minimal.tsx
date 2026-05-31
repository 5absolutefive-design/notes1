import { useEffect, useState } from "react";

function sectorPath(cx: number, cy: number, r: number, startDeg: number, sweepDeg: number) {
  if (sweepDeg <= 0) return "";
  if (sweepDeg >= 360) {
    // full circle as two arcs
    const top = { x: cx, y: cy - r };
    const bot = { x: cx, y: cy + r };
    return `M ${cx} ${cy} L ${top.x} ${top.y} A ${r} ${r} 0 0 1 ${bot.x} ${bot.y} A ${r} ${r} 0 0 1 ${top.x} ${top.y} Z`;
  }
  const toRad = (d: number) => (d - 90) * (Math.PI / 180);
  const sx = cx + r * Math.cos(toRad(startDeg));
  const sy = cy + r * Math.sin(toRad(startDeg));
  const ex = cx + r * Math.cos(toRad(startDeg + sweepDeg));
  const ey = cy + r * Math.sin(toRad(startDeg + sweepDeg));
  const large = sweepDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
}

function Clock24Minimal({ now }: { now: Date }) {
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  const minDeg  = m * 6 + s * 0.1;
  const secDeg  = s * 6;
  const hourDeg = h * 15 + m * 0.25 + s * (0.25 / 60); // 0–360

  const cx = 160, cy = 160, r = 120;
  const outerR = r + 18; // bezel radius

  // elapsed sweep = hourDeg, remaining = 360 - hourDeg
  const elapsedSweep   = Math.max(0.01, Math.min(hourDeg, 359.99));
  const remainingSweep = 360 - elapsedSweep;

  const elapsedPath   = sectorPath(cx, cy, r, 0, elapsedSweep);
  const remainingPath = sectorPath(cx, cy, r, elapsedSweep, remainingSweep);

  const handEnd = (deg: number, len: number) => {
    const a = (deg - 90) * (Math.PI / 180);
    return { x: cx + len * Math.cos(a), y: cy + len * Math.sin(a) };
  };

  const m1 = handEnd(minDeg, 82);
  const s1 = handEnd(secDeg, 96);

  const ticks = Array.from({ length: 24 }, (_, i) => {
    const hour  = i === 0 ? 24 : i;
    const angle = (i * 15 - 90) * (Math.PI / 180);
    const isMajor = i % 3 === 0;
    const inner = r - (isMajor ? 14 : 6);
    return {
      x1: cx + inner   * Math.cos(angle),
      y1: cy + inner   * Math.sin(angle),
      x2: cx + r       * Math.cos(angle),
      y2: cy + r       * Math.sin(angle),
      isMajor,
      label: String(hour),
      lx: cx + (r + 12) * Math.cos(angle),
      ly: cy + (r + 12) * Math.sin(angle),
    };
  });

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="320" height="320" viewBox="0 0 320 320">
        {/* Bezel — same center as sectors */}
        <circle cx={cx} cy={cy} r={outerR} fill="#f9f9f7" stroke="#e4e4e0" strokeWidth="2" />

        {/* Remaining sector — pure white */}
        <path d={remainingPath} fill="#ffffff" />
        {/* Elapsed sector — off-white / warm cream */}
        <path d={elapsedPath} fill="#e8e4db" />

        {/* Thin boundary line at current hour position */}
        {hourDeg > 0.5 && hourDeg < 359.5 && (
          <line
            x1={cx} y1={cy}
            x2={cx + r * Math.cos((hourDeg - 90) * Math.PI / 180)}
            y2={cy + r * Math.sin((hourDeg - 90) * Math.PI / 180)}
            stroke="#c8c4bb" strokeWidth="1.5"
          />
        )}

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="#9ca3af"
              strokeWidth={t.isMajor ? 2 : 1}
              strokeLinecap="round"
              opacity={t.isMajor ? 0.8 : 0.4}
            />
            {t.isMajor && (
              <text
                x={t.lx} y={t.ly}
                textAnchor="middle" dominantBaseline="central"
                fontSize="10" fontWeight="600" fill="#6b7280"
                fontFamily="system-ui, sans-serif"
              >
                {t.label}
              </text>
            )}
          </g>
        ))}

        {/* Minute hand */}
        <line x1={cx} y1={cy} x2={m1.x} y2={m1.y}
          stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />
        {/* Second hand */}
        <line x1={cx} y1={cy} x2={s1.x} y2={s1.y}
          stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="5" fill="#374151" />
        <circle cx={cx} cy={cy} r="2.5" fill="#f59e0b" />

        {/* Hour digit */}
        <text
          x={cx} y={cy + 30}
          textAnchor="middle" fontSize="20" fontWeight="800"
          fill="#374151" fontFamily="system-ui, sans-serif" opacity="0.85"
        >
          {pad(h)}
        </text>
      </svg>

      <div className="text-2xl font-mono font-bold text-gray-700 tracking-widest">
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
        <p className="text-[9px] text-gray-300 tracking-widest mt-1">Off-white = elapsed · White = remaining</p>
      </div>
    </div>
  );
}
