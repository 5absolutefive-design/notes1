import { useParams, useLocation, Redirect } from "wouter";
import { ChevronLeft, ChevronRight, Trash2, ArchiveRestore, X, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef, useCallback, type MutableRefObject } from "react";
import { createPortal } from "react-dom";
import { store, type Book, type Page, type PageType } from "@/lib/store";

function PortalPopup({ anchorRef, open, children, align = "left" }: {
  anchorRef: { current: HTMLElement | null };
  open: boolean;
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  if (!open) return null;
  const rect = anchorRef.current?.getBoundingClientRect();
  if (!rect) return null;
  const posStyle: React.CSSProperties = align === "right"
    ? { position: "fixed", top: rect.bottom + 4, right: window.innerWidth - rect.right, zIndex: 9999 }
    : { position: "fixed", top: rect.bottom + 4, left: rect.left, zIndex: 9999 };
  return createPortal(
    <div data-portal-popup="true" style={posStyle}>
      {children}
    </div>,
    document.body
  );
}

const COLS = 26;
const ROWS = 500;
const ROW_HEIGHT = 24;
const VIRT_BUFFER = 30;
const COL_LABELS = Array.from({ length: COLS }, (_, i) => String.fromCharCode(65 + i));
const TABLE_COLS = 5;
const TABLE_ROWS = 12;
const TABLE_COL_WIDTH = 160;
const TABLE_ROW_HEIGHT = 48;

interface MergeRegion { r1: number; c1: number; r2: number; c2: number; }
type BorderStyle = "dotted" | "single" | "double" | "bold";
type CellFormat = { bold?: boolean; italic?: boolean; underline?: boolean; strikeThrough?: boolean; overline?: boolean; fontColor?: string; highlightColor?: string; fontSize?: number; fontFamily?: string; borderStyle?: BorderStyle; };
interface SheetData { cells: Record<string, string>; merges: MergeRegion[]; colWidths?: Record<number, number>; rowHeights?: Record<number, number>; cellAligns?: Record<string, "left" | "center" | "right">; cellValigns?: Record<string, "top" | "middle" | "bottom">; cellFormats?: Record<string, CellFormat>; tableSize?: { rows: number; cols: number }; }

function SpreadsheetEditor({ content, onChange, tableMode, mergeRef, clearRef, cutRef, insertRowRef, insertColRef, colWidthIncRef, colWidthDecRef, rowHeightIncRef, rowHeightDecRef, onActiveSizeChange, cellAlignRef, onActiveCellAlignChange, cellValignRef, onActiveCellValignChange, cellFormatRef, onActiveCellFormatChange, onMergeStateChange, cellBorderRef, resizeTableRef }: {
  content: string;
  onChange: (v: string) => void;
  tableMode?: boolean;
  mergeRef?: MutableRefObject<(() => void) | null>;
  clearRef?: MutableRefObject<(() => void) | null>;
  cutRef?: MutableRefObject<(() => void) | null>;
  insertRowRef?: MutableRefObject<(() => void) | null>;
  insertColRef?: MutableRefObject<(() => void) | null>;
  colWidthIncRef?: MutableRefObject<(() => void) | null>;
  colWidthDecRef?: MutableRefObject<(() => void) | null>;
  rowHeightIncRef?: MutableRefObject<(() => void) | null>;
  rowHeightDecRef?: MutableRefObject<(() => void) | null>;
  onActiveSizeChange?: (sizes: { colWidth: number; rowHeight: number } | null) => void;
  cellAlignRef?: MutableRefObject<((a: "left" | "center" | "right") => void) | null>;
  onActiveCellAlignChange?: (a: "left" | "center" | "right") => void;
  cellValignRef?: MutableRefObject<((a: "top" | "middle" | "bottom") => void) | null>;
  onActiveCellValignChange?: (a: "top" | "middle" | "bottom") => void;
  cellFormatRef?: MutableRefObject<((fmt: Partial<CellFormat>) => void) | null>;
  onActiveCellFormatChange?: (fmt: CellFormat) => void;
  onMergeStateChange?: (isMergedAnchor: boolean, hasMultiSelection: boolean) => void;
  cellBorderRef?: MutableRefObject<((bs: BorderStyle | "none") => void) | null>;
  resizeTableRef?: MutableRefObject<((rows: number, cols: number) => void) | null>;
}) {
  const defColW = tableMode ? TABLE_COL_WIDTH : 80;
  const defRowH = tableMode ? TABLE_ROW_HEIGHT : ROW_HEIGHT;

  const parseData = (): SheetData => {
    try {
      const d = JSON.parse(content);
      return { cells: d.cells ?? {}, merges: d.merges ?? [], colWidths: d.colWidths ?? {}, rowHeights: d.rowHeights ?? {}, cellAligns: d.cellAligns ?? {}, cellValigns: d.cellValigns ?? {}, cellFormats: d.cellFormats ?? {}, tableSize: d.tableSize ?? undefined };
    } catch { return { cells: {}, merges: [], colWidths: {}, rowHeights: {}, cellAligns: {}, cellValigns: {}, cellFormats: {} }; }
  };

  const [data, setData] = useState<SheetData>(parseData);

  const effectiveCols = tableMode ? (data.tableSize?.cols ?? TABLE_COLS) : COLS;
  const effectiveRows = tableMode ? (data.tableSize?.rows ?? TABLE_ROWS) : ROWS;

  const [active, setActive] = useState<[number, number] | null>(null);
  const anchorRef = useRef<[number, number] | null>(null);
  const dragEndRef = useRef<[number, number] | null>(null);
  const isDraggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [selection, setSelection] = useState<{ anchor: [number,number]; end: [number,number] } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const dataRef = useRef<SheetData>(data);
  dataRef.current = data;
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const activeRef = useRef(active);
  activeRef.current = active;

  const containerRef = useRef<HTMLDivElement>(null);
  const [virtScroll, setVirtScroll] = useState({ top: 0, height: 600 });

  const key = (r: number, c: number) => `${r}-${c}`;

  const getRect = (a: [number,number], d: [number,number]) => ({
    r1: Math.min(a[0], d[0]), r2: Math.max(a[0], d[0]),
    c1: Math.min(a[1], d[1]), c2: Math.max(a[1], d[1]),
  });

  const rectKeys = (rect: { r1:number; r2:number; c1:number; c2:number }) => {
    const ks: string[] = [];
    for (let r = rect.r1; r <= rect.r2; r++)
      for (let c = rect.c1; c <= rect.c2; c++)
        ks.push(key(r, c));
    return ks;
  };

  const mergeAnchorMap = new Map<string, { colSpan: number; rowSpan: number }>();
  const absorbedSet = new Set<string>();
  data.merges.forEach(m => {
    mergeAnchorMap.set(key(m.r1, m.c1), { colSpan: m.c2 - m.c1 + 1, rowSpan: m.r2 - m.r1 + 1 });
    for (let r = m.r1; r <= m.r2; r++)
      for (let c = m.c1; c <= m.c2; c++)
        if (!(r === m.r1 && c === m.c1)) absorbedSet.add(key(r, c));
  });

  const selectedSet = (() => {
    if (!selection) return new Set<string>();
    return new Set<string>(rectKeys(getRect(selection.anchor, selection.end)));
  })();
  const selCount = selectedSet.size;

  const update = (r: number, c: number, val: string) => {
    setData(prev => {
      const cells = { ...prev.cells, [key(r, c)]: val };
      if (!val) delete cells[key(r, c)];
      return { ...prev, cells };
    });
  };

  const move = (r: number, c: number, dr: number, dc: number) => {
    const nr = Math.max(0, Math.min(effectiveRows - 1, r + dr));
    const nc = Math.max(0, Math.min(effectiveCols - 1, c + dc));
    setActive([nr, nc]);
    setSelection(null);
    anchorRef.current = null;
    dragEndRef.current = null;
    setTimeout(() => inputRefs.current[key(nr, nc)]?.focus(), 0);
  };

  const mergeSelected = useCallback(() => {
    const a = anchorRef.current;
    const d = dragEndRef.current ?? a;
    if (!a || !d) return;
    const rect = getRect(a, d);
    const keys = rectKeys(rect);
    if (keys.length < 2) return;
    const combined = keys.map(k => dataRef.current.cells[k] ?? "").filter(Boolean).join(" ");
    setData(prev => {
      const cells = { ...prev.cells };
      keys.forEach(k => delete cells[k]);
      if (combined) cells[key(rect.r1, rect.c1)] = combined;
      const merges = prev.merges.filter(
        m => !(m.r1 <= rect.r2 && m.r2 >= rect.r1 && m.c1 <= rect.c2 && m.c2 >= rect.c1)
      );
      merges.push(rect);
      return { cells, merges };
    });
    anchorRef.current = null;
    dragEndRef.current = null;
    setSelection(null);
    setActive(null);
  }, [onChange]);

  const clearSelected = useCallback(() => {
    if (selection) {
      const keys = rectKeys(getRect(selection.anchor, selection.end));
      setData(prev => {
        const cells = { ...prev.cells };
        keys.forEach(k => delete cells[k]);
        return { ...prev, cells };
      });
    } else if (active) {
      const k = key(active[0], active[1]);
      setData(prev => {
        const cells = { ...prev.cells };
        delete cells[k];
        return { ...prev, cells };
      });
    }
  }, [selection, active]);

  const insertRow = useCallback(() => {
    const r = anchorRef.current ? anchorRef.current[0] : (active ? active[0] : null);
    if (r === null) return;
    setData(prev => {
      const cells: Record<string, string> = {};
      Object.entries(prev.cells).forEach(([k, v]) => {
        const parts = k.split('-');
        const cr = parseInt(parts[0]);
        const cc = parseInt(parts[1]);
        cells[cr > r ? key(cr + 1, cc) : k] = v;
      });
      return { cells, merges: [] };
    });
  }, [active]);

  const insertCol = useCallback(() => {
    const c = anchorRef.current ? anchorRef.current[1] : (active ? active[1] : null);
    if (c === null) return;
    setData(prev => {
      const cells: Record<string, string> = {};
      Object.entries(prev.cells).forEach(([k, v]) => {
        const parts = k.split('-');
        const cr = parseInt(parts[0]);
        const cc = parseInt(parts[1]);
        cells[cc > c ? key(cr, cc + 1) : k] = v;
      });
      return { cells, merges: [] };
    });
  }, [active]);

  const colWidthInc = useCallback(() => {
    const c = active ? active[1] : (anchorRef.current ? anchorRef.current[1] : null);
    if (c === null) return;
    setData(prev => ({ ...prev, colWidths: { ...(prev.colWidths ?? {}), [c]: (prev.colWidths?.[c] ?? defColW) + 20 } }));
  }, [active]);

  const colWidthDec = useCallback(() => {
    const c = active ? active[1] : (anchorRef.current ? anchorRef.current[1] : null);
    if (c === null) return;
    setData(prev => {
      const cur = prev.colWidths?.[c] ?? defColW;
      const raw = cur - 20;
      const next = cur > defColW && raw < defColW ? defColW : Math.max(40, raw);
      const colWidths = { ...(prev.colWidths ?? {}), [c]: next };
      if (next === defColW) delete colWidths[c];
      return { ...prev, colWidths };
    });
  }, [active]);

  const rowHeightInc = useCallback(() => {
    const r = active ? active[0] : (anchorRef.current ? anchorRef.current[0] : null);
    if (r === null) return;
    setData(prev => ({ ...prev, rowHeights: { ...(prev.rowHeights ?? {}), [r]: (prev.rowHeights?.[r] ?? defRowH) + 10 } }));
  }, [active]);

  const rowHeightDec = useCallback(() => {
    const r = active ? active[0] : (anchorRef.current ? anchorRef.current[0] : null);
    if (r === null) return;
    setData(prev => {
      const cur = prev.rowHeights?.[r] ?? defRowH;
      const raw = cur - 10;
      const next = cur > defRowH && raw < defRowH ? defRowH : Math.max(18, raw);
      const rowHeights = { ...(prev.rowHeights ?? {}), [r]: next };
      if (next === defRowH) delete rowHeights[r];
      return { ...prev, rowHeights };
    });
  }, [active]);

  const unmergeActive = useCallback(() => {
    const cell = active ?? anchorRef.current;
    if (!cell) return;
    const merge = dataRef.current.merges.find(m => m.r1 === cell[0] && m.c1 === cell[1]);
    if (!merge) return;
    setData(prev => ({
      ...prev,
      merges: prev.merges.filter(m => !(m.r1 === merge.r1 && m.c1 === merge.c1 && m.r2 === merge.r2 && m.c2 === merge.c2)),
    }));
    setActive(null);
    setSelection(null);
    anchorRef.current = null;
    dragEndRef.current = null;
  }, [active]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    onChange(JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (mergeRef) mergeRef.current = () => {
      const cell = active ?? anchorRef.current;
      if (!cell) return;
      const isAnchor = dataRef.current.merges.some(m => m.r1 === cell[0] && m.c1 === cell[1]);
      if (isAnchor) {
        unmergeActive();
      } else {
        mergeSelected();
      }
    };
    if (clearRef) clearRef.current = clearSelected;
    if (cutRef) cutRef.current = async () => {
      const sel = selectionRef.current;
      const act = activeRef.current ?? anchorRef.current;
      const textParts: string[] = [];
      if (sel) {
        const r1 = Math.min(sel.anchor[0], sel.end[0]); const r2 = Math.max(sel.anchor[0], sel.end[0]);
        const c1 = Math.min(sel.anchor[1], sel.end[1]); const c2 = Math.max(sel.anchor[1], sel.end[1]);
        for (let r = r1; r <= r2; r++) {
          const row: string[] = [];
          for (let c = c1; c <= c2; c++) row.push(dataRef.current.cells[`${r}-${c}`] ?? "");
          textParts.push(row.join("\t"));
        }
      } else if (act) {
        textParts.push(dataRef.current.cells[`${act[0]}-${act[1]}`] ?? "");
      }
      try { await navigator.clipboard.writeText(textParts.join("\n")); } catch { /* ignore */ }
      clearSelected();
    };
    if (insertRowRef) insertRowRef.current = insertRow;
    if (insertColRef) insertColRef.current = insertCol;
    if (colWidthIncRef) colWidthIncRef.current = colWidthInc;
    if (colWidthDecRef) colWidthDecRef.current = colWidthDec;
    if (rowHeightIncRef) rowHeightIncRef.current = rowHeightInc;
    if (rowHeightDecRef) rowHeightDecRef.current = rowHeightDec;
    if (cellAlignRef) cellAlignRef.current = (a: "left" | "center" | "right") => {
      const cell = active ?? anchorRef.current;
      if (!cell) return;
      const k = key(cell[0], cell[1]);
      setData(prev => ({ ...prev, cellAligns: { ...(prev.cellAligns ?? {}), [k]: a } }));
    };
    if (cellValignRef) cellValignRef.current = (a: "top" | "middle" | "bottom") => {
      const cell = active ?? anchorRef.current;
      if (!cell) return;
      const k = key(cell[0], cell[1]);
      setData(prev => ({ ...prev, cellValigns: { ...(prev.cellValigns ?? {}), [k]: a } }));
    };
    if (cellFormatRef) cellFormatRef.current = (fmt: Partial<CellFormat>) => {
      const cell = active ?? anchorRef.current;
      if (!cell) return;
      const k = key(cell[0], cell[1]);
      setData(prev => {
        const existing = prev.cellFormats?.[k] ?? {};
        return { ...prev, cellFormats: { ...(prev.cellFormats ?? {}), [k]: { ...existing, ...fmt } } };
      });
    };
  }, [mergeSelected, unmergeActive, clearSelected, insertRow, insertCol, colWidthInc, colWidthDec, rowHeightInc, rowHeightDec, active]);

  useEffect(() => {
    if (!cellBorderRef) return;
    cellBorderRef.current = (bs: BorderStyle | "none") => {
      const cell = activeRef.current ?? anchorRef.current;
      const sel = selectionRef.current;
      const cells: Array<[number, number]> = [];
      if (sel) {
        const r1 = Math.min(sel.anchor[0], sel.end[0]);
        const r2 = Math.max(sel.anchor[0], sel.end[0]);
        const c1 = Math.min(sel.anchor[1], sel.end[1]);
        const c2 = Math.max(sel.anchor[1], sel.end[1]);
        for (let r = r1; r <= r2; r++)
          for (let c = c1; c <= c2; c++)
            cells.push([r, c]);
      } else if (cell) {
        cells.push(cell);
      }
      if (!cells.length) return;
      setData(prev => {
        const cellFormats = { ...(prev.cellFormats ?? {}) };
        for (const [r, c] of cells) {
          const k = `${r}-${c}`;
          const existing = cellFormats[k] ?? {};
          if (bs === "none") {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { borderStyle: _bs, ...rest } = existing;
            cellFormats[k] = rest;
          } else {
            cellFormats[k] = { ...existing, borderStyle: bs };
          }
        }
        return { ...prev, cellFormats };
      });
    };
    return () => { cellBorderRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!resizeTableRef) return;
    resizeTableRef.current = (rows: number, cols: number) => {
      setData(prev => ({ ...prev, tableSize: { rows, cols } }));
      setActive(null);
      setSelection(null);
    };
    return () => { if (resizeTableRef) resizeTableRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onMergeStateChangeRef = useRef(onMergeStateChange);
  onMergeStateChangeRef.current = onMergeStateChange;

  useEffect(() => {
    const cell = active ?? anchorRef.current;
    const isMergedAnchor = !!cell && data.merges.some(m => m.r1 === cell[0] && m.c1 === cell[1]);
    const hasMultiSelection = !!selection && (
      selection.anchor[0] !== selection.end[0] || selection.anchor[1] !== selection.end[1]
    );
    onMergeStateChangeRef.current?.(isMergedAnchor, hasMultiSelection);
  }, [active, selection, data.merges]);

  useEffect(() => {
    if (!onActiveSizeChange) return;
    const cell = active ?? anchorRef.current;
    if (!cell) { onActiveSizeChange(null); return; }
    onActiveSizeChange({
      colWidth: data.colWidths?.[cell[1]] ?? defColW,
      rowHeight: data.rowHeights?.[cell[0]] ?? defRowH,
    });
  }, [active, data.colWidths, data.rowHeights]);

  useEffect(() => {
    if (!onActiveCellAlignChange) return;
    const cell = active ?? anchorRef.current;
    if (!cell) return;
    onActiveCellAlignChange(data.cellAligns?.[key(cell[0], cell[1])] ?? "left");
  }, [active, data.cellAligns]);

  useEffect(() => {
    if (!onActiveCellValignChange) return;
    const cell = active ?? anchorRef.current;
    if (!cell) return;
    onActiveCellValignChange(data.cellValigns?.[key(cell[0], cell[1])] ?? "middle");
  }, [active, data.cellValigns]);

  useEffect(() => {
    if (!onActiveCellFormatChange) return;
    const cell = active ?? anchorRef.current;
    onActiveCellFormatChange(cell ? (data.cellFormats?.[key(cell[0], cell[1])] ?? {}) : {});
  }, [active, data.cellFormats]);

  const commitDragSelection = useCallback(() => {
    const a = anchorRef.current;
    const d = dragEndRef.current;
    if (a && d) setSelection({ anchor: a, end: d });
    else if (a) setSelection({ anchor: a, end: a });
  }, []);

  useEffect(() => {
    const onUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      const a = anchorRef.current;
      const d = dragEndRef.current ?? a;
      if (a && d) {
        const rect = getRect(a, d);
        if (rect.r1 === rect.r2 && rect.c1 === rect.c2) {
          setSelection(null);
          setActive([a[0], a[1]]);
          anchorRef.current = null;
          dragEndRef.current = null;
          inputRefs.current[key(a[0], a[1])]?.focus();
        } else {
          setSelection({ anchor: a, end: d });
        }
      }
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      const sel = selectionRef.current;
      if (!sel) return;
      const r1 = Math.min(sel.anchor[0], sel.end[0]);
      const r2 = Math.max(sel.anchor[0], sel.end[0]);
      const c1 = Math.min(sel.anchor[1], sel.end[1]);
      const c2 = Math.max(sel.anchor[1], sel.end[1]);
      if (r1 === r2 && c1 === c2) return;
      e.preventDefault();
      setData(prev => {
        const cells = { ...prev.cells };
        for (let r = r1; r <= r2; r++)
          for (let c = c1; c <= c2; c++)
            delete cells[`${r}-${c}`];
        return { ...prev, cells };
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setVirtScroll({ top: el.scrollTop, height: el.clientHeight });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", update); ro.disconnect(); };
  }, []);

  const firstRow = tableMode ? 0 : Math.max(0, Math.floor(virtScroll.top / ROW_HEIGHT) - VIRT_BUFFER);
  const lastRow = tableMode ? effectiveRows - 1 : Math.min(ROWS - 1, Math.ceil((virtScroll.top + virtScroll.height) / ROW_HEIGHT) + VIRT_BUFFER);
  const topSpacer = tableMode ? 0 : firstRow * ROW_HEIGHT;
  const bottomSpacer = tableMode ? 0 : (ROWS - 1 - lastRow) * ROW_HEIGHT;

  const renderCell = (r: number, c: number) => {
    const k = key(r, c);
    if (absorbedSet.has(k)) return null;
    const span = mergeAnchorMap.get(k);
    const colSpan = span?.colSpan ?? 1;
    const rowSpan = span?.rowSpan ?? 1;
    const isMerged = !!span;
    const isActive = active && active[0] === r && active[1] === c;
    const isSelected = selectedSet.has(k);
    const bs = data.cellFormats?.[k]?.borderStyle;
    const borderCss: React.CSSProperties = bs && !isActive && !isSelected ? (() => {
      if (bs === "single") return { outline: "1.5px solid #374151", outlineOffset: "-1px", position: "relative" as const, zIndex: 1 };
      if (bs === "double") return { boxShadow: "inset 0 0 0 1px #374151, inset 0 0 0 2px #fff, inset 0 0 0 3px #374151", position: "relative" as const, zIndex: 1 };
      if (bs === "bold") return { outline: "3px solid #222", outlineOffset: "-3px", position: "relative" as const, zIndex: 1 };
      return {};
    })() : {};
    const defaultBorder = tableMode ? "1px solid #374151" : undefined;
    return (
      <td
        key={c}
        data-cell="1"
        data-r={r}
        data-c={c}
        colSpan={colSpan}
        rowSpan={rowSpan}
        onMouseDown={e => {
          if (e.button !== 0) return;
          if ((e.target as HTMLElement).tagName === "INPUT" && isActive) return;
          e.preventDefault();
          anchorRef.current = [r, c];
          dragEndRef.current = [r, c];
          isDraggingRef.current = true;
          setActive(null);
          setSelection({ anchor: [r, c], end: [r, c] });
        }}
        className={`p-0 cursor-cell ${
          isActive
            ? "outline outline-2 outline-blue-500 z-10 relative"
            : isSelected
            ? "bg-blue-100"
            : ""
        }`}
        style={(() => {
          const colW = data.colWidths?.[c] ?? defColW;
          const firstRowBg = tableMode && r === 0 ? "#FFF8EE" : undefined;
          return {
            border: isActive ? "1px solid #3b82f6" : isSelected ? "1px solid #93c5fd" : (defaultBorder ?? "1px solid #e4e4e7"),
            height: data.rowHeights?.[r] ?? defRowH,
            ...(tableMode ? { width: colW } : { minWidth: colW }),
            verticalAlign: data.cellValigns?.[k] ?? "middle",
            ...(firstRowBg ? { backgroundColor: firstRowBg } : {}),
            ...borderCss,
          };
        })()}
      >
        <input
          ref={el => { inputRefs.current[k] = el; }}
          value={data.cells[k] ?? ""}
          onChange={e => update(r, c, e.target.value)}
          onFocus={() => {
            setActive([r, c]);
            setSelection(null);
            anchorRef.current = null;
            dragEndRef.current = null;
          }}
          onKeyDown={e => {
            if (e.key === "Enter") { e.preventDefault(); move(r, c, 1, 0); }
            else if (e.key === "Tab") { e.preventDefault(); move(r, c, 0, e.shiftKey ? -1 : 1); }
            else if (e.key === "ArrowDown") { e.preventDefault(); move(r, c, 1, 0); }
            else if (e.key === "ArrowUp") { e.preventDefault(); move(r, c, -1, 0); }
            else if (e.key === "ArrowRight" && (e.target as HTMLInputElement).selectionStart === (e.target as HTMLInputElement).value.length) { e.preventDefault(); move(r, c, 0, 1); }
            else if (e.key === "ArrowLeft" && (e.target as HTMLInputElement).selectionStart === 0) { e.preventDefault(); move(r, c, 0, -1); }
          }}
          className="w-full h-full px-1 outline-none bg-transparent text-[13px]"
          style={(() => {
            const fmt = data.cellFormats?.[k] ?? {};
            const td = [fmt.underline && "underline", fmt.strikeThrough && "line-through", fmt.overline && "overline"].filter(Boolean).join(" ");
            const cellW = isMerged ? colSpan * (data.colWidths?.[c] ?? defColW) : (data.colWidths?.[c] ?? defColW);
            return {
              ...(tableMode ? { width: cellW } : { minWidth: cellW }),
              pointerEvents: isDraggingRef.current ? "none" : "auto",
              textAlign: data.cellAligns?.[k] ?? "left",
              fontWeight: fmt.bold ? "bold" : undefined,
              fontStyle: fmt.italic ? "italic" : undefined,
              textDecoration: td || undefined,
              color: fmt.fontColor ?? "#27272a",
              backgroundColor: fmt.highlightColor ?? "transparent",
              fontSize: fmt.fontSize ?? 13,
              fontFamily: fmt.fontFamily ?? "monospace",
            };
          })()}
        />
      </td>
    );
  };

  if (tableMode) {
    return (
      <div
        ref={containerRef}
        style={{ fontFamily: "Inter, sans-serif", fontSize: 13, userSelect: isDraggingRef.current ? "none" : "auto" }}
        onMouseMove={e => {
          if (!isDraggingRef.current) return;
          const el = document.elementFromPoint(e.clientX, e.clientY);
          const td = el?.closest("td[data-cell]") as HTMLElement | null;
          if (!td) return;
          const r = parseInt(td.dataset.r ?? "-1");
          const c = parseInt(td.dataset.c ?? "-1");
          if (r < 0 || c < 0) return;
          dragEndRef.current = [r, c];
          if (rafRef.current) return;
          rafRef.current = requestAnimationFrame(() => { rafRef.current = null; commitDragSelection(); });
        }}
      >
        <table className="border-collapse" style={{ borderTop: "2px solid #1f2937", borderLeft: "2px solid #1f2937", borderRight: "2px solid #1f2937", borderBottom: "2px solid #1f2937" }}>
          <tbody>
            {Array.from({ length: effectiveRows }, (_, r) => (
              <tr key={r}>
                {Array.from({ length: effectiveCols }, (_, c) => renderCell(r, c))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-auto w-full h-full"
      style={{ fontFamily: "monospace", fontSize: 13, userSelect: isDraggingRef.current ? "none" : "auto" }}
      onMouseMove={e => {
        if (!isDraggingRef.current) return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const td = el?.closest("td[data-cell]") as HTMLElement | null;
        if (!td) return;
        const r = parseInt(td.dataset.r ?? "-1");
        const c = parseInt(td.dataset.c ?? "-1");
        if (r < 0 || c < 0) return;
        dragEndRef.current = [r, c];
        if (rafRef.current) return;
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          commitDragSelection();
        });
      }}
    >
      <table className="border-collapse min-w-max" style={{ tableLayout: "fixed" }}>
        <thead>
          <tr>
            <th className="w-10 min-w-[40px] bg-zinc-100 border border-zinc-300 text-zinc-400 text-[11px] font-medium sticky top-0 left-0 z-20" style={{ width: 40 }} />
            {COL_LABELS.map((col, ci) => (
              <th key={col} className="bg-zinc-100 border border-zinc-300 text-zinc-600 text-[11px] font-semibold px-1 py-0.5 sticky top-0 z-10 text-center" style={{ width: data.colWidths?.[ci] ?? 80 }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {topSpacer > 0 && <tr style={{ height: topSpacer }}><td colSpan={COLS + 1} /></tr>}
          {Array.from({ length: lastRow - firstRow + 1 }, (_, i) => {
            const r = firstRow + i;
            return (
              <tr key={r}>
                <td className="bg-zinc-50 border border-zinc-300 text-zinc-400 text-[11px] text-center font-medium px-1 sticky left-0 z-10 select-none" style={{ width: 40, height: ROW_HEIGHT }}>
                  {r + 1}
                </td>
                {Array.from({ length: COLS }, (_, c) => renderCell(r, c))}
              </tr>
            );
          })}
          {bottomSpacer > 0 && <tr style={{ height: bottomSpacer }}><td colSpan={COLS + 1} /></tr>}
        </tbody>
      </table>
    </div>
  );
}

const SEARCH_ATTR = "data-sh";

function removeSearchHighlights(root: HTMLElement) {
  root.querySelectorAll(`[${SEARCH_ATTR}]`).forEach(el => {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
    parent.normalize();
  });
}

function applySearchHighlights(root: HTMLElement, term: string) {
  removeSearchHighlights(root);
  if (!term.trim()) return;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) textNodes.push(node as Text);
  textNodes.forEach(textNode => {
    const text = textNode.textContent ?? "";
    const matches = [...text.matchAll(regex)];
    if (!matches.length) return;
    const frag = document.createDocumentFragment();
    let lastIdx = 0;
    matches.forEach(m => {
      const idx = m.index!;
      if (idx > lastIdx) frag.appendChild(document.createTextNode(text.slice(lastIdx, idx)));
      const mark = document.createElement("mark");
      mark.setAttribute(SEARCH_ATTR, "true");
      mark.style.cssText = "background:#ef4444;color:white;border-radius:2px;padding:0 1px;";
      mark.textContent = m[0];
      frag.appendChild(mark);
      lastIdx = idx + m[0].length;
    });
    if (lastIdx < text.length) frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    textNode.parentNode?.replaceChild(frag, textNode);
  });
}

const FONTS = [
  "Inter", "Roboto", "Lato", "Poppins", "Nunito",
  "Merriweather", "Playfair Display", "EB Garamond",
  "Source Code Pro", "Courier Prime",
];

export default function PageEditor() {
  const { bookId, pageId } = useParams();
  const [, setLocation] = useLocation();
  const bId = parseInt(bookId || "0", 10);
  const pId = parseInt(pageId || "0", 10);

  const [book, setBook] = useState<Book | null>(() => store.getBook(bId) ?? null);
  const [pages, setPages] = useState<Page[]>(() => store.listPages(bId));
  const [page, setPage] = useState<Page | null>(() => store.getPage(bId, pId) ?? null);
  const [trashedPages, setTrashedPages] = useState<Page[]>([]);
  const [content, setContent] = useState(() => store.getPage(bId, pId)?.content ?? "");
  const [pageTitle, setPageTitle] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [showPageTypePicker, setShowPageTypePicker] = useState(false);
  const pageTypePickerRef = useRef<HTMLDivElement>(null);
  const [editingTabId, setEditingTabId] = useState<number | null>(null);
  const [editingTabValue, setEditingTabValue] = useState("");

  const [font, setFont] = useState("Inter");
  const [fontSize, setFontSize] = useState(16);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false, strikeThrough: false, overline: false });
  const [align, setAlign] = useState<"left" | "center" | "right">("left");
  const [valign, setValign] = useState<"top" | "middle" | "bottom">("middle");
  const [fontColor, setFontColor] = useState("#000000");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fontColorClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [highlightColor, setHighlightColor] = useState("#FFFF00");
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [recentHighlights, setRecentHighlights] = useState<string[]>([]);
  const [isHighlighterMode, setIsHighlighterMode] = useState(false);
  const lastKeyRef = useRef<string>("");

  const [isAllCaps, setIsAllCaps] = useState(false);
  const allCapsSnapshotRef = useRef<string | null>(null);

  const [zoom, setZoom] = useState(100);
  const [autoWrap, setAutoWrap] = useState(true);
  const [lineSpacing, setLineSpacing] = useState<"compact" | "normal" | "relaxed">("normal");
  const [textStats, setTextStats] = useState({ lt: 0, wd: 0, sn: 0 });
  const [linedScroll, setLinedScroll] = useState(0);
  const pageScrollRef = useRef<HTMLDivElement>(null);

  const initializedForId = useRef<number | null>(null);
  const [contentReadyForPid, setContentReadyForPid] = useState<number>(pId);
  const lastSavedContent = useRef(store.getPage(bId, pId)?.content ?? "");
  const tabsRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fontMenuRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const highlightPickerRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const spreadsheetMergeRef = useRef<(() => void) | null>(null);
  const spreadsheetClearRef = useRef<(() => void) | null>(null);
  const spreadsheetInsertRowRef = useRef<(() => void) | null>(null);
  const spreadsheetInsertColRef = useRef<(() => void) | null>(null);
  const spreadsheetCWIncRef = useRef<(() => void) | null>(null);
  const spreadsheetCWDecRef = useRef<(() => void) | null>(null);
  const spreadsheetCTIncRef = useRef<(() => void) | null>(null);
  const spreadsheetCTDecRef = useRef<(() => void) | null>(null);
  const spreadsheetSetAlignRef = useRef<((a: "left" | "center" | "right") => void) | null>(null);
  const spreadsheetSetValignRef = useRef<((a: "top" | "middle" | "bottom") => void) | null>(null);
  const spreadsheetSetFormatRef = useRef<((fmt: Partial<CellFormat>) => void) | null>(null);
  const [activeSheetSizes, setActiveSheetSizes] = useState<{ colWidth: number; rowHeight: number } | null>(null);
  const [mergeState, setMergeState] = useState<{ isMerged: boolean; hasSelection: boolean }>({ isMerged: false, hasSelection: false });
  const spreadsheetCellBorderRef = useRef<((bs: BorderStyle | "none") => void) | null>(null);
  const spreadsheetCutRef = useRef<(() => void) | null>(null);
  const tableResizeRef = useRef<((rows: number, cols: number) => void) | null>(null);
  const [showNRCPopup, setShowNRCPopup] = useState(false);
  const [nrcHover, setNrcHover] = useState<{ r: number; c: number } | null>(null);
  const nrcPopupRef = useRef<HTMLDivElement>(null);
  const [nrcCustomRows, setNrcCustomRows] = useState<string>("");
  const [nrcCustomCols, setNrcCustomCols] = useState<string>("");

  const [showFontSizePopup, setShowFontSizePopup] = useState(false);
  const [showBorderPopup, setShowBorderPopup] = useState(false);
  const [selectedBorderStyle, setSelectedBorderStyle] = useState<BorderStyle | "none">("single");
  const fontSizePopupRef = useRef<HTMLDivElement>(null);
  const borderPopupRef = useRef<HTMLDivElement>(null);
  const [showAlignPopup, setShowAlignPopup] = useState(false);
  const alignPopupRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const lineHeightPx = lineSpacing === "compact" ? 28 : lineSpacing === "relaxed" ? 44 : 36;

  const refresh = useCallback(() => {
    setBook(store.getBook(bId) ?? null);
    setPages(store.listPages(bId));
    const p = store.getPage(bId, pId);
    setPage(p ?? null);
  }, [bId, pId]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (page && page.id === pId && initializedForId.current !== pId) {
      initializedForId.current = pId;
      const c = page.content;
      setContent(c);
      setPageTitle(page.title);
      lastSavedContent.current = c;
      setContentReadyForPid(pId);
      if (editorRef.current) {
        editorRef.current.innerHTML = c;
      }
    }
  }, [page, pId]);

  useEffect(() => {
    if (showTrash) setTrashedPages(store.listTrashedPages(bId));
  }, [showTrash, bId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // If the click is inside a portal popup, let the click through — don't close anything.
      // (Portal popups are rendered in document.body outside the anchor refs.)
      if ((e.target as HTMLElement).closest?.('[data-portal-popup]')) return;
      if (fontMenuRef.current && !fontMenuRef.current.contains(target)) {
        setShowFontMenu(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(target)) {
        setShowColorPicker(false);
      }
      if (highlightPickerRef.current && !highlightPickerRef.current.contains(target)) {
        setShowHighlightPicker(false);
      }
      if (fontSizePopupRef.current && !fontSizePopupRef.current.contains(target)) {
        setShowFontSizePopup(false);
      }
      if (borderPopupRef.current && !borderPopupRef.current.contains(target)) {
        setShowBorderPopup(false);
      }
      if (pageTypePickerRef.current && !pageTypePickerRef.current.contains(target)) {
        setShowPageTypePicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const savePage = useCallback(
    (html: string, title?: string) => {
      const resolvedTitle = title ?? pageTitle;
      setSaveStatus("saving");
      store.updatePage(bId, pId, { content: html, title: resolvedTitle });
      setSaveStatus("saved");
      lastSavedContent.current = html;
    },
    [bId, pId, pageTitle]
  );

  useEffect(() => {
    if (!editorRef.current) return;
    applySearchHighlights(editorRef.current, searchTerm);
  }, [searchTerm]);

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const clone = editorRef.current.cloneNode(true) as HTMLElement;
    removeSearchHighlights(clone);
    const html = clone.innerHTML;
    setContent(html);
    const plain = editorRef.current?.innerText ?? "";
    const lt = plain.replace(/\s/g, "").length;
    const wd = plain.trim() ? plain.trim().split(/\s+/).length : 0;
    const sn = plain.trim() ? plain.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
    setTextStats({ lt, wd, sn });
  };

  useEffect(() => {
    if (initializedForId.current !== pId) return;
    const timer = setTimeout(() => {
      if (content !== lastSavedContent.current) {
        savePage(content);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [content, pId, savePage]);

  useEffect(() => {
    const onBeforeUnload = () => {
      if (content !== lastSavedContent.current) {
        store.updatePage(bId, pId, { content, title: pageTitle });
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [content, bId, pId, pageTitle]);

  const hasSelection = () => {
    const sel = window.getSelection();
    return sel && sel.toString().length > 0;
  };

  const updateActiveFormats = () => {
    const selected = hasSelection();
    setActiveFormats({
      bold: selected ? document.queryCommandState("bold") : false,
      italic: selected ? document.queryCommandState("italic") : false,
      underline: selected ? document.queryCommandState("underline") : false,
      strikeThrough: selected ? document.queryCommandState("strikeThrough") : false,
      overline: false,
    });
    const al = document.queryCommandValue("justifyLeft") === "true"
      ? "left"
      : document.queryCommandValue("justifyCenter") === "true"
      ? "center"
      : document.queryCommandValue("justifyRight") === "true"
      ? "right"
      : "left";
    setAlign(al as "left" | "center" | "right");
  };

  const execInlineFormat = (cmd: string) => {
    if (pageType === "spreadsheet" || pageType === "table") {
      if (cmd === "bold") spreadsheetSetFormatRef.current?.({ bold: !activeFormats.bold });
      else if (cmd === "italic") spreadsheetSetFormatRef.current?.({ italic: !activeFormats.italic });
      else if (cmd === "underline") spreadsheetSetFormatRef.current?.({ underline: !activeFormats.underline });
      else if (cmd === "strikeThrough") spreadsheetSetFormatRef.current?.({ strikeThrough: !activeFormats.strikeThrough });
      return;
    }
    if (!hasSelection()) return;
    editorRef.current?.focus();
    document.execCommand(cmd, false);
    handleEditorInput();
    updateActiveFormats();
  };

  const execFormat = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    handleEditorInput();
    updateActiveFormats();
  };

  const handleFontChange = (f: string) => {
    setFont(f);
    setShowFontMenu(false);
    if (pageType === "spreadsheet" || pageType === "table") { spreadsheetSetFormatRef.current?.({ fontFamily: f }); return; }
    execFormat("fontName", f);
  };

  const handleFontSizeChange = (delta: number) => {
    const newSize = Math.max(8, Math.min(72, fontSize + delta));
    setFontSize(newSize);
    if (pageType === "spreadsheet" || pageType === "table") { spreadsheetSetFormatRef.current?.({ fontSize: newSize }); return; }
    editorRef.current?.focus();
    const size = newSize <= 10 ? 1 : newSize <= 13 ? 2 : newSize <= 16 ? 3 : newSize <= 18 ? 4 : newSize <= 24 ? 5 : newSize <= 32 ? 6 : 7;
    document.execCommand("fontSize", false, String(size));
    handleEditorInput();
  };

  const restoreSelection = () => {
    if (!savedRangeRef.current) return false;
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
    return true;
  };

  const handleFontColor = (color: string, addToRecent = false) => {
    setFontColor(color);
    setShowColorPicker(false);
    if (addToRecent) {
      setRecentColors(prev => {
        const filtered = prev.filter(c => c !== color);
        return [color, ...filtered].slice(0, 10);
      });
    }
    if (pageType === "spreadsheet" || pageType === "table") { spreadsheetSetFormatRef.current?.({ fontColor: color }); return; }
    editorRef.current?.focus();
    if (!hasSelection()) {
      if (!restoreSelection()) return;
    }
    document.execCommand("foreColor", false, color);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    savedRangeRef.current = null;
    handleEditorInput();
    // Defer the color reset to the next tick so the browser fully processes
    // the selection change first — doing it synchronously locks the cursor.
    setTimeout(() => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      document.execCommand("foreColor", false, "#000000");
    }, 0);
  };

  // Single click → apply saved fontColor to selected text only (no selection = do nothing)
  const handleFontColorButtonClick = () => {
    if (fontColorClickTimerRef.current) return; // double-click in progress
    fontColorClickTimerRef.current = setTimeout(() => {
      fontColorClickTimerRef.current = null;
      if (!hasSelection()) return;
      handleFontColor(fontColor);
    }, 220);
  };

  // Double click → open color picker
  const handleFontColorButtonDblClick = () => {
    if (fontColorClickTimerRef.current) {
      clearTimeout(fontColorClickTimerRef.current);
      fontColorClickTimerRef.current = null;
    }
    setShowColorPicker(v => !v);
  };

  const handleHighlightColor = (color: string, addToRecent = false) => {
    setHighlightColor(color);
    setShowHighlightPicker(false);
    if (addToRecent) {
      setRecentHighlights(prev => {
        const filtered = prev.filter(c => c !== color);
        return [color, ...filtered].slice(0, 10);
      });
    }
    if (pageType === "spreadsheet" || pageType === "table") { spreadsheetSetFormatRef.current?.({ highlightColor: color }); return; }
    editorRef.current?.focus();
    if (!hasSelection()) {
      if (!restoreSelection()) return;
    }
    document.execCommand("hiliteColor", false, color);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    savedRangeRef.current = null;
    // Enter highlighter mode — new typing will stay highlighted.
    // Double space will exit the mode.
    setIsHighlighterMode(true);
    lastKeyRef.current = "";
    handleEditorInput();
  };

  const exitHighlighterMode = useCallback(() => {
    setIsHighlighterMode(false);
    lastKeyRef.current = "";
    if (!editorRef.current) return;

    editorRef.current.focus();

    // Move cursor outside any background-colored (highlighted) ancestor span
    // so new typed characters don't inherit the highlight color.
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).endContainer;
      while (node && node !== editorRef.current) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const bg = el.style.backgroundColor;
          if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") {
            const parent = el.parentNode;
            if (parent) {
              const newRange = document.createRange();
              const idx = Array.from(parent.childNodes).indexOf(el as ChildNode);
              newRange.setStart(parent, idx + 1);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
            break;
          }
        }
        node = node.parentNode as Node;
      }
    }

    // Defer so the browser finishes DOM updates, then fully reset typing state:
    // removeFormat clears the browser's "next-char background" cache,
    // foreColor re-pins new text to black.
    setTimeout(() => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      document.execCommand("removeFormat", false);
      document.execCommand("foreColor", false, "#000000");
    }, 0);
  }, []);

  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isHighlighterMode && e.key === " " && lastKeyRef.current === " ") {
      // Double space → delete the first space already inserted, then exit mode
      e.preventDefault();
      document.execCommand("delete", false);
      exitHighlighterMode();
      return;
    }
    lastKeyRef.current = e.key;
  }, [isHighlighterMode, exitHighlighterMode]);

  const handleNeutral = () => {
    editorRef.current?.focus();
    document.execCommand("removeFormat", false);
    document.execCommand("justifyLeft", false);
    setActiveFormats({ bold: false, italic: false, underline: false, strikeThrough: false, overline: false });
    setAlign("left");
    handleEditorInput();
  };

  const handleAllCaps = () => {
    const editor = editorRef.current;
    if (!editor) return;

    if (isAllCaps) {
      if (allCapsSnapshotRef.current !== null) {
        editor.innerHTML = allCapsSnapshotRef.current;
        allCapsSnapshotRef.current = null;
        handleEditorInput();
      }
      setIsAllCaps(false);
      return;
    }

    const sel = window.getSelection();
    const hasTextSelected = sel && sel.rangeCount > 0 && !sel.isCollapsed && sel.toString().trim().length > 0;

    allCapsSnapshotRef.current = editor.innerHTML;

    if (hasTextSelected) {
      const range = sel.getRangeAt(0);
      const fragment = range.extractContents();
      const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.textContent) node.textContent = node.textContent.toUpperCase();
      }
      range.insertNode(fragment);
      sel.removeAllRanges();
    } else {
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        if (node.textContent) node.textContent = node.textContent.toUpperCase();
      }
    }

    setIsAllCaps(true);
    handleEditorInput();
  };

  const handleCopy = async () => {
    const sel = window.getSelection();
    const selectedText = sel?.toString() || editorRef.current?.innerText || "";
    try {
      await navigator.clipboard.writeText(selectedText);
    } catch {
      document.execCommand("copy");
    }
  };

  const handlePaste = async () => {
    editorRef.current?.focus();
    try {
      const text = await navigator.clipboard.readText();
      document.execCommand("insertText", false, text);
      handleEditorInput();
    } catch {
      document.execCommand("paste");
    }
  };

  const handleUndo = () => {
    editorRef.current?.focus();
    document.execCommand("undo");
    handleEditorInput();
    updateActiveFormats();
  };

  const handleRedo = () => {
    editorRef.current?.focus();
    document.execCommand("redo");
    handleEditorInput();
    updateActiveFormats();
  };

  const handleDelete = () => {
    store.deletePage(bId, pId);
    refresh();
    setLocation(`/books/${bId}`);
  };

  const handleCreatePage = () => {
    setShowPageTypePicker(v => !v);
  };

  const handleCreatePageWithType = (type: PageType) => {
    setShowPageTypePicker(false);
    const newPage = store.createPage(bId, { title: `PAGE ${pages.length + 1}`, content: "", pageType: type });
    refresh();
    setLocation(`/books/${bId}/pages/${newPage.id}`);
  };

  const handleRestore = (pid: number) => {
    store.restorePage(bId, pid);
    setTrashedPages(store.listTrashedPages(bId));
    refresh();
  };

  const handlePermanentDelete = (pid: number) => {
    if (confirm("Permanently delete this page? This cannot be undone.")) {
      store.permanentDeletePage(bId, pid);
      setTrashedPages(store.listTrashedPages(bId));
    }
  };

  const scrollTabs = (dir: "left" | "right") => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
    }
  };

  const currentIndex = pages.findIndex((p) => p.id === pId);
  const prevPage = pages[currentIndex - 1];
  const nextPage = pages[currentIndex + 1];

  if (!page) return <Redirect to="/" />;

  const pageType = page.pageType ?? "blank";
  const btnBase = "rounded-md border border-zinc-300 bg-white hover:bg-blue-50 hover:border-blue-300 active:bg-blue-100 transition-colors flex items-center justify-center";
  const btnSq = `w-8 h-8 ${btnBase}`;
  const btnActive = "bg-zinc-200 border-zinc-500";

  // Shared color picker panel components
  const themeColorRows = [
    ["#FFFFFF","#F2F2F2","#EEECE1","#DCE6F1","#DBE5F1","#E8D5F0","#F2DCDB","#FDE9D9","#EBF1DE","#DAEEF3"],
    ["#F2F2F2","#D9D9D9","#DDD9C4","#C6D9F1","#B8CCE4","#D198E8","#E6B8B7","#FBBF7C","#D8E4BC","#B7DEE8"],
    ["#D9D9D9","#BFBFBF","#C4BD97","#8DB4E2","#95B3D7","#8064A2","#DA9694","#F79646","#C4D79B","#92CDDC"],
    ["#BFBFBF","#808080","#948A54","#548DD4","#4F81BD","#7030A0","#C0504D","#E36C09","#9BBB59","#4BACC6"],
    ["#808080","#595959","#494429","#17375E","#366092","#60497A","#963634","#974806","#76933C","#31849B"],
    ["#595959","#262626","#1D1B10","#0F243E","#243F60","#3F3151","#632523","#6A3400","#4F6228","#215868"],
  ];
  const standardColors = ["#C00000","#FF0000","#FFC000","#FFFF00","#92D050","#00B050","#00B0F0","#0070C0","#002060","#7030A0"];

  const FontColorPanel = ({ noAbsolute }: { noAbsolute?: boolean } = {}) => (
    <div className={(noAbsolute ? "" : "absolute top-full left-0 mt-1 z-50 ") + "bg-white border border-zinc-300 rounded-lg shadow-xl p-3 w-[220px]"}>
      <button onClick={() => handleFontColor("#000000")} className="flex items-center gap-2 w-full px-1 py-1 hover:bg-zinc-100 rounded text-xs text-zinc-700 mb-2 border border-zinc-200">
        <div className="w-5 h-5 border border-zinc-400 bg-black shrink-0" />
        <span className="font-medium">Automatic</span>
      </button>
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Theme Colors</div>
      <div className="grid grid-cols-10 gap-[3px] mb-1">
        {themeColorRows.map((row, ri) => row.map((c, ci) => (
          <button key={`${ri}-${ci}`} onClick={() => handleFontColor(c)} className="w-[18px] h-[18px] border border-zinc-200 hover:scale-110 hover:border-zinc-500 transition-transform" style={{ backgroundColor: c }} title={c} />
        )))}
      </div>
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 mt-2">Standard Colors</div>
      <div className="flex gap-[3px] mb-2">
        {standardColors.map(c => (
          <button key={c} onClick={() => handleFontColor(c)} className="w-[18px] h-[18px] border border-zinc-200 hover:scale-110 hover:border-zinc-500 transition-transform" style={{ backgroundColor: c }} title={c} />
        ))}
      </div>
      {recentColors.length > 0 && (
        <>
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 mt-2">Recent Colors</div>
          <div className="flex gap-[3px] mb-2 flex-wrap">
            {recentColors.map((c, i) => (
              <button key={i} onClick={() => handleFontColor(c)} className="w-[18px] h-[18px] border border-zinc-200 hover:scale-110 hover:border-zinc-500 transition-transform" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        </>
      )}
      <button
        onClick={() => {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
          const input = document.createElement("input");
          input.type = "color"; input.value = fontColor;
          input.onchange = () => handleFontColor(input.value, true);
          input.click();
        }}
        className="w-full text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded px-2 py-1 text-left border border-zinc-200 transition-colors"
      >🎨 More Colors...</button>
    </div>
  );

  const HighlightPanel = ({ noAbsolute }: { noAbsolute?: boolean } = {}) => (
    <div className={(noAbsolute ? "" : "absolute top-full left-0 mt-1 z-50 ") + "bg-white border border-zinc-300 rounded-lg shadow-xl p-3 w-[220px]"}>
      <button onClick={() => handleHighlightColor("transparent")} className="flex items-center gap-2 w-full px-1 py-1 hover:bg-zinc-100 rounded text-xs text-zinc-700 mb-2 border border-zinc-200">
        <div className="w-5 h-5 border border-zinc-400 bg-white shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center text-red-400 font-bold text-xs">∅</div>
        </div>
        <span className="font-medium">No Fill</span>
      </button>
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Theme Colors</div>
      <div className="grid grid-cols-10 gap-[3px] mb-1">
        {themeColorRows.map((row, ri) => row.map((c, ci) => (
          <button key={`h-${ri}-${ci}`} onClick={() => handleHighlightColor(c)} className="w-[18px] h-[18px] border border-zinc-200 hover:scale-110 hover:border-zinc-500 transition-transform" style={{ backgroundColor: c }} title={c} />
        )))}
      </div>
      <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 mt-2">Standard Colors</div>
      <div className="flex gap-[3px] mb-2">
        {standardColors.map(c => (
          <button key={c} onClick={() => handleHighlightColor(c)} className="w-[18px] h-[18px] border border-zinc-200 hover:scale-110 hover:border-zinc-500 transition-transform" style={{ backgroundColor: c }} title={c} />
        ))}
      </div>
      {recentHighlights.length > 0 && (
        <>
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 mt-2">Recent Colors</div>
          <div className="flex gap-[3px] mb-2 flex-wrap">
            {recentHighlights.map((c, i) => (
              <button key={i} onClick={() => handleHighlightColor(c)} className="w-[18px] h-[18px] border border-zinc-200 hover:scale-110 hover:border-zinc-500 transition-transform" style={{ backgroundColor: c }} title={c} />
            ))}
          </div>
        </>
      )}
      <button
        onClick={() => {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
          const input = document.createElement("input");
          input.type = "color"; input.value = highlightColor;
          input.onchange = () => handleHighlightColor(input.value, true);
          input.click();
        }}
        className="w-full text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded px-2 py-1 text-left border border-zinc-200 transition-colors"
      >🎨 More Colors...</button>
    </div>
  );

  const DeleteGroup = () => (
    <div className="border border-zinc-400 rounded-lg p-1.5 shrink-0">
      <div className="flex flex-col gap-1">
        <button onClick={handleDelete} title="Move to trash" className={`${btnSq} hover:bg-red-50 hover:border-red-400 active:bg-red-100`}>
          <Trash2 className="w-4 h-4 text-zinc-500" />
        </button>
        <button onClick={() => setShowTrash(true)} title="Open trash" className={btnSq}>
          <ArchiveRestore className="w-4 h-4 text-zinc-500" />
        </button>
      </div>
    </div>
  );

  // Common groups shared across all 3 toolbars
  const CommonGroups = () => (
    <>
      {/* Box 1 — Copy + Paste (tall, stacked) */}
      <div className="border border-zinc-400 rounded-lg p-1.5">
        <div className="flex flex-col gap-1">
          <button onClick={handleCopy} title="Copy" className={btnSq} style={{ fontSize: 18 }}>✊🏻</button>
          <button onClick={handlePaste} title="Paste" className={`${btnSq} text-base`}>📑</button>
        </div>
      </div>

      {/* Box 2 — Undo + Redo (tall, stacked) */}
      <div className="border border-zinc-400 rounded-lg p-1.5">
        <div className="flex flex-col gap-1">
          <button onClick={handleUndo} title="Undo" className={`${btnSq} text-base`}>↩</button>
          <button onClick={handleRedo} title="Redo" className={`${btnSq} text-base`}>↪</button>
        </div>
      </div>

      {/* Box 3 — Zoom Out + Zoom In (tall, stacked) */}
      <div className="border border-zinc-400 rounded-lg p-1.5">
        <div className="flex flex-col gap-1">
          <button onClick={() => setZoom(z => Math.min(200, z + 10))} title={`Zoom in (${zoom}%)`} className={btnSq}>
            <span className="font-bold text-base leading-none text-zinc-600">+</span>
          </button>
          <button onClick={() => setZoom(z => Math.max(50, z - 10))} title={`Zoom out (${zoom}%)`} className={btnSq}>
            <span className="font-bold text-base leading-none text-zinc-600">−</span>
          </button>
        </div>
      </div>

      {/* Group 2 — Font, Size, Color, Bold, Underline, Strikethrough, Overline */}
      <div className="border border-zinc-400 rounded-lg p-1.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <div className="relative" ref={fontMenuRef}>
              <button onClick={() => setShowFontMenu(v => !v)} className="w-36 h-8 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 transition-colors px-2 text-left text-sm font-medium text-zinc-700 truncate" style={{ fontFamily: font }}>
                {font}
              </button>
              {showFontMenu && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-zinc-300 rounded-lg shadow-lg overflow-y-auto max-h-52 w-44">
                  {FONTS.map(f => (
                    <button key={f} onClick={() => handleFontChange(f)} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 transition-colors ${font === f ? "bg-zinc-100 font-semibold" : ""}`} style={{ fontFamily: f }}>{f}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-8 h-8 rounded-md border border-zinc-300 bg-white flex items-center justify-center text-xs font-semibold text-zinc-700 select-none">{fontSize}</div>
            <button onClick={() => handleFontSizeChange(2)} title="Increase font size" className={btnSq}><span className="font-bold text-base leading-none">A</span></button>
            <button onClick={() => handleFontSizeChange(-2)} title="Decrease font size" className={btnSq}><span className="font-bold text-xs leading-none">A</span></button>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative" ref={colorPickerRef}>
              <button onClick={handleFontColorButtonClick} onDoubleClick={handleFontColorButtonDblClick} title="Font color (single-click: apply, double-click: pick color)" className={btnSq}>
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span className="font-bold text-sm leading-none" style={{ color: fontColor }}>A</span>
                  <div className="w-5 h-1 rounded-sm" style={{ backgroundColor: fontColor }} />
                </div>
              </button>
              {showColorPicker && <FontColorPanel />}
            </div>
            <div className="relative" ref={highlightPickerRef}>
              <button onClick={() => setShowHighlightPicker(v => !v)} title="Highlight color (double-space to exit mode)" className={`${btnSq} ${isHighlighterMode ? btnActive : ""}`}>
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span className="font-bold text-sm leading-none text-zinc-700">A</span>
                  <div className="w-5 h-1.5 rounded-sm" style={{ backgroundColor: highlightColor }} />
                </div>
              </button>
              {showHighlightPicker && <HighlightPanel />}
            </div>
            <button className={btnSq} />
            <button onClick={() => execInlineFormat("bold")} title="Bold (select text first)" className={`${btnSq} ${activeFormats.bold ? btnActive : ""}`}><span className="font-black text-sm">B</span></button>
            <button onClick={() => execInlineFormat("underline")} title="Underline (select text first)" className={`${btnSq} ${activeFormats.underline ? btnActive : ""}`}><span className="text-sm underline decoration-red-500 decoration-[3px]">U</span></button>
            <button onClick={() => execInlineFormat("strikeThrough")} title="Strikethrough (select text first)" className={`${btnSq} ${activeFormats.strikeThrough ? btnActive : ""}`}><span className="text-sm line-through decoration-red-500 decoration-[3px]">U</span></button>
            <button onClick={() => execInlineFormat("underline")} title="Overline (select text first)" className={btnSq}>
              <span className="text-sm" style={{ textDecoration: "overline", textDecorationColor: "red", textDecorationThickness: "3px" }}>U</span>
            </button>
          </div>
        </div>
      </div>

      {/* Group 3 — Alignment (2×2 grid: Left, Center, Right, N) */}
      <div className="border border-zinc-400 rounded-lg p-1.5">
        <div className="grid grid-cols-2 gap-1">
          {/* Left align */}
          <button onClick={() => { if (pageType === "spreadsheet") { spreadsheetSetAlignRef.current?.("left"); } else { execFormat("justifyLeft"); } setAlign("left"); }} title="Align left" className={`${btnSq} ${align === "left" ? btnActive : ""}`}>
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="9" height="2" rx="1"/><rect x="1" y="12" width="12" height="2" rx="1"/></svg>
          </button>
          {/* Center align */}
          <button onClick={() => { if (pageType === "spreadsheet") { spreadsheetSetAlignRef.current?.("center"); } else { execFormat("justifyCenter"); } setAlign("center"); }} title="Align center" className={`${btnSq} ${align === "center" ? btnActive : ""}`}>
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3.5" y="7" width="9" height="2" rx="1"/><rect x="2" y="12" width="12" height="2" rx="1"/></svg>
          </button>
          {/* Right align */}
          <button onClick={() => { if (pageType === "spreadsheet") { spreadsheetSetAlignRef.current?.("right"); } else { execFormat("justifyRight"); } setAlign("right"); }} title="Align right" className={`${btnSq} ${align === "right" ? btnActive : ""}`}>
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="6" y="7" width="9" height="2" rx="1"/><rect x="3" y="12" width="12" height="2" rx="1"/></svg>
          </button>
          {/* N — Neutral / clear all formatting */}
          <button onClick={handleNeutral} title="Clear formatting (Neutral)" className={`${btnSq} text-[11px] font-bold text-zinc-600`}>
            N
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">

      {/* ═══════════════════════════════════════════════════════
          EDIT CARD — common buttons in all 3, plus page-specific extras
          ═══════════════════════════════════════════════════════ */}

      {pageType === "spreadsheet" ? (
        /* ── SPREADSHEET TOOLBAR — new flat single-row design ── */
        <div className="bg-[#ece9e3] px-3 pt-2 pb-1.5 shrink-0">

          {/* SINGLE CARD — top row (inactive) + bottom row (toolbar) */}
          <div className="bg-[#f5f2ee] border border-zinc-300 rounded-xl shadow-sm">

            {/* ROW 1 — inactive placeholder boxes */}
            <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
              <button onClick={() => setLocation("/")} className="w-28 h-8 rounded border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5 text-[11px] font-semibold text-zinc-600 shrink-0">🏠 My Notebooks</button>
              <div className="flex-1" />

              <div className="w-64 h-8 rounded border border-zinc-300 bg-white flex items-center px-2 gap-1 shrink-0"><span className="text-zinc-400 text-xs">🔍</span><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search in page..." className="flex-1 bg-transparent text-[11px] text-zinc-700 outline-none placeholder:text-zinc-400" />{searchTerm && <button onClick={() => setSearchTerm("")} className="text-zinc-400 hover:text-zinc-600 text-xs leading-none">✕</button>}</div>
              <button onClick={handleCreatePage} className="w-28 h-8 rounded border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors flex items-center justify-center text-[11px] font-semibold text-zinc-600 shrink-0">+ New Page</button>
            </div>

            {/* ROW 2 — single flat horizontal toolbar */}
          <div className="mx-3 mb-2 bg-[#f0ede8] border border-zinc-200/80 rounded-xl shadow-[inset_0_2px_3px_rgba(0,0,0,0.05)] px-3 py-1.5 flex items-center gap-1 overflow-x-auto">

            {/* copy | paste | cut — joined */}
            <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
              <button onClick={handleCopy} title="Copy" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">🗐</button>
              <button onClick={handlePaste} title="Paste" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">📝</button>
              <button onClick={() => spreadsheetCutRef.current?.()} title="Cut" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center">✂</button>
            </div>

            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />

            {/* undo | redo — joined */}
            <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
              <button onClick={handleUndo} title="Undo" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">↻</button>
              <button onClick={handleRedo} title="Redo" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center">↺</button>
            </div>

            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />

            {/* zoom in | zoom out — joined */}
            <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
              <button onClick={() => setZoom(z => Math.min(200, z + 10))} title="Zoom in" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">⌞+</button>
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} title="Zoom out" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center">–⌝</button>
            </div>

            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />

            {/* Font family */}
            <div className="relative shrink-0" ref={fontMenuRef as React.RefObject<HTMLDivElement>}>
              <button onClick={() => setShowFontMenu(v => !v)} className="h-8 px-2 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 transition-colors text-left text-sm font-medium text-zinc-700 truncate w-[152px]" style={{ fontFamily: font }}>
                {font}
              </button>
              <PortalPopup anchorRef={fontMenuRef} open={showFontMenu}>
                <div className="bg-white border border-zinc-300 rounded-lg shadow-lg overflow-y-auto max-h-52 w-44">
                  {FONTS.map(f => (
                    <button key={f} onClick={() => handleFontChange(f)} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 transition-colors ${font === f ? "bg-zinc-100 font-semibold" : ""}`} style={{ fontFamily: f }}>{f}</button>
                  ))}
                </div>
              </PortalPopup>
            </div>

            {/* Font size: current size button (click→popup) + A↑ A↓ */}
            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
            <div className="relative shrink-0" ref={fontSizePopupRef as React.RefObject<HTMLDivElement>}>
              <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                <button
                  onClick={() => setShowFontSizePopup(v => !v)}
                  title="Font size"
                  className="w-9 h-8 bg-white hover:bg-zinc-100 transition-colors text-xs font-semibold text-zinc-700 flex items-center justify-center border-r border-zinc-300"
                >{fontSize}</button>
                <button onClick={() => handleFontSizeChange(2)} title="Increase font size" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center"><span className="font-bold text-base leading-none">A</span></button>
                <button onClick={() => handleFontSizeChange(-2)} title="Decrease font size" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center"><span className="font-bold text-xs leading-none">A</span></button>
              </div>
              <PortalPopup anchorRef={fontSizePopupRef} open={showFontSizePopup}>
                <div className="bg-white border border-zinc-300 rounded-lg shadow-xl p-1.5 w-24 grid grid-cols-2 gap-1">
                  {[8,9,10,11,12,14,16,18,20,22,24,28,32,36,48,72].map(s => (
                    <button key={s} onClick={() => { handleFontSizeChange(s - fontSize); setShowFontSizePopup(false); }} className={`h-7 rounded text-xs font-medium transition-colors ${fontSize === s ? "bg-zinc-800 text-white" : "hover:bg-zinc-100 text-zinc-700"}`}>{s}</button>
                  ))}
                </div>
              </PortalPopup>
            </div>

            {/* AB — All Caps toggle */}
            <button onClick={handleAllCaps} title="All caps (toggle)" className={`${btnSq} ${isAllCaps ? btnActive : ""}`}><span className="font-black text-[11px] tracking-tight">AB</span></button>

            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />

            {/* B I U Ŭ + font color + highlight */}
            <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
              <button onClick={() => execInlineFormat("bold")} title="Bold" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center ${activeFormats.bold ? "bg-zinc-200" : ""}`}><span className="font-black text-sm">B</span></button>
              <button onClick={() => execInlineFormat("italic")} title="Italic" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center ${activeFormats.italic ? "bg-zinc-200" : ""}`}><span className="italic font-bold text-sm">I</span></button>
              <button onClick={() => execInlineFormat("underline")} title="Underline" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center ${activeFormats.underline ? "bg-zinc-200" : ""}`}><span className="text-sm underline decoration-red-500 decoration-[3px]">U</span></button>
              <button onClick={() => execInlineFormat("strikeThrough")} title="Strikethrough" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center ${activeFormats.strikeThrough ? "bg-zinc-200" : ""}`}><span className="text-sm line-through decoration-red-500 decoration-[3px]">U</span></button>
            </div>

            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />

            {/* Font color */}
            <div className="relative" ref={colorPickerRef as React.RefObject<HTMLDivElement>}>
              <button onClick={handleFontColorButtonClick} onDoubleClick={handleFontColorButtonDblClick} title="Font color (single-click: apply, double-click: pick color)" className={btnSq}>
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span className="font-bold text-sm leading-none" style={{ color: fontColor }}>A</span>
                  <div className="w-5 h-1 rounded-sm" style={{ backgroundColor: fontColor }} />
                </div>
              </button>
              <PortalPopup anchorRef={colorPickerRef} open={showColorPicker}>
                <FontColorPanel noAbsolute />
              </PortalPopup>
            </div>

            {/* Highlight color */}
            <div className="relative" ref={highlightPickerRef as React.RefObject<HTMLDivElement>}>
              <button onClick={() => setShowHighlightPicker(v => !v)} title="Highlight color (double-space to exit mode)" className={`${btnSq} ${isHighlighterMode ? btnActive : ""}`}>
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span className="font-bold text-sm leading-none text-zinc-700">A</span>
                  <div className="w-5 h-1.5 rounded-sm" style={{ backgroundColor: highlightColor }} />
                </div>
              </button>
              <PortalPopup anchorRef={highlightPickerRef} open={showHighlightPicker}>
                <HighlightPanel noAbsolute />
              </PortalPopup>
            </div>

            {/* N — Neutral / clear formatting */}
            <button onClick={handleNeutral} title="Clear formatting" className={`${btnSq} text-[11px] font-bold text-zinc-600`}>N</button>

            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />

            {/* Align — single button opens popup */}
            <div className="relative" ref={alignPopupRef}>
              <button
                onClick={() => setShowAlignPopup(v => !v)}
                title="Text alignment"
                className={`${btnSq} ${align !== "left" ? btnActive : ""}`}
              >
                {align === "center" ? (
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3.5" y="7" width="9" height="2" rx="1"/><rect x="2" y="12" width="12" height="2" rx="1"/></svg>
                ) : align === "right" ? (
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="6" y="7" width="9" height="2" rx="1"/><rect x="3" y="12" width="12" height="2" rx="1"/></svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="9" height="2" rx="1"/><rect x="1" y="12" width="12" height="2" rx="1"/></svg>
                )}
              </button>
              <PortalPopup anchorRef={alignPopupRef} open={showAlignPopup}>
                <div className="bg-white border border-zinc-200 rounded-lg shadow-xl p-1.5 flex items-center gap-1">
                  {/* Left */}
                  <button
                    onClick={() => { spreadsheetSetAlignRef.current?.("left"); setAlign("left"); setShowAlignPopup(false); }}
                    title="Align left"
                    className={`${btnSq} ${align === "left" ? btnActive : ""}`}
                  >
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="9" height="2" rx="1"/><rect x="1" y="12" width="12" height="2" rx="1"/></svg>
                  </button>
                  {/* Center */}
                  <button
                    onClick={() => { spreadsheetSetAlignRef.current?.("center"); setAlign("center"); setShowAlignPopup(false); }}
                    title="Align center"
                    className={`${btnSq} ${align === "center" ? btnActive : ""}`}
                  >
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3.5" y="7" width="9" height="2" rx="1"/><rect x="2" y="12" width="12" height="2" rx="1"/></svg>
                  </button>
                  {/* Right */}
                  <button
                    onClick={() => { spreadsheetSetAlignRef.current?.("right"); setAlign("right"); setShowAlignPopup(false); }}
                    title="Align right"
                    className={`${btnSq} ${align === "right" ? btnActive : ""}`}
                  >
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="6" y="7" width="9" height="2" rx="1"/><rect x="3" y="12" width="12" height="2" rx="1"/></svg>
                  </button>
                  {/* N — Neutral / reset to left */}
                  <button
                    onClick={() => { spreadsheetSetAlignRef.current?.("left"); setAlign("left"); setShowAlignPopup(false); }}
                    title="Neutral (reset alignment)"
                    className={`${btnSq} text-[11px] font-bold text-zinc-600`}
                  >N</button>
                </div>
              </PortalPopup>
            </div>

            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />

            {/* MERGE */}
            <button
              onClick={() => spreadsheetMergeRef.current?.()}
              title={mergeState.isMerged ? "Unmerge cells" : "Merge selected cells"}
              className={`h-8 px-2 rounded-md border transition-colors text-xs font-bold flex items-center justify-center gap-1 ${
                mergeState.isMerged || mergeState.hasSelection
                  ? "border-purple-400 bg-purple-50 hover:bg-purple-100 text-purple-700"
                  : "border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-600"
              }`}
            >MERGE</button>

            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />

            {/* Border split button: ✓ (opens popup) | ⊞ (applies selected style) */}
            <div className="relative flex items-center" ref={borderPopupRef as React.RefObject<HTMLDivElement>}>
              <button
                onClick={() => setShowBorderPopup(v => !v)}
                title="Pick border style"
                className="h-8 px-1.5 rounded-l-md border border-r-0 border-zinc-300 bg-white hover:bg-zinc-100 transition-colors text-zinc-600 flex items-center justify-center"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="2,8 5,11 12,4" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button
                onClick={() => spreadsheetCellBorderRef.current?.(selectedBorderStyle)}
                title="Apply selected border style"
                className="h-8 px-1.5 rounded-r-md border border-zinc-300 bg-white hover:bg-zinc-100 transition-colors text-zinc-600 flex items-center justify-center"
              >
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="1.5" stroke="#444" strokeWidth="1.5"/><line x1="5" y1="1" x2="5" y2="17" stroke="#444" strokeWidth="0.7"/><line x1="9" y1="1" x2="9" y2="17" stroke="#444" strokeWidth="0.7"/><line x1="13" y1="1" x2="13" y2="17" stroke="#444" strokeWidth="0.7"/><line x1="1" y1="5" x2="17" y2="5" stroke="#444" strokeWidth="0.7"/><line x1="1" y1="9" x2="17" y2="9" stroke="#444" strokeWidth="0.7"/><line x1="1" y1="13" x2="17" y2="13" stroke="#444" strokeWidth="0.7"/></svg>
              </button>
              <PortalPopup anchorRef={borderPopupRef} open={showBorderPopup}>
                <div className="bg-white border border-zinc-300 rounded-lg shadow-xl p-2 flex flex-col gap-1 w-36">
                  {([
                    { style: "none" as const, label: "No border", icon: <span className="text-xs font-bold text-zinc-500">N</span> },
                    { style: "single" as const, label: "Single border", icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="1.5" width="15" height="15" rx="1" stroke="#444" strokeWidth="1.5"/></svg> },
                    { style: "double" as const, label: "Double border", icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="1" stroke="#444" strokeWidth="1"/><rect x="3.5" y="3.5" width="11" height="11" rx="0.5" stroke="#444" strokeWidth="1"/></svg> },
                    { style: "bold" as const, label: "Bold border", icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="1" stroke="#222" strokeWidth="3.5"/></svg> },
                  ]).map(({ style, label, icon }) => (
                    <button
                      key={style}
                      onClick={() => { setSelectedBorderStyle(style); setShowBorderPopup(false); }}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${selectedBorderStyle === style ? "bg-zinc-200 font-semibold" : "hover:bg-zinc-100"}`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </PortalPopup>
            </div>

            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />

            {/* CW+ CW- CT+ CT- */}
            {(() => {
              const cw = activeSheetSizes?.colWidth ?? 80;
              const rh = activeSheetSizes?.rowHeight ?? 24;
              const cwBig = cw > 80; const cwSmall = cw < 80;
              const rhBig = rh > 24; const rhSmall = rh < 24;
              return (<>
                <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                  <button onClick={() => spreadsheetCWIncRef.current?.()} title="Widen column" className={`w-8 h-8 text-[10px] font-bold flex items-center justify-center border-r border-zinc-300 transition-colors ${cwBig ? "bg-green-100 text-green-700" : "bg-white text-zinc-600 hover:bg-zinc-100"}`}>CW+</button>
                  <button onClick={() => spreadsheetCWDecRef.current?.()} title="Narrow column" className={`w-8 h-8 text-[10px] font-bold flex items-center justify-center transition-colors ${cwSmall ? "bg-red-100 text-red-700" : "bg-white text-zinc-600 hover:bg-zinc-100"}`}>CW-</button>
                </div>
                <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                  <button onClick={() => spreadsheetCTIncRef.current?.()} title="Increase row height" className={`w-8 h-8 text-[10px] font-bold flex items-center justify-center border-r border-zinc-300 transition-colors ${rhBig ? "bg-green-100 text-green-700" : "bg-white text-zinc-600 hover:bg-zinc-100"}`}>CT+</button>
                  <button onClick={() => spreadsheetCTDecRef.current?.()} title="Decrease row height" className={`w-8 h-8 text-[10px] font-bold flex items-center justify-center transition-colors ${rhSmall ? "bg-red-100 text-red-700" : "bg-white text-zinc-600 hover:bg-zinc-100"}`}>CT-</button>
                </div>
              </>);
            })()}

            {/* Spacer push DEL/TRASH to right */}
            <div className="flex-1" />

            {/* DEL + TRASH group */}
            <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
              <button onClick={handleDelete} title="Move page to trash" className="w-8 h-8 text-base text-zinc-600 bg-white hover:bg-red-50 hover:text-red-600 transition-colors border-r border-zinc-300 flex items-center justify-center">
                🗑️
              </button>
              <button onClick={() => setShowTrash(true)} title="Open trash" className="w-8 h-8 text-base text-zinc-600 bg-white hover:bg-zinc-100 transition-colors flex items-center justify-center">
                ♻
              </button>
            </div>

          </div>{/* end ROW 2 */}
          </div>{/* end CARD */}
        </div>

      ) : pageType === "table" ? (
        /* ── TABLE TOOLBAR — 100% identical to Sheet toolbar ── */
        <div className="bg-[#ece9e3] px-3 pt-2 pb-1.5 shrink-0">
          <div className="bg-[#f5f2ee] border border-zinc-300 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
              <div className="flex-1" />

              <div className="w-64 h-8 rounded border border-zinc-300 bg-white flex items-center px-2 gap-1 shrink-0"><span className="text-zinc-400 text-xs">🔍</span><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search in page..." className="flex-1 bg-transparent text-[11px] text-zinc-700 outline-none placeholder:text-zinc-400" />{searchTerm && <button onClick={() => setSearchTerm("")} className="text-zinc-400 hover:text-zinc-600 text-xs leading-none">✕</button>}</div>
              <button onClick={handleCreatePage} className="w-28 h-8 rounded border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors flex items-center justify-center text-[11px] font-semibold text-zinc-600 shrink-0">+ New Page</button>
            </div>
          <div className="mx-3 mb-2 bg-[#f0ede8] border border-zinc-200/80 rounded-xl shadow-[inset_0_2px_3px_rgba(0,0,0,0.05)] px-3 py-1.5 flex items-center gap-1 overflow-x-auto">
            {/* copy | paste | cut — joined */}
            <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
              <button onClick={handleCopy} title="Copy" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">🗐</button>
              <button onClick={handlePaste} title="Paste" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">📝</button>
              <button onClick={() => spreadsheetCutRef.current?.()} title="Cut (copy + clear)" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center">✂</button>
            </div>
            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
            {/* undo | redo — joined */}
            <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
              <button onClick={handleUndo} title="Undo" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">↻</button>
              <button onClick={handleRedo} title="Redo" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center">↺</button>
            </div>
            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
            {/* zoom in | zoom out — joined */}
            <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
              <button onClick={() => setZoom(z => Math.min(200, z + 10))} title="Zoom in" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">⌞+</button>
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} title="Zoom out" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center">–⌝</button>
            </div>
            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
            <div className="relative shrink-0" ref={fontMenuRef as React.RefObject<HTMLDivElement>}>
              <button onClick={() => setShowFontMenu(v => !v)} className="h-8 px-2 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 transition-colors text-left text-sm font-medium text-zinc-700 truncate w-[152px]" style={{ fontFamily: font }}>{font}</button>
              <PortalPopup anchorRef={fontMenuRef} open={showFontMenu}>
                <div className="bg-white border border-zinc-300 rounded-lg shadow-lg overflow-y-auto max-h-52 w-44">
                  {FONTS.map(f => (<button key={f} onClick={() => handleFontChange(f)} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 transition-colors ${font === f ? "bg-zinc-100 font-semibold" : ""}`} style={{ fontFamily: f }}>{f}</button>))}
                </div>
              </PortalPopup>
            </div>
            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
            <div className="relative shrink-0" ref={fontSizePopupRef as React.RefObject<HTMLDivElement>}>
              <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                <button onClick={() => setShowFontSizePopup(v => !v)} title="Font size" className="w-9 h-8 bg-white hover:bg-zinc-100 transition-colors text-xs font-semibold text-zinc-700 flex items-center justify-center border-r border-zinc-300">{fontSize}</button>
                <button onClick={() => handleFontSizeChange(2)} title="Increase font size" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center"><span className="font-bold text-base leading-none">A</span></button>
                <button onClick={() => handleFontSizeChange(-2)} title="Decrease font size" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center"><span className="font-bold text-xs leading-none">A</span></button>
              </div>
              <PortalPopup anchorRef={fontSizePopupRef} open={showFontSizePopup}>
                <div className="bg-white border border-zinc-300 rounded-lg shadow-xl p-1.5 w-24 grid grid-cols-2 gap-1">
                  {[8,9,10,11,12,14,16,18,20,22,24,28,32,36,48,72].map(s => (<button key={s} onClick={() => { handleFontSizeChange(s - fontSize); setShowFontSizePopup(false); }} className={`h-7 rounded text-xs font-medium transition-colors ${fontSize === s ? "bg-zinc-800 text-white" : "hover:bg-zinc-100 text-zinc-700"}`}>{s}</button>))}
                </div>
              </PortalPopup>
            </div>
            <button onClick={handleAllCaps} title="All caps (toggle)" className={`${btnSq} ${isAllCaps ? btnActive : ""}`}><span className="font-black text-[11px] tracking-tight">AB</span></button>
            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
            <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
              <button onClick={() => execInlineFormat("bold")} title="Bold" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center ${activeFormats.bold ? "bg-zinc-200" : ""}`}><span className="font-black text-sm">B</span></button>
              <button onClick={() => execInlineFormat("italic")} title="Italic" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center ${activeFormats.italic ? "bg-zinc-200" : ""}`}><span className="italic font-bold text-sm">I</span></button>
              <button onClick={() => execInlineFormat("underline")} title="Underline" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center ${activeFormats.underline ? "bg-zinc-200" : ""}`}><span className="text-sm underline decoration-red-500 decoration-[3px]">U</span></button>
              <button onClick={() => execInlineFormat("strikeThrough")} title="Strikethrough" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center ${activeFormats.strikeThrough ? "bg-zinc-200" : ""}`}><span className="text-sm line-through decoration-red-500 decoration-[3px]">U</span></button>
            </div>
            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
            <div className="relative" ref={colorPickerRef as React.RefObject<HTMLDivElement>}>
              <button onClick={handleFontColorButtonClick} onDoubleClick={handleFontColorButtonDblClick} title="Font color" className={btnSq}>
                <div className="flex flex-col items-center justify-center gap-0.5"><span className="font-bold text-sm leading-none" style={{ color: fontColor }}>A</span><div className="w-5 h-1 rounded-sm" style={{ backgroundColor: fontColor }} /></div>
              </button>
              <PortalPopup anchorRef={colorPickerRef} open={showColorPicker}><FontColorPanel noAbsolute /></PortalPopup>
            </div>
            <div className="relative" ref={highlightPickerRef as React.RefObject<HTMLDivElement>}>
              <button onClick={() => setShowHighlightPicker(v => !v)} title="Highlight color" className={`${btnSq} ${isHighlighterMode ? btnActive : ""}`}>
                <div className="flex flex-col items-center justify-center gap-0.5"><span className="font-bold text-sm leading-none text-zinc-700">A</span><div className="w-5 h-1.5 rounded-sm" style={{ backgroundColor: highlightColor }} /></div>
              </button>
              <PortalPopup anchorRef={highlightPickerRef} open={showHighlightPicker}><HighlightPanel noAbsolute /></PortalPopup>
            </div>
            <button onClick={handleNeutral} title="Clear formatting" className={`${btnSq} text-[11px] font-bold text-zinc-600`}>N</button>
            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
            <div className="relative" ref={alignPopupRef}>
              <button onClick={() => setShowAlignPopup(v => !v)} title="Text alignment" className={`${btnSq} ${align !== "left" ? btnActive : ""}`}>
                {align === "center" ? (<svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3.5" y="7" width="9" height="2" rx="1"/><rect x="2" y="12" width="12" height="2" rx="1"/></svg>) : align === "right" ? (<svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="6" y="7" width="9" height="2" rx="1"/><rect x="3" y="12" width="12" height="2" rx="1"/></svg>) : (<svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="9" height="2" rx="1"/><rect x="1" y="12" width="12" height="2" rx="1"/></svg>)}
              </button>
              <PortalPopup anchorRef={alignPopupRef} open={showAlignPopup}>
                <div className="bg-white border border-zinc-200 rounded-lg shadow-xl p-1.5 flex items-center gap-1">
                  <button onClick={() => { spreadsheetSetAlignRef.current?.("left"); setAlign("left"); setShowAlignPopup(false); }} title="Align left" className={`${btnSq} ${align === "left" ? btnActive : ""}`}><svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="9" height="2" rx="1"/><rect x="1" y="12" width="12" height="2" rx="1"/></svg></button>
                  <button onClick={() => { spreadsheetSetAlignRef.current?.("center"); setAlign("center"); setShowAlignPopup(false); }} title="Align center" className={`${btnSq} ${align === "center" ? btnActive : ""}`}><svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3.5" y="7" width="9" height="2" rx="1"/><rect x="2" y="12" width="12" height="2" rx="1"/></svg></button>
                  <button onClick={() => { spreadsheetSetAlignRef.current?.("right"); setAlign("right"); setShowAlignPopup(false); }} title="Align right" className={`${btnSq} ${align === "right" ? btnActive : ""}`}><svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="6" y="7" width="9" height="2" rx="1"/><rect x="3" y="12" width="12" height="2" rx="1"/></svg></button>
                  <button onClick={() => { spreadsheetSetAlignRef.current?.("left"); setAlign("left"); setShowAlignPopup(false); }} title="Neutral" className={`${btnSq} text-[11px] font-bold text-zinc-600`}>N</button>
                </div>
              </PortalPopup>
            </div>
            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
            <button onClick={() => spreadsheetMergeRef.current?.()} title={mergeState.isMerged ? "Unmerge cells" : "Merge selected cells"} className={`h-8 px-2 rounded-md border transition-colors text-xs font-bold flex items-center justify-center gap-1 ${mergeState.isMerged || mergeState.hasSelection ? "border-purple-400 bg-purple-50 hover:bg-purple-100 text-purple-700" : "border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-600"}`}>MERGE</button>
            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
            <div className="relative flex items-center" ref={borderPopupRef as React.RefObject<HTMLDivElement>}>
              <button onClick={() => setShowBorderPopup(v => !v)} title="Pick border style" className="h-8 px-1.5 rounded-l-md border border-r-0 border-zinc-300 bg-white hover:bg-zinc-100 transition-colors text-zinc-600 flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="2,8 5,11 12,4" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
              <button onClick={() => spreadsheetCellBorderRef.current?.(selectedBorderStyle)} title="Apply selected border style" className="h-8 px-1.5 rounded-r-md border border-zinc-300 bg-white hover:bg-zinc-100 transition-colors text-zinc-600 flex items-center justify-center"><svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="1.5" stroke="#444" strokeWidth="1.5"/><line x1="5" y1="1" x2="5" y2="17" stroke="#444" strokeWidth="0.7"/><line x1="9" y1="1" x2="9" y2="17" stroke="#444" strokeWidth="0.7"/><line x1="13" y1="1" x2="13" y2="17" stroke="#444" strokeWidth="0.7"/><line x1="1" y1="5" x2="17" y2="5" stroke="#444" strokeWidth="0.7"/><line x1="1" y1="9" x2="17" y2="9" stroke="#444" strokeWidth="0.7"/><line x1="1" y1="13" x2="17" y2="13" stroke="#444" strokeWidth="0.7"/></svg></button>
              <PortalPopup anchorRef={borderPopupRef} open={showBorderPopup}>
                <div className="bg-white border border-zinc-300 rounded-lg shadow-xl p-2 flex flex-col gap-1 w-36">
                  {([{ style: "none" as const, label: "No border", icon: <span className="text-xs font-bold text-zinc-500">N</span> },{ style: "single" as const, label: "Single border", icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="1.5" y="1.5" width="15" height="15" rx="1" stroke="#444" strokeWidth="1.5"/></svg> },{ style: "double" as const, label: "Double border", icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="1" stroke="#444" strokeWidth="1"/><rect x="3.5" y="3.5" width="11" height="11" rx="0.5" stroke="#444" strokeWidth="1"/></svg> },{ style: "bold" as const, label: "Bold border", icon: <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="1" stroke="#222" strokeWidth="3.5"/></svg> }]).map(({ style, label, icon }) => (
                    <button key={style} onClick={() => { setSelectedBorderStyle(style); setShowBorderPopup(false); }} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${selectedBorderStyle === style ? "bg-zinc-200 font-semibold" : "hover:bg-zinc-100"}`}><span className="w-4 h-4 flex items-center justify-center shrink-0">{icon}</span><span>{label}</span></button>
                  ))}
                </div>
              </PortalPopup>
            </div>
            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
            {(() => {
              const cw = activeSheetSizes?.colWidth ?? TABLE_COL_WIDTH; const rh = activeSheetSizes?.rowHeight ?? TABLE_ROW_HEIGHT;
              return (<>
                <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                  <button onClick={() => spreadsheetCWIncRef.current?.()} title="Widen column" className={`w-8 h-8 text-[10px] font-bold flex items-center justify-center border-r border-zinc-300 transition-colors ${(cw>TABLE_COL_WIDTH)?"bg-green-100 text-green-700":"bg-white text-zinc-600 hover:bg-zinc-100"}`}>CW+</button>
                  <button onClick={() => spreadsheetCWDecRef.current?.()} title="Narrow column" className={`w-8 h-8 text-[10px] font-bold flex items-center justify-center transition-colors ${(cw<TABLE_COL_WIDTH)?"bg-red-100 text-red-700":"bg-white text-zinc-600 hover:bg-zinc-100"}`}>CW-</button>
                </div>
                <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                  <button onClick={() => spreadsheetCTIncRef.current?.()} title="Increase row height" className={`w-8 h-8 text-[10px] font-bold flex items-center justify-center border-r border-zinc-300 transition-colors ${(rh>TABLE_ROW_HEIGHT)?"bg-green-100 text-green-700":"bg-white text-zinc-600 hover:bg-zinc-100"}`}>CT+</button>
                  <button onClick={() => spreadsheetCTDecRef.current?.()} title="Decrease row height" className={`w-8 h-8 text-[10px] font-bold flex items-center justify-center transition-colors ${(rh<TABLE_ROW_HEIGHT)?"bg-red-100 text-red-700":"bg-white text-zinc-600 hover:bg-zinc-100"}`}>CT-</button>
                </div>
              </>);
            })()}

            <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />

            {/* NRC — New Row/Column picker */}
            <div className="relative shrink-0" ref={nrcPopupRef}>
              <button
                onClick={() => setShowNRCPopup(v => !v)}
                title="Set table rows & columns"
                className={`${btnSq} text-[10px] font-bold border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50`}
              >NRC</button>
              <PortalPopup anchorRef={nrcPopupRef} open={showNRCPopup} align="right">
                <div className="bg-white border border-zinc-300 rounded-lg shadow-xl p-3" style={{ minWidth: 220 }}>
                  <div className="text-[11px] font-semibold text-zinc-500 mb-2 text-center">
                    {nrcHover ? `${nrcHover.r} × ${nrcHover.c} Table` : "Hover to pick size"}
                  </div>
                  <div
                    className="grid gap-[2px]"
                    style={{ gridTemplateColumns: `repeat(15, 1fr)` }}
                    onMouseLeave={() => setNrcHover(null)}
                  >
                    {Array.from({ length: 15 }, (_, ri) =>
                      Array.from({ length: 15 }, (_, ci) => {
                        const r = ri + 1; const c = ci + 1;
                        const isHighlighted = nrcHover ? r <= nrcHover.r && c <= nrcHover.c : false;
                        return (
                          <div
                            key={`${r}-${c}`}
                            className={`w-5 h-5 border cursor-pointer transition-colors rounded-sm ${isHighlighted ? "bg-orange-200 border-orange-400" : "bg-zinc-100 border-zinc-300 hover:bg-orange-100 hover:border-orange-300"}`}
                            onMouseEnter={() => setNrcHover({ r, c })}
                            onClick={() => {
                              if (nrcHover) {
                                tableResizeRef.current?.(nrcHover.r, nrcHover.c);
                                setShowNRCPopup(false);
                                setNrcHover(null);
                              }
                            }}
                          />
                        );
                      })
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 text-center mt-2">Max 15 × 15 (grid)</div>
                  <div className="mt-3 pt-3 border-t border-zinc-200">
                    <div className="text-[11px] font-semibold text-zinc-500 mb-2 text-center">Custom</div>
                    <div className="flex items-center gap-1.5 justify-center">
                      <span className="text-[11px] text-zinc-400">Rows</span>
                      <input
                        type="number"
                        min={1}
                        value={nrcCustomRows}
                        placeholder="—"
                        onChange={e => setNrcCustomRows(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            const r = parseInt(nrcCustomRows); const c = parseInt(nrcCustomCols);
                            if (!isNaN(r) && !isNaN(c) && r >= 1 && c >= 1) {
                              tableResizeRef.current?.(Math.min(r, 999), Math.min(c, 200));
                              setNrcCustomRows(""); setNrcCustomCols(""); setShowNRCPopup(false);
                            }
                          }
                        }}
                        className="w-14 h-6 text-center text-[12px] border border-zinc-300 rounded bg-white focus:outline-none focus:border-orange-400"
                      />
                      <span className="text-[11px] text-zinc-400">Cols</span>
                      <input
                        type="number"
                        min={1}
                        max={200}
                        value={nrcCustomCols}
                        placeholder="—"
                        onChange={e => setNrcCustomCols(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            const r = parseInt(nrcCustomRows); const c = parseInt(nrcCustomCols);
                            if (!isNaN(r) && !isNaN(c) && r >= 1 && c >= 1) {
                              tableResizeRef.current?.(Math.min(r, 999), Math.min(c, 200));
                              setNrcCustomRows(""); setNrcCustomCols(""); setShowNRCPopup(false);
                            }
                          }
                        }}
                        className="w-14 h-6 text-center text-[12px] border border-zinc-300 rounded bg-white focus:outline-none focus:border-orange-400"
                      />
                      <button
                        onClick={() => {
                          const r = parseInt(nrcCustomRows); const c = parseInt(nrcCustomCols);
                          if (!isNaN(r) && !isNaN(c) && r >= 1 && c >= 1) {
                            tableResizeRef.current?.(Math.min(r, 999), Math.min(c, 200));
                            setNrcCustomRows(""); setNrcCustomCols(""); setShowNRCPopup(false);
                          }
                        }}
                        className="h-6 px-2.5 text-[11px] font-semibold rounded bg-orange-400 text-white hover:bg-orange-500 transition-colors"
                      >Apply</button>
                    </div>
                    <div className="text-[10px] text-zinc-400 text-center mt-1.5">Rows: unlimited · Cols: max 200</div>
                  </div>
                </div>
              </PortalPopup>
            </div>

            <div className="flex-1" />
            <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
              <button onClick={handleDelete} title="Move page to trash" className="w-8 h-8 text-base text-zinc-600 bg-white hover:bg-red-50 hover:text-red-600 transition-colors border-r border-zinc-300 flex items-center justify-center">🗑️</button>
              <button onClick={() => setShowTrash(true)} title="Open trash" className="w-8 h-8 text-base text-zinc-600 bg-white hover:bg-zinc-100 transition-colors flex items-center justify-center">♻</button>
            </div>
          </div>{/* end ROW 2 */}
          </div>{/* end CARD */}
        </div>

      ) : pageType === "lined" ? (
        /* ── LINED TOOLBAR ── flat single-row card (same design as spreadsheet) ── */
        <div className="bg-[#ece9e3] px-3 pt-2 pb-1.5 shrink-0">
          <div className="bg-[#f5f2ee] border border-zinc-300 rounded-xl shadow-sm">
            {/* ROW 1 — inactive placeholder boxes */}
            <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
              <button onClick={() => setLocation("/")} className="w-28 h-8 rounded border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5 text-[11px] font-semibold text-zinc-600 shrink-0">🏠 My Notebooks</button>
              <div className="flex-1" />

              <div className="w-64 h-8 rounded border border-zinc-300 bg-white flex items-center px-2 gap-1 shrink-0"><span className="text-zinc-400 text-xs">🔍</span><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search in page..." className="flex-1 bg-transparent text-[11px] text-zinc-700 outline-none placeholder:text-zinc-400" />{searchTerm && <button onClick={() => setSearchTerm("")} className="text-zinc-400 hover:text-zinc-600 text-xs leading-none">✕</button>}</div>
              <button onClick={handleCreatePage} className="w-28 h-8 rounded border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors flex items-center justify-center text-[11px] font-semibold text-zinc-600 shrink-0">+ New Page</button>
            </div>
            {/* ROW 2 — flat toolbar */}
            <div className="mx-3 mb-2 bg-[#f0ede8] border border-zinc-200/80 rounded-xl shadow-[inset_0_2px_3px_rgba(0,0,0,0.05)] px-3 py-1.5 flex items-center gap-1 overflow-x-auto">
              {/* copy | paste | cut — joined */}
              <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                <button onClick={handleCopy} title="Copy" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">🗐</button>
                <button onClick={handlePaste} title="Paste" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">📝</button>
                <button onClick={() => document.execCommand("cut")} title="Cut" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center">✂</button>
              </div>
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              {/* undo | redo — joined */}
              <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                <button onClick={handleUndo} title="Undo" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">↻</button>
                <button onClick={handleRedo} title="Redo" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center">↺</button>
              </div>
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              {/* zoom in | zoom out — joined */}
              <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                <button onClick={() => setZoom(z => Math.min(200, z + 10))} title="Zoom in" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">⌞+</button>
                <button onClick={() => setZoom(z => Math.max(50, z - 10))} title="Zoom out" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center">–⌝</button>
              </div>
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              {/* Font family */}
              <div className="relative shrink-0" ref={fontMenuRef as React.RefObject<HTMLDivElement>}>
                <button onClick={() => setShowFontMenu(v => !v)} className="h-8 px-2 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 transition-colors text-left text-sm font-medium text-zinc-700 truncate w-[152px]" style={{ fontFamily: font }}>
                  {font}
                </button>
                <PortalPopup anchorRef={fontMenuRef} open={showFontMenu}>
                  <div className="bg-white border border-zinc-300 rounded-lg shadow-lg overflow-y-auto max-h-52 w-44">
                    {FONTS.map(f => (
                      <button key={f} onClick={() => handleFontChange(f)} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 transition-colors ${font === f ? "bg-zinc-100 font-semibold" : ""}`} style={{ fontFamily: f }}>{f}</button>
                    ))}
                  </div>
                </PortalPopup>
              </div>
              {/* Font size */}
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              <div className="relative shrink-0" ref={fontSizePopupRef as React.RefObject<HTMLDivElement>}>
                <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                  <button onClick={() => setShowFontSizePopup(v => !v)} title="Font size" className="w-9 h-8 bg-white hover:bg-zinc-100 transition-colors text-xs font-semibold text-zinc-700 flex items-center justify-center border-r border-zinc-300">{fontSize}</button>
                  <button onClick={() => handleFontSizeChange(2)} title="Increase font size" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center"><span className="font-bold text-base leading-none">A</span></button>
                  <button onClick={() => handleFontSizeChange(-2)} title="Decrease font size" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center"><span className="font-bold text-xs leading-none">A</span></button>
                </div>
                <PortalPopup anchorRef={fontSizePopupRef} open={showFontSizePopup}>
                  <div className="bg-white border border-zinc-300 rounded-lg shadow-xl p-1.5 w-24 grid grid-cols-2 gap-1">
                    {[8,9,10,11,12,14,16,18,20,22,24,28,32,36,48,72].map(s => (
                      <button key={s} onClick={() => { handleFontSizeChange(s - fontSize); setShowFontSizePopup(false); }} className={`h-7 rounded text-xs font-medium transition-colors ${fontSize === s ? "bg-zinc-800 text-white" : "hover:bg-zinc-100 text-zinc-700"}`}>{s}</button>
                    ))}
                  </div>
                </PortalPopup>
              </div>
              {/* AB — All Caps toggle */}
              <button onClick={handleAllCaps} title="All caps (toggle)" className={`${btnSq} ${isAllCaps ? btnActive : ""}`}><span className="font-black text-[11px] tracking-tight">AB</span></button>
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              {/* B I U S — joined */}
              <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                <button onClick={() => execInlineFormat("bold")} title="Bold" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center ${activeFormats.bold ? "bg-zinc-200" : ""}`}><span className="font-black text-sm">B</span></button>
                <button onClick={() => execInlineFormat("italic")} title="Italic" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center ${activeFormats.italic ? "bg-zinc-200" : ""}`}><span className="italic font-bold text-sm">I</span></button>
                <button onClick={() => execInlineFormat("underline")} title="Underline" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center ${activeFormats.underline ? "bg-zinc-200" : ""}`}><span className="text-sm underline decoration-red-500 decoration-[3px]">U</span></button>
                <button onClick={() => execInlineFormat("strikeThrough")} title="Strikethrough" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center ${activeFormats.strikeThrough ? "bg-zinc-200" : ""}`}><span className="text-sm line-through decoration-red-500 decoration-[3px]">U</span></button>
              </div>
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              {/* Font color */}
              <div className="relative shrink-0" ref={colorPickerRef as React.RefObject<HTMLDivElement>}>
                <button onClick={handleFontColorButtonClick} onDoubleClick={handleFontColorButtonDblClick} title="Font color (single-click: apply, double-click: pick color)" className={btnSq}>
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className="font-bold text-sm leading-none" style={{ color: fontColor }}>A</span>
                    <div className="w-5 h-1 rounded-sm" style={{ backgroundColor: fontColor }} />
                  </div>
                </button>
                <PortalPopup anchorRef={colorPickerRef} open={showColorPicker}><FontColorPanel noAbsolute /></PortalPopup>
              </div>
              {/* Highlight color */}
              <div className="relative shrink-0" ref={highlightPickerRef as React.RefObject<HTMLDivElement>}>
                <button onClick={() => setShowHighlightPicker(v => !v)} title="Highlight color (double-space to exit mode)" className={`${btnSq} ${isHighlighterMode ? btnActive : ""}`}>
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className="font-bold text-sm leading-none text-zinc-700">A</span>
                    <div className="w-5 h-1.5 rounded-sm" style={{ backgroundColor: highlightColor }} />
                  </div>
                </button>
                <PortalPopup anchorRef={highlightPickerRef} open={showHighlightPicker}><HighlightPanel noAbsolute /></PortalPopup>
              </div>
              {/* N — clear formatting */}
              <button onClick={handleNeutral} title="Clear formatting" className={`${btnSq} text-[11px] font-bold text-zinc-600`}>N</button>
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              {/* Align */}
              <div className="relative shrink-0" ref={alignPopupRef as React.RefObject<HTMLDivElement>}>
                <button onClick={() => setShowAlignPopup(v => !v)} title="Text alignment" className={`${btnSq} ${align !== "left" ? btnActive : ""}`}>
                  {align === "center" ? (
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3.5" y="7" width="9" height="2" rx="1"/><rect x="2" y="12" width="12" height="2" rx="1"/></svg>
                  ) : align === "right" ? (
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="6" y="7" width="9" height="2" rx="1"/><rect x="3" y="12" width="12" height="2" rx="1"/></svg>
                  ) : (
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="9" height="2" rx="1"/><rect x="1" y="12" width="12" height="2" rx="1"/></svg>
                  )}
                </button>
                <PortalPopup anchorRef={alignPopupRef} open={showAlignPopup}>
                  <div className="bg-white border border-zinc-200 rounded-lg shadow-xl p-1.5 flex items-center gap-1">
                    <button onClick={() => { execFormat("justifyLeft"); setAlign("left"); setShowAlignPopup(false); }} title="Align left" className={`${btnSq} ${align === "left" ? btnActive : ""}`}>
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="9" height="2" rx="1"/><rect x="1" y="12" width="12" height="2" rx="1"/></svg>
                    </button>
                    <button onClick={() => { execFormat("justifyCenter"); setAlign("center"); setShowAlignPopup(false); }} title="Align center" className={`${btnSq} ${align === "center" ? btnActive : ""}`}>
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3.5" y="7" width="9" height="2" rx="1"/><rect x="2" y="12" width="12" height="2" rx="1"/></svg>
                    </button>
                    <button onClick={() => { execFormat("justifyRight"); setAlign("right"); setShowAlignPopup(false); }} title="Align right" className={`${btnSq} ${align === "right" ? btnActive : ""}`}>
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="6" y="7" width="9" height="2" rx="1"/><rect x="3" y="12" width="12" height="2" rx="1"/></svg>
                    </button>
                    <button onClick={() => { execFormat("justifyLeft"); setAlign("left"); setShowAlignPopup(false); }} title="Neutral (reset alignment)" className={`${btnSq} text-[11px] font-bold text-zinc-600`}>N</button>
                  </div>
                </PortalPopup>
              </div>
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              {/* Line Spacing — lined only */}
              <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                {(["compact", "normal", "relaxed"] as const).map((s, i) => (
                  <button key={s} onClick={() => setLineSpacing(s)} title={`Line spacing: ${s}`}
                    className={`h-8 px-2.5 text-[10px] font-bold transition-colors flex items-center justify-center ${i < 2 ? "border-r border-zinc-300" : ""} ${lineSpacing === s ? "bg-zinc-200 text-zinc-800" : "bg-white hover:bg-zinc-100 text-zinc-600"}`}>
                    {s === "compact" ? "C" : s === "normal" ? "N" : "R"}
                  </button>
                ))}
              </div>
              {/* Spacer */}
              <div className="flex-1" />
              {/* DEL + TRASH */}
              <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                <button onClick={handleDelete} title="Move page to trash" className="w-8 h-8 text-base text-zinc-600 bg-white hover:bg-red-50 hover:text-red-600 transition-colors border-r border-zinc-300 flex items-center justify-center">🗑️</button>
                <button onClick={() => setShowTrash(true)} title="Open trash" className="w-8 h-8 text-base text-zinc-600 bg-white hover:bg-zinc-100 transition-colors flex items-center justify-center">♻</button>
              </div>
            </div>
          </div>
        </div>

      ) : (
        /* ── BLANK TOOLBAR ── flat single-row card (same design as spreadsheet) ── */
        <div className="bg-[#ece9e3] px-3 pt-2 pb-1.5 shrink-0">
          <div className="bg-[#f5f2ee] border border-zinc-300 rounded-xl shadow-sm">
            {/* ROW 1 — inactive placeholder boxes */}
            <div className="flex items-center gap-2 px-3 pt-2 pb-1.5">
              <button onClick={() => setLocation("/")} className="w-28 h-8 rounded border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors flex items-center justify-center gap-1.5 text-[11px] font-semibold text-zinc-600 shrink-0">🏠 My Notebooks</button>
              <div className="flex-1" />

              <div className="w-64 h-8 rounded border border-zinc-300 bg-white flex items-center px-2 gap-1 shrink-0"><span className="text-zinc-400 text-xs">🔍</span><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search in page..." className="flex-1 bg-transparent text-[11px] text-zinc-700 outline-none placeholder:text-zinc-400" />{searchTerm && <button onClick={() => setSearchTerm("")} className="text-zinc-400 hover:text-zinc-600 text-xs leading-none">✕</button>}</div>
              <button onClick={handleCreatePage} className="w-28 h-8 rounded border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors flex items-center justify-center text-[11px] font-semibold text-zinc-600 shrink-0">+ New Page</button>
            </div>
            {/* ROW 2 — flat toolbar */}
            <div className="mx-3 mb-2 bg-[#f0ede8] border border-zinc-200/80 rounded-xl shadow-[inset_0_2px_3px_rgba(0,0,0,0.05)] px-3 py-1.5 flex items-center gap-1 overflow-x-auto">
              {/* copy | paste | cut — joined */}
              <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                <button onClick={handleCopy} title="Copy" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">🗐</button>
                <button onClick={handlePaste} title="Paste" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">📝</button>
                <button onClick={() => document.execCommand("cut")} title="Cut" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center">✂</button>
              </div>
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              {/* undo | redo — joined */}
              <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                <button onClick={handleUndo} title="Undo" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">↻</button>
                <button onClick={handleRedo} title="Redo" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center">↺</button>
              </div>
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              {/* zoom in | zoom out — joined */}
              <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                <button onClick={() => setZoom(z => Math.min(200, z + 10))} title="Zoom in" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center">⌞+</button>
                <button onClick={() => setZoom(z => Math.max(50, z - 10))} title="Zoom out" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center">–⌝</button>
              </div>
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              {/* Font family */}
              <div className="relative shrink-0" ref={fontMenuRef as React.RefObject<HTMLDivElement>}>
                <button onClick={() => setShowFontMenu(v => !v)} className="h-8 px-2 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 transition-colors text-left text-sm font-medium text-zinc-700 truncate w-[152px]" style={{ fontFamily: font }}>
                  {font}
                </button>
                <PortalPopup anchorRef={fontMenuRef} open={showFontMenu}>
                  <div className="bg-white border border-zinc-300 rounded-lg shadow-lg overflow-y-auto max-h-52 w-44">
                    {FONTS.map(f => (
                      <button key={f} onClick={() => handleFontChange(f)} className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 transition-colors ${font === f ? "bg-zinc-100 font-semibold" : ""}`} style={{ fontFamily: f }}>{f}</button>
                    ))}
                  </div>
                </PortalPopup>
              </div>
              {/* Font size */}
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              <div className="relative shrink-0" ref={fontSizePopupRef as React.RefObject<HTMLDivElement>}>
                <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                  <button onClick={() => setShowFontSizePopup(v => !v)} title="Font size" className="w-9 h-8 bg-white hover:bg-zinc-100 transition-colors text-xs font-semibold text-zinc-700 flex items-center justify-center border-r border-zinc-300">{fontSize}</button>
                  <button onClick={() => handleFontSizeChange(2)} title="Increase font size" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center"><span className="font-bold text-base leading-none">A</span></button>
                  <button onClick={() => handleFontSizeChange(-2)} title="Decrease font size" className="w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center"><span className="font-bold text-xs leading-none">A</span></button>
                </div>
                <PortalPopup anchorRef={fontSizePopupRef} open={showFontSizePopup}>
                  <div className="bg-white border border-zinc-300 rounded-lg shadow-xl p-1.5 w-24 grid grid-cols-2 gap-1">
                    {[8,9,10,11,12,14,16,18,20,22,24,28,32,36,48,72].map(s => (
                      <button key={s} onClick={() => { handleFontSizeChange(s - fontSize); setShowFontSizePopup(false); }} className={`h-7 rounded text-xs font-medium transition-colors ${fontSize === s ? "bg-zinc-800 text-white" : "hover:bg-zinc-100 text-zinc-700"}`}>{s}</button>
                    ))}
                  </div>
                </PortalPopup>
              </div>
              {/* AB — All Caps toggle */}
              <button onClick={handleAllCaps} title="All caps (toggle)" className={`${btnSq} ${isAllCaps ? btnActive : ""}`}><span className="font-black text-[11px] tracking-tight">AB</span></button>
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              {/* B I U S — joined */}
              <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                <button onClick={() => execInlineFormat("bold")} title="Bold" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center ${activeFormats.bold ? "bg-zinc-200" : ""}`}><span className="font-black text-sm">B</span></button>
                <button onClick={() => execInlineFormat("italic")} title="Italic" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center ${activeFormats.italic ? "bg-zinc-200" : ""}`}><span className="italic font-bold text-sm">I</span></button>
                <button onClick={() => execInlineFormat("underline")} title="Underline" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors border-r border-zinc-300 flex items-center justify-center ${activeFormats.underline ? "bg-zinc-200" : ""}`}><span className="text-sm underline decoration-red-500 decoration-[3px]">U</span></button>
                <button onClick={() => execInlineFormat("strikeThrough")} title="Strikethrough" className={`w-8 h-8 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors flex items-center justify-center ${activeFormats.strikeThrough ? "bg-zinc-200" : ""}`}><span className="text-sm line-through decoration-red-500 decoration-[3px]">U</span></button>
              </div>
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              {/* Font color */}
              <div className="relative shrink-0" ref={colorPickerRef as React.RefObject<HTMLDivElement>}>
                <button onClick={handleFontColorButtonClick} onDoubleClick={handleFontColorButtonDblClick} title="Font color (single-click: apply, double-click: pick color)" className={btnSq}>
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className="font-bold text-sm leading-none" style={{ color: fontColor }}>A</span>
                    <div className="w-5 h-1 rounded-sm" style={{ backgroundColor: fontColor }} />
                  </div>
                </button>
                <PortalPopup anchorRef={colorPickerRef} open={showColorPicker}><FontColorPanel noAbsolute /></PortalPopup>
              </div>
              {/* Highlight color */}
              <div className="relative shrink-0" ref={highlightPickerRef as React.RefObject<HTMLDivElement>}>
                <button onClick={() => setShowHighlightPicker(v => !v)} title="Highlight color (double-space to exit mode)" className={`${btnSq} ${isHighlighterMode ? btnActive : ""}`}>
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span className="font-bold text-sm leading-none text-zinc-700">A</span>
                    <div className="w-5 h-1.5 rounded-sm" style={{ backgroundColor: highlightColor }} />
                  </div>
                </button>
                <PortalPopup anchorRef={highlightPickerRef} open={showHighlightPicker}><HighlightPanel noAbsolute /></PortalPopup>
              </div>
              {/* N — clear formatting */}
              <button onClick={handleNeutral} title="Clear formatting" className={`${btnSq} text-[11px] font-bold text-zinc-600`}>N</button>
              <div className="w-px h-6 bg-zinc-300 mx-0.5 shrink-0" />
              {/* Align */}
              <div className="relative shrink-0" ref={alignPopupRef as React.RefObject<HTMLDivElement>}>
                <button onClick={() => setShowAlignPopup(v => !v)} title="Text alignment" className={`${btnSq} ${align !== "left" ? btnActive : ""}`}>
                  {align === "center" ? (
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3.5" y="7" width="9" height="2" rx="1"/><rect x="2" y="12" width="12" height="2" rx="1"/></svg>
                  ) : align === "right" ? (
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="6" y="7" width="9" height="2" rx="1"/><rect x="3" y="12" width="12" height="2" rx="1"/></svg>
                  ) : (
                    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="9" height="2" rx="1"/><rect x="1" y="12" width="12" height="2" rx="1"/></svg>
                  )}
                </button>
                <PortalPopup anchorRef={alignPopupRef} open={showAlignPopup}>
                  <div className="bg-white border border-zinc-200 rounded-lg shadow-xl p-1.5 flex items-center gap-1">
                    <button onClick={() => { execFormat("justifyLeft"); setAlign("left"); setShowAlignPopup(false); }} title="Align left" className={`${btnSq} ${align === "left" ? btnActive : ""}`}>
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="9" height="2" rx="1"/><rect x="1" y="12" width="12" height="2" rx="1"/></svg>
                    </button>
                    <button onClick={() => { execFormat("justifyCenter"); setAlign("center"); setShowAlignPopup(false); }} title="Align center" className={`${btnSq} ${align === "center" ? btnActive : ""}`}>
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="3.5" y="7" width="9" height="2" rx="1"/><rect x="2" y="12" width="12" height="2" rx="1"/></svg>
                    </button>
                    <button onClick={() => { execFormat("justifyRight"); setAlign("right"); setShowAlignPopup(false); }} title="Align right" className={`${btnSq} ${align === "right" ? btnActive : ""}`}>
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-zinc-600"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="6" y="7" width="9" height="2" rx="1"/><rect x="3" y="12" width="12" height="2" rx="1"/></svg>
                    </button>
                    <button onClick={() => { execFormat("justifyLeft"); setAlign("left"); setShowAlignPopup(false); }} title="Neutral (reset alignment)" className={`${btnSq} text-[11px] font-bold text-zinc-600`}>N</button>
                  </div>
                </PortalPopup>
              </div>
              {/* Spacer */}
              <div className="flex-1" />
              {/* DEL + TRASH */}
              <div className="flex items-center rounded-lg border border-zinc-300 overflow-hidden shrink-0">
                <button onClick={handleDelete} title="Move page to trash" className="w-8 h-8 text-base text-zinc-600 bg-white hover:bg-red-50 hover:text-red-600 transition-colors border-r border-zinc-300 flex items-center justify-center">🗑️</button>
                <button onClick={() => setShowTrash(true)} title="Open trash" className="w-8 h-8 text-base text-zinc-600 bg-white hover:bg-zinc-100 transition-colors flex items-center justify-center">♻</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trash panel */}
      {showTrash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-white">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-bold uppercase tracking-widest text-zinc-700">Trash</span>
              </div>
              <button onClick={() => setShowTrash(false)} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200 transition-colors">
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
              {trashedPages.length === 0 ? (
                <div className="px-5 py-8 text-center text-zinc-400 text-sm italic">Trash is empty</div>
              ) : (
                trashedPages.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50">
                    <span className="text-sm text-zinc-700 font-medium">{p.title}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleRestore(p.id)} title="Restore page" className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-600 border border-zinc-300 rounded-md hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-colors">
                        <RotateCcw className="w-3 h-3" /> Restore
                      </button>
                      <button onClick={() => handlePermanentDelete(p.id)} title="Permanently delete" className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-600 border border-zinc-300 rounded-md hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-colors">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="bg-[#ece9e3] px-4 pt-0 pb-1 shrink-0 relative flex items-center gap-1.5" ref={pageTypePickerRef}>
        {/* Card 2: Page tabs */}
        <div className="overflow-hidden rounded-lg border border-zinc-200 shadow-sm flex-1 min-w-0">
          <div className="bg-[#fafaf8] text-zinc-800 flex items-stretch border-b border-zinc-200" style={{ minHeight: 15 }}>
            <button onClick={() => scrollTabs("left")} className="px-1.5 flex items-center text-zinc-400 hover:text-zinc-800 transition-colors border-r border-zinc-200 shrink-0">
              <ChevronLeft className="w-3 h-3" />
            </button>
            <div ref={tabsRef} className="flex items-stretch overflow-x-auto flex-1 min-w-0" style={{ scrollbarWidth: "none" }}>
              {pages.map((p, index) => (
                <div
                  key={p.id}
                  className={`flex items-center border-r border-zinc-200 ${
                    p.id === pId
                      ? "bg-white border-b-2 border-b-zinc-900"
                      : "hover:bg-zinc-100"
                  }`}
                >
                  {editingTabId === p.id ? (
                    <input
                      autoFocus
                      value={editingTabValue}
                      onChange={e => setEditingTabValue(e.target.value)}
                      onBlur={() => {
                        const trimmed = editingTabValue.trim();
                        if (trimmed) store.updatePage(bId, p.id, { title: trimmed });
                        setEditingTabId(null);
                        refresh();
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          const trimmed = editingTabValue.trim();
                          if (trimmed) store.updatePage(bId, p.id, { title: trimmed });
                          setEditingTabId(null);
                          refresh();
                        } else if (e.key === "Escape") {
                          setEditingTabId(null);
                        }
                      }}
                      className="px-2 py-0 text-[10px] font-semibold uppercase tracking-widest bg-transparent text-zinc-900 outline-none border-b border-zinc-800 w-24"
                      style={{ minWidth: 60 }}
                    />
                  ) : (
                    <button
                      onClick={() => setLocation(`/books/${bId}/pages/${p.id}`)}
                      onDoubleClick={e => {
                        e.preventDefault();
                        setEditingTabId(p.id);
                        setEditingTabValue(p.title || `Page ${index + 1}`);
                      }}
                      className={`px-3 py-0 text-[10px] font-semibold uppercase tracking-widest whitespace-nowrap transition-colors h-full ${
                        p.id === pId ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"
                      }`}
                    >
                      {p.title || `PAGE ${index + 1}`}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => scrollTabs("right")} className="px-1.5 flex items-center text-zinc-400 hover:text-zinc-800 transition-colors border-l border-zinc-200 shrink-0">
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {showPageTypePicker && (
          <div className="absolute top-full right-0 mt-1 z-50 bg-white border border-zinc-200 rounded-lg shadow-xl p-2 flex gap-1.5">
            <button onClick={() => handleCreatePageWithType("blank")} className="flex flex-col items-center gap-1 px-2 py-1.5 hover:bg-zinc-100 rounded-md transition-colors group">
              <div className="w-10 h-12 border border-zinc-300 group-hover:border-zinc-500 rounded-sm bg-white shadow-sm" />
              <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-800">Blank</span>
            </button>
            <button onClick={() => handleCreatePageWithType("lined")} className="flex flex-col items-center gap-1 px-2 py-1.5 hover:bg-zinc-100 rounded-md transition-colors group">
              <div className="w-10 h-12 border border-zinc-300 group-hover:border-zinc-500 rounded-sm bg-white overflow-hidden shadow-sm relative">
                <div className="absolute top-0 left-3 bottom-0 border-l border-red-400" />
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="border-b border-blue-200" style={{ height: "6px" }} />
                ))}
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-800">Lined</span>
            </button>
            <button onClick={() => handleCreatePageWithType("spreadsheet")} className="flex flex-col items-center gap-1 px-2 py-1.5 hover:bg-zinc-100 rounded-md transition-colors group">
              <div className="w-10 h-12 border border-zinc-300 group-hover:border-zinc-500 rounded-sm bg-white overflow-hidden shadow-sm">
                <div className="grid border-b border-zinc-300 bg-zinc-100" style={{ gridTemplateColumns: "8px repeat(3, 1fr)" }}>
                  {Array.from({ length: 4 }, (_, i) => <div key={i} className="border-r border-zinc-300 h-2" />)}
                </div>
                {Array.from({ length: 8 }, (_, r) => (
                  <div key={r} className="grid border-b border-zinc-200" style={{ gridTemplateColumns: "8px repeat(3, 1fr)" }}>
                    <div className="border-r border-zinc-300 h-[5px] bg-zinc-50" />
                    {Array.from({ length: 3 }, (_, c) => <div key={c} className="border-r border-zinc-200 h-[5px]" />)}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-800">Sheet</span>
            </button>
            <button onClick={() => handleCreatePageWithType("table")} className="flex flex-col items-center gap-1 px-2 py-1.5 hover:bg-zinc-100 rounded-md transition-colors group">
              <div className="w-10 h-12 border border-zinc-300 group-hover:border-zinc-500 rounded-sm bg-white overflow-hidden shadow-sm">
                <div className="grid border-b border-zinc-300 bg-zinc-100" style={{ gridTemplateColumns: "8px repeat(3, 1fr)" }}>
                  {Array.from({ length: 4 }, (_, i) => <div key={i} className="border-r border-zinc-300 h-2 flex items-center justify-center text-[4px] text-zinc-400 font-bold">{i===0?"":String.fromCharCode(64+i)}</div>)}
                </div>
                {Array.from({ length: 7 }, (_, r) => (
                  <div key={r} className="grid border-b border-zinc-200" style={{ gridTemplateColumns: "8px repeat(3, 1fr)" }}>
                    <div className="border-r border-zinc-300 h-[5px] bg-zinc-50 flex items-center justify-center text-[4px] text-zinc-400">{r+1}</div>
                    {Array.from({ length: 3 }, (_, c) => <div key={c} className="border-r border-zinc-200 h-[5px]" />)}
                  </div>
                ))}
              </div>
              <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-800">Table</span>
            </button>
          </div>
        )}
      </div>

      {/* Paper card */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#ece9e3] px-4 pb-4">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-xl border border-zinc-300 shadow-sm bg-white">
          <div className="bg-[#fafaf8] border-b border-zinc-200 px-4 py-1 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Page: <span className="text-zinc-700">PAGE {page.pageNumber}</span>
              </span>
              <div className="flex items-center gap-1 ml-2">
                {pageType !== "spreadsheet" && pageType !== "table" && (
                  <button
                    onClick={() => setAutoWrap(v => !v)}
                    title={autoWrap ? "Auto-wrap: ON (click to turn off)" : "Auto-wrap: OFF (click to turn on)"}
                    className="flex items-center justify-center rounded"
                    style={{ width: 22, height: 22, fontSize: 11, fontWeight: 700, border: `1.5px solid ${autoWrap ? "#16a34a" : "#dc2626"}`, color: autoWrap ? "#16a34a" : "#dc2626", background: autoWrap ? "#f0fdf4" : "#fef2f2", lineHeight: 1, letterSpacing: 0 }}
                  >➜]</button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const badge = (label: string, val: number) => (
                  <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: "#78716c", background: "#f0ebe2", border: "1px solid #ddd5c4", borderRadius: 4, padding: "1px 5px", fontFamily: "monospace" }}>
                    <span style={{ color: "#a8956b" }}>{label}</span>
                    <span style={{ color: "#3a2e20" }}>{val}</span>
                  </span>
                );
                return (
                  <div className="flex items-center gap-1.5">
                    {badge("SN", textStats.sn)}{badge("WD", textStats.wd)}{badge("LT", textStats.lt)}
                  </div>
                );
              })()}
              <span className="text-xs text-zinc-400 ml-1">{saveStatus === "saving" ? "Saving..." : "Saved"}</span>
            </div>
          </div>

          <div
            ref={pageScrollRef}
            className="flex-1 bg-white"
            style={{
              scrollbarWidth: "thin",
              overflow: pageType === "spreadsheet" || pageType === "table" ? "hidden" : "auto",
            }}
            onScroll={e => pageType === "lined" && setLinedScroll((e.currentTarget as HTMLDivElement).scrollTop)}
          >
            {pageType === "spreadsheet" ? (
              <div key="spreadsheet" style={{ zoom: zoom / 100, transformOrigin: "top left", height: "100%" }}>
                {contentReadyForPid === pId && (
                <SpreadsheetEditor
                  key={pId}
                  content={content}
                  mergeRef={spreadsheetMergeRef}
                  clearRef={spreadsheetClearRef}
                  cutRef={spreadsheetCutRef}
                  insertRowRef={spreadsheetInsertRowRef}
                  insertColRef={spreadsheetInsertColRef}
                  colWidthIncRef={spreadsheetCWIncRef}
                  colWidthDecRef={spreadsheetCWDecRef}
                  rowHeightIncRef={spreadsheetCTIncRef}
                  rowHeightDecRef={spreadsheetCTDecRef}
                  onActiveSizeChange={setActiveSheetSizes}
                  onMergeStateChange={(isMerged, hasSelection) => setMergeState({ isMerged, hasSelection })}
                  cellBorderRef={spreadsheetCellBorderRef}
                  cellAlignRef={spreadsheetSetAlignRef}
                  onActiveCellAlignChange={setAlign}
                  cellValignRef={spreadsheetSetValignRef}
                  onActiveCellValignChange={setValign}
                  cellFormatRef={spreadsheetSetFormatRef}
                  onActiveCellFormatChange={(fmt) => {
                    setActiveFormats({ bold: !!fmt.bold, italic: !!fmt.italic, underline: !!fmt.underline, strikeThrough: !!fmt.strikeThrough, overline: !!fmt.overline });
                    if (fmt.fontColor) setFontColor(fmt.fontColor);
                    if (fmt.highlightColor) setHighlightColor(fmt.highlightColor);
                    if (fmt.fontSize) setFontSize(fmt.fontSize);
                    if (fmt.fontFamily) setFont(fmt.fontFamily);
                  }}
                  onChange={(v) => {
                    setContent(v);
                    setSaveStatus("saving");
                  }}
                />
                )}
              </div>
            ) : pageType === "table" ? (
              <div key="table" className="w-full h-full bg-white overflow-auto">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: "100%", minHeight: "100%", padding: "24px", boxSizing: "border-box" }}>
                <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}>
                {contentReadyForPid === pId && (
                  <SpreadsheetEditor
                    key={pId}
                    tableMode
                    content={content}
                    mergeRef={spreadsheetMergeRef}
                    clearRef={spreadsheetClearRef}
                    cutRef={spreadsheetCutRef}
                    insertRowRef={spreadsheetInsertRowRef}
                    insertColRef={spreadsheetInsertColRef}
                    colWidthIncRef={spreadsheetCWIncRef}
                    colWidthDecRef={spreadsheetCWDecRef}
                    rowHeightIncRef={spreadsheetCTIncRef}
                    rowHeightDecRef={spreadsheetCTDecRef}
                    resizeTableRef={tableResizeRef}
                    onActiveSizeChange={setActiveSheetSizes}
                    onMergeStateChange={(isMerged, hasSelection) => setMergeState({ isMerged, hasSelection })}
                    cellBorderRef={spreadsheetCellBorderRef}
                    cellAlignRef={spreadsheetSetAlignRef}
                    onActiveCellAlignChange={setAlign}
                    cellValignRef={spreadsheetSetValignRef}
                    onActiveCellValignChange={setValign}
                    cellFormatRef={spreadsheetSetFormatRef}
                    onActiveCellFormatChange={(fmt) => {
                      setActiveFormats({ bold: !!fmt.bold, italic: !!fmt.italic, underline: !!fmt.underline, strikeThrough: !!fmt.strikeThrough, overline: !!fmt.overline });
                      if (fmt.fontColor) setFontColor(fmt.fontColor);
                      if (fmt.highlightColor) setHighlightColor(fmt.highlightColor);
                      if (fmt.fontSize) setFontSize(fmt.fontSize);
                      if (fmt.fontFamily) setFont(fmt.fontFamily);
                    }}
                    onChange={(v) => {
                      setContent(v);
                      setSaveStatus("saving");
                    }}
                  />
                )}
                </div>
                </div>
              </div>
            ) : pageType === "lined" ? (
              <div key="lined" className="flex w-full" style={{ minHeight: 500 * lineHeightPx, backgroundColor: "#ffffff", zoom: zoom / 100, transformOrigin: "top left" }}>
                {/* Line numbers + margin — virtualized */}
                {(() => {
                  const containerH = pageScrollRef.current?.clientHeight ?? 600;
                  const buf = 20;
                  const firstLn = Math.max(0, Math.floor(linedScroll / lineHeightPx) - buf);
                  const lastLn = Math.min(499, Math.ceil((linedScroll + containerH) / lineHeightPx) + buf);
                  const topSp = firstLn * lineHeightPx;
                  const botSp = (499 - lastLn) * lineHeightPx;
                  return (
                    <div className="shrink-0 select-none" style={{ width: 44, minHeight: 500 * lineHeightPx, backgroundColor: "#ffffff", borderRight: "2px solid #ddd5c4", paddingTop: 4 }}>
                      {topSp > 0 && <div style={{ height: topSp }} />}
                      {Array.from({ length: lastLn - firstLn + 1 }, (_, i) => {
                        const ln = firstLn + i;
                        return (
                          <div
                            key={ln}
                            className="font-mono flex items-center justify-end pr-2 cursor-pointer hover:bg-amber-100 transition-colors"
                            style={{ fontSize: 11, height: lineHeightPx, color: "#c4b89a" }}
                            onClick={() => {
                              editorRef.current?.focus();
                              if (pageScrollRef.current) pageScrollRef.current.scrollTop = ln * lineHeightPx;
                            }}
                          >
                            {ln + 1}
                          </div>
                        );
                      })}
                      {botSp > 0 && <div style={{ height: botSp }} />}
                    </div>
                  );
                })()}
                {/* Lined editor */}
                <div
                  className="flex-1 relative"
                  style={{
                    minHeight: 500 * lineHeightPx,
                    backgroundImage: `repeating-linear-gradient(to bottom, #ffffff, #ffffff ${lineHeightPx - 1}px, #e8dfd0 ${lineHeightPx - 1}px, #e8dfd0 ${lineHeightPx}px)`,
                    backgroundPositionY: "0px",
                    backgroundRepeat: "repeat-y",
                    backgroundSize: `100% ${lineHeightPx}px`,
                  }}
                >
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    spellCheck={false}
                    onInput={handleEditorInput}
                    onKeyDown={handleEditorKeyDown}
                    onKeyUp={updateActiveFormats}
                    onMouseUp={updateActiveFormats}
                    className="relative w-full outline-none px-4"
                    style={{ fontFamily: font, fontSize: fontSize, lineHeight: `${lineHeightPx}px`, minHeight: 500 * lineHeightPx, whiteSpace: autoWrap ? "pre-wrap" : "pre", overflowX: autoWrap ? "hidden" : "auto", color: "#3a2e20", paddingTop: 4, backgroundColor: "transparent" }}
                    data-placeholder="Start writing..."
                  />
                </div>
              </div>
            ) : (
              <div key="blank" style={{ zoom: zoom / 100, transformOrigin: "top left" }}>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  spellCheck={false}
                  onInput={handleEditorInput}
                  onKeyDown={handleEditorKeyDown}
                  onKeyUp={updateActiveFormats}
                  onMouseUp={updateActiveFormats}
                  className="w-full min-h-full outline-none px-6 py-4 text-zinc-800"
                  style={{ fontFamily: font, fontSize: fontSize, lineHeight: "1.8", minHeight: 500 * Math.round(fontSize * 1.8), whiteSpace: autoWrap ? "pre-wrap" : "pre", overflowX: autoWrap ? "hidden" : "auto" }}
                  data-placeholder="Start writing..."
                />
              </div>
            )}
          </div>

          <div className="bg-[#f5f2ee] border-t border-zinc-200 px-4 py-1 flex items-center justify-between text-xs text-zinc-500 shrink-0">
            <button onClick={() => prevPage && setLocation(`/books/${bId}/pages/${prevPage.id}`)} disabled={!prevPage} className="disabled:opacity-30 hover:text-zinc-700 transition-colors flex items-center gap-1">
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>
            <span className="font-medium">{book?.title}</span>
            <button onClick={() => nextPage && setLocation(`/books/${bId}/pages/${nextPage.id}`)} disabled={!nextPage} className="disabled:opacity-30 hover:text-zinc-700 transition-colors flex items-center gap-1">
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
