import { useEffect, useState } from "react";

function Clock24Dark({ now }: { now: Date }) {
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  const secDeg = s * 6;
  const minDeg = m * 6 + s * 0.1;
  // 24-hour: full rotation in 24h → each hour = 15°
  const hourDeg = h * 15 + m * 0.25 + s * (0.25 / 60);

  const cx = 160;
  const cy = 160;
  const r = 138;

  const ticks = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 15 - 90) * (Math.PI / 180);
    const isMajor = i % 6 === 0;
    const isMid = i % 3 === 0 && !isMajor;
    const inner = r - (isMajor ? 20 : isMid ? 13 : 7);
    return {
      x1: cx + inner * Math.cos(angle),
      y1: cy + inner * Math.sin(angle),
      x2: cx + r * Math.cos(angle),
      y2: cy + r * Math.sin(angle),
      isMajor,
      isMid,
      label: i === 0 ? "0" : String(i),
      lx: cx + (r - 32) * Math.cos(angle),
      ly: cy + (r - 32) * Math.sin(angle),
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

  const h1 = handEnd(hourDeg, 68);
  const m1 = handEnd(minDeg, 98);
  const s1 = handEnd(secDeg, 112);
  const st = tailEnd(secDeg, 22);

  const pad = (n: number) => String(n).padStart(2, "0");

  // Night/day indicator — which half of the 24h face the hour hand is on
  const isDay = h >= 6 && h < 18;
  const phase = isDay ? "DAY" : "NIGHT";
  const phaseColor = isDay ? "#fbbf24" : "#818cf8";

  return (
    <div className="flex flex-col items-center gap-5">
      <svg width="320" height="320" viewBox="0 0 320 320">
        <defs>
          <radialGradient id="faceGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
          <radialGradient id="glowH" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={r + 12} fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
        {/* Face */}
        <circle cx={cx} cy={cy} r={r} fill="url(#faceGrad)" />
        {/* Subtle inner ring */}
        <circle cx={cx} cy={cy} r={r - 6} fill="none" stroke="#1e3a5f" strokeWidth="0.5" />

        {/* Day/night halves — subtle arc fills */}
        <path
          d={`M ${cx} ${cy - r + 6} A ${r - 6} ${r - 6} 0 0 1 ${cx} ${cy + r - 6}`}
          fill="#fbbf2408"
        />
        <path
          d={`M ${cx} ${cy + r - 6} A ${r - 6} ${r - 6} 0 0 1 ${cx} ${cy - r + 6}`}
          fill="#818cf808"
        />

        {/* Ticks */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.isMajor ? "#e2e8f0" : t.isMid ? "#64748b" : "#334155"}
              strokeWidth={t.isMajor ? 2.5 : t.isMid ? 1.5 : 1}
              strokeLinecap="round"
            />
            {t.isMajor && (
              <text
                x={t.lx} y={t.ly}
                textAnchor="middle" dominantBaseline="central"
                fontSize="11" fontWeight="700" fill="#94a3b8"
                fontFamily="'Courier New', monospace"
              >
                {t.label}
              </text>
            )}
          </g>
        ))}

        {/* Glow under hour hand */}
        <circle cx={cx} cy={cy} r="60" fill="url(#glowH)" />

        {/* Hour hand */}
        <line x1={cx} y1={cy} x2={h1.x} y2={h1.y}
          stroke="#60a5fa" strokeWidth="5" strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 4px #60a5fa88)" }} />
        {/* Minute hand */}
        <line x1={cx} y1={cy} x2={m1.x} y2={m1.y}
          stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
        {/* Second hand + tail */}
        <line x1={st.x} y1={st.y} x2={s1.x} y2={s1.y}
          stroke="#f97316" strokeWidth="1.5" strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 3px #f9731688)" }} />
        {/* Center */}
        <circle cx={cx} cy={cy} r="6" fill="#1e293b" stroke="#60a5fa" strokeWidth="2" />
        <circle cx={cx} cy={cy} r="2" fill="#f97316" />
      </svg>

      {/* Digital readout */}
      <div className="font-mono text-3xl font-bold tracking-widest" style={{ color: "#60a5fa", textShadow: "0 0 12px #60a5fa66" }}>
        {pad(h)}:{pad(m)}:{pad(s)}
      </div>

      {/* Phase badge */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: phaseColor, boxShadow: `0 0 6px ${phaseColor}` }} />
        <span className="text-[10px] font-bold tracking-[0.25em]" style={{ color: phaseColor }}>{phase}</span>
        <span className="text-[10px] text-slate-500 tracking-widest">·</span>
        <span className="text-[10px] text-slate-400 tracking-widest">24H MODE</span>
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at 50% 30%, #0f1f3d 0%, #060b17 100%)" }}>
      <div className="flex flex-col items-center gap-3 px-12 py-10 rounded-3xl"
        style={{ background: "rgba(15,23,42,0.85)", border: "1px solid #1e3a5f", boxShadow: "0 0 40px #1e3a5f66, 0 20px 60px #00000088" }}>
        <p className="text-[9px] font-bold tracking-[0.3em] text-slate-500 uppercase mb-1">24-Hour Analog Clock</p>
        <Clock24Dark now={now} />
        <p className="text-[9px] text-slate-600 mt-1 tracking-widest">Hour hand completes 1 lap every 24 hours</p>
      </div>
    </div>
  );
}
