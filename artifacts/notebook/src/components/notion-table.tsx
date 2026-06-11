import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Hash, Type, CheckSquare, Calendar, Tag, X, Check, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────
type ColType = "text" | "number" | "select" | "checkbox" | "date" | "time" | "id";
type NumFmt = "plain" | "currency" | "percent";

interface SelectOpt { id: string; label: string; color: keyof typeof SELECT_COLORS; }
interface Column { id: string; name: string; type: ColType; width: number; options?: SelectOpt[]; format?: NumFmt; }
interface RowData { id: string; height?: number; [colId: string]: any; }
interface NTableData { version: 2; columns: Column[]; rows: RowData[]; }

// ── Colors ─────────────────────────────────────────────────────────
const SELECT_COLORS = {
  gray:   { bg: "#f1f1ef", text: "#787774", border: "#c0bfbc" },
  brown:  { bg: "#f4eeee", text: "#9f6b53", border: "#dab8a8" },
  orange: { bg: "#fbecdd", text: "#d9730d", border: "#f5c49a" },
  yellow: { bg: "#fbf3db", text: "#cb912f", border: "#f0d699" },
  green:  { bg: "#edf3ec", text: "#448361", border: "#a8d5b3" },
  blue:   { bg: "#e7f3f8", text: "#337ea9", border: "#9dcce5" },
  purple: { bg: "#f6f3f9", text: "#9065b0", border: "#c9b8e5" },
  pink:   { bg: "#faf1f5", text: "#c14c8a", border: "#f0b8d6" },
  red:    { bg: "#fdebec", text: "#d44c47", border: "#f5b0ae" },
} as const;

const COLOR_NAMES = Object.keys(SELECT_COLORS) as Array<keyof typeof SELECT_COLORS>;

const COL_TYPE_META: Record<ColType, { label: string; icon: React.ReactNode }> = {
  text:     { label: "Text",     icon: <Type style={{ width: 12, height: 12 }} /> },
  number:   { label: "Number",   icon: <Hash style={{ width: 12, height: 12 }} /> },
  select:   { label: "Select",   icon: <Tag style={{ width: 12, height: 12 }} /> },
  checkbox: { label: "Checkbox", icon: <CheckSquare style={{ width: 12, height: 12 }} /> },
  date:     { label: "Date",     icon: <Calendar style={{ width: 12, height: 12 }} /> },
  time:     { label: "Time",     icon: <span style={{ fontSize: 11, fontWeight: 700 }}>⏱</span> },
  id:       { label: "ID",       icon: <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: -0.5 }}>ID</span> },
};

const mBtn: React.CSSProperties = {
  width: "100%", display: "flex", alignItems: "center", gap: 8,
  padding: "6px 12px", border: "none", background: "none",
  cursor: "pointer", fontSize: 12, color: "#374151", textAlign: "left",
};

// ── Defaults ───────────────────────────────────────────────────────
function makeDefaultData(): NTableData {
  return {
    version: 2,
    columns: [
      { id: "c1", name: "Name", type: "text", width: 200 },
      { id: "c2", name: "Status", type: "select", width: 150, options: [
        { id: "o1", label: "To Do", color: "gray" },
        { id: "o2", label: "In Progress", color: "blue" },
        { id: "o3", label: "Done", color: "green" },
      ]},
      { id: "c3", name: "Priority", type: "select", width: 130, options: [
        { id: "o4", label: "Low", color: "gray" },
        { id: "o5", label: "Medium", color: "yellow" },
        { id: "o6", label: "High", color: "red" },
      ]},
      { id: "c4", name: "Value", type: "number", format: "currency", width: 140 },
      { id: "c5", name: "Done", type: "checkbox", width: 90 },
      { id: "c6", name: "Date", type: "date", width: 160 },
    ],
    rows: Array.from({ length: 5 }, (_, i) => ({ id: `r${i + 1}` })),
  };
}

function parseData(content: string): NTableData {
  try {
    const d = JSON.parse(content);
    if (d.version === 2 && Array.isArray(d.columns) && Array.isArray(d.rows)) return d;
  } catch { /* ignore */ }
  return makeDefaultData();
}

