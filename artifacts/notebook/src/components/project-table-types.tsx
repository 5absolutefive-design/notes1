import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// ── Types ────────────────────────────────────────────────────────
export type ColType =
  | "text" | "number" | "select" | "multi" | "check"
  | "date" | "url" | "email" | "phone" | "rating"
  | "progress" | "person" | "currency" | "priority";

export interface SelectOption {
  id: string;
  label: string;
  color: keyof typeof SELECT_COLORS;
}

// ── Badge colors ─────────────────────────────────────────────────
export const SELECT_COLORS = {
  gray:   { bg: "#f1f1ef", text: "#787774", border: "#c0bfbc" },
  blue:   { bg: "#e7f3f8", text: "#337ea9", border: "#9dcce5" },
  green:  { bg: "#edf3ec", text: "#448361", border: "#a8d5b3" },
  yellow: { bg: "#fbf3db", text: "#cb912f", border: "#f0d699" },
  red:    { bg: "#fdebec", text: "#d44c47", border: "#f5b0ae" },
  orange: { bg: "#fbecdd", text: "#d9730d", border: "#f5c49a" },
  purple: { bg: "#f6f3f9", text: "#9065b0", border: "#c9b8e5" },
  pink:   { bg: "#faf1f5", text: "#c14c8a", border: "#f0b8d6" },
  brown:  { bg: "#f4eeee", text: "#9f6b53", border: "#dab8a8" },
} as const;

export const COLOR_NAMES = Object.keys(SELECT_COLORS) as (keyof typeof SELECT_COLORS)[];

export const DEFAULT_STATUS_OPTIONS: SelectOption[] = [
  { id: "s1", label: "To Do",       color: "gray"  },
  { id: "s2", label: "In Progress", color: "blue"  },
  { id: "s3", label: "Done",        color: "green" },
];

