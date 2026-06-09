import { useState } from "react";

const FONTS = [
  "Inter", "Arial", "Georgia", "Times New Roman", "Verdana",
  "Trebuchet MS", "Courier New", "Roboto", "Lato", "Poppins",
  "Nunito", "Merriweather", "Playfair Display", "Comic Sans MS",
];

const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 48, 72];

// Design A — Editorial Specimen
// Structure: Big live font specimen at top, size row, then font list rows
export function GlassmorphismCard() {
  const [fontSize, setFontSize] = useState(28);
  const [selectedFont, setSelectedFont] = useState("Playfair Display");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [search, setSearch] = useState("");

  const filtered = FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f5f5f5", fontFamily: "Inter, sans-serif",
    }}>
      <div style={{
        width: 258,
        background: "#fff",
        border: "none",
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)",
      }}>
        {/* Specimen hero */}
        <div style={{
          padding: "18px 16px 14px",
          borderBottom: "none",
          background: "#c2c2c2",
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", marginBottom: 10 }}>
            Specimen · {selectedFont}
          </div>
          <div style={{
            fontFamily: selectedFont, fontSize, lineHeight: 1.15,
            color: "#fff", wordBreak: "break-word", minHeight: 40,
            transition: "font-size 0.15s, font-family 0.1s",
            textShadow: "0 1px 8px rgba(0,0,0,0.18)",
          }}>
            Abc 123
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => setFontSize(s => Math.max(8, s - 2))}
              style={{ width: 22, height: 22, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 2, color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontVariantNumeric: "tabular-nums", minWidth: 36, textAlign: "center" }}>{fontSize}px</span>
            <button onClick={() => setFontSize(s => Math.min(96, s + 2))}
              style={{ width: 22, height: 22, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 2, color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
        </div>

        {/* Size presets */}
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #e8e8e8", display: "flex", flexWrap: "wrap", gap: 3 }}>
          {SIZES.map(s => (
            <button key={s} onClick={() => setFontSize(s)}
              style={{
                height: 20, padding: "0 6px", fontSize: 9, fontWeight: 600, borderRadius: 2,
                border: fontSize === s ? "1.5px solid #000" : "1px solid #ddd",
                background: fontSize === s ? "#000" : "#fafafa",
                color: fontSize === s ? "#fff" : "#666",
                cursor: "pointer", transition: "all 0.1s",
              }}>{s}</button>
          ))}
        </div>

        {/* Mode toggle */}
        <div style={{ padding: "7px 12px", borderBottom: "1px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#999" }}>Apply to</span>
          <div style={{ display: "flex", border: "1px solid #000", borderRadius: 2, overflow: "hidden" }}>
            {(["all", "selected"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{
                  padding: "2px 8px", fontSize: 9, fontWeight: 700, border: "none", cursor: "pointer",
                  background: mode === m ? "#000" : "#fff",
                  color: mode === m ? "#fff" : "#000",
                  textTransform: "capitalize", letterSpacing: "0.05em",
                }}>{m}</button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "7px 12px", borderBottom: "1px solid #e8e8e8" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search typeface..."
            style={{
              width: "100%", height: 26, padding: "0 8px", fontSize: 11,
              border: "1px solid #ccc", borderRadius: 2, background: "#fafafa",
              outline: "none", boxSizing: "border-box", color: "#222",
            }} />
        </div>

        {/* Font list — editorial row style */}
        <div style={{ maxHeight: 230, overflowY: "auto" }}>
          {filtered.map((f, i) => {
            const sel = selectedFont === f;
            return (
              <button key={f} onClick={() => setSelectedFont(f)}
                style={{
                  display: "flex", alignItems: "center", width: "100%",
                  padding: "7px 12px",
                  borderBottom: i < filtered.length - 1 ? "1px solid #f0f0f0" : "none",
                  background: sel ? "#000" : "transparent",
                  border: "none", cursor: "pointer", textAlign: "left",
                  transition: "background 0.1s",
                }}>
                <span style={{ fontSize: 9, color: sel ? "#666" : "#bbb", width: 16, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{String(FONTS.indexOf(f) + 1).padStart(2, "0")}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: sel ? "#888" : "#aaa", width: 76, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
                <span style={{ fontFamily: f, fontSize: 15, color: sel ? "#fff" : "#222", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Abc</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
