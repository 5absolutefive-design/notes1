import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Hash, Type, CheckSquare, Calendar, Tag, X, Check, ChevronDown, ArrowUp, ArrowDown } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────
type ColType = "text" | "number" | "select" | "checkbox" | "date";
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

// ── Type metadata ──────────────────────────────────────────────────
const COL_TYPE_META: Record<ColType, { label: string; icon: React.ReactNode }> = {
  text:     { label: "Text",     icon: <Type style={{ width: 12, height: 12 }} /> },
  number:   { label: "Number",   icon: <Hash style={{ width: 12, height: 12 }} /> },
  select:   { label: "Select",   icon: <Tag style={{ width: 12, height: 12 }} /> },
  checkbox: { label: "Checkbox", icon: <CheckSquare style={{ width: 12, height: 12 }} /> },
  date:     { label: "Date",     icon: <Calendar style={{ width: 12, height: 12 }} /> },
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
  } catch { /* fallthrough */ }
  return makeDefaultData();
}

function fmtNumber(val: any, fmt?: NumFmt): string {
  const n = parseFloat(val);
  if (isNaN(n)) return "";
  if (fmt === "currency") return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  if (fmt === "percent") return `${n}%`;
  return String(n);
}

// ── SelectBadge ────────────────────────────────────────────────────
function SelectBadge({ label, color }: { label: string; color: keyof typeof SELECT_COLORS }) {
  const c = SELECT_COLORS[color] ?? SELECT_COLORS.gray;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "1px 8px", borderRadius: 12, background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: 11, fontWeight: 500, lineHeight: "18px", whiteSpace: "nowrap", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis" }}>
      {label}
    </span>
  );
}

// ── Menu button style ──────────────────────────────────────────────
const mBtn: React.CSSProperties = {
  width: "100%", display: "flex", alignItems: "center", gap: 8,
  padding: "6px 12px", border: "none", background: "none",
  cursor: "pointer", fontSize: 12, color: "#374151", textAlign: "left",
};

