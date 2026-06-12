import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useParams, useLocation, Redirect } from "wouter";
import {
  ChevronLeft, Plus, Trash2, Bold, Italic, Underline, Strikethrough, Highlighter,
  CheckSquare, Minus, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, List, ChevronRight, Link, PenLine, Eraser,
  Table, Undo2, Redo2, BarChart2, Subscript, Superscript, ImagePlus, X,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import arrowCircleLeftIcon from "@assets/arrow-circle-broken-left-svgrepo-com_1781232885093.png";
import arrowCircleCloseIcon from "@assets/arrow-circle-broken-left-svgrepo-com_(1)_1781233113625.png";
import arrowCircleRightIcon from "@assets/arrow-circle-broken-left-svgrepo-com_(3)_1781233231019.png";
import arrowCircleLeftCloseIcon from "@assets/arrow-circle-broken-left-svgrepo-com_(2)_1781233449327.png";
import cylinderIcon from "@assets/3d-cylinder-3d-design-3d-shape-cylinder-geometric-geometry-svg_1780973962135.svg";
import cubeIcon from "@assets/3d-cube-3d-design-3d-shape-cube-geometric-geometry-3-svgrepo-c_1780974626332.svg";
import octahedronIcon from "@assets/3d-design-3d-octahedron-3d-shape-geometric-geometry-octahedron_1780974626332.svg";
import triPrismIcon from "@assets/3d-design-3d-shape-3d-triangle-shape-geometric-geometry-shape-_1780974626332.svg";
import hexPrismIcon from "@assets/3d-hexagonal-prism-3d-shape-geometric-geometry-hexagon-prism-s_1780974626333.svg";
import pentPrismIcon from "@assets/3d-pentagonal-prism-3d-shape-geometric-geometry-pentagon-prism_1780974626333.svg";
import pyramidIcon from "@assets/3d-pyramid-3d-shape-geometric-geometry-prism-pyramid-svgrepo-c_1780974626333.svg";
import triPyramidIcon from "@assets/3d-shape-3d-triangle-shape-geometric-prism-pyramid-shape-svgre_1780974626334.svg";
import pinIcon from "@assets/pin-svgrepo-com_1780935998946.png";
import numberIcon from "@assets/number-svgrepo-com_1780936571964.png";
import cardIcon from "@assets/card-layout-filled-svgrepo-com_1780936676782.png";
import columnIcon from "@assets/column-spacing-svgrepo-com_1780936842510.png";
import definitionIcon from "@assets/card-plus-svgrepo-com_1780937097258.png";
import codeIcon from "@assets/code_1780940574616.png";
import bulbIcon from "@assets/idea-bulb-glow-svgrepo-com_1780940805368.png";
import quoteIcon from "@assets/block-element-svgrepo-com_1780941287821.png";
import lineChartIcon from "@assets/chart-diagram-double-graph-spline-svgrepo-com_1780985340846.svg";
import barChartIcon from "@assets/bar-chart-diagram-graph-large-svgrepo-com_1780985481312.svg";
import pieChartIcon from "@assets/chart-diagram-graph-pie-statistics-svgrepo-com_1780985481312.svg";
import areaChartIcon from "@assets/chart-diagram-graph-spline-statistics-svgrepo-com_1780985481313.svg";
import { store, type Book, type Page } from "@/lib/store";
import {
  ColTypePicker, SelectCellPopup, PriorityCellPopup, ProgressCellPopup, TimeCellPopup, IDCellPopup,
  applyColType, hydrateTables, makeCellInner, getColType, getColOptions,
  getColIndex, findTh,
  type ColType,
} from "@/components/project-table-types";

// ── Constants ────────────────────────────────────────────────────

const HIGHLIGHT_COLORS = [
  { label: "Yellow", color: "#fef08a" },
  { label: "Green",  color: "#bbf7d0" },
  { label: "Blue",   color: "#bfdbfe" },
  { label: "Pink",   color: "#fecdd3" },
  { label: "Orange", color: "#fed7aa" },
  { label: "Purple", color: "#e9d5ff" },
];

const FONT_COLORS = [
  { label: "Black",  color: "#000000" },
  { label: "Gray",   color: "#6b7280" },
  { label: "Red",    color: "#ef4444" },
  { label: "Orange", color: "#f97316" },
  { label: "Yellow", color: "#eab308" },
  { label: "Green",  color: "#22c55e" },
  { label: "Blue",   color: "#3b82f6" },
  { label: "Indigo", color: "#6366f1" },
  { label: "Purple", color: "#a855f7" },
  { label: "Pink",   color: "#ec4899" },
];

const FONTS_CTX = [
  "Inter", "Arial", "Arial Black", "Roboto", "Lato", "Poppins", "Merriweather", "Algerian",
];

const DRAW_SHAPES = [
  { key: "arrow",    icon: "→",  label: "Arrow"    },
  { key: "line",     icon: "—",  label: "Line"     },
  { key: "dashed",   icon: "╌",  label: "Dashed"   },
  { key: "vline",    icon: "|",  label: "V-Line"   },
  { key: "rect",     icon: "▭",  label: "Box"      },
  { key: "circle",   icon: "○",  label: "Circle"   },
  { key: "triangle", icon: "△",  label: "Triangle" },
  { key: "arc",      icon: "⌒",  label: "Arc"      },
  { key: "diamond",  icon: "◇",  label: "Diamond"  },
  { key: "star",     icon: "☆",  label: "Star"     },
  { key: "double",   icon: "↔",  label: "D-Arrow"  },
  { key: "cross",    icon: "✚",  label: "Cross"    },
  { key: "pentagon", icon: "⬠",  label: "Pentagon" },
  { key: "cylinder",   icon: <img src={cylinderIcon}   className="w-4 h-4 object-contain" />, label: "Cylinder"   },
  { key: "cube",       icon: <img src={cubeIcon}       className="w-4 h-4 object-contain" />, label: "Cube"       },
  { key: "octahedron", icon: <img src={octahedronIcon} className="w-4 h-4 object-contain" />, label: "Octahedron" },
  { key: "triprism",   icon: <img src={triPrismIcon}   className="w-4 h-4 object-contain" />, label: "Tri-Prism"  },
  { key: "hexprism",   icon: <img src={hexPrismIcon}   className="w-4 h-4 object-contain" />, label: "Hex-Prism"  },
  { key: "pentprism",  icon: <img src={pentPrismIcon}  className="w-4 h-4 object-contain" />, label: "Pent-Prism" },
  { key: "pyramid",    icon: <img src={pyramidIcon}    className="w-4 h-4 object-contain" />, label: "Pyramid"    },
  { key: "tripyramid", icon: <img src={triPyramidIcon} className="w-4 h-4 object-contain" />, label: "Tri-Pyr"    },
];

const DRAW_TOOL_LABELS: Record<string, string> = {
  arrow: "Arrow", line: "Line", dashed: "Dashed", vline: "V-Line",
  rect: "Box", circle: "Circle", triangle: "Triangle", arc: "Arc",
  diamond: "Diamond", star: "Star", double: "D-Arrow", cross: "Cross", pentagon: "Pentagon",
  cylinder: "Cylinder", cube: "Cube", octahedron: "Octahedron", triprism: "Tri-Prism",
  hexprism: "Hex-Prism", pentprism: "Pent-Prism", pyramid: "Pyramid", tripyramid: "Tri-Pyr",
  eraser: "Eraser",
};

const GRAPH_COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899"];
const ERASER_RADIUS = 17;

// ── Types ────────────────────────────────────────────────────────

type DrawTool = "arrow"|"line"|"rect"|"circle"|"triangle"|"dashed"|"vline"|"arc"|
  "diamond"|"star"|"double"|"cross"|"pentagon"|
  "cylinder"|"cube"|"octahedron"|"triprism"|"hexprism"|"pentprism"|"pyramid"|"tripyramid"|"eraser";

type GraphType = "bar"|"line"|"pie"|"area";

interface ArrowShape {
  id: string;
  type?: string;
  x1: number; y1: number;
  x2: number; y2: number;
  color: string;
}

interface GraphBlock {
  id: string;
  x: number; y: number;
  width: number; height: number;
  type: GraphType;
  title: string;
  color: string;
  data: { label: string; value: number }[];
}

interface ImageBlock {
  id: string; src: string; x: number; y: number; width: number; locked: boolean;
}

interface VideoBlock {
  id: string; src: string; name: string; x: number; y: number; width: number; locked: boolean;
}

interface ContextMenuState {
  x: number; y: number;
  formatOpen: boolean; alignOpen: boolean; bulletOpen: boolean;
  highlightOpen: boolean; fontColorOpen: boolean; headingOpen: boolean;
  dividerOpen: boolean; linkOpen: boolean; todoOpen: boolean;
  todoCount: number; todoRemoveCount: number;
  drawOpen: boolean; graphOpen: boolean; tableOpen: boolean;
  fontOpen: boolean; blockOpen: boolean; mediaOpen: boolean;
  subActive: boolean; supActive: boolean;
  boldActive: boolean; italicActive: boolean; underlineActive: boolean; strikeActive: boolean;
}

const CLOSE_ALL_SUBS = {
  formatOpen: false, fontOpen: false, alignOpen: false, bulletOpen: false,
  dividerOpen: false, linkOpen: false, drawOpen: false, tableOpen: false,
  mediaOpen: false, blockOpen: false, graphOpen: false,
  highlightOpen: false, fontColorOpen: false, headingOpen: false,
};

// ── Eraser helpers ───────────────────────────────────────────────

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function shapeIntersectsCircle(shape: ArrowShape, cx: number, cy: number, r: number) {
  const { x1, y1, x2, y2, type = "arrow" } = shape;
  if (type === "vline") return distToSegment(cx, cy, x1, y1, x1, y2) <= r;
  if (["arrow", "line", "dashed"].includes(type)) return distToSegment(cx, cy, x1, y1, x2, y2) <= r;
  const minX = Math.min(x1, x2) - r, maxX = Math.max(x1, x2) + r;
  const minY = Math.min(y1, y2) - r, maxY = Math.max(y1, y2) + r;
  return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
}

// ── DrawShapeEl ──────────────────────────────────────────────────

function DrawShapeEl({ shape, isPreview = false, eraserMode = false, onRemove }: {
  shape: ArrowShape; isPreview?: boolean; eraserMode?: boolean; onRemove?: () => void;
}) {
  const { x1, y1, x2, y2, type = "arrow", color } = shape;
  const sw = 2.5;
  const canClick = !isPreview && eraserMode && !!onRemove;
  const ptrEvents: React.CSSProperties["pointerEvents"] = canClick ? "auto" : "none";
  const cursor = canClick ? "inherit" : "default";
  const opacity = isPreview ? 0.55 : 1;
  const previewDash = isPreview ? "6 3" : undefined;
  const common = { stroke: color, strokeWidth: sw, fill: "none" as const, opacity, style: { pointerEvents: ptrEvents, cursor }, onClick: canClick ? onRemove : undefined } as const;

  switch (type) {
    case "arrow":
      return <line {...common} x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={previewDash} markerEnd="url(#ah-red)" />;
    case "line":
      return <line {...common} x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={previewDash} />;
    case "dashed":
      return <line {...common} x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={previewDash ?? "8 4"} />;
    case "vline":
      return <line {...common} x1={x1} y1={y1} x2={x1} y2={y2} strokeDasharray={previewDash} />;
    case "rect": {
      const rx = Math.min(x1, x2), ry = Math.min(y1, y2);
      return <rect {...common} x={rx} y={ry} width={Math.abs(x2 - x1)} height={Math.abs(y2 - y1)} strokeDasharray={previewDash} />;
    }
    case "circle": {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      return <ellipse {...common} cx={cx} cy={cy} rx={Math.max(Math.abs(x2 - x1) / 2, 1)} ry={Math.max(Math.abs(y2 - y1) / 2, 1)} strokeDasharray={previewDash} />;
    }
    case "triangle": {
      const pts = `${(x1+x2)/2},${Math.min(y1,y2)} ${Math.max(x1,x2)},${Math.max(y1,y2)} ${Math.min(x1,x2)},${Math.max(y1,y2)}`;
      return <polygon {...common} points={pts} strokeDasharray={previewDash} />;
    }
    case "arc": {
      const lx = Math.min(x1, x2), rx3 = Math.max(x1, x2);
      const maxY = Math.max(y1, y2);
      const rw = Math.max(Math.abs(x2 - x1) / 2, 1), rh = Math.max(Math.abs(y2 - y1) / 2, 1);
      return <path {...common} d={`M ${lx} ${maxY} A ${rw} ${rh} 0 0 1 ${rx3} ${maxY}`} strokeDasharray={previewDash} />;
    }
    case "diamond": {
      const cx = (x1+x2)/2, cy = (y1+y2)/2;
      const hw = Math.abs(x2-x1)/2, hh = Math.abs(y2-y1)/2;
      return <polygon {...common} points={`${cx},${cy-hh} ${cx+hw},${cy} ${cx},${cy+hh} ${cx-hw},${cy}`} strokeDasharray={previewDash} />;
    }
    case "star": {
      const cx = (x1+x2)/2, cy = (y1+y2)/2;
      const or = Math.min(Math.abs(x2-x1), Math.abs(y2-y1)) / 2;
      const ir = or * 0.42;
      const pts = Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? or : ir;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(" ");
      return <polygon {...common} points={pts} strokeDasharray={previewDash} />;
    }
    case "double":
      return <line {...common} x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={previewDash} markerStart="url(#ah-start)" markerEnd="url(#ah-red)" />;
    case "cross": {
      const cx = (x1+x2)/2, cy = (y1+y2)/2;
      return <path {...common} d={`M ${x1} ${cy} L ${x2} ${cy} M ${cx} ${y1} L ${cx} ${y2}`} strokeDasharray={previewDash} />;
    }
    case "pentagon": {
      const cx = (x1+x2)/2, cy = (y1+y2)/2;
      const r = Math.min(Math.abs(x2-x1), Math.abs(y2-y1)) / 2;
      const pts = Array.from({ length: 5 }, (_, i) => {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(" ");
      return <polygon {...common} points={pts} strokeDasharray={previewDash} />;
    }
    case "cylinder": case "cube": case "octahedron": case "triprism":
    case "hexprism": case "pentprism": case "pyramid": case "tripyramid": {
      const iconMap: Record<string, string> = {
        cylinder: cylinderIcon, cube: cubeIcon, octahedron: octahedronIcon,
        triprism: triPrismIcon, hexprism: hexPrismIcon, pentprism: pentPrismIcon,
        pyramid: pyramidIcon, tripyramid: triPyramidIcon,
      };
      return (
        <image href={iconMap[type]} x={Math.min(x1,x2)} y={Math.min(y1,y2)}
          width={Math.max(Math.abs(x2-x1), 1)} height={Math.max(Math.abs(y2-y1), 1)}
          opacity={opacity} style={{ pointerEvents: ptrEvents, cursor }}
          onClick={canClick ? onRemove : undefined} />
      );
    }
    default: return null;
  }
}

// ── GraphBlockEl ─────────────────────────────────────────────────

function GraphBlockEl({ block, onRemove, onDragStart, onResizeStart }: {
  block: GraphBlock;
  onRemove: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  const { type, data, title, color, width, height, x, y } = block;
  const chartData = data.map(d => ({ name: d.label, value: d.value }));

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={height - 44}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
              <Tooltip /><Bar dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={height - 44}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
              <Tooltip /><Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={height - 44}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
              <Tooltip /><Area type="monotone" dataKey="value" stroke={color} fill={color + "33"} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={height - 44}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={Math.min(width, height - 44) * 0.35} label={({ name }) => name}>
                {chartData.map((_, i) => <Cell key={i} fill={GRAPH_COLORS[i % GRAPH_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div
      className="absolute group/graph"
      style={{ left: x, top: y, width, height, zIndex: 20 }}
    >
      <div className="relative w-full h-full bg-white rounded-xl border border-stone-200 shadow-md overflow-hidden">
        <div className="flex items-center justify-between px-3 pt-2 pb-1">
          <span className="text-[11px] font-semibold text-stone-500">{title}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover/graph:opacity-100 transition-opacity">
            <button onMouseDown={onDragStart} className="cursor-grab p-0.5 hover:text-indigo-500 text-stone-400 text-xs">⠿</button>
            <button onClick={onRemove} className="p-0.5 hover:text-red-500 text-stone-400"><X className="w-3 h-3" /></button>
          </div>
        </div>
        {renderChart()}
        <div onMouseDown={onResizeStart} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 group-hover/graph:opacity-40"
          style={{ background: "linear-gradient(135deg,transparent 40%,#9ca3af 40%,#9ca3af 55%,transparent 55%,transparent 70%,#9ca3af 70%,#9ca3af 85%,transparent 85%)" }} />
      </div>
    </div>
  );
}

// ── CtxSection / CtxItem ─────────────────────────────────────────

function CtxSection({ label }: { label: string }) {
  return (
    <div className="px-3 py-0">
      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function CtxItem({ icon, label, shortcut, hasArrow, active, onClick }: {
  icon: React.ReactNode; label: string; shortcut?: string; hasArrow?: boolean; active?: boolean; onClick: () => void;
}) {
  return (
    <button onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left ${active ? "bg-indigo-50 text-indigo-700" : "text-stone-700"}`}>
      <span className={`flex-shrink-0 ${active ? "text-indigo-500" : "text-stone-400"}`}>{icon}</span>
      <span className="text-xs font-medium flex-1">{label}</span>
      {shortcut && <span className={`text-[10px] flex-shrink-0 ${active ? "text-indigo-400 font-semibold" : "text-stone-400"}`}>{shortcut}</span>}
      {hasArrow && <ChevronRight className="w-3 h-3 text-stone-400 flex-shrink-0" />}
    </button>
  );
}

// ── A4Page ───────────────────────────────────────────────────────

function A4Page({
  page, index, bookId, onDelete, onContentChange, isSaving,
}: {
  page: Page; index: number; bookId: number;
  onDelete: (pageId: number) => void;
  onContentChange: (pageId: number, html: string) => void;
  isSaving: boolean;
}) {
  const editorRef    = useRef<HTMLDivElement>(null);
  const paperRef     = useRef<HTMLDivElement>(null);
  const ctxMenuRef   = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved    = useRef(page.content);
  const isComposing  = useRef(false);
  const historyRef   = useRef<{ html: string }[]>([]);
  const historyIndexRef = useRef(-1);
  const arrowDrawRef = useRef<{ startX: number; startY: number; type: string } | null>(null);
  const fontItemRef  = useRef<HTMLDivElement>(null);
  const fontSubCardRef = useRef<HTMLDivElement>(null);
  const tableItemRef  = useRef<HTMLDivElement>(null);
  const tableSubCardRef = useRef<HTMLDivElement>(null);
  const calloutPickerRef = useRef<HTMLDivElement>(null);
  const imgInputRef   = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const graphDragRef  = useRef<{ id: string; startMx: number; startMy: number; startBx: number; startBy: number } | null>(null);
  const graphResizeRef = useRef<{ id: string; startMx: number; startMy: number; startW: number; startH: number } | null>(null);
  const dragRef = useRef<{ id: string; startMx: number; startMy: number; startBx: number; startBy: number } | null>(null);
  const resizeRef = useRef<{ id: string; startMx: number; startW: number; startBx: number; side: "br"|"bl" } | null>(null);
  const videoDragRef = useRef<{ id: string; startMx: number; startMy: number; startBx: number; startBy: number } | null>(null);
  const videoResizeRef = useRef<{ id: string; startMx: number; startW: number; startBx: number; side: "br"|"bl" } | null>(null);
  const imageBlocksRef = useRef<ImageBlock[]>([]);
  const videoBlocksRef = useRef<VideoBlock[]>([]);
  const activeEditRef = useRef<{ td: HTMLElement; finish: () => void } | null>(null);
  const activeTableRef = useRef<HTMLTableElement | null>(null);
  const tableResizeObserverRef = useRef<ResizeObserver | null>(null);
  const lastKeyRef = useRef<string>("");

  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [calloutPickerPos, setCalloutPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [ctxTableHover, setCtxTableHover] = useState<{ r: number; c: number } | null>(null);
  const [ctxTableCustomRows, setCtxTableCustomRows] = useState("");
  const [ctxTableCustomCols, setCtxTableCustomCols] = useState("");
  const [ctxFontSearch, setCtxFontSearch] = useState("");
  const [ctxFontSize, setCtxFontSize] = useState(18);
  const [ctxSelectedFont, setCtxSelectedFont] = useState<string | null>(null);
  const [ctxFontSizeMode, setCtxFontSizeMode] = useState<"all"|"selected">("all");
  const [drawTool, setDrawTool] = useState<DrawTool | null>(null);
  const [arrows, setArrows] = useState<ArrowShape[]>([]);
  const [drawingArrow, setDrawingArrow] = useState<ArrowShape | null>(null);
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);
  const [graphBlocks, setGraphBlocks] = useState<GraphBlock[]>([]);
  const [imageBlocks, setImageBlocks] = useState<ImageBlock[]>([]);
  const [videoBlocks, setVideoBlocks] = useState<VideoBlock[]>([]);
  const [colTypePopup, setColTypePopup] = useState<{ th: HTMLElement; rect: DOMRect } | null>(null);
  const [selectCellPopup, setSelectCellPopup] = useState<{ td: HTMLElement; th: HTMLElement; rect: DOMRect; multi: boolean } | null>(null);
  const [priorityCellPopup, setPriorityCellPopup] = useState<{ td: HTMLElement; rect: DOMRect } | null>(null);
  const [progressCellPopup, setProgressCellPopup] = useState<{ td: HTMLElement; rect: DOMRect } | null>(null);
  const [timeCellPopup, setTimeCellPopup] = useState<{ td: HTMLElement; rect: DOMRect } | null>(null);
  const [idCellPopup, setIdCellPopup] = useState<{ td: HTMLElement; rect: DOMRect } | null>(null);
  const [tableToolbar, setTableToolbar] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [showTableBtns, setShowTableBtns] = useState(false);
  const [hoverTableBtns, setHoverTableBtns] = useState(false);
  const [tableLinesHidden, setTableLinesHidden] = useState(false);
  const [lastTodoPos, setLastTodoPos] = useState<{ top: number; left: number } | null>(null);
  const [showTodoButtons, setShowTodoButtons] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [leftNote, setLeftNote] = useState(() => localStorage.getItem(`nb_sidenote_${bookId}_${page.id}_left`) ?? "");
  const [rightNote, setRightNote] = useState(() => localStorage.getItem(`nb_sidenote_${bookId}_${page.id}_right`) ?? "");
  const [pageNoteOpen, setPageNoteOpen] = useState(false);
  const [pageNote, setPageNote] = useState(() => localStorage.getItem(`nb_sidenote_${bookId}_${page.id}_page`) ?? "");

  // ── Sync refs with latest state
  useEffect(() => { imageBlocksRef.current = imageBlocks; }, [imageBlocks]);
  useEffect(() => { videoBlocksRef.current = videoBlocks; }, [videoBlocks]);

  // ── Init editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== page.content) {
      editorRef.current.innerHTML = page.content;
      lastSaved.current = page.content;
      hydrateTables(editorRef.current);
    }
  }, [page.id]);

  // ── Load/save arrows & graphs per page
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`nb_page_arrows_${page.id}`);
      setArrows(raw ? JSON.parse(raw) : []);
    } catch { setArrows([]); }
  }, [page.id]);

  useEffect(() => {
    localStorage.setItem(`nb_page_arrows_${page.id}`, JSON.stringify(arrows));
  }, [arrows, page.id]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(`nb_page_graphs_${page.id}`);
      setGraphBlocks(raw ? JSON.parse(raw) : []);
    } catch { setGraphBlocks([]); }
  }, [page.id]);

  useEffect(() => {
    localStorage.setItem(`nb_page_graphs_${page.id}`, JSON.stringify(graphBlocks));
  }, [graphBlocks, page.id]);

  // ── Escape key exits draw mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setDrawTool(null); setDrawingArrow(null); arrowDrawRef.current = null; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Document-level mouse handlers for draw & graph/image/video drag/resize
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (graphDragRef.current) {
        const { id, startMx, startMy, startBx, startBy } = graphDragRef.current;
        setGraphBlocks(prev => prev.map(g => g.id === id ? { ...g, x: startBx + e.clientX - startMx, y: startBy + e.clientY - startMy } : g));
      }
      if (graphResizeRef.current) {
        const { id, startMx, startMy, startW, startH } = graphResizeRef.current;
        setGraphBlocks(prev => prev.map(g => g.id === id ? { ...g, width: Math.max(180, startW + e.clientX - startMx), height: Math.max(120, startH + e.clientY - startMy) } : g));
      }
      if (dragRef.current) {
        const { id, startMx, startMy, startBx, startBy } = dragRef.current;
        setImageBlocks(prev => prev.map(b => b.id === id ? { ...b, x: startBx + e.clientX - startMx, y: startBy + e.clientY - startMy } : b));
      }
      if (resizeRef.current) {
        const { id, startMx, startW, startBx, side } = resizeRef.current;
        const dx = e.clientX - startMx;
        if (side === "br") {
          setImageBlocks(prev => prev.map(b => b.id === id ? { ...b, width: Math.max(80, startW + dx) } : b));
        } else {
          const newW = Math.max(80, startW - dx);
          setImageBlocks(prev => prev.map(b => b.id === id ? { ...b, width: newW, x: startBx + (startW - newW) } : b));
        }
      }
      if (videoDragRef.current) {
        const { id, startMx, startMy, startBx, startBy } = videoDragRef.current;
        setVideoBlocks(prev => prev.map(b => b.id === id ? { ...b, x: startBx + e.clientX - startMx, y: startBy + e.clientY - startMy } : b));
      }
      if (videoResizeRef.current) {
        const { id, startMx, startW, startBx, side } = videoResizeRef.current;
        const dx = e.clientX - startMx;
        if (side === "br") {
          setVideoBlocks(prev => prev.map(b => b.id === id ? { ...b, width: Math.max(120, startW + dx) } : b));
        } else {
          const newW = Math.max(120, startW - dx);
          setVideoBlocks(prev => prev.map(b => b.id === id ? { ...b, width: newW, x: startBx + (startW - newW) } : b));
        }
      }
      if (arrowDrawRef.current) {
        const svg = paperRef.current?.querySelector("svg");
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        setDrawingArrow(prev => prev ? { ...prev, x2: e.clientX - rect.left, y2: e.clientY - rect.top } : null);
      }
    };
    const onUp = (e: MouseEvent) => {
      graphDragRef.current = null;
      graphResizeRef.current = null;
      if (dragRef.current) {
        dragRef.current = null;
        localStorage.setItem(`nb_page_imgs_${page.id}`, JSON.stringify(imageBlocksRef.current));
      }
      if (resizeRef.current) {
        resizeRef.current = null;
        localStorage.setItem(`nb_page_imgs_${page.id}`, JSON.stringify(imageBlocksRef.current));
      }
      if (videoDragRef.current) {
        videoDragRef.current = null;
        localStorage.setItem(`nb_page_vids_${page.id}`, JSON.stringify(videoBlocksRef.current));
      }
      if (videoResizeRef.current) {
        videoResizeRef.current = null;
        localStorage.setItem(`nb_page_vids_${page.id}`, JSON.stringify(videoBlocksRef.current));
      }
      if (arrowDrawRef.current) {
        const svg = paperRef.current?.querySelector("svg");
        if (svg) {
          const rect = svg.getBoundingClientRect();
          const x2 = e.clientX - rect.left;
          const y2 = e.clientY - rect.top;
          const { startX, startY, type } = arrowDrawRef.current;
          const dist = Math.sqrt((x2 - startX) ** 2 + (y2 - startY) ** 2);
          if (dist > 8) {
            setArrows(prev => [...prev, { id: crypto.randomUUID(), type, x1: startX, y1: startY, x2, y2, color: "#ef4444" }]);
          }
        }
        arrowDrawRef.current = null;
        setDrawingArrow(null);
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [page.id]);

  // ── Load/save imageBlocks per page
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`nb_page_imgs_${page.id}`);
      const parsed = raw ? JSON.parse(raw) : [];
      setImageBlocks(parsed);
      imageBlocksRef.current = parsed;
    } catch { setImageBlocks([]); }
  }, [page.id]);

  useEffect(() => {
    localStorage.setItem(`nb_page_imgs_${page.id}`, JSON.stringify(imageBlocks));
  }, [imageBlocks, page.id]);

  // ── Load/save videoBlocks per page
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`nb_page_vids_${page.id}`);
      const parsed = raw ? JSON.parse(raw) : [];
      setVideoBlocks(parsed);
      videoBlocksRef.current = parsed;
    } catch { setVideoBlocks([]); }
  }, [page.id]);

  useEffect(() => {
    localStorage.setItem(`nb_page_vids_${page.id}`, JSON.stringify(videoBlocks));
  }, [videoBlocks, page.id]);

  // ── Close context menu / callout on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ctxMenu && ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node))
        setCtxMenu(null);
      if (calloutPickerPos && calloutPickerRef.current && !calloutPickerRef.current.contains(e.target as Node))
        setCalloutPickerPos(null);
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [ctxMenu, calloutPickerPos]);

  // ── Clamp context menu inside viewport
  useLayoutEffect(() => {
    if (!ctxMenu || !ctxMenuRef.current) return;
    const rect = ctxMenuRef.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const newX = rect.right > vw ? Math.max(0, vw - rect.width - 8) : ctxMenu.x;
    const newY = rect.bottom > vh ? Math.max(0, vh - rect.height - 8) : ctxMenu.y;
    if (newX !== ctxMenu.x || newY !== ctxMenu.y)
      setCtxMenu(m => m ? { ...m, x: newX, y: newY } : null);
  }, [ctxMenu?.x, ctxMenu?.y]);

  // ── Clamp font sub-card
  useLayoutEffect(() => {
    if (!ctxMenu?.fontOpen || !fontSubCardRef.current || !fontItemRef.current) return;
    const anchor = fontItemRef.current.getBoundingClientRect();
    const card = fontSubCardRef.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = anchor.right + 4;
    if (left + card.width > vw - 8) left = anchor.left - card.width - 4;
    let top = Math.min(anchor.top, vh - card.height - 8);
    top = Math.max(8, top);
    left = Math.max(8, Math.min(left, vw - card.width - 8));
    fontSubCardRef.current.style.top = `${top}px`;
    fontSubCardRef.current.style.left = `${left}px`;
  }, [ctxMenu?.fontOpen]);

  // ── Clamp table sub-card
  useLayoutEffect(() => {
    if (!ctxMenu?.tableOpen || !tableSubCardRef.current || !tableItemRef.current) return;
    const anchor = tableItemRef.current.getBoundingClientRect();
    const card = tableSubCardRef.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = anchor.right + 4;
    if (left + card.width > vw - 8) left = anchor.left - card.width - 4;
    let top = Math.max(8, Math.min(anchor.bottom - card.height, vh - card.height - 8));
    left = Math.max(8, Math.min(left, vw - card.width - 8));
    tableSubCardRef.current.style.top = `${top}px`;
    tableSubCardRef.current.style.left = `${left}px`;
  }, [ctxMenu?.tableOpen]);

  // ── Remove-block event delegation
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest('[data-remove-btn]') as HTMLElement | null;
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      const block = btn.closest('[data-quote-block],[data-link-block]') as HTMLElement | null;
      if (block) { block.remove(); saveContent(); }
    };
    editor.addEventListener("click", handler);
    return () => editor.removeEventListener("click", handler);
  }, []);

  // ── Save helpers
  const saveContent = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    if (html === lastSaved.current) return;
    store.updatePage(bookId, page.id, { content: html });
    lastSaved.current = html;
    onContentChange(page.id, html);
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push({ html });
    if (historyRef.current.length > 60) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
  }, [bookId, page.id, onContentChange]);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveContent, 600);
  }, [saveContent]);

  // ── Date input change listener in tables (needs debouncedSave defined first)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const handler = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (input.type !== "date" && input.type !== "time") return;
      const td = input.closest("td") as HTMLElement | null;
      if (!td) return;
      td.dataset.cellVal = input.value;
      debouncedSave();
    };
    editor.addEventListener("change", handler);
    return () => editor.removeEventListener("change", handler);
  }, [debouncedSave]);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isComposing.current) return;
    debouncedSave();
  }, [debouncedSave]);

  // ── Selection helpers
  const restoreSelection = () => {
    if (!savedRangeRef.current) return;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(savedRangeRef.current);
  };

  // ── Undo / Redo
  const universalUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const snap = historyRef.current[historyIndexRef.current];
    if (!snap || !editorRef.current) return;
    editorRef.current.innerHTML = snap.html;
    lastSaved.current = snap.html;
    store.updatePage(bookId, page.id, { content: snap.html });
    onContentChange(page.id, snap.html);
  }, [bookId, page.id, onContentChange]);

  const universalRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const snap = historyRef.current[historyIndexRef.current];
    if (!snap || !editorRef.current) return;
    editorRef.current.innerHTML = snap.html;
    lastSaved.current = snap.html;
    store.updatePage(bookId, page.id, { content: snap.html });
    onContentChange(page.id, snap.html);
  }, [bookId, page.id, onContentChange]);

  // ── Format helpers
  const BLOCK_FMT_CMDS = new Set(["justifyLeft","justifyCenter","justifyRight","formatBlock","removeFormat"]);
  const INLINE_FORMAT_TAGS = new Set(["B","STRONG","I","EM","U","S","STRIKE","DEL","FONT","SPAN","SUP","SUB","MARK"]);

  const breakFormatAfterApply = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    let node: Node | null = range.startContainer;
    let outermost: Node | null = null;
    while (node && node !== editorRef.current) {
      if (node.nodeType === Node.ELEMENT_NODE && INLINE_FORMAT_TAGS.has((node as Element).tagName))
        outermost = node;
      node = node.parentNode;
    }
    const escape = document.createTextNode("\u200B");
    if (outermost && outermost.parentNode) {
      outermost.parentNode.insertBefore(escape, outermost.nextSibling);
    } else {
      const r = range.cloneRange(); r.collapse(false); r.insertNode(escape);
    }
    const newRange = document.createRange();
    newRange.setStartAfter(escape); newRange.collapse(true);
    sel.removeAllRanges(); sel.addRange(newRange);
  };

  const exitSubSupFormat = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    let node: Node | null = sel.getRangeAt(0).startContainer;
    while (node && node !== editorRef.current) {
      if (node.nodeName === "SUP" || node.nodeName === "SUB") {
        const zwnj = document.createTextNode("\u200B");
        node.parentNode?.insertBefore(zwnj, node.nextSibling);
        const nr = document.createRange(); nr.setStartAfter(zwnj); nr.collapse(true);
        sel.removeAllRanges(); sel.addRange(nr);
        return;
      }
      node = node.parentNode;
    }
  };

  const execFmt = (cmd: string, value?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, value);
    if (!BLOCK_FMT_CMDS.has(cmd)) setTimeout(breakFormatAfterApply, 0);
    setCtxMenu(null);
    debouncedSave();
  };

  const execAllCaps = () => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { setCtxMenu(null); return; }
    const text = sel.getRangeAt(0).toString();
    if (!text) { setCtxMenu(null); return; }
    document.execCommand("insertText", false, text === text.toUpperCase() ? text.toLowerCase() : text.toUpperCase());
    setCtxMenu(null); debouncedSave();
  };

  const applyStyleToRange = (range: Range, prop: "fontFamily"|"fontSize", value: string) => {
    if (range.collapsed) return;
    const fragment = range.extractContents();
    const span = document.createElement("span");
    span.style[prop] = value;
    span.appendChild(fragment);
    range.insertNode(span);
    const sel = window.getSelection();
    if (sel) {
      const nr = document.createRange(); nr.selectNodeContents(span);
      sel.removeAllRanges(); sel.addRange(nr);
      savedRangeRef.current = nr.cloneRange();
    }
  };

  const getActiveRange = (): Range | null => {
    const cur = window.getSelection();
    if (cur && cur.rangeCount > 0 && !cur.isCollapsed) {
      const r = cur.getRangeAt(0).cloneRange();
      savedRangeRef.current = r.cloneRange(); return r;
    }
    if (!savedRangeRef.current || savedRangeRef.current.collapsed) return null;
    restoreSelection();
    const restored = window.getSelection();
    if (restored && restored.rangeCount > 0 && !restored.isCollapsed)
      return restored.getRangeAt(0).cloneRange();
    return null;
  };

  const applyCtxFontName = (name: string) => {
    if (ctxFontSizeMode === "all") {
      if (editorRef.current) {
        editorRef.current.style.fontFamily = name;
        editorRef.current.querySelectorAll<HTMLElement>("*").forEach(el => { if (el.style.fontFamily) el.style.fontFamily = ""; });
        debouncedSave();
      }
      return;
    }
    const range = getActiveRange(); if (!range) return;
    editorRef.current?.focus({ preventScroll: true });
    applyStyleToRange(range, "fontFamily", name);
    debouncedSave();
  };

  const applyCtxFontSize = (size: number) => {
    setCtxFontSize(size);
    if (ctxFontSizeMode === "all") {
      if (editorRef.current) {
        editorRef.current.style.fontSize = `${size}px`;
        localStorage.setItem(`nb_page_fs_${page.id}`, String(size));
        editorRef.current.querySelectorAll<HTMLElement>("*").forEach(el => { if (el.style.fontSize) el.style.fontSize = ""; });
        debouncedSave();
      }
    } else {
      const range = getActiveRange(); if (!range) return;
      editorRef.current?.focus({ preventScroll: true });
      applyStyleToRange(range, "fontSize", `${size}px`);
      debouncedSave();
    }
  };

  // ── HTML insertion
  const insertHTML = (html: string) => {
    const editor = editorRef.current; if (!editor) return;
    if (savedRangeRef.current) restoreSelection(); else editor.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer)) {
        range.selectNodeContents(editor); range.collapse(false);
      }
      range.deleteContents();
      const frag = range.createContextualFragment(html);
      range.insertNode(frag);
    } else {
      editor.innerHTML += html;
    }
    const nr = document.createRange();
    nr.selectNodeContents(editor); nr.collapse(false);
    sel?.removeAllRanges(); sel?.addRange(nr);
    setCtxMenu(null); debouncedSave();
  };

  const removeBtn = () =>
    `<button data-remove-btn="1" contenteditable="false" ` +
    `style="position:absolute;top:5px;right:6px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.08);border:none;cursor:pointer;font-size:14px;color:#777;line-height:1;padding:0;display:inline-flex;align-items:center;justify-content:center;z-index:10;flex-shrink:0" ` +
    `title="Remove">&#215;</button>`;

  // ── Insert functions
  const newTodoHTML = () =>
    `<div data-todo-item="1" contenteditable="false" style="display:flex;align-items:center;gap:8px;margin:4px 0;padding:2px 0">` +
    `<span onclick="this.style.background=this.style.background?'':'#22c55e';this.style.borderColor=this.style.borderColor==='#22c55e'?'#9ca3af':'#22c55e';this.innerHTML=this.innerHTML?'':'✓';this.style.color=this.style.color?'':'white'" ` +
    `style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;flex-shrink:0;border:2px solid #9ca3af;border-radius:4px;cursor:pointer;font-size:11px;font-weight:700;user-select:none;transition:all 0.15s"></span>` +
    `<span contenteditable="true" style="outline:none;flex:1;min-width:20px"></span></div>`;

  const insertTodo = () => insertHTML(`<p><br></p>` + newTodoHTML() + `<br/>`);

  const insertTableWithSize = (numRows: number, numCols: number) => {
    const thStyle = `background:#f9fafb;padding:6px 10px;text-align:left;font-size:12px;font-weight:600;color:#374151;border:1.5px solid #b0b7c3;border-top:none;border-bottom:3px double #b0b7c3;min-width:120px`;
    const tdStyle = `padding:6px 10px;border:1.5px solid #b0b7c3;min-width:120px;font-size:13px;color:#1f2937`;
    const ths = Array.from({ length: numCols }, (_, i) => `<th style="${thStyle}" contenteditable="true">Column ${i + 1}</th>`).join("");
    const tdRow = Array.from({ length: numCols }, () => `<td style="${tdStyle}" contenteditable="true"><br/></td>`).join("");
    const rows = Array.from({ length: numRows }, () => `<tr>${tdRow}</tr>`).join("");
    insertHTML(`<br/><table style="border-collapse:collapse;width:100%;margin:8px 0;border-left:1.5px solid #b0b7c3"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table><br/>`);
    setCtxTableHover(null); setCtxTableCustomRows(""); setCtxTableCustomCols("");
  };

  const insertLined = () => {
    const thStyle = `background:#f5f5f3;padding:8px 12px;text-align:left;font-size:13px;font-weight:600;color:#374151;border:none;border-bottom:2px solid #b0b7c3;width:100%;display:block`;
    const tdStyle = `padding:7px 12px;border:none;border-bottom:1px solid #e2e0db;width:100%;display:block;font-size:13px;color:#1f2937;min-height:32px`;
    const th = `<th style="${thStyle}" contenteditable="true">Header</th>`;
    const tds = [1,2,3].map(() => `<tr><td style="${tdStyle}" contenteditable="true"><br/></td></tr>`).join("");
    insertHTML(`<br/><table data-lined="true" style="border-collapse:collapse;width:100%;margin:8px 0;border:1.5px solid #b0b7c3;border-radius:6px;overflow:hidden"><thead><tr>${th}</tr></thead><tbody>${tds}</tbody></table><br/>`);
  };

  const insertCustomBullet = (type: string) => {
    editorRef.current?.focus();
    if (type === "ordered") document.execCommand("insertOrderedList");
    else if (type === "disc") document.execCommand("insertUnorderedList");
    else document.execCommand("insertHTML", false, `<ul style="list-style-type: '${type} '; padding-left: 1.5em; margin: 4px 0"><li><br></li></ul>`);
    setCtxMenu(null); debouncedSave();
  };

  const insertDividerStyle = (style: string) => {
    const styles: Record<string, string> = {
      single:   `border:none;border-top:1.5px solid #1c1917;margin:12px 0`,
      bold:     `border:none;border-top:4px solid #78716c;margin:12px 0`,
      thin:     `border:none;border-top:0.5px solid #e7e5e4;margin:12px 0`,
      double:   `border:none;border-top:3px double #a8a29e;margin:12px 0`,
      dashed:   `border:none;border-top:2px dashed #a8a29e;margin:12px 0`,
      dotted:   `border:none;border-top:2px dotted #a8a29e;margin:12px 0`,
      gradient: `border:none;height:1.5px;background:linear-gradient(to right,transparent,#a8a29e 30%,#a8a29e 70%,transparent);margin:12px 0`,
      colored:  `border:none;border-top:2px solid #6366f1;margin:12px 0`,
      red:      `border:none;border-top:2px solid #ef4444;margin:12px 0`,
      green:    `border:none;border-top:2px solid #22c55e;margin:12px 0`,
      shadow:   `border:none;border-top:1.5px solid #d6d3d1;box-shadow:0 3px 6px -2px rgba(0,0,0,0.12);margin:12px 0`,
    };
    insertHTML(`<br/><hr style="${styles[style] ?? styles.single}"/><br/>`);
  };

  const insertLinkBlock = (type: string) => {
    const configs: Record<string, { color: string; bg: string; label: string; icon: string }> = {
      website:  { color: "#2563eb", bg: "#eff6ff", label: "Website",  icon: "🌐" },
      youtube:  { color: "#dc2626", bg: "#fef2f2", label: "YouTube",  icon: "▶" },
      facebook: { color: "#1877f2", bg: "#eff6ff", label: "Facebook", icon: "f" },
      linkedin: { color: "#0a66c2", bg: "#e8f4fd", label: "LinkedIn", icon: "in" },
      unknown:  { color: "#6b7280", bg: "#f9fafb", label: "Link",     icon: "🔗" },
    };
    const cfg = configs[type] ?? configs.unknown;
    insertHTML(
      `<div contenteditable="false" data-link-block="1" ` +
      `style="position:relative;display:flex;align-items:center;gap:10px;border-left:4px solid ${cfg.color};background:${cfg.bg};padding:10px 36px 10px 14px;border-radius:0 8px 8px 0;margin:8px 0">` +
      removeBtn() +
      `<span style="font-size:15px;flex-shrink:0">${cfg.icon}</span>` +
      `<div style="flex:1;min-width:0">` +
      `<div style="font-size:10px;font-weight:700;color:${cfg.color};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px">${cfg.label}</div>` +
      `<span data-link-url="1" contenteditable="true" data-placeholder="Paste link here…" ` +
      `onclick="event.stopPropagation()" ` +
      `style="outline:none;color:${cfg.color};font-size:13px;text-decoration:underline;word-break:break-all;display:block;cursor:text"></span>` +
      `</div></div><br/>`
    );
  };

  const insertBorderBlock = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" style="position:relative;border-left:4px solid #6366f1;background:#f5f3ff;padding:10px 36px 10px 16px;border-radius:0 8px 8px 0;margin:8px 0">` +
      removeBtn() +
      `<p contenteditable="true" data-placeholder="Type your note here…" style="margin:0;color:#4c1d95;font-style:italic;outline:none;font-family:Inter,sans-serif"></p></div><br/>`
    );
  };

  const insertCalloutBlock = (variant: "info"|"warning"|"success"|"error") => {
    const map = {
      info:    { bg: "#eff6ff", border: "#3b82f6", icon: "ℹ️", color: "#1d4ed8", label: "Info" },
      warning: { bg: "#fffbeb", border: "#f59e0b", icon: "⚠️", color: "#92400e", label: "Warning" },
      success: { bg: "#f0fdf4", border: "#22c55e", icon: "✅", color: "#166534", label: "Success" },
      error:   { bg: "#fef2f2", border: "#ef4444", icon: "❌", color: "#991b1b", label: "Error" },
    };
    const v = map[variant];
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" style="position:relative;display:flex;gap:10px;align-items:flex-start;background:${v.bg};border:1.5px solid ${v.border};border-radius:10px;padding:10px 36px 10px 12px;margin:8px 0">` +
      removeBtn() +
      `<span style="font-size:16px;flex-shrink:0;margin-top:1px">${v.icon}</span>` +
      `<div style="flex:1;min-width:0">` +
      `<div style="font-size:10px;font-weight:700;color:${v.color};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px">${v.label}</div>` +
      `<p contenteditable="true" data-placeholder="Type your message…" style="margin:0;color:${v.color};font-size:13px;outline:none;font-family:Inter,sans-serif"></p>` +
      `</div></div><br/>`
    );
    setCalloutPickerPos(null);
  };

  const insertStickyNote = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" data-sticky-note="1" style="position:relative;display:inline-block;vertical-align:top;margin:14px 0 8px;">` +
      `<div contenteditable="false" style="position:absolute;top:-10px;left:0;right:0;text-align:center;font-size:14px;pointer-events:none;user-select:none;z-index:5;line-height:1">📌</div>` +
      `<div style="position:relative;width:440px;min-width:120px;background:#f5f3ff;border:1.5px solid #c4b5fd;border-radius:10px;padding:10px 36px 10px 14px;box-shadow:2px 3px 8px rgba(99,102,241,0.10);resize:horizontal;overflow:auto;min-height:60px">` +
      `<button data-remove-btn="1" contenteditable="false" style="position:absolute;top:5px;right:6px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.08);border:none;cursor:pointer;font-size:14px;color:#777;line-height:1;padding:0;display:inline-flex;align-items:center;justify-content:center;z-index:10;flex-shrink:0" title="Remove">&#215;</button>` +
      `<p contenteditable="true" data-placeholder="Jot something down…" style="margin:0;color:#4c1d95;font-size:13px;outline:none;font-family:Inter,sans-serif;min-height:40px"></p>` +
      `<div style="position:absolute;bottom:3px;right:3px;width:10px;height:10px;cursor:se-resize;opacity:0.4;background:linear-gradient(135deg,transparent 40%,#7c3aed 40%,#7c3aed 55%,transparent 55%,transparent 70%,#7c3aed 70%,#7c3aed 85%,transparent 85%)"></div>` +
      `</div></div><br/>`
    );
  };

  const insertCardBlock = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" data-sticky-note="1" style="position:relative;display:inline-block;vertical-align:top;margin:14px 0 8px;">` +
      `<div style="position:relative;width:440px;min-width:120px;background:#fafafa;border:1.5px solid #e5e7eb;border-radius:12px;padding:14px 36px 14px 16px;box-shadow:0 4px 16px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.06);resize:horizontal;overflow:auto;min-height:60px">` +
      `<button data-remove-btn="1" contenteditable="false" style="position:absolute;top:5px;right:6px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.07);border:none;cursor:pointer;font-size:14px;color:#888;line-height:1;padding:0;display:inline-flex;align-items:center;justify-content:center;z-index:10;flex-shrink:0" title="Remove">&#215;</button>` +
      `<p contenteditable="true" data-placeholder="Write something…" style="margin:0;color:#374151;font-size:13px;outline:none;font-family:Inter,sans-serif;min-height:40px"></p>` +
      `</div></div><br/>`
    );
  };

  const insertNumberedListBlock = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" style="position:relative;border-left:4px solid #6366f1;background:#f5f3ff;padding:10px 36px 10px 16px;border-radius:0 8px 8px 0;margin:8px 0">` +
      removeBtn() +
      `<ol contenteditable="true" data-placeholder="Add list items…" style="margin:0;padding-left:1.4em;color:#4c1d95;font-size:13px;outline:none;list-style-type:decimal;font-family:Inter,sans-serif"><li></li></ol></div><br/>`
    );
  };

  const insertTwoColumnBlock = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" style="position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 36px 10px 12px;margin:8px 0">` +
      removeBtn() +
      `<p contenteditable="true" data-placeholder="Left column…" style="margin:0;min-height:40px;background:#fff;border-radius:6px;padding:6px 8px;color:#334155;font-size:13px;outline:none;border:1px solid #e2e8f0;font-family:Inter,sans-serif"></p>` +
      `<p contenteditable="true" data-placeholder="Right column…" style="margin:0;min-height:40px;background:#fff;border-radius:6px;padding:6px 8px;color:#334155;font-size:13px;outline:none;border:1px solid #e2e8f0;font-family:Inter,sans-serif"></p>` +
      `</div><br/>`
    );
  };

  const insertCodeBlock = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" style="position:relative;background:#1e1e2e;border-radius:10px;padding:10px 36px 10px 14px;margin:8px 0">` +
      removeBtn() +
      `<div style="font-size:10px;font-weight:600;color:#6c7086;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Code</div>` +
      `<pre contenteditable="true" data-placeholder="// Write your code here…" style="margin:0;color:#cdd6f4;font-family:'Courier New',monospace;font-size:13px;outline:none;white-space:pre-wrap;word-break:break-all"></pre></div><br/>`
    );
  };

  const insertDefinitionBlock = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" data-sticky-note="1" style="position:relative;display:inline-block;vertical-align:top;margin:14px 0 8px;">` +
      `<div style="position:relative;width:440px;min-width:120px;background:#ffffff;border:1.5px solid #e5e3e1;border-radius:12px;padding:14px 36px 14px 16px;overflow:auto;min-height:60px;resize:horizontal">` +
      `<button data-remove-btn="1" contenteditable="false" style="position:absolute;top:5px;right:6px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.07);border:none;cursor:pointer;font-size:14px;color:#a8a29e;line-height:1;padding:0;display:inline-flex;align-items:center;justify-content:center;z-index:10;flex-shrink:0" title="Remove">&#215;</button>` +
      `<p contenteditable="true" data-placeholder="Write something…" style="margin:0;color:#a09f9e;font-size:13px;outline:none;font-family:Inter,sans-serif;min-height:40px"></p>` +
      `</div></div><br/>`
    );
  };

  const insertGraph = (type: GraphType) => {
    const paper = paperRef.current;
    const rect = paper?.getBoundingClientRect();
    const insertX = rect && ctxMenu ? Math.max(10, ctxMenu.x - rect.left) : 60;
    const insertY = rect && ctxMenu ? Math.max(10, ctxMenu.y - rect.top) : 300;
    const newGraph: GraphBlock = {
      id: `g_${Date.now()}`, type,
      x: insertX, y: insertY,
      width: 380, height: 240,
      title: "My Chart",
      color: GRAPH_COLORS[0],
      data: [
        { label: "Jan", value: 40 }, { label: "Feb", value: 70 },
        { label: "Mar", value: 55 }, { label: "Apr", value: 90 }, { label: "May", value: 65 },
      ],
    };
    setGraphBlocks(prev => [...prev, newGraph]);
    setCtxMenu(null);
  };

  // ── Table toolbar position tracker
  const updateTableToolbar = useCallback(() => {
    const table = activeTableRef.current;
    const paper = paperRef.current;
    if (!table || !paper) { setTableToolbar(null); return; }
    const tr = table.getBoundingClientRect();
    const pr = paper.getBoundingClientRect();
    setTableToolbar({ top: tr.top - pr.top, left: tr.left - pr.left, width: tr.width, height: tr.height });
    if (tableResizeObserverRef.current) tableResizeObserverRef.current.disconnect();
    const obs = new ResizeObserver(() => {
      const t = activeTableRef.current; const p = paperRef.current;
      if (!t || !p) return;
      const tr2 = t.getBoundingClientRect(); const pr2 = p.getBoundingClientRect();
      setTableToolbar({ top: tr2.top - pr2.top, left: tr2.left - pr2.left, width: tr2.width, height: tr2.height });
    });
    obs.observe(table);
    tableResizeObserverRef.current = obs;
  }, []);

  // ── Table border drag-to-resize
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const THRESHOLD = 6;
    type ColState = { table: HTMLTableElement; colIdx: number; startX: number; startWidths: number[] };
    type RowState = { row: HTMLTableRowElement; startY: number; startH: number };
    let colState: ColState | null = null;
    let rowState: RowState | null = null;
    function getCellAt(e: MouseEvent): HTMLTableCellElement | null {
      let el = e.target as Element | null;
      while (el && el !== editor) {
        if (el.tagName === "TD" || el.tagName === "TH") return el as HTMLTableCellElement;
        el = el.parentElement;
      }
      return null;
    }
    function getResizeEdge(e: MouseEvent, cell: HTMLTableCellElement): "col" | "row" | null {
      const r = cell.getBoundingClientRect();
      if (Math.abs(e.clientX - r.right)  <= THRESHOLD) return "col";
      if (Math.abs(e.clientY - r.bottom) <= THRESHOLD) return "row";
      return null;
    }
    function onMouseMove(e: MouseEvent) {
      if (colState) {
        const dx = e.clientX - colState.startX;
        for (let i = 0; i < colState.table.rows.length; i++) {
          const cell = colState.table.rows[i].cells[colState.colIdx];
          if (cell) cell.style.width = Math.max(40, colState.startWidths[i] + dx) + "px";
        }
        return;
      }
      if (rowState) {
        const dy = e.clientY - rowState.startY;
        const newH = Math.max(24, rowState.startH + dy);
        rowState.row.style.height = newH + "px";
        Array.from(rowState.row.cells).forEach(c => { c.style.height = newH + "px"; });
        return;
      }
      const cell = getCellAt(e);
      if (!cell) { (editor as HTMLElement).style.cursor = ""; return; }
      const edge = getResizeEdge(e, cell);
      (editor as HTMLElement).style.cursor = edge === "col" ? "col-resize" : edge === "row" ? "row-resize" : "";
    }
    function onMouseDown(e: MouseEvent) {
      const cell = getCellAt(e);
      if (!cell) return;
      const edge = getResizeEdge(e, cell);
      if (!edge) return;
      e.preventDefault(); e.stopPropagation();
      document.body.style.userSelect = "none";
      if (edge === "col") {
        const table = cell.closest("table") as HTMLTableElement;
        const cells = Array.from(cell.parentElement!.children) as HTMLTableCellElement[];
        const colIdx = cells.indexOf(cell);
        const totalCols = cells.length;
        for (let i = 0; i < table.rows.length; i++) {
          for (let j = 0; j < totalCols; j++) {
            const c = table.rows[i].cells[j];
            if (c) c.style.width = c.getBoundingClientRect().width + "px";
          }
        }
        table.style.width = "auto";
        const startWidths: number[] = [];
        for (let i = 0; i < table.rows.length; i++) {
          const c = table.rows[i].cells[colIdx];
          startWidths.push(c ? c.getBoundingClientRect().width : 120);
        }
        colState = { table, colIdx, startX: e.clientX, startWidths };
        document.body.style.cursor = "col-resize";
      } else {
        const row = cell.parentElement as HTMLTableRowElement;
        rowState = { row, startY: e.clientY, startH: row.getBoundingClientRect().height };
        document.body.style.cursor = "row-resize";
      }
    }
    function onMouseUp() {
      if (colState || rowState) {
        colState = null; rowState = null;
        document.body.style.userSelect = ""; document.body.style.cursor = "";
        (editor as HTMLElement).style.cursor = "";
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(saveContent, 400);
      }
    }
    editor.addEventListener("mousemove", onMouseMove);
    editor.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      editor.removeEventListener("mousemove", onMouseMove);
      editor.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [saveContent]);

  // ── Table row/col add/remove/toggle/delete
  const TH_STYLE = `background:#f9fafb;padding:6px 10px;text-align:left;font-size:12px;font-weight:600;color:#374151;border:1.5px solid #b0b7c3;border-top:none;border-bottom:3px double #b0b7c3;min-width:120px`;
  const TD_STYLE = `padding:6px 10px;border:1.5px solid #b0b7c3;min-width:120px;font-size:13px;color:#1f2937`;

  const tableAddRow = () => {
    const table = activeTableRef.current; if (!table) return;
    const tbody = table.querySelector("tbody"); if (!tbody) return;
    const isLined = table.dataset.lined === "true";
    const colCount = table.rows[0]?.cells.length ?? 4;
    const tr = document.createElement("tr");
    const linedTdStyle = `padding:7px 12px;border:none;border-bottom:1px solid #e2e0db;width:100%;display:block;font-size:13px;color:#1f2937;min-height:32px`;
    const ths = table.querySelectorAll("thead th");
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement("td");
      const th = ths[i] as HTMLElement | undefined;
      const colType = th?.dataset.colType as ColType | undefined;
      if (!isLined && colType === "time") {
        const now = new Date(); const h = now.getHours();
        const autoVal = `${h % 12 || 12}:${String(now.getMinutes()).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
        td.setAttribute("style", TD_STYLE); td.setAttribute("contenteditable", "false");
        td.dataset.cellVal = autoVal; td.dataset.cellType = colType;
        td.innerHTML = makeCellInner(colType, autoVal);
      } else {
        td.setAttribute("style", isLined ? linedTdStyle : TD_STYLE);
        td.setAttribute("contenteditable", "true"); td.innerHTML = "<br/>";
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr); saveContent(); updateTableToolbar();
  };

  const tableRemoveRow = () => {
    const table = activeTableRef.current; if (!table) return;
    const tbody = table.querySelector("tbody"); if (!tbody || tbody.rows.length === 0) return;
    tbody.removeChild(tbody.rows[tbody.rows.length - 1]); saveContent(); updateTableToolbar();
  };

  const tableAddCol = () => {
    const table = activeTableRef.current; if (!table) return;
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      const isHead = row.parentElement?.tagName === "THEAD";
      const cell = document.createElement(isHead ? "th" : "td");
      cell.setAttribute("style", isHead ? TH_STYLE : TD_STYLE);
      cell.setAttribute("contenteditable", "true");
      cell.innerHTML = isHead ? `Column ${row.cells.length + 1}` : "<br/>";
      row.appendChild(cell);
    }
    saveContent(); updateTableToolbar();
  };

  const tableRemoveCol = () => {
    const table = activeTableRef.current; if (!table) return;
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      if (row.cells.length > 1) row.removeChild(row.cells[row.cells.length - 1]);
    }
    saveContent(); updateTableToolbar();
  };

  const tableToggleLines = () => {
    const table = activeTableRef.current; if (!table) return;
    const hidden = table.dataset.linesHidden === "true";
    if (hidden) {
      const origTable = table.dataset.originalStyle;
      if (origTable !== undefined) table.setAttribute("style", origTable);
      delete table.dataset.originalStyle;
      Array.from(table.querySelectorAll("th, td")).forEach(cell => {
        const el = cell as HTMLElement;
        const orig = el.dataset.originalStyle;
        if (orig !== undefined) { el.setAttribute("style", orig); delete el.dataset.originalStyle; }
        else el.setAttribute("style", el.tagName === "TH" ? TH_STYLE : TD_STYLE);
      });
      table.dataset.linesHidden = "false"; setTableLinesHidden(false);
    } else {
      table.dataset.originalStyle = table.getAttribute("style") || "";
      Array.from(table.querySelectorAll("th, td")).forEach(cell => {
        const el = cell as HTMLElement;
        el.dataset.originalStyle = el.getAttribute("style") || "";
        el.style.setProperty("border-top", "1px solid transparent", "important");
        el.style.setProperty("border-bottom", "1px solid transparent", "important");
        el.style.setProperty("border-left", "1px solid transparent", "important");
        el.style.setProperty("border-right", "1px solid transparent", "important");
        el.style.setProperty("border-color", "transparent", "important");
        if (el.tagName === "TH") el.style.setProperty("background-color", "white", "important");
      });
      table.style.setProperty("border-color", "transparent", "important");
      table.style.setProperty("border-left", "1px solid transparent", "important");
      table.dataset.linesHidden = "true"; setTableLinesHidden(true);
    }
    saveContent();
  };

  const tableDeleteTable = () => {
    const table = activeTableRef.current; if (!table) return;
    const parent = table.parentElement;
    if (parent) { const br = document.createElement("br"); parent.replaceChild(br, table); }
    activeTableRef.current = null; setTableToolbar(null); setTableLinesHidden(false);
    if (tableResizeObserverRef.current) { tableResizeObserverRef.current.disconnect(); tableResizeObserverRef.current = null; }
    saveContent();
  };

  // ── Column type helpers
  const handleColTypeChange = (th: HTMLElement, type: ColType) => {
    applyColType(th, type, undefined, saveContent);
    setColTypePopup(null);
  };

  const handleSortCol = (th: HTMLElement, dir: "asc" | "desc") => {
    const table = th.closest("table"); if (!table) return;
    const idx = getColIndex(th);
    const tbody = table.querySelector("tbody"); if (!tbody) return;
    const rows = Array.from(tbody.rows) as HTMLTableRowElement[];
    rows.sort((a, b) => {
      const av = (a.cells[idx] as HTMLElement)?.dataset.cellVal || a.cells[idx]?.textContent || "";
      const bv = (b.cells[idx] as HTMLElement)?.dataset.cellVal || b.cells[idx]?.textContent || "";
      const cmp = av.localeCompare(bv, undefined, { numeric: true });
      return dir === "asc" ? cmp : -cmp;
    });
    rows.forEach(r => tbody.appendChild(r));
    saveContent();
  };

  const handleDeleteColFromPicker = (th: HTMLElement) => {
    const table = th.closest("table"); if (!table) return;
    const idx = getColIndex(th);
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      if (row.cells.length > 1) row.removeChild(row.cells[idx]);
    }
    saveContent(); updateTableToolbar();
  };

  const startDirectEdit = useCallback((td: HTMLElement, th: HTMLElement, type: ColType) => {
    if (activeEditRef.current && activeEditRef.current.td !== td) {
      activeEditRef.current.finish(); activeEditRef.current = null;
    }
    if (td.dataset.editing === "1") return;
    td.dataset.editing = "1";
    const rawVal = td.dataset.cellVal || "";
    td.contentEditable = "true"; td.textContent = rawVal; td.focus();
    const sel = window.getSelection(); const range = document.createRange();
    if (td.firstChild) { range.setStart(td.firstChild, (td.textContent?.length ?? 0)); range.collapse(true); }
    else { range.setStart(td, 0); range.collapse(true); }
    sel?.removeAllRanges(); sel?.addRange(range);
    const finish = () => {
      if (activeEditRef.current?.td === td) activeEditRef.current = null;
      td.removeEventListener("keydown", onKeyDown);
      td.removeEventListener("beforeinput", onBeforeInput as EventListener);
      td.removeEventListener("input", onInput);
      const newVal = type === "progress"
        ? String(Math.min(100, Math.max(0, parseInt(td.textContent || "0") || 0)))
        : (td.textContent || "").trim();
      td.dataset.cellVal = newVal; td.contentEditable = "false"; delete td.dataset.editing;
      const opts = getColOptions(th, type as ColType);
      td.innerHTML = makeCellInner(type, newVal, opts);
      saveContent();
    };
    const isNumeric = type === "number" || type === "currency";
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); finish(); } };
    const onBeforeInput = (e: InputEvent) => { if (!isNumeric) return; const data = e.data ?? ""; if (data && !/^[-\d.]*$/.test(data)) e.preventDefault(); };
    const onInput = () => {
      if (!isNumeric) return;
      const current = td.textContent || ""; const filtered = current.replace(/[^-\d.]/g, "");
      if (filtered !== current) {
        td.textContent = filtered;
        const sel = window.getSelection(); const r = document.createRange();
        const node = td.firstChild;
        if (node) { r.setStart(node, filtered.length); r.collapse(true); }
        else { r.setStart(td, 0); r.collapse(true); }
        sel?.removeAllRanges(); sel?.addRange(r);
      }
    };
    activeEditRef.current = { td, finish };
    td.addEventListener("blur", finish, { once: true });
    td.addEventListener("keydown", onKeyDown);
    td.addEventListener("beforeinput", onBeforeInput as EventListener);
    td.addEventListener("input", onInput);
  }, [saveContent]);

  // ── MouseDown on editor: intercept th + typed td clicks
  const handleEditorMouseDown = (e: React.MouseEvent) => {
    if (drawTool) return;
    const target = e.target as HTMLElement;

    // Sticky note drag handle
    if ((target as HTMLElement).closest('[data-drag-btn]')) {
      e.preventDefault(); e.stopPropagation();
      const note = (target as HTMLElement).closest('[data-sticky-note]') as HTMLElement | null;
      const editor = editorRef.current;
      if (!note || !editor) return;
      const startMouseX = e.clientX; const startMouseY = e.clientY;
      let dragging = false; let startLeft = 0; let startTop = 0;
      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startMouseX; const dy = ev.clientY - startMouseY;
        if (!dragging && Math.sqrt(dx * dx + dy * dy) < 4) return;
        if (!dragging) {
          dragging = true;
          if (note.style.position !== 'absolute') {
            const noteRect = note.getBoundingClientRect();
            const editorRect = editor.getBoundingClientRect();
            note.style.position = 'absolute';
            note.style.left = `${noteRect.left - editorRect.left}px`;
            note.style.top = `${noteRect.top - editorRect.top}px`;
            note.style.margin = '0'; note.style.display = 'inline-block';
          }
          startLeft = parseFloat(note.style.left) || 0;
          startTop = parseFloat(note.style.top) || 0;
          note.style.cursor = 'grabbing'; note.style.zIndex = '100';
        }
        note.style.left = `${startLeft + ev.clientX - startMouseX}px`;
        note.style.top = `${Math.max(0, startTop + ev.clientY - startMouseY)}px`;
      };
      const onUp = () => {
        note.style.cursor = '';
        if (dragging) { note.style.zIndex = ''; debouncedSave(); }
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      return;
    }

    // Typed td cells: prevent browser focus dance, start edit immediately
    const td = target.closest("td") as HTMLElement | null;
    if (td && editorRef.current?.contains(td) && !td.closest("[data-lined]")) {
      const th = findTh(td);
      if (th) {
        const type = getColType(th);
        if (["number", "currency", "url", "email", "phone", "person"].includes(type)) {
          if (td.dataset.editing === "1") return;
          e.preventDefault();
          setColTypePopup(null); setSelectCellPopup(null); setPriorityCellPopup(null); setProgressCellPopup(null);
          startDirectEdit(td, th, type as ColType);
          return;
        }
      }
    }

    const th = target.closest("th") as HTMLElement | null;
    if (th && editorRef.current?.contains(th) && !th.closest("[data-lined]")) {
      e.preventDefault();
      const rect = th.getBoundingClientRect();
      setColTypePopup({ th, rect });
      setSelectCellPopup(null);
    }
  };

  // ── Click handler for editor (typed cells, remove btn, etc.)
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Typed td cell interactions
    const td = target.closest("td") as HTMLElement | null;
    if (td && editorRef.current?.contains(td) && !td.closest("[data-lined]")) {
      const th = findTh(td);
      if (th) {
        const type = getColType(th);
        if (type !== "text") {
          e.preventDefault(); e.stopPropagation();
          if (type === "check") {
            const current = td.dataset.cellVal === "true";
            td.dataset.cellVal = String(!current);
            td.innerHTML = makeCellInner("check", td.dataset.cellVal);
            debouncedSave(); return;
          }
          if (type === "rating") {
            const star = (target as HTMLElement).closest("[data-star]") as HTMLElement | null;
            if (star) { td.dataset.cellVal = star.dataset.star || "0"; td.innerHTML = makeCellInner("rating", td.dataset.cellVal); debouncedSave(); }
            return;
          }
          if (type === "priority") {
            const rect = td.getBoundingClientRect();
            setPriorityCellPopup({ td, rect }); setColTypePopup(null); setSelectCellPopup(null); return;
          }
          if (type === "select" || type === "multi") {
            const rect = td.getBoundingClientRect();
            setSelectCellPopup({ td, th, rect, multi: type === "multi" }); setColTypePopup(null); setPriorityCellPopup(null); return;
          }
          if (type === "progress") {
            const rect = td.getBoundingClientRect();
            setProgressCellPopup({ td, rect }); setColTypePopup(null); setSelectCellPopup(null); setPriorityCellPopup(null); return;
          }
          if (type === "time") {
            const rect = td.getBoundingClientRect();
            setTimeCellPopup({ td, rect }); setColTypePopup(null); setSelectCellPopup(null); setPriorityCellPopup(null); setProgressCellPopup(null); return;
          }
          if (type === "id") {
            const rect = td.getBoundingClientRect();
            setIdCellPopup({ td, rect }); setColTypePopup(null); setSelectCellPopup(null); setPriorityCellPopup(null); setProgressCellPopup(null); setTimeCellPopup(null); return;
          }
          return;
        }
      }
    }

    // Remove button clicked → delete the parent block
    const removeButton = target.closest('[data-remove-btn]');
    if (removeButton) {
      e.preventDefault(); e.stopPropagation();
      const block = removeButton.closest('[data-quote-block],[data-link-block],[data-voice-block]');
      if (block) { block.remove(); debouncedSave(); }
      return;
    }

    // Link block clicked → open the URL
    const linkBlock = target.closest('[data-link-block]') as HTMLElement | null;
    if (linkBlock && !target.closest('[data-link-url]') && !target.closest('[data-remove-btn]')) {
      const urlEl = linkBlock.querySelector('[data-link-url]');
      const url = urlEl?.textContent?.trim() ?? "";
      if (url && url !== "Paste link here…") window.open(url, "_blank");
      return;
    }

    // Clicking on empty editor space → add paragraphs to reach click position
    if (target === editorRef.current) {
      const editor = editorRef.current; if (!editor) return;
      editor.focus();
      const editorRect = editor.getBoundingClientRect();
      const clickY = e.clientY;
      let lastBottom = editorRect.top;
      const children = Array.from(editor.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const rect = (child as Element).getBoundingClientRect();
          if (rect.bottom > lastBottom) lastBottom = rect.bottom;
        }
      }
      const lineHeight = 26;
      const gap = clickY - lastBottom;
      if (gap > lineHeight / 2) {
        const linesToAdd = Math.max(1, Math.round(gap / lineHeight));
        let html = "";
        for (let i = 0; i < linesToAdd; i++) html += "<p><br></p>";
        const range = document.createRange();
        range.selectNodeContents(editor); range.collapse(false);
        const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(range);
        document.execCommand("insertHTML", false, html);
        debouncedSave();
      } else {
        const range = document.createRange();
        range.selectNodeContents(editor); range.collapse(false);
        window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(range);
      }
    }
  };

  // ── Todo inline +/- helpers
  const appendTodoAtEnd = useCallback(() => {
    const editor = editorRef.current; if (!editor) return;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = newTodoHTML();
    const todoEl = wrapper.firstChild as HTMLElement;
    const todos = editor.querySelectorAll('[data-todo-item="1"]');
    if (todos.length > 0) {
      const lastTodo = todos[todos.length - 1] as HTMLElement;
      lastTodo.insertAdjacentElement("afterend", todoEl);
    } else {
      editor.appendChild(todoEl);
    }
    saveContent();
  }, [saveContent]);

  const removeLastTodoItem = useCallback((count: number) => {
    if (!editorRef.current) return;
    const items = editorRef.current.querySelectorAll('[data-todo-item="1"]');
    const toRemove = Array.from(items).slice(-count);
    toRemove.forEach(el => el.remove());
    saveContent();
  }, [saveContent]);

  // ── Track position of last todo item for inline +/- buttons
  const updateLastTodoPos = useCallback(() => {
    const editor = editorRef.current; const paper = paperRef.current;
    if (!editor || !paper) { setLastTodoPos(null); return; }
    const todos = editor.querySelectorAll('[data-todo-item="1"]');
    if (todos.length === 0) { setLastTodoPos(null); return; }
    const lastTodo = todos[todos.length - 1] as HTMLElement;
    const todoRect = lastTodo.getBoundingClientRect();
    const paperRect = paper.getBoundingClientRect();
    setLastTodoPos({ top: todoRect.top - paperRect.top + (todoRect.height / 2), left: todoRect.left - paperRect.left });
  }, []);

  useEffect(() => {
    const editor = editorRef.current; if (!editor) return;
    const observer = new MutationObserver(updateLastTodoPos);
    observer.observe(editor, { childList: true, subtree: true, characterData: true });
    updateLastTodoPos();
    return () => observer.disconnect();
  }, [updateLastTodoPos, page.id]);

  // ── Image & Video media insertion as floating blocks
  const compressImage = (file: File, maxWidth = 900): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = url;
    });

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    try {
      const src = await compressImage(file);
      const paperW = paperRef.current?.clientWidth ?? 794;
      const blockW = Math.min(375, paperW - 96);
      const id = `img_${Date.now()}`;
      const newBlock: ImageBlock = { id, src, locked: false, width: blockW, x: (paperW - blockW) / 2, y: 120 };
      setImageBlocks(prev => [...prev, newBlock]);
    } catch { /* ignore */ }
  };

  const handleVoiceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      insertHTML(`<br/><div contenteditable="false" style="margin:6px 0"><audio controls src="${src}" style="display:block;max-width:100%"></audio></div><br/>`);
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert("Video too large (max 50 MB)."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const paperW = paperRef.current?.clientWidth ?? 794;
      const blockW = Math.min(400, paperW - 96);
      const id = `vid_${Date.now()}`;
      const newBlock: VideoBlock = { id, src, name: file.name, locked: false, width: blockW, x: (paperW - blockW) / 2, y: 120 };
      setVideoBlocks(prev => [...prev, newBlock]);
    };
    reader.readAsDataURL(file);
  };

  // ── Right-click handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const sel = window.getSelection();
    savedRangeRef.current = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
    let menuX = e.clientX, menuY = e.clientY;
    if (savedRangeRef.current) {
      const rect = savedRangeRef.current.getBoundingClientRect();
      if (rect && rect.width > 0) menuY = rect.bottom + 8;
    }
    setCtxMenu({
      x: menuX, y: menuY,
      formatOpen: false, alignOpen: false, bulletOpen: false,
      highlightOpen: false, fontColorOpen: false, headingOpen: false,
      dividerOpen: false, linkOpen: false, todoOpen: false,
      todoCount: 1, todoRemoveCount: 1,
      drawOpen: false, graphOpen: false, tableOpen: false,
      fontOpen: false, blockOpen: false, mediaOpen: false,
      subActive: document.queryCommandState("subscript"),
      supActive: document.queryCommandState("superscript"),
      boldActive: document.queryCommandState("bold"),
      italicActive: document.queryCommandState("italic"),
      underlineActive: document.queryCommandState("underline"),
      strikeActive: document.queryCommandState("strikeThrough"),
    });
    if (savedRangeRef.current) setTimeout(() => restoreSelection(), 0);
  };

  // ── Draw overlay handlers
  const handleDrawMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawTool) return;
    e.preventDefault();
    if (drawTool === "eraser") return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    arrowDrawRef.current = { startX: x, startY: y, type: drawTool };
    setDrawingArrow({ id: "preview", type: drawTool, x1: x, y1: y, x2: x, y2: y, color: "#ef4444" });
  };

  const handleDrawMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawTool) return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (drawTool === "eraser") setEraserPos({ x, y });
  };

  const handleDrawClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (drawTool !== "eraser" || !eraserPos) return;
    const { x, y } = eraserPos;
    setArrows(prev => prev.filter(s => !shapeIntersectsCircle(s, x, y, ERASER_RADIUS)));
  };

  // ── Backspace handler (existing logic)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Backspace") return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (!range.collapsed) return;
    let node: Node | null = range.startContainer;
    let li: HTMLElement | null = null;
    while (node && node !== editorRef.current) {
      if ((node as HTMLElement).nodeName === "LI") { li = node as HTMLElement; break; }
      node = node.parentNode;
    }
    if (!li) return;
    const list = li.parentElement; if (!list) return;
    if (li !== list.firstElementChild) return;
    const liRange = document.createRange();
    liRange.selectNodeContents(li); liRange.collapse(true);
    if (range.compareBoundaryPoints(Range.START_TO_START, liRange) !== 0) return;
    e.preventDefault();
    const listParent = list.parentNode; if (!listParent) return;
    const isEmpty = li.textContent === "" || li.innerHTML === "<br>" || li.innerHTML === "";
    if (isEmpty) {
      if (list.children.length === 1) listParent.removeChild(list);
      else {
        list.removeChild(li);
        const newFirst = list.firstElementChild as HTMLElement;
        if (newFirst) {
          const nr = document.createRange(); nr.selectNodeContents(newFirst); nr.collapse(true);
          selection.removeAllRanges(); selection.addRange(nr);
        }
      }
    } else {
      const p = document.createElement("p"); p.innerHTML = li.innerHTML;
      listParent.insertBefore(p, list); list.removeChild(li);
      if (list.children.length === 0) listParent.removeChild(list);
      const nr = document.createRange(); nr.selectNodeContents(p); nr.collapse(true);
      selection.removeAllRanges(); selection.addRange(nr);
    }
    handleInput();
  }, [handleInput]);

  // ── Render
  return (
    <div className="flex-shrink-0 group/page flex items-start">

      {/* ── LEFT SIDE PANEL ── */}
      <div style={{ width: leftOpen ? 300 : 0, transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ width: 300, minHeight: 1123 }} className="bg-amber-50 border-r-2 border-amber-200 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-amber-200 bg-amber-100/70 sticky top-0 z-10">
            <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">📝 Left Note</span>
            <button onClick={() => setLeftOpen(false)} className="p-0.5 rounded transition-opacity hover:opacity-70" title="Close left note">
              <img src={arrowCircleCloseIcon} className="w-4 h-4" alt="close" />
            </button>
          </div>
          <textarea
            value={leftNote}
            onChange={e => { const v = e.target.value; setLeftNote(v); localStorage.setItem(`nb_sidenote_${bookId}_${page.id}_left`, v); }}
            className="flex-1 p-3 text-sm text-stone-700 bg-transparent resize-none outline-none leading-relaxed"
            placeholder="Side notes…"
            style={{ minHeight: 1080, fontFamily: "Georgia, serif" }}
          />
        </div>
      </div>

      {/* ── PAPER WRAPPER ── */}
      <div
        className="relative flex-shrink-0"
        style={{ width: 794 }}
        onMouseMove={(e) => {
        const paper = paperRef.current;
        const paperRect = paper?.getBoundingClientRect();
        if (!paperRect) return;
        const mx = e.clientX - paperRect.left;
        const my = e.clientY - paperRect.top;
        if (lastTodoPos) {
          const dx = mx - lastTodoPos.left;
          const dy = my - lastTodoPos.top;
          setShowTodoButtons(Math.abs(dx) < 80 && Math.abs(dy) < 40);
        }
        const tbl = (e.target as Element).closest("table") as HTMLTableElement | null;
        if (tbl && editorRef.current?.contains(tbl)) {
          if (tbl !== activeTableRef.current) {
            activeTableRef.current = tbl; updateTableToolbar();
            setTableLinesHidden(tbl.dataset.linesHidden === "true");
          }
          setShowTableBtns(true);
        } else {
          const editor = editorRef.current;
          const nearTable = editor ? Array.from(editor.querySelectorAll("table")).find(t => {
            const tr = t.getBoundingClientRect();
            const tx = tr.left - paperRect.left;
            const ty = tr.top - paperRect.top;
            const inRowZone = mx >= tx - 12 && mx <= tx + 60 && my >= ty + tr.height - 12 && my <= ty + tr.height + 60;
            const inColZone = mx >= tx + tr.width - 12 && mx <= tx + tr.width + 60 && my >= ty - 12 && my <= ty + 60;
            return inRowZone || inColZone;
          }) as HTMLTableElement | undefined : undefined;
          if (nearTable) {
            if (nearTable !== activeTableRef.current) { activeTableRef.current = nearTable; updateTableToolbar(); setTableLinesHidden(nearTable.dataset.linesHidden === "true"); }
            setShowTableBtns(true);
          } else {
            setShowTableBtns(false);
          }
        }
      }}
      onMouseLeave={() => {
        setShowTodoButtons(false);
        setTableToolbar(null);
        activeTableRef.current = null;
        if (tableResizeObserverRef.current) { tableResizeObserverRef.current.disconnect(); tableResizeObserverRef.current = null; }
      }}
    >
      {/* Page number */}
      {!leftOpen && !rightOpen && (
        <div className="absolute -left-24 top-6 text-zinc-500 text-base font-medium select-none text-right w-10">
          {String(index + 1).padStart(3, "0")}
        </div>
      )}

      {/* Delete page button */}
      {!leftOpen && !rightOpen && (
        <button
          onClick={() => onDelete(page.id)}
          className="absolute top-6 opacity-0 group-hover/page:opacity-100 transition-opacity p-1.5 text-zinc-500 hover:text-red-400 rounded" style={{ right: -90 }}
          title="Delete page"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Left side note toggle */}
      {!leftOpen && (
        <button
          onClick={() => setLeftOpen(true)}
          className="absolute top-20 -left-8 z-20 flex flex-col items-center justify-center gap-0.5 w-7 h-14 rounded-l-lg bg-transparent hover:bg-white/10 transition-all opacity-0 group-hover/page:opacity-100"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}
          title="Open left note"
        >
          <img src={arrowCircleLeftIcon} className="w-5 h-5 opacity-80" alt="" />
        </button>
      )}

      {/* Page overlay note toggle */}
      {!leftOpen && (
        <button
          onClick={() => setPageNoteOpen(v => !v)}
          className="absolute top-36 -left-8 z-20 flex flex-col items-center justify-center gap-0.5 w-7 h-14 rounded-l-lg bg-transparent hover:bg-white/10 transition-all opacity-0 group-hover/page:opacity-100"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}
          title="Toggle page note"
        >
          <img src={arrowCircleLeftIcon} className="w-5 h-5 opacity-60" alt="" style={{ filter: "hue-rotate(120deg)" }} />
        </button>
      )}

      {/* Right side note toggle */}
      {!rightOpen && (
        <button
          onClick={() => setRightOpen(true)}
          className="absolute top-20 -right-8 z-20 flex flex-col items-center justify-center gap-0.5 w-7 h-14 rounded-r-lg bg-transparent hover:bg-white/10 transition-all opacity-0 group-hover/page:opacity-100"
          style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))" }}
          title="Open right note"
        >
          <img src={arrowCircleRightIcon} className="w-5 h-5 opacity-80" alt="" />
        </button>
      )}

      {/* A4 paper */}
      <div ref={paperRef} className="bg-white shadow-xl relative" style={{ minHeight: 1123, padding: "16px" }}>

        {/* Page overlay note */}
        {pageNoteOpen && (
          <div style={{ position: "absolute", top: 16, left: 16, right: 16, zIndex: 50, pointerEvents: "auto" }}>
            <div style={{ background: "#f0fdf4", border: "2px solid #86efac", borderRadius: 10, boxShadow: "0 4px 24px rgba(0,0,0,0.13)", overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#dcfce7", borderBottom: "1px solid #86efac" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#166534", display: "flex", alignItems: "center", gap: 6 }}>📝 Page Note</span>
                <button onClick={() => setPageNoteOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", opacity: 0.7, fontSize: 14, color: "#166534" }} title="Close">✕</button>
              </div>
              <textarea
                value={pageNote}
                onChange={e => { const v = e.target.value; setPageNote(v); localStorage.setItem(`nb_sidenote_${bookId}_${page.id}_page`, v); }}
                style={{ width: "100%", minHeight: 120, maxHeight: 300, padding: "10px 12px", fontSize: 14, fontFamily: "Georgia, serif", color: "#1a2e1a", background: "transparent", border: "none", outline: "none", resize: "vertical", lineHeight: 1.7, boxSizing: "border-box" }}
                placeholder="Page notes…"
              />
            </div>
          </div>
        )}

        {/* Draw SVG overlay */}
        <svg
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: drawTool ? "all" : "none", zIndex: 10, overflow: "visible" }}
          onMouseDown={handleDrawMouseDown}
          onMouseMove={handleDrawMouseMove}
          onClick={handleDrawClick}
          onMouseLeave={() => { if (drawTool === "eraser") setEraserPos(null); }}
        >
          <defs>
            <marker id="ah-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#ef4444" />
            </marker>
            <marker id="ah-start" markerWidth="8" markerHeight="8" refX="2" refY="3" orient="auto-start-reverse">
              <path d="M0,0 L0,6 L8,3 z" fill="#ef4444" />
            </marker>
          </defs>
          {arrows.map(s => (
            <DrawShapeEl key={s.id} shape={s} eraserMode={drawTool === "eraser"}
              onRemove={() => setArrows(prev => prev.filter(a => a.id !== s.id))} />
          ))}
          {drawingArrow && <DrawShapeEl shape={drawingArrow} isPreview />}
          {drawTool === "eraser" && eraserPos && (
            <circle cx={eraserPos.x} cy={eraserPos.y} r={ERASER_RADIUS}
              fill="rgba(239,68,68,0.12)" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2"
              style={{ pointerEvents: "none" }} />
          )}
        </svg>

        {/* Graph blocks */}
        {graphBlocks.map(g => (
          <GraphBlockEl key={g.id} block={g}
            onRemove={() => setGraphBlocks(prev => prev.filter(b => b.id !== g.id))}
            onDragStart={(e) => {
              e.preventDefault();
              graphDragRef.current = { id: g.id, startMx: e.clientX, startMy: e.clientY, startBx: g.x, startBy: g.y };
            }}
            onResizeStart={(e) => {
              e.preventDefault();
              graphResizeRef.current = { id: g.id, startMx: e.clientX, startMy: e.clientY, startW: g.width, startH: g.height };
            }}
          />
        ))}

        {/* Content editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
          onContextMenu={handleContextMenu}
          onMouseDown={handleEditorMouseDown}
          onClick={handleEditorClick}
          className="outline-none w-full text-zinc-800 a4-editor"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 18,
            lineHeight: "1.9",
            minHeight: 931,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            position: "relative",
            zIndex: drawTool ? 0 : 1,
            pointerEvents: drawTool && drawTool !== "eraser" ? "none" : "auto",
          }}
          data-placeholder="Start writing..."
        />

        {/* Hidden file inputs */}
        <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
        <input ref={voiceInputRef} type="file" accept="audio/*" className="hidden" onChange={handleVoiceFile} />
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFile} />

        {/* ── Floating video blocks ── */}
        {videoBlocks.map(blk => (
          <div key={blk.id} style={{ position: "absolute", left: blk.x, top: blk.y, width: blk.width, userSelect: "none", zIndex: 21 }}>
            <div
              style={{ position: "relative", cursor: blk.locked ? "default" : "grab", border: "2px solid #e2e8f0", borderRadius: 10, overflow: "visible", background: "#0f0f0f", boxShadow: "0 4px 20px rgba(0,0,0,0.22)" }}
              onMouseDown={e => {
                if (blk.locked) return;
                const tgt = e.target as HTMLElement;
                if (tgt.closest("[data-vid-btn]") || tgt.closest("[data-vid-resize]")) return;
                if (tgt.tagName === "VIDEO") return;
                e.preventDefault();
                videoDragRef.current = { id: blk.id, startMx: e.clientX, startMy: e.clientY, startBx: blk.x, startBy: blk.y };
              }}
            >
              <div style={{ padding: "6px 10px", background: "#1a1a2e", borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#8b5cf6"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                <span style={{ fontSize: 9, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.05em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{blk.name}</span>
              </div>
              <video controls src={blk.src} style={{ display: "block", width: "100%", borderRadius: "0 0 8px 8px", maxHeight: 320, background: "#000" }} />
              {!blk.locked && (
                <button data-vid-btn="1"
                  onClick={() => { const f = videoBlocks.filter(b => b.id !== blk.id); setVideoBlocks(f); }}
                  style={{ position: "absolute", top: -10, left: -10, width: 22, height: 22, borderRadius: "50%", background: "#ef4444", border: "2px solid #fff", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.18)", zIndex: 30, lineHeight: 1, padding: 0 }}
                  title="Delete video">×</button>
              )}
              <button data-vid-btn="1"
                onClick={() => setVideoBlocks(prev => prev.map(b => b.id === blk.id ? { ...b, locked: !b.locked } : b))}
                style={{ position: "absolute", top: -10, right: -10, width: 22, height: 22, borderRadius: "50%", background: blk.locked ? "#6366f1" : "#94a3b8", border: "2px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.18)", zIndex: 30, padding: 0 }}
                title={blk.locked ? "Unlock" : "Lock position"}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                  {blk.locked
                    ? <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    : <path d="M12 1C9.24 1 7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2h-1V6c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V6c0-1.66 1.34-3 3-3zm0 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" opacity=".4"/>}
                </svg>
              </button>
              <div style={{ position: "absolute", bottom: -20, left: 0, fontSize: 10, color: "#94a3b8", fontFamily: "monospace", pointerEvents: "none" }}>{Math.round(blk.width)}px</div>
              {!blk.locked && (
                <>
                  <div data-vid-resize="1" onMouseDown={e => { e.preventDefault(); e.stopPropagation(); videoResizeRef.current = { id: blk.id, startMx: e.clientX, startW: blk.width, startBx: blk.x, side: "bl" }; }}
                    style={{ position: "absolute", bottom: -5, left: -5, width: 10, height: 10, background: "#8b5cf6", border: "2px solid #fff", borderRadius: 2, zIndex: 30, cursor: "sw-resize" }} />
                  <div data-vid-resize="1" onMouseDown={e => { e.preventDefault(); e.stopPropagation(); videoResizeRef.current = { id: blk.id, startMx: e.clientX, startW: blk.width, startBx: blk.x, side: "br" }; }}
                    style={{ position: "absolute", bottom: -5, right: -5, width: 10, height: 10, background: "#8b5cf6", border: "2px solid #fff", borderRadius: 2, zIndex: 30, cursor: "se-resize" }} />
                </>
              )}
            </div>
          </div>
        ))}

        {/* ── Floating image blocks ── */}
        {imageBlocks.map(blk => (
          <div key={blk.id} style={{ position: "absolute", left: blk.x, top: blk.y, width: blk.width, userSelect: "none", zIndex: 20 }}>
            <div
              style={{ position: "relative", cursor: blk.locked ? "default" : "grab", border: "2px solid #e2e8f0", borderRadius: 8, overflow: "visible", background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.10)" }}
              onMouseDown={e => {
                if (blk.locked) return;
                const tgt = e.target as HTMLElement;
                if (tgt.closest("[data-img-btn]") || tgt.closest("[data-resize-handle]")) return;
                e.preventDefault();
                dragRef.current = { id: blk.id, startMx: e.clientX, startMy: e.clientY, startBx: blk.x, startBy: blk.y };
              }}
            >
              <img src={blk.src} alt="" draggable={false} style={{ display: "block", width: "100%", borderRadius: 6, pointerEvents: "none" }} />
              {!blk.locked && (
                <button data-img-btn="1"
                  onClick={() => { const f = imageBlocks.filter(b => b.id !== blk.id); setImageBlocks(f); }}
                  style={{ position: "absolute", top: -10, left: -10, width: 22, height: 22, borderRadius: "50%", background: "#ef4444", border: "2px solid #fff", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.18)", zIndex: 30, lineHeight: 1, padding: 0 }}
                  title="Delete image">×</button>
              )}
              <button data-img-btn="1"
                onClick={() => setImageBlocks(prev => prev.map(b => b.id === blk.id ? { ...b, locked: !b.locked } : b))}
                style={{ position: "absolute", top: -10, right: -10, width: 22, height: 22, borderRadius: "50%", background: blk.locked ? "#6366f1" : "#94a3b8", border: "2px solid #fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.18)", zIndex: 30, padding: 0, transition: "opacity 0.2s" }}
                title={blk.locked ? "Unlock" : "Lock position"}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                  {blk.locked
                    ? <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    : <path d="M12 1C9.24 1 7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2h-1V6c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V6c0-1.66 1.34-3 3-3zm0 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" opacity=".4"/>}
                </svg>
              </button>
              <div style={{ position: "absolute", bottom: -20, left: 0, fontSize: 10, color: "#94a3b8", fontFamily: "monospace", pointerEvents: "none" }}>{Math.round(blk.width)}px</div>
              {!blk.locked && [
                { side: "bl" as const, style: { bottom: -5, left: -5, cursor: "sw-resize" } },
                { side: "br" as const, style: { bottom: -5, right: -5, cursor: "se-resize" } },
              ].map(({ side, style }) => (
                <div key={side} data-resize-handle="1"
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); resizeRef.current = { id: blk.id, startMx: e.clientX, startW: blk.width, startBx: blk.x, side }; }}
                  style={{ position: "absolute", width: 10, height: 10, background: "#ef4444", border: "2px solid #fff", borderRadius: 2, zIndex: 30, ...style }} />
              ))}
            </div>
          </div>
        ))}

        {/* ── Todo inline +/- buttons ── */}
        {lastTodoPos && (
          <div
            onMouseEnter={() => setShowTodoButtons(true)}
            onMouseLeave={() => setShowTodoButtons(false)}
            style={{ position: "absolute", top: lastTodoPos.top, left: lastTodoPos.left - 30, transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 4, zIndex: 200, pointerEvents: "auto", opacity: showTodoButtons ? 1 : 0, transition: "opacity 0.15s ease" }}
          >
            <button
              onMouseDown={e => { e.preventDefault(); removeLastTodoItem(1); }}
              title="Remove last item"
              style={{ width: 20, height: 20, borderRadius: 4, border: "1px solid #e7e5e4", background: "#fafaf8", color: "#374151", fontSize: 12, fontWeight: 700, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2"; (e.currentTarget as HTMLButtonElement).style.color = "#dc2626"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fafaf8"; (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}
            >−</button>
            <button
              onMouseDown={e => { e.preventDefault(); appendTodoAtEnd(); }}
              title="Add new item"
              style={{ width: 20, height: 20, borderRadius: 4, border: "1px solid #e7e5e4", background: "#fafaf8", color: "#374151", fontSize: 12, fontWeight: 700, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#dcfce7"; (e.currentTarget as HTMLButtonElement).style.color = "#16a34a"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fafaf8"; (e.currentTarget as HTMLButtonElement).style.color = "#374151"; }}
            >+</button>
          </div>
        )}

        {/* ── Table +/- row & column buttons ── */}
        {tableToolbar && (() => {
          const isLined = activeTableRef.current?.dataset.lined === "true";
          const btnStyle = (): React.CSSProperties => ({ width: 16, height: 16, borderRadius: 0, border: "1px solid #000", background: "#fafaf8", color: "#374151", fontSize: 13, fontWeight: 700, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0.3 });
          const hoverRed = (e: React.MouseEvent<HTMLButtonElement>) => { const t = e.currentTarget; t.style.background = "#fee2e2"; t.style.color = "#dc2626"; };
          const hoverGreen = (e: React.MouseEvent<HTMLButtonElement>) => { const t = e.currentTarget; t.style.background = "#dcfce7"; t.style.color = "#16a34a"; };
          const hoverReset = (e: React.MouseEvent<HTMLButtonElement>) => { const t = e.currentTarget; t.style.background = "#fafaf8"; t.style.color = "#374151"; };
          const hoverOrange = (e: React.MouseEvent<HTMLButtonElement>) => { const t = e.currentTarget; t.style.background = "#fee2e2"; t.style.color = "#dc2626"; };
          const rowBtns = (
            <div
              onMouseEnter={() => setHoverTableBtns(true)}
              onMouseLeave={() => setHoverTableBtns(false)}
              style={{ position: "absolute", top: isLined ? tableToolbar.top + 8 : tableToolbar.top + tableToolbar.height + 2, left: isLined ? tableToolbar.left - 30 : tableToolbar.left + 4, display: "flex", flexDirection: isLined ? "column" : "row", gap: 4, zIndex: 200, pointerEvents: "auto", opacity: showTableBtns || hoverTableBtns ? 1 : 0, padding: 12, margin: -12 }}>
              {isLined && (
                <button onMouseDown={e => { e.preventDefault(); tableDeleteTable(); }} title="Delete lined table"
                  style={{ ...btnStyle(), fontSize: 12 }} onMouseEnter={hoverOrange} onMouseLeave={hoverReset}>✕</button>
              )}
              <button onMouseDown={e => { e.preventDefault(); tableRemoveRow(); }} title="Remove last row" style={btnStyle()} onMouseEnter={hoverRed} onMouseLeave={hoverReset}>−</button>
              <button onMouseDown={e => { e.preventDefault(); tableAddRow(); }} title="Add row" style={btnStyle()} onMouseEnter={hoverGreen} onMouseLeave={hoverReset}>+</button>
            </div>
          );
          const hoverBlue = (e: React.MouseEvent<HTMLButtonElement>) => { const t = e.currentTarget; t.style.background = "#dbeafe"; t.style.color = "#2563eb"; };
          const colBtns = !isLined && (
            <div
              onMouseEnter={() => setHoverTableBtns(true)}
              onMouseLeave={() => setHoverTableBtns(false)}
              style={{ position: "absolute", top: tableToolbar.top + 4, left: tableToolbar.left + tableToolbar.width + 2, display: "flex", flexDirection: "column", gap: 4, zIndex: 200, pointerEvents: "auto", opacity: showTableBtns || hoverTableBtns ? 1 : 0, padding: 12, margin: -12 }}>
              <button onMouseDown={e => { e.preventDefault(); tableRemoveCol(); }} title="Remove last column" style={btnStyle()} onMouseEnter={hoverRed} onMouseLeave={hoverReset}>−</button>
              <button onMouseDown={e => { e.preventDefault(); tableAddCol(); }} title="Add column" style={btnStyle()} onMouseEnter={hoverGreen} onMouseLeave={hoverReset}>+</button>
              <button onMouseDown={e => { e.preventDefault(); tableDeleteTable(); }} title="Delete table" style={{ ...btnStyle(), fontSize: 12 }} onMouseEnter={hoverBlue} onMouseLeave={hoverReset}>✕</button>
            </div>
          );
          return <>{rowBtns}{colBtns}</>;
        })()}
      </div>

      {/* Draw mode banner */}
      {drawTool && (
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-xs text-zinc-400 bg-zinc-700 px-3 py-1 rounded-full">
            Drawing: {DRAW_TOOL_LABELS[drawTool]} — Press Esc to exit
          </span>
          <button onClick={() => setDrawTool(null)} className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-700">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── Context Menu ── */}
      {ctxMenu && (
        <div
          ref={ctxMenuRef}
          className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-stone-200 py-1.5 min-w-[210px]"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Undo / Clear / Redo */}
          <div className="flex border-b border-stone-100">
            <button onMouseDown={e => { e.preventDefault(); universalUndo(); setCtxMenu(null); }} title="Undo"
              className="flex-1 flex items-center justify-center px-2 py-1 hover:bg-indigo-50 hover:text-indigo-700 text-stone-500 transition-colors">
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px bg-stone-100 my-1" />
            <button onMouseDown={e => { e.preventDefault(); setShowClearConfirm(true); setCtxMenu(null); }} title="Clear page"
              className="flex-1 flex items-center justify-center px-2 py-1 hover:bg-red-50 hover:text-red-500 text-stone-500 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px bg-stone-100 my-1" />
            <button onMouseDown={e => { e.preventDefault(); universalRedo(); setCtxMenu(null); }} title="Redo"
              className="flex-1 flex items-center justify-center px-2 py-1 hover:bg-indigo-50 hover:text-indigo-700 text-stone-500 transition-colors">
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Format */}
          <div className="relative">
            <CtxItem icon={<Bold className="w-3.5 h-3.5"/>} label="Format" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, formatOpen: !m.formatOpen } : null)} />
            {ctxMenu.formatOpen && (
              <div className="absolute left-full top-0 ml-1 bg-white rounded-2xl shadow-2xl border border-stone-200 py-2.5 z-[10000] w-[200px]">
                <div className="px-3.5 pb-2 border-b border-stone-100">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Format</p>
                </div>
                <div className="px-2 pt-2 pb-1">
                  <CtxItem icon={<span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold leading-none text-stone-500">T</span>} label="Normal" onClick={() => { execFmt("removeFormat"); restoreSelection(); setCtxMenu(null); }} />
                  <CtxItem icon={<span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-black tracking-tight leading-none">AA</span>} label="All Caps" onClick={execAllCaps} />
                </div>
                <div className="mx-3 border-t border-stone-100" />
                <div className="px-2 pt-1.5 pb-1">
                  <CtxItem icon={<Bold className="w-3.5 h-3.5"/>}          label="Bold"          shortcut="Ctrl+B" active={ctxMenu.boldActive}      onClick={() => execFmt("bold")} />
                  <CtxItem icon={<Italic className="w-3.5 h-3.5"/>}        label="Italic"        shortcut="Ctrl+I" active={ctxMenu.italicActive}    onClick={() => execFmt("italic")} />
                  <CtxItem icon={<Underline className="w-3.5 h-3.5"/>}     label="Underline"     shortcut="Ctrl+U" active={ctxMenu.underlineActive} onClick={() => execFmt("underline")} />
                  <CtxItem icon={<Strikethrough className="w-3.5 h-3.5"/>} label="Strikethrough"                   active={ctxMenu.strikeActive}    onClick={() => execFmt("strikeThrough")} />
                </div>
                <div className="mx-3 border-t border-stone-100" />
                <div className="px-2 pt-1.5 pb-1">
                  <CtxItem icon={<Subscript className="w-3.5 h-3.5"/>}   label="Subscript"   shortcut="X₂" active={ctxMenu.subActive} onClick={() => {
                    restoreSelection();
                    const wasActive = document.queryCommandState("subscript");
                    document.execCommand("subscript", false);
                    setTimeout(wasActive ? breakFormatAfterApply : exitSubSupFormat, 0);
                    debouncedSave(); setCtxMenu(null);
                  }} />
                  <CtxItem icon={<Superscript className="w-3.5 h-3.5"/>} label="Superscript" shortcut="X²" active={ctxMenu.supActive} onClick={() => {
                    restoreSelection();
                    const wasActive = document.queryCommandState("superscript");
                    document.execCommand("superscript", false);
                    setTimeout(wasActive ? breakFormatAfterApply : exitSubSupFormat, 0);
                    debouncedSave(); setCtxMenu(null);
                  }} />
                </div>
                <div className="mx-3 border-t border-stone-100" />
                <div className="px-2 pt-1.5 pb-1">
                  <div className="relative">
                    <CtxItem icon={<span className="w-3.5 h-3.5 flex items-center justify-center text-[11px] font-bold" style={{ color: "#ef4444" }}>A</span>} label="Font Colour" hasArrow
                      onClick={() => setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, formatOpen: true, fontColorOpen: !m.fontColorOpen } : null)} />
                    {ctxMenu.fontColorOpen && (
                      <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 p-2.5 z-[10001]" style={{ minWidth: 140 }}>
                        <div className="flex flex-wrap gap-1.5">
                          {FONT_COLORS.map(fc => (
                            <button key={fc.color} title={fc.label}
                              onMouseDown={e => { e.preventDefault(); execFmt("foreColor", fc.color); }}
                              className="w-6 h-6 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                              style={{ backgroundColor: fc.color }} />
                          ))}
                          <button title="Remove colour" onMouseDown={e => { e.preventDefault(); execFmt("removeFormat"); }}
                            className="w-6 h-6 rounded-full border-2 border-stone-300 flex items-center justify-center hover:scale-110 transition-transform">
                            <X className="w-3 h-3 text-stone-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <CtxItem icon={<Highlighter className="w-3.5 h-3.5"/>} label="Highlight" hasArrow
                      onClick={() => setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, formatOpen: true, highlightOpen: !m.highlightOpen } : null)} />
                    {ctxMenu.highlightOpen && (
                      <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 p-2.5 flex gap-1.5 z-[10001]">
                        {HIGHLIGHT_COLORS.map(hc => (
                          <button key={hc.color} title={hc.label}
                            onMouseDown={e => { e.preventDefault(); execFmt("hiliteColor", hc.color); }}
                            className="w-6 h-6 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                            style={{ backgroundColor: hc.color }} />
                        ))}
                        <button title="Remove" onMouseDown={e => { e.preventDefault(); execFmt("hiliteColor", "transparent"); }}
                          className="w-6 h-6 rounded-full border-2 border-stone-300 flex items-center justify-center hover:scale-110 transition-transform">
                          <X className="w-3 h-3 text-stone-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mx-3 border-t border-stone-100" />
                <div className="px-2 pt-1.5 pb-1">
                  <div className="relative">
                    <CtxItem icon={<Heading1 className="w-3.5 h-3.5"/>} label="Heading" hasArrow
                      onClick={() => setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, formatOpen: true, headingOpen: !m.headingOpen } : null)} />
                    {ctxMenu.headingOpen && (
                      <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-1.5 z-[10001] min-w-[130px]">
                        <CtxItem icon={<Heading1 className="w-3.5 h-3.5"/>} label="Heading 1" onClick={() => execFmt("formatBlock", "h1")} />
                        <CtxItem icon={<Heading2 className="w-3.5 h-3.5"/>} label="Heading 2" onClick={() => execFmt("formatBlock", "h2")} />
                        <CtxItem icon={<Heading3 className="w-3.5 h-3.5"/>} label="Heading 3" onClick={() => execFmt("formatBlock", "h3")} />
                        <CtxItem icon={<AlignLeft className="w-3.5 h-3.5"/>} label="Paragraph" onClick={() => execFmt("formatBlock", "p")} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Font */}
          <div className="relative" ref={fontItemRef}>
            <CtxItem icon={<span className="w-3.5 h-3.5 flex items-center justify-center text-[11px] font-bold leading-none">Aa</span>} label="Font" hasArrow
              onClick={() => {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, fontOpen: !m.fontOpen } : null);
              }} />
            {ctxMenu.fontOpen && (
              <div ref={fontSubCardRef} className="fixed z-[10001]" style={{ minWidth: 220, top: 0, left: 0 }} onMouseDown={e => e.stopPropagation()}>
                <div style={{ width: 220, background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.10)", fontFamily: "Inter, sans-serif" }}>
                  <div style={{ padding: "14px 14px 12px", background: "#c2c2c2" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", marginBottom: 8 }}>
                      Specimen · {ctxSelectedFont ?? "Georgia"}
                    </div>
                    <div style={{ fontFamily: ctxSelectedFont ?? "Georgia", fontSize: ctxFontSize, lineHeight: 1.15, color: "#fff", wordBreak: "break-word", minHeight: 36, transition: "font-size 0.15s, font-family 0.1s", textShadow: "0 1px 8px rgba(0,0,0,0.18)" }}>
                      Abc 123
                    </div>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <button onMouseDown={e => { e.preventDefault(); applyCtxFontSize(Math.max(8, ctxFontSize - 2)); }}
                        style={{ width: 22, height: 22, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 2, color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontVariantNumeric: "tabular-nums", minWidth: 36, textAlign: "center" }}>{ctxFontSize}px</span>
                      <button onMouseDown={e => { e.preventDefault(); applyCtxFontSize(Math.min(96, ctxFontSize + 2)); }}
                        style={{ width: 22, height: 22, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 2, color: "#fff", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                  </div>
                  <div style={{ padding: "7px 12px", borderBottom: "1px solid #e8e8e8", display: "flex", flexWrap: "wrap", gap: 3 }}>
                    {[10, 12, 14, 16, 18, 20, 24, 28, 32, 48, 72].map(s => (
                      <button key={s} onMouseDown={e => { e.preventDefault(); applyCtxFontSize(s); }}
                        style={{ height: 20, padding: "0 6px", fontSize: 9, fontWeight: 600, borderRadius: 2, border: ctxFontSize === s ? "1.5px solid #c2c2c2" : "1px solid #ddd", background: ctxFontSize === s ? "#c2c2c2" : "#fafafa", color: ctxFontSize === s ? "#333" : "#666", cursor: "pointer" }}>{s}</button>
                    ))}
                  </div>
                  <div style={{ padding: "7px 12px", borderBottom: "1px solid #e8e8e8", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#999" }}>Apply to</span>
                    <div style={{ display: "flex", border: "1px solid #c2c2c2", borderRadius: 2, overflow: "hidden" }}>
                      {(["all", "selected"] as const).map(m => (
                        <button key={m} onMouseDown={e => { e.preventDefault(); setCtxFontSizeMode(m); }}
                          style={{ padding: "2px 8px", fontSize: 9, fontWeight: 700, border: "none", cursor: "pointer", background: ctxFontSizeMode === m ? "#c2c2c2" : "#fff", color: ctxFontSizeMode === m ? "#333" : "#888", textTransform: "capitalize" }}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: "7px 12px", borderBottom: "1px solid #e8e8e8" }}>
                    <input value={ctxFontSearch} onChange={e => setCtxFontSearch(e.target.value)} placeholder="Search typeface..."
                      style={{ width: "100%", height: 26, padding: "0 8px", fontSize: 11, border: "1px solid #ccc", borderRadius: 2, background: "#fafafa", outline: "none", boxSizing: "border-box", color: "#222" }} />
                  </div>
                  <div style={{ maxHeight: 220, overflowY: "auto" }}>
                    {FONTS_CTX.filter(f => f.toLowerCase().includes(ctxFontSearch.toLowerCase())).map((f, i, arr) => {
                      const isSelected = ctxSelectedFont === f;
                      return (
                        <button key={f} onMouseDown={e => {
                          e.preventDefault();
                          if (isSelected) setCtxSelectedFont(null);
                          else { applyCtxFontName(f); setCtxSelectedFont(f); }
                        }}
                          style={{ display: "flex", alignItems: "center", width: "100%", padding: "7px 12px", borderBottom: i < arr.length - 1 ? "1px solid #f0f0f0" : "none", background: isSelected ? "#c2c2c2" : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
                          <span style={{ fontSize: 9, color: isSelected ? "#555" : "#bbb", width: 18, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{String(FONTS_CTX.indexOf(f) + 1).padStart(2, "0")}</span>
                          <span style={{ fontSize: 9, fontWeight: 400, letterSpacing: "0.05em", textTransform: "uppercase", color: isSelected ? "#444" : "#aaa", width: 80, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
                          <span style={{ fontFamily: f, fontSize: 15, color: "#222", marginLeft: "auto" }}>Abc</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Align */}
          <div className="relative">
            <CtxItem icon={<AlignLeft className="w-3.5 h-3.5"/>} label="Align" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, alignOpen: !m.alignOpen } : null)} />
            {ctxMenu.alignOpen && (
              <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-1.5 z-[10000] min-w-[160px]">
                <CtxItem icon={<AlignLeft className="w-3.5 h-3.5"/>}   label="Align Left"   onClick={() => execFmt("justifyLeft")} />
                <CtxItem icon={<AlignCenter className="w-3.5 h-3.5"/>} label="Align Center" onClick={() => execFmt("justifyCenter")} />
                <CtxItem icon={<AlignRight className="w-3.5 h-3.5"/>}  label="Align Right"  onClick={() => execFmt("justifyRight")} />
              </div>
            )}
          </div>

          <div className="my-1 border-t border-stone-100" />
          <CtxSection label="Attach" />
          <CtxItem icon={<CheckSquare className="w-3.5 h-3.5"/>} label="To-Do Item" onClick={() => { insertTodo(); setCtxMenu(null); }} />

          {/* Table */}
          <div className="relative" ref={tableItemRef}>
            <CtxItem icon={<Table className="w-3.5 h-3.5"/>} label="Table" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, tableOpen: !m.tableOpen } : null)} />
            {ctxMenu.tableOpen && (
              <div ref={tableSubCardRef} className="fixed bg-white rounded-xl shadow-2xl border border-stone-200 p-3 z-[10000]" style={{ minWidth: 230, top: 0, left: 0 }} onMouseDown={e => e.stopPropagation()}>
                <div className="text-[11px] font-semibold text-stone-400 mb-2 text-center">
                  {ctxTableHover ? `${ctxTableHover.r} × ${ctxTableHover.c} Table` : "Hover to pick size"}
                </div>
                <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(10, 1fr)" }} onMouseLeave={() => setCtxTableHover(null)}>
                  {Array.from({ length: 10 }, (_, ri) =>
                    Array.from({ length: 10 }, (_, ci) => {
                      const r = ri + 1, c = ci + 1;
                      const isHi = ctxTableHover ? r <= ctxTableHover.r && c <= ctxTableHover.c : false;
                      return (
                        <div key={`${r}-${c}`}
                          className={`w-5 h-5 border cursor-pointer transition-colors rounded-sm ${isHi ? "bg-orange-200 border-orange-400" : "bg-stone-100 border-stone-300 hover:bg-orange-100 hover:border-orange-300"}`}
                          onMouseEnter={() => setCtxTableHover({ r, c })}
                          onClick={() => { if (ctxTableHover) insertTableWithSize(ctxTableHover.r, ctxTableHover.c); }} />
                      );
                    })
                  )}
                </div>
                <div className="text-[10px] text-stone-400 text-center mt-1.5">Max 10 × 10 (grid)</div>
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <div className="text-[11px] font-semibold text-stone-400 mb-2 text-center">Custom</div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="text-[11px] text-stone-400">Rows</span>
                    <input type="number" min={1} value={ctxTableCustomRows} placeholder="—"
                      onChange={e => setCtxTableCustomRows(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { const r = parseInt(ctxTableCustomRows), c = parseInt(ctxTableCustomCols); if (!isNaN(r) && !isNaN(c) && r >= 1 && c >= 1) insertTableWithSize(Math.min(r, 999), Math.min(c, 200)); }}}
                      className="w-14 h-6 text-center text-[12px] border border-stone-300 rounded bg-white focus:outline-none focus:border-orange-400" />
                    <span className="text-[11px] text-stone-400">Cols</span>
                    <input type="number" min={1} max={200} value={ctxTableCustomCols} placeholder="—"
                      onChange={e => setCtxTableCustomCols(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { const r = parseInt(ctxTableCustomRows), c = parseInt(ctxTableCustomCols); if (!isNaN(r) && !isNaN(c) && r >= 1 && c >= 1) insertTableWithSize(Math.min(r, 999), Math.min(c, 200)); }}}
                      className="w-14 h-6 text-center text-[12px] border border-stone-300 rounded bg-white focus:outline-none focus:border-orange-400" />
                    <button onClick={() => { const r = parseInt(ctxTableCustomRows), c = parseInt(ctxTableCustomCols); if (!isNaN(r) && !isNaN(c) && r >= 1 && c >= 1) insertTableWithSize(Math.min(r, 999), Math.min(c, 200)); }}
                      className="h-6 px-2.5 text-[11px] font-semibold rounded bg-orange-400 text-white hover:bg-orange-500 transition-colors">Apply</button>
                  </div>
                  <div className="text-[10px] text-stone-400 text-center mt-1.5">Rows: unlimited · Cols: max 200</div>
                </div>
              </div>
            )}
          </div>

          <CtxItem icon={<Table className="w-3.5 h-3.5"/>} label="Lined" onClick={() => { insertLined(); setCtxMenu(null); }} />

          {/* Bullet List */}
          <div className="relative">
            <CtxItem icon={<List className="w-3.5 h-3.5"/>} label="Bullet List" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, bulletOpen: !m.bulletOpen } : null)} />
            {ctxMenu.bulletOpen && (
              <div className="absolute left-full bottom-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 px-2 z-[10000] min-w-[220px]">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-1 mb-1.5">Choose a list style</p>
                <button onClick={() => insertCustomBullet("ordered")}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-stone-700 text-xs font-medium transition-colors text-left">
                  <span className="text-sm font-semibold text-stone-500 w-6 text-center">1.</span><span>Number List</span>
                </button>
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-1 mt-1.5 mb-1">Color</p>
                <div className="grid grid-cols-4 gap-1">
                  {[{ char: "🟢", label: "Green" },{ char: "🔵", label: "Blue" },{ char: "🔴", label: "Red" },{ char: "⚪", label: "White" }].map(({ char, label }) => (
                    <button key={char} title={label} onClick={() => insertCustomBullet(char)}
                      className="flex items-center justify-center h-8 w-full rounded-lg hover:bg-indigo-50 text-base transition-colors border border-stone-100 hover:border-indigo-200">{char}</button>
                  ))}
                </div>
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-1 mt-2 mb-1">Symbols</p>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { char: "●", label: "Disc" },{ char: "◎", label: "Ring" },{ char: "◉", label: "Bullseye" },{ char: "◈", label: "Diamond" },
                    { char: "☑", label: "Check Box" },{ char: "✔", label: "Tick" },{ char: "➤", label: "Arrow" },{ char: "➜", label: "Round Arrow" },
                    { char: "◘", label: "Square" },{ char: "♫", label: "Music" },{ char: "★", label: "Star" },{ char: "📞", label: "Phone" },
                    { char: "$", label: "Dollar" },{ char: "£", label: "Pound" },{ char: "»", label: "Guillemet" },{ char: "disc", label: "Default" },
                  ].map(({ char, label }) => (
                    <button key={char} title={label} onClick={() => insertCustomBullet(char === "disc" ? "disc" : char)}
                      className="flex items-center justify-center h-8 w-full rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-stone-700 text-base transition-colors border border-stone-100 hover:border-indigo-200">
                      {char === "disc" ? "•" : char}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider Line */}
          <div className="relative">
            <CtxItem icon={<Minus className="w-3.5 h-3.5"/>} label="Divider Line" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, dividerOpen: !m.dividerOpen } : null)} />
            {ctxMenu.dividerOpen && (
              <div className="absolute left-full bottom-0 ml-1 bg-white rounded-2xl shadow-2xl border border-stone-200 py-2.5 z-[10000] w-[220px] overflow-hidden">
                <div className="px-3.5 pb-2 border-b border-stone-100">
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Divider Style</p>
                </div>
                <div className="px-2 pt-2 pb-1">
                  {[
                    { key: "gradient", label: "Gradient Line", preview: <div className="flex-1 h-[2px] rounded-full" style={{ background: "linear-gradient(to right,transparent,#94a3b8,transparent)" }} /> },
                    { key: "shadow",   label: "Shadow Line",   preview: <div className="flex-1 h-px bg-stone-300 rounded-full" style={{ boxShadow: "0 2px 5px -1px rgba(0,0,0,0.18)" }} /> },
                  ].map(({ key, label, preview }) => (
                    <button key={key} onClick={() => insertDividerStyle(key)}
                      className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-violet-50 hover:text-violet-700 text-stone-600 transition-colors text-left group">
                      <div className="flex items-center w-12 h-4">{preview}</div>
                      <span className="text-[11px] font-medium">{label}</span>
                    </button>
                  ))}
                </div>
                <div className="mx-3 border-t border-stone-100" />
                <div className="px-2 pt-1.5 pb-1">
                  {[
                    { key: "thin",   label: "Thin Line",   preview: <div className="flex-1 border-t border-stone-300" /> },
                    { key: "single", label: "Single Line", preview: <div className="flex-1 border-t-2 border-stone-700" /> },
                    { key: "double", label: "Double Line", preview: <div className="flex-1" style={{ borderTop: "3px double #78716c" }} /> },
                    { key: "bold",   label: "Bold Line",   preview: <div className="flex-1 border-t-4 border-stone-600" /> },
                  ].map(({ key, label, preview }) => (
                    <button key={key} onClick={() => insertDividerStyle(key)}
                      className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-stone-600 transition-colors text-left group">
                      <div className="flex items-center w-12 h-4">{preview}</div>
                      <span className="text-[11px] font-medium">{label}</span>
                    </button>
                  ))}
                </div>
                <div className="mx-3 border-t border-stone-100" />
                <div className="px-2 pt-1.5 pb-1">
                  {[
                    { key: "dashed", label: "Dashed Line", preview: <div className="flex-1 border-t-2 border-dashed border-stone-400" /> },
                    { key: "dotted", label: "Dot Line",    preview: <div className="flex-1 border-t-2 border-dotted border-stone-400" /> },
                  ].map(({ key, label, preview }) => (
                    <button key={key} onClick={() => insertDividerStyle(key)}
                      className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-stone-600 transition-colors text-left group">
                      <div className="flex items-center w-12 h-4">{preview}</div>
                      <span className="text-[11px] font-medium">{label}</span>
                    </button>
                  ))}
                </div>
                <div className="mx-3 border-t border-stone-100" />
                <div className="px-2 pt-1.5 pb-1">
                  {[
                    { key: "colored", label: "Blue Line",  preview: <div className="flex-1 border-t-2 border-indigo-400" />, hover: "hover:bg-indigo-50 hover:text-indigo-700", dot: "bg-indigo-400" },
                    { key: "green",   label: "Green Line", preview: <div className="flex-1 border-t-2 border-emerald-500" />, hover: "hover:bg-emerald-50 hover:text-emerald-700", dot: "bg-emerald-500" },
                    { key: "red",     label: "Red Line",   preview: <div className="flex-1 border-t-2 border-red-500" />, hover: "hover:bg-red-50 hover:text-red-600", dot: "bg-red-500" },
                  ].map(({ key, label, preview, hover, dot }) => (
                    <button key={key} onClick={() => insertDividerStyle(key)}
                      className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-lg ${hover} text-stone-600 transition-colors text-left group`}>
                      <div className="flex items-center w-12 h-4">{preview}</div>
                      <span className="text-[11px] font-medium">{label}</span>
                      <span className={`ml-auto w-2 h-2 rounded-full ${dot} flex-shrink-0`} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Links */}
          <div className="relative">
            <CtxItem icon={<Link className="w-3.5 h-3.5"/>} label="Links" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, linkOpen: !m.linkOpen } : null)} />
            {ctxMenu.linkOpen && (
              <div className="absolute left-full bottom-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 px-2 z-[10000] min-w-[190px]">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-1 mb-1.5">Choose a link type</p>
                {[
                  { key: "website",  label: "Website",  icon: "🌐", color: "text-blue-600",   bg: "hover:bg-blue-50",   dot: "bg-blue-500" },
                  { key: "youtube",  label: "YouTube",  icon: "▶",  color: "text-red-600",    bg: "hover:bg-red-50",    dot: "bg-red-500" },
                  { key: "facebook", label: "Facebook", icon: "f",  color: "text-blue-700",   bg: "hover:bg-blue-50",   dot: "bg-blue-700" },
                  { key: "linkedin", label: "LinkedIn", icon: "in", color: "text-sky-700",    bg: "hover:bg-sky-50",    dot: "bg-sky-700" },
                  { key: "unknown",  label: "Other",    icon: "🔗", color: "text-stone-500",  bg: "hover:bg-stone-50",  dot: "bg-stone-400" },
                ].map(({ key, label, icon, color, bg, dot }) => (
                  <button key={key} onClick={() => insertLinkBlock(key)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg ${bg} text-stone-700 transition-colors text-left`}>
                    <span className={`w-5 h-5 rounded-full ${dot} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>{icon}</span>
                    <span className={`text-xs font-medium ${color}`}>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Media */}
          <div className="relative">
            <CtxItem icon={<ImagePlus className="w-3.5 h-3.5"/>} label="Media" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, mediaOpen: !m.mediaOpen } : null)} />
            {ctxMenu.mediaOpen && (
              <div className="absolute left-full bottom-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 px-2 z-[10000] min-w-[170px]">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-1 mb-1.5">Choose Media Type</p>
                <button onClick={() => { setCtxMenu(null); imgInputRef.current?.click(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-indigo-50 text-stone-700 text-left transition-colors">
                  <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    <img src="/image-icon.png" alt="Image" className="w-4 h-4 object-contain" />
                  </span>
                  <div className="text-xs font-semibold text-stone-700">Image</div>
                </button>
                <button onClick={() => { setCtxMenu(null); voiceInputRef.current?.click(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-rose-50 text-stone-700 text-left transition-colors">
                  <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    <img src="/voice-icon.png" alt="Voice" className="w-5 h-5 object-contain" />
                  </span>
                  <div className="text-xs font-semibold text-stone-700">Voice</div>
                </button>
                <button onClick={() => { setCtxMenu(null); videoInputRef.current?.click(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-violet-50 text-left transition-colors">
                  <span className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    <img src="/video-icon.png" alt="Video" className="w-4 h-4 object-contain" />
                  </span>
                  <div className="text-xs font-semibold text-stone-700">Video</div>
                </button>
              </div>
            )}
          </div>

          {/* Draw */}
          <div className="relative">
            <CtxItem
              icon={<PenLine className="w-3.5 h-3.5"/>}
              label={drawTool ? `Drawing: ${DRAW_TOOL_LABELS[drawTool]}` : "Draw"}
              hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, drawOpen: !m.drawOpen } : null)}
            />
            {ctxMenu.drawOpen && (
              <div className="absolute left-full bottom-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 px-2 z-[10000] min-w-[256px]">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-1 mb-1.5">Choose a tool</p>
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {DRAW_SHAPES.map(({ key, icon, label }) => (
                    <button key={key} title={label}
                      onClick={() => { setDrawTool(key as DrawTool); setCtxMenu(null); }}
                      className={`flex flex-col items-center justify-center gap-0.5 h-[54px] rounded-lg border transition-colors font-medium
                        ${drawTool === key ? "bg-indigo-100 border-indigo-400 text-indigo-700" : "border-stone-100 hover:bg-indigo-50 hover:border-indigo-200 text-stone-600 hover:text-indigo-700"}`}>
                      <span className="text-lg leading-none flex items-center justify-center [&_img]:w-5 [&_img]:h-5 [&_img]:object-contain">{icon}</span>
                      <span className="text-[9px] font-semibold leading-tight text-center px-0.5 truncate w-full">{label}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-stone-100 pt-1.5">
                  <button
                    onClick={() => { setDrawTool(drawTool === "eraser" ? null : "eraser"); setCtxMenu(null); }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-colors text-xs font-medium
                      ${drawTool === "eraser" ? "bg-red-50 border-red-300 text-red-600" : "border-stone-100 hover:bg-red-50 hover:border-red-200 text-stone-600 hover:text-red-600"}`}>
                    <Eraser className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Eraser — click a shape to remove</span>
                  </button>
                  {drawTool && (
                    <button onClick={() => { setDrawTool(null); setCtxMenu(null); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 mt-1 rounded-lg border border-stone-100 hover:bg-stone-50 text-stone-500 hover:text-stone-700 text-xs font-medium transition-colors">
                      <X className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Stop Drawing</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Graph */}
          <div className="relative">
            <CtxItem icon={<BarChart2 className="w-3.5 h-3.5"/>} label="Graph" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, graphOpen: !m.graphOpen } : null)} />
            {ctxMenu.graphOpen && (
              <div className="absolute left-full bottom-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 px-2 z-[10000] min-w-[190px]">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-1 mb-1.5">Choose Chart Type</p>
                {[
                  { type: "bar"  as GraphType, label: "Bar Chart",  imgSrc: barChartIcon,  bg: "hover:bg-indigo-50"  },
                  { type: "line" as GraphType, label: "Line Chart", imgSrc: lineChartIcon, bg: "hover:bg-emerald-50" },
                  { type: "area" as GraphType, label: "Area Chart", imgSrc: areaChartIcon, bg: "hover:bg-blue-50"    },
                  { type: "pie"  as GraphType, label: "Pie Chart",  imgSrc: pieChartIcon,  bg: "hover:bg-amber-50"   },
                ].map(({ type, label, imgSrc, bg }) => (
                  <button key={type} onClick={() => insertGraph(type)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg ${bg} text-stone-700 transition-colors text-left`}>
                    <img src={imgSrc} alt={label} className="w-5 h-5 flex-shrink-0" />
                    <span className="text-xs font-medium text-stone-900">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Block */}
          <div className="relative">
            <CtxItem icon={<ChevronRight className="w-3.5 h-3.5"/>} label="Block" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, ...CLOSE_ALL_SUBS, blockOpen: !m.blockOpen } : null)} />
            {ctxMenu.blockOpen && (
              <div className="fixed bg-white rounded-xl shadow-2xl border border-stone-200 p-2 z-[10000]"
                style={{ minWidth: 220, top: ctxMenu.y, left: ctxMenu.x + 200 }}
                onMouseDown={e => e.stopPropagation()}>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2 pb-1.5">Choose Block Type</div>
                <button onMouseDown={e => { e.preventDefault(); insertBorderBlock(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-indigo-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0"><img src={quoteIcon} alt="quote" className="w-6 h-6" /></span>
                  <div className="text-[11px] font-semibold text-stone-700 group-hover:text-indigo-700">Quote Block</div>
                </button>
                <button onMouseDown={e => {
                  e.preventDefault();
                  if (calloutPickerPos) { setCalloutPickerPos(null); return; }
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setCalloutPickerPos({ top: rect.top, left: rect.right + 8 });
                }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-blue-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0"><img src={bulbIcon} alt="callout" className="w-6 h-6" /></span>
                  <div className="flex-1 text-[11px] font-semibold text-stone-700 group-hover:text-blue-700">Callout Block</div>
                  <span className="text-stone-400 text-[10px]">▶</span>
                </button>
                <button onMouseDown={e => { e.preventDefault(); insertStickyNote(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-yellow-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0"><img src={pinIcon} alt="pin" className="w-7 h-7" /></span>
                  <div className="text-[11px] font-semibold text-stone-700 group-hover:text-yellow-700">Sticky Note</div>
                </button>
                <button onMouseDown={e => { e.preventDefault(); insertCardBlock(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-stone-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0"><img src={cardIcon} alt="card" className="w-5 h-5" /></span>
                  <div className="text-[11px] font-semibold text-stone-700 group-hover:text-stone-900">Card</div>
                </button>
                <button onMouseDown={e => { e.preventDefault(); insertNumberedListBlock(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-stone-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0"><img src={numberIcon} alt="numbered" className="w-7 h-7" /></span>
                  <div className="text-[11px] font-semibold text-stone-700">Numbered List</div>
                </button>
                <button onMouseDown={e => { e.preventDefault(); insertTwoColumnBlock(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-slate-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0"><img src={columnIcon} alt="two column" className="w-5 h-5" /></span>
                  <div className="text-[11px] font-semibold text-stone-700">Two Column</div>
                </button>
                <button onMouseDown={e => { e.preventDefault(); insertCodeBlock(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-zinc-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0"><img src={codeIcon} alt="code" className="w-5 h-5" /></span>
                  <div className="text-[11px] font-semibold text-stone-700">Code Block</div>
                </button>
                <button onMouseDown={e => { e.preventDefault(); insertDefinitionBlock(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-amber-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0"><img src={definitionIcon} alt="definition" className="w-5 h-5" /></span>
                  <div className="text-[11px] font-semibold text-stone-700">Definition</div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Callout variant picker */}
      {calloutPickerPos && (
        <div ref={calloutPickerRef} className="fixed z-[10002] bg-white rounded-xl shadow-2xl border border-stone-200 py-1.5 px-1 min-w-[140px]"
          style={{ top: calloutPickerPos.top, left: calloutPickerPos.left }}>
          {[
            { variant: "info"    as const, icon: "ℹ️", label: "Info",    bg: "hover:bg-blue-50",   color: "text-blue-700"   },
            { variant: "warning" as const, icon: "⚠️", label: "Warning", bg: "hover:bg-amber-50",  color: "text-amber-700"  },
            { variant: "success" as const, icon: "✅", label: "Success", bg: "hover:bg-green-50",  color: "text-green-700"  },
            { variant: "error"   as const, icon: "❌", label: "Error",   bg: "hover:bg-red-50",    color: "text-red-700"    },
          ].map(({ variant, icon, label, bg, color }) => (
            <button key={variant} onMouseDown={e => { e.preventDefault(); insertCalloutBlock(variant); setCtxMenu(null); }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg ${bg} transition-colors`}>
              <span className="text-sm">{icon}</span>
              <span className={`text-xs font-semibold ${color}`}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Column type picker popup ── */}
      {colTypePopup && (
        <ColTypePicker
          th={colTypePopup.th}
          rect={colTypePopup.rect}
          onClose={() => setColTypePopup(null)}
          onTypeChange={handleColTypeChange}
          onDeleteCol={() => handleDeleteColFromPicker(colTypePopup.th)}
          onSortAZ={() => handleSortCol(colTypePopup.th, "asc")}
          onSortZA={() => handleSortCol(colTypePopup.th, "desc")}
        />
      )}

      {/* ── Select / Multi cell popup ── */}
      {selectCellPopup && (
        <SelectCellPopup
          td={selectCellPopup.td}
          th={selectCellPopup.th}
          rect={selectCellPopup.rect}
          multi={selectCellPopup.multi}
          onClose={() => setSelectCellPopup(null)}
          onSave={saveContent}
        />
      )}

      {/* ── Priority cell popup ── */}
      {priorityCellPopup && (
        <PriorityCellPopup
          td={priorityCellPopup.td}
          rect={priorityCellPopup.rect}
          onClose={() => setPriorityCellPopup(null)}
          onSave={saveContent}
        />
      )}

      {/* ── Progress cell popup ── */}
      {progressCellPopup && (
        <ProgressCellPopup
          td={progressCellPopup.td}
          rect={progressCellPopup.rect}
          onClose={() => setProgressCellPopup(null)}
          onSave={saveContent}
        />
      )}

      {/* ── Time cell popup ── */}
      {timeCellPopup && (
        <TimeCellPopup
          td={timeCellPopup.td}
          rect={timeCellPopup.rect}
          onClose={() => setTimeCellPopup(null)}
          onSave={saveContent}
        />
      )}

      {/* ── ID cell popup ── */}
      {idCellPopup && (
        <IDCellPopup
          td={idCellPopup.td}
          rect={idCellPopup.rect}
          onClose={() => setIdCellPopup(null)}
          onSave={saveContent}
        />
      )}

      {/* Clear page confirm */}
      {showClearConfirm && (
        <>
          <div className="fixed inset-0 z-[9990] bg-black/30" onClick={() => setShowClearConfirm(false)} />
          <div className="fixed z-[9991] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-stone-200 w-[280px] overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <h3 className="text-sm font-semibold text-stone-800 mb-1">Clear this page?</h3>
              <p className="text-xs text-stone-500">All content on this page will be removed. This cannot be undone.</p>
            </div>
            <div className="flex border-t border-stone-100">
              <button onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors">Cancel</button>
              <div className="w-px bg-stone-100" />
              <button onClick={() => {
                if (editorRef.current) { editorRef.current.innerHTML = ""; lastSaved.current = ""; store.updatePage(bookId, page.id, { content: "" }); onContentChange(page.id, ""); }
                setShowClearConfirm(false);
              }}
                className="flex-1 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors">Clear</button>
            </div>
          </div>
        </>
      )}
      </div>{/* end paper wrapper */}

      {/* ── RIGHT SIDE PANEL ── */}
      <div style={{ width: rightOpen ? 300 : 0, transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ width: 300, minHeight: 1123 }} className="bg-sky-50 border-l-2 border-sky-200 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-sky-200 bg-sky-100/70 sticky top-0 z-10">
            <span className="text-xs font-semibold text-sky-800 flex items-center gap-1.5">📝 Right Note</span>
            <button onClick={() => setRightOpen(false)} className="p-0.5 rounded transition-opacity hover:opacity-70" title="Close right note">
              <img src={arrowCircleLeftCloseIcon} className="w-4 h-4" alt="close" />
            </button>
          </div>
          <textarea
            value={rightNote}
            onChange={e => { const v = e.target.value; setRightNote(v); localStorage.setItem(`nb_sidenote_${bookId}_${page.id}_right`, v); }}
            className="flex-1 p-3 text-sm text-stone-700 bg-transparent resize-none outline-none leading-relaxed"
            placeholder="Side notes…"
            style={{ minHeight: 1080, fontFamily: "Georgia, serif" }}
          />
        </div>
      </div>

    </div>
  );
}

// ── PageEditor ───────────────────────────────────────────────────

export default function PageEditor() {
  const { bookId, pageId } = useParams();
  const [, setLocation] = useLocation();
  const bId = parseInt(bookId || "0", 10);

  const [book, setBook] = useState<Book | null>(() => store.getBook(bId) ?? null);
  const [pages, setPages] = useState<Page[]>(() => store.listPages(bId));
  const [saveStatus, setSaveStatus] = useState<"saved"|"saving">("saved");
  const [zoom, setZoom] = useState(1);
  const savingCountRef = useRef(0);
  const pagesAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = pagesAreaRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      setZoom(z => Math.min(3, Math.max(0.25, parseFloat((z - e.deltaY * 0.001).toFixed(3)))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const refresh = useCallback(() => {
    setBook(store.getBook(bId) ?? null);
    setPages(store.listPages(bId));
  }, [bId]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleContentChange = useCallback((_pageId: number, _html: string) => {
    savingCountRef.current = Math.max(0, savingCountRef.current - 1);
    setSaveStatus(savingCountRef.current > 0 ? "saving" : "saved");
  }, []);

  const handleDelete = useCallback((pageId: number) => {
    store.deletePage(bId, pageId);
    const remaining = store.listPages(bId);
    setPages(remaining);
    if (remaining.length === 0) {
      const newPage = store.createPage(bId, { title: "Page 1", content: "" });
      setPages([newPage]);
    }
  }, [bId]);

  const handleAddPage = () => {
    store.createPage(bId, { title: `Page ${pages.length + 1}`, content: "" });
    setPages(store.listPages(bId));
    setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }, 50);
  };

  if (!book) return <Redirect to="/" />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#5a5a5a" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-10 shrink-0 flex items-center justify-between px-4 py-2 border-b border-black/20" style={{ background: "#4a4a4a" }}>
        <div className="flex items-center gap-2">
          <button onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium">
            <ChevronLeft className="w-4 h-4" />Back
          </button>
          <span className="text-zinc-500 text-sm">·</span>
          <span className="text-zinc-300 text-sm font-medium">{book.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">{saveStatus === "saving" ? "Saving…" : "Saved"}</span>
          <span className="text-xs text-zinc-600">{pages.length} {pages.length === 1 ? "page" : "pages"}</span>
          <button
            onClick={() => setZoom(1)}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors tabular-nums"
            title="Reset zoom (Ctrl+Scroll to zoom)"
          >
            {Math.round(zoom * 100)}%
          </button>
        </div>
      </div>

      {/* All pages stacked */}
      <div ref={pagesAreaRef} className="flex-1 overflow-auto">
        <div
          className="flex flex-col items-center py-10 px-20 gap-8"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          {pages.map((page, idx) => (
            <A4Page key={page.id} page={page} index={idx} bookId={bId}
              onDelete={handleDelete} onContentChange={handleContentChange}
              isSaving={saveStatus === "saving"} />
          ))}
          <div style={{ width: 794 }} className="flex-shrink-0 pb-10">
            <button onClick={handleAddPage}
              className="w-full flex items-center justify-center gap-2 py-5 border-2 border-dashed border-zinc-500 hover:border-zinc-300 text-zinc-500 hover:text-zinc-300 transition-all rounded text-sm font-medium">
              <Plus className="w-4 h-4" />New Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
