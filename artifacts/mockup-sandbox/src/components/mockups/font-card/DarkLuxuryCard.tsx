import { useState } from "react";

const FONTS = [
  "Inter", "Arial", "Georgia", "Times New Roman", "Verdana",
  "Trebuchet MS", "Courier New", "Roboto", "Lato", "Poppins",
  "Nunito", "Merriweather", "Playfair Display", "Comic Sans MS",
];

const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 48, 72];

// Design B — Command Palette style
// Structure: Search box dominant at top, font list looks like a command list with keyboard shortcut hints
export function DarkLuxuryCard() {
  const [fontSize, setFontSize] = useState(16);
  const [selectedFont, setSelectedFont] = useState("Inter");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [search, setSearch] = useState("");
  const [hoveredFont, setHoveredFont] = useState<string | null>(null);

  const filtered = FONTS.filter(f => f.toLowerCase().includes(search.toLowerCase()));
  const previewFont = hoveredFont || selectedFont;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#111", fontFamily: "'Courier New', monospace",
    }}>
      <div style={{
        width: 258,
        background: "#0d0d0d",
        border: "1px solid #2a2a2a",
        borderRadius: 6,
        overflow: "hidden",
        boxShadow: "0 0 0 1px #1a1a1a, 0 16px 40px rgba(0,0,0,0.8)",
      }}>
        {/* Top bar */}
        <div style={{ padding: "8px 10px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#333", display: "inline-block" }} />
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#333", display: "inline-block" }} />
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#333", display: "inline-block" }} />
          <span style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#444", letterSpacing: "0.08em" }}>font-selector</span>
        </div>

        {/* Live preview bar */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #1f1f1f", background: "#080808" }}>
          <div style={{ fontSize: 8, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>› preview</div>
          <div style={{ fontFamily: previewFont, fontSize, color: "#e8e8e8", lineHeight: 1.2, minHeight: 28, transition: "all 0.12s" }}>
            Abc 123
          </div>
          <div style={{ marginTop: 6, fontSize: 8, color: "#3a3a3a", fontFamily: "monospace" }}>
            font: <span style={{ color: "#888" }}>{previewFont}</span>  size: <span style={{ color: "#888" }}>{fontSize}px</span>
          </div>
        </div>

        {/* Size row */}
        <div style={{ padding: "6px 10px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 8, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase", flexShrink: 0 }}>size</span>
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: "auto" }}>
            <button onClick={() => setFontSize(s => Math.max(8, s - 2))}
              style={{ width: 18, height: 18, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 3, color: "#666", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
            <span style={{ fontSize: 10, color: "#aaa", minWidth: 30, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{fontSize}</span>
            <button onClick={() => setFontSize(s => Math.min(96, s + 2))}
              style={{ width: 18, height: 18, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 3, color: "#666", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
          </div>
        </div>
        <div style={{ padding: "4px 10px 6px", borderBottom: "1px solid #1f1f1f", display: "flex", flexWrap: "wrap", gap: 3 }}>
          {SIZES.map(s => (
            <button key={s} onClick={() => setFontSize(s)}
              style={{
                height: 18, padding: "0 5px", fontSize: 9,
                border: fontSize === s ? "1px solid #666" : "1px solid #222",
                background: fontSize === s ? "#222" : "transparent",
                color: fontSize === s ? "#ccc" : "#444",
                borderRadius: 2, cursor: "pointer", fontFamily: "monospace",
              }}>{s}</button>
          ))}
        </div>

        {/* Mode + search */}
        <div style={{ padding: "6px 10px", borderBottom: "1px solid #1f1f1f", display: "flex", gap: 4 }}>
          {(["all", "selected"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{
                padding: "2px 7px", fontSize: 8, fontWeight: 700, letterSpacing: "0.08em",
                border: "1px solid", borderColor: mode === m ? "#aaa" : "#222",
                background: mode === m ? "#222" : "transparent",
                color: mode === m ? "#ccc" : "#444",
                borderRadius: 2, cursor: "pointer", textTransform: "uppercase",
              }}>{m}</button>
          ))}
        </div>
        <div style={{ padding: "6px 10px", borderBottom: "1px solid #1f1f1f" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#111", border: "1px solid #2a2a2a", borderRadius: 3, padding: "4px 8px" }}>
            <span style={{ fontSize: 10, color: "#333" }}>›</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="search font..."
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontSize: 11, color: "#ccc", fontFamily: "'Courier New', monospace",
              }} />
          </div>
        </div>

        {/* Font command list */}
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {filtered.map(f => {
            const sel = selectedFont === f;
            const hov = hoveredFont === f;
            return (
              <button key={f}
                onClick={() => setSelectedFont(f)}
                onMouseEnter={() => setHoveredFont(f)}
                onMouseLeave={() => setHoveredFont(null)}
                style={{
                  display: "flex", alignItems: "center", width: "100%", padding: "5px 10px",
                  background: sel ? "#1c1c1c" : hov ? "#141414" : "transparent",
                  border: "none", borderBottom: "1px solid #141414", cursor: "pointer", textAlign: "left",
                }}>
                <span style={{ fontSize: 8, color: sel ? "#888" : "#333", width: 16, flexShrink: 0 }}>{sel ? "●" : "○"}</span>
                <span style={{ fontSize: 10, color: sel ? "#ddd" : hov ? "#aaa" : "#555", flex: 1, fontFamily: "'Courier New', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
                <span style={{ fontFamily: f, fontSize: 13, color: sel ? "#fff" : hov ? "#888" : "#2a2a2a" }}>Aa</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