export const STATUS_OPTIONS = [
  { label: "Not Started", emoji: "⚪", hex: "#6B7280", bg: "#F3F4F6", border: "#D1D5DB" },
  { label: "Planned",     emoji: "🔵", hex: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
  { label: "In Progress", emoji: "🟡", hex: "#D97706", bg: "#FFFBEB", border: "#FDE68A" },
  { label: "On Hold",     emoji: "🟠", hex: "#F97316", bg: "#FFF7ED", border: "#FED7AA" },
  { label: "Review",      emoji: "🟣", hex: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE" },
  { label: "Completed",   emoji: "🟢", hex: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0" },
] as const;

export const DEFAULT_PRIORITY_OPTIONS: SelectOption[] = [
  { id: "p1", label: "Low",    color: "gray"   },
  { id: "p2", label: "Medium", color: "yellow" },
  { id: "p3", label: "High",   color: "red"    },
];

export const PRIORITY_LEVELS = [
  { label: "Urgent",   hex: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
  { label: "High",     hex: "#F97316", bg: "#FFF7ED", border: "#FED7AA" },
  { label: "Medium",   hex: "#EAB308", bg: "#FEFCE8", border: "#FEF08A" },
  { label: "Low",      hex: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
  { label: "Optional", hex: "#94A3B8", bg: "#F8FAFC", border: "#E2E8F0" },
] as const;

// ── Column type list ─────────────────────────────────────────────
export const COL_TYPES: { type: ColType; icon: string; label: string }[] = [
  { type: "text",     icon: "T",  label: "Text"     },
  { type: "number",   icon: "#",  label: "Number"   },
  { type: "select",   icon: "◈",  label: "Progress" },
  { type: "priority", icon: "⚑",  label: "Priority" },
  { type: "multi",    icon: "⊞",  label: "Multi"    },
  { type: "check",    icon: "☑",  label: "Check"    },
  { type: "date",     icon: "📅", label: "Date"     },
  { type: "url",      icon: "🔗", label: "URL"      },
  { type: "email",    icon: "@",  label: "Email"    },
  { type: "phone",    icon: "☏",  label: "Phone"    },
  { type: "rating",   icon: "★",  label: "Rating"   },
  { type: "progress", icon: "▓",  label: "% Bar"    },
  { type: "person",   icon: "👤", label: "Person"   },
  { type: "currency", icon: "$",  label: "Currency" },
];

// ── DOM helpers ──────────────────────────────────────────────────
export function getColType(th: HTMLElement): ColType {
  return (th.dataset.colType as ColType) || "text";
}

export function getColIndex(cell: HTMLElement): number {
  return Array.from(cell.parentElement?.children ?? []).indexOf(cell);
}

export function findTh(td: HTMLElement): HTMLElement | null {
  const table = td.closest("table");
  if (!table) return null;
  const idx = getColIndex(td);
  const ths = table.querySelectorAll("thead th");
  return (ths[idx] as HTMLElement) ?? null;
}

export function getColOptions(th: HTMLElement, type?: ColType): SelectOption[] {
  try {
    const raw = th.dataset.colOptions;
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  const colType = type || (th.dataset.colType as ColType);
  return colType === "priority" ? [...DEFAULT_PRIORITY_OPTIONS] : [...DEFAULT_STATUS_OPTIONS];
}

export function setColOptions(th: HTMLElement, options: SelectOption[]) {
  th.dataset.colOptions = JSON.stringify(options);
}

// ── Badge HTML ───────────────────────────────────────────────────
export function makeBadgeHtml(label: string, color: keyof typeof SELECT_COLORS): string {
  const c = SELECT_COLORS[color] ?? SELECT_COLORS.gray;
  return `<span style="display:inline-flex;align-items:center;padding:2px 9px;border-radius:12px;background:${c.bg};color:${c.text};border:1px solid ${c.border};font-size:12px;font-weight:500;white-space:nowrap;line-height:18px;max-width:100%;overflow:hidden;text-overflow:ellipsis">${label}</span>`;
}

export function makeStatusBadgeHtml(label: string): string {
  const s = STATUS_OPTIONS.find(o => o.label === label);
  if (!s) return `<span style="color:#9ca3af;font-size:13px">—</span>`;
  return `<span style="display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:12px;background:${s.bg};color:${s.hex};border:1px solid ${s.border};font-size:12px;font-weight:500;white-space:nowrap;line-height:18px">${s.emoji} ${s.label}</span>`;
}

export function makePriorityBadgeHtml(label: string): string {
  const pl = PRIORITY_LEVELS.find(p => p.label === label);
  if (!pl) return `<span style="color:#9ca3af;font-size:13px">—</span>`;
  return `<span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:12px;background:${pl.bg};color:${pl.hex};border:1px solid ${pl.border};font-size:12px;font-weight:600;white-space:nowrap;line-height:18px">${pl.label}</span>`;
}

// ── Cell inner HTML by type ──────────────────────────────────────
export function makeCellInner(type: ColType, val: string, options?: SelectOption[]): string {
  switch (type) {
    case "text":
      return val || "<br/>";

    case "number": {
      const display = val && val !== "0" ? val : "0";
      return `<span data-ncell="1" style="display:block;width:100%;text-align:right;font-size:13px;color:${val && val !== "0" ? "#1f2937" : "#9ca3af"};user-select:none">${display}</span>`;
    }

    case "currency": {
      const n = parseFloat(val) || 0;
      const fmt = `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
      return `<span data-ncell="1" data-ntype="currency" style="display:block;width:100%;text-align:right;font-size:13px;color:${val && parseFloat(val) !== 0 ? "#1f2937" : "#9ca3af"};user-select:none">${fmt}</span>`;
    }

    case "check": {
      const checked = val === "true";
      return `<span data-checkcell="1" style="display:flex;align-items:center;justify-content:center;width:100%;cursor:pointer;user-select:none"><span style="width:16px;height:16px;border-radius:3px;border:2px solid ${checked ? "#3b82f6" : "#d1d5db"};background:${checked ? "#3b82f6" : "white"};display:flex;align-items:center;justify-content:center;pointer-events:none">${checked ? '<svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5,5 4,7.5 8.5,2.5"/></svg>' : ""}</span></span>`;
    }

    case "date":
      return `<input data-datecell="1" type="date" value="${val || ""}" style="border:none;outline:none;background:transparent;width:100%;font-size:13px;color:${val ? "#1f2937" : "#9ca3af"};cursor:pointer;font-family:inherit;padding:0" />`;

    case "url":
      return `<span data-textcell="url" style="display:block;font-size:13px;color:${val ? "#2563eb" : "#9ca3af"};text-decoration:${val ? "underline" : "none"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:text;user-select:none">${val || "Add URL..."}</span>`;

    case "email":
      return `<span data-textcell="email" style="display:block;font-size:13px;color:${val ? "#1f2937" : "#9ca3af"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:text;user-select:none">${val || "Add email..."}</span>`;

    case "phone":
      return `<span data-textcell="phone" style="display:block;font-size:13px;color:${val ? "#1f2937" : "#9ca3af"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:text;user-select:none">${val || "Add phone..."}</span>`;

    case "person": {
      const initial = val ? val.trim().charAt(0).toUpperCase() : "";
      return `<span data-textcell="person" style="display:flex;align-items:center;gap:6px;cursor:text;user-select:none">${val
        ? `<span style="width:22px;height:22px;border-radius:50%;background:#6366f1;color:white;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0">${initial}</span><span style="font-size:13px;color:#1f2937">${val}</span>`
        : `<span style="font-size:13px;color:#9ca3af">Assign...</span>`
      }</span>`;
    }

    case "rating": {
      const stars = Math.min(5, Math.max(0, parseInt(val) || 0));
      return `<span data-ratingcell="1" style="display:flex;align-items:center;gap:1px;cursor:pointer;user-select:none">${Array.from({ length: 5 }, (_, i) =>
        `<span data-star="${i + 1}" style="font-size:16px;color:${i < stars ? "#f59e0b" : "#d1d5db"};pointer-events:auto">★</span>`
      ).join("")}</span>`;
    }

    case "progress": {
      const pct = Math.min(100, Math.max(0, parseInt(val) || 0));
      return `<span data-progresscell="1" style="display:flex;align-items:center;gap:6px;cursor:pointer;user-select:none;width:100%"><span style="flex:1;height:7px;border-radius:4px;background:#f3f4f6;overflow:hidden"><span style="display:block;height:100%;width:${pct}%;background:${pct >= 50 ? "#22c55e" : "#f97316"};border-radius:4px"></span></span><span style="font-size:11px;color:#6b7280;min-width:28px;text-align:right">${pct}%</span></span>`;
    }

    case "select": {
      return `<span data-selectcell="1" style="display:block;cursor:pointer;user-select:none;min-height:20px">${val ? makeStatusBadgeHtml(val) : '<span style="color:#9ca3af;font-size:13px">—</span>'}</span>`;
    }

    case "priority": {
      return `<span data-prioritycell="1" style="display:block;cursor:pointer;user-select:none;min-height:20px">${val ? makePriorityBadgeHtml(val) : '<span style="color:#9ca3af;font-size:13px">—</span>'}</span>`;
    }

    case "multi": {
      const opts = options || [];
      const ids = val ? val.split(",").filter(Boolean) : [];
      const selected = ids.map(id => opts.find(o => o.id === id)).filter(Boolean) as SelectOption[];
      return `<span data-multicell="1" style="display:flex;flex-wrap:wrap;gap:2px;cursor:pointer;user-select:none;min-height:20px">${selected.length ? selected.map(o => makeBadgeHtml(o.label, o.color)).join("") : '<span style="color:#9ca3af;font-size:13px">—</span>'}</span>`;
    }

    default:
      return val || "<br/>";
  }
}

// ── Apply column type to all cells in the column ─────────────────
export function applyColType(
  th: HTMLElement,
  type: ColType,
  options?: SelectOption[],
  save?: () => void
) {
  th.dataset.colType = type;
  const table = th.closest("table");
  if (!table) return;
  const idx = getColIndex(th);
  const opts = options ?? getColOptions(th, type);
  const tbody = table.querySelector("tbody");
  if (!tbody) return;

  Array.from(tbody.rows).forEach(row => {
    const td = row.cells[idx] as HTMLElement | undefined;
    if (!td) return;
    const currentVal = td.dataset.cellVal || "";
    if (type === "text") {
      td.contentEditable = "true";
      td.innerHTML = currentVal || "<br/>";
    } else {
      td.contentEditable = "false";
      td.innerHTML = makeCellInner(type, currentVal, opts);
    }
    td.dataset.cellType = type;
  });

  save?.();
}

// ── Hydrate all non-lined tables after loading from localStorage ──
export function hydrateTables(editor: HTMLElement) {
  editor.querySelectorAll("table:not([data-lined])").forEach(table => {
    const ths = table.querySelectorAll("thead th");
    ths.forEach((th, colIdx) => {
      const thEl = th as HTMLElement;
      const type = thEl.dataset.colType as ColType | undefined;
      if (!type || type === "text") return;
      const opts = getColOptions(thEl);
      const tbody = table.querySelector("tbody");
      if (!tbody) return;
      Array.from(tbody.rows).forEach(row => {
        const td = row.cells[colIdx] as HTMLElement | undefined;
        if (!td) return;
        const val = td.dataset.cellVal || "";
        td.contentEditable = "false";
        td.innerHTML = makeCellInner(type, val, opts);
        td.dataset.cellType = type;
      });
    });
  });
}

// ════════════════════════════════════════════════════════════════
// ── ColTypePicker popup ──────────────────────────────────────────
// ════════════════════════════════════════════════════════════════
interface ColTypePickerProps {
  th: HTMLElement;
  rect: DOMRect;
  onClose: () => void;
  onTypeChange: (th: HTMLElement, type: ColType) => void;
  onDeleteCol: () => void;
  onSortAZ: () => void;
  onSortZA: () => void;
}

export function ColTypePicker({ th, rect, onClose, onTypeChange, onDeleteCol, onSortAZ, onSortZA }: ColTypePickerProps) {
  const [name, setName] = useState(() => th.textContent?.trim() || "");
  const currentType = getColType(th);
  const popRef = useRef<HTMLDivElement>(null);

  const left = Math.min(rect.left, window.innerWidth - 260);
  const top = rect.bottom + 4;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        applyName();
        onClose();
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [name, onClose]);

  const applyName = () => {
    const trimmed = name.trim();
    if (trimmed && th.isConnected) {
      th.textContent = trimmed;
    }
  };

  return createPortal(
    <div
      ref={popRef}
      onMouseDown={e => e.stopPropagation()}
      style={{ position: "fixed", top, left, zIndex: 99999, minWidth: 248 }}
      className="bg-white rounded-xl shadow-2xl border border-stone-200 p-3"
    >
      {/* Column name */}
      <div className="mb-3">
        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">COLUMN NAME</div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={applyName}
          onKeyDown={e => { if (e.key === "Enter") { applyName(); } if (e.key === "Escape") onClose(); }}
          className="w-full px-2.5 py-1.5 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-indigo-400"
          autoFocus
        />
      </div>

      {/* Type grid */}
      <div className="mb-3">
        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">COLUMN TYPE</div>
        <div className="grid grid-cols-4 gap-1">
          {COL_TYPES.map(({ type, icon, label }) => (
            <button
              key={type}
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => { applyName(); onTypeChange(th, type); onClose(); }}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg border text-[10px] font-medium transition-colors
                ${currentType === type
                  ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                  : "border-stone-100 hover:bg-stone-50 hover:border-stone-300 text-stone-600"}`}
            >
              <span className="text-sm leading-none">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-stone-100 pt-2 flex flex-col gap-0.5">
        <button onClick={() => { onSortAZ(); onClose(); }}
          className="w-full text-left px-2 py-1.5 text-xs text-stone-600 hover:bg-stone-50 rounded-lg flex items-center gap-2 transition-colors">
          <span>↑</span> Sort A → Z
        </button>
        <button onClick={() => { onSortZA(); onClose(); }}
          className="w-full text-left px-2 py-1.5 text-xs text-stone-600 hover:bg-stone-50 rounded-lg flex items-center gap-2 transition-colors">
          <span>↓</span> Sort Z → A
        </button>
        <button onClick={() => { onDeleteCol(); onClose(); }}
          className="w-full text-left px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors">
          🗑 Delete column
        </button>
      </div>
    </div>,
    document.body
  );
}

// ════════════════════════════════════════════════════════════════
// ── SelectCellPopup — simple fixed status picker ─────────────────
// ════════════════════════════════════════════════════════════════
interface SelectCellPopupProps {
  td: HTMLElement;
  th: HTMLElement;
  rect: DOMRect;
  multi: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function SelectCellPopup({ td, rect, onClose, onSave }: SelectCellPopupProps) {
  const current = td.dataset.cellVal || "";
  const popRef = useRef<HTMLDivElement>(null);

  let top = rect.bottom + 4;
  const left = Math.min(rect.left, window.innerWidth - 200);
  if (top + STATUS_OPTIONS.length * 38 + 16 > window.innerHeight) top = Math.max(8, rect.top - (STATUS_OPTIONS.length * 38 + 16));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, []);

  const pick = (label: string) => {
    const newVal = label === current ? "" : label;
    td.dataset.cellVal = newVal;
    td.innerHTML = makeCellInner("select", newVal);
    onSave();
    onClose();
  };

  return createPortal(
    <div
      ref={popRef}
      onMouseDown={e => e.stopPropagation()}
      style={{ position: "fixed", top, left, zIndex: 99999, minWidth: 180 }}
      className="bg-white rounded-xl shadow-2xl border border-stone-200 p-1.5 flex flex-col gap-0.5"
    >
      {STATUS_OPTIONS.map(s => {
        const isSel = current === s.label;
        return (
          <button key={s.label} onClick={() => pick(s.label)}
            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 transition-colors hover:bg-stone-50"
            style={{ background: isSel ? s.bg : undefined }}>
            <span style={{ fontSize: 15 }}>{s.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: isSel ? s.hex : "#374151" }}>{s.label}</span>
            {isSel && (
              <span style={{ marginLeft: "auto" }}>
                <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke={s.hex} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1.5,6 4.5,9 10.5,3" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

// ════════════════════════════════════════════════════════════════
// ── PriorityCellPopup — fixed 5-level picker ─────────────────────
// ════════════════════════════════════════════════════════════════
interface PriorityCellPopupProps {
  td: HTMLElement;
  rect: DOMRect;
  onClose: () => void;
  onSave: () => void;
}

export function PriorityCellPopup({ td, rect, onClose, onSave }: PriorityCellPopupProps) {
  const popRef = useRef<HTMLDivElement>(null);
  const current = td.dataset.cellVal || "";

  let top = rect.bottom + 4;
  const left = Math.min(rect.left, window.innerWidth - 200);
  if (top + 260 > window.innerHeight) top = Math.max(8, rect.top - 260);

  const pick = (label: string) => {
    const newVal = label === current ? "" : label;
    td.dataset.cellVal = newVal;
    td.innerHTML = makeCellInner("priority", newVal);
    onSave();
    onClose();
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, []);

  return createPortal(
    <div
      ref={popRef}
      onMouseDown={e => e.stopPropagation()}
      style={{ position: "fixed", top, left, zIndex: 99999, minWidth: 180 }}
      className="bg-white rounded-xl shadow-2xl border border-stone-200 p-1.5 flex flex-col gap-0.5"
    >
      {PRIORITY_LEVELS.map(pl => {
        const isSel = current === pl.label;
        return (
          <button
            key={pl.label}
            onClick={() => pick(pl.label)}
            className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2.5 transition-colors hover:bg-stone-50"
            style={{ background: isSel ? pl.bg : undefined }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: pl.hex }}>{pl.label}</span>
            {isSel && (
              <span style={{ marginLeft: "auto", display: "flex" }}>
                <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke={pl.hex} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1.5,6 4.5,9 10.5,3" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

// ════════════════════════════════════════════════════════════════
// ── ProgressCellPopup — slider + live bar ───────────────────────
// ════════════════════════════════════════════════════════════════
interface ProgressCellPopupProps {
  td: HTMLElement;
  rect: DOMRect;
  onClose: () => void;
  onSave: () => void;
}

export function ProgressCellPopup({ td, rect, onClose, onSave }: ProgressCellPopupProps) {
  const [pct, setPct] = useState(() => Math.min(100, Math.max(0, parseInt(td.dataset.cellVal || "0") || 0)));
  const popRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  let top = rect.bottom + 6;
  const left = Math.min(rect.left, window.innerWidth - 220);
  if (top + 140 > window.innerHeight) top = Math.max(8, rect.top - 140);

  const commit = (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    td.dataset.cellVal = String(clamped);
    td.innerHTML = makeCellInner("progress", String(clamped));
    onSave();
    onClose();
  };

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) commit(pct);
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [pct]);

  const color = pct < 50 ? "#f97316" : "#22c55e";

  return createPortal(
    <div
      ref={popRef}
      onMouseDown={e => e.stopPropagation()}
      style={{ position: "fixed", top, left, zIndex: 99999, width: 200 }}
      className="bg-white rounded-xl shadow-2xl border border-stone-200 p-3 flex flex-col gap-2.5"
    >
      {/* Live bar */}
      <div style={{ height: 8, borderRadius: 6, background: "#f3f4f6", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 6, transition: "width 0.12s, background 0.2s" }} />
      </div>

      {/* Number input */}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="number"
          min={0}
          max={100}
          value={pct}
          onChange={e => setPct(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
          onKeyDown={e => { if (e.key === "Enter") commit(pct); if (e.key === "Escape") onClose(); }}
          className="w-full text-sm px-2 py-1 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 text-center"
          style={{ fontFamily: "inherit", fontWeight: 600, color }}
        />
        <span className="text-sm font-semibold" style={{ color, minWidth: 32 }}>{pct}%</span>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        onChange={e => setPct(Number(e.target.value))}
        className="w-full accent-current"
        style={{ accentColor: color }}
      />
    </div>,
    document.body
  );
}

// ════════════════════════════════════════════════════════════════
// ── InlineEditPopup (number, currency, url, email, phone, person, progress) ──
// ════════════════════════════════════════════════════════════════
interface InlineEditPopupProps {
  td: HTMLElement;
  th: HTMLElement;
  rect: DOMRect;
  type: ColType;
  onClose: () => void;
  onSave: () => void;
}

export function InlineEditPopup({ td, th, rect, type, onClose, onSave }: InlineEditPopupProps) {
  const [value, setValue] = useState(td.dataset.cellVal || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const commit = () => {
    const val = type === "progress"
      ? String(Math.min(100, Math.max(0, parseInt(value) || 0)))
      : value;
    td.dataset.cellVal = val;
    const opts = getColOptions(th);
    td.innerHTML = makeCellInner(type, val, opts);
    onSave();
    onClose();
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) commit();
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [value]);

  const inputType =
    type === "number" || type === "currency" || type === "progress" ? "number"
    : type === "email" ? "email"
    : type === "phone" ? "tel"
    : type === "url" ? "url"
    : "text";

  const placeholder: Partial<Record<ColType, string>> = {
    url: "https://...", email: "name@example.com",
    phone: "+1 (555) 000-0000", person: "Name",
    number: "0", currency: "0", progress: "0–100",
  };

  const popWidth = Math.max(200, rect.width);
  const left = Math.min(rect.left, window.innerWidth - popWidth - 8);
  const top = rect.bottom + 2;

  return createPortal(
    <div
      ref={popRef}
      onMouseDown={e => e.stopPropagation()}
      style={{ position: "fixed", top, left, zIndex: 99999, width: popWidth }}
      className="bg-white rounded-lg shadow-xl border border-indigo-300 overflow-hidden"
    >
      <input
        ref={inputRef}
        type={inputType}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") onClose(); }}
        placeholder={placeholder[type] || ""}
        min={type === "progress" ? "0" : undefined}
        max={type === "progress" ? "100" : undefined}
        className="w-full px-2.5 py-1.5 text-sm focus:outline-none"
        style={{ fontFamily: "inherit" }}
      />
    </div>,
    document.body
  );
}
