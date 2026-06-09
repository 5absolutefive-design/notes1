const FONTS = [
  "Inter", "Arial", "Arial Black", "Georgia", "Times New Roman",
  "Verdana", "Trebuchet MS", "Courier New", "Comic Sans MS",
  "Roboto", "Lato", "Poppins", "Nunito", "Merriweather", "Playfair Display",
];

const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 48, 72];

import { useState } from "react";

export function DarkLuxuryCard() {
  const [fontSize, setFontSize] = useState(16);
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [search, setSearch] = useState("");

  const filtered = FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "#0f0f13" }}>
      <div style={{
        width: 320,
        borderRadius: 18,
        background: "linear-gradient(160deg, #1c1c24 0%, #16161e 100%)",
        border: "1px solid #2a2a36",
        boxShadow: "0 0 0 1px #1e1e28, 0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(168,120,255,0.04)",
        padding: "18px 20px",
        color: "#e8e3f5",
        fontFamily: "'Inter', sans-serif",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "#a78bfa" }}>Font Studio</div>
            <div style={{ fontSize: 9, color: "#6b6880", marginTop: 2 }}>Select text → click to apply</div>
          </div>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "linear-gradient(135deg, #a78bfa22, #7c3aed22)",
            border: "1px solid #a78bfa44",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 800, color: "#a78bfa",
          }}>Aa</div>
        </div>

        <div style={{ height: 1, background: "linear-gradient(90deg, #a78bfa33, transparent)", marginBottom: 14 }} />

        {/* Size */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b6880" }}>Size</span>
            <div style={{ display: "flex", borderRadius: 7, overflow: "hidden", border: "1px solid #2a2a36" }}>
              {(["all", "selected"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  style={{
                    padding: "3px 10px", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer",
                    background: mode === m ? "linear-gradient(135deg, #7c3aed, #a78bfa)" : "transparent",
                    color: mode === m ? "#fff" : "#6b6880",
                    textTransform: "capitalize", transition: "all 0.15s",
                  }}>{m}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <button onClick={() => setFontSize(s => Math.max(8, s - 2))}
              style={{
                width: 28, height: 28, borderRadius: 8, border: "1px solid #2a2a36",
                background: "#1e1e28", color: "#a78bfa", fontSize: 16, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.12s",
              }}>−</button>
            <span style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 700, color: "#e8e3f5" }}>{fontSize}px</span>
            <button onClick={() => setFontSize(s => Math.min(96, s + 2))}
              style={{
                width: 28, height: 28, borderRadius: 8, border: "1px solid #2a2a36",
                background: "#1e1e28", color: "#a78bfa", fontSize: 16, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>+</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {SIZES.map(s => (
              <button key={s} onClick={() => setFontSize(s)}
                style={{
                  height: 22, padding: "0 7px", fontSize: 10, fontWeight: 600, borderRadius: 5,
                  border: fontSize === s ? "1px solid #a78bfa" : "1px solid #2a2a36",
                  background: fontSize === s ? "#a78bfa18" : "#1a1a22",
                  color: fontSize === s ? "#a78bfa" : "#55526a",
                  cursor: "pointer", transition: "all 0.12s",
                }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: "#1e1e28", margin: "10px 0" }} />

        {/* Family */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#6b6880", marginBottom: 8 }}>Family</div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search font..."
            style={{
              width: "100%", height: 30, padding: "0 10px", borderRadius: 8, fontSize: 11,
              border: "1px solid #2a2a36", background: "#13131a", color: "#c5bfdd",
              outline: "none", boxSizing: "border-box",
            }}
          />
          <div style={{ maxHeight: 190, overflowY: "auto", marginTop: 6, display: "flex", flexDirection: "column", gap: 1 }}>
            {filtered.map(f => {
              const sel = selectedFont === f;
              return (
                <button key={f} onClick={() => setSelectedFont(f)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 8,
                    border: sel ? "1px solid #a78bfa55" : "1px solid transparent",
                    background: sel ? "#a78bfa14" : "transparent",
                    cursor: "pointer", textAlign: "left", transition: "all 0.12s",
                  }}>
                  <span style={{ fontSize: 10, width: 80, flexShrink: 0, color: sel ? "#a78bfa" : "#55526a", fontWeight: sel ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
                  <span style={{ fontSize: 14, fontFamily: f, color: sel ? "#e8e3f5" : "#7a7590", flex: 1 }}>Abc 123</span>
                  {sel && <span style={{ color: "#a78bfa", fontSize: 11, fontWeight: 700 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
