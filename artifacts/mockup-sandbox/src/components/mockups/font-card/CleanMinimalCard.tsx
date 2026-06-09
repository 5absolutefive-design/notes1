import { useState } from "react";

const FONTS = [
  "Inter", "Arial", "Arial Black", "Georgia", "Times New Roman",
  "Verdana", "Trebuchet MS", "Courier New", "Comic Sans MS",
  "Roboto", "Lato", "Poppins", "Nunito", "Merriweather", "Playfair Display",
];

const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 48, 72];

export function CleanMinimalCard() {
  const [fontSize, setFontSize] = useState(16);
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [search, setSearch] = useState("");

  const filtered = FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "#f7f6f3", fontFamily: "'Inter', sans-serif" }}>
      <div style={{
        width: 320,
        borderRadius: 16,
        background: "#ffffff",
        border: "1px solid #ebebeb",
        boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        padding: "20px",
        color: "#1a1a1a",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.01em" }}>Typography</div>
            <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>Select text → click to apply</div>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#f4f3ff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800, color: "#6366f1",
          }}>Aa</div>
        </div>

        <div style={{ height: 1, background: "#f0f0f0", marginBottom: 14 }} />

        {/* Size */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#aaa" }}>Size</span>
            <div style={{
              display: "flex", borderRadius: 6, overflow: "hidden",
              border: "1px solid #e8e8e8", background: "#f8f8f8",
            }}>
              {(["all", "selected"] as const).map((m, i) => (
                <button key={m} onClick={() => setMode(m)}
                  style={{
                    padding: "3px 10px", fontSize: 10, fontWeight: 600, border: "none", cursor: "pointer",
                    background: mode === m ? "#6366f1" : "transparent",
                    color: mode === m ? "#fff" : "#999",
                    textTransform: "capitalize", transition: "all 0.12s",
                    borderLeft: i > 0 ? "1px solid #e8e8e8" : "none",
                  }}>{m}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <button onClick={() => setFontSize(s => Math.max(8, s - 2))}
              style={{
                width: 28, height: 28, borderRadius: 7, border: "1px solid #e8e8e8",
                background: "#fafafa", color: "#555", fontSize: 16, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.12s",
              }}>−</button>
            <span style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{fontSize}px</span>
            <button onClick={() => setFontSize(s => Math.min(96, s + 2))}
              style={{
                width: 28, height: 28, borderRadius: 7, border: "1px solid #e8e8e8",
                background: "#fafafa", color: "#555", fontSize: 16, fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>+</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {SIZES.map(s => (
              <button key={s} onClick={() => setFontSize(s)}
                style={{
                  height: 22, padding: "0 7px", fontSize: 10, fontWeight: 500, borderRadius: 5,
                  border: fontSize === s ? "1.5px solid #6366f1" : "1px solid #e8e8e8",
                  background: fontSize === s ? "#f4f3ff" : "#fff",
                  color: fontSize === s ? "#6366f1" : "#888",
                  cursor: "pointer", transition: "all 0.1s",
                }}>{s}</button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: "#f0f0f0", margin: "10px 0" }} />

        {/* Family */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#aaa", marginBottom: 8 }}>Family</div>
          <div style={{ position: "relative" }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search font..."
              style={{
                width: "100%", height: 30, padding: "0 10px 0 28px", borderRadius: 7, fontSize: 11,
                border: "1px solid #e8e8e8", background: "#fafafa", color: "#333",
                outline: "none", boxSizing: "border-box", transition: "border-color 0.12s",
              }}
            />
            <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#ccc", pointerEvents: "none" }}>⌕</span>
          </div>
          <div style={{ maxHeight: 190, overflowY: "auto", marginTop: 6, display: "flex", flexDirection: "column", gap: 1 }}>
            {filtered.map(f => {
              const sel = selectedFont === f;
              return (
                <button key={f} onClick={() => setSelectedFont(f)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "6px 8px", borderRadius: 7,
                    border: "none",
                    background: sel ? "#f4f3ff" : "transparent",
                    cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                  }}>
                  <span style={{ fontSize: 10, width: 80, flexShrink: 0, color: sel ? "#6366f1" : "#bbb", fontWeight: sel ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
                  <span style={{ fontSize: 14, fontFamily: f, color: sel ? "#1a1a1a" : "#555", flex: 1 }}>Abc 123</span>
                  {sel && <span style={{ color: "#6366f1", fontSize: 11, fontWeight: 700, marginLeft: "auto" }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
