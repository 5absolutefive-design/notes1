import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
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
import {
  Plus, ImagePlus, FolderKanban, X,
  Bold, Italic, Underline, Strikethrough, Highlighter,
  CheckSquare, Minus, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  ChevronRight, Link, Mic, PenLine, Eraser, Table, Video,
  Copy, Scissors, Clipboard, Wrench, FileDown, FileUp, ArrowLeftRight, Undo2, Redo2, BarChart2,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ColTypePicker, SelectCellPopup, PriorityCellPopup, ProgressCellPopup,
  applyColType, hydrateTables, makeCellInner, getColType, getColOptions,
  getColIndex, findTh,
  type ColType,
} from "@/components/project-table-types";

// ── Types (exported for use in home.tsx) ─────────────────────────
export interface ProjectDoc {
  id: number;
  parentId?: number;
  title: string;
  content: string;
  emoji?: string;
  bannerImg?: string;
  bannerColor: string;
  bannerGradient?: string;
  createdAt: string;
  updatedAt: string;
}

const EMOJI_LIST = [
  "📁","📂","📝","📌","📍","🗂️","🗃️","📋","📊","📈","📉","🗓️","📅","⭐","🌟",
  "💡","🎯","🚀","✅","🔥","💼","🏆","🎨","🎵","📚","🔬","🌱","💎","🛠️","⚡",
  "🎉","🌈","🦋","🌸","🍀","🦄","🐉","🏔️","🌊","🌙","☀️","🌺","🍁","🎸","🎹",
];

const DEFAULT_EMOJI = "📁";

// ── Storage (exported for use in home.tsx) ───────────────────────
const PROJECTS_KEY = "nb_projects";

