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

function Clock24Dark({ now }: { now: Date }) {
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  const minDeg = m * 6 + s * 0.1;
  const secDeg = s * 6;
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
      lx: cx + (r + 16) * Math.cos(angle),
      ly: cy + (r + 16) * Math.sin(angle),
    };
  });

  const handEnd = (deg: number, len: number) => {
    const a = (deg - 90) * (Math.PI / 180);
    return { x: cx + len * Math.cos(a), y: cy + len * Math.sin(a) };
  };
  const tailEnd = (deg: number, len: number) => {
    const a = (deg + 90) * (Math.PI / 180);
    return { x: cx + len * Math.cos(a), y: cy + len * Math.sin(a) };
  };

  const m1 = handEnd(minDeg, 90);
  const s1 = handEnd(secDeg, 104);
  const st = tailEnd(secDeg, 20);

  const pad = (n: number) => String(n).padStart(2, "0");

  const isDay = h >= 6 && h < 18;
  const sectorColor = isDay ? "#ef4444" : "#7c3aed";
  const sectorGlow = isDay ? "#ef444466" : "#7c3aed66";

  const filledPath = sectorPath(cx, cy, r, 0, hourDeg === 0 ? 0.01 : hourDeg);
  const unfilledPath = hourDeg < 359.99
    ? sectorPath(cx, cy, r, hourDeg, 360)
    : null;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width="340" height="340" viewBox="0 0 340 340">
        <defs>
          <radialGradient id="outerRing" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Outer bezel */}
        <circle cx={cx + 10} cy={cy + 10} r={r + 22} fill="url(#outerRing)" stroke="#334155" strokeWidth="2" />

        {/* Unfilled sector — dark */}
        {unfilledPath && (
          <path d={unfilledPath} fill="#111827" />
        )}
        {/* Filled sector — colored */}
        <path d={filledPath} fill={sectorColor} style={{ filter: `drop-shadow(0 0 8px ${sectorGlow})` }} />

        {/* Sector edge line */}
        <line
          x1={cx} y1={cy}
          x2={cx + r * Math.cos((hourDeg - 90) * Math.PI / 180)}
          y2={cy + r * Math.sin((hourDeg - 90) * Math.PI / 180)}
          stroke="white" strokeWidth="2" opacity="0.5"
        />

        {/* Ticks on top */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="white"
              strokeWidth={t.isMajor ? 2.5 : 1}
              strokeLinecap="round"
              opacity={t.isMajor ? 0.85 : 0.3}
            />
            {t.isMajor && (
              <text
                x={t.lx} y={t.ly}
                textAnchor="middle" dominantBaseline="central"
                fontSize="10" fontWeight="700" fill="#94a3b8"
                fontFamily="'Courier New', monospace"
              >
                {t.label}
              </text>
            )}
          </g>
        ))}

        {/* Minute hand */}
        <line x1={cx} y1={cy} x2={m1.x} y2={m1.y}
          stroke="white" strokeWidth="3" strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 3px rgba(255,255,255,0.6))" }} />
        {/* Second hand + tail */}
        <line x1={st.x} y1={st.y} x2={s1.x} y2={s1.y}
          stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 3px #fbbf2488)" }} />

        {/* Center */}
        <circle cx={cx} cy={cy} r="7" fill="#0f172a" stroke="white" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="3" fill="#fbbf24" />

        {/* Hour digit in center */}
        <text
          x={cx} y={cy + 30}
          textAnchor="middle" fontSize="24" fontWeight="900"
          fill="white" fontFamily="'Courier New', monospace" opacity="0.95"
          style={{ filter: `drop-shadow(0 0 6px ${sectorColor})` }}
        >
          {pad(h)}
        </text>
      </svg>

      <div className="font-mono text-2xl font-bold tracking-widest" style={{ color: sectorColor, textShadow: `0 0 12px ${sectorGlow}` }}>
        {pad(h)}:{pad(m)}:{pad(s)}
      </div>

      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sectorColor, boxShadow: `0 0 6px ${sectorColor}` }} />
        <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: sectorColor }}>{isDay ? "DAY" : "NIGHT"}</span>
        <span className="text-[10px] text-slate-500">·</span>
        <span className="text-[10px] text-slate-400 tracking-widest">24H SECTOR</span>
      </div>
    </div>
  );
}

export function Dark() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #0f1f3d 0%, #060b17 100%)" }}>
      <div className="flex flex-col items-center gap-3 px-10 py-8 rounded-3xl"
        style={{ background: "rgba(15,23,42,0.9)", border: "1px solid #1e3a5f", boxShadow: "0 0 40px #1e3a5f55, 0 20px 60px #00000088" }}>
        <p className="text-[9px] font-bold tracking-[0.3em] text-slate-500 uppercase mb-1">24-Hour Sector Clock</p>
        <Clock24Dark now={now} />
        <p className="text-[9px] text-slate-600 tracking-widest mt-1">Red = day · Purple = night</p>
      </div>
    </div>
  );
}
