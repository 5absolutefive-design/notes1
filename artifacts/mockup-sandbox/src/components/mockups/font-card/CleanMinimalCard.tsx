import { useState } from "react";

const FONTS = [
  "Inter", "Arial", "Georgia", "Times New Roman", "Verdana",
  "Trebuchet MS", "Courier New", "Roboto", "Lato", "Poppins",
  "Nunito", "Merriweather", "Playfair Display", "Comic Sans MS",
];

const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 48, 72];

// Design C — Figma-style tool panel (compact, no background, dense)
// Structure: Font family grid at top (2-column), size stepper in toolbar style at bottom
export function CleanMinimalCard() {
  const [fontSize, setFontSize] = useState(16);
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [search, setSearch] = useState("");

  const filtered = FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#e8e8e8", fontFamily: "Inter, system-ui, sans-serif",
    }}>
      <div style={{
        width: 258,
        background: "#fff",
        borderRadius: 10,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 6px 20px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}>
        {/* Toolbar header */}
        <div style={{
          padding: "10px 12px 8px",
          borderBottom: "1px solid #efefef",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 24, height: 24, borderRadius: 5, background: "#f4f4f4", border: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#000" }}>T</div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#000", letterSpacing: "-0.01em" }}>Typography</span>
          </div>
          <span style={{ fontSize: 9, color: "#bbb" }}>select text → apply</span>
        </div>

        {/* Size stepper — toolbar style */}
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #efefef", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: "#bbb", letterSpacing: "0.06em", textTransform: "uppercase", width: 28 }}>Sz</span>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#f7f7f7", borderRadius: 6, border: "1px solid #e8e8e8", overflow: "hidden" }}>
            <button onClick={() => setFontSize(s => Math.max(8, s - 2))}
              style={{ width: 26, height: 26, background: "transparent", border: "none", cursor: "pointer", fontSize: 14, color: "#888", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>−</button>
            <span style={{ flex: 1, textAlign: "center", fontSize: 12, fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{fontSize}</span>
            <button onClick={() => setFontSize(s => Math.min(96, s + 2))}
              style={{ width: 26, height: 26, background: "transparent", border: "none", cursor: "pointer", fontSize: 14, color: "#888", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>+</button>
          </div>
          <div style={{ display: "flex", border: "1px solid #e8e8e8", borderRadius: 5, overflow: "hidden" }}>
            {(["all", "selected"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{
                  padding: "3px 7px", fontSize: 9, fontWeight: 600, border: "none", cursor: "pointer",
                  background: mode === m ? "#c2c2c2" : "transparent",
                  color: mode === m ? "#333" : "#aaa",
                  textTransform: "capitalize", letterSpacing: "0.02em",
                }}>{m}</button>
            ))}
          </div>
        </div>

        {/* Quick size pills */}
        <div style={{ padding: "5px 12px", borderBottom: "1px solid #efefef", display: "flex", flexWrap: "wrap", gap: 3 }}>
          {SIZES.map(s => (
            <button key={s} onClick={() => setFontSize(s)}
              style={{
                height: 18, padding: "0 5px", fontSize: 9, fontWeight: 500,
                borderRadius: 4, border: "none",
                background: fontSize === s ? "#c2c2c2" : "#f2f2f2",
                color: fontSize === s ? "#333" : "#888",
                cursor: "pointer", transition: "all 0.1s",
              }}>{s}</button>
          ))}
        </div>

        {/* Search */}
        <div style={{ padding: "6px 12px", borderBottom: "1px solid #efefef" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter fonts..."
            style={{
              width: "100%", height: 26, padding: "0 8px", fontSize: 11, borderRadius: 5,
              border: "1px solid #e8e8e8", background: "#fafafa", color: "#222",
              outline: "none", boxSizing: "border-box",
            }} />
        </div>

        {/* Font list — 2 columns grid */}
        <div style={{ maxHeight: 248, overflowY: "auto", padding: "4px 8px 8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            {filtered.map(f => {
              const sel = selectedFont === f;
              return (
                <button key={f} onClick={() => setSelectedFont(f)}
                  style={{
                    padding: "7px 8px", borderRadius: 7,
                    border: sel ? "1.5px solid #c2c2c2" : "1.5px solid transparent",
                    background: sel ? "#c2c2c2" : "#f7f7f7",
                    cursor: "pointer", textAlign: "left", transition: "all 0.1s",
                    display: "flex", flexDirection: "column", gap: 2,
                  }}>
                  <span style={{ fontFamily: f, fontSize: 16, color: sel ? "#222" : "#111", lineHeight: 1, display: "block" }}>Ag</span>
                  <span style={{ fontSize: 8, color: sel ? "#555" : "#bbb", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{f}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom status bar */}
        <div style={{ padding: "5px 12px", borderTop: "1px solid #efefef", background: "#fafafa", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 9, color: "#ccc" }}>{selectedFont} · {fontSize}px</span>
          <button style={{ height: 20, padding: "0 8px", fontSize: 9, fontWeight: 700, background: "#111", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", letterSpacing: "0.04em" }}>Apply</button>
        </div>
      </div>
    </div>
  );
}