export function loadProjects(): ProjectDoc[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveProjects(docs: ProjectDoc[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(docs));
}

export function nextProjectId(docs: ProjectDoc[]) {
  return docs.length === 0 ? 1 : Math.max(...docs.map(d => d.id)) + 1;
}

// ── Banner presets ───────────────────────────────────────────────
export const DEFAULT_PROJECT_GRADIENT = "linear-gradient(135deg,#667eea,#764ba2)";

const BANNER_GRADIENTS = [
  { id: "g1",  value: "linear-gradient(135deg,#667eea,#764ba2)", label: "Purple" },
  { id: "g2",  value: "linear-gradient(135deg,#f093fb,#f5576c)", label: "Pink" },
  { id: "g3",  value: "linear-gradient(135deg,#4facfe,#00f2fe)", label: "Blue" },
  { id: "g4",  value: "linear-gradient(135deg,#43e97b,#38f9d7)", label: "Green" },
  { id: "g5",  value: "linear-gradient(135deg,#fa709a,#fee140)", label: "Sunset" },
  { id: "g6",  value: "linear-gradient(135deg,#a18cd1,#fbc2eb)", label: "Lavender" },
  { id: "g7",  value: "linear-gradient(135deg,#ffecd2,#fcb69f)", label: "Peach" },
  { id: "g8",  value: "linear-gradient(135deg,#2d3748,#4a5568)", label: "Dark" },
  { id: "g9",  value: "linear-gradient(135deg,#f6d365,#fda085)", label: "Orange" },
  { id: "g10", value: "linear-gradient(135deg,#96fbc4,#f9f586)", label: "Spring" },
];

const BANNER_IMAGES = [
  { id: "i1", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80", label: "Mountain" },
  { id: "i2", url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&q=80", label: "Galaxy" },
  { id: "i3", url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80", label: "Abstract" },
  { id: "i4", url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80", label: "Forest" },
  { id: "i5", url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&q=80", label: "Aurora" },
  { id: "i6", url: "https://images.unsplash.com/photo-1490750967868-88df5691cc77?w=1200&q=80", label: "Flowers" },
];

const HIGHLIGHT_COLORS = [
  { label: "Yellow",  color: "#fef08a" },
  { label: "Green",   color: "#bbf7d0" },
  { label: "Blue",    color: "#bfdbfe" },
  { label: "Pink",    color: "#fecdd3" },
  { label: "Orange",  color: "#fed7aa" },
  { label: "Purple",  color: "#e9d5ff" },
];

const FONT_COLORS = [
  { label: "Black",   color: "#000000" },
  { label: "Gray",    color: "#6b7280" },
  { label: "Red",     color: "#ef4444" },
  { label: "Orange",  color: "#f97316" },
  { label: "Yellow",  color: "#eab308" },
  { label: "Green",   color: "#22c55e" },
  { label: "Blue",    color: "#3b82f6" },
  { label: "Indigo",  color: "#6366f1" },
  { label: "Purple",  color: "#a855f7" },
  { label: "Pink",    color: "#ec4899" },
];

const FONTS_CTX = [
  "Inter", "Arial", "Arial Black", "Georgia", "Times New Roman",
  "Verdana", "Trebuchet MS", "Courier New", "Comic Sans MS",
  "Roboto", "Lato", "Poppins", "Nunito", "Merriweather",
  "Myriad Pro", "Poppins Light", "Impact", "Palatino",
];

interface ContextMenuState {
  x: number;
  y: number;
  formatOpen: boolean;
  alignOpen: boolean;
  bulletOpen: boolean;
  highlightOpen: boolean;
  fontColorOpen: boolean;
  headingOpen: boolean;
  dividerOpen: boolean;
  linkOpen: boolean;
  todoOpen: boolean;
  todoCount: number;
  todoRemoveCount: number;
  drawOpen: boolean;
  graphOpen: boolean;
  tableOpen: boolean;
  fontOpen: boolean;
  blockOpen: boolean;
  mediaOpen: boolean;
}

interface ImageBlock {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  locked: boolean;
}

type GraphType = "bar" | "line" | "pie" | "area";
interface GraphBlock {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: GraphType;
  title: string;
  color: string;
  data: { label: string; value: number }[];
}

type DrawTool = "arrow" | "line" | "rect" | "circle" | "triangle" | "dashed" | "vline" | "arc" | "eraser";

interface ArrowShape {
  id: string;
  type?: DrawTool;
  x1: number; y1: number;
  x2: number; y2: number;
  color: string;
}

// ── Draw tool constants ───────────────────────────────────────────
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
  { key: "pentagon",  icon: "⬠",  label: "Pentagon"  },
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

// ── Eraser geometry helpers ───────────────────────────────────────
function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1, dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function shapeIntersectsCircle(shape: ArrowShape, cx: number, cy: number, r: number): boolean {
  const { x1, y1, x2, y2, type = "arrow" } = shape;
  if (type === "vline") return distToSegment(cx, cy, x1, y1, x1, y2) <= r;
  if (["arrow", "line", "dashed"].includes(type)) return distToSegment(cx, cy, x1, y1, x2, y2) <= r;
  const minX = Math.min(x1, x2) - r, maxX = Math.max(x1, x2) + r;
  const minY = Math.min(y1, y2) - r, maxY = Math.max(y1, y2) + r;
  return cx >= minX && cx <= maxX && cy >= minY && cy <= maxY;
}

// ── Props ────────────────────────────────────────────────────────
interface ProjectViewProps {
  projects: ProjectDoc[];
  setProjects: React.Dispatch<React.SetStateAction<ProjectDoc[]>>;
  activeId: number | null;
  setActiveId: (id: number | null) => void;
  onNewProject: () => void;
  focusTitleSignal?: number;
}

// ── Main component ───────────────────────────────────────────────
export default function ProjectView({ projects, setProjects, activeId, setActiveId, onNewProject, focusTitleSignal }: ProjectViewProps) {
  const [calloutPickerPos, setCalloutPickerPos] = useState<{ top: number; left: number } | null>(null);
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
  const [ctxTableHover, setCtxTableHover] = useState<{ r: number; c: number } | null>(null);
  const [ctxTableCustomRows, setCtxTableCustomRows] = useState("");
  const [ctxTableCustomCols, setCtxTableCustomCols] = useState("");
  const tableItemRef = useRef<HTMLDivElement>(null);
  const tableSubCardRef = useRef<HTMLDivElement>(null);
  const [ctxFontSearch, setCtxFontSearch] = useState("");
  const [ctxFontSize, setCtxFontSize] = useState(16);
  const [ctxSelectedFont, setCtxSelectedFont] = useState<string | null>("Inter");
  const [ctxFontSizeMode, setCtxFontSizeMode] = useState<"all" | "selected">("selected");
  const fontItemRef = useRef<HTMLDivElement>(null);
  const fontSubCardRef = useRef<HTMLDivElement>(null);
  // Independent floating font panel (detached from context menu)
  const [fontPanelOpen, setFontPanelOpen] = useState(false);
  const [fontPanelPos, setFontPanelPos] = useState({ x: 0, y: 0 });
  const fontPanelRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);
  const bannerPickerRef = useRef<HTMLDivElement>(null);
  const calloutPickerRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const bannerUploadRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const transferUploadRef = useRef<HTMLInputElement>(null);
  const [showTransferCard, setShowTransferCard] = useState(false);
  const [lastTodoPos, setLastTodoPos] = useState<{ top: number; left: number } | null>(null);
  const [showTodoButtons, setShowTodoButtons] = useState(false);
  const [tableToolbar, setTableToolbar] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [showTableBtns, setShowTableBtns] = useState(false);
  const [hoverTableBtns, setHoverTableBtns] = useState(false);
  const [tableLinesHidden, setTableLinesHidden] = useState(false);
  const activeTableRef = useRef<HTMLTableElement | null>(null);
  const activeEditRef = useRef<{ td: HTMLElement; finish: () => void } | null>(null);
  const tableResizeObserverRef = useRef<ResizeObserver | null>(null);
  const [imageBlocks, setImageBlocks] = useState<ImageBlock[]>([]);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [graphBlocks, setGraphBlocks] = useState<GraphBlock[]>([]);
  const [graphEditor, setGraphEditor] = useState<{ id: string; data: { label: string; value: number }[]; title: string; type: GraphType; color: string } | null>(null);
  const graphDragRef = useRef<{ id: string; startMx: number; startMy: number; startBx: number; startBy: number } | null>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ id: string; startMx: number; startMy: number; startBx: number; startBy: number } | null>(null);
  const resizeRef = useRef<{ id: string; startMx: number; startW: number; startBx: number; side: "br" | "bl" | "tr" | "tl" } | null>(null);

  // ── Column type popups ────────────────────────────────────────
  const [colTypePopup, setColTypePopup] = useState<{ th: HTMLElement; rect: DOMRect } | null>(null);
  const [selectCellPopup, setSelectCellPopup] = useState<{ td: HTMLElement; th: HTMLElement; rect: DOMRect; multi: boolean } | null>(null);
  const [priorityCellPopup, setPriorityCellPopup] = useState<{ td: HTMLElement; rect: DOMRect } | null>(null);
  const [progressCellPopup, setProgressCellPopup] = useState<{ td: HTMLElement; rect: DOMRect } | null>(null);

  const [selPopup, setSelPopup] = useState<{ x: number; y: number } | null>(null);
  const selPopupRef = useRef<HTMLDivElement>(null);

  const [drawTool, setDrawTool] = useState<DrawTool | null>(null);
  const drawToolRef = useRef<DrawTool | null>(null);
  const [eraserPos, setEraserPos] = useState<{ x: number; y: number } | null>(null);
  const ERASER_RADIUS = 17;
  const [arrows, setArrows] = useState<ArrowShape[]>([]);
  const [drawingArrow, setDrawingArrow] = useState<ArrowShape | null>(null);
  const arrowDrawRef = useRef<{ startX: number; startY: number; type: DrawTool } | null>(null);

  // ── Universal undo/redo history
  const arrowsRef = useRef<ArrowShape[]>([]);
  const imageBlocksRef = useRef<ImageBlock[]>([]);
  type HistorySnap = { html: string; arrows: ArrowShape[]; imageBlocks: ImageBlock[] };
  const historyRef = useRef<HistorySnap[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const isRestoringRef = useRef(false);
  const pushHistoryRef = useRef<(opts?: Partial<HistorySnap>) => void>(() => {});

  const activeProject = projects.find(p => p.id === activeId) ?? null;

  // ── Load / save image blocks per project
  useEffect(() => {
    if (!activeId) { setImageBlocks([]); return; }
    try {
      const raw = localStorage.getItem(`nb_project_imgs_${activeId}`);
      setImageBlocks(raw ? JSON.parse(raw) : []);
    } catch { setImageBlocks([]); }
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    localStorage.setItem(`nb_project_imgs_${activeId}`, JSON.stringify(imageBlocks));
  }, [imageBlocks, activeId]);

  // ── Sync drawToolRef
  useEffect(() => { drawToolRef.current = drawTool; }, [drawTool]);

  // ── Load / save arrows per project
  useEffect(() => {
    if (!activeId) { setArrows([]); setDrawTool(null); return; }
    try {
      const raw = localStorage.getItem(`nb_project_arrows_${activeId}`);
      setArrows(raw ? JSON.parse(raw) : []);
    } catch { setArrows([]); }
    setDrawTool(null);
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    localStorage.setItem(`nb_project_arrows_${activeId}`, JSON.stringify(arrows));
  }, [arrows, activeId]);

  // ── Load / save graph blocks per project
  useEffect(() => {
    if (!activeId) { setGraphBlocks([]); return; }
    try {
      const raw = localStorage.getItem(`nb_project_graphs_${activeId}`);
      setGraphBlocks(raw ? JSON.parse(raw) : []);
    } catch { setGraphBlocks([]); }
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    localStorage.setItem(`nb_project_graphs_${activeId}`, JSON.stringify(graphBlocks));
  }, [graphBlocks, activeId]);

  // ── Keep refs in sync with latest state (for use inside stale closures)
  useEffect(() => { arrowsRef.current = arrows; }, [arrows]);
  useEffect(() => { imageBlocksRef.current = imageBlocks; }, [imageBlocks]);

  // ── Escape key exits draw mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setDrawTool(null); setDrawingArrow(null); arrowDrawRef.current = null; } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Document-level drag and resize handlers for image blocks
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (graphDragRef.current) {
        const { id, startMx, startMy, startBx, startBy } = graphDragRef.current;
        setGraphBlocks(prev => prev.map(g => g.id === id
          ? { ...g, x: startBx + e.clientX - startMx, y: startBy + e.clientY - startMy }
          : g));
      }
      if (dragRef.current) {
        const { id, startMx, startMy, startBx, startBy } = dragRef.current;
        setImageBlocks(prev => prev.map(b => b.id === id
          ? { ...b, x: startBx + e.clientX - startMx, y: startBy + e.clientY - startMy }
          : b));
      }
      if (resizeRef.current) {
        const { id, startMx, startW, startBx, side } = resizeRef.current;
        if (side === "bl" || side === "tl") {
          // Left handle: right edge stays fixed, left edge + x moves
          const delta = startMx - e.clientX; // drag left = positive = grow
          const newW = Math.max(80, startW + delta);
          const safeBx = isNaN(startBx) ? 0 : startBx;
          const rightEdge = safeBx + startW;
          const newX = rightEdge - newW;
          setImageBlocks(prev => prev.map(b => b.id === id ? { ...b, width: newW, x: newX } : b));
        } else {
          // Right handle: left edge stays fixed, right edge moves
          const delta = e.clientX - startMx; // drag right = positive = grow
          const newW = Math.max(80, startW + delta);
          setImageBlocks(prev => prev.map(b => b.id === id ? { ...b, width: newW } : b));
        }
      }
      if (arrowDrawRef.current) {
        const container = scrollContainerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const x2 = e.clientX - rect.left;
        const y2 = e.clientY - rect.top + container.scrollTop;
        setDrawingArrow(prev => prev ? { ...prev, x2, y2 } : null);
      }
    };
    const onUp = (e: MouseEvent) => {
      dragRef.current = null;
      resizeRef.current = null;
      if (arrowDrawRef.current) {
        const container = scrollContainerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const x2 = e.clientX - rect.left;
          const y2 = e.clientY - rect.top + container.scrollTop;
          const { startX, startY, type } = arrowDrawRef.current;
          const dist = Math.sqrt((x2 - startX) ** 2 + (y2 - startY) ** 2);
          if (dist > 8) {
            const shape: ArrowShape = { id: crypto.randomUUID(), type, x1: startX, y1: startY, x2, y2, color: "#ef4444" };
            const newArrows = [...arrowsRef.current, shape];
            setArrows(newArrows);
            pushHistoryRef.current({ arrows: newArrows });
          }
        }
        arrowDrawRef.current = null;
        setDrawingArrow(null);
      }
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  // ── Load content into editor + title when switching projects
  useEffect(() => {
    if (editorRef.current) {
      // Strip any legacy inline onclick from old remove buttons (now handled by event delegation)
      const sanitized = (activeProject?.content || "")
        .replace(/ onclick="[^"]*this\.closest[^"]*"/g, "");
      editorRef.current.innerHTML = sanitized;
      // Ensure all remove buttons have the data attr so event delegation catches them
      editorRef.current.querySelectorAll('[data-quote-block] button,[data-link-block] button').forEach(btn => {
        btn.setAttribute("data-remove-btn", "1");
        (btn as HTMLElement).removeAttribute("onclick");
      });
      // Restore saved base font size for this project
      const savedFs = activeId ? localStorage.getItem(`nb_proj_fs_${activeId}`) : null;
      const fsNum = savedFs ? parseInt(savedFs, 10) : null;
      if (fsNum && !isNaN(fsNum)) {
        editorRef.current.style.fontSize = `${fsNum}px`;
        setCtxFontSize(fsNum);
      } else {
        editorRef.current.style.fontSize = "";
      }
      // Hydrate typed table cells
      hydrateTables(editorRef.current);
    }
    if (titleRef.current)
      titleRef.current.textContent = activeProject?.title || "";
  }, [activeId]);

  // ── Auto-focus title and select all when a new project is created
  useEffect(() => {
    if (!focusTitleSignal || !titleRef.current) return;
    const el = titleRef.current;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [focusTitleSignal]);

  // ── Save content (debounced)
  const saveContent = useCallback(() => {
    if (!editorRef.current || !activeId) return;
    const content = editorRef.current.innerHTML;
    setProjects(prev => {
      const updated = prev.map(p =>
        p.id === activeId ? { ...p, content, updatedAt: new Date().toISOString() } : p
      );
      saveProjects(updated);
      return updated;
    });
    pushHistoryRef.current({ html: content });
  }, [activeId, setProjects]);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveContent, 600);
  }, [saveContent]);

  // ── Universal history push (call after any meaningful state change)
  const pushHistory = useCallback((opts?: { html?: string; arrows?: ArrowShape[]; imageBlocks?: ImageBlock[] }) => {
    if (isRestoringRef.current) return;
    const html = opts?.html ?? editorRef.current?.innerHTML ?? "";
    const arrs = opts?.arrows ?? arrowsRef.current;
    const imgs = opts?.imageBlocks ?? imageBlocksRef.current;
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push({ html, arrows: [...arrs], imageBlocks: [...imgs] });
    if (historyRef.current.length > 60) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);
  useEffect(() => { pushHistoryRef.current = pushHistory; }, [pushHistory]);

  const universalUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const snap = historyRef.current[historyIndexRef.current];
    if (!snap) return;
    isRestoringRef.current = true;
    if (editorRef.current) editorRef.current.innerHTML = snap.html;
    setArrows(snap.arrows);
    setImageBlocks(snap.imageBlocks);
    isRestoringRef.current = false;
    if (activeId) {
      setProjects(prev => {
        const updated = prev.map(p => p.id === activeId ? { ...p, content: snap.html, updatedAt: new Date().toISOString() } : p);
        saveProjects(updated);
        return updated;
      });
    }
  }, [activeId, setProjects]);

  const universalRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const snap = historyRef.current[historyIndexRef.current];
    if (!snap) return;
    isRestoringRef.current = true;
    if (editorRef.current) editorRef.current.innerHTML = snap.html;
    setArrows(snap.arrows);
    setImageBlocks(snap.imageBlocks);
    isRestoringRef.current = false;
    if (activeId) {
      setProjects(prev => {
        const updated = prev.map(p => p.id === activeId ? { ...p, content: snap.html, updatedAt: new Date().toISOString() } : p);
        saveProjects(updated);
        return updated;
      });
    }
  }, [activeId, setProjects]);

  // ── Listen for date input changes inside typed table cells ────
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const handler = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName === "INPUT" && target.type === "date") {
        const td = target.closest("td") as HTMLElement | null;
        if (!td) return;
        td.dataset.cellVal = target.value;
        debouncedSave();
      }
    };
    editor.addEventListener("change", handler);
    return () => editor.removeEventListener("change", handler);
  }, [debouncedSave]);

  // ── Close menus on outside click
  // Use refs to avoid stale closures and unnecessary re-registrations
  const ctxMenuStateRef = useRef(ctxMenu);
  ctxMenuStateRef.current = ctxMenu;
  const showBannerPickerRef = useRef(showBannerPicker);
  showBannerPickerRef.current = showBannerPicker;
  const calloutPickerPosRef = useRef(calloutPickerPos);
  calloutPickerPosRef.current = calloutPickerPos;
  const showEmojiPickerRef = useRef(showEmojiPicker);
  showEmojiPickerRef.current = showEmojiPicker;
  const fontPanelOpenRef = useRef(fontPanelOpen);
  fontPanelOpenRef.current = fontPanelOpen;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ctxMenuStateRef.current && ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node))
        setCtxMenu(null);
      if (showBannerPickerRef.current && bannerPickerRef.current && !bannerPickerRef.current.contains(e.target as Node))
        setShowBannerPicker(false);
      if (showEmojiPickerRef.current && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node))
        setShowEmojiPicker(false);
      if (fontPanelOpenRef.current && fontPanelRef.current && !fontPanelRef.current.contains(e.target as Node)
          && editorRef.current && !editorRef.current.contains(e.target as Node))
        setFontPanelOpen(false);
      if (calloutPickerPosRef.current && calloutPickerRef.current && !calloutPickerRef.current.contains(e.target as Node))
        setCalloutPickerPos(null);
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, []);

  // ── Set emoji
  const setEmoji = (emoji: string) => {
    if (!activeId) return;
    const updated = projects.map(p =>
      p.id === activeId ? { ...p, emoji, updatedAt: new Date().toISOString() } : p
    );
    saveProjects(updated);
    setProjects(updated);
    setShowEmojiPicker(false);
  };

  // ── Track position of last todo item for inline +/- buttons
  const updateLastTodoPos = useCallback(() => {
    const editor = editorRef.current;
    const container = scrollContainerRef.current;
    if (!editor || !container) { setLastTodoPos(null); return; }
    const todos = editor.querySelectorAll('[data-todo-item="1"]');
    if (todos.length === 0) { setLastTodoPos(null); return; }
    const lastTodo = todos[todos.length - 1] as HTMLElement;
    const todoRect = lastTodo.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setLastTodoPos({
      top: todoRect.top - containerRect.top + container.scrollTop + (todoRect.height / 2),
      left: todoRect.left - containerRect.left,
    });
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const observer = new MutationObserver(updateLastTodoPos);
    observer.observe(editor, { childList: true, subtree: true, characterData: true });
    updateLastTodoPos();
    return () => observer.disconnect();
  }, [updateLastTodoPos, activeId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", updateLastTodoPos);
    return () => container.removeEventListener("scroll", updateLastTodoPos);
  }, [updateLastTodoPos]);

  // ── Table toolbar position tracker ───────────────────────────────
  const updateTableToolbar = useCallback(() => {
    const table = activeTableRef.current;
    const container = scrollContainerRef.current;
    if (!table || !container) { setTableToolbar(null); return; }
    const tr = table.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    setTableToolbar({
      top: tr.top - cr.top + container.scrollTop,
      left: tr.left - cr.left,
      width: tr.width,
      height: tr.height,
    });
    // Attach ResizeObserver so buttons reposition on column/row resize
    if (tableResizeObserverRef.current) tableResizeObserverRef.current.disconnect();
    const obs = new ResizeObserver(() => {
      const t = activeTableRef.current;
      const c = scrollContainerRef.current;
      if (!t || !c) return;
      const tr2 = t.getBoundingClientRect();
      const cr2 = c.getBoundingClientRect();
      setTableToolbar({ top: tr2.top - cr2.top + c.scrollTop, left: tr2.left - cr2.left, width: tr2.width, height: tr2.height });
    });
    obs.observe(table);
    tableResizeObserverRef.current = obs;
  }, []);

  // ── Table border drag-to-resize ──────────────────────────────────
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const THRESHOLD = 6; // px from border edge to trigger resize

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
      const nearRight  = Math.abs(e.clientX - r.right)  <= THRESHOLD;
      const nearBottom = Math.abs(e.clientY - r.bottom) <= THRESHOLD;
      if (nearRight)  return "col";
      if (nearBottom) return "row";
      return null;
    }

    function onMouseMove(e: MouseEvent) {
      // During active resize
      if (colState) {
        const dx = e.clientX - colState.startX;
        const table = colState.table;
        for (let i = 0; i < table.rows.length; i++) {
          const cell = table.rows[i].cells[colState.colIdx];
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
      // Hover: change cursor
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
      e.preventDefault();
      e.stopPropagation();
      document.body.style.userSelect = "none";

      if (edge === "col") {
        const table = cell.closest("table") as HTMLTableElement;
        const cells = Array.from(cell.parentElement!.children) as HTMLTableCellElement[];
        const colIdx = cells.indexOf(cell);

        // Freeze all column widths explicitly, then free the table from 100% width
        // so every column (including the last) can be freely resized
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
        colState = null;
        rowState = null;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        (editor as HTMLElement).style.cursor = "";
        // Trigger save after resize
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
  }, [activeId, saveContent]);

  // ── Insert a new todo immediately after the last existing todo item (for inline + button)
  const appendTodoAtEnd = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
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
    setTimeout(updateLastTodoPos, 30);
  }, [saveContent, updateLastTodoPos]);

  // ── Save selection range on right-click so it can be restored before formatting
  const savedRangeRef = useRef<Range | null>(null);

  const restoreSelection = () => {
    if (!savedRangeRef.current) return;
    editorRef.current?.focus({ preventScroll: true });
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  // ── Paste handler — strips background-color and color from external content
  const handleEditorPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    if (html) {
      const div = document.createElement("div");
      div.innerHTML = html;
      div.querySelectorAll<HTMLElement>("*").forEach(el => {
        el.style.removeProperty("background-color");
        el.style.removeProperty("background");
        el.style.removeProperty("color");
        // also remove via attribute if set directly
        if (el.style.length === 0) el.removeAttribute("style");
      });
      document.execCommand("insertHTML", false, div.innerHTML);
    } else {
      const text = e.clipboardData.getData("text/plain");
      document.execCommand("insertText", false, text);
    }
  };

  // ── Right-click handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const sel = window.getSelection();
    savedRangeRef.current = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
    let menuX = e.clientX;
    let menuY = e.clientY;
    if (savedRangeRef.current) {
      const rect = savedRangeRef.current.getBoundingClientRect();
      if (rect && rect.width > 0) {
        menuY = rect.bottom + 8;
        menuX = e.clientX;
      }
    }
    setCtxMenu({ x: menuX, y: menuY, formatOpen: false, alignOpen: false, bulletOpen: false, highlightOpen: false, fontColorOpen: false, headingOpen: false, dividerOpen: false, linkOpen: false, todoOpen: false, todoCount: 1, todoRemoveCount: 1, drawOpen: false, graphOpen: false, tableOpen: false, fontOpen: false, blockOpen: false, mediaOpen: false });
    if (savedRangeRef.current) {
      setTimeout(() => restoreSelection(), 0);
    }
  };

  // ── Clamp font sub-card inside viewport using fixed positioning
  useLayoutEffect(() => {
    if (!ctxMenu?.fontOpen || !fontSubCardRef.current || !fontItemRef.current) return;
    const anchor = fontItemRef.current.getBoundingClientRect();
    const card = fontSubCardRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    let left = anchor.right + 4;
    if (left + card.width > vw - 8) left = anchor.left - card.width - 4;
    let top = anchor.bottom - card.height;
    top = Math.max(8, Math.min(top, vh - card.height - 8));
    left = Math.max(8, Math.min(left, vw - card.width - 8));
    fontSubCardRef.current.style.top = `${top}px`;
    fontSubCardRef.current.style.left = `${left}px`;
  }, [ctxMenu?.fontOpen]);

  // ── Clamp table sub-card inside viewport using fixed positioning
  useLayoutEffect(() => {
    if (!ctxMenu?.tableOpen || !tableSubCardRef.current || !tableItemRef.current) return;
    const anchor = tableItemRef.current.getBoundingClientRect();
    const card = tableSubCardRef.current.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    // Prefer right of context menu; fall back to left if no space
    let left = anchor.right + 4;
    if (left + card.width > vw - 8) left = anchor.left - card.width - 4;
    // Align bottom of card with bottom of anchor row; clamp so it stays on screen
    let top = anchor.bottom - card.height;
    top = Math.max(8, Math.min(top, vh - card.height - 8));
    left = Math.max(8, Math.min(left, vw - card.width - 8));
    tableSubCardRef.current.style.top = `${top}px`;
    tableSubCardRef.current.style.left = `${left}px`;
  }, [ctxMenu?.tableOpen]);

  // ── Clamp context menu inside viewport after it renders
  useLayoutEffect(() => {
    if (!ctxMenu || !ctxMenuRef.current) return;
    const rect = ctxMenuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const newX = rect.right > vw ? Math.max(0, vw - rect.width - 8) : ctxMenu.x;
    const newY = rect.bottom > vh ? Math.max(0, vh - rect.height - 8) : ctxMenu.y;
    if (newX !== ctxMenu.x || newY !== ctxMenu.y) {
      setCtxMenu(m => m ? { ...m, x: newX, y: newY } : null);
    }
  }, [ctxMenu?.x, ctxMenu?.y]);

  // ── Formatting commands
  const execFmt = (cmd: string, value?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, value);
    setCtxMenu(null);
    debouncedSave();
  };

  const downloadPdf = async () => {
    setCtxMenu(null);
    const el = pdfContentRef.current;
    if (!el) return;
    const domtoimage = (await import("dom-to-image-more")).default;
    const { jsPDF } = await import("jspdf");
    const scale = 2;
    const dataUrl = await domtoimage.toPng(el, {
      width: el.scrollWidth * scale,
      height: el.scrollHeight * scale,
      style: { transform: `scale(${scale})`, transformOrigin: "top left" },
    });
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const img = new Image();
    img.src = dataUrl;
    await new Promise(res => { img.onload = res; });
    const imgWidth = pageWidth;
    const imgHeight = (img.height * imgWidth) / img.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(dataUrl, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    const title = activeProject?.title || "document";
    pdf.save(`${title}.pdf`);
  };

  const getProjectExtras = (id: number) => ({
    imgs: (() => { try { const r = localStorage.getItem(`nb_project_imgs_${id}`); return r ? JSON.parse(r) : []; } catch { return []; } })(),
    arrows: (() => { try { const r = localStorage.getItem(`nb_project_arrows_${id}`); return r ? JSON.parse(r) : []; } catch { return []; } })(),
    fs: localStorage.getItem(`nb_proj_fs_${id}`) ?? null,
  });

  const downloadProject = () => {
    if (!activeProject) return;
    const allProjects = loadProjects();
    const collectSubs = (parentId: number): ProjectDoc[] => {
      const subs = allProjects.filter(p => p.parentId === parentId);
      return subs.flatMap(p => [p, ...collectSubs(p.id)]);
    };
    const subProjects = collectSubs(activeProject.id);
    const extras: Record<number, ReturnType<typeof getProjectExtras>> = {};
    [activeProject, ...subProjects].forEach(p => { extras[p.id] = getProjectExtras(p.id); });
    const exportData = {
      version: "1.1",
      exportedAt: new Date().toISOString(),
      project: activeProject,
      subProjects,
      extras,
    };
    const blob = new Blob([JSON.stringify(exportData)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeProject.title || "project"}.nbproject`;
    a.click();
    URL.revokeObjectURL(url);
    setShowTransferCard(false);
  };

  const uploadProject = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (!data.project || !data.version) throw new Error("Invalid file");
        const allProjects = loadProjects();
        const maxId = allProjects.reduce((m, p) => Math.max(m, p.id), 0);
        const idMap = new Map<number, number>();
        idMap.set(data.project.id, maxId + 1);
        (data.subProjects || []).forEach((p: ProjectDoc, i: number) => {
          idMap.set(p.id, maxId + 2 + i);
        });
        const ts = new Date().toISOString();
        const newRoot: ProjectDoc = { ...data.project, id: maxId + 1, parentId: undefined, createdAt: ts, updatedAt: ts };
        const newSubs: ProjectDoc[] = (data.subProjects || []).map((p: ProjectDoc, i: number) => ({
          ...p, id: maxId + 2 + i,
          parentId: idMap.get(p.parentId!) ?? (maxId + 1),
          createdAt: ts, updatedAt: ts,
        }));
        // Restore extras (imgs, arrows, fs) with remapped IDs
        const extras = data.extras ?? {};
        idMap.forEach((newId, oldId) => {
          const ex = extras[oldId];
          if (!ex) return;
          if (ex.imgs?.length) localStorage.setItem(`nb_project_imgs_${newId}`, JSON.stringify(ex.imgs));
          if (ex.arrows?.length) localStorage.setItem(`nb_project_arrows_${newId}`, JSON.stringify(ex.arrows));
          if (ex.fs) localStorage.setItem(`nb_proj_fs_${newId}`, ex.fs);
        });
        const updated = [...allProjects, newRoot, ...newSubs];
        saveProjects(updated);
        setProjects(updated);
        setShowTransferCard(false);
      } catch { alert("Invalid .nbproject file. Please upload a valid project file."); }
    };
    reader.readAsText(file);
  };

  const execAllCaps = () => {
    restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { setCtxMenu(null); return; }
    const range = sel.getRangeAt(0);
    const text = range.toString();
    if (!text) { setCtxMenu(null); return; }
    const isAllCaps = text === text.toUpperCase();
    const transformed = isAllCaps ? text.toLowerCase() : text.toUpperCase();
    document.execCommand("insertText", false, transformed);
    setCtxMenu(null);
    debouncedSave();
  };

  const applyCtxFontName = (name: string, fromPanel = false) => {
    if (!fromPanel) restoreSelection();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    if (sel.isCollapsed) {
      // No selection — apply to whole editor
      if (editorRef.current) {
        editorRef.current.style.fontFamily = name;
        debouncedSave();
      }
      return;
    }
    // Use marker trick: wrap with execCommand then replace <font> with <span style>
    document.execCommand("fontName", false, "__FONT_MARKER__");
    const fontEls = editorRef.current?.querySelectorAll('font[face="__FONT_MARKER__"]');
    fontEls?.forEach(el => {
      const span = document.createElement("span");
      span.style.fontFamily = name;
      span.innerHTML = el.innerHTML;
      el.replaceWith(span);
    });
    debouncedSave();
  };

  const applyCtxFontSize = (size: number, fromPanel = false) => {
    setCtxFontSize(size);
    if (ctxFontSizeMode === "all") {
      if (editorRef.current) {
        editorRef.current.style.fontSize = `${size}px`;
        if (activeId) localStorage.setItem(`nb_proj_fs_${activeId}`, String(size));
      }
      debouncedSave();
    } else {
      if (!fromPanel) restoreSelection();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
      document.execCommand("fontSize", false, "7");
      const fontEls = editorRef.current?.querySelectorAll('font[size="7"]');
      fontEls?.forEach(el => {
        const span = document.createElement("span");
        span.style.fontSize = `${size}px`;
        span.innerHTML = el.innerHTML;
        el.replaceWith(span);
      });
      debouncedSave();
    }
  };

  const insertCustomBullet = (type: string) => {
    editorRef.current?.focus();
    if (type === "ordered") {
      document.execCommand("insertOrderedList");
    } else if (type === "disc") {
      document.execCommand("insertUnorderedList");
    } else {
      document.execCommand("insertHTML", false,
        `<ul style="list-style-type: '${type} '; padding-left: 1.5em; margin: 4px 0"><li><br></li></ul>`);
    }
    setCtxMenu(null);
    debouncedSave();
  };

  const insertHTML = (html: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Restore the cursor position saved at right-click time; fall back to editor focus
    if (savedRangeRef.current) {
      restoreSelection();
    } else {
      editor.focus();
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (!editor.contains(range.commonAncestorContainer)) {
        range.selectNodeContents(editor);
        range.collapse(false);
      }
      range.deleteContents();
      const frag = range.createContextualFragment(html);
      range.insertNode(frag);
    } else {
      editor.innerHTML += html;
    }

    // Always move cursor to end of editor so user can type after the inserted block
    const newRange = document.createRange();
    newRange.selectNodeContents(editor);
    newRange.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(newRange);

    setCtxMenu(null);
    debouncedSave();
  };

  const newTodoHTML = () =>
    `<div data-todo-item="1" contenteditable="false" style="display:flex;align-items:center;gap:8px;margin:4px 0;padding:2px 0">` +
    `<span onclick="this.style.background=this.style.background?'':'#22c55e';this.style.borderColor=this.style.borderColor==='#22c55e'?'#9ca3af':'#22c55e';this.innerHTML=this.innerHTML?'':'✓';this.style.color=this.style.color?'':'white'" ` +
    `style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;flex-shrink:0;border:2px solid #9ca3af;border-radius:4px;cursor:pointer;font-size:11px;font-weight:700;user-select:none;transition:all 0.15s"></span>` +
    `<span contenteditable="true" style="outline:none;flex:1;min-width:20px"></span></div>`;

  const insertTodo = () => insertHTML(`<p><br></p>` + newTodoHTML() + `<br/>`);

  const insertMultipleTodos = (count: number) => {
    let html = `<p><br></p>`;
    for (let i = 0; i < count; i++) html += newTodoHTML();
    html += `<br/>`;
    insertHTML(html);
    setCtxMenu(null);
  };

  const removeLastTodos = (count: number) => {
    if (!editorRef.current) return;
    const items = editorRef.current.querySelectorAll('[data-todo-item="1"]');
    const toRemove = Array.from(items).slice(-count);
    toRemove.forEach(el => el.remove());
    saveContent();
    setCtxMenu(null);
  };

  const insertTable = () => insertTableWithSize(4, 4);

  const insertTableWithSize = (numRows: number, numCols: number) => {
    const thStyle = `background:#f9fafb;padding:6px 10px;text-align:left;font-size:12px;font-weight:600;color:#374151;border:1.5px solid #b0b7c3;border-top:none;border-bottom:3px double #b0b7c3;min-width:120px`;
    const tdStyle = `padding:6px 10px;border:1.5px solid #b0b7c3;min-width:120px;font-size:13px;color:#1f2937`;
    const ths = Array.from({ length: numCols }, (_, i) => `<th style="${thStyle}" contenteditable="true">Column ${i + 1}</th>`).join("");
    const tdRow = Array.from({ length: numCols }, () => `<td style="${tdStyle}" contenteditable="true"><br/></td>`).join("");
    const rows = Array.from({ length: numRows }, () => `<tr>${tdRow}</tr>`).join("");
    const tableHtml = `<br/><table style="border-collapse:collapse;width:100%;margin:8px 0;border-left:1.5px solid #b0b7c3"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table><br/>`;
    insertHTML(tableHtml);
    setCtxMenu(null);
    setCtxTableHover(null);
    setCtxTableCustomRows("");
    setCtxTableCustomCols("");
  };

  const insertLined = () => {
    const thStyle = `background:#f5f5f3;padding:8px 12px;text-align:left;font-size:13px;font-weight:600;color:#374151;border:none;border-bottom:2px solid #b0b7c3;width:100%;display:block`;
    const tdStyle = `padding:7px 12px;border:none;border-bottom:1px solid #e2e0db;width:100%;display:block;font-size:13px;color:#1f2937;min-height:32px`;
    const th = `<th style="${thStyle}" contenteditable="true">Header</th>`;
    const tds = [1,2,3].map(() => `<tr><td style="${tdStyle}" contenteditable="true"><br/></td></tr>`).join("");
    const html = `<br/><table data-lined="true" style="border-collapse:collapse;width:100%;margin:8px 0;border:1.5px solid #b0b7c3;border-radius:6px;overflow:hidden"><thead><tr>${th}</tr></thead><tbody>${tds}</tbody></table><br/>`;
    insertHTML(html);
    setCtxMenu(null);
  };

  const GRAPH_COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899"];
  const insertGraph = (type: GraphType) => {
    const id = `g_${Date.now()}`;
    const newGraph: GraphBlock = {
      id, type,
      x: 60, y: 300,
      width: 380, height: 240,
      title: "My Chart",
      color: GRAPH_COLORS[0],
      data: [
        { label: "Jan", value: 40 },
        { label: "Feb", value: 70 },
        { label: "Mar", value: 55 },
        { label: "Apr", value: 90 },
        { label: "May", value: 65 },
      ],
    };
    setGraphBlocks(prev => [...prev, newGraph]);
    setCtxMenu(null);
  };

  const TH_STYLE = `background:#f9fafb;padding:6px 10px;text-align:left;font-size:12px;font-weight:600;color:#374151;border:1.5px solid #b0b7c3;border-top:none;border-bottom:3px double #b0b7c3;min-width:120px`;
  const TD_STYLE = `padding:6px 10px;border:1.5px solid #b0b7c3;min-width:120px;font-size:13px;color:#1f2937`;

  const tableAddRow = () => {
    const table = activeTableRef.current; if (!table) return;
    const tbody = table.querySelector("tbody"); if (!tbody) return;
    const isLined = table.dataset.lined === "true";
    const colCount = table.rows[0]?.cells.length ?? 4;
    const tr = document.createElement("tr");
    const linedTdStyle = `padding:7px 12px;border:none;border-bottom:1px solid #e2e0db;width:100%;display:block;font-size:13px;color:#1f2937;min-height:32px`;
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement("td");
      td.setAttribute("style", isLined ? linedTdStyle : TD_STYLE);
      td.setAttribute("contenteditable", "true"); td.innerHTML = "<br/>";
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
        if (orig !== undefined) {
          el.setAttribute("style", orig);
          delete el.dataset.originalStyle;
        } else {
          el.setAttribute("style", el.tagName === "TH" ? TH_STYLE : TD_STYLE);
        }
      });
      table.dataset.linesHidden = "false";
      setTableLinesHidden(false);
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
      table.dataset.linesHidden = "true";
      setTableLinesHidden(true);
    }
    saveContent();
  };

  const tableDeleteTable = () => {
    const table = activeTableRef.current; if (!table) return;
    const parent = table.parentElement;
    if (parent) {
      const br = document.createElement("br");
      parent.replaceChild(br, table);
    }
    activeTableRef.current = null;
    setTableToolbar(null);
    setTableLinesHidden(false);
    if (tableResizeObserverRef.current) { tableResizeObserverRef.current.disconnect(); tableResizeObserverRef.current = null; }
    saveContent();
  };

  // ── Column type helpers ───────────────────────────────────────
  const handleColTypeChange = (th: HTMLElement, type: ColType) => {
    applyColType(th, type, undefined, saveContent);
    setColTypePopup(null);
  };

  const handleSortCol = (th: HTMLElement, dir: "asc" | "desc") => {
    const table = th.closest("table");
    if (!table) return;
    const idx = getColIndex(th);
    const tbody = table.querySelector("tbody");
    if (!tbody) return;
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
    const table = th.closest("table");
    if (!table) return;
    const idx = getColIndex(th);
    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      if (row.cells.length > 1) row.removeChild(row.cells[idx]);
    }
    saveContent();
    updateTableToolbar();
  };

  const insertDividerStyle = (style: string) => {
    const styles: Record<string, string> = {
      single:  `border:none;border-top:1.5px solid #d6d3d1;margin:12px 0`,
      bold:    `border:none;border-top:4px solid #78716c;margin:12px 0`,
      thin:    `border:none;border-top:0.5px solid #e7e5e4;margin:12px 0`,
      double:  `border:none;border-top:3px double #a8a29e;margin:12px 0`,
      dashed:  `border:none;border-top:2px dashed #a8a29e;margin:12px 0`,
      dotted:  `border:none;border-top:2px dotted #a8a29e;margin:12px 0`,
    };
    insertHTML(`<br/><hr style="${styles[style] ?? styles.single}"/><br/>`);
    setCtxMenu(null);
  };

  // ── Image block helpers
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
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const src = await compressImage(file);
      const scrollTop = scrollContainerRef.current?.scrollTop ?? 0;
      const containerW = scrollContainerRef.current?.clientWidth ?? 700;
      const blockW = Math.min(375, containerW - 96);
      const id = `img_${Date.now()}`;
      const newBlock = { id, src, locked: false, width: blockW, x: (containerW - blockW) / 2, y: scrollTop + 120 };
      const newBlocks = [...imageBlocksRef.current, newBlock];
      setImageBlocks(newBlocks);
      pushHistory({ imageBlocks: newBlocks });
    } catch { /* ignore */ }
  };

  const handleVoiceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const name = file.name;
      insertHTML(
        `<div contenteditable="false" data-voice-block="1" ` +
        `style="position:relative;display:flex;align-items:center;gap:12px;border-left:4px solid #8b5cf6;background:#f5f3ff;padding:12px 40px 12px 16px;border-radius:0 10px 10px 0;margin:8px 0">` +
        removeBtn() +
        `<span style="font-size:20px;flex-shrink:0">🎙️</span>` +
        `<div style="flex:1;min-width:0">` +
        `<div style="font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>` +
        `<audio controls src="${src}" style="width:100%;height:32px;outline:none;border-radius:6px"></audio>` +
        `</div></div><br/>`
      );
    };
    reader.readAsDataURL(file);
  };

  const removeBtn = () =>
    `<button data-remove-btn="1" contenteditable="false" ` +
    `style="position:absolute;top:5px;right:6px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.08);border:none;cursor:pointer;font-size:14px;color:#777;line-height:1;padding:0;display:inline-flex;align-items:center;justify-content:center;z-index:10;flex-shrink:0" ` +
    `title="Remove">&#215;</button>`;

  // ── MouseDown on editor: intercept th + typed td clicks ─────────
  const handleEditorMouseDown = (e: React.MouseEvent) => {
    if (drawTool) return;
    const target = e.target as HTMLElement;

    // Sticky note drag handle
    if ((target as HTMLElement).closest('[data-drag-btn]')) {
      e.preventDefault();
      e.stopPropagation();
      const note = (target as HTMLElement).closest('[data-sticky-note]') as HTMLElement | null;
      const editor = editorRef.current;
      if (!note || !editor) return;

      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      let dragging = false;
      let startLeft = 0;
      let startTop = 0;

      const onMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startMouseX;
        const dy = ev.clientY - startMouseY;
        // Only start converting to absolute after mouse moves 4px (threshold)
        if (!dragging && Math.sqrt(dx * dx + dy * dy) < 4) return;
        if (!dragging) {
          dragging = true;
          if (note.style.position !== 'absolute') {
            const noteRect = note.getBoundingClientRect();
            const editorRect = editor.getBoundingClientRect();
            note.style.position = 'absolute';
            note.style.left = `${noteRect.left - editorRect.left}px`;
            note.style.top = `${noteRect.top - editorRect.top}px`;
            note.style.margin = '0';
            note.style.display = 'inline-block';
          }
          startLeft = parseFloat(note.style.left) || 0;
          startTop = parseFloat(note.style.top) || 0;
          note.style.cursor = 'grabbing';
          note.style.zIndex = '100';
        }
        note.style.left = `${startLeft + ev.clientX - startMouseX}px`;
        note.style.top = `${Math.max(0, startTop + ev.clientY - startMouseY)}px`;
      };
      const onUp = () => {
        note.style.cursor = '';
        if (dragging) {
          note.style.zIndex = '';
          debouncedSave();
        }
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
          // If already editing this cell, let browser handle normally (allows text select/copy)
          if (td.dataset.editing === "1") return;
          e.preventDefault();
          setColTypePopup(null);
          setSelectCellPopup(null);
          setPriorityCellPopup(null);
          setProgressCellPopup(null);
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

  const startDirectEdit = useCallback((td: HTMLElement, th: HTMLElement, type: ColType) => {
    // Finish any currently-active edit first (blur won't fire if e.preventDefault was used)
    if (activeEditRef.current && activeEditRef.current.td !== td) {
      activeEditRef.current.finish();
      activeEditRef.current = null;
    }
    if (td.dataset.editing === "1") return;
    td.dataset.editing = "1";
    const rawVal = td.dataset.cellVal || "";
    td.contentEditable = "true";
    td.textContent = rawVal;
    td.focus();
    // Place cursor at end of content
    const sel = window.getSelection();
    const range = document.createRange();
    if (td.firstChild) {
      range.setStart(td.firstChild, (td.textContent?.length ?? 0));
      range.collapse(true);
    } else {
      range.setStart(td, 0);
      range.collapse(true);
    }
    sel?.removeAllRanges();
    sel?.addRange(range);
    const finish = () => {
      if (activeEditRef.current?.td === td) activeEditRef.current = null;
      td.removeEventListener("keydown", onKeyDown);
      td.removeEventListener("beforeinput", onBeforeInput as EventListener);
      td.removeEventListener("input", onInput);
      const newVal = type === "progress"
        ? String(Math.min(100, Math.max(0, parseInt(td.textContent || "0") || 0)))
        : (td.textContent || "").trim();
      td.dataset.cellVal = newVal;
      td.contentEditable = "false";
      delete td.dataset.editing;
      const opts = getColOptions(th, type as ColType);
      td.innerHTML = makeCellInner(type, newVal, opts);
      saveContent();
    };
    const isNumeric = type === "number" || type === "currency";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === "Escape") { e.preventDefault(); finish(); return; }
    };
    const onBeforeInput = (e: InputEvent) => {
      if (!isNumeric) return;
      const data = e.data ?? "";
      if (data && !/^[-\d.]*$/.test(data)) e.preventDefault();
    };
    const onInput = () => {
      if (!isNumeric) return;
      const current = td.textContent || "";
      const filtered = current.replace(/[^-\d.]/g, "");
      if (filtered !== current) {
        td.textContent = filtered;
        const sel = window.getSelection();
        const r = document.createRange();
        const node = td.firstChild;
        if (node) { r.setStart(node, filtered.length); r.collapse(true); }
        else { r.setStart(td, 0); r.collapse(true); }
        sel?.removeAllRanges();
        sel?.addRange(r);
      }
    };
    activeEditRef.current = { td, finish };
    td.addEventListener("blur", finish, { once: true });
    td.addEventListener("keydown", onKeyDown);
    td.addEventListener("beforeinput", onBeforeInput as EventListener);
    td.addEventListener("input", onInput);
  }, [saveContent]);

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // ── Typed td cell interactions ────────────────────────────────
    const td = target.closest("td") as HTMLElement | null;
    if (td && editorRef.current?.contains(td) && !td.closest("[data-lined]")) {
      const th = findTh(td);
      if (th) {
        const type = getColType(th);
        if (type !== "text") {
          e.preventDefault();
          e.stopPropagation();

          if (type === "check") {
            const current = td.dataset.cellVal === "true";
            const newVal = String(!current);
            td.dataset.cellVal = newVal;
            td.innerHTML = makeCellInner("check", newVal);
            debouncedSave();
            return;
          }

          if (type === "rating") {
            const star = (target as HTMLElement).closest("[data-star]") as HTMLElement | null;
            if (star) {
              const newVal = star.dataset.star || "0";
              td.dataset.cellVal = newVal;
              td.innerHTML = makeCellInner("rating", newVal);
              debouncedSave();
            }
            return;
          }

          if (type === "priority") {
            const rect = td.getBoundingClientRect();
            setPriorityCellPopup({ td, rect });
            setColTypePopup(null);
            setSelectCellPopup(null);
            return;
          }

          if (type === "select" || type === "multi") {
            const rect = td.getBoundingClientRect();
            setSelectCellPopup({ td, th, rect, multi: type === "multi" });
            setColTypePopup(null);
            setPriorityCellPopup(null);
            return;
          }

          if (type === "progress") {
            const rect = td.getBoundingClientRect();
            setProgressCellPopup({ td, rect });
            setColTypePopup(null);
            setSelectCellPopup(null);
            setPriorityCellPopup(null);
            return;
          }

          // number/currency/url/email/phone/person handled in mousedown

          // date: native input handles itself
          return;
        }
      }
    }

    // Remove button clicked → delete the parent block
    const removeButton = target.closest('[data-remove-btn]');
    if (removeButton) {
      e.preventDefault();
      e.stopPropagation();
      const block = removeButton.closest('[data-quote-block],[data-link-block],[data-voice-block]');
      if (block) { block.remove(); debouncedSave(); }
      return;
    }

    // Link block clicked (not on the URL span) → open the URL
    const linkBlock = target.closest('[data-link-block]') as HTMLElement | null;
    if (linkBlock && !target.closest('[data-link-url]') && !target.closest('[data-remove-btn]')) {
      const urlEl = linkBlock.querySelector('[data-link-url]');
      const url = urlEl?.textContent?.trim() ?? "";
      if (url && url !== "Paste link here…") window.open(url, "_blank");
      return;
    }

    // Clicking on empty editor space (below content) → add paragraphs to reach click position
    if (target === editorRef.current) {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();

      // Measure how far the click is below the last content node
      const editorRect = editor.getBoundingClientRect();
      const clickY = e.clientY;

      // Find the bottom of the last child element (or top of editor if empty)
      let lastBottom = editorRect.top;
      const children = Array.from(editor.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const rect = (child as Element).getBoundingClientRect();
          if (rect.bottom > lastBottom) lastBottom = rect.bottom;
        }
      }

      // Compute how many empty lines to insert based on click position vs last content bottom
      const lineHeight = 26; // approx line height in px
      const gap = clickY - lastBottom;
      if (gap > lineHeight / 2) {
        const linesToAdd = Math.max(1, Math.round(gap / lineHeight));
        let html = "";
        for (let i = 0; i < linesToAdd; i++) html += "<p><br></p>";
        // Insert at end
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
        document.execCommand("insertHTML", false, html);
        debouncedSave();
      } else {
        // Click is close to content — just place cursor at end
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  };

  const insertBorderBlock = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" style="position:relative;border-left:4px solid #6366f1;background:#f5f3ff;padding:10px 36px 10px 16px;border-radius:0 8px 8px 0;margin:8px 0">` +
      removeBtn() +
      `<p contenteditable="true" data-placeholder="Type your note here…" style="margin:0;color:#4c1d95;font-style:italic;outline:none;font-family:Inter,sans-serif"></p></div><br/>`
    );
    setCtxMenu(null);
  };

  const insertCalloutBlock = (variant: "info" | "warning" | "success" | "error") => {
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
    setCtxMenu(null);
  };

  const insertStickyNote = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" data-sticky-note="1" style="position:relative;display:inline-block;vertical-align:top;margin:14px 0 8px;">` +
      `<div contenteditable="false" style="position:absolute;top:-10px;left:0;right:0;text-align:center;font-size:14px;pointer-events:none;user-select:none;z-index:5;line-height:1">📌</div>` +
      `<div style="position:relative;width:440px;min-width:120px;background:#f5f3ff;border:1.5px solid #c4b5fd;border-radius:10px;padding:10px 36px 10px 14px;box-shadow:2px 3px 8px rgba(99,102,241,0.10);resize:horizontal;overflow:auto;min-height:60px" onmouseenter="this.querySelectorAll('[data-remove-btn],[data-drag-btn]').forEach(b=>b.style.display='inline-flex')" onmouseleave="this.querySelectorAll('[data-remove-btn],[data-drag-btn]').forEach(b=>b.style.display='none')">` +
      `<button data-remove-btn="1" contenteditable="false" style="position:absolute;top:5px;right:6px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.08);border:none;cursor:pointer;font-size:14px;color:#777;line-height:1;padding:0;display:none;align-items:center;justify-content:center;z-index:10;flex-shrink:0" title="Remove">&#215;</button>` +
      `<button data-drag-btn="1" contenteditable="false" title="Drag to move" ` +
      `style="position:absolute;top:27px;right:6px;width:18px;height:18px;border-radius:50%;background:rgba(99,102,241,0.10);border:none;cursor:grab;font-size:13px;color:#7c3aed;line-height:1;padding:0;display:none;align-items:center;justify-content:center;z-index:10;flex-shrink:0;user-select:none">&#9995;</button>` +
      `<p contenteditable="true" data-placeholder="Jot something down…" style="margin:0;color:#4c1d95;font-size:13px;outline:none;font-family:Inter,sans-serif;min-height:40px"></p>` +
      `<div style="position:absolute;bottom:3px;right:3px;width:10px;height:10px;cursor:se-resize;opacity:0.4;background:linear-gradient(135deg,transparent 40%,#7c3aed 40%,#7c3aed 55%,transparent 55%,transparent 70%,#7c3aed 70%,#7c3aed 85%,transparent 85%)"></div>` +
      `</div></div><br/>`
    );
    setCtxMenu(null);
  };

  const insertCardBlock = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" data-sticky-note="1" style="position:relative;display:inline-block;vertical-align:top;margin:14px 0 8px;">` +
      `<div style="position:relative;width:440px;min-width:120px;background:#fafafa;border:1.5px solid #e5e7eb;border-radius:12px;padding:14px 36px 14px 16px;box-shadow:0 4px 16px rgba(0,0,0,0.08),0 1px 3px rgba(0,0,0,0.06);resize:horizontal;overflow:auto;min-height:60px" onmouseenter="this.querySelectorAll('[data-remove-btn],[data-drag-btn]').forEach(b=>b.style.display='inline-flex')" onmouseleave="this.querySelectorAll('[data-remove-btn],[data-drag-btn]').forEach(b=>b.style.display='none')">` +
      `<button data-remove-btn="1" contenteditable="false" style="position:absolute;top:5px;right:6px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.07);border:none;cursor:pointer;font-size:14px;color:#888;line-height:1;padding:0;display:none;align-items:center;justify-content:center;z-index:10;flex-shrink:0" title="Remove">&#215;</button>` +
      `<button data-drag-btn="1" contenteditable="false" title="Drag to move" style="position:absolute;top:27px;right:6px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.06);border:none;cursor:grab;font-size:13px;color:#888;line-height:1;padding:0;display:none;align-items:center;justify-content:center;z-index:10;flex-shrink:0;user-select:none">&#9995;</button>` +
      `<p contenteditable="true" data-placeholder="Write something…" style="margin:0;color:#374151;font-size:13px;outline:none;font-family:Inter,sans-serif;min-height:40px"></p>` +
      `<div style="position:absolute;bottom:3px;right:3px;width:10px;height:10px;cursor:se-resize;opacity:0.3;background:linear-gradient(135deg,transparent 40%,#9ca3af 40%,#9ca3af 55%,transparent 55%,transparent 70%,#9ca3af 70%,#9ca3af 85%,transparent 85%)"></div>` +
      `</div></div><br/>`
    );
    setCtxMenu(null);
  };

  const insertNumberedListBlock = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" style="position:relative;border-left:4px solid #6366f1;background:#f5f3ff;padding:10px 36px 10px 16px;border-radius:0 8px 8px 0;margin:8px 0">` +
      removeBtn() +
      `<ol contenteditable="true" data-placeholder="Add list items…" style="margin:0;padding-left:1.4em;color:#4c1d95;font-size:13px;outline:none;list-style-type:decimal;font-family:Inter,sans-serif"><li></li></ol></div><br/>`
    );
    setCtxMenu(null);
  };

  const insertTwoColumnBlock = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" style="position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 36px 10px 12px;margin:8px 0">` +
      removeBtn() +
      `<p contenteditable="true" data-placeholder="Left column…" style="margin:0;min-height:40px;background:#fff;border-radius:6px;padding:6px 8px;color:#334155;font-size:13px;outline:none;border:1px solid #e2e8f0;font-family:Inter,sans-serif"></p>` +
      `<p contenteditable="true" data-placeholder="Right column…" style="margin:0;min-height:40px;background:#fff;border-radius:6px;padding:6px 8px;color:#334155;font-size:13px;outline:none;border:1px solid #e2e8f0;font-family:Inter,sans-serif"></p>` +
      `</div><br/>`
    );
    setCtxMenu(null);
  };

  const insertCodeBlock = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" style="position:relative;background:#1e1e2e;border-radius:10px;padding:10px 36px 10px 14px;margin:8px 0">` +
      removeBtn() +
      `<div style="font-size:10px;font-weight:600;color:#6c7086;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px">Code</div>` +
      `<pre contenteditable="true" data-placeholder="// Write your code here…" style="margin:0;color:#cdd6f4;font-family:'Courier New',monospace;font-size:13px;outline:none;white-space:pre-wrap;word-break:break-all"></pre></div><br/>`
    );
    setCtxMenu(null);
  };

  const insertDefinitionBlock = () => {
    insertHTML(
      `<div contenteditable="false" data-quote-block="1" data-sticky-note="1" style="position:relative;display:inline-block;vertical-align:top;margin:14px 0 8px;">` +
      `<div style="position:relative;width:440px;min-width:120px;background:#ffffff;border:1.5px solid #e5e3e1;border-radius:12px;padding:14px 36px 14px 16px;overflow:auto;min-height:60px;resize:horizontal" onmouseenter="this.querySelectorAll('[data-remove-btn],[data-drag-btn]').forEach(b=>b.style.display='inline-flex')" onmouseleave="this.querySelectorAll('[data-remove-btn],[data-drag-btn]').forEach(b=>b.style.display='none')">` +
      `<button data-remove-btn="1" contenteditable="false" style="position:absolute;top:5px;right:6px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.07);border:none;cursor:pointer;font-size:14px;color:#a8a29e;line-height:1;padding:0;display:none;align-items:center;justify-content:center;z-index:10;flex-shrink:0" title="Remove">&#215;</button>` +
      `<button data-drag-btn="1" contenteditable="false" title="Drag to move" style="position:absolute;top:27px;right:6px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.05);border:none;cursor:grab;font-size:13px;color:#a8a29e;line-height:1;padding:0;display:none;align-items:center;justify-content:center;z-index:10;flex-shrink:0;user-select:none">&#9995;</button>` +
      `<p contenteditable="true" data-placeholder="Write something…" style="margin:0;color:#a09f9e;font-size:13px;outline:none;font-family:Inter,sans-serif;min-height:40px"></p>` +
      `<div style="position:absolute;bottom:3px;right:3px;width:10px;height:10px;cursor:se-resize;opacity:0.25;background:linear-gradient(135deg,transparent 40%,#a8a29e 40%,#a8a29e 55%,transparent 55%,transparent 70%,#a8a29e 70%,#a8a29e 85%,transparent 85%)"></div>` +
      `</div></div><br/>`
    );
    setCtxMenu(null);
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
      `style="position:relative;display:flex;align-items:center;gap:10px;border-left:4px solid ${cfg.color};background:${cfg.bg};padding:10px 36px 10px 14px;border-radius:0 8px 8px 0;margin:8px 0;cursor:pointer;user-select:none">` +
      removeBtn() +
      `<span style="font-size:15px;flex-shrink:0">${cfg.icon}</span>` +
      `<div style="flex:1;min-width:0">` +
      `<div style="font-size:10px;font-weight:700;color:${cfg.color};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:2px">${cfg.label}</div>` +
      `<span data-link-url="1" contenteditable="true" data-placeholder="Paste link here…" ` +
      `onclick="event.stopPropagation()" ` +
      `style="outline:none;color:${cfg.color};font-size:13px;text-decoration:underline;word-break:break-all;display:block;cursor:text"></span>` +
      `</div></div><br/>`
    );
    setCtxMenu(null);
  };

  // ── Set banner
  const setBanner = (partial: Partial<ProjectDoc>) => {
    if (!activeId) return;
    const updated = projects.map(p =>
      p.id === activeId ? { ...p, ...partial, updatedAt: new Date().toISOString() } : p
    );
    saveProjects(updated);
    setProjects(updated);
    setShowBannerPicker(false);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBanner({ bannerImg: ev.target?.result as string, bannerGradient: undefined });
    reader.readAsDataURL(file); e.target.value = "";
  };

  // ── Update doc title
  const updateDocTitle = (id: number, title: string) => {
    const updated = projects.map(p => p.id === id ? { ...p, title } : p);
    saveProjects(updated);
    setProjects(updated);
  };

  // ── Keyboard shortcuts
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const node = sel.getRangeAt(0).startContainer;
        const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element;
        const todoItem = el?.closest?.('[data-todo-item="1"]');
        if (todoItem) {
          e.preventDefault();
          const newP = document.createElement("p");
          newP.innerHTML = "<br>";
          todoItem.parentNode?.insertBefore(newP, todoItem.nextSibling);
          const range = document.createRange();
          const newSel = window.getSelection();
          range.setStart(newP, 0);
          range.collapse(true);
          newSel?.removeAllRanges();
          newSel?.addRange(range);
          debouncedSave();
          return;
        }
      }
    }
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "b") { e.preventDefault(); execFmt("bold"); }
      else if (e.key === "i") { e.preventDefault(); execFmt("italic"); }
      else if (e.key === "u") { e.preventDefault(); execFmt("underline"); }
      else if (e.key === "a") {
        e.preventDefault();
        const editor = editorRef.current;
        if (!editor) return;
        const range = document.createRange();
        range.selectNodeContents(editor);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  // ── Selection mini-popup: show on text select, hide on collapse
  const handleEditorMouseUp = useCallback(() => {
    setTimeout(() => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) { setSelPopup(null); return; }
      if (!editorRef.current?.contains(sel.anchorNode)) { setSelPopup(null); return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) { setSelPopup(null); return; }
      setSelPopup({ x: rect.left + rect.width / 2, y: rect.top });
    }, 0);
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (selPopupRef.current && !selPopupRef.current.contains(e.target as Node)) {
        setSelPopup(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // ── Empty state
  if (projects.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-[#fafaf8]">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center shadow-lg">
          <FolderKanban className="w-10 h-10 text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">No Projects Yet</h2>
          <p className="text-stone-500 text-sm">Create your first project from the sidebar</p>
        </div>
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>
    );
  }

  const bannerStyle = activeProject?.bannerImg
    ? { backgroundImage: `url(${activeProject.bannerImg})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: activeProject?.bannerGradient ?? DEFAULT_PROJECT_GRADIENT };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#fafaf8]">

      {activeProject ? (
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto min-h-0 hide-scrollbar"
          style={{ position: "relative", cursor: drawTool === "eraser" ? `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24'><text y='20' font-size='20' fill='white' stroke='%23555' stroke-width='0.6' paint-order='stroke'>✐</text></svg>") 4 20, auto` : drawTool ? "crosshair" : undefined }}
          onMouseDown={(e) => {
            const container = scrollContainerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const cx = e.clientX - rect.left;
            const cy = e.clientY - rect.top + container.scrollTop;
            if (drawTool === "eraser") {
              const filtered = arrowsRef.current.filter(s => !shapeIntersectsCircle(s, cx, cy, ERASER_RADIUS));
              if (filtered.length !== arrowsRef.current.length) {
                setArrows(filtered);
                pushHistory({ arrows: filtered });
              }
              e.preventDefault();
              return;
            }
            if (!drawTool) return;
            arrowDrawRef.current = { startX: cx, startY: cy, type: drawTool };
            setDrawingArrow({ id: "preview", type: drawTool, x1: cx, y1: cy, x2: cx, y2: cy, color: "#ef4444" });
            e.preventDefault();
          }}
          onMouseMove={(e) => {
            const container = scrollContainerRef.current;
            const rect = container?.getBoundingClientRect();
            if (!rect || !container) return;
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top + container.scrollTop;
            if (drawTool === "eraser") setEraserPos({ x: mx, y: my });
            if (lastTodoPos) {
              const dx = mx - lastTodoPos.left;
              const dy = my - lastTodoPos.top;
              setShowTodoButtons(Math.abs(dx) < 80 && Math.abs(dy) < 40);
            }
            // Track active table for +/- toolbar
            const tbl = (e.target as Element).closest("table") as HTMLTableElement | null;
            if (tbl) {
              if (tbl !== activeTableRef.current) { activeTableRef.current = tbl; updateTableToolbar(); setTableLinesHidden(tbl.dataset.linesHidden === "true"); }
              setShowTableBtns(true);
            } else {
              // Check if cursor is in the button zone of any table in the editor
              const editor = editorRef.current;
              const nearTable = editor ? Array.from(editor.querySelectorAll("table")).find(t => {
                const tr = t.getBoundingClientRect();
                const cr = rect;
                const tx = tr.left - cr.left;
                const ty = tr.top - cr.top + container.scrollTop;
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
          onMouseLeave={() => { setShowTodoButtons(false); setEraserPos(null); setTableToolbar(null); activeTableRef.current = null; if (tableResizeObserverRef.current) { tableResizeObserverRef.current.disconnect(); tableResizeObserverRef.current = null; } }}
        >

          {/* Inline +/- buttons next to last todo item */}
          {lastTodoPos && (
            <div
              onMouseEnter={() => setShowTodoButtons(true)}
              onMouseLeave={() => setShowTodoButtons(false)}
              style={{
                position: "absolute",
                top: lastTodoPos.top,
                left: lastTodoPos.left - 30,
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                zIndex: 200,
                pointerEvents: "auto",
                opacity: showTodoButtons ? 1 : 0,
                transition: "opacity 0.15s ease",
              }}
            >
              <button
                onMouseDown={e => { e.preventDefault(); removeLastTodos(1); }}
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
          {/* Table +/- row & column buttons */}
          {tableToolbar && (() => {
            const isLined = activeTableRef.current?.dataset.lined === "true";
            const btnStyle = (variant: "red"|"green"): React.CSSProperties => ({
              width: 16, height: 16, borderRadius: 0, border: "1px solid #000",
              background: "#fafaf8", color: "#374151", fontSize: 13, fontWeight: 700,
              lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0.3
            });
            const hoverRed = (e: React.MouseEvent<HTMLButtonElement>) => { const t = e.currentTarget; t.style.background = "#fee2e2"; t.style.color = "#dc2626"; };
            const hoverGreen = (e: React.MouseEvent<HTMLButtonElement>) => { const t = e.currentTarget; t.style.background = "#dcfce7"; t.style.color = "#16a34a"; };
            const hoverReset = (e: React.MouseEvent<HTMLButtonElement>) => { const t = e.currentTarget; t.style.background = "#fafaf8"; t.style.color = "#374151"; };
            const hoverOrangePre = (e: React.MouseEvent<HTMLButtonElement>) => { const t = e.currentTarget; t.style.background = "#fee2e2"; t.style.color = "#dc2626"; };
            const rowBtns = (
              <div
                onMouseEnter={() => setHoverTableBtns(true)}
                onMouseLeave={() => setHoverTableBtns(false)}
                style={{ position: "absolute",
                  top: isLined ? tableToolbar.top + 8 : tableToolbar.top + tableToolbar.height + 2,
                  left: isLined ? tableToolbar.left - 30 : tableToolbar.left + 4,
                  display: "flex", flexDirection: isLined ? "column" : "row", gap: 4, zIndex: 200, pointerEvents: "auto",
                  opacity: showTableBtns || hoverTableBtns ? 1 : 0, padding: 12, margin: -12 }}>
                {isLined && (
                  <button onMouseDown={e => { e.preventDefault(); tableDeleteTable(); }} title="Delete lined table"
                    style={{ ...btnStyle("red"), fontSize: 12 }} onMouseEnter={hoverOrangePre} onMouseLeave={hoverReset}>✕</button>
                )}
                <button onMouseDown={e => { e.preventDefault(); tableRemoveRow(); }} title="Remove last row"
                  style={btnStyle("red")} onMouseEnter={hoverRed} onMouseLeave={hoverReset}>−</button>
                <button onMouseDown={e => { e.preventDefault(); tableAddRow(); }} title="Add row"
                  style={btnStyle("green")} onMouseEnter={hoverGreen} onMouseLeave={hoverReset}>+</button>
              </div>
            );
            const hoverBlue  = (e: React.MouseEvent<HTMLButtonElement>) => { const t = e.currentTarget; t.style.background = "#dbeafe"; t.style.color = "#2563eb"; };
            const hoverOrange = (e: React.MouseEvent<HTMLButtonElement>) => { const t = e.currentTarget; t.style.background = "#fee2e2"; t.style.color = "#dc2626"; };
            const colBtns = !isLined && (
              <div
                onMouseEnter={() => setHoverTableBtns(true)}
                onMouseLeave={() => setHoverTableBtns(false)}
                style={{ position: "absolute", top: tableToolbar.top + 4, left: tableToolbar.left + tableToolbar.width + 2,
                  display: "flex", flexDirection: "column", gap: 4, zIndex: 200, pointerEvents: "auto",
                  opacity: showTableBtns || hoverTableBtns ? 1 : 0, padding: 12, margin: -12 }}>
                <button onMouseDown={e => { e.preventDefault(); tableRemoveCol(); }} title="Remove last column"
                  style={btnStyle("red")} onMouseEnter={hoverRed} onMouseLeave={hoverReset}>−</button>
                <button onMouseDown={e => { e.preventDefault(); tableAddCol(); }} title="Add column"
                  style={btnStyle("green")} onMouseEnter={hoverGreen} onMouseLeave={hoverReset}>+</button>
                <button
                  onMouseDown={e => { e.preventDefault(); tableDeleteTable(); }}
                  title="Delete table"
                  style={{ ...btnStyle("red"), fontSize: 12 }}
                  onMouseEnter={hoverOrange} onMouseLeave={hoverReset}>✕</button>
              </div>
            );
            return <>{rowBtns}{colBtns}</>;
          })()}

          {/* Banner + emoji overlap wrapper */}
          <div className="relative" ref={pdfContentRef}>
            {/* Banner */}
            <div className="relative h-44 w-full group" style={bannerStyle}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="relative" ref={bannerPickerRef}>
                  <button
                    onClick={() => setShowBannerPicker(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm text-white text-xs font-semibold hover:bg-black/60 transition-all"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    Change Cover
                  </button>
                  {showBannerPicker && (
                    <div className="absolute bottom-10 right-0 w-80 bg-white rounded-xl shadow-2xl border border-stone-200 p-4 z-50">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Gradients</p>
                      <div className="grid grid-cols-5 gap-1.5 mb-3">
                        {BANNER_GRADIENTS.map(g => (
                          <button key={g.id} onClick={() => setBanner({ bannerGradient: g.value, bannerImg: undefined })}
                            className="h-8 rounded-lg hover:scale-105 transition-transform border-2 border-transparent hover:border-stone-300"
                            style={{ background: g.value }} title={g.label} />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Photos</p>
                      <div className="grid grid-cols-3 gap-1.5 mb-3">
                        {BANNER_IMAGES.map(img => (
                          <button key={img.id} onClick={() => setBanner({ bannerImg: img.url, bannerGradient: undefined })}
                            className="h-12 rounded-lg overflow-hidden hover:scale-105 transition-transform border-2 border-transparent hover:border-indigo-400"
                            style={{ backgroundImage: `url(${img.url})`, backgroundSize: "cover", backgroundPosition: "center" }}
                            title={img.label} />
                        ))}
                      </div>
                      <button onClick={() => bannerUploadRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed border-stone-300 text-xs text-stone-500 hover:border-indigo-400 hover:text-indigo-600 transition-all">
                        <ImagePlus className="w-3.5 h-3.5" />Upload Image
                      </button>
                      <input ref={bannerUploadRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Emoji card — overlaps banner bottom */}
            <div className="absolute left-[78px] bottom-[-20px] translate-y-1/2 z-10" ref={emojiPickerRef}>
              <button
                onClick={() => setShowEmojiPicker(v => !v)}
                className="w-[110px] h-[90px] rounded-lg bg-white shadow-lg border border-stone-100 flex items-center justify-center text-4xl hover:scale-105 transition-transform"
                title="Change emoji"
              >
                {activeProject.emoji ?? DEFAULT_EMOJI}
              </button>
              {showEmojiPicker && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-stone-200 p-3 z-50">
                  <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-2">Pick an emoji</p>
                  <div className="grid grid-cols-9 gap-1">
                    {EMOJI_LIST.map(e => (
                      <button
                        key={e}
                        onClick={() => setEmoji(e)}
                        className="text-xl w-7 h-7 flex items-center justify-center rounded-lg hover:bg-stone-100 transition-colors"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Title — padded to clear emoji card */}
          <div
            className="px-12 pt-[98px] pb-2 cursor-text"
            onClick={(e) => { if (e.target === e.currentTarget) titleRef.current?.focus(); }}
          >
            <div
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateDocTitle(activeProject.id, e.currentTarget.textContent?.trim() || "Untitled")}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); editorRef.current?.focus(); } }}
              className="text-4xl font-bold text-stone-900 outline-none w-full"
              style={{ fontFamily: "Georgia, serif", lineHeight: 1.2 }}
            />
          </div>

          {/* Divider below title */}
          <div className="mx-12 mt-3 mb-6 border-t border-stone-200" />

          {/* Content editor */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={debouncedSave}
            onKeyDown={handleEditorKeyDown}
            onMouseUp={handleEditorMouseUp}
            onContextMenu={handleContextMenu}
            onPaste={handleEditorPaste}
            onMouseDown={handleEditorMouseDown}
            onClick={handleEditorClick}
            className="outline-none text-stone-800 text-[15px] leading-relaxed"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              caretColor: "#6366f1",
              padding: "16px 48px 80px",
              minHeight: "6100px",
              position: "relative",
            }}
            data-placeholder="Start writing your project notes…"
          />

          {/* Click-to-focus spacer below editor */}
          <div
            className="flex-1 min-h-[100px] cursor-text"
            onClick={() => { editorRef.current?.focus(); }}
          />

          {/* Hidden image file input */}
          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />

          {/* Hidden voice file input */}
          <input ref={voiceInputRef} type="file" accept="audio/*" className="hidden" onChange={handleVoiceFile} />

          {/* Hidden transfer upload input */}
          <input ref={transferUploadRef} type="file" accept=".nbproject,application/json" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadProject(f); e.target.value = ""; }} />

          {/* SVG shape overlay */}
          {(arrows.length > 0 || drawingArrow) && (
            <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 50, overflow: "visible" }}>
              <defs>
                <marker id="ah-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
                <marker id="ah-start" markerWidth="10" markerHeight="7" refX="1" refY="3.5" orient="auto-start-reverse">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
              </defs>
              {arrows.map(a => (
                <DrawShapeEl
                  key={a.id} shape={a} isPreview={false}
                  eraserMode={drawTool === "eraser"}
                  onRemove={() => { const f = arrows.filter(x => x.id !== a.id); setArrows(f); pushHistory({ arrows: f }); }}
                />
              ))}
              {drawingArrow && <DrawShapeEl shape={drawingArrow} isPreview={true} eraserMode={false} />}
              {drawTool === "eraser" && eraserPos && (
                <circle
                  cx={eraserPos.x} cy={eraserPos.y} r={ERASER_RADIUS}
                  fill="rgba(239,68,68,0.07)" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 3"
                  style={{ pointerEvents: "none" }}
                />
              )}
            </svg>
          )}
          {drawTool === "eraser" && eraserPos && arrows.length === 0 && (
            <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 50, overflow: "visible" }}>
              <circle cx={eraserPos.x} cy={eraserPos.y} r={ERASER_RADIUS}
                fill="rgba(239,68,68,0.07)" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="5 3"
                style={{ pointerEvents: "none" }} />
            </svg>
          )}

          {imageBlocks.map(blk => (
            <div
              key={blk.id}
              className={blk.locked ? "img-blk-locked" : ""}
              style={{
                position: "absolute",
                left: blk.x,
                top: blk.y,
                width: blk.width,
                userSelect: "none",
                zIndex: 20,
              }}
            >
              {/* Drag area (the whole block, minus handles/buttons) */}
              <div
                style={{
                  position: "relative",
                  cursor: blk.locked ? "default" : "grab",
                  border: "2px solid #e2e8f0",
                  borderRadius: 8,
                  overflow: "visible",
                  background: "#fff",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
                }}
                onMouseDown={e => {
                  if (blk.locked) return;
                  const tgt = e.target as HTMLElement;
                  if (tgt.closest("[data-img-btn]") || tgt.closest("[data-resize-handle]")) return;
                  e.preventDefault();
                  dragRef.current = { id: blk.id, startMx: e.clientX, startMy: e.clientY, startBx: blk.x, startBy: blk.y };
                }}
              >
                {/* Image */}
                <img
                  src={blk.src}
                  alt=""
                  draggable={false}
                  style={{ display: "block", width: "100%", borderRadius: 6, pointerEvents: "none" }}
                />

                {/* × Delete button — top-left (hidden when locked) */}
                {!blk.locked && (
                  <button
                    data-img-btn="1"
                    onClick={() => { const f = imageBlocks.filter(b => b.id !== blk.id); setImageBlocks(f); pushHistory({ imageBlocks: f }); }}
                    style={{
                      position: "absolute", top: -10, left: -10,
                      width: 22, height: 22, borderRadius: "50%",
                      background: "#ef4444", border: "2px solid #fff",
                      color: "#fff", fontSize: 13, fontWeight: 700,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.18)", zIndex: 30, lineHeight: 1, padding: 0,
                    }}
                    title="Delete image"
                  >×</button>
                )}

                {/* Lock button — top-right */}
                <button
                  data-img-btn="1"
                  className="img-lock-btn"
                  onClick={() => setImageBlocks(prev => prev.map(b => b.id === blk.id ? { ...b, locked: !b.locked } : b))}
                  style={{
                    position: "absolute", top: -10, right: -10,
                    width: 22, height: 22, borderRadius: "50%",
                    background: blk.locked ? "#6366f1" : "#94a3b8",
                    border: "2px solid #fff",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.18)", zIndex: 30, padding: 0,
                    transition: "opacity 0.2s",
                  }}
                  title={blk.locked ? "Unlock" : "Lock position"}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                    {blk.locked
                      ? <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                      : <path d="M12 1C9.24 1 7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2h-1V6c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V6c0-1.66 1.34-3 3-3zm0 11c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" opacity=".4"/>
                    }
                  </svg>
                </button>

                {/* Width label — bottom-left */}
                <div style={{
                  position: "absolute", bottom: -20, left: 0,
                  fontSize: 10, color: "#94a3b8", fontFamily: "monospace", pointerEvents: "none",
                }}>
                  {Math.round(blk.width)}px
                </div>

                {/* Resize handles — bottom corners only */}
                {!blk.locked && [
                  { side: "bl" as const, style: { bottom: -5, left: -5, cursor: "sw-resize" } },
                  { side: "br" as const, style: { bottom: -5, right: -5, cursor: "se-resize" } },
                ].map(({ side, style }) => (
                  <div
                    key={side}
                    data-resize-handle="1"
                    onMouseDown={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      resizeRef.current = { id: blk.id, startMx: e.clientX, startW: blk.width, startBx: blk.x, side };
                    }}
                    style={{
                      position: "absolute",
                      width: 10, height: 10,
                      background: "#ef4444",
                      border: "2px solid #fff",
                      borderRadius: 2,
                      zIndex: 30,
                      ...style,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* ── Graph blocks ── */}
          {graphBlocks.map(g => {
            const PIE_COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899","#8b5cf6","#14b8a6"];
            return (
              <div key={g.id} style={{ position: "absolute", left: g.x, top: g.y, width: g.width, zIndex: 25, userSelect: "none" }}>
                <div
                  onMouseDown={e => {
                    if ((e.target as HTMLElement).closest("[data-graph-btn]")) return;
                    e.preventDefault();
                    graphDragRef.current = { id: g.id, startMx: e.clientX, startMy: e.clientY, startBx: g.x, startBy: g.y };
                  }}
                  style={{ cursor: "grab", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, boxShadow: "0 2px 12px rgba(0,0,0,0.09)", overflow: "hidden" }}
                >
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 4px", borderBottom: "1px solid #f1f0ee" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", fontFamily: "Georgia, serif" }}>{g.title}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button data-graph-btn="1" title="Edit data"
                        onClick={() => setGraphEditor({ id: g.id, data: [...g.data], title: g.title, type: g.type, color: g.color })}
                        style={{ width: 20, height: 20, borderRadius: 4, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>✏️</button>
                      <button data-graph-btn="1" title="Delete chart"
                        onClick={() => setGraphBlocks(prev => prev.filter(x => x.id !== g.id))}
                        style={{ width: 20, height: 20, borderRadius: 4, border: "1px solid #fecaca", background: "#fff5f5", cursor: "pointer", fontSize: 11, color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>×</button>
                    </div>
                  </div>
                  {/* Chart */}
                  <div style={{ padding: "8px 4px 8px 0", height: g.height }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {g.type === "bar" ? (
                        <BarChart data={g.data} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill={g.color} radius={[3,3,0,0]} />
                        </BarChart>
                      ) : g.type === "line" ? (
                        <LineChart data={g.data} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke={g.color} strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      ) : g.type === "area" ? (
                        <AreaChart data={g.data} margin={{ top: 4, right: 8, bottom: 4, left: -10 }}>
                          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="value" stroke={g.color} fill={g.color + "33"} strokeWidth={2} />
                        </AreaChart>
                      ) : (
                        <PieChart>
                          <Pie data={g.data} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius="70%" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                            {g.data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-stone-400">
          <FolderKanban className="w-10 h-10 text-stone-300" />
          <p className="text-sm">Select a project from the sidebar</p>
        </div>
      )}

      {/* ── Graph editor popup ── */}
      {graphEditor && (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}
          onMouseDown={() => setGraphEditor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 p-5 w-[380px] max-h-[90vh] overflow-y-auto"
            onMouseDown={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-stone-800">Edit Chart</h3>
              <button onClick={() => setGraphEditor(null)} className="text-stone-400 hover:text-stone-600 text-lg font-bold leading-none">×</button>
            </div>
            {/* Title */}
            <label className="block text-xs font-semibold text-stone-500 mb-1">Title</label>
            <input value={graphEditor.title} onChange={e => setGraphEditor(prev => prev ? { ...prev, title: e.target.value } : null)}
              className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
            {/* Chart type */}
            <label className="block text-xs font-semibold text-stone-500 mb-1">Chart Type</label>
            <div className="flex gap-2 mb-3">
              {(["bar","line","area","pie"] as GraphType[]).map(t => (
                <button key={t} onClick={() => setGraphEditor(prev => prev ? { ...prev, type: t } : null)}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium border transition-colors ${graphEditor.type === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"}`}>
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            {/* Color */}
            <label className="block text-xs font-semibold text-stone-500 mb-1">Color</label>
            <div className="flex gap-2 mb-4 flex-wrap">
              {["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#ec4899","#8b5cf6","#14b8a6"].map(c => (
                <button key={c} onClick={() => setGraphEditor(prev => prev ? { ...prev, color: c } : null)}
                  style={{ background: c, width: 26, height: 26, borderRadius: 6, border: graphEditor.color === c ? "3px solid #1e293b" : "2px solid transparent", cursor: "pointer", flexShrink: 0 }} />
              ))}
            </div>
            {/* Data rows */}
            <label className="block text-xs font-semibold text-stone-500 mb-1">Data</label>
            <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto pr-1">
              {graphEditor.data.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={row.label} placeholder="Label"
                    onChange={e => setGraphEditor(prev => { if (!prev) return null; const d = [...prev.data]; d[i] = { ...d[i], label: e.target.value }; return { ...prev, data: d }; })}
                    className="flex-1 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                  <input type="number" value={row.value} placeholder="0"
                    onChange={e => setGraphEditor(prev => { if (!prev) return null; const d = [...prev.data]; d[i] = { ...d[i], value: Number(e.target.value) }; return { ...prev, data: d }; })}
                    className="w-20 border border-stone-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300" />
                  <button onClick={() => setGraphEditor(prev => prev ? { ...prev, data: prev.data.filter((_, j) => j !== i) } : null)}
                    className="text-red-400 hover:text-red-600 font-bold text-sm leading-none">×</button>
                </div>
              ))}
            </div>
            <button onClick={() => setGraphEditor(prev => prev ? { ...prev, data: [...prev.data, { label: "New", value: 0 }] } : null)}
              className="w-full py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors mb-4">+ Add row</button>
            {/* Save */}
            <button onClick={() => {
              if (!graphEditor) return;
              setGraphBlocks(prev => prev.map(g => g.id === graphEditor.id
                ? { ...g, title: graphEditor.title, type: graphEditor.type, color: graphEditor.color, data: graphEditor.data }
                : g));
              setGraphEditor(null);
            }} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors">
              Save Chart
            </button>
          </div>
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

      {/* ── Selection mini popup ── */}
      {selPopup && (
        <div
          ref={selPopupRef}
          className="fixed z-[9998]"
          style={{
            left: selPopup.x,
            top: selPopup.y,
            transform: "translateX(-50%) translateY(calc(-100% - 10px))",
            pointerEvents: "auto",
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="flex items-center bg-[#faf9f7] rounded-lg shadow-2xl overflow-hidden border border-stone-200">
            {/* Copy */}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-stone-700 text-xs font-medium hover:bg-stone-100 transition-colors"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => {
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed) {
                  navigator.clipboard.writeText(sel.toString()).catch(() => document.execCommand("copy"));
                }
                setSelPopup(null);
              }}
            >
              <Copy className="w-3.5 h-3.5 text-stone-500" />
              <span>Copy</span>
            </button>

            <div className="w-px h-5 bg-stone-200" />

            {/* Cut */}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-stone-700 text-xs font-medium hover:bg-stone-100 transition-colors"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => {
                document.execCommand("cut");
                setSelPopup(null);
              }}
            >
              <Scissors className="w-3.5 h-3.5 text-stone-500" />
              <span>Cut</span>
            </button>

            <div className="w-px h-5 bg-stone-200" />

            {/* Paste */}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-stone-700 text-xs font-medium hover:bg-stone-100 transition-colors"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
              onClick={async () => {
                setSelPopup(null);
                editorRef.current?.focus();
                try {
                  const text = await navigator.clipboard.readText();
                  document.execCommand("insertText", false, text);
                } catch {
                  document.execCommand("paste");
                }
              }}
            >
              <Clipboard className="w-3.5 h-3.5 text-stone-500" />
              <span>Paste</span>
            </button>

            <div className="w-px h-5 bg-stone-200" />

            {/* Tools */}
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-stone-700 text-xs font-medium hover:bg-stone-100 transition-colors"
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
              onClick={(e) => {
                const sel = window.getSelection();
                savedRangeRef.current = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
                const btnRect = e.currentTarget.getBoundingClientRect();
                const px = btnRect.right + 6;
                const py = btnRect.top;
                setSelPopup(null);
                setCtxMenu({ x: px, y: py, formatOpen: false, alignOpen: false, bulletOpen: false, highlightOpen: false, fontColorOpen: false, headingOpen: false, dividerOpen: false, linkOpen: false, todoOpen: false, todoCount: 1, todoRemoveCount: 1, drawOpen: false, graphOpen: false, tableOpen: false, fontOpen: false, blockOpen: false, mediaOpen: false });
              }}
            >
              <Wrench className="w-3.5 h-3.5 text-stone-500" />
              <span>Tools</span>
            </button>
          </div>
          {/* Small triangle pointing down */}
          <div style={{
            position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent",
            borderTop: "5px solid #faf9f7",
          }} />
        </div>
      )}

      {/* ── Right-click context menu ── */}
      {ctxMenu && (
        <div
          ref={ctxMenuRef}
          className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-stone-200 py-1.5 min-w-[210px]"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onMouseDown={e => e.stopPropagation()}
        >
          {/* Format button → side sub-card */}
          <div className="relative">
            <CtxItem icon={<Bold className="w-3.5 h-3.5"/>} label="Format" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, formatOpen: !m.formatOpen, alignOpen: false, bulletOpen: false, dividerOpen: false, linkOpen: false, drawOpen: false, highlightOpen: false, fontColorOpen: false, headingOpen: false } : null)} />
            {ctxMenu.formatOpen && (
              <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-1.5 z-[10000] min-w-[180px]">
                <CtxItem icon={<Bold className="w-3.5 h-3.5"/>}          label="Bold"          shortcut="Ctrl+B" onClick={() => execFmt("bold")} />
                <CtxItem icon={<span className="w-3.5 h-3.5 flex items-center justify-center text-[10px] font-black tracking-tight leading-none">AA</span>} label="All Caps" onClick={execAllCaps} />
                <CtxItem icon={<Italic className="w-3.5 h-3.5"/>}        label="Italic"        shortcut="Ctrl+I" onClick={() => execFmt("italic")} />
                <CtxItem icon={<Underline className="w-3.5 h-3.5"/>}     label="Underline"     shortcut="Ctrl+U" onClick={() => execFmt("underline")} />
                <CtxItem icon={<Strikethrough className="w-3.5 h-3.5"/>} label="Strikethrough" onClick={() => execFmt("strikeThrough")} />
                {/* Font Colour */}
                <div className="relative">
                  <CtxItem icon={<span className="w-3.5 h-3.5 flex items-center justify-center text-[11px] font-bold" style={{ color: "#ef4444" }}>A</span>} label="Font Colour" hasArrow
                    onClick={() => setCtxMenu(m => m ? { ...m, fontColorOpen: !m.fontColorOpen, highlightOpen: false, headingOpen: false } : null)} />
                  {ctxMenu.fontColorOpen && (
                    <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 p-2.5 z-[10001]" style={{ minWidth: 140 }}>
                      <div className="flex flex-wrap gap-1.5">
                        {FONT_COLORS.map(fc => (
                          <button key={fc.color} title={fc.label}
                            onMouseDown={e => { e.preventDefault(); execFmt("foreColor", fc.color); }}
                            className="w-6 h-6 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                            style={{ backgroundColor: fc.color }} />
                        ))}
                        <button title="Remove colour"
                          onMouseDown={e => { e.preventDefault(); execFmt("removeFormat"); }}
                          className="w-6 h-6 rounded-full border-2 border-stone-300 flex items-center justify-center hover:scale-110 transition-transform">
                          <X className="w-3 h-3 text-stone-400" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Highlight */}
                <div className="relative">
                  <CtxItem icon={<Highlighter className="w-3.5 h-3.5"/>} label="Highlight" hasArrow
                    onClick={() => setCtxMenu(m => m ? { ...m, highlightOpen: !m.highlightOpen, fontColorOpen: false, headingOpen: false } : null)} />
                  {ctxMenu.highlightOpen && (
                    <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 p-2.5 flex gap-1.5 z-[10001]">
                      {HIGHLIGHT_COLORS.map(hc => (
                        <button key={hc.color} title={hc.label}
                          onMouseDown={e => { e.preventDefault(); execFmt("hiliteColor", hc.color); }}
                          className="w-6 h-6 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                          style={{ backgroundColor: hc.color }} />
                      ))}
                      <button title="Remove"
                        onMouseDown={e => { e.preventDefault(); execFmt("hiliteColor", "transparent"); }}
                        className="w-6 h-6 rounded-full border-2 border-stone-300 flex items-center justify-center hover:scale-110 transition-transform">
                        <X className="w-3 h-3 text-stone-400" />
                      </button>
                    </div>
                  )}
                </div>
                {/* Heading */}
                <div className="relative">
                  <CtxItem icon={<Heading1 className="w-3.5 h-3.5"/>} label="Heading" hasArrow
                    onClick={() => setCtxMenu(m => m ? { ...m, headingOpen: !m.headingOpen, highlightOpen: false, fontColorOpen: false } : null)} />
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
            )}
          </div>

          <div className="my-1 border-t border-stone-100" />
          {/* Font → side sub-card */}
          <div className="relative" ref={fontItemRef}>
            <CtxItem icon={<span className="w-3.5 h-3.5 flex items-center justify-center text-[11px] font-bold leading-none">Aa</span>} label="Font" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, fontOpen: !m.fontOpen, formatOpen: false, alignOpen: false, bulletOpen: false, dividerOpen: false, linkOpen: false, drawOpen: false } : null)} />
            {ctxMenu.fontOpen && (
              <div ref={fontSubCardRef} className="fixed bg-white rounded-2xl shadow-2xl border border-stone-200 p-3 z-[10001]" style={{ minWidth: 280, top: 0, left: 0 }}
                onMouseDown={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Font</span>
                  <span className="text-[10px] text-stone-400 italic">Select text → click to apply</span>
                </div>
                {/* Font Size */}
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Size</div>
                  <div className="flex rounded-md border border-stone-200 overflow-hidden text-[10px] font-semibold">
                    <button onMouseDown={e => { e.preventDefault(); setCtxFontSizeMode(ctxFontSizeMode === "all" ? "selected" : "all"); }}
                      className={`px-2 py-0.5 transition-colors ${ctxFontSizeMode === "all" ? "bg-indigo-500 text-white mode-glow" : "bg-white text-stone-500 hover:bg-indigo-50"}`}>All</button>
                    <button onMouseDown={e => { e.preventDefault(); setCtxFontSizeMode(ctxFontSizeMode === "selected" ? "all" : "selected"); }}
                      className={`px-2 py-0.5 transition-colors border-l border-stone-200 ${ctxFontSizeMode === "selected" ? "bg-indigo-500 text-white mode-glow" : "bg-white text-stone-500 hover:bg-indigo-50"}`}>Selected</button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <button onMouseDown={e => { e.preventDefault(); applyCtxFontSize(Math.max(8, ctxFontSize - 2), true); }}
                    className="w-7 h-7 rounded border border-stone-300 bg-white hover:bg-stone-100 text-stone-600 text-base font-bold flex items-center justify-center transition-colors">−</button>
                  <span className="w-12 text-center text-sm font-semibold text-stone-700">{ctxFontSize}px</span>
                  <button onMouseDown={e => { e.preventDefault(); applyCtxFontSize(Math.min(96, ctxFontSize + 2), true); }}
                    className="w-7 h-7 rounded border border-stone-300 bg-white hover:bg-stone-100 text-stone-600 text-base font-bold flex items-center justify-center transition-colors">+</button>
                </div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {[10, 12, 14, 16, 18, 20, 24, 28, 32, 48, 72].map(s => (
                    <button key={s} onMouseDown={e => { e.preventDefault(); applyCtxFontSize(s, true); }}
                      className={`h-6 px-1.5 text-[10px] font-semibold rounded border transition-colors ${ctxFontSize === s ? "bg-indigo-100 border-indigo-400 text-indigo-700" : "border-stone-200 hover:bg-indigo-50 text-stone-600"}`}>
                      {s}
                    </button>
                  ))}
                </div>
                {/* Font Family */}
                <div className="border-t border-stone-100 pt-3 mt-2">
                  <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Family</div>
                  <input value={ctxFontSearch} onChange={e => setCtxFontSearch(e.target.value)}
                    placeholder="Search font..."
                    className="w-full h-7 px-2 text-xs border border-stone-300 rounded bg-white focus:outline-none focus:border-indigo-400 mb-2" />
                  <div className="max-h-44 overflow-y-auto flex flex-col gap-0.5">
                    {FONTS_CTX.filter(f => f.toLowerCase().includes(ctxFontSearch.toLowerCase())).map(f => {
                      const isSelected = ctxSelectedFont === f;
                      return (
                        <button key={f}
                          onMouseDown={e => {
                            e.preventDefault();
                            if (isSelected) { setCtxSelectedFont(null); }
                            else { applyCtxFontName(f, true); setCtxSelectedFont(f); }
                          }}
                          className={`w-full text-left px-2 py-1 rounded-lg transition-colors flex items-center gap-2 ${isSelected ? "bg-indigo-50 border border-indigo-300 font-glow" : "hover:bg-indigo-50 border border-transparent"}`}>
                          <span className={`text-[11px] w-24 shrink-0 truncate ${isSelected ? "text-indigo-600 font-semibold" : "text-stone-400"}`}>{f}</span>
                          <span className={`text-sm truncate ${isSelected ? "text-indigo-700" : "text-stone-800"}`} style={{ fontFamily: f }}>Abc 123</span>
                          {isSelected && <span className="ml-auto text-indigo-400 text-[10px] font-semibold shrink-0">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="my-1 border-t border-stone-100" />
          {/* Align button → side sub-card */}
          <div className="relative">
            <CtxItem icon={<AlignLeft className="w-3.5 h-3.5"/>} label="Align" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, alignOpen: !m.alignOpen, formatOpen: false, bulletOpen: false, dividerOpen: false, linkOpen: false, drawOpen: false } : null)} />
            {ctxMenu.alignOpen && (
              <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-1.5 z-[10000] min-w-[160px]">
                <CtxItem icon={<AlignLeft className="w-3.5 h-3.5"/>}   label="Align Left"   onClick={() => execFmt("justifyLeft")} />
                <CtxItem icon={<AlignCenter className="w-3.5 h-3.5"/>} label="Align Center" onClick={() => execFmt("justifyCenter")} />
                <CtxItem icon={<AlignRight className="w-3.5 h-3.5"/>}  label="Align Right"  onClick={() => execFmt("justifyRight")} />
              </div>
            )}
          </div>

          <div className="border-t border-stone-100" />
          {/* Undo / Redo — same style as CtxItem, split 50/50 with divider */}
          <div className="flex">
            <button
              onMouseDown={e => { e.preventDefault(); universalUndo(); setCtxMenu(null); }}
              className="flex-1 flex items-center justify-center gap-2.5 px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 text-stone-700 transition-colors text-left text-xs font-medium">
              <Undo2 className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
              <span>Undo</span>
            </button>
            <div className="w-px bg-stone-100 my-1" />
            <button
              onMouseDown={e => { e.preventDefault(); universalRedo(); setCtxMenu(null); }}
              className="flex-1 flex items-center justify-center gap-2.5 px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 text-stone-700 transition-colors text-left text-xs font-medium">
              <Redo2 className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
              <span>Redo</span>
            </button>
          </div>

          <div className="my-1 border-t border-stone-100" />
          <CtxSection label="Attach" />
          <CtxItem icon={<CheckSquare className="w-3.5 h-3.5"/>} label="To-Do Item" onClick={() => { insertTodo(); setCtxMenu(null); }} />
          {/* Table → side sub-card with grid picker */}
          <div className="relative" ref={tableItemRef}>
            <CtxItem icon={<Table className="w-3.5 h-3.5"/>} label="Table" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, tableOpen: !m.tableOpen, formatOpen: false, alignOpen: false, bulletOpen: false, dividerOpen: false, linkOpen: false, drawOpen: false } : null)} />
            {ctxMenu.tableOpen && (
              <div ref={tableSubCardRef} className="fixed bg-white rounded-xl shadow-2xl border border-stone-200 p-3 z-[10000]" style={{ minWidth: 230, top: 0, left: 0 }}
                onMouseDown={e => e.stopPropagation()}>
                {/* Grid hover picker */}
                <div className="text-[11px] font-semibold text-stone-400 mb-2 text-center">
                  {ctxTableHover ? `${ctxTableHover.r} × ${ctxTableHover.c} Table` : "Hover to pick size"}
                </div>
                <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(10, 1fr)" }}
                  onMouseLeave={() => setCtxTableHover(null)}>
                  {Array.from({ length: 10 }, (_, ri) =>
                    Array.from({ length: 10 }, (_, ci) => {
                      const r = ri + 1; const c = ci + 1;
                      const isHighlighted = ctxTableHover ? r <= ctxTableHover.r && c <= ctxTableHover.c : false;
                      return (
                        <div key={`${r}-${c}`}
                          className={`w-5 h-5 border cursor-pointer transition-colors rounded-sm ${isHighlighted ? "bg-orange-200 border-orange-400" : "bg-stone-100 border-stone-300 hover:bg-orange-100 hover:border-orange-300"}`}
                          onMouseEnter={() => setCtxTableHover({ r, c })}
                          onClick={() => { if (ctxTableHover) insertTableWithSize(ctxTableHover.r, ctxTableHover.c); }}
                        />
                      );
                    })
                  )}
                </div>
                <div className="text-[10px] text-stone-400 text-center mt-1.5">Max 10 × 10 (grid)</div>
                {/* Custom size */}
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <div className="text-[11px] font-semibold text-stone-400 mb-2 text-center">Custom</div>
                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="text-[11px] text-stone-400">Rows</span>
                    <input type="number" min={1} value={ctxTableCustomRows} placeholder="—"
                      onChange={e => setCtxTableCustomRows(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          const r = parseInt(ctxTableCustomRows); const c = parseInt(ctxTableCustomCols);
                          if (!isNaN(r) && !isNaN(c) && r >= 1 && c >= 1) insertTableWithSize(Math.min(r, 999), Math.min(c, 200));
                        }
                      }}
                      className="w-14 h-6 text-center text-[12px] border border-stone-300 rounded bg-white focus:outline-none focus:border-orange-400" />
                    <span className="text-[11px] text-stone-400">Cols</span>
                    <input type="number" min={1} max={200} value={ctxTableCustomCols} placeholder="—"
                      onChange={e => setCtxTableCustomCols(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          const r = parseInt(ctxTableCustomRows); const c = parseInt(ctxTableCustomCols);
                          if (!isNaN(r) && !isNaN(c) && r >= 1 && c >= 1) insertTableWithSize(Math.min(r, 999), Math.min(c, 200));
                        }
                      }}
                      className="w-14 h-6 text-center text-[12px] border border-stone-300 rounded bg-white focus:outline-none focus:border-orange-400" />
                    <button
                      onClick={() => {
                        const r = parseInt(ctxTableCustomRows); const c = parseInt(ctxTableCustomCols);
                        if (!isNaN(r) && !isNaN(c) && r >= 1 && c >= 1) insertTableWithSize(Math.min(r, 999), Math.min(c, 200));
                      }}
                      className="h-6 px-2.5 text-[11px] font-semibold rounded bg-orange-400 text-white hover:bg-orange-500 transition-colors">Apply</button>
                  </div>
                  <div className="text-[10px] text-stone-400 text-center mt-1.5">Rows: unlimited · Cols: max 200</div>
                </div>
              </div>
            )}
          </div>
          <CtxItem icon={<Table className="w-3.5 h-3.5"/>} label="Lined" onClick={() => { insertLined(); setCtxMenu(null); }} />
          {/* Bullet List → side sub-card with many styles */}
          <div className="relative">
            <CtxItem icon={<List className="w-3.5 h-3.5"/>} label="Bullet List" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, bulletOpen: !m.bulletOpen, formatOpen: false, alignOpen: false, dividerOpen: false, linkOpen: false, drawOpen: false } : null)} />
            {ctxMenu.bulletOpen && (
              <div className="absolute left-full bottom-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 px-2 z-[10000] min-w-[220px]">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-1 mb-1.5">Choose a list style</p>
                <button onClick={() => insertCustomBullet("ordered")}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-stone-700 text-xs font-medium transition-colors text-left">
                  <span className="text-sm font-semibold text-stone-500 w-6 text-center">1.</span>
                  <span>Number List</span>
                </button>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {[
                    { char: "●", label: "Disc" },
                    { char: "◎", label: "Ring" },
                    { char: "◉", label: "Bullseye" },
                    { char: "◈", label: "Diamond" },
                    { char: "☑", label: "Check Box" },
                    { char: "✔", label: "Tick" },
                    { char: "➤", label: "Arrow" },
                    { char: "➜", label: "Round Arrow" },
                    { char: "◘", label: "Square" },
                    { char: "♫", label: "Music" },
                    { char: "★", label: "Star" },
                    { char: "📞", label: "Phone" },
                    { char: "$", label: "Dollar" },
                    { char: "£", label: "Pound" },
                    { char: "»", label: "Guillemet" },
                    { char: "disc", label: "Default" },
                  ].map(({ char, label }) => (
                    <button key={char} title={label}
                      onClick={() => insertCustomBullet(char === "disc" ? "disc" : char)}
                      className="flex items-center justify-center h-8 w-full rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-stone-700 text-base transition-colors border border-stone-100 hover:border-indigo-200">
                      {char === "disc" ? "•" : char}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Divider Line → side sub-card with styles */}
          <div className="relative">
            <CtxItem icon={<Minus className="w-3.5 h-3.5"/>} label="Divider Line" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, dividerOpen: !m.dividerOpen, bulletOpen: false, formatOpen: false, alignOpen: false, linkOpen: false, drawOpen: false } : null)} />
            {ctxMenu.dividerOpen && (
              <div className="absolute left-full bottom-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 px-3 z-[10000] min-w-[200px]">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-2">Choose a divider style</p>
                {[
                  { key: "single", label: "Single Line",  preview: <div className="flex-1 border-t-2 border-stone-300" /> },
                  { key: "bold",   label: "Bold Line",    preview: <div className="flex-1 border-t-4 border-stone-500" /> },
                  { key: "thin",   label: "Thin Line",    preview: <div className="flex-1 border-t border-stone-300" /> },
                  { key: "double", label: "Double Line",  preview: <div className="flex-1" style={{ borderTop: "3px double #a8a29e" }} /> },
                  { key: "dashed", label: "Dashed Line",  preview: <div className="flex-1 border-t-2 border-dashed border-stone-400" /> },
                  { key: "dotted", label: "Dot Line",     preview: <div className="flex-1 border-t-2 border-dotted border-stone-400" /> },
                ].map(({ key, label, preview }) => (
                  <button key={key} onClick={() => insertDividerStyle(key)}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-stone-700 transition-colors text-left group">
                    <div className="flex items-center w-12">{preview}</div>
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Links → side sub-card with link types */}
          <div className="relative">
            <CtxItem icon={<Link className="w-3.5 h-3.5"/>} label="Links" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, linkOpen: !m.linkOpen, dividerOpen: false, bulletOpen: false, formatOpen: false, alignOpen: false, drawOpen: false } : null)} />
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
          {/* Media → sub-card */}
          <div className="relative">
            <CtxItem icon={<ImagePlus className="w-3.5 h-3.5"/>} label="Media" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, mediaOpen: !m.mediaOpen, formatOpen: false, alignOpen: false, bulletOpen: false, dividerOpen: false, linkOpen: false, drawOpen: false, tableOpen: false, blockOpen: false } : null)} />
            {ctxMenu.mediaOpen && (
              <div className="absolute left-full bottom-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 px-2 z-[10000] min-w-[170px]">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-1 mb-1.5">Choose Media Type</p>
                <button onClick={() => { setCtxMenu(null); imgInputRef.current?.click(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-indigo-50 text-stone-700 text-left transition-colors">
                  <span className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <ImagePlus className="w-3.5 h-3.5 text-indigo-600" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-stone-700">Image</div>
                    <div className="text-[10px] text-stone-400">Upload a photo</div>
                  </div>
                </button>
                <button onClick={() => { setCtxMenu(null); voiceInputRef.current?.click(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-rose-50 text-stone-700 text-left transition-colors">
                  <span className="w-6 h-6 rounded-md bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <Mic className="w-3.5 h-3.5 text-rose-500" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-stone-700">Voice</div>
                    <div className="text-[10px] text-stone-400">Record audio</div>
                  </div>
                </button>
                <div className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-left opacity-50 cursor-not-allowed select-none">
                  <span className="w-6 h-6 rounded-md bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Video className="w-3.5 h-3.5 text-violet-500" />
                  </span>
                  <div>
                    <div className="text-xs font-semibold text-stone-700">Video</div>
                    <div className="text-[10px] text-stone-400">Coming soon</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Draw → sub-card */}
          <div className="relative">
            <CtxItem
              icon={<PenLine className="w-3.5 h-3.5"/>}
              label={drawTool ? `Drawing: ${DRAW_TOOL_LABELS[drawTool]}` : "Draw"}
              hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, drawOpen: !m.drawOpen, formatOpen: false, alignOpen: false, bulletOpen: false, dividerOpen: false, linkOpen: false } : null)}
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
                    <button
                      onClick={() => { setDrawTool(null); setCtxMenu(null); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 mt-1 rounded-lg border border-stone-100 hover:bg-stone-50 text-stone-500 hover:text-stone-700 text-xs font-medium transition-colors">
                      <X className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Stop Drawing</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Graph → sub-card */}
          <div className="relative">
            <CtxItem icon={<BarChart2 className="w-3.5 h-3.5"/>} label="Graph" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, graphOpen: !m.graphOpen, drawOpen: false, formatOpen: false, alignOpen: false, bulletOpen: false, dividerOpen: false, linkOpen: false, tableOpen: false, blockOpen: false, mediaOpen: false } : null)} />
            {ctxMenu.graphOpen && (
              <div className="absolute left-full bottom-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 px-2 z-[10000] min-w-[190px]">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-1 mb-1.5">Choose Chart Type</p>
                {[
                  { type: "bar"  as GraphType, label: "Bar Chart",  icon: "▬", color: "text-indigo-600",  bg: "hover:bg-indigo-50",  dot: "bg-indigo-500" },
                  { type: "line" as GraphType, label: "Line Chart", icon: "〜", color: "text-emerald-600", bg: "hover:bg-emerald-50", dot: "bg-emerald-500" },
                  { type: "area" as GraphType, label: "Area Chart", icon: "◿", color: "text-blue-600",    bg: "hover:bg-blue-50",    dot: "bg-blue-500" },
                  { type: "pie"  as GraphType, label: "Pie Chart",  icon: "◔", color: "text-amber-600",   bg: "hover:bg-amber-50",   dot: "bg-amber-500" },
                ].map(({ type, label, icon, color, bg, dot }) => (
                  <button key={type} onClick={() => insertGraph(type)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg ${bg} text-stone-700 transition-colors text-left`}>
                    <span className={`w-5 h-5 rounded-full ${dot} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>{icon}</span>
                    <span className={`text-xs font-medium ${color}`}>{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Block picker */}
          <div className="relative">
            <CtxItem icon={<ChevronRight className="w-3.5 h-3.5"/>} label="Block" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, blockOpen: !m.blockOpen, formatOpen: false, alignOpen: false, bulletOpen: false, dividerOpen: false, linkOpen: false, drawOpen: false, tableOpen: false } : null)} />
            {ctxMenu.blockOpen && (
              <div className="fixed bg-white rounded-xl shadow-2xl border border-stone-200 p-2 z-[10000]"
                style={{ minWidth: 220, top: ctxMenu.y, left: ctxMenu.x + 200 }}
                onMouseDown={e => e.stopPropagation()}>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2 pb-1.5">Choose Block Type</div>
                {/* Quote Block */}
                <button onMouseDown={e => { e.preventDefault(); insertBorderBlock(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-indigo-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <img src={quoteIcon} alt="quote block" className="w-6 h-6" />
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold text-stone-700 group-hover:text-indigo-700">Quote Block</div>
                  </div>
                </button>
                {/* Callout Block */}
                <button onMouseDown={e => {
                    e.preventDefault();
                    if (calloutPickerPos) { setCalloutPickerPos(null); return; }
                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    setCalloutPickerPos({ top: rect.top, left: rect.right + 8 });
                  }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-blue-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <img src={bulbIcon} alt="callout" className="w-6 h-6" />
                  </span>
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold text-stone-700 group-hover:text-blue-700">Callout Block</div>
                  </div>
                  <span className="text-stone-400 text-[10px]">▶</span>
                </button>
                {/* Sticky Note */}
                <button onMouseDown={e => { e.preventDefault(); insertStickyNote(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-yellow-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <img src={pinIcon} alt="pin" className="w-7 h-7" />
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold text-stone-700 group-hover:text-yellow-700">Sticky Note</div>
                  </div>
                </button>
                {/* Card */}
                <button onMouseDown={e => { e.preventDefault(); insertCardBlock(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-stone-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <img src={cardIcon} alt="card" className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold text-stone-700 group-hover:text-stone-900">Card</div>
                  </div>
                </button>
                {/* Numbered List */}
                <button onMouseDown={e => { e.preventDefault(); insertNumberedListBlock(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-stone-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <img src={numberIcon} alt="numbered list" className="w-7 h-7" />
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold text-stone-700">Numbered List</div>
                  </div>
                </button>
                {/* Two Column */}
                <button onMouseDown={e => { e.preventDefault(); insertTwoColumnBlock(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-slate-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <img src={columnIcon} alt="two column" className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold text-stone-700">Two Column</div>
                  </div>
                </button>
                {/* Code Block */}
                <button onMouseDown={e => { e.preventDefault(); insertCodeBlock(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-zinc-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <img src={codeIcon} alt="code block" className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold text-stone-700">Code Block</div>
                  </div>
                </button>
                {/* Definition Block */}
                <button onMouseDown={e => { e.preventDefault(); insertDefinitionBlock(); }}
                  className="w-full flex items-center gap-2.5 px-2 py-1 rounded-lg hover:bg-amber-50 text-left group transition-colors">
                  <span className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                    <img src={definitionIcon} alt="definition" className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="text-[11px] font-semibold text-stone-700">Definition</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Project Transfer */}
          <div className="my-1 border-t border-stone-100" />
          <CtxItem
            icon={<ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />}
            label="Project Transfer"
            onClick={() => { setCtxMenu(null); setShowTransferCard(true); }}
          />
        </div>
      )}

      {/* ── Project Transfer Card ── */}
      {showTransferCard && activeProject && (
        <>
          <div className="fixed inset-0 z-[9990]" onClick={() => setShowTransferCard(false)} />
          <div className="fixed z-[9991] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl border border-stone-200 w-[300px] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <span className="text-sm font-bold text-stone-800">Project Transfer</span>
              </div>
              <button onClick={() => setShowTransferCard(false)} className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Body */}
            <div className="p-3 flex flex-col gap-2">
              {/* Download */}
              <button
                onClick={downloadProject}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 transition-all group text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <FileDown className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-indigo-700">Download Project</div>
                  <div className="text-[11px] text-indigo-400 mt-0.5">Save as <span className="font-mono">.nbproject</span> file</div>
                </div>
              </button>
              {/* Upload */}
              <button
                onClick={() => transferUploadRef.current?.click()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 transition-all group text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <FileUp className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-emerald-700">Upload Project</div>
                  <div className="text-[11px] text-emerald-400 mt-0.5">Restore from <span className="font-mono">.nbproject</span> file</div>
                </div>
              </button>
            </div>
            {/* Footer note */}
            <div className="px-4 pb-3 text-[10px] text-stone-400 text-center">
              All content, images & audio are preserved in the file
            </div>
          </div>
        </>
      )}

      {/* ── Independent floating font panel ── */}
      {fontPanelOpen && (
        <div ref={fontPanelRef}
          className="fixed z-[10001] bg-white rounded-2xl shadow-2xl border border-stone-200 p-3"
          style={{ minWidth: 280, top: Math.min(fontPanelPos.y, window.innerHeight - 480), left: Math.min(fontPanelPos.x, window.innerWidth - 295) }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Font</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-stone-400 italic">Select text → click to apply</span>
              <button onMouseDown={e => { e.preventDefault(); setFontPanelOpen(false); setCtxSelectedFont(null); }}
                className="w-5 h-5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-600 flex items-center justify-center transition-colors text-xs font-bold">✕</button>
            </div>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Size</div>
            <div className="flex rounded-md border border-stone-200 overflow-hidden text-[10px] font-semibold">
              <button
                onMouseDown={e => { e.preventDefault(); setCtxFontSizeMode(ctxFontSizeMode === "all" ? "selected" : "all"); }}
                className={`px-2 py-0.5 transition-colors ${ctxFontSizeMode === "all" ? "bg-indigo-500 text-white mode-glow" : "bg-white text-stone-500 hover:bg-indigo-50"}`}>
                All
              </button>
              <button
                onMouseDown={e => { e.preventDefault(); setCtxFontSizeMode(ctxFontSizeMode === "selected" ? "all" : "selected"); }}
                className={`px-2 py-0.5 transition-colors border-l border-stone-200 ${ctxFontSizeMode === "selected" ? "bg-indigo-500 text-white mode-glow" : "bg-white text-stone-500 hover:bg-indigo-50"}`}>
                Selected
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <button onMouseDown={e => { e.preventDefault(); applyCtxFontSize(Math.max(8, ctxFontSize - 2), true); }}
              className="w-7 h-7 rounded border border-stone-300 bg-white hover:bg-stone-100 text-stone-600 text-base font-bold flex items-center justify-center transition-colors">−</button>
            <span className="w-12 text-center text-sm font-semibold text-stone-700">{ctxFontSize}px</span>
            <button onMouseDown={e => { e.preventDefault(); applyCtxFontSize(Math.min(96, ctxFontSize + 2), true); }}
              className="w-7 h-7 rounded border border-stone-300 bg-white hover:bg-stone-100 text-stone-600 text-base font-bold flex items-center justify-center transition-colors">+</button>
          </div>
          <div className="flex flex-wrap gap-1 mb-1">
            {[10, 12, 14, 16, 18, 20, 24, 28, 32, 48, 72].map(s => (
              <button key={s} onMouseDown={e => { e.preventDefault(); applyCtxFontSize(s, true); }}
                className={`h-6 px-1.5 text-[10px] font-semibold rounded border transition-colors ${ctxFontSize === s ? "bg-indigo-100 border-indigo-400 text-indigo-700" : "border-stone-200 hover:bg-indigo-50 text-stone-600"}`}>
                {s}
              </button>
            ))}
          </div>

          {/* Font Family */}
          <div className="border-t border-stone-100 pt-3 mt-2">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Family</div>
            <input
              value={ctxFontSearch}
              onChange={e => setCtxFontSearch(e.target.value)}
              placeholder="Search font..."
              className="w-full h-7 px-2 text-xs border border-stone-300 rounded bg-white focus:outline-none focus:border-indigo-400 mb-2"
            />
            <div className="max-h-44 overflow-y-auto flex flex-col gap-0.5">
              {FONTS_CTX.filter(f => f.toLowerCase().includes(ctxFontSearch.toLowerCase())).map(f => {
                const isSelected = ctxSelectedFont === f;
                return (
                  <button key={f}
                    onMouseDown={e => {
                      e.preventDefault();
                      if (isSelected) {
                        setCtxSelectedFont(null);
                      } else {
                        applyCtxFontName(f, true);
                        setCtxSelectedFont(f);
                      }
                    }}
                    className={`w-full text-left px-2 py-1 rounded-lg transition-colors flex items-center gap-2 ${
                      isSelected
                        ? "bg-indigo-50 border border-indigo-300 font-glow"
                        : "hover:bg-indigo-50 border border-transparent"
                    }`}>
                    <span className={`text-[11px] w-24 shrink-0 truncate ${isSelected ? "text-indigo-600 font-semibold" : "text-stone-400"}`}>{f}</span>
                    <span className={`text-sm truncate ${isSelected ? "text-indigo-700" : "text-stone-800"}`} style={{ fontFamily: f }}>Abc 123</span>
                    {isSelected && <span className="ml-auto text-indigo-400 text-[10px] font-semibold shrink-0">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Editor styles */}
      <style>{`
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        [data-placeholder]:empty:before { content: attr(data-placeholder); color: #c0bdb8; pointer-events: none; }
        [data-link-url]:empty:before { content: attr(data-placeholder); color: #aab0bb; font-style: italic; pointer-events: none; text-decoration: none; }
        [contenteditable] h1 { font-size: 32px; font-weight: 700; margin: 0.5em 0 0.25em; line-height: 1.2; }
        [contenteditable] h2 { font-size: 24px; font-weight: 700; margin: 0.5em 0 0.25em; line-height: 1.3; }
        [contenteditable] h3 { font-size: 19px; font-weight: 600; margin: 0.4em 0 0.2em; line-height: 1.4; }
        [contenteditable] ul { list-style-type: disc; padding-left: 1.5em; margin: 4px 0; }
        [contenteditable] ol { list-style-type: decimal; padding-left: 1.5em; margin: 4px 0; }
        .img-blk-locked .img-lock-btn { opacity: 0; }
        .img-blk-locked:hover .img-lock-btn { opacity: 1; }
        @keyframes font-glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.25); border-color: #a5b4fc; }
          50% { box-shadow: 0 0 0 3px rgba(99,102,241,0.18); border-color: #6366f1; }
        }
        .font-glow { animation: font-glow-pulse 1.6s ease-in-out infinite; }
        @keyframes mode-glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4); }
          50% { box-shadow: 0 0 0 4px rgba(99,102,241,0.22); }
        }
        .mode-glow { animation: mode-glow-pulse 1.4s ease-in-out infinite; }
      `}</style>

      {/* Callout Block floating sub-picker */}
      {calloutPickerPos && (
        <div
          ref={calloutPickerRef}
          className="fixed z-[20000] p-2.5 rounded-xl border border-stone-200 bg-white shadow-2xl grid grid-cols-2 gap-1.5"
          style={{ top: calloutPickerPos.top, left: calloutPickerPos.left, minWidth: 180 }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="col-span-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest px-1 pb-1">Choose Type</div>
          <button onMouseDown={e => { e.preventDefault(); insertCalloutBlock("info"); setCalloutPickerPos(null); }}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors">
            <span className="text-sm">ℹ️</span>
            <span className="text-[11px] font-semibold text-blue-700">Info</span>
          </button>
          <button onMouseDown={e => { e.preventDefault(); insertCalloutBlock("warning"); setCalloutPickerPos(null); }}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 transition-colors">
            <span className="text-sm">⚠️</span>
            <span className="text-[11px] font-semibold text-yellow-700">Warning</span>
          </button>
          <button onMouseDown={e => { e.preventDefault(); insertCalloutBlock("success"); setCalloutPickerPos(null); }}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200 transition-colors">
            <span className="text-sm">✅</span>
            <span className="text-[11px] font-semibold text-green-700">Success</span>
          </button>
          <button onMouseDown={e => { e.preventDefault(); insertCalloutBlock("error"); setCalloutPickerPos(null); }}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 transition-colors">
            <span className="text-sm">❌</span>
            <span className="text-[11px] font-semibold text-red-600">Error</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ── DrawShapeEl: renders a single shape in the SVG overlay ────────
function DrawShapeEl({ shape, isPreview, eraserMode, onRemove }: {
  shape: ArrowShape; isPreview: boolean; eraserMode: boolean; onRemove?: () => void;
}) {
  const { x1, y1, x2, y2, color } = shape;
  const type = shape.type ?? "arrow";
  const stroke = color;
  const sw = 2.5;
  const canClick = !isPreview && eraserMode && onRemove;
  const ptrEvents: React.CSSProperties["pointerEvents"] = canClick ? "auto" : "none";
  const cursor = canClick ? "inherit" : "default";
  const opacity = isPreview ? 0.55 : 1;
  const previewDash = isPreview ? "6 3" : undefined;

  const common = { stroke, strokeWidth: sw, fill: "none" as const, opacity, style: { pointerEvents: ptrEvents, cursor }, onClick: canClick ? onRemove : undefined } as const;

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
      const rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
      return <rect {...common} x={rx} y={ry} width={rw} height={rh} strokeDasharray={previewDash} />;
    }
    case "circle": {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const rx2 = Math.abs(x2 - x1) / 2, ry2 = Math.abs(y2 - y1) / 2;
      return <ellipse {...common} cx={cx} cy={cy} rx={Math.max(rx2, 1)} ry={Math.max(ry2, 1)} strokeDasharray={previewDash} />;
    }
    case "triangle": {
      const pts = `${(x1 + x2) / 2},${Math.min(y1, y2)} ${Math.max(x1, x2)},${Math.max(y1, y2)} ${Math.min(x1, x2)},${Math.max(y1, y2)}`;
      return <polygon {...common} points={pts} strokeDasharray={previewDash} />;
    }
    case "arc": {
      const lx = Math.min(x1, x2), rx3 = Math.max(x1, x2);
      const ry2 = Math.abs(y2 - y1) / 2;
      const rx2 = Math.abs(x2 - x1) / 2;
      const maxY = Math.max(y1, y2);
      const d = `M ${lx} ${maxY} A ${Math.max(rx2, 1)} ${Math.max(ry2, 1)} 0 0 1 ${rx3} ${maxY}`;
      return <path {...common} d={d} strokeDasharray={previewDash} />;
    }
    case "diamond": {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const hw = Math.abs(x2 - x1) / 2, hh = Math.abs(y2 - y1) / 2;
      const pts = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
      return <polygon {...common} points={pts} strokeDasharray={previewDash} />;
    }
    case "star": {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const outerR = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
      const innerR = outerR * 0.42;
      const pts = Array.from({ length: 10 }, (_, i) => {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(" ");
      return <polygon {...common} points={pts} strokeDasharray={previewDash} />;
    }
    case "double": {
      return <line {...common} x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={previewDash} markerStart="url(#ah-start)" markerEnd="url(#ah-red)" />;
    }
    case "cross": {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const d = `M ${x1} ${cy} L ${x2} ${cy} M ${cx} ${y1} L ${cx} ${y2}`;
      return <path {...common} d={d} strokeDasharray={previewDash} />;
    }
    case "pentagon": {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
      const r = Math.min(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
      const pts = Array.from({ length: 5 }, (_, i) => {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(" ");
      return <polygon {...common} points={pts} strokeDasharray={previewDash} />;
    }
    case "cylinder":
    case "cube":
    case "octahedron":
    case "triprism":
    case "hexprism":
    case "pentprism":
    case "pyramid":
    case "tripyramid": {
      const iconMap: Record<string, string> = {
        cylinder: cylinderIcon,
        cube: cubeIcon,
        octahedron: octahedronIcon,
        triprism: triPrismIcon,
        hexprism: hexPrismIcon,
        pentprism: pentPrismIcon,
        pyramid: pyramidIcon,
        tripyramid: triPyramidIcon,
      };
      const rx = Math.min(x1, x2), ry = Math.min(y1, y2);
      const rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
      return (
        <image
          href={iconMap[type]}
          x={rx} y={ry}
          width={Math.max(rw, 1)} height={Math.max(rh, 1)}
          opacity={opacity}
          style={{ pointerEvents: ptrEvents, cursor }}
          onClick={canClick ? onRemove : undefined}
        />
      );
    }
    default:
      return null;
  }
}

// ── Helper components ─────────────────────────────────────────────
function CtxSection({ label }: { label: string }) {
  return (
    <div className="px-3 pt-1 pb-0.5">
      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function CtxItem({ icon, label, shortcut, hasArrow, onClick }: {
  icon: React.ReactNode; label: string; shortcut?: string; hasArrow?: boolean; onClick: () => void;
}) {
  return (
    <button onMouseDown={e => { e.preventDefault(); onClick(); }}
      className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-indigo-50 hover:text-indigo-700 text-stone-700 transition-colors text-left">
      <span className="text-stone-400 flex-shrink-0">{icon}</span>
      <span className="text-xs font-medium flex-1">{label}</span>
      {shortcut && <span className="text-[10px] text-stone-400 flex-shrink-0">{shortcut}</span>}
      {hasArrow && <ChevronRight className="w-3 h-3 text-stone-400 flex-shrink-0" />}
    </button>
  );
}
