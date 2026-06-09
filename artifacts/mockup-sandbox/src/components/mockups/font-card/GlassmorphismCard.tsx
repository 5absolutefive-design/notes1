const FONTS = [
  "Inter", "Arial", "Arial Black", "Georgia", "Times New Roman",
  "Verdana", "Trebuchet MS", "Courier New", "Comic Sans MS",
  "Roboto", "Lato", "Poppins", "Nunito", "Merriweather", "Playfair Display",
];

const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 48, 72];

import { useState } from "react";

export function GlassmorphismCard() {
  const [fontSize, setFontSize] = useState(16);
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [search, setSearch] = useState("");

  const filtered = FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f64f59 100%)",
      }}>
      <div
        style={{
          width: 320,
          borderRadius: 20,
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.3)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.4)",
          padding: "20px",
          color: "#fff",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7 }}>Font</div>
            <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>Select text → click to apply</div>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "rgba(255,255,255,0.2)",
            border: "1px solid rgba(255,255,255,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 800,
          }}>Aa</div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.15)", marginBottom: 14 }} />

        {/* Size section */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6 }}>Size</span>
            <div style={{
              display: "flex", borderRadius: 8, overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.25)",
            }}>
              {(["all", "selected"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  style={{
                    padding: "3px 10px", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer",
                    background: mode === m ? "rgba(255,255,255,0.3)" : "transparent",
                    color: mode === m ? "#fff" : "rgba(255,255,255,0.55)",
                    textTransform: "capitalize",
                    transition: "background 0.15s",
                  }}>{m}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <button onClick={() => setFontSize(s => Math.max(8, s - 2))}
              style={{
                width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 16, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>−</button>
            <span style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 700 }}>{fontSize}px</span>
            <button onClick={() => setFontSize(s => Math.min(96, s + 2))}
              style={{
                width: 28, height: 28, borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 16, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>+</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {SIZES.map(s => (
              <button key={s} onClick={() => setFontSize(s)}
                style={{
                  height: 24, padding: "0 8px", fontSize: 10, fontWeight: 600, borderRadius: 6,
                  border: fontSize === s ? "1.5px solid rgba(255,255,255,0.9)" : "1px solid rgba(255,255,255,0.25)",
                  background: fontSize === s ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.08)",
                  color: fontSize === s ? "#fff" : "rgba(255,255,255,0.65)",
                  cursor: "pointer", transition: "all 0.12s",
                }}>{s}</button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.15)", margin: "12px 0" }} />

        {/* Family section */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6, marginBottom: 8 }}>Family</div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search font..."
            style={{
              width: "100%", height: 30, padding: "0 10px", borderRadius: 8, fontSize: 11,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.12)", color: "#fff",
              outline: "none", boxSizing: "border-box",
            }}
          />
          <div style={{ maxHeight: 180, overflowY: "auto", marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
            {filtered.map(f => {
              const sel = selectedFont === f;
              return (
                <button key={f} onClick={() => setSelectedFont(f)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", borderRadius: 9,
                    border: sel ? "1px solid rgba(255,255,255,0.45)" : "1px solid transparent",
                    background: sel ? "rgba(255,255,255,0.2)" : "transparent",
                    cursor: "pointer", textAlign: "left", transition: "all 0.12s",
                  }}>
                  <span style={{ fontSize: 10, width: 80, flexShrink: 0, color: sel ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)", fontWeight: sel ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
                  <span style={{ fontSize: 14, fontFamily: f, color: sel ? "#fff" : "rgba(255,255,255,0.8)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Abc 123</span>
                  {sel && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