// ── Main Component ─────────────────────────────────────────────────
export function NotionTable({ content, onChange }: { content: string; onChange: (v: string) => void }) {
  const [data, setData] = useState<NTableData>(() => parseData(content));

  // UI state
  const [hoverRow, setHoverRow] = useState<string | null>(null);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColName, setEditingColName] = useState("");
  const [colMenu, setColMenu] = useState<{ colId: string; rect: DOMRect } | null>(null);
  const [typeMenu, setTypeMenu] = useState<{ colId: string; rect: DOMRect } | null>(null);
  const [selectMenu, setSelectMenu] = useState<{ rowId: string; colId: string; rect: DOMRect } | null>(null);
  const [selectSearch, setSelectSearch] = useState("");
  const [sortConfig, setSortConfig] = useState<{ colId: string; dir: "asc" | "desc" } | null>(null);

  // Resize refs
  const colResizeRef = useRef<{ colId: string; startX: number; startW: number } | null>(null);
  const rowResizeRef = useRef<{ rowId: string; startY: number; startH: number } | null>(null);
  const isResizing = useRef(false);
  const firstRender = useRef(true);

  const update = useCallback((fn: (d: NTableData) => NTableData) => {
    setData(prev => {
      const next = fn(prev);
      onChange(JSON.stringify(next));
      return next;
    });
  }, [onChange]);

  useEffect(() => { firstRender.current = false; }, []);

  // ── Mouse resize ───────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (colResizeRef.current) {
        const { colId, startX, startW } = colResizeRef.current;
        const newW = Math.max(60, Math.round(startW + e.clientX - startX));
        setData(prev => ({ ...prev, columns: prev.columns.map(c => c.id === colId ? { ...c, width: newW } : c) }));
      } else if (rowResizeRef.current) {
        const { rowId, startY, startH } = rowResizeRef.current;
        const newH = Math.max(32, Math.round(startH + e.clientY - startY));
        setData(prev => ({ ...prev, rows: prev.rows.map(r => r.id === rowId ? { ...r, height: newH } : r) }));
      }
    };
    const onUp = () => {
      if (colResizeRef.current || rowResizeRef.current) {
        setData(prev => { onChange(JSON.stringify(prev)); return prev; });
        colResizeRef.current = null;
        rowResizeRef.current = null;
        setTimeout(() => { isResizing.current = false; }, 50);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [onChange]);

  // ── Close menus on outside click ───────────────────────────────
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-ntbl-menu]")) {
        setColMenu(null); setTypeMenu(null); setSelectMenu(null); setSelectSearch("");
        if (editingColId) setEditingColId(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [editingColId]);

  // ── Sorted rows ────────────────────────────────────────────────
  const displayRows = sortConfig
    ? [...data.rows].sort((a, b) => {
        const cmp = String(a[sortConfig.colId] ?? "").localeCompare(String(b[sortConfig.colId] ?? ""), undefined, { numeric: true });
        return sortConfig.dir === "asc" ? cmp : -cmp;
      })
    : data.rows;

  // ── Footer stats ───────────────────────────────────────────────
  const countRows = data.rows.length;
  const numCols = data.columns.filter(c => c.type === "number");
  const numStats = numCols.map(col => {
    const vals = data.rows.map(r => parseFloat(r[col.id])).filter(v => !isNaN(v));
    const sum = vals.reduce((a, b) => a + b, 0);
    return { col, sum, avg: vals.length ? sum / vals.length : 0 };
  });

  // ── Cell value updater ─────────────────────────────────────────
  const setCellValue = (rowId: string, colId: string, val: any) => {
    update(d => ({ ...d, rows: d.rows.map(r => r.id === rowId ? { ...r, [colId]: val } : r) }));
  };

  // ── Column actions ─────────────────────────────────────────────
  const addColumn = () => {
    const id = `c${Date.now()}`;
    update(d => ({ ...d, columns: [...d.columns, { id, name: "Column", type: "text" as ColType, width: 160 }] }));
  };

  const deleteColumn = (colId: string) => {
    update(d => ({
      ...d,
      columns: d.columns.filter(c => c.id !== colId),
      rows: d.rows.map(r => { const n = { ...r }; delete n[colId]; return n; }),
    }));
    setColMenu(null);
  };

  const renameColumn = (colId: string, name: string) => {
    if (name.trim()) update(d => ({ ...d, columns: d.columns.map(c => c.id === colId ? { ...c, name: name.trim() } : c) }));
    setEditingColId(null);
  };

  const changeColType = (colId: string, type: ColType) => {
    update(d => ({
      ...d,
      columns: d.columns.map(c => c.id === colId ? { ...c, type } : c),
      rows: d.rows.map(r => ({ ...r, [colId]: type === "checkbox" ? false : undefined })),
    }));
    setTypeMenu(null); setColMenu(null);
  };

  const addSelectOption = (colId: string, label: string, color: keyof typeof SELECT_COLORS): string => {
    const id = `opt_${Date.now()}`;
    update(d => ({ ...d, columns: d.columns.map(c => c.id === colId ? { ...c, options: [...(c.options ?? []), { id, label, color }] } : c) }));
    return id;
  };

  // ── Row actions ────────────────────────────────────────────────
  const addRow = () => {
    const id = `r${Date.now()}`;
    const row: RowData = { id };
    data.columns.forEach(c => { if (c.type === "checkbox") row[c.id] = false; });
    update(d => ({ ...d, rows: [...d.rows, row] }));
  };

  const deleteRow = (rowId: string) => {
    update(d => ({ ...d, rows: d.rows.filter(r => r.id !== rowId) }));
  };

  // ── Render cell ────────────────────────────────────────────────
  const renderCell = (row: RowData, col: Column) => {
    const val = row[col.id];
    const h = row.height ?? 36;

    const tdBase: React.CSSProperties = {
      width: col.width, minWidth: col.width, maxWidth: col.width,
      height: h, borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb",
      overflow: "hidden", boxSizing: "border-box", padding: 0, position: "relative",
    };
    const inputBase: React.CSSProperties = {
      width: "100%", height: "100%", border: "none", outline: "none",
      background: "transparent", padding: "0 8px", fontSize: 13,
      color: "#1f2937", fontFamily: "inherit", boxSizing: "border-box",
    };

    switch (col.type) {
      case "text":
        return (
          <td key={col.id} style={tdBase}>
            <input value={val ?? ""} onChange={e => setCellValue(row.id, col.id, e.target.value)}
              style={inputBase} placeholder="…" />
          </td>
        );

      case "number":
        return (
          <td key={col.id} style={tdBase}>
            {document.activeElement?.getAttribute("data-nid") === `${row.id}-${col.id}` ? (
              <input type="number" data-nid={`${row.id}-${col.id}`}
                value={val ?? ""} onChange={e => setCellValue(row.id, col.id, e.target.value)}
                style={{ ...inputBase, textAlign: "right" }} placeholder="0"
                autoFocus onBlur={() => setData(d => ({ ...d }))} />
            ) : (
              <div data-nid={`${row.id}-${col.id}`}
                onClick={e => { (e.currentTarget as HTMLElement).setAttribute("tabindex", "0"); (e.currentTarget as HTMLElement).focus(); setData(d => ({ ...d })); }}
                style={{ ...inputBase, display: "flex", alignItems: "center", justifyContent: "flex-end", cursor: "text", color: val != null && val !== "" ? "#1f2937" : "#9ca3af" }}>
                {val != null && val !== "" ? fmtNumber(val, col.format) : "0"}
              </div>
            )}
          </td>
        );

      case "checkbox":
        return (
          <td key={col.id} style={{ ...tdBase, display: "table-cell", verticalAlign: "middle", textAlign: "center", cursor: "pointer" }}
            onClick={() => setCellValue(row.id, col.id, !val)}>
            <div style={{ width: 16, height: 16, borderRadius: 3, border: val ? "2px solid #3b82f6" : "2px solid #d1d5db", background: val ? "#3b82f6" : "white", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {val && <svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1.5,5 4,7.5 8.5,2.5" /></svg>}
            </div>
          </td>
        );

      case "date":
        return (
          <td key={col.id} style={tdBase}>
            <input type="date" value={val ?? ""} onChange={e => setCellValue(row.id, col.id, e.target.value)}
              style={{ ...inputBase, color: val ? "#1f2937" : "#9ca3af" }} />
          </td>
        );

      case "select": {
        const col_ = data.columns.find(c => c.id === col.id)!;
        const selected = col_.options?.find(o => o.id === val);
        return (
          <td key={col.id} style={{ ...tdBase, cursor: "pointer", display: "table-cell", verticalAlign: "middle", padding: "0 8px" }}
            onClick={e => {
              if (isResizing.current) return;
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              setSelectMenu({ rowId: row.id, colId: col.id, rect });
              setSelectSearch("");
            }}>
            {selected
              ? <SelectBadge label={selected.label} color={selected.color} />
              : <span style={{ fontSize: 12, color: "#d1d5db" }}>—</span>}
          </td>
        );
      }

      default:
        return <td key={col.id} style={tdBase} />;
    }
  };

  // ── Active select column (for menu) ───────────────────────────
  const activeSelectCol = selectMenu ? data.columns.find(c => c.id === selectMenu.colId) : null;
  const activeSelectVal = selectMenu ? data.rows.find(r => r.id === selectMenu.rowId)?.[selectMenu.colId] : null;
  const filteredOpts = activeSelectCol?.options?.filter(o => o.label.toLowerCase().includes(selectSearch.toLowerCase())) ?? [];
  const nextColorIdx = (activeSelectCol?.options?.length ?? 0) % COLOR_NAMES.length;
  const nextColor = COLOR_NAMES[nextColorIdx];

  return (
    <div style={{ fontFamily: "Inter, -apple-system, sans-serif", fontSize: 13, height: "100%", display: "flex", flexDirection: "column", background: "white" }}>

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #e5e7eb", background: "#fafafa", flexShrink: 0, gap: 8 }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {sortConfig && (
            <button onClick={() => setSortConfig(null)} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, border: "1px solid #3b82f6", background: "#eff6ff", color: "#3b82f6", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              {data.columns.find(c => c.id === sortConfig.colId)?.name} {sortConfig.dir === "asc" ? "↑" : "↓"}
              <X style={{ width: 10, height: 10 }} />
            </button>
          )}
        </div>
        <button onClick={addRow} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 6, border: "1px solid #d1d5db", background: "white", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
          <Plus style={{ width: 12, height: 12 }} /> New Row
        </button>
      </div>

      {/* ── Table area ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <table style={{ borderCollapse: "collapse", tableLayout: "fixed", borderTop: "2px solid #111827", borderLeft: "1px solid #e5e7eb" }}>
          <thead>
            <tr>
              {/* Row actions column */}
              <th style={{ width: 36, minWidth: 36, borderRight: "1px solid #e5e7eb", borderBottom: "2px solid #111827", background: "#f9fafb", position: "sticky", top: 0, zIndex: 10 }} />

              {data.columns.map(col => (
                <th key={col.id} style={{ width: col.width, minWidth: col.width, maxWidth: col.width, height: 36, borderRight: "1px solid #e5e7eb", borderBottom: "2px solid #111827", background: "#f9fafb", padding: 0, position: "sticky", top: 0, zIndex: 10, userSelect: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", height: "100%", position: "relative" }}>
                    {editingColId === col.id ? (
                      <input
                        data-ntbl-menu="col"
                        autoFocus
                        value={editingColName}
                        onChange={e => setEditingColName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") renameColumn(col.id, editingColName); if (e.key === "Escape") setEditingColId(null); }}
                        onBlur={() => renameColumn(col.id, editingColName)}
                        style={{ flex: 1, height: "100%", border: "none", borderBottom: "2px solid #3b82f6", outline: "none", padding: "0 8px", fontSize: 12, fontWeight: 600, background: "#eff6ff", color: "#374151" }}
                      />
                    ) : (
                      <button
                        onClick={e => {
                          const th = (e.currentTarget as HTMLElement).closest("th")!;
                          setColMenu({ colId: col.id, rect: th.getBoundingClientRect() });
                        }}
                        style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", gap: 5, padding: "0 8px", background: "none", border: "none", cursor: "pointer", textAlign: "left", overflow: "hidden", color: "#374151", fontWeight: 600, fontSize: 12 }}>
                        <span style={{ color: "#9ca3af", flexShrink: 0, display: "flex" }}>{COL_TYPE_META[col.type].icon}</span>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{col.name}</span>
                        {sortConfig?.colId === col.id && <span style={{ fontSize: 10, color: "#3b82f6", flexShrink: 0 }}>{sortConfig.dir === "asc" ? "↑" : "↓"}</span>}
                        <ChevronDown style={{ width: 10, height: 10, color: "#9ca3af", flexShrink: 0 }} />
                      </button>
                    )}
                    {/* Column resize handle */}
                    <div
                      onMouseDown={e => { e.preventDefault(); isResizing.current = true; colResizeRef.current = { colId: col.id, startX: e.clientX, startW: col.width }; }}
                      style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 6, cursor: "col-resize", zIndex: 2, transition: "background 0.1s" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#bfdbfe")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    />
                  </div>
                </th>
              ))}

              {/* Add column */}
              <th style={{ width: 44, minWidth: 44, borderRight: "1px solid #e5e7eb", borderBottom: "2px solid #111827", background: "#f9fafb", position: "sticky", top: 0, zIndex: 10 }}>
                <button onClick={addColumn} title="Add column" style={{ width: "100%", height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#f3f4f6"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "#9ca3af"; }}>
                  <Plus style={{ width: 14, height: 14 }} />
                </button>
              </th>
            </tr>
          </thead>

          <tbody>
            {displayRows.map(row => (
              <tr key={row.id} onMouseEnter={() => setHoverRow(row.id)} onMouseLeave={() => setHoverRow(null)}>
                {/* Row action cell */}
                <td style={{ width: 36, minWidth: 36, borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb", height: row.height ?? 36, padding: 0, position: "relative", background: hoverRow === row.id ? "#fafafa" : "white", verticalAlign: "middle" }}>
                  {hoverRow === row.id && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                      <button onClick={() => deleteRow(row.id)} title="Delete row"
                        style={{ width: 22, height: 22, border: "none", background: "none", cursor: "pointer", borderRadius: 4, color: "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fee2e2"; (e.currentTarget as HTMLElement).style.color = "#dc2626"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "#9ca3af"; }}>
                        <Trash2 style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  )}
                  {/* Row resize handle */}
                  <div
                    onMouseDown={e => { e.preventDefault(); isResizing.current = true; rowResizeRef.current = { rowId: row.id, startY: e.clientY, startH: row.height ?? 36 }; }}
                    style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 5, cursor: "row-resize", zIndex: 2 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#bfdbfe")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  />
                </td>

                {data.columns.map(col => renderCell(row, col))}

                {/* Spacer under add-column header */}
                <td style={{ width: 44, minWidth: 44, borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }} />
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add row */}
        <button onClick={addRow}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px 8px 48px", color: "#9ca3af", fontSize: 12, fontWeight: 500, background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left", borderBottom: "1px solid #f3f4f6" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#fafafa"; (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "#9ca3af"; }}>
          <Plus style={{ width: 13, height: 13 }} /> Add a row
        </button>
      </div>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: "5px 16px", background: "#f9fafb", display: "flex", gap: 16, alignItems: "center", flexShrink: 0, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>
          COUNT <span style={{ color: "#111827", marginLeft: 2 }}>{countRows}</span>
        </span>
        {numStats.map(({ col, sum, avg }) => (
          <span key={col.id} style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: "#9ca3af" }}>{col.name}</span>
            SUM <span style={{ color: "#111827" }}>{fmtNumber(sum, col.format)}</span>
            <span style={{ color: "#d1d5db" }}>·</span>
            AVG <span style={{ color: "#111827" }}>{fmtNumber(avg, col.format)}</span>
          </span>
        ))}
      </div>

      {/* ── Portals ─────────────────────────────────────────────── */}

      {/* Column menu */}
      {colMenu && createPortal(
        <div data-ntbl-menu="col" style={{ position: "fixed", top: colMenu.rect.bottom + 2, left: colMenu.rect.left, zIndex: 9999, background: "white", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb", minWidth: 200, padding: "4px 0", overflow: "hidden" }}>
          <button onMouseDown={e => { e.preventDefault(); const col = data.columns.find(c => c.id === colMenu.colId); setEditingColId(colMenu.colId); setEditingColName(col?.name ?? ""); setColMenu(null); }}
            style={{ ...mBtn }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            ✏️ Rename
          </button>
          <div style={{ position: "relative" }}>
            <button onClick={e => { const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); setTypeMenu({ colId: colMenu.colId, rect }); }}
              style={{ ...mBtn }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <span style={{ display: "flex", color: "#6b7280" }}>{COL_TYPE_META[data.columns.find(c => c.id === colMenu.colId)?.type ?? "text"].icon}</span>
              Change type
              <ChevronDown style={{ width: 10, height: 10, marginLeft: "auto", transform: "rotate(-90deg)", color: "#9ca3af" }} />
            </button>
          </div>
          <div style={{ borderTop: "1px solid #f3f4f6", margin: "3px 0" }} />
          <button onClick={() => { setSortConfig({ colId: colMenu.colId, dir: "asc" }); setColMenu(null); }}
            style={{ ...mBtn }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <ArrowUp style={{ width: 12, height: 12, color: "#6b7280" }} /> Sort A → Z
          </button>
          <button onClick={() => { setSortConfig({ colId: colMenu.colId, dir: "desc" }); setColMenu(null); }}
            style={{ ...mBtn }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <ArrowDown style={{ width: 12, height: 12, color: "#6b7280" }} /> Sort Z → A
          </button>
          <div style={{ borderTop: "1px solid #f3f4f6", margin: "3px 0" }} />
          <button onClick={() => deleteColumn(colMenu.colId)}
            style={{ ...mBtn, color: "#dc2626" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <Trash2 style={{ width: 12, height: 12 }} /> Delete column
          </button>
        </div>,
        document.body
      )}

      {/* Type picker menu */}
      {typeMenu && createPortal(
        <div data-ntbl-menu="type" style={{ position: "fixed", top: typeMenu.rect.top, left: typeMenu.rect.right + 6, zIndex: 10000, background: "white", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb", minWidth: 160, padding: "4px 0" }}>
          {(Object.entries(COL_TYPE_META) as Array<[ColType, { label: string; icon: React.ReactNode }]>).map(([type, meta]) => {
            const isCurrent = data.columns.find(c => c.id === typeMenu.colId)?.type === type;
            return (
              <button key={type} onClick={() => changeColType(typeMenu.colId, type)}
                style={{ ...mBtn, background: isCurrent ? "#f0f9ff" : "none" }}
                onMouseEnter={e => (e.currentTarget.style.background = isCurrent ? "#e0f2fe" : "#f3f4f6")}
                onMouseLeave={e => (e.currentTarget.style.background = isCurrent ? "#f0f9ff" : "none")}>
                <span style={{ color: "#6b7280", display: "flex" }}>{meta.icon}</span>
                {meta.label}
                {isCurrent && <Check style={{ width: 11, height: 11, marginLeft: "auto", color: "#3b82f6" }} />}
              </button>
            );
          })}
        </div>,
        document.body
      )}

      {/* Select dropdown */}
      {selectMenu && activeSelectCol && createPortal(
        <div data-ntbl-menu="select" style={{ position: "fixed", top: selectMenu.rect.bottom + 4, left: selectMenu.rect.left, zIndex: 9999, background: "white", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", border: "1px solid #e5e7eb", minWidth: 220, padding: "8px 0 4px", maxHeight: 320, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0 8px 6px" }}>
            <input
              autoFocus
              value={selectSearch}
              onChange={e => setSelectSearch(e.target.value)}
              placeholder="Search or create option..."
              style={{ width: "100%", padding: "5px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 12, outline: "none", boxSizing: "border-box" }}
              onKeyDown={e => {
                if (e.key === "Enter" && selectSearch.trim()) {
                  const existing = activeSelectCol.options?.find(o => o.label.toLowerCase() === selectSearch.toLowerCase());
                  if (existing) {
                    setCellValue(selectMenu.rowId, selectMenu.colId, existing.id);
                  } else {
                    const id = addSelectOption(selectMenu.colId, selectSearch.trim(), nextColor);
                    setTimeout(() => setCellValue(selectMenu.rowId, selectMenu.colId, id), 10);
                  }
                  setSelectMenu(null); setSelectSearch("");
                }
                if (e.key === "Escape") { setSelectMenu(null); setSelectSearch(""); }
              }}
            />
          </div>

          {activeSelectVal && (
            <button onClick={() => { setCellValue(selectMenu.rowId, selectMenu.colId, undefined); setSelectMenu(null); }}
              style={{ ...mBtn, color: "#6b7280", fontSize: 11 }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <X style={{ width: 10, height: 10 }} /> Clear selection
            </button>
          )}

          <div style={{ overflowY: "auto", flex: 1, padding: "0 8px 4px" }}>
            {filteredOpts.map(opt => {
              const c = SELECT_COLORS[opt.color] ?? SELECT_COLORS.gray;
              const isSel = activeSelectVal === opt.id;
              return (
                <button key={opt.id} onClick={() => { setCellValue(selectMenu.rowId, selectMenu.colId, isSel ? undefined : opt.id); setSelectMenu(null); }}
                  style={{ width: "100%", textAlign: "left", padding: "4px 6px", borderRadius: 6, border: "none", background: isSel ? "#f0f9ff" : "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}
                  onMouseEnter={e => (e.currentTarget.style.background = isSel ? "#e0f2fe" : "#f9fafb")}
                  onMouseLeave={e => (e.currentTarget.style.background = isSel ? "#f0f9ff" : "none")}>
                  <span style={{ display: "inline-flex", padding: "1px 8px", borderRadius: 12, background: c.bg, color: c.text, border: `1px solid ${c.border}`, fontSize: 11, fontWeight: 500 }}>{opt.label}</span>
                  {isSel && <Check style={{ width: 12, height: 12, marginLeft: "auto", color: "#3b82f6", flexShrink: 0 }} />}
                </button>
              );
            })}

            {selectSearch.trim() && (
              <button onClick={() => {
                const existing = activeSelectCol.options?.find(o => o.label.toLowerCase() === selectSearch.toLowerCase());
                if (existing) { setCellValue(selectMenu.rowId, selectMenu.colId, existing.id); }
                else { const id = addSelectOption(selectMenu.colId, selectSearch.trim(), nextColor); setTimeout(() => setCellValue(selectMenu.rowId, selectMenu.colId, id), 10); }
                setSelectMenu(null); setSelectSearch("");
              }}
                style={{ width: "100%", textAlign: "left", padding: "5px 8px", borderRadius: 6, border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                <Plus style={{ width: 12, height: 12, color: "#6b7280" }} />
                {filteredOpts.length === 0 ? `Create "${selectSearch}"` : `Create new: "${selectSearch}"`}
              </button>
            )}

            {filteredOpts.length === 0 && !selectSearch.trim() && (
              <div style={{ padding: "8px 4px", fontSize: 12, color: "#9ca3af", textAlign: "center" }}>No options yet. Type to create.</div>
            )}
          </div>

          {/* Color swatches for quick option creation */}
          <div style={{ padding: "6px 8px 4px", borderTop: "1px solid #f3f4f6", display: "flex", gap: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "#9ca3af", width: "100%", marginBottom: 3 }}>Option colors</span>
            {COLOR_NAMES.map(cn => {
              const c = SELECT_COLORS[cn];
              return (
                <button key={cn} title={cn} onClick={() => {
                  if (selectSearch.trim()) {
                    const id = addSelectOption(selectMenu.colId, selectSearch.trim(), cn);
                    setTimeout(() => setCellValue(selectMenu.rowId, selectMenu.colId, id), 10);
                    setSelectMenu(null); setSelectSearch("");
                  }
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