function fmtNumber(val: any, fmt?: NumFmt): string {
  const n = parseFloat(val);
  if (isNaN(n)) return "";
  if (fmt === "currency") return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  if (fmt === "percent") return `${n}%`;
  return String(n);
}

function SelectBadge({ label, color }: { label: string; color: keyof typeof SELECT_COLORS }) {
  const c = SELECT_COLORS[color] ?? SELECT_COLORS.gray;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 8px", borderRadius: 12, background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: 11, fontWeight: 500, lineHeight: "18px", whiteSpace: "nowrap", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>
      {label}
    </span>
  );
}

// ── Resize handle components — defined OUTSIDE main component ──────
// Column resize handle (right edge of any cell)
function ColHandle({ onStart }: { onStart: (e: React.MouseEvent) => void }) {
  const [active, setActive] = useState(false);
  return (
    <div
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setActive(true); onStart(e); }}
      style={{
        position: "absolute", right: -4, top: 0, bottom: 0, width: 8,
        cursor: "col-resize", zIndex: 50, userSelect: "none",
        background: active ? "rgba(59,130,246,0.3)" : "transparent",
      }}
    >
      {active && <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "#3b82f6", transform: "translateX(-50%)" }} />}
    </div>
  );
}

// Row resize handle (bottom edge of any cell)
function RowHandle({ onStart }: { onStart: (e: React.MouseEvent) => void }) {
  const [active, setActive] = useState(false);
  return (
    <div
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setActive(true); onStart(e); }}
      style={{
        position: "absolute", bottom: -4, left: 0, right: 0, height: 8,
        cursor: "row-resize", zIndex: 49, userSelect: "none",
        background: active ? "rgba(59,130,246,0.2)" : "transparent",
      }}
    >
      {active && <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, background: "#3b82f6", transform: "translateY(-50%)" }} />}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
