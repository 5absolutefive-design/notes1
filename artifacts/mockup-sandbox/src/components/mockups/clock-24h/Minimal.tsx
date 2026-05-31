import { useEffect, useState } from "react";

function sectorPath(cx: number, cy: number, r: number, startDeg: number, sweepDeg: number) {
  if (sweepDeg <= 0) return "";
  if (sweepDeg >= 360) {
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
  const hourDeg = h * 15 + m * 0.25 + s * (0.25 / 60);

  // cx/cy = 180 so orbit dot (r=145+18+7=170) fits within 360x360
  const cx = 180, cy = 180;
  const r = 130;
  const orbitR = r + 20;
  const dotR = 7;

  const elapsedSweep   = Math.max(0.01, Math.min(hourDeg, 359.99));
  const remainingSweep = 360 - elapsedSweep;

  const elapsedPath   = sectorPath(cx, cy, r, 0, elapsedSweep);
  const remainingPath = sectorPath(cx, cy, r, elapsedSweep, remainingSweep);

  const handEnd = (deg: number, len: number) => {
    const a = (deg - 90) * (Math.PI / 180);
    return { x: cx + len * Math.cos(a), y: cy + len * Math.sin(a) };
  };

  const m1 = handEnd(minDeg, 82);

  // Orbiting second dot — moon around earth
  const secRad = (secDeg - 90) * (Math.PI / 180);
  const orbitDot = {
    x: cx + orbitR * Math.cos(secRad),
    y: cy + orbitR * Math.sin(secRad),
  };

  const ticks = Array.from({ length: 24 }, (_, i) => {
    const hour  = i === 0 ? 24 : i;
    const angle = (i * 15 - 90) * (Math.PI / 180);
    const isMajor = i % 3 === 0;
    const outer = r - 4;
    const inner = outer - (isMajor ? 14 : 6);
    return {
      x1: cx + inner * Math.cos(angle),
      y1: cy + inner * Math.sin(angle),
      x2: cx + outer * Math.cos(angle),
      y2: cy + outer * Math.sin(angle),
      isMajor,
      label: String(hour),
      lx: cx + (inner - 10) * Math.cos(angle),
      ly: cy + (inner - 10) * Math.sin(angle),
    };
  });

  return (
    <div className="flex items-center justify-center">
      {/* SVG 360×360, center at 180,180; orbit dot max reach = 180+150+7 = 337 — fits */}
      <svg width="360" height="360" viewBox="0 0 360 360">
        {/* Remaining sector — pure white */}
        <path d={remainingPath} fill="#ffffff" />
        {/* Elapsed sector — off-white warm cream */}
        <path d={elapsedPath} fill="#e8e4db" />

        {/* Clock border */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#d1cec7" strokeWidth="2" />

        {/* Sector boundary line */}
        {hourDeg > 0.5 && hourDeg < 359.5 && (
          <line
            x1={cx} y1={cy}
            x2={cx + r * Math.cos((hourDeg - 90) * Math.PI / 180)}
            y2={cy + r * Math.sin((hourDeg - 90) * Math.PI / 180)}
            stroke="#c0bbb2" strokeWidth="1.5"
          />
        )}

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="#9ca3af" strokeWidth={t.isMajor ? 2 : 1}
              strokeLinecap="round" opacity={t.isMajor ? 0.8 : 0.45}
            />
            {t.isMajor && (
              <text x={t.lx} y={t.ly} textAnchor="middle" dominantBaseline="central"
                fontSize="10" fontWeight="600" fill="#6b7280" fontFamily="system-ui, sans-serif">
                {t.label}
              </text>
            )}
          </g>
        ))}

        {/* Minute hand */}
        <line x1={cx} y1={cy} x2={m1.x} y2={m1.y}
          stroke="#374151" strokeWidth="2.5" strokeLinecap="round" />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="5" fill="#374151" />

        {/* Orbiting second moon — travels outside the clock face */}
        <circle cx={orbitDot.x} cy={orbitDot.y} r={dotR} fill="#1f2937" />
      </svg>
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
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-4 flex items-center justify-center">
        <Clock24Minimal now={now} />
      </div>
    </div>
  );
}