export function NotionTable({ content, onChange }: { content: string; onChange: (v: string) => void }) {
  const [data, setData] = useState<NTableData>(() => parseData(content));
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const [colMenu, setColMenu] = useState<{ colId: string; rect: DOMRect } | null>(null);
  const [colMenuName, setColMenuName] = useState("");
  const [selectMenu, setSelectMenu] = useState<{ rowId: string; colId: string; rect: DOMRect } | null>(null);
  const [selectSearch, setSelectSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ colId: string; dir: "asc" | "desc" } | null>(null);
  const [numEditKey, setNumEditKey] = useState<string | null>(null);

  // Resize state — in refs so mousemove closure always has latest values
  const colResize = useRef<{ colId: string; startX: number; startW: number } | null>(null);
  const rowResize = useRef<{ rowId: string; startY: number; startH: number } | null>(null);
  const activeResize = useRef(false);

  const onChangeFn = useRef(onChange);
  onChangeFn.current = onChange;

  const update = useCallback((fn: (d: NTableData) => NTableData) => {
    setData(prev => { const next = fn(prev); onChangeFn.current(JSON.stringify(next)); return next; });
  }, []);

  // ── Start resize helpers (stable refs) ─────────────────────────
  const dataRef = useRef(data);
  dataRef.current = data;

  const startColResize = useCallback((colId: string, e: React.MouseEvent) => {
    const col = dataRef.current.columns.find(c => c.id === colId);
    if (!col) return;
    colResize.current = { colId, startX: e.clientX, startW: col.width };
    rowResize.current = null;
    activeResize.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  }, []);

  const startRowResize = useCallback((rowId: string, e: React.MouseEvent) => {
    const row = dataRef.current.rows.find(r => r.id === rowId);
    if (!row) return;
    rowResize.current = { rowId, startY: e.clientY, startH: row.height ?? 36 };
    colResize.current = null;
    activeResize.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "row-resize";
  }, []);

  // ── Global mouse events ─────────────────────────────────────────
  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (colResize.current) {
        const { colId, startX, startW } = colResize.current;
        const newW = Math.max(50, Math.round(startW + e.clientX - startX));
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          setData(prev => ({ ...prev, columns: prev.columns.map(c => c.id === colId ? { ...c, width: newW } : c) }));
        });
      } else if (rowResize.current) {
        const { rowId, startY, startH } = rowResize.current;
        const newH = Math.max(28, Math.round(startH + e.clientY - startY));
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          setData(prev => ({ ...prev, rows: prev.rows.map(r => r.id === rowId ? { ...r, height: newH } : r) }));
        });
      }
    };
    const onUp = () => {
      cancelAnimationFrame(raf);
      if (colResize.current || rowResize.current) {
        setData(prev => { onChangeFn.current(JSON.stringify(prev)); return prev; });
      }
      colResize.current = null;
      rowResize.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      setTimeout(() => { activeResize.current = false; }, 80);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); cancelAnimationFrame(raf); };
  }, []);

  // ── Close menus on outside click ───────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-ntbl-menu]")) {
        setColMenu(null); setSelectMenu(null); setSelectSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Column/Row actions ─────────────────────────────────────────
  const addColumn = () => {
    const id = `c${Date.now()}`;
    update(d => ({ ...d, columns: [...d.columns, { id, name: "Column", type: "text" as ColType, width: 160 }] }));
  };
  const deleteColumn = (colId: string) => {
    update(d => ({ ...d, columns: d.columns.filter(c => c.id !== colId), rows: d.rows.map(r => { const n = { ...r }; delete n[colId]; return n; }) }));
    setColMenu(null);
  };
  const renameColumn = (colId: string, name: string) => {
    if (name.trim()) update(d => ({ ...d, columns: d.columns.map(c => c.id === colId ? { ...c, name: name.trim() } : c) }));
  };
  const changeColType = (colId: string, type: ColType) => {
    update(d => ({ ...d, columns: d.columns.map(c => c.id === colId ? { ...c, type } : c), rows: d.rows.map(r => ({ ...r, [colId]: type === "checkbox" ? false : undefined })) }));
  };
  const addSelectOpt = (colId: string, label: string, color: keyof typeof SELECT_COLORS): string => {
    const id = `opt_${Date.now()}`;
    update(d => ({ ...d, columns: d.columns.map(c => c.id === colId ? { ...c, options: [...(c.options ?? []), { id, label, color }] } : c) }));
    return id;
  };
  const addRow = () => {
    const id = `r${Date.now()}`;
    const row: RowData = { id };
    const rowCount = data.rows.length + 1;
    data.columns.forEach(c => {
      if (c.type === "checkbox") row[c.id] = false;
      if (c.type === "time") row[c.id] = new Date().toISOString();
      if (c.type === "id") row[c.id] = `ID-${String(rowCount).padStart(3, "0")}`;
    });
    update(d => ({ ...d, rows: [...d.rows, row] }));
  };
  const deleteRow = (rowId: string) => update(d => ({ ...d, rows: d.rows.filter(r => r.id !== rowId) }));
  const setCellVal = (rowId: string, colId: string, val: any) => update(d => ({ ...d, rows: d.rows.map(r => r.id === rowId ? { ...r, [colId]: val } : r) }));

  // ── Sorted rows ────────────────────────────────────────────────
  const displayRows = sortConfig
    ? [...data.rows].sort((a, b) => {
        const cmp = String(a[sortConfig.colId] ?? "").localeCompare(String(b[sortConfig.colId] ?? ""), undefined, { numeric: true });
        return sortConfig.dir === "asc" ? cmp : -cmp;
      })
    : data.rows;

  // ── Footer stats ───────────────────────────────────────────────
  const numCols = data.columns.filter(c => c.type === "number");
  const numStats = numCols.map(col => {
    const vals = data.rows.map(r => parseFloat(r[col.id])).filter(v => !isNaN(v));
    const sum = vals.reduce((a, b) => a + b, 0);
    return { col, sum, avg: vals.length ? sum / vals.length : 0 };
  });

  // ── Select menu state ──────────────────────────────────────────
  const selCol = selectMenu ? data.columns.find(c => c.id === selectMenu.colId) : null;
  const selVal = selectMenu ? data.rows.find(r => r.id === selectMenu.rowId)?.[selectMenu.colId] : null;
  const filtOpts = selCol?.options?.filter(o => o.label.toLowerCase().includes(selectSearch.toLowerCase())) ?? [];
  const nextColor = COLOR_NAMES[(selCol?.options?.length ?? 0) % COLOR_NAMES.length];

  // Shared cell td base style
  const tdBase = (col: Column, row: RowData): React.CSSProperties => ({
    width: col.width, minWidth: col.width, maxWidth: col.width,
    height: row.height ?? 36,
    borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb",
    boxSizing: "border-box", padding: 0, position: "relative",
    overflow: "visible", verticalAlign: "middle",
  });

  const inputBase: React.CSSProperties = {
    width: "100%", height: "100%", border: "none", outline: "none",
    background: "transparent", padding: "0 8px", fontSize: 13,
    color: "#1f2937", fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <div style={{ fontFamily: "Inter, -apple-system, sans-serif", fontSize: 13, height: "100%", display: "flex", flexDirection: "column", background: "white" }}>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #e5e7eb", background: "#fafafa", flexShrink: 0 }}>
        <div>
          {sortConfig && (
            <button onClick={() => setSortConfig(null)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, border: "1px solid #3b82f6", background: "#eff6ff", color: "#3b82f6", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              {data.columns.find(c => c.id === sortConfig.colId)?.name} {sortConfig.dir === "asc" ? "↑" : "↓"} <X style={{ width: 10, height: 10 }} />
            </button>
          )}
        </div>
        <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "white", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <Plus style={{ width: 12, height: 12 }} /> New Row
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ borderCollapse: "collapse", tableLayout: "fixed", borderTop: "2px solid #111827", borderLeft: "1px solid #e5e7eb" }}>
          <thead>
            <tr>
              {/* Number col */}
              <th style={{ width: 36, minWidth: 36, borderRight: "1px solid #e5e7eb", borderBottom: "2px solid #111827", background: "#f9fafb", position: "sticky", top: 0, zIndex: 10 }} />

              {data.columns.map((col) => (
                <th key={col.id} style={{ width: col.width, minWidth: col.width, maxWidth: col.width, height: 36, borderRight: "1px solid #e5e7eb", borderBottom: "2px solid #111827", background: "#f9fafb", padding: 0, position: "sticky", top: 0, zIndex: 10, userSelect: "none", overflow: "visible" }}>
                  <div style={{ display: "flex", alignItems: "center", height: "100%", position: "relative" }}>
                    <button onClick={e => {
                        if (activeResize.current) return;
                        const th = (e.currentTarget as HTMLElement).closest("th")!;
                        setColMenu({ colId: col.id, rect: th.getBoundingClientRect() });
                        setColMenuName(col.name);
                      }}
                      style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", gap: 5, padding: "0 8px", background: colMenu?.colId === col.id ? "#eff6ff" : "none", border: "none", cursor: "pointer", overflow: "hidden", color: "#374151", fontWeight: 600, fontSize: 12 }}>
                      <span style={{ color: "#9ca3af", display: "flex", flexShrink: 0 }}>{COL_TYPE_META[col.type].icon}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{col.name}</span>
                      {sortConfig?.colId === col.id && <span style={{ fontSize: 10, color: "#3b82f6" }}>{sortConfig.dir === "asc" ? "↑" : "↓"}</span>}
                      <ChevronDown style={{ width: 10, height: 10, color: "#9ca3af", flexShrink: 0 }} />
                    </button>
                    {/* Col resize — header only */}
                    <ColHandle onStart={e => startColResize(col.id, e)} />
                  </div>
                </th>
              ))}

              {/* Add column */}
              <th style={{ width: 44, minWidth: 44, borderRight: "1px solid #e5e7eb", borderBottom: "2px solid #111827", background: "#f9fafb", position: "sticky", top: 0, zIndex: 10 }}>
                <button onClick={addColumn} style={{ width: "100%", height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                  onMouseEnter={e => { const t = e.currentTarget as HTMLElement; t.style.background = "#f3f4f6"; t.style.color = "#374151"; }}
                  onMouseLeave={e => { const t = e.currentTarget as HTMLElement; t.style.background = "none"; t.style.color = "#9ca3af"; }}>
                  <Plus style={{ width: 14, height: 14 }} />
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {displayRows.map((row) => {
              const h = row.height ?? 36;
              return (
                <tr key={row.id} onMouseEnter={() => setHoverRow(row.id)} onMouseLeave={() => setHoverRow(null)}>

                  {/* Action cell */}
                  <td style={{ width: 36, minWidth: 36, height: h, borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", padding: 0, position: "relative", background: hoverRow === row.id ? "#fafafa" : "white", overflow: "visible", verticalAlign: "middle" }}>
                    {hoverRow === row.id && !activeResize.current && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: h }}>
                        <button onClick={() => deleteRow(row.id)} title="Delete row"
                          style={{ width: 22, height: 22, border: "none", background: "none", cursor: "pointer", borderRadius: 4, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center" }}
                          onMouseEnter={e => { const t = e.currentTarget as HTMLElement; t.style.background = "#fee2e2"; t.style.color = "#dc2626"; }}
                          onMouseLeave={e => { const t = e.currentTarget as HTMLElement; t.style.background = "none"; t.style.color = "#9ca3af"; }}>
                          <Trash2 style={{ width: 11, height: 11 }} />
                        </button>
                      </div>
                    )}
                    {/* Row resize on action cell */}
                    <RowHandle onStart={e => startRowResize(row.id, e)} />
                  </td>

                  {/* Data cells — inline, no Td wrapper */}
                  {data.columns.map((col) => {
                    const val = row[col.id];

                    if (col.type === "text") {
                      return (
                        <td key={col.id} style={tdBase(col, row)}>
                          <input value={val ?? ""} onChange={e => setCellVal(row.id, col.id, e.target.value)}
                            style={{ ...inputBase, display: "block" }} placeholder="…" />
                          <ColHandle onStart={e => startColResize(col.id, e)} />
                          <RowHandle onStart={e => startRowResize(row.id, e)} />
                        </td>
                      );
                    }

                    if (col.type === "number") {
                      const nid = `${row.id}__${col.id}`;
                      return (
                        <td key={col.id} style={tdBase(col, row)}>
                          {numEditKey === nid ? (
                            <input type="number" autoFocus value={val ?? ""}
                              onChange={e => setCellVal(row.id, col.id, e.target.value)}
                              onBlur={() => setNumEditKey(null)}
                              style={{ ...inputBase, textAlign: "right", display: "block" }} placeholder="0" />
                          ) : (
                            <div onClick={() => { if (!activeResize.current) setNumEditKey(nid); }}
                              style={{ ...inputBase, display: "flex", alignItems: "center", justifyContent: "flex-end", cursor: "text", height: h, color: (val != null && val !== "") ? "#1f2937" : "#d1d5db" }}>
                              {(val != null && val !== "") ? fmtNumber(val, col.format) : "0"}
                            </div>
                          )}
                          <ColHandle onStart={e => startColResize(col.id, e)} />
                          <RowHandle onStart={e => startRowResize(row.id, e)} />
                        </td>
                      );
                    }

                    if (col.type === "checkbox") {
                      return (
                        <td key={col.id} style={{ ...tdBase(col, row), cursor: "pointer" }}
                          onClick={() => { if (!activeResize.current) setCellVal(row.id, col.id, !val); }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: h }}>
                            <div style={{ width: 16, height: 16, borderRadius: 3, border: val ? "2px solid #3b82f6" : "2px solid #d1d5db", background: val ? "#3b82f6" : "white", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                              {val && <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1.5,5 4,7.5 8.5,2.5" /></svg>}
                            </div>
                          </div>
                          <ColHandle onStart={e => startColResize(col.id, e)} />
                          <RowHandle onStart={e => startRowResize(row.id, e)} />
                        </td>
                      );
                    }

                    if (col.type === "date") {
                      return (
                        <td key={col.id} style={tdBase(col, row)}>
                          <input type="date" value={val ?? ""} onChange={e => setCellVal(row.id, col.id, e.target.value)}
                            style={{ ...inputBase, color: val ? "#1f2937" : "#9ca3af", display: "block" }} />
                          <ColHandle onStart={e => startColResize(col.id, e)} />
                          <RowHandle onStart={e => startRowResize(row.id, e)} />
                        </td>
                      );
                    }

                    if (col.type === "select") {
                      const colData = data.columns.find(c => c.id === col.id)!;
                      const selected = colData.options?.find(o => o.id === val);
                      return (
                        <td key={col.id} style={{ ...tdBase(col, row), cursor: "pointer" }}
                          onClick={e => { if (activeResize.current) return; const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setSelectMenu({ rowId: row.id, colId: col.id, rect }); setSelectSearch(""); }}>
                          <div style={{ padding: "0 8px", display: "flex", alignItems: "center", height: h }}>
                            {selected ? <SelectBadge label={selected.label} color={selected.color} /> : <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>}
                          </div>
                          <ColHandle onStart={e => startColResize(col.id, e)} />
                          <RowHandle onStart={e => startRowResize(row.id, e)} />
                        </td>
                      );
                    }

                    if (col.type === "time") {
                      const display = val
                        ? new Date(val).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—";
                      return (
                        <td key={col.id} style={tdBase(col, row)}>
                          <div style={{ padding: "0 8px", display: "flex", alignItems: "center", height: h }}>
                            <span style={{ fontSize: 12, color: val ? "#6b7280" : "#d1d5db", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{display}</span>
                          </div>
                          <ColHandle onStart={e => startColResize(col.id, e)} />
                          <RowHandle onStart={e => startRowResize(row.id, e)} />
                        </td>
                      );
                    }

                    if (col.type === "id") {
                      return (
                        <td key={col.id} style={tdBase(col, row)}>
                          <div style={{ padding: "0 8px", display: "flex", alignItems: "center", height: h }}>
                            {val
                              ? <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 7px", borderRadius: 8, background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", fontSize: 11, fontWeight: 600, fontFamily: "monospace", whiteSpace: "nowrap" }}>{val}</span>
                              : <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>
                            }
                          </div>
                          <ColHandle onStart={e => startColResize(col.id, e)} />
                          <RowHandle onStart={e => startRowResize(row.id, e)} />
                        </td>
                      );
                    }

                    return (
                      <td key={col.id} style={tdBase(col, row)}>
                        <ColHandle onStart={e => startColResize(col.id, e)} />
                        <RowHandle onStart={e => startRowResize(row.id, e)} />
                      </td>
                    );
                  })}

                  {/* Spacer under +col header */}
                  <td style={{ width: 44, minWidth: 44, borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", height: h, overflow: "visible", position: "relative" }}>
                    <RowHandle onStart={e => startRowResize(row.id, e)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Add row */}
        <button onClick={addRow}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px 8px 52px", color: "#9ca3af", fontSize: 12, fontWeight: 500, background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", borderBottom: "1px solid #f3f4f6" }}
          onMouseEnter={e => { const t = e.currentTarget as HTMLElement; t.style.background = "#fafafa"; t.style.color = "#6b7280"; }}
          onMouseLeave={e => { const t = e.currentTarget as HTMLElement; t.style.background = "none"; t.style.color = "#9ca3af"; }}>
          <Plus style={{ width: 13, height: 13 }} /> Add a row
        </button>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: "5px 16px", background: "#f9fafb", display: "flex", gap: 16, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>COUNT <span style={{ color: "#111827" }}>{data.rows.length}</span></span>
        {numStats.map(({ col, sum, avg }) => (
          <span key={col.id} style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "flex", gap: 6 }}>
            <span style={{ color: "#9ca3af" }}>{col.name}</span>
            SUM <span style={{ color: "#111827" }}>{fmtNumber(sum, col.format)}</span>
            <span style={{ color: "#d1d5db" }}>·</span>
            AVG <span style={{ color: "#111827" }}>{fmtNumber(avg, col.format)}</span>
          </span>
        ))}
      </div>

      {/* ── Portals ─────────────────────────────────────────────── */}

      {/* ── Unified Column Settings Card ── */}
      {colMenu && createPortal(
        (() => {
          const col = data.columns.find(c => c.id === colMenu.colId);
          if (!col) return null;
          const cardW = 260;
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const rawLeft = colMenu.rect.left;
          const left = Math.min(rawLeft, vw - cardW - 8);
          const top = Math.min(colMenu.rect.bottom + 4, vh - 340);
          return (
            <div data-ntbl-menu="colmenu"
              style={{ position: "fixed", top, left, zIndex: 9999, background: "white", borderRadius: 14, boxShadow: "0 12px 40px rgba(0,0,0,0.16)", border: "1px solid #e5e7eb", width: cardW, overflow: "hidden" }}>

              {/* Rename section */}
              <div style={{ padding: "12px 12px 10px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Column Name</div>
                <input
                  data-ntbl-menu="colmenu"
                  autoFocus
                  value={colMenuName}
                  onChange={e => setColMenuName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") { renameColumn(col.id, colMenuName); setColMenu(null); }
                    if (e.key === "Escape") setColMenu(null);
                  }}
                  style={{ width: "100%", padding: "6px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#111827", outline: "none", background: "#fafafa", boxSizing: "border-box" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#3b82f6")}
                  onBlur={e => { e.currentTarget.style.borderColor = "#e5e7eb"; renameColumn(col.id, colMenuName); }}
                />
              </div>

              {/* Type picker section */}
              <div style={{ padding: "0 12px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Column Type</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
                  {(Object.entries(COL_TYPE_META) as Array<[ColType, { label: string; icon: React.ReactNode }]>).map(([type, meta]) => {
                    const isActive = col.type === type;
                    return (
                      <button key={type}
                        onClick={() => changeColType(col.id, type)}
                        title={meta.label}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          gap: 4, padding: "8px 4px", borderRadius: 8, border: isActive ? "1.5px solid #3b82f6" : "1.5px solid #e5e7eb",
                          background: isActive ? "#eff6ff" : "#fafafa", cursor: "pointer",
                          transition: "all 0.12s",
                        }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.borderColor = "#d1d5db"; }}}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "#fafafa"; e.currentTarget.style.borderColor = "#e5e7eb"; }}}>
                        <span style={{ color: isActive ? "#3b82f6" : "#6b7280", display: "flex" }}>{meta.icon}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: isActive ? "#3b82f6" : "#6b7280", lineHeight: 1 }}>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div style={{ borderTop: "1px solid #f3f4f6" }} />

              {/* Sort + Delete */}
              <div style={{ padding: "4px 0" }}>
                <button onClick={() => { setSortConfig({ colId: col.id, dir: "asc" }); setColMenu(null); }}
                  style={{ ...mBtn }} onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <ArrowUp style={{ width: 12, height: 12, color: "#6b7280" }} /> Sort A → Z
                  {sortConfig?.colId === col.id && sortConfig.dir === "asc" && <Check style={{ width: 10, height: 10, marginLeft: "auto", color: "#3b82f6" }} />}
                </button>
                <button onClick={() => { setSortConfig({ colId: col.id, dir: "desc" }); setColMenu(null); }}
                  style={{ ...mBtn }} onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <ArrowDown style={{ width: 12, height: 12, color: "#6b7280" }} /> Sort Z → A
                  {sortConfig?.colId === col.id && sortConfig.dir === "desc" && <Check style={{ width: 10, height: 10, marginLeft: "auto", color: "#3b82f6" }} />}
                </button>
                <div style={{ borderTop: "1px solid #f3f4f6", margin: "3px 0" }} />
                <button onClick={() => deleteColumn(col.id)}
                  style={{ ...mBtn, color: "#dc2626" }} onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                  <Trash2 style={{ width: 12, height: 12 }} /> Delete column
                </button>
              </div>
            </div>
          );
        })(),
        document.body
      )}

      {/* Select dropdown */}
      {selectMenu && selCol && createPortal(
        <div data-ntbl-menu="selmenu" style={{ position: "fixed", top: selectMenu.rect.bottom + 4, left: selectMenu.rect.left, zIndex: 9999, background: "white", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb", minWidth: 220, padding: "8px 0 4px", maxHeight: 320, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0 8px 6px" }}>
            <input autoFocus value={selectSearch} onChange={e => setSelectSearch(e.target.value)} placeholder="Search or create option..."
              style={{ width: "100%", padding: "5px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, outline: "none", boxSizing: "border-box" }}
              onKeyDown={e => {
                if (e.key === "Enter" && selectSearch.trim()) {
                  const ex = selCol.options?.find(o => o.label.toLowerCase() === selectSearch.toLowerCase());
                  if (ex) setCellVal(selectMenu.rowId, selectMenu.colId, ex.id);
                  else { const id = addSelectOpt(selectMenu.colId, selectSearch.trim(), nextColor); setTimeout(() => setCellVal(selectMenu.rowId, selectMenu.colId, id), 10); }
                  setSelectMenu(null); setSelectSearch("");
                }
                if (e.key === "Escape") { setSelectMenu(null); setSelectSearch(""); }
              }} />
          </div>
          {selVal && (
            <button onClick={() => { setCellVal(selectMenu.rowId, selectMenu.colId, undefined); setSelectMenu(null); }}
              style={{ ...mBtn, color: "#6b7280", fontSize: 11 }} onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <X style={{ width: 10, height: 10 }} /> Clear
            </button>
          )}
          <div style={{ overflowY: "auto", flex: 1, padding: "0 8px 4px" }}>
            {filtOpts.map(opt => {
              const c = SELECT_COLORS[opt.color] ?? SELECT_COLORS.gray;
              const isSel = selVal === opt.id;
              return (
                <button key={opt.id} onClick={() => { setCellVal(selectMenu.rowId, selectMenu.colId, isSel ? undefined : opt.id); setSelectMenu(null); }}
                  style={{ width: "100%", textAlign: "left", padding: "4px 6px", borderRadius: 6, border: "none", background: isSel ? "#f0f9ff" : "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}
                  onMouseEnter={e => (e.currentTarget.style.background = isSel ? "#e0f2fe" : "#f9fafb")}
                  onMouseLeave={e => (e.currentTarget.style.background = isSel ? "#f0f9ff" : "none")}>
                  <span style={{ display: "inline-flex", padding: "1px 8px", borderRadius: 12, background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: 11, fontWeight: 500 }}>{opt.label}</span>
                  {isSel && <Check style={{ width: 12, height: 12, marginLeft: "auto", color: "#3b82f6" }} />}
                </button>
              );
            })}
            {selectSearch.trim() && (
              <button onClick={() => {
                const ex = selCol.options?.find(o => o.label.toLowerCase() === selectSearch.toLowerCase());
                if (ex) setCellVal(selectMenu.rowId, selectMenu.colId, ex.id);
                else { const id = addSelectOpt(selectMenu.colId, selectSearch.trim(), nextColor); setTimeout(() => setCellVal(selectMenu.rowId, selectMenu.colId, id), 10); }
                setSelectMenu(null); setSelectSearch("");
              }}
                style={{ width: "100%", textAlign: "left", padding: "5px 8px", borderRadius: 6, border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <Plus style={{ width: 12, height: 12, color: "#6b7280" }} />
                {filtOpts.length === 0 ? `Create "${selectSearch}"` : `Create: "${selectSearch}"`}
              </button>
            )}
            {filtOpts.length === 0 && !selectSearch.trim() && (
              <div style={{ padding: "8px 4px", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>No options. Type to create.</div>
            )}
          </div>
          <div style={{ padding: "6px 8px 4px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "#9ca3af", marginRight: 2 }}>Colors:</span>
            {COLOR_NAMES.map(cn => {
              const c = SELECT_COLORS[cn];
              return (
                <button key={cn} title={cn} onClick={() => {
                  if (selectSearch.trim()) { const id = addSelectOpt(selectMenu.colId, selectSearch.trim(), cn); setTimeout(() => setCellVal(selectMenu.rowId, selectMenu.colId, id), 10); setSelectMenu(null); setSelectSearch(""); }
                }}
                  style={{ width: 18, height: 18, borderRadius: "50%", background: c.bg, border: `2px solid ${c.border}`, cursor: "pointer", flexShrink: 0 }} />
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
