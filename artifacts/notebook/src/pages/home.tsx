import { Link, useLocation } from "wouter";
import ProjectView, {
  type ProjectDoc,
  loadProjects,
  saveProjects,
  nextProjectId,
  DEFAULT_PROJECT_GRADIENT,
} from "@/pages/project-view";
import {
  Plus, Trash2, ImagePlus, X, Search, Download, Upload,
  BookOpen, FileText, Lock, LockOpen, Eye, EyeOff, User,
  Camera, Pencil, Home as HomeIcon, ChevronLeft, ChevronRight,
  Check, BookMarked, Clock, StickyNote, FolderKanban,
  CheckSquare, CalendarDays, UserRound, AlertTriangle,
  Smile, Image as ImageIcon, Type, List, Mic, Square, Play, Pause, ListTodo, Brain,
  Copy, Clipboard,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { store, type Book } from "@/lib/store";

interface ProfileData {
  name: string;
  username: string;
  email: string;
  photo: string;
  premium: boolean;
  joinedAt: string;
}

const PROFILE_KEY = "nb_profile";

function loadProfile(): ProfileData {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { name: "", username: "", email: "", photo: "", premium: false, joinedAt: new Date().toISOString().slice(0, 7) };
}
function saveProfile(p: ProfileData) { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }

const DEFAULT_COVER_IMAGES = [
  { id: "galaxy",   label: "Galaxy",   url: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=300&q=80" },
  { id: "mountain", label: "Mountain", url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80" },
  { id: "ocean",    label: "Ocean",    url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=300&q=80" },
  { id: "forest",   label: "Forest",   url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=300&q=80" },
  { id: "flowers",  label: "Flowers",  url: "https://images.unsplash.com/photo-1490750967868-88df5691cc77?w=300&q=80" },
  { id: "aurora",   label: "Aurora",   url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=300&q=80" },
  { id: "desert",   label: "Desert",   url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=300&q=80" },
  { id: "abstract", label: "Abstract", url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=300&q=80" },
];

const PRESET_COLORS = [
  "#3b5bdb", "#1971c2", "#0ca678", "#2f9e44",
  "#e8590c", "#c2255c", "#9c36b5", "#1e293b",
  "#7c3aed", "#b45309", "#374151", "#be123c",
];

const COVER_PATTERNS = [
  { id: "solid",    label: "Solid" },
  { id: "dots",     label: "Dots" },
  { id: "lines",    label: "Lines" },
  { id: "grid",     label: "Grid" },
  { id: "diagonal", label: "Diagonal" },
  { id: "waves",    label: "Waves" },
  { id: "cross",    label: "Cross" },
  { id: "marble",   label: "Marble" },
];

function patternStyle(pattern: string, color: string): React.CSSProperties {
  const base: React.CSSProperties = { backgroundColor: color };
  switch (pattern) {
    case "dots":      return { ...base, backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`, backgroundSize: "12px 12px" };
    case "lines":     return { ...base, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 11px)` };
    case "grid":      return { ...base, backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`, backgroundSize: "12px 12px" };
    case "diagonal":  return { ...base, backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.18) 8px, rgba(255,255,255,0.18) 9px)` };
    case "waves":     return { ...base, backgroundImage: `repeating-radial-gradient(ellipse at 0% 50%, transparent 0px, transparent 7px, rgba(255,255,255,0.18) 7px, rgba(255,255,255,0.18) 8px)` };
    case "cross":     return { ...base, backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`, backgroundSize: "24px 24px, 24px 24px, 6px 6px, 6px 6px" };
    case "marble":    return { ...base, backgroundImage: `repeating-linear-gradient(105deg, transparent, transparent 10px, rgba(255,255,255,0.12) 10px, rgba(255,255,255,0.12) 11px), repeating-linear-gradient(195deg, transparent, transparent 14px, rgba(255,255,255,0.08) 14px, rgba(255,255,255,0.08) 15px)` };
    default:          return base;
  }
}

function coverStyle(pattern: string, color: string, coverImg?: string): React.CSSProperties {
  if (coverImg) return { backgroundImage: `url(${coverImg})`, backgroundSize: "cover", backgroundPosition: "center" };
  return patternStyle(pattern, color);
}


const COLS = 6;

// ── Short Notes ──────────────────────────────────────────────
const SHORT_NOTES_KEY = "nb_short_notes";

interface ShortNote {
  id: number;
  title: string;
  body: string;
  color: string;
  priority?: "low" | "normal" | "medium" | "important" | "urgent";
  images?: { src: string; x: number; y: number; w: number }[];
  voices?: { name: string; data: string }[];
  createdAt: string;
  updatedAt: string;
}

const NOTE_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca",
  "#e9d5ff", "#fed7aa", "#f5f5f4", "#cffafe",
];

const EMOJI_CATEGORIES = [
  { icon: "😀", name: "Smileys", emojis: ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","😵","🤯","🤠","🥸","😎","🧐","😕","😟","🙁","☹️","😮","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾"] },
  { icon: "👍", name: "People", emojis: ["👋","🤚","🖐","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","☝️","👇","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦵","🦶","👄","💋","👃","👂","👁","👀","🧠","👣","🫂","💏","💑","👪","👧","👦","👶","👩","👨","🧑","👴","👵","👮","💂","🧑‍⚕️","👩‍🍳","🧑‍🎓","🧑‍🎤","🧑‍🎨","🧑‍✈️","🧑‍🚒","🧑‍🚀","🧑‍⚖️","🧑‍💻","🧑‍🔬","🧑‍🏫","🧑‍🌾","🧑‍🔧","🧑‍🏭","🧑‍💼"] },
  { icon: "🐶", name: "Animals", emojis: ["🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐜","🦟","🦗","🕷","🦂","🐢","🐍","🦎","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦍","🐘","🦒","🦘","🐕","🐩","🐈","🦜","🐇","🦔","🌵","🌲","🌳","🌴","🍀","🌾","💐","🌷","🌹","🌺","🌸","🌼","🌻","🍄","🌙","⭐","🌟","✨","🌈","🌊","🔥","💧","❄️","⚡","🌀"] },
  { icon: "🍕", name: "Food", emojis: ["🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🫐","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥕","🌽","🌶","🥔","🍠","🥐","🥯","🍞","🥖","🧀","🥚","🍳","🥞","🧇","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🌮","🌯","🥗","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🍤","🍙","🍚","🍘","🧁","🍰","🎂","🍮","🍭","🍬","🍫","🍿","🍩","🍪","🍯","☕","🍵","🧃","🥤","🧋","🍺","🍻","🥂","🍷","🥃","🍸","🍹","🧊"] },
  { icon: "⚽", name: "Sports", emojis: ["⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🎱","🏓","🏸","🏒","🏑","🥍","🏏","⛳","🎣","🤿","🥊","🥋","🎽","🛹","🛷","⛸","🥌","🎿","⛷","🏂","🪂","🏋️","🤼","🤸","⛹","🏊","🚴","🏆","🥇","🥈","🥉","🏅","🎖","🏵","🎗","🎫","🎟","🎪","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🎻","🎲","♟","🎯","🎳","🎮","🎰","🧩"] },
  { icon: "✈️", name: "Travel", emojis: ["🚗","🚕","🚙","🚌","🏎","🚓","🚑","🚒","🛻","🚚","🚛","🏍","🛵","🚲","🛴","⛽","🚦","⚓","⛵","🚤","🛳","✈️","🛩","🛫","🛬","💺","🚁","🚀","🛸","🪐","🗺","🧭","🏔","⛰","🌋","🏕","🏖","🏜","🏝","🏟","🏛","🏠","🏡","🏢","🏥","🏦","🏨","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽","⛪","🕌","⛩","⛲","⛺","🌃","🏙","🌄","🌅","🌆","🌇","🌉","🎡","🎢","🎠","🎪"] },
  { icon: "💡", name: "Objects", emojis: ["⌚","📱","💻","⌨️","🖥","🖨","🖱","🕹","💾","💿","📀","📷","📸","📹","🎥","📞","☎️","📺","📻","🧭","⏰","⌛","⏳","📡","🔋","🔌","💡","🔦","🕯","💰","🪙","💳","✉️","📧","📝","📁","📂","📅","📌","📍","✂️","🔒","🔓","🔑","🗝","🔨","⚒","🛠","🔧","🔩","⚙️","⚖️","🔗","🧲","⚗️","🔬","🔭","💉","💊","🩹","🚪","🛋","🚿","🛁","🧴","🧹","🧺","🧻","🧼","🛒","🎁","🎀","🎊","🎉","🎈","🎆","🎇","✨","🧸","🖼","🧶","🧵"] },
  { icon: "❤️", name: "Symbols", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","💕","💞","💓","💗","💖","💘","💝","💟","☮️","✝️","☪️","🕉","☯️","✡️","🛐","💯","✅","❌","⭕","🛑","⛔","📛","🚫","💢","⚠️","♻️","✔️","🔴","🟠","🟡","🟢","🔵","🟣","⚫","⚪","🟤","🔷","🔶","🔹","🔸","🟥","🟧","🟨","🟩","🟦","🟪","⬛","⬜","🔈","🔉","🔊","🔔","🔕","📣","📢","💬","💭","🗯","♠️","♣️","♥️","♦️","🃏","🎲","🎯","➕","➖","➗","✖️","💲","™️","©️","®️","🔄","🔀","🔁","🔂","▶️","⏸","⏹","⏺","🔅","🔆","🔱","⚜️","🔰","♾"] },
];

function loadShortNotes(): ShortNote[] {
  try { const r = localStorage.getItem(SHORT_NOTES_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveShortNotes(notes: ShortNote[]) {
  localStorage.setItem(SHORT_NOTES_KEY, JSON.stringify(notes));
}
function nextNoteId(notes: ShortNote[]): number {
  return notes.reduce((m, n) => Math.max(m, n.id), 0) + 1;
}
// ─────────────────────────────────────────────────────────────

// ── Day Tasks ─────────────────────────────────────────────────
const DAY_TASK_TYPES_KEY = "nb_v2_task_types";

interface DayTaskType { id: number; name: string; }

type DayPriority = "low" | "normal" | "medium" | "important" | "urgent" | null;

interface DayTask {
  id: number;
  title: string;
  hour: string;
  minute: string;
  ampm: "AM" | "PM";
  hasTime: boolean;
  priority: DayPriority;
  typeId: number | null;
  done: boolean;
  note: string;
  progress: number;
}

function getDateKey(d: Date): string { return d.toISOString().slice(0, 10); }
function getDayStorageKey(date: string) { return `nb_day_tasks_${date}`; }

function loadDayTasks(date: string): DayTask[] {
  try { const r = localStorage.getItem(getDayStorageKey(date)); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveDayTasksStore(date: string, tasks: DayTask[]) {
  localStorage.setItem(getDayStorageKey(date), JSON.stringify(tasks));
}
function loadDayTaskTypes(): DayTaskType[] {
  try { const r = localStorage.getItem(DAY_TASK_TYPES_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveDayTaskTypes(types: DayTaskType[]) { localStorage.setItem(DAY_TASK_TYPES_KEY, JSON.stringify(types)); }
function nextDayTaskId(tasks: DayTask[]): number { return tasks.reduce((m, t) => Math.max(m, t.id), 0) + 1; }
function nextTypeId(types: DayTaskType[]): number { return types.reduce((m, t) => Math.max(m, t.id), 0) + 1; }

function get7Days(today: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i);
    return {
      key: getDateKey(d),
      label: String(d.getDate()).padStart(2, "0"),
      day: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase().slice(0, 3),
      isToday: i === 0,
    };
  });
}

function get15Days(today: Date) {
  return Array.from({ length: 15 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() + i);
    return {
      key: getDateKey(d),
      label: String(d.getDate()).padStart(2, "0"),
      day: d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase().slice(0, 3),
      isToday: i === 0,
    };
  });
}

const DAY_PRIORITY_META: Record<NonNullable<DayPriority>, { label: string; color: string; bg: string; border: string; dot: string; rowBg: string; bar: string }> = {
  low:       { label: "Low",       color: "#15803d", bg: "#bbf7d0", border: "#4ade80", dot: "#16a34a", rowBg: "#dcfce7", bar: "#16a34a" },
  normal:    { label: "Normal",    color: "#374151", bg: "#e5e7eb", border: "#6b7280", dot: "#4b5563", rowBg: "#f3f4f6", bar: "#6b7280" },
  medium:    { label: "Medium",    color: "#1d4ed8", bg: "#bfdbfe", border: "#60a5fa", dot: "#2563eb", rowBg: "#dbeafe", bar: "#2563eb" },
  important: { label: "Important", color: "#c2410c", bg: "#fed7aa", border: "#fb923c", dot: "#ea580c", rowBg: "#ffedd5", bar: "#ea580c" },
  urgent:    { label: "Urgent",    color: "#b91c1c", bg: "#fecaca", border: "#f87171", dot: "#dc2626", rowBg: "#fee2e2", bar: "#dc2626" },
};
// ─────────────────────────────────────────────────────────────

// ── Schedule ──────────────────────────────────────────────────
const SCHEDULE_KEY = "nb_schedule_notes";

function loadScheduleNotes(): Record<string, Record<number, string>> {
  try { const r = localStorage.getItem(SCHEDULE_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveScheduleNotes(data: Record<string, Record<number, string>>) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(data));
}
function loadScheduleCustomTimes(): Record<string, Record<number, string>> {
  try { const r = localStorage.getItem("nb_schedule_custom_times"); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveScheduleCustomTimes(data: Record<string, Record<number, string>>) {
  localStorage.setItem("nb_schedule_custom_times", JSON.stringify(data));
}
function loadScheduleCellColors(): Record<string, Record<number, string>> {
  try { const r = localStorage.getItem("nb_schedule_cell_colors"); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveScheduleCellColors(data: Record<string, Record<number, string>>) {
  localStorage.setItem("nb_schedule_cell_colors", JSON.stringify(data));
}
function loadSchedulePlanDone(): Record<string, Record<number, boolean>> {
  try { const r = localStorage.getItem("nb_schedule_plan_done"); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveSchedulePlanDone(data: Record<string, Record<number, boolean>>) {
  localStorage.setItem("nb_schedule_plan_done", JSON.stringify(data));
}
function loadSchedulePlanMode(): Record<string, { am: boolean; pm: boolean }> {
  try { const r = localStorage.getItem("nb_schedule_plan_mode"); return r ? JSON.parse(r) : {}; } catch { return {}; }
}
function saveSchedulePlanMode(data: Record<string, { am: boolean; pm: boolean }>) {
  localStorage.setItem("nb_schedule_plan_mode", JSON.stringify(data));
}

const SLOT_COLORS = [
  { label: "Urgent",    bg: "#fecaca", dot: "#ef4444" },
  { label: "Important", bg: "#fed7aa", dot: "#f97316" },
  { label: "Medium",    bg: "#fef08a", dot: "#eab308" },
  { label: "Normal",    bg: "#bbf7d0", dot: "#22c55e" },
  { label: "Low",       bg: "#bfdbfe", dot: "#3b82f6" },
];

function MiniCalendar({ year, month, selectedDate, onSelectDate, markedDates }: {
  year: number; month: number; selectedDate: string; onSelectDate: (d: string) => void;
  markedDates?: Map<string, string>;
}) {
  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);
  const grid: (number | null)[] = Array(35).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const pos = firstDay + d - 1;
    if (pos < 35) grid[pos] = d;
    else grid[pos - 35] = d;
  }
  const cells = grid;
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm h-full flex flex-col">
      <div className="text-sm font-bold text-stone-700 text-center mb-3 tracking-wide">
        {MONTH_NAMES[month]} {year}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center flex-1 content-start">
        {["S","M","T","W","T","F","S"].map((d, i) => (
          <div key={i} className="text-xs text-stone-400 font-semibold pb-1">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const isSel = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const scheduleBorderColor = markedDates?.get(dateStr);
          const hasSchedule = !!scheduleBorderColor;
          return (
            <button
              key={d}
              onClick={() => onSelectDate(dateStr)}
              className={`text-xs rounded-full w-7 h-7 flex items-center justify-center mx-auto transition-colors
                ${isSel ? "bg-stone-800 text-white font-bold" : isToday ? "bg-blue-100 text-blue-700 font-semibold" : hasSchedule ? "text-stone-700 font-semibold bg-stone-50" : "text-stone-600 hover:bg-stone-100"}`}
              style={hasSchedule && !isSel && !isToday ? { border: `2px solid ${scheduleBorderColor}` } : undefined}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────

type ActiveView = "author" | "home" | "my-notebook" | "short-note" | "project" | "task" | "schedule" | "to-do" | "memory";

const NAV_ITEMS: { id: ActiveView; label: string; icon: React.ElementType; active: boolean }[] = [
  { id: "author",     label: "Author",      icon: UserRound,      active: false },
  { id: "home",       label: "Home",        icon: HomeIcon,       active: false },
  { id: "short-note", label: "Short Note",  icon: StickyNote,     active: true  },
  { id: "my-notebook",label: "My Notebook", icon: BookMarked,     active: true  },
  { id: "project",    label: "Project",     icon: FolderKanban,   active: true  },
  { id: "task",       label: "Task",        icon: CheckSquare,    active: true  },
  { id: "schedule",   label: "Schedule",    icon: CalendarDays,   active: true  },
  { id: "to-do",      label: "To Do",       icon: ListTodo,       active: true  },
  { id: "memory",     label: "Memory",      icon: Brain,          active: true  },
];

function OrbitalClock24({ frozen = false }: { frozen?: boolean }) {
  const [tick, setTick] = useState({ d: new Date(), ms: 0 });
  const rafRef = useRef<number>(0);
  useEffect(() => {
    if (frozen) return;
    const loop = () => {
      const d = new Date();
      setTick({ d, ms: d.getMilliseconds() });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [frozen]);

  const ms = frozen ? 0 : tick.ms;
  const h  = frozen ? 0 : tick.d.getHours();
  const m  = frozen ? 0 : tick.d.getMinutes();
  const s  = frozen ? 0 : tick.d.getSeconds();
  const secSmooth  = s + ms / 1000;
  const minSmooth  = m + secSmooth / 60;
  const hourSmooth = h + minSmooth / 60;

  const cx = 80, cy = 80, R = 58;
  const orbitR = R + 14;

  const polar = (deg: number, r: number) => ({
    x: cx + r * Math.cos((deg - 90) * Math.PI / 180),
    y: cy + r * Math.sin((deg - 90) * Math.PI / 180),
  });

  const hourDeg = hourSmooth * 15;
  const minDeg  = minSmooth  * 6;
  const secDeg  = secSmooth  * 6;

  const sweep = Math.max(0.01, Math.min(hourDeg, 359.99));
  const toRad = (d: number) => (d - 90) * Math.PI / 180;
  const sx = cx + R * Math.cos(toRad(0));
  const sy = cy + R * Math.sin(toRad(0));
  const ex = cx + R * Math.cos(toRad(sweep));
  const ey = cy + R * Math.sin(toRad(sweep));
  const large = sweep > 180 ? 1 : 0;
  const sectorD = `M ${cx} ${cy} L ${sx} ${sy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey} Z`;

  const mp = polar(minDeg, 40);
  const op = polar(secDeg, orbitR);
  const divP = polar(hourDeg, R);

  const ticks = Array.from({ length: 24 }, (_, i) => {
    const deg = i * 15;
    const isMajor = i % 3 === 0;
    const o = polar(deg, R - 2);
    const inn = polar(deg, R - 2 - (isMajor ? 9 : 4));
    const lp = polar(deg, R - 2 - (isMajor ? 18 : 4));
    return { o, inn, lp, isMajor, label: i === 0 ? "24" : String(i) };
  });

  return (
    <svg viewBox="0 0 160 160" className="w-full h-full" style={{ overflow: "visible" }}>
      {/* Filled sectors */}
      <circle cx={cx} cy={cy} r={R} fill="#ffffff" />
      <path d={sectorD} fill="#e8e4db" />
      {/* sector divider line */}
      <line x1={cx} y1={cy} x2={divP.x} y2={divP.y} stroke="#c9c5bc" strokeWidth="1" />
      {/* rim */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#d6d3ce" strokeWidth="1.5" />
      {/* ticks + labels */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={t.o.x} y1={t.o.y} x2={t.inn.x} y2={t.inn.y}
            stroke="#9ca3af" strokeWidth={t.isMajor ? 1.5 : 0.8}
            strokeLinecap="round" opacity={t.isMajor ? 0.75 : 0.4} />
          {t.isMajor && (
            <text x={t.lp.x} y={t.lp.y} textAnchor="middle" dominantBaseline="central"
              fontSize="7" fontWeight="600" fill="#6b7280" fontFamily="system-ui,sans-serif">
              {t.label}
            </text>
          )}
        </g>
      ))}
      {/* minute hand */}
      <line x1={cx} y1={cy} x2={mp.x} y2={mp.y}
        stroke="#374151" strokeWidth="2" strokeLinecap="round" />
      {/* center dot */}
      <circle cx={cx} cy={cy} r="3.5" fill="#374151" />
      {/* orbit track */}
      <circle cx={cx} cy={cy} r={orbitR} fill="none" stroke="#d1d5db"
        strokeWidth="0.8" strokeDasharray="2 3" opacity="0.5" />
      {/* orbiting second ball */}
      <circle cx={op.x} cy={op.y} r="5.5" fill="#1f2937" />
    </svg>
  );
}

function AnimatedChildren({ open, children }: { open: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(open ? "auto" : "0px");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      const h = el.scrollHeight;
      setHeight(`${h}px`);
      const t = setTimeout(() => setHeight("auto"), 220);
      return () => clearTimeout(t);
    } else {
      setHeight(`${el.scrollHeight}px`);
      requestAnimationFrame(() => requestAnimationFrame(() => setHeight("0px")));
    }
  }, [open]);

  return (
    <div ref={ref} style={{ height, overflow: "hidden", transition: "height 220ms cubic-bezier(0.4,0,0.2,1)" }}>
      {children}
    </div>
  );
}

// ── localStorage helpers for To Do ────────────────────────────
const TODO_KEY = "nb_daily_todos";
const MEMORY_KEY = "nb_daily_memories";

type MemoryStore = Record<string, string>; // key = "YYYY-MM-DD", value = note text

function loadMemoryNotes(): MemoryStore {
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) || "{}"); } catch { return {}; }
}
function saveMemoryNotes(store: MemoryStore) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(store));
}

const MOOD_KEY = "nb_daily_moods";
type MoodValue = "great" | "good" | "normal" | "bad" | "terrible";
type MoodStore = Record<string, MoodValue>;
const MOOD_OPTIONS: { value: MoodValue; emoji: string; label: string; color: string }[] = [
  { value: "great",    emoji: "🟢", label: "Great",    color: "#22c55e" },
  { value: "good",     emoji: "🔵", label: "Good",     color: "#3b82f6" },
  { value: "normal",   emoji: "⚪", label: "Normal",   color: "#a8a29e" },
  { value: "bad",      emoji: "🟠", label: "Bad",      color: "#f97316" },
  { value: "terrible", emoji: "🔴", label: "Terrible", color: "#ef4444" },
];
function loadMoodNotes(): MoodStore {
  try { return JSON.parse(localStorage.getItem(MOOD_KEY) || "{}"); } catch { return {}; }
}
function saveMoodNotes(store: MoodStore) {
  localStorage.setItem(MOOD_KEY, JSON.stringify(store));
}
type TodoPriority = "medium" | "important" | "urgent";
type DailyTodoItem = { id: string; text: string; done: boolean; priority?: TodoPriority };
type DailyTodoStore = Record<string, DailyTodoItem[]>; // key = "YYYY-MM-DD"

function loadDailyTodos(): DailyTodoStore {
  try { return JSON.parse(localStorage.getItem(TODO_KEY) || "{}"); } catch { return {}; }
}
function saveDailyTodos(store: DailyTodoStore) {
  localStorage.setItem(TODO_KEY, JSON.stringify(store));
}

// Returns Monday of the week containing `date`
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}.${mm}.${yy}`;
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function DayCard({
  dayName, dateKey, displayDate, allTodos, onChange, compact = false,
  onCopy, onPaste, canPaste,
}: {
  dayName: string;
  dateKey: string;
  displayDate: string;
  allTodos: DailyTodoStore;
  onChange: (store: DailyTodoStore) => void;
  compact?: boolean;
  onCopy?: () => void;
  onPaste?: () => void;
  canPaste?: boolean;
}) {
  const tasks: DailyTodoItem[] = allTodos[dateKey] ?? [];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const [newText, setNewText] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [priorityTaskId, setPriorityTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!priorityTaskId) return;
    const handler = (e: MouseEvent) => {
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setPriorityTaskId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [priorityTaskId]);

  const setTaskPriority = (id: string, priority: TodoPriority | undefined) => {
    update(tasks.map(t => t.id === id ? { ...t, priority } : t));
    setPriorityTaskId(null);
  };

  const priorityTextColor = (p?: TodoPriority) => {
    if (p === "medium") return "text-blue-600";
    if (p === "important") return "text-orange-500";
    if (p === "urgent") return "text-red-600";
    return "text-stone-700";
  };

  const priorityIconColor = (p?: TodoPriority) => {
    if (p === "medium") return "text-blue-500";
    if (p === "important") return "text-orange-500";
    if (p === "urgent") return "text-red-500";
    return "text-stone-400";
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const update = (updated: DailyTodoItem[]) => {
    const next = { ...allTodos, [dateKey]: updated };
    onChange(next);
  };

  const addTask = () => {
    const text = newText.trim();
    if (!text) return;
    update([...tasks, { id: crypto.randomUUID(), text, done: false }]);
    setNewText("");
  };

  const toggle = (id: string) =>
    update(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const remove = (id: string) =>
    update(tasks.filter(t => t.id !== id));

  const updateText = (id: string, text: string) =>
    update(tasks.map(t => t.id === id ? { ...t, text } : t));

  if (compact) {
    return (
      <div className="flex flex-col min-h-[160px]">
        <div className="flex items-baseline justify-between mb-0.5 gap-1">
          <span className="text-[11px] font-bold text-stone-700 font-serif truncate">{dayName.slice(0, 3)}</span>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={onCopy}
              title="Copy tasks"
              className="text-stone-300 hover:text-stone-600 transition-colors"
            >
              <Copy className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={onPaste}
              title="Paste tasks"
              disabled={!canPaste}
              className={`transition-colors ${canPaste ? "text-stone-400 hover:text-stone-700" : "text-stone-200 cursor-not-allowed"}`}
            >
              <Clipboard className="w-2.5 h-2.5" />
            </button>
            <span className="text-[10px] text-stone-400 ml-0.5">{displayDate}</span>
          </div>
        </div>
        <div className="border-b border-stone-200 mb-2" />
        <div className="flex flex-col gap-1 flex-1">
          {tasks.map(task => (
            <div key={task.id} className="group flex items-center gap-1 min-h-[16px]">
              {confirmId === task.id ? (
                <>
                  <span className="text-[10px] text-stone-500 flex-1">Delete?</span>
                  <button onClick={() => { remove(task.id); setConfirmId(null); }} className="text-[10px] px-1 py-0.5 border border-red-400 text-red-500 hover:bg-red-50 transition-colors" style={{ borderRadius: "2px" }}>Yes</button>
                  <button onClick={() => setConfirmId(null)} className="text-[10px] px-1 py-0.5 border border-stone-300 text-stone-400 hover:bg-stone-50 transition-colors" style={{ borderRadius: "2px" }}>No</button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => toggle(task.id)}
                    className={`w-3 h-3 border flex-shrink-0 flex items-center justify-center transition-colors ${task.done ? "bg-stone-700 border-stone-700" : "border-stone-400 hover:border-stone-600"}`}
                    style={{ borderRadius: "1px" }}
                  >
                    {task.done && <Check className="w-2 h-2 text-white" />}
                  </button>
                  <input
                    value={task.text}
                    onChange={e => updateText(task.id, e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") addTask(); }}
                    className={`flex-1 text-[11px] bg-transparent outline-none min-w-0 placeholder:opacity-40 ${task.done ? "line-through text-stone-400" : priorityTextColor(task.priority)}`}
                    placeholder="Task…"
                  />
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setPriorityTaskId(priorityTaskId === task.id ? null : task.id)}
                      className={`opacity-0 group-hover:opacity-100 transition-all text-sm leading-none ${priorityIconColor(task.priority)}`}
                    >
                      ⦿
                    </button>
                    {priorityTaskId === task.id && (
                      <div className="absolute bottom-full mb-1 right-0 bg-white border border-stone-200 shadow-md z-50 flex flex-col overflow-hidden" style={{ borderRadius: "3px", minWidth: "90px" }}>
                        <button onClick={() => setTaskPriority(task.id, "medium")} className="px-2 py-1 text-[10px] text-blue-600 hover:bg-blue-50 text-left font-medium">Medium</button>
                        <div className="border-t border-stone-100" />
                        <button onClick={() => setTaskPriority(task.id, "important")} className="px-2 py-1 text-[10px] text-orange-500 hover:bg-orange-50 text-left font-medium">Important</button>
                        <div className="border-t border-stone-100" />
                        <button onClick={() => setTaskPriority(task.id, "urgent")} className="px-2 py-1 text-[10px] text-red-500 hover:bg-red-50 text-left font-medium">Urgent</button>
                        {task.priority && (
                          <>
                            <div className="border-t border-stone-100" />
                            <button onClick={() => setTaskPriority(task.id, undefined)} className="px-2 py-1 text-[10px] text-stone-400 hover:bg-stone-50 text-left">Clear</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setConfirmId(task.id)} className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 transition-all flex-shrink-0">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 relative self-start" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={`border text-[10px] px-1.5 py-0.5 transition-colors ${menuOpen ? "border-stone-500 text-stone-700 bg-stone-50" : "border-stone-200 text-stone-400 hover:border-stone-400 hover:text-stone-600"}`}
            style={{ borderRadius: "2px" }}
          >
            Task ±
          </button>
          {menuOpen && (
            <div className="absolute bottom-full mb-1 left-0 bg-white border border-stone-200 shadow-md flex flex-col overflow-hidden z-50" style={{ borderRadius: "3px", minWidth: "80px" }}>
              <button onClick={() => { update([...tasks, { id: crypto.randomUUID(), text: "", done: false }]); }} className="flex items-center gap-1 px-2 py-1.5 text-[10px] text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors text-left">
                <Plus className="w-2.5 h-2.5 text-stone-400" /> Task +
              </button>
              <div className="border-t border-stone-100" />
              <button onClick={() => { if (tasks.length === 0) return; update(tasks.slice(0, -1)); }} className={`flex items-center gap-1 px-2 py-1.5 text-[10px] transition-colors text-left ${tasks.length === 0 ? "text-stone-300 cursor-not-allowed" : "text-stone-600 hover:bg-red-50 hover:text-red-600"}`}>
                <span className="w-2.5 h-2.5 flex items-center justify-center text-stone-400 font-bold leading-none">−</span> Task −
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[306px]">
      {/* Day + Date header */}
      <div className="flex items-baseline justify-between mb-1 gap-2">
        <span className="text-lg font-bold text-stone-800 font-serif">{dayName}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onCopy}
            title="Copy all tasks"
            className="text-stone-300 hover:text-stone-600 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onPaste}
            title="Paste tasks"
            disabled={!canPaste}
            className={`transition-colors ${canPaste ? "text-stone-400 hover:text-stone-700" : "text-stone-200 cursor-not-allowed"}`}
          >
            <Clipboard className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-stone-400 ml-1">{displayDate}</span>
        </div>
      </div>
      <div className="border-b border-stone-300 mb-3" />

      {/* Task rows */}
      <div className="flex flex-col gap-1.5">
        {tasks.map(task => (
          <div key={task.id} className="group flex items-start gap-2 min-h-[22px]">
            {confirmId === task.id ? (
              <>
                <span className="text-xs text-stone-500 flex-1">Delete?</span>
                <button
                  onClick={() => { remove(task.id); setConfirmId(null); }}
                  className="text-[11px] px-2 py-0.5 border border-red-400 text-red-500 hover:bg-red-50 transition-colors"
                  style={{ borderRadius: "2px" }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-[11px] px-2 py-0.5 border border-stone-300 text-stone-500 hover:bg-stone-50 transition-colors"
                  style={{ borderRadius: "2px" }}
                >
                  No
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => toggle(task.id)}
                  className={`w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-colors mt-0.5 ${
                    task.done ? "bg-stone-800 border-stone-800" : "border-stone-400 hover:border-stone-600"
                  }`}
                  style={{ borderRadius: "2px" }}
                >
                  {task.done && <Check className="w-2.5 h-2.5 text-white" />}
                </button>
                <textarea
                  value={task.text}
                  onChange={e => updateText(task.id, e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTask(); } }}
                  rows={1}
                  className={`flex-1 text-sm bg-transparent outline-none min-w-0 placeholder:opacity-50 resize-none overflow-hidden leading-snug ${
                    task.done ? "line-through text-stone-400" : priorityTextColor(task.priority)
                  }`}
                  placeholder="Task…"
                  style={{ height: "auto" }}
                  onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = t.scrollHeight + "px"; }}
                />
                <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                  <div className="relative" ref={priorityTaskId === task.id ? priorityRef : undefined}>
                    <button
                      onClick={() => setPriorityTaskId(priorityTaskId === task.id ? null : task.id)}
                      className={`opacity-0 group-hover:opacity-100 transition-all text-[12px] leading-none flex items-center justify-center ${priorityIconColor(task.priority)}`}
                      title="Set priority"
                      style={{ lineHeight: 1 }}
                    >
                      ⦿
                    </button>
                    {priorityTaskId === task.id && (
                      <div className="absolute bottom-full mb-1 right-0 bg-white border border-stone-200 shadow-md z-50 flex flex-col overflow-hidden" style={{ borderRadius: "3px", minWidth: "100px" }}>
                        <button onClick={() => setTaskPriority(task.id, "medium")} className="px-3 py-1.5 text-[11px] text-blue-600 hover:bg-blue-50 text-left font-medium">Medium</button>
                        <div className="border-t border-stone-100" />
                        <button onClick={() => setTaskPriority(task.id, "important")} className="px-3 py-1.5 text-[11px] text-orange-500 hover:bg-orange-50 text-left font-medium">Important</button>
                        <div className="border-t border-stone-100" />
                        <button onClick={() => setTaskPriority(task.id, "urgent")} className="px-3 py-1.5 text-[11px] text-red-500 hover:bg-red-50 text-left font-medium">Urgent</button>
                        {task.priority && (
                          <>
                            <div className="border-t border-stone-100" />
                            <button onClick={() => setTaskPriority(task.id, undefined)} className="px-3 py-1.5 text-[11px] text-stone-400 hover:bg-stone-50 text-left">Clear</button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setConfirmId(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-red-500 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        </div>

      {/* Task +- button with mini popup */}
      <div className="mt-3 relative self-start" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className={`border text-[11px] px-2 py-0.5 transition-colors flex items-center gap-1 ${
            menuOpen
              ? "border-stone-500 text-stone-700 bg-stone-50"
              : "border-stone-300 text-stone-500 hover:border-stone-500 hover:text-stone-700"
          }`}
          style={{ borderRadius: "2px" }}
        >
          Task ±
        </button>

        {/* Mini popup card — stays open until outside click or toggle */}
        {menuOpen && (
          <div
            className="absolute bottom-full mb-1.5 left-0 bg-white border border-stone-200 shadow-md flex flex-col overflow-hidden z-50"
            style={{ borderRadius: "3px", minWidth: "90px" }}
          >
            <button
              onClick={() => {
                update([...tasks, { id: crypto.randomUUID(), text: "", done: false }]);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors text-left"
            >
              <Plus className="w-3 h-3 text-stone-400" />
              Task +
            </button>
            <div className="border-t border-stone-100" />
            <button
              onClick={() => {
                if (tasks.length === 0) return;
                update(tasks.slice(0, -1));
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] transition-colors text-left ${
                tasks.length === 0
                  ? "text-stone-300 cursor-not-allowed"
                  : "text-stone-600 hover:bg-red-50 hover:text-red-600"
              }`}
            >
              <span className="w-3 h-3 flex items-center justify-center text-stone-400 font-bold text-base leading-none">−</span>
              Task −
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function make5BlankTasks(): DailyTodoItem[] {
  return Array.from({ length: 5 }, () => ({ id: crypto.randomUUID(), text: "", done: false }));
}

type TodoViewMode = "D" | "W" | "M";

function TodoView() {
  const [allTodos, setAllTodos] = useState<DailyTodoStore>(() => loadDailyTodos());
  const [viewMode, setViewMode] = useState<TodoViewMode>("W");
  const [offset, setOffset] = useState(0);
  const [clipboard, setClipboard] = useState<DailyTodoItem[] | null>(null);

  const handleChange = (updated: DailyTodoStore) => {
    setAllTodos(updated);
    saveDailyTodos(updated);
  };

  const switchMode = (mode: TodoViewMode) => {
    setViewMode(mode);
    setOffset(0);
  };

  const todayKey = formatDateKey(new Date());

  // Build days list based on mode
  const days = (() => {
    const today = new Date();
    if (viewMode === "D") {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      const name = DAY_NAMES[(d.getDay() + 6) % 7];
      return [{ name, dateKey: formatDateKey(d), displayDate: formatDisplayDate(d) }];
    } else if (viewMode === "W") {
      const monday = getMondayOfWeek(today);
      monday.setDate(monday.getDate() + offset * 7);
      return DAY_NAMES.map((name, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return { name, dateKey: formatDateKey(d), displayDate: formatDisplayDate(d) };
      });
    } else {
      // M: actual days in the navigated month
      const start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(start.getFullYear(), start.getMonth(), i + 1);
        const name = DAY_NAMES[(d.getDay() + 6) % 7];
        return { name, dateKey: formatDateKey(d), displayDate: formatDisplayDate(d) };
      });
    }
  })();

  const rangeLabel = days.length === 1
    ? `${days[0].displayDate} (${days[0].name})`
    : `${days[0].displayDate} – ${days[days.length - 1].displayDate}`;

  // Initialize new days with 5 blank tasks
  useEffect(() => {
    const current = loadDailyTodos();
    let changed = false;
    const next = { ...current };
    days.forEach(day => {
      if (!next[day.dateKey]) {
        next[day.dateKey] = make5BlankTasks();
        changed = true;
      }
    });
    if (changed) {
      saveDailyTodos(next);
      setAllTodos(next);
    }
  }, [viewMode, offset]);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col px-6 md:px-10">
      {/* Header */}
      <div className="pt-14 md:pt-16">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold text-stone-800">Daily To Do Lists :</h1>
          <div className="flex items-center gap-2">
            {/* Mode toggle buttons */}
            {(["D", "W", "M"] as TodoViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => switchMode(mode)}
                className={`text-xs px-2 py-1 border transition-colors font-medium ${
                  viewMode === mode
                    ? "border-stone-700 bg-stone-800 text-white"
                    : "border-stone-300 text-stone-500 hover:border-stone-500 hover:text-stone-700"
                }`}
                style={{ borderRadius: "2px", minWidth: "32px" }}
              >
                {mode}
              </button>
            ))}
            <div className="w-px h-4 bg-stone-200 mx-0.5" />
            {/* Navigation */}
            <button
              onClick={() => setOffset(v => v - 1)}
              className="w-7 h-7 flex items-center justify-center border border-stone-300 hover:border-stone-500 text-stone-500 transition-colors"
              style={{ borderRadius: "2px" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-stone-400 min-w-[140px] text-center">{rangeLabel}</span>
            <button
              onClick={() => setOffset(v => v + 1)}
              className="w-7 h-7 flex items-center justify-center border border-stone-300 hover:border-stone-500 text-stone-500 transition-colors"
              style={{ borderRadius: "2px" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {offset !== 0 && (
              <button
                onClick={() => setOffset(0)}
                className="text-xs border border-stone-300 px-2 py-1 text-stone-500 hover:border-stone-500 hover:text-stone-700 transition-colors"
                style={{ borderRadius: "2px" }}
              >
                Today
              </button>
            )}
          </div>
        </div>
        <div className="border-b border-stone-300" />
      </div>

      {/* Grid */}
      <div className="flex-1 flex flex-col justify-center py-6">
        {viewMode === "D" && (
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              <DayCard
                dayName={days[0].name}
                dateKey={days[0].dateKey}
                displayDate={days[0].displayDate}
                allTodos={allTodos}
                onChange={handleChange}
                onCopy={() => setClipboard(allTodos[days[0].dateKey] ?? [])}
                onPaste={() => {
                  if (!clipboard) return;
                  const next = { ...allTodos, [days[0].dateKey]: clipboard.map(t => ({ ...t, id: crypto.randomUUID() })) };
                  handleChange(next);
                }}
                canPaste={!!clipboard}
              />
            </div>
          </div>
        )}
        {viewMode === "W" && (
          <>
            <div className="grid grid-cols-4 gap-8 mb-10">
              {days.slice(0, 4).map(day => (
                <div key={day.dateKey} className={day.dateKey === todayKey ? "ring-2 ring-stone-300 rounded p-2 -m-2" : ""}>
                  <DayCard dayName={day.name} dateKey={day.dateKey} displayDate={day.displayDate} allTodos={allTodos} onChange={handleChange}
                    onCopy={() => setClipboard(allTodos[day.dateKey] ?? [])}
                    onPaste={() => { if (!clipboard) return; handleChange({ ...allTodos, [day.dateKey]: clipboard.map(t => ({ ...t, id: crypto.randomUUID() })) }); }}
                    canPaste={!!clipboard}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-8">
              {days.slice(4).map(day => (
                <div key={day.dateKey} className={day.dateKey === todayKey ? "ring-2 ring-stone-300 rounded p-2 -m-2" : ""}>
                  <DayCard dayName={day.name} dateKey={day.dateKey} displayDate={day.displayDate} allTodos={allTodos} onChange={handleChange}
                    onCopy={() => setClipboard(allTodos[day.dateKey] ?? [])}
                    onPaste={() => { if (!clipboard) return; handleChange({ ...allTodos, [day.dateKey]: clipboard.map(t => ({ ...t, id: crypto.randomUUID() })) }); }}
                    canPaste={!!clipboard}
                  />
                </div>
              ))}
            </div>
          </>
        )}
        {viewMode === "M" && (
          <div className="grid grid-cols-6 gap-3">
            {days.map(day => (
              <div key={day.dateKey} className={day.dateKey === todayKey ? "ring-2 ring-stone-300 rounded p-1 -m-1" : ""}>
                <DayCard dayName={day.name} dateKey={day.dateKey} displayDate={day.displayDate} allTodos={allTodos} onChange={handleChange} compact
                  onCopy={() => setClipboard(allTodos[day.dateKey] ?? [])}
                  onPaste={() => { if (!clipboard) return; handleChange({ ...allTodos, [day.dateKey]: clipboard.map(t => ({ ...t, id: crypto.randomUUID() })) }); }}
                  canPaste={!!clipboard}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Memory Card ───────────────────────────────────────────────
function MemoryCard({ dateKey, dayName, displayDate, allMemories, onChange, allMoods, onMoodChange, compact, large }: {
  dateKey: string;
  dayName: string;
  displayDate: string;
  allMemories: MemoryStore;
  onChange: (store: MemoryStore) => void;
  allMoods: MoodStore;
  onMoodChange: (store: MoodStore) => void;
  compact?: boolean;
  large?: boolean;
}) {
  const text = allMemories[dateKey] ?? "";
  const mood = allMoods[dateKey] ?? null;
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const moodRef = useRef<HTMLDivElement>(null);

  const handleChange = (val: string) => {
    onChange({ ...allMemories, [dateKey]: val });
  };

  const handleMoodSelect = (val: MoodValue) => {
    onMoodChange({ ...allMoods, [dateKey]: val });
    setShowMoodPicker(false);
  };

  useEffect(() => {
    if (!showMoodPicker) return;
    const handler = (e: MouseEvent) => {
      if (moodRef.current && !moodRef.current.contains(e.target as Node)) {
        setShowMoodPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMoodPicker]);

  const currentMood = MOOD_OPTIONS.find(o => o.value === mood);

  const moodColor = currentMood ? currentMood.color : undefined;

  return (
    <div
      className={`flex flex-col ${large ? "min-h-[520px]" : "min-h-[306px]"} ${compact ? "gap-1" : "gap-2"} border transition-colors`}
      style={{
        borderColor: moodColor ?? "#e7e5e4",
        borderWidth: compact ? "1.5px" : "2px",
        padding: compact ? "6px" : large ? "16px" : "10px",
        borderRadius: "3px",
      }}
    >
      {/* Card header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Mood button */}
          <div className="relative" ref={moodRef}>
            <button
              onClick={() => setShowMoodPicker(v => !v)}
              className={`flex items-center justify-center transition-opacity hover:opacity-70 ${compact ? "text-[13px]" : large ? "text-[22px]" : "text-[16px]"}`}
              title="Set mood"
            >
              {currentMood
                ? <span style={{ color: currentMood.color, fontSize: compact ? "11px" : large ? "20px" : "15px" }}>●</span>
                : <span className="text-stone-300" style={{ fontSize: compact ? "11px" : large ? "20px" : "15px" }}>◯</span>
              }
            </button>
            {showMoodPicker && (
              <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-stone-200 shadow-lg py-1 min-w-[130px]" style={{ borderRadius: "3px" }}>
                {MOOD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleMoodSelect(opt.value)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-stone-50 transition-colors ${mood === opt.value ? "font-semibold" : "text-stone-600"}`}
                    style={mood === opt.value ? { color: opt.color } : undefined}
                  >
                    <span style={{ color: opt.color, fontSize: "13px" }}>●</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className={`font-bold text-stone-800 ${compact ? "text-[14px]" : large ? "text-[28px]" : "text-[20px]"}`}>{dayName}</span>
        </div>
        <span className={`text-stone-400 ${compact ? "text-[9px]" : large ? "text-sm" : "text-[11px]"}`}>{displayDate}</span>
      </div>
      <div className="border-b border-stone-200" />

      {/* Blank note area */}
      <textarea
        value={text}
        onChange={e => handleChange(e.target.value)}
        placeholder={compact ? "Memory…" : "Write your memory for this day…"}
        className={`w-full bg-transparent outline-none resize-none text-stone-700 placeholder:text-stone-300 leading-relaxed flex-1 [&::-webkit-scrollbar]:hidden border-t border-r border-b border-stone-200 ${
          compact ? "text-[11px] min-h-[60px]" : large ? "text-xl" : "text-base"
        }`}
        style={{ scrollbarWidth: "none" }}
      />
    </div>
  );
}

// ── Memory View ───────────────────────────────────────────────
type MemoryViewMode = "D" | "W" | "M";

function MemoryView() {
  const [allMemories, setAllMemories] = useState<MemoryStore>(() => loadMemoryNotes());
  const [allMoods, setAllMoods] = useState<MoodStore>(() => loadMoodNotes());
  const [viewMode, setViewMode] = useState<MemoryViewMode>("W");
  const [offset, setOffset] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calSlideIn, setCalSlideIn] = useState(false);
  const [calPopupDate, setCalPopupDate] = useState<Date | null>(null);
  const todayObj = new Date();
  const [calYear, setCalYear] = useState(todayObj.getFullYear());
  const [calMonth, setCalMonth] = useState(todayObj.getMonth());

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_SHORT = ["Mo","Tu","We","Th","Fr","Sa","Su"];

  const handleChange = (updated: MemoryStore) => {
    setAllMemories(updated);
    saveMemoryNotes(updated);
  };

  const handleMoodChange = (updated: MoodStore) => {
    setAllMoods(updated);
    saveMoodNotes(updated);
  };

  const switchMode = (mode: MemoryViewMode) => { setViewMode(mode); setOffset(0); };

  const todayKey = formatDateKey(todayObj);

  const days = (() => {
    const today = new Date();
    if (viewMode === "D") {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      return [{ name: DAY_NAMES[(d.getDay() + 6) % 7], dateKey: formatDateKey(d), displayDate: formatDisplayDate(d) }];
    } else if (viewMode === "W") {
      const monday = getMondayOfWeek(today);
      monday.setDate(monday.getDate() + offset * 7);
      return DAY_NAMES.map((name, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return { name, dateKey: formatDateKey(d), displayDate: formatDisplayDate(d) };
      });
    } else {
      const start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(start.getFullYear(), start.getMonth(), i + 1);
        return { name: DAY_NAMES[(d.getDay() + 6) % 7], dateKey: formatDateKey(d), displayDate: formatDisplayDate(d) };
      });
    }
  })();

  const rangeLabel = days.length === 1
    ? `${days[0].displayDate} (${days[0].name})`
    : `${days[0].displayDate} – ${days[days.length - 1].displayDate}`;

  const prevCalMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextCalMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  useEffect(() => {
    if (showCalendar) {
      requestAnimationFrame(() => requestAnimationFrame(() => setCalSlideIn(true)));
    } else {
      setCalSlideIn(false);
    }
  }, [showCalendar]);

  const handleCalDayClick = (d: Date) => {
    setCalPopupDate(d);
  };

  const handleCalPopupGoToDay = (d: Date) => {
    const todayMid = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
    const clickedMid = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.round((clickedMid.getTime() - todayMid.getTime()) / 86400000);
    setViewMode("D");
    setOffset(diff);
    setShowCalendar(false);
    setCalPopupDate(null);
  };

  const calFirstDow = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calCells: (Date | null)[] = [
    ...Array(calFirstDow).fill(null),
    ...Array.from({ length: calDaysInMonth }, (_, i) => new Date(calYear, calMonth, i + 1)),
  ];
  while (calCells.length % 7 !== 0) calCells.push(null);

  const activeDateKeys = new Set(days.map(d => d.dateKey));

  return (
    <div className="flex-1 overflow-hidden flex flex-col relative">
      <div className="flex-1 overflow-y-auto flex flex-col px-6 md:px-10">
        {/* Header */}
        <div className="pt-14 md:pt-16">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold text-stone-800">Daily Memories :</h1>
            <div className="flex items-center gap-2">
              {(["D", "W", "M"] as MemoryViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => switchMode(mode)}
                  className={`text-xs px-2 py-1 border transition-colors font-medium ${
                    viewMode === mode
                      ? "border-stone-700 bg-stone-800 text-white"
                      : "border-stone-300 text-stone-500 hover:border-stone-500 hover:text-stone-700"
                  }`}
                  style={{ borderRadius: "2px", minWidth: "32px" }}
                >
                  {mode}
                </button>
              ))}
              <div className="w-px h-4 bg-stone-200 mx-0.5" />
              <button
                onClick={() => setOffset(v => v - 1)}
                className="w-7 h-7 flex items-center justify-center border border-stone-300 hover:border-stone-500 text-stone-500 transition-colors"
                style={{ borderRadius: "2px" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-stone-400 min-w-[140px] text-center">{rangeLabel}</span>
              <button
                onClick={() => setOffset(v => v + 1)}
                className="w-7 h-7 flex items-center justify-center border border-stone-300 hover:border-stone-500 text-stone-500 transition-colors"
                style={{ borderRadius: "2px" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              {offset !== 0 && (
                <button
                  onClick={() => setOffset(0)}
                  className="text-xs border border-stone-300 px-2 py-1 text-stone-500 hover:border-stone-500 hover:text-stone-700 transition-colors"
                  style={{ borderRadius: "2px" }}
                >
                  Today
                </button>
              )}
              <div className="w-px h-4 bg-stone-200 mx-0.5" />
              <button
                onClick={() => setShowCalendar(v => !v)}
                className={`w-7 h-7 flex items-center justify-center border transition-colors ${
                  showCalendar
                    ? "border-stone-700 bg-stone-800 text-white"
                    : "border-stone-300 text-stone-500 hover:border-stone-500 hover:text-stone-700"
                }`}
                style={{ borderRadius: "2px" }}
                title="Open calendar"
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="border-b border-stone-300" />
        </div>

        {/* Grid */}
        <div className="flex-1 flex flex-col justify-center py-6">
          {viewMode === "D" && (
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <MemoryCard dayName={days[0].name} dateKey={days[0].dateKey} displayDate={days[0].displayDate} allMemories={allMemories} onChange={handleChange} allMoods={allMoods} onMoodChange={handleMoodChange} large />
              </div>
            </div>
          )}
          {viewMode === "W" && (
            <>
              <div className="grid grid-cols-4 gap-8 mb-10">
                {days.slice(0, 4).map(day => (
                  <div key={day.dateKey} className={day.dateKey === todayKey ? "ring-2 ring-stone-300 rounded p-2 -m-2" : ""}>
                    <MemoryCard dayName={day.name} dateKey={day.dateKey} displayDate={day.displayDate} allMemories={allMemories} onChange={handleChange} allMoods={allMoods} onMoodChange={handleMoodChange} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-8">
                {days.slice(4).map(day => (
                  <div key={day.dateKey} className={day.dateKey === todayKey ? "ring-2 ring-stone-300 rounded p-2 -m-2" : ""}>
                    <MemoryCard dayName={day.name} dateKey={day.dateKey} displayDate={day.displayDate} allMemories={allMemories} onChange={handleChange} allMoods={allMoods} onMoodChange={handleMoodChange} />
                  </div>
                ))}
              </div>
            </>
          )}
          {viewMode === "M" && (
            <div className="grid grid-cols-6 gap-3">
              {days.map(day => (
                <div key={day.dateKey} className={day.dateKey === todayKey ? "ring-2 ring-stone-300 rounded p-1 -m-1" : ""}>
                  <MemoryCard dayName={day.name} dateKey={day.dateKey} displayDate={day.displayDate} allMemories={allMemories} onChange={handleChange} allMoods={allMoods} onMoodChange={handleMoodChange} compact />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full-year calendar overlay */}
      {showCalendar && (
        <div
          className={`absolute inset-0 z-20 bg-white flex flex-col transition-transform duration-500 ease-out ${calSlideIn ? "translate-x-0" : "translate-x-full"}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 pt-14 pb-4 border-b border-stone-200 flex-shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCalYear(y => y - 1)}
                className="w-7 h-7 flex items-center justify-center border border-stone-300 hover:border-stone-500 text-stone-500 transition-colors"
                style={{ borderRadius: "2px" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xl font-bold text-stone-800">{calYear}</span>
              <button
                onClick={() => setCalYear(y => y + 1)}
                className="w-7 h-7 flex items-center justify-center border border-stone-300 hover:border-stone-500 text-stone-500 transition-colors"
                style={{ borderRadius: "2px" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setCalYear(todayObj.getFullYear());
                  handleCalDayClick(todayObj);
                }}
                className="text-xs border border-stone-300 px-3 py-1.5 text-stone-600 hover:border-stone-500 hover:text-stone-800 transition-colors"
                style={{ borderRadius: "2px" }}
              >
                Go to Today
              </button>
              <button
                onClick={() => setShowCalendar(false)}
                className="w-7 h-7 flex items-center justify-center border border-stone-300 hover:border-stone-500 text-stone-500 transition-colors"
                style={{ borderRadius: "2px" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day memory popup */}
          {calPopupDate && (() => {
            const dk = formatDateKey(calPopupDate);
            const dayName = DAY_NAMES[(calPopupDate.getDay() + 6) % 7];
            const dispDate = formatDisplayDate(calPopupDate);
            const text = allMemories[dk] ?? "";
            return (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20" onClick={() => setCalPopupDate(null)}>
                <div
                  className="bg-white rounded-lg shadow-2xl w-full max-w-lg mx-8 flex flex-col overflow-hidden"
                  style={{ maxHeight: "70%" }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Popup header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
                    <div>
                      <div className="text-base font-bold text-stone-800">{dayName}</div>
                      <div className="text-xs text-stone-400 mt-0.5">{dispDate}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCalPopupGoToDay(calPopupDate)}
                        className="text-xs border border-stone-300 px-3 py-1.5 text-stone-600 hover:border-stone-700 hover:text-stone-800 transition-colors"
                        style={{ borderRadius: "2px" }}
                      >
                        Open in Day view
                      </button>
                      <button
                        onClick={() => setCalPopupDate(null)}
                        className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {/* Memory text */}
                  <div className="flex-1 overflow-y-auto px-5 py-4" style={{ minHeight: "160px" }}>
                    {text.trim() ? (
                      <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
                    ) : (
                      <p className="text-stone-300 text-sm italic">No memory written for this day.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 12-month grid */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <div className="grid grid-cols-4 gap-8">
              {MONTH_NAMES.map((monthName, mIdx) => {
                const firstDow = (new Date(calYear, mIdx, 1).getDay() + 6) % 7;
                const dim = new Date(calYear, mIdx + 1, 0).getDate();
                const cells: (number | null)[] = [
                  ...Array(firstDow).fill(null),
                  ...Array.from({ length: dim }, (_, i) => i + 1),
                ];
                while (cells.length % 7 !== 0) cells.push(null);
                return (
                  <div key={mIdx} className="flex flex-col gap-1">
                    <div className="text-sm font-semibold text-stone-700 mb-2">{monthName}</div>
                    <div className="grid grid-cols-7 gap-y-0.5">
                      {DAY_SHORT.map(ds => (
                        <div key={ds} className="text-center text-[9px] font-medium text-stone-400 pb-1">{ds}</div>
                      ))}
                      {cells.map((day, ci) => {
                        if (!day) return <div key={ci} />;
                        const dk = formatDateKey(new Date(calYear, mIdx, day));
                        const isToday = dk === todayKey;
                        const hasEntry = !!allMemories[dk]?.trim();
                        const dayMood = allMoods[dk] ? MOOD_OPTIONS.find(o => o.value === allMoods[dk]) : null;
                        return (
                          <button
                            key={ci}
                            onClick={() => handleCalDayClick(new Date(calYear, mIdx, day))}
                            className={`relative flex flex-col items-center justify-center w-7 h-7 mx-auto text-[11px] font-medium transition-colors hover:opacity-80`}
                            style={{
                              border: dayMood
                                ? `1.5px solid ${dayMood.color}`
                                : isToday
                                ? "1.5px solid #1c1917"
                                : "1.5px solid transparent",
                              color: isToday ? "#1c1917" : "#57534e",
                              fontWeight: isToday ? 700 : 400,
                              borderRadius: "2px",
                            }}
                          >
                            {day}
                            {hasEntry && !dayMood && (
                              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-stone-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const [activeView, setActiveView] = useState<ActiveView>("my-notebook");
  const [books, setBooks] = useState<(Book & { pageCount: number })[]>([]);
  const [recentTitle, setRecentTitle] = useState<{ id: number; title: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("#3b5bdb");
  const [newPattern, setNewPattern] = useState("solid");
  const [newCoverImg, setNewCoverImg] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [lockPopupId, setLockPopupId] = useState<number | null>(null);
  const [lockPw, setLockPw] = useState("");
  const [lockPwConfirm, setLockPwConfirm] = useState("");
  const [lockPwError, setLockPwError] = useState("");
  const [showLockPw, setShowLockPw] = useState(false);
  const [unlockPopupId, setUnlockPopupId] = useState<number | null>(null);
  const [unlockInput, setUnlockInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [showUnlockPw, setShowUnlockPw] = useState(false);

  const [profile, setProfile] = useState<ProfileData>(loadProfile);
  const [showProfile, setShowProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");

  // Project state
  const [projects, setProjects] = useState<ProjectDoc[]>(() => loadProjects());
  const [activeProjectId, setActiveProjectId] = useState<number | null>(() => {
    const docs = loadProjects();
    return docs.length > 0 ? docs[0].id : null;
  });
  const [focusTitleSignal, setFocusTitleSignal] = useState(0);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editProjectTitle, setEditProjectTitle] = useState("");
  const [deleteProjectConfirmId, setDeleteProjectConfirmId] = useState<number | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>(() => {
    const docs = loadProjects();
    return Object.fromEntries(docs.filter(p => !p.parentId).map(p => [p.id, true]));
  });
  const [projectSearchActive, setProjectSearchActive] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const projectSearchRef = useRef<HTMLInputElement>(null);

  const handleCreateProject = () => {
    const doc: ProjectDoc = {
      id: nextProjectId(projects),
      title: "Untitled",
      content: "",
      bannerColor: "#6366f1",
      bannerGradient: DEFAULT_PROJECT_GRADIENT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...projects, doc];
    saveProjects(updated);
    setProjects(updated);
    setActiveProjectId(doc.id);
    setFocusTitleSignal(s => s + 1);
  };

  const handleDeleteProject = (id: number) => {
    const updated = projects.filter(p => p.id !== id && p.parentId !== id);
    saveProjects(updated);
    setProjects(updated);
    setDeleteProjectConfirmId(null);
    if (activeProjectId === id) setActiveProjectId(updated.find(p => !p.parentId)?.id ?? null);
  };

  const handleCreateSubProject = (parentId: number) => {
    const doc: ProjectDoc = {
      id: nextProjectId(projects),
      parentId,
      title: "Untitled",
      content: "",
      bannerColor: "#6366f1",
      bannerGradient: DEFAULT_PROJECT_GRADIENT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...projects, doc];
    saveProjects(updated);
    setProjects(updated);
    setActiveProjectId(doc.id);
    setActiveView("project");
    setExpandedProjects(prev => ({ ...prev, [parentId]: true }));
    setFocusTitleSignal(s => s + 1);
  };

  const handleRenameProject = (id: number) => {
    if (!editProjectTitle.trim()) return;
    const updated = projects.map(p =>
      p.id === id ? { ...p, title: editProjectTitle.trim(), updatedAt: new Date().toISOString() } : p
    );
    saveProjects(updated);
    setProjects(updated);
    setEditingProjectId(null);
  };

  // Short Notes state
  const [shortNotes, setShortNotes] = useState<ShortNote[]>(() => loadShortNotes());
  const [noteSearch, setNoteSearch] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteBody, setNewNoteBody] = useState("");
  const [newNoteColor, setNewNoteColor] = useState("#f5f5f4");
  const [showNoteCreate, setShowNoteCreate] = useState(false);
  const [showColorPopup, setShowColorPopup] = useState(false);
  const [newNotePriority, setNewNotePriority] = useState<"low"|"normal"|"medium"|"important"|"urgent"|null>(null);
  const [showPriorityPopup, setShowPriorityPopup] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<number | null>(null);
  const [editNoteTitle, setEditNoteTitle] = useState("");
  const [editNoteBody, setEditNoteBody] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState(0);
  const [newNoteImages, setNewNoteImages] = useState<{ src: string; x: number; y: number; w: number }[]>([]);
  const [draggingImg, setDraggingImg] = useState<{ idx: number; ox: number; oy: number } | null>(null);
  const [newNoteVoices, setNewNoteVoices] = useState<{ name: string; data: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<number | null>(null);

  // Day Tasks state
  const [clockNow, setClockNow] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => getDateKey(new Date()));
  const [dayTasks, setDayTasks] = useState<DayTask[]>(() => loadDayTasks(getDateKey(new Date())));
  const [dayTaskTypes, setDayTaskTypes] = useState<DayTaskType[]>(() => loadDayTaskTypes());
  const [selectedTypeId, setSelectedTypeId] = useState<number | "all">("all");
  const [newTaskFocusId, setNewTaskFocusId] = useState<number | null>(null);
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [deleteTypeConfirmId, setDeleteTypeConfirmId] = useState<number | null>(null);
  const [timePickerId, setTimePickerId] = useState<number | null>(null);
  const [priorityMenuId, setPriorityMenuId] = useState<number | null>(null);
  const [notePopupId, setNotePopupId] = useState<number | null>(null);
  const [progressMenuId, setProgressMenuId] = useState<number | null>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; right: number } | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [addBtnColorIdx, setAddBtnColorIdx] = useState(0);
  const [tempHour, setTempHour] = useState("12");
  const [tempMinute, setTempMinute] = useState("00");
  const [tempAmpm, setTempAmpm] = useState<"AM" | "PM">("AM");
  const [cloneMode, setCloneMode] = useState(false);
  const [cloneTargetDates, setCloneTargetDates] = useState<string[]>([]);

  // Schedule state
  const [scheduleDate, setScheduleDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [scheduleData, setScheduleData] = useState<Record<string, Record<number, string>>>(() => loadScheduleNotes());
  const [scheduleCustomTimes, setScheduleCustomTimes] = useState<Record<string, Record<number, string>>>(() => loadScheduleCustomTimes());
  const [editingTimeSlot, setEditingTimeSlot] = useState<number | null>(null);
  const [editingTimeStr, setEditingTimeStr] = useState<string>("");
  const [amPlanMode, setAmPlanMode] = useState<boolean>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return loadSchedulePlanMode()[today]?.am ?? false;
  });
  const [pmPlanMode, setPmPlanMode] = useState<boolean>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return loadSchedulePlanMode()[today]?.pm ?? false;
  });
  const [scheduleCellColors, setScheduleCellColors] = useState<Record<string, Record<number, string>>>(() => loadScheduleCellColors());
  const [colorPickerSlot, setColorPickerSlot] = useState<number | null>(null);
  const [schedulePlanDone, setSchedulePlanDone] = useState<Record<string, Record<number, boolean>>>(() => loadSchedulePlanDone());
  const colorPickerRef = useRef<HTMLDivElement>(null);

  function updateScheduleNote(date: string, hour: number, text: string) {
    setScheduleData(prev => {
      const next = { ...prev, [date]: { ...(prev[date] ?? {}), [hour]: text } };
      saveScheduleNotes(next);
      return next;
    });
  }

  function updateScheduleCustomTime(date: string, hour: number, time: string) {
    setScheduleCustomTimes(prev => {
      const next = { ...prev, [date]: { ...(prev[date] ?? {}), [hour]: time } };
      saveScheduleCustomTimes(next);
      return next;
    });
  }

  function updateScheduleCellColor(date: string, hour: number, color: string | null) {
    setScheduleCellColors(prev => {
      const dateCols = { ...(prev[date] ?? {}) };
      if (color === null) { delete dateCols[hour]; } else { dateCols[hour] = color; }
      const next = { ...prev, [date]: dateCols };
      saveScheduleCellColors(next);
      return next;
    });
  }

  function toggleSchedulePlanDone(date: string, hour: number) {
    setSchedulePlanDone(prev => {
      const dateDone = { ...(prev[date] ?? {}) };
      dateDone[hour] = !dateDone[hour];
      const next = { ...prev, [date]: dateDone };
      saveSchedulePlanDone(next);
      return next;
    });
  }

  function scheduleNavDate(delta: number) {
    setScheduleDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta);
      return d.toISOString().slice(0, 10);
    });
  }

  const popupRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const lockPopupRef = useRef<HTMLDivElement>(null);
  const unlockPopupRef = useRef<HTMLDivElement>(null);
  const profilePopupRef = useRef<HTMLDivElement>(null);
  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const noteImgInputRef = useRef<HTMLInputElement>(null);
  const noteAudioInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const noteBodyRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElemsRef = useRef<Map<number, HTMLAudioElement>>(new Map());

  const refresh = useCallback(() => {
    const summary = store.getSummary();
    const allBooks = store.listBooks().map((b) => ({
      ...b,
      pageCount: summary.recentBooks.find((r) => r.id === b.id)?.pageCount ?? store.listPages(b.id).length,
    }));
    setBooks(allBooks);
    const recent = summary.recentBooks[0];
    setRecentTitle(recent ? { id: recent.id, title: recent.title } : null);
  }, []);

  useEffect(() => { store.initDefaults(); refresh(); }, [refresh]);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClockNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (colorPickerSlot === null) return;
    function handleClick(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerSlot(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [colorPickerSlot]);

  // Reload tasks when date changes
  useEffect(() => {
    setDayTasks(loadDayTasks(selectedDate));
    setSelectedTypeId("all");
    setNewTaskFocusId(null);
  }, [selectedDate]);

  // Reload AM/PM plan mode when schedule date changes
  useEffect(() => {
    const saved = loadSchedulePlanMode()[scheduleDate];
    setAmPlanMode(saved?.am ?? false);
    setPmPlanMode(saved?.pm ?? false);
  }, [scheduleDate]);

  useEffect(() => {
    if (!showCreate) return;
    const handler = (e: MouseEvent) => { if (popupRef.current && !popupRef.current.contains(e.target as Node)) setShowCreate(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCreate]);

  useEffect(() => {
    if (lockPopupId === null) return;
    const handler = (e: MouseEvent) => { if (lockPopupRef.current && !lockPopupRef.current.contains(e.target as Node)) closeLockPopup(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [lockPopupId]);

  useEffect(() => {
    if (!showProfile) return;
    const handler = (e: MouseEvent) => { if (profilePopupRef.current && !profilePopupRef.current.contains(e.target as Node)) { setShowProfile(false); setEditingProfile(false); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showProfile]);

  useEffect(() => {
    if (unlockPopupId === null) return;
    const handler = (e: MouseEvent) => { if (unlockPopupRef.current && !unlockPopupRef.current.contains(e.target as Node)) closeUnlockPopup(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [unlockPopupId]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e: MouseEvent) => { if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) setShowEmojiPicker(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker]);

  useEffect(() => {
    const anyOpen = notePopupId !== null || timePickerId !== null || priorityMenuId !== null || progressMenuId !== null;
    if (!anyOpen) return;
    const handler = () => { setNotePopupId(null); setTimePickerId(null); setPriorityMenuId(null); setProgressMenuId(null); setDeleteConfirmId(null); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notePopupId, timePickerId, priorityMenuId, progressMenuId]);


  const closeLockPopup = () => { setLockPopupId(null); setLockPw(""); setLockPwConfirm(""); setLockPwError(""); setShowLockPw(false); };
  const closeUnlockPopup = () => { setUnlockPopupId(null); setUnlockInput(""); setUnlockError(""); setShowUnlockPw(false); };

  const openLockPopup = (e: React.MouseEvent, bookId: number) => { e.preventDefault(); closeLockPopup(); closeUnlockPopup(); setLockPopupId(bookId); };

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockPw.trim()) { setLockPwError("Password cannot be empty."); return; }
    if (lockPw !== lockPwConfirm) { setLockPwError("Passwords do not match."); return; }
    store.updateBook(lockPopupId!, { password: lockPw });
    closeLockPopup(); refresh();
  };

  const handleRemovePassword = () => { store.updateBook(lockPopupId!, { password: undefined }); closeLockPopup(); refresh(); };

  const handleBookClick = (e: React.MouseEvent, book: Book) => {
    if (book.password) { e.preventDefault(); setUnlockPopupId(book.id); setUnlockInput(""); setUnlockError(""); setShowUnlockPw(false); }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const book = books.find(b => b.id === unlockPopupId);
    if (!book) return;
    if (unlockInput === book.password) { closeUnlockPopup(); navigate(`/books/${book.id}`); }
    else setUnlockError("Incorrect password. Try again.");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setNewCoverImg(ev.target?.result as string); };
    reader.readAsDataURL(file);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault(); if (!newTitle.trim()) return;
    store.createBook({ title: newTitle.trim(), color: newColor, pattern: newPattern, coverImg: newCoverImg });
    setShowCreate(false); setNewTitle(""); setNewColor("#3b5bdb"); setNewPattern("solid"); setNewCoverImg(undefined);
    refresh();
  };

  const startEditing = (e: React.MouseEvent, book: { id: number; title: string }) => {
    e.preventDefault(); setEditingId(book.id); setEditingTitle(book.title);
    setTimeout(() => { editInputRef.current?.select(); }, 30);
  };

  const saveEditing = () => {
    if (editingId === null) return;
    const trimmed = editingTitle.trim();
    if (trimmed) store.updateBook(editingId, { title: trimmed });
    setEditingId(null); refresh();
  };

  const cancelEditing = () => setEditingId(null);

  const handleDelete = (e: React.MouseEvent, bookId: number) => {
    e.preventDefault();
    if (confirm("Delete this notebook and all its pages?")) { store.deleteBook(bookId); refresh(); }
  };

  // ── Short Note handlers ──────────────────────────────────────
  const handleCreateNote = () => {
    const note: ShortNote = {
      id: nextNoteId(shortNotes),
      title: newNoteTitle.trim() || "Untitled",
      body: newNoteBody.trim(),
      color: newNoteColor,
      priority: newNotePriority ?? undefined,
      images: newNoteImages.length > 0 ? newNoteImages : undefined,
      voices: newNoteVoices.length > 0 ? newNoteVoices : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [note, ...shortNotes];
    saveShortNotes(updated);
    setShortNotes(updated);
    setNewNoteTitle(""); setNewNoteBody(""); setNewNoteColor("#f5f5f4"); setNewNotePriority(null);
    setNewNoteImages([]); setNewNoteVoices([]);
  };

  const handleSelectNote = (note: ShortNote) => {
    setSelectedNoteId(note.id);
    setNewNoteTitle(note.title);
    setNewNoteBody(note.body);
    setNewNoteColor(note.color);
    setNewNotePriority(note.priority ?? null);
    setNewNoteImages(note.images ?? []);
    setNewNoteVoices(note.voices ?? []);
    setShowColorPopup(false);
    setShowPriorityPopup(false);
  };

  const handleSaveSelectedNote = () => {
    if (selectedNoteId === null) return;
    const updated = shortNotes.map((n) =>
      n.id === selectedNoteId
        ? { ...n, title: newNoteTitle.trim() || "Untitled", body: newNoteBody, color: newNoteColor, priority: newNotePriority ?? undefined, images: newNoteImages.length > 0 ? newNoteImages : undefined, voices: newNoteVoices.length > 0 ? newNoteVoices : undefined, updatedAt: new Date().toISOString() }
        : n
    );
    saveShortNotes(updated);
    setShortNotes(updated);
  };

  const clearSelectedNote = () => {
    setSelectedNoteId(null);
    setNewNoteTitle(""); setNewNoteBody(""); setNewNoteColor("#f5f5f4"); setNewNotePriority(null);
    setNewNoteImages([]); setNewNoteVoices([]);
  };

  const insertEmoji = (emoji: string) => {
    const textarea = noteTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart ?? newNoteBody.length;
      const end = textarea.selectionEnd ?? newNoteBody.length;
      const newVal = newNoteBody.slice(0, start) + emoji + newNoteBody.slice(end);
      setNewNoteBody(newVal);
      setTimeout(() => { textarea.selectionStart = textarea.selectionEnd = start + emoji.length; textarea.focus(); }, 0);
    } else {
      setNewNoteBody(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleNoteImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const container = noteBodyRef.current;
      const cx = container ? container.clientWidth / 2 - 80 : 60;
      const cy = container ? container.clientHeight / 2 - 80 : 60;
      setNewNoteImages(prev => [...prev, { src: ev.target?.result as string, x: cx, y: cy, w: 160 }]);
    };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const startDragImg = (e: React.MouseEvent, idx: number) => {
    e.preventDefault(); e.stopPropagation();
    const container = noteBodyRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const img = newNoteImages[idx];
    const ox = e.clientX - rect.left - img.x;
    const oy = e.clientY - rect.top - img.y;
    setDraggingImg({ idx, ox, oy });
    const onMove = (me: MouseEvent) => {
      const r = container.getBoundingClientRect();
      setNewNoteImages(prev => prev.map((im, i) => i === idx ? { ...im, x: me.clientX - r.left - ox, y: me.clientY - r.top - oy } : im));
    };
    const onUp = () => { setDraggingImg(null); document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const handleNoteAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setNewNoteVoices(prev => [...prev, { name: file.name, data: ev.target?.result as string }]); };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = (ev) => {
          setNewNoteVoices(prev => [...prev, { name: `Recording ${prev.length + 1}`, data: ev.target?.result as string }]);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(); mediaRecorderRef.current = mr; setIsRecording(true);
    } catch { alert("Microphone access denied."); }
  };

  const stopRecording = () => { mediaRecorderRef.current?.stop(); setIsRecording(false); };

  const togglePlayVoice = (idx: number, data: string) => {
    const existing = audioElemsRef.current.get(idx);
    if (existing) { existing.pause(); existing.currentTime = 0; audioElemsRef.current.delete(idx); setPlayingVoice(null); return; }
    if (playingVoice !== null) {
      const prev = audioElemsRef.current.get(playingVoice);
      if (prev) { prev.pause(); prev.currentTime = 0; audioElemsRef.current.delete(playingVoice); }
    }
    const audio = new Audio(data);
    audio.onended = () => { audioElemsRef.current.delete(idx); setPlayingVoice(null); };
    audio.play();
    audioElemsRef.current.set(idx, audio);
    setPlayingVoice(idx);
  };

  const handleDeleteNote = (id: number) => {
    const updated = shortNotes.filter((n) => n.id !== id);
    saveShortNotes(updated);
    setShortNotes(updated);
  };

  const startEditNote = (note: ShortNote) => {
    setEditingNoteId(note.id);
    setEditNoteTitle(note.title);
    setEditNoteBody(note.body);
  };

  const saveEditNote = () => {
    if (editingNoteId === null) return;
    const updated = shortNotes.map((n) =>
      n.id === editingNoteId
        ? { ...n, title: editNoteTitle.trim() || "Untitled", body: editNoteBody, updatedAt: new Date().toISOString() }
        : n
    );
    saveShortNotes(updated);
    setShortNotes(updated);
    setEditingNoteId(null);
  };

  const filteredNotes = noteSearch.trim()
    ? shortNotes.filter((n) => n.title.toLowerCase().includes(noteSearch.toLowerCase()) || n.body.toLowerCase().includes(noteSearch.toLowerCase()))
    : shortNotes;
  // ─────────────────────────────────────────────────────────────

  const handleDownload = () => {
    const data = { notebooks: store.listBooks(), pages: store.listBooks().flatMap((b) => store.listPages(b.id).map((p) => ({ ...p, bookId: b.id }))), exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `my-notebooks-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.notebooks) { alert("Invalid backup file."); return; }
        if (!confirm(`Import ${data.notebooks.length} notebook(s)? Existing data will be kept.`)) return;
        data.notebooks.forEach((nb: Book) => {
          const created = store.createBook({ title: nb.title, color: nb.color, pattern: nb.pattern, coverImg: nb.coverImg });
          const nbPages = (data.pages ?? []).filter((p: { bookId: number }) => p.bookId === nb.id);
          nbPages.forEach((pg: { type: string; content: string }) => { store.createPage(created.id, { title: "Imported page", pageType: pg.type as "blank" | "lined" | "spreadsheet", content: pg.content }); });
        });
        refresh(); alert("Import successful!");
      } catch { alert("Failed to read file."); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  const handleProfilePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { const updated = { ...profile, photo: ev.target?.result as string }; setProfile(updated); saveProfile(updated); };
    reader.readAsDataURL(file); e.target.value = "";
  };

  const startEditProfile = () => { setEditName(profile.name); setEditUsername(profile.username); setEditEmail(profile.email); setEditingProfile(true); };

  const saveEditProfile = () => {
    const updated = { ...profile, name: editName.trim(), username: editUsername.trim().replace(/\s+/g, ""), email: editEmail.trim() };
    setProfile(updated); saveProfile(updated); setEditingProfile(false);
  };

  const formatJoined = (iso: string) => {
    const [year, month] = iso.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  };

  const totalPages = books.reduce((sum, b) => sum + b.pageCount, 0);
  const filteredBooks = searchQuery.trim() ? books.filter((b) => b.title.toLowerCase().includes(searchQuery.toLowerCase())) : books;

  const handleNavClick = (item: typeof NAV_ITEMS[0]) => {
    if (!item.active) return;
    setActiveView(item.id);
  };

  return (
    <div className="h-screen w-full bg-[#f8f7f4] flex overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className={`flex-shrink-0 h-screen sticky top-0 flex flex-col bg-white border-r border-stone-200 transition-all duration-300 shadow-sm ${sidebarCollapsed ? "w-16" : "w-60"}`}>

        {/* Logo + collapse */}
        <div className={`flex items-center border-b border-stone-100 py-4 ${sidebarCollapsed ? "flex-col gap-2 px-2" : "justify-between px-4"}`}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0">
              <BookMarked className="w-3.5 h-3.5 text-white" />
            </div>
            {!sidebarCollapsed && <span className="font-serif font-bold text-stone-800 text-sm truncate">My Notebooks</span>}
          </div>
          <button
            onClick={() => setSidebarCollapsed(v => !v)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all flex-shrink-0"
          >
            {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="px-2 pt-3 flex flex-col gap-0.5 flex-1 overflow-y-auto pb-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSelected = activeView === item.id;
            const isClickable = item.active;

            return (
              <div key={item.id} className="relative">
                {/* Spacing before Task */}
                {item.id === "task" && <div className="mt-1" />}
                {item.id === "project" && !sidebarCollapsed ? (
                  <div className={`w-full flex items-center rounded-lg transition-all ${isSelected ? "bg-blue-50 text-blue-700" : ""}`}>
                    {/* Left: search input OR clickable nav label */}
                    {isSelected && projectSearchActive ? (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 px-2 py-2">
                        <Search className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                        <input
                          ref={projectSearchRef}
                          autoFocus
                          value={projectSearchQuery}
                          onChange={e => setProjectSearchQuery(e.target.value)}
                          onKeyDown={e => { if (e.key === "Escape") { setProjectSearchActive(false); setProjectSearchQuery(""); } }}
                          placeholder="Search projects..."
                          className="flex-1 text-xs bg-transparent outline-none text-stone-800 placeholder:text-stone-400 min-w-0"
                        />
                        {projectSearchQuery && (
                          <button onClick={() => setProjectSearchQuery("")} className="text-stone-400 hover:text-stone-600 flex-shrink-0">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleNavClick(item)}
                        title={item.label}
                        className={`flex items-center gap-2.5 flex-1 min-w-0 px-2 py-2.5 text-left font-semibold text-sm truncate ${isSelected ? "text-blue-700" : "text-stone-600 hover:text-stone-900"}`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-blue-600" : "text-stone-500"}`} />
                        <span className="truncate flex-1">{item.label}</span>
                      </button>
                    )}
                    {/* Right: 3 inline action buttons — always visible when Project is active */}
                    {isSelected && (
                      <div className="flex items-center gap-0.5 pr-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectSearchActive(v => { if (v) setProjectSearchQuery(""); return !v; });
                          }}
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${projectSearchActive ? "text-blue-600 bg-blue-100" : "text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50"}`}
                          title={projectSearchActive ? "Close search" : "Search projects"}
                        >
                          <Search className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const expandableIds = projects.filter(p => !p.parentId && projects.some(c => c.parentId === p.id)).map(p => p.id);
                            const allExp = expandableIds.length > 0 && expandableIds.every(id => expandedProjects[id]);
                            setExpandedProjects(prev => { const next = { ...prev }; expandableIds.forEach(id => { next[id] = !allExp; }); return next; });
                          }}
                          className="w-5 h-5 rounded-md flex items-center justify-center text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 transition-all"
                          title={(() => { const ids = projects.filter(p => !p.parentId && projects.some(c => c.parentId === p.id)).map(p => p.id); return ids.length > 0 && ids.every(id => expandedProjects[id]) ? "Collapse all sub-projects" : "Expand all sub-projects"; })()}
                        >
                          {(() => { const ids = projects.filter(p => !p.parentId && projects.some(c => c.parentId === p.id)).map(p => p.id); return ids.length > 0 && ids.every(id => expandedProjects[id]) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />; })()}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveView("project"); handleCreateProject(); }}
                          className="w-5 h-5 rounded-md flex items-center justify-center text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 transition-all"
                          title="New project"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => handleNavClick(item)}
                    title={!isClickable ? `${item.label} — coming soon` : item.label}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-2 py-2.5 transition-all text-left
                      ${sidebarCollapsed ? "justify-center" : ""}
                      ${isSelected
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : isClickable
                          ? "text-stone-600 hover:bg-stone-50 hover:text-stone-900 cursor-pointer"
                          : "text-stone-300 cursor-not-allowed"
                      }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-blue-600" : isClickable ? "text-stone-500" : "text-stone-300"}`} />
                    {!sidebarCollapsed && (
                      <span className="text-sm truncate flex-1">{item.label}</span>
                    )}
                    {!sidebarCollapsed && !isClickable && (
                      <span className="text-[9px] bg-stone-100 text-stone-400 rounded-full px-1.5 py-0.5 flex-shrink-0">Soon</span>
                    )}
                  </button>
                )}
                {/* Project list — inline right after Project button */}
                {item.id === "project" && isSelected && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {(() => {
                      const query = projectSearchQuery.toLowerCase().trim();

                      // ── SEARCH MODE: flat list of all matches ──────────
                      if (query) {
                        const matches = projects.filter(p => p.title.toLowerCase().includes(query));
                        if (matches.length === 0) return (
                          <p className="text-xs text-stone-400 pl-3 py-1.5">No results for "{projectSearchQuery}"</p>
                        );
                        return matches.map(p => {
                          const parent = p.parentId ? projects.find(pp => pp.id === p.parentId) : null;
                          return (
                            <div key={p.id} className="group relative">
                              <button
                                onClick={() => { setActiveProjectId(p.id); setActiveView("project"); setProjectSearchActive(false); setProjectSearchQuery(""); }}
                                className={`w-full flex items-center gap-2 rounded-lg pr-2 py-1.5 transition-all text-left pl-2 ${
                                  activeProjectId === p.id ? "bg-indigo-50 text-indigo-700 font-medium" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                                }`}
                                title={p.title}
                              >
                                <span className="w-3 flex-shrink-0 inline-flex items-center justify-center">
                                  <span className={`w-1.5 h-1.5 rounded-full ${activeProjectId === p.id ? "bg-indigo-500" : "bg-stone-300"}`} />
                                </span>
                                {!sidebarCollapsed && (
                                  <span className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs truncate flex items-center gap-1">
                                      {p.emoji && <span className="flex-shrink-0">{p.emoji}</span>}
                                      {p.title}
                                    </span>
                                    {parent && <span className="text-[9px] text-stone-400 truncate">{parent.title}</span>}
                                  </span>
                                )}
                              </button>
                            </div>
                          );
                        });
                      }

                      // ── NORMAL MODE: tree structure ────────────────────
                      const topLevel = projects.filter(p => !p.parentId);

                      const renderChildRow = (p: ProjectDoc) => (
                        <div key={p.id} className="group relative">
                          {editingProjectId === p.id ? (
                            <div className="flex items-center gap-1 pr-1 py-1 pl-3">
                              <input
                                autoFocus
                                value={editProjectTitle}
                                onChange={e => setEditProjectTitle(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") handleRenameProject(p.id); if (e.key === "Escape") setEditingProjectId(null); }}
                                className="flex-1 text-xs border border-indigo-300 rounded-md px-2 py-1 outline-none bg-white min-w-0"
                              />
                              <button onClick={() => handleRenameProject(p.id)} className="text-green-600 hover:text-green-700 flex-shrink-0">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setActiveProjectId(p.id); setActiveView("project"); }}
                              className={`w-full flex items-center gap-2 rounded-lg pr-2 py-1.5 transition-all text-left pl-3 ${sidebarCollapsed ? "justify-center pl-2" : ""} ${
                                activeProjectId === p.id ? "bg-indigo-50 text-indigo-600 font-medium" : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                              }`}
                              title={p.title}
                            >
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-stone-300" />
                              {!sidebarCollapsed && (
                                <span className="text-xs truncate flex-1 flex items-center gap-1">
                                  {p.emoji && <span className="flex-shrink-0">{p.emoji}</span>}
                                  {p.title}
                                </span>
                              )}
                            </button>
                          )}
                          {!sidebarCollapsed && editingProjectId !== p.id && (
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                              {deleteProjectConfirmId === p.id ? (
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} className="w-5 h-5 rounded flex items-center justify-center text-white bg-red-500 hover:bg-red-600" title="Confirm delete">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              ) : (
                                <button onClick={(e) => { e.stopPropagation(); setDeleteProjectConfirmId(p.id); setTimeout(() => setDeleteProjectConfirmId(null), 3000); }} className="w-5 h-5 rounded flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50" title="Delete">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );

                      return topLevel.map(p => {
                        const allChildren = projects.filter(c => c.parentId === p.id);
                        const hasChildren = allChildren.length > 0;
                        const isExpanded = !!expandedProjects[p.id];

                        return (
                          <div key={p.id}>
                            {/* Parent project row */}
                            <div className="group relative">
                              {editingProjectId === p.id ? (
                                <div className="flex items-center gap-1 pr-1 py-1 pl-2">
                                  <input
                                    autoFocus
                                    value={editProjectTitle}
                                    onChange={e => setEditProjectTitle(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") handleRenameProject(p.id); if (e.key === "Escape") setEditingProjectId(null); }}
                                    className="flex-1 text-xs border border-indigo-300 rounded-md px-2 py-1 outline-none bg-white min-w-0"
                                  />
                                  <button onClick={() => handleRenameProject(p.id)} className="text-green-600 hover:text-green-700 flex-shrink-0">
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveProjectId(p.id);
                                    setActiveView("project");
                                    if (hasChildren) setExpandedProjects(prev => ({ ...prev, [p.id]: !prev[p.id] }));
                                  }}
                                  className={`w-full flex items-center gap-2 rounded-lg pr-2 py-1.5 transition-all text-left pl-2 ${sidebarCollapsed ? "justify-center" : ""} ${
                                    activeProjectId === p.id ? "bg-indigo-50 text-indigo-700 font-medium" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                                  }`}
                                  title={p.title}
                                >
                                  {hasChildren ? (
                                    <span
                                      className="text-stone-400 text-[10px] w-3 flex-shrink-0 inline-block"
                                      style={{ transition: "transform 200ms cubic-bezier(0.4,0,0.2,1)", transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}
                                    >▼</span>
                                  ) : (
                                    <span className="w-3 flex-shrink-0 inline-flex items-center justify-center">
                                      <span className={`w-1.5 h-1.5 rounded-full ${activeProjectId === p.id ? "bg-indigo-500" : "bg-stone-300"}`} />
                                    </span>
                                  )}
                                  {!sidebarCollapsed && (
                                    <span className="text-xs truncate flex-1 flex items-center gap-1">
                                      {p.emoji && <span className="flex-shrink-0">{p.emoji}</span>}
                                      {p.title}
                                    </span>
                                  )}
                                </button>
                              )}
                              {!sidebarCollapsed && editingProjectId !== p.id && (
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleCreateSubProject(p.id); }}
                                    className="w-5 h-5 rounded flex items-center justify-center text-stone-400 hover:text-indigo-600 hover:bg-indigo-50"
                                    title="Add sub-project"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                  {deleteProjectConfirmId === p.id ? (
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }} className="w-5 h-5 rounded flex items-center justify-center text-white bg-red-500 hover:bg-red-600" title="Confirm delete">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteProjectConfirmId(p.id); setTimeout(() => setDeleteProjectConfirmId(null), 3000); }} className="w-5 h-5 rounded flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50" title="Delete">
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Animated children */}
                            {hasChildren && !sidebarCollapsed && (
                              <AnimatedChildren open={isExpanded}>
                                <div className="ml-2 border-l-2 border-indigo-200 pl-1 mb-0.5">
                                  {allChildren.map(child => renderChildRow(child))}
                                </div>
                              </AnimatedChildren>
                            )}
                          </div>
                        );
                      });
                    })()}
                    {projects.length === 0 && !sidebarCollapsed && (
                      <p className="text-xs text-stone-400 pl-7 py-1">No projects yet</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        </nav>

        {/* Bottom stats */}
        {!sidebarCollapsed && activeView === "my-notebook" && (
          <div className="border-t border-stone-100 px-4 py-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <BookOpen className="w-3 h-3" />
                <span>{books.length} notebook{books.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-400">
                <FileText className="w-3 h-3" />
                <span>{totalPages} page{totalPages !== 1 ? "s" : ""}</span>
              </div>
            </div>
            {recentTitle && (
              <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-0.5">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">Recent: {recentTitle.title}</span>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* My Notebook view */}
        {activeView === "my-notebook" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto">

            {/* Header Card */}
            <div className="mb-10 rounded-2xl border border-stone-200 bg-white shadow-sm px-8 py-3">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1 min-w-0">
                  <h1 className="text-2xl font-serif font-bold text-stone-800 leading-tight">My Notebooks</h1>
                  <div className="flex items-center gap-2 text-xs text-stone-500 flex-wrap">
                    <span className="flex items-center gap-1.5 bg-stone-100 rounded-full px-3 py-1"><BookOpen className="w-3.5 h-3.5" />{books.length} notebook{books.length !== 1 ? "s" : ""}</span>
                    <span className="flex items-center gap-1.5 bg-stone-100 rounded-full px-3 py-1"><FileText className="w-3.5 h-3.5" />{totalPages} page{totalPages !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`flex items-center gap-2 border rounded-xl bg-stone-50 px-3 py-2 transition-all duration-300 ${searchFocused || searchQuery ? "w-72 border-stone-400 bg-white shadow-sm" : "w-56 border-stone-200"}`}>
                    <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search notebooks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setSearchFocused(false)}
                      className="bg-transparent text-sm text-stone-700 placeholder:text-stone-400 outline-none w-full min-w-0"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="text-stone-400 hover:text-stone-600"><X className="w-3 h-3" /></button>
                    )}
                  </div>
                  <button onClick={handleDownload} title="Download backup" className="flex items-center justify-center w-9 h-9 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 text-stone-600 transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                  <label title="Import backup" className="flex items-center justify-center w-9 h-9 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 text-stone-600 transition-all cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <input type="file" accept=".json" className="hidden" onChange={handleUpload} />
                  </label>
                </div>
              </div>
            </div>

            {searchQuery && filteredBooks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-stone-400 gap-2">
                <Search className="w-8 h-8 opacity-30" />
                <p className="text-sm">No notebooks found for "<span className="font-medium text-stone-500">{searchQuery}</span>"</p>
              </div>
            )}

            {/* Grid layout */}
            {(() => {
              const totalSlots = Math.ceil((filteredBooks.length + 1) / COLS) * COLS;
              const ghostCount = totalSlots - filteredBooks.length - 1;
              return (
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
              {filteredBooks.map((book) => {
                const isLocked = !!book.password;
                const isLockOpen = lockPopupId === book.id;
                const isUnlockOpen = unlockPopupId === book.id;
                return (
                  <div
                    key={book.id}
                    className="group flex flex-col gap-3 select-none"
                  >
                    <div className="relative">
                      <Link href={`/books/${book.id}`} onClick={(e) => { handleBookClick(e, book); }} className="block" draggable={false}>
                        <div
                          className={`aspect-[3/4] rounded-md transition-transform duration-300 relative overflow-hidden ${isLockOpen || isUnlockOpen ? "shadow-none" : "shadow-md group-hover:-translate-y-2 group-hover:shadow-xl"}`}
                          style={coverStyle((book as any).pattern ?? "solid", book.color || "#1e293b", (book as any).coverImg)}
                        >
                          {!(book as any).coverImg && <div className="absolute left-4 top-0 bottom-0 w-px bg-black/20" />}
                          {isLocked && <div className="absolute top-2 right-2 w-6 h-6 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"><Lock className="w-3 h-3 text-white" /></div>}
                        </div>
                      </Link>

                      {isLockOpen && (
                        <div ref={lockPopupRef} className="absolute inset-0 rounded-md z-50 flex items-center justify-center">
                          <div className="bg-white rounded-lg shadow-xl border border-stone-100 mx-2.5 w-full flex flex-col gap-1.5 p-2.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1"><Lock className="w-3 h-3 text-stone-600" /><span className="text-[10px] font-semibold text-stone-700">{isLocked ? "Change Lock" : "Set Lock"}</span></div>
                              <button onClick={closeLockPopup} className="text-stone-400 hover:text-stone-600"><X className="w-3 h-3" /></button>
                            </div>
                            <form onSubmit={handleSetPassword} className="flex flex-col gap-1">
                              <div className="relative">
                                <input autoFocus type={showLockPw ? "text" : "password"} placeholder="New password" value={lockPw} onChange={e => { setLockPw(e.target.value); setLockPwError(""); }} className="w-full text-[10px] border border-stone-200 rounded px-2 py-1 pr-6 outline-none focus:border-stone-400 bg-stone-50" />
                                <button type="button" onClick={() => setShowLockPw(v => !v)} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">{showLockPw ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}</button>
                              </div>
                              <input type={showLockPw ? "text" : "password"} placeholder="Confirm password" value={lockPwConfirm} onChange={e => { setLockPwConfirm(e.target.value); setLockPwError(""); }} className="w-full text-[10px] border border-stone-200 rounded px-2 py-1 outline-none focus:border-stone-400 bg-stone-50" />
                              {lockPwError && <p className="text-[9px] text-red-500 leading-tight">{lockPwError}</p>}
                              <button type="submit" className="w-full bg-stone-800 text-white text-[10px] font-semibold py-1 rounded hover:bg-stone-700 transition-colors">{isLocked ? "Update" : "Set Password"}</button>
                            </form>
                            {isLocked && <button onClick={handleRemovePassword} className="w-full text-[9px] text-red-500 hover:text-red-700 py-0.5 border border-red-200 rounded hover:bg-red-50 transition-colors">Remove Lock</button>}
                          </div>
                        </div>
                      )}

                      {isUnlockOpen && (
                        <div ref={unlockPopupRef} className="absolute inset-0 rounded-md z-50 flex items-center justify-center">
                          <div className="bg-white rounded-lg shadow-xl border border-stone-100 mx-2.5 w-full flex flex-col gap-1.5 p-2.5 relative">
                            <button onClick={closeUnlockPopup} className="absolute top-1.5 right-1.5 text-stone-400 hover:text-stone-600"><X className="w-3 h-3" /></button>
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center"><Lock className="w-3 h-3 text-stone-600" /></div>
                              <span className="text-[10px] font-semibold text-stone-700 text-center leading-tight truncate w-full text-center px-4">{book.title}</span>
                            </div>
                            <form onSubmit={handleUnlock} className="flex flex-col gap-1">
                              <div className="relative">
                                <input autoFocus type={showUnlockPw ? "text" : "password"} placeholder="Password" value={unlockInput} onChange={e => { setUnlockInput(e.target.value); setUnlockError(""); }} className="w-full text-[10px] border border-stone-200 rounded px-2 py-1 pr-6 outline-none focus:border-stone-400 bg-stone-50" />
                                <button type="button" onClick={() => setShowUnlockPw(v => !v)} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">{showUnlockPw ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}</button>
                              </div>
                              {unlockError && <p className="text-[9px] text-red-500 leading-tight">{unlockError}</p>}
                              <button type="submit" className="w-full bg-stone-800 text-white text-[10px] font-semibold py-1 rounded hover:bg-stone-700 transition-colors">Open</button>
                            </form>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Title row */}
                    <div className="px-1 flex justify-between items-start group/text">
                      <div className="flex-1 min-w-0">
                        {editingId === book.id ? (
                          <input ref={editInputRef} value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} onBlur={saveEditing} onKeyDown={(e) => { if (e.key === "Enter") saveEditing(); if (e.key === "Escape") cancelEditing(); }} onClick={(e) => e.preventDefault()} className="font-serif font-medium text-sm w-full bg-white border-b-2 border-stone-400 outline-none text-stone-800 px-0 py-0.5" autoFocus />
                        ) : (
                          <h3 className="font-serif font-medium text-sm line-clamp-2 cursor-text hover:text-stone-500 transition-colors" onClick={(e) => startEditing(e, book)} title="Click to rename">{book.title}</h3>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{book.pageCount} pages</p>
                      </div>
                      <div className="flex items-center opacity-0 group-hover/text:opacity-100 transition-all">
                        <button onClick={(e) => openLockPopup(e, book.id)} className={`p-1.5 transition-all shrink-0 ${isLocked ? "text-amber-500 hover:text-amber-600 opacity-100" : "text-muted-foreground hover:text-stone-700"}`} title={isLocked ? "Locked — click to change" : "Set password"}>
                          {isLocked ? <Lock className="w-3.5 h-3.5" /> : <LockOpen className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={(e) => handleDelete(e, book.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-all shrink-0" title="Delete Notebook"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* New Notebook button — right after books */}
              <div className="relative flex flex-col gap-3" ref={popupRef}>
                <button
                  onClick={() => setShowCreate((v) => !v)}
                  className="aspect-[3/4] rounded-md border-2 border-dashed border-stone-300 bg-[#faf6f0] hover:border-stone-400 hover:bg-[#f5efe6] transition-all flex flex-col items-center justify-center gap-2 group w-full"
                >
                  <div className="w-10 h-10 rounded-full bg-stone-200 group-hover:bg-stone-300 transition-colors flex items-center justify-center">
                    <Plus className="w-5 h-5 text-stone-500" />
                  </div>
                  <span className="text-xs text-stone-400 font-medium">New Notebook</span>
                </button>
                <div className="px-1 h-5" />

                {showCreate && (
                  <div className="absolute top-0 left-[calc(100%+12px)] z-50 w-72 bg-white rounded-xl shadow-2xl border border-stone-200 p-4 flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-14 rounded-md shadow flex-shrink-0 relative overflow-hidden" style={coverStyle(newPattern, newColor, newCoverImg)}>
                        {!newCoverImg && <div className="absolute left-2 top-0 bottom-0 w-px bg-black/20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-stone-400 mb-1">Preview</p>
                        <p className="font-serif text-sm font-medium truncate text-stone-700">{newTitle || "Untitled"}</p>
                      </div>
                    </div>
                    <form onSubmit={handleCreate} className="flex flex-col gap-3">
                      <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Title</label>
                        <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Notebook name..." className="mt-1 w-full text-sm border border-stone-200 rounded-lg px-3 py-2 outline-none focus:border-stone-400 bg-stone-50" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Cover Color</label>
                        <div className="mt-1.5 grid grid-cols-6 gap-1.5">
                          {PRESET_COLORS.map((c) => (
                            <button key={c} type="button" onClick={() => { setNewColor(c); setNewCoverImg(undefined); }} className="w-8 h-8 rounded-md border-2 transition-all flex items-center justify-center" style={{ backgroundColor: c, borderColor: newColor === c && !newCoverImg ? "#000" : "transparent" }}>
                              {newColor === c && !newCoverImg && <Check className="w-3 h-3 text-white drop-shadow" />}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Cover Design</label>
                        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                          {COVER_PATTERNS.map((p) => (
                            <button key={p.id} type="button" onClick={() => { setNewPattern(p.id); setNewCoverImg(undefined); }} className={`h-9 rounded-md border-2 text-[10px] font-semibold transition-all relative overflow-hidden ${newPattern === p.id && !newCoverImg ? "border-stone-700 ring-1 ring-stone-700" : "border-stone-200"}`} style={patternStyle(p.id, newColor)}>
                              <span className="relative z-10 text-white drop-shadow-sm">{p.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Cover Image</label>
                        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                          {DEFAULT_COVER_IMAGES.map((img) => (
                            <button key={img.id} type="button" onClick={() => setNewCoverImg(img.url)} className={`relative h-14 rounded-md overflow-hidden border-2 transition-all ${newCoverImg === img.url ? "border-stone-700 ring-1 ring-stone-700" : "border-transparent hover:border-stone-400"}`}>
                              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                              {newCoverImg === img.url && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Check className="w-4 h-4 text-white drop-shadow" /></div>}
                              <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[9px] text-center py-0.5 font-medium">{img.label}</div>
                            </button>
                          ))}
                        </div>
                        <div className="mt-1.5">
                          {newCoverImg && !DEFAULT_COVER_IMAGES.find(i => i.url === newCoverImg) ? (
                            <div className="relative">
                              <img src={newCoverImg} alt="Cover" className="w-full h-20 object-cover rounded-lg border border-stone-200" />
                              <button type="button" onClick={() => setNewCoverImg(undefined)} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"><X className="w-3.5 h-3.5" /></button>
                              <div className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Custom image ✓</div>
                            </div>
                          ) : (
                            <button type="button" onClick={() => imgInputRef.current?.click()} className="w-full h-10 border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center gap-2 hover:border-stone-400 hover:bg-stone-50 transition-all">
                              <ImagePlus className="w-4 h-4 text-stone-400" /><span className="text-xs text-stone-400">Upload your own image</span>
                            </button>
                          )}
                          <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </div>
                      </div>
                      <button type="submit" disabled={!newTitle.trim()} className="w-full mt-1 bg-stone-800 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Create Notebook</button>
                    </form>
                  </div>
                )}
              </div>

              {/* Ghost cells — fill remaining row after New button */}
              {Array.from({ length: ghostCount }).map((_, i) => (
                <div key={`ghost-${i}`} className="aspect-[3/4] rounded-md border-2 border-dashed border-stone-200 bg-transparent" />
              ))}

              </div>
              );
            })()}
          </div>
        )}

        {/* Short Note view */}
        {activeView === "short-note" && (
          <div className="flex-1 overflow-y-auto px-10 py-6 md:py-8 w-full flex flex-col gap-6">

            {/* Header */}
            <div className="rounded-2xl border border-stone-200 bg-white shadow-sm px-5 py-1">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex flex-col gap-1 min-w-0">
                  <h1 className="text-2xl font-serif font-bold text-stone-800 leading-tight">Short Notes</h1>
                  <p className="text-xs text-stone-400">{shortNotes.length} note{shortNotes.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`flex items-center gap-2 border rounded-xl bg-stone-50 px-3 py-2 transition-all duration-300 ${noteSearch ? "w-64 border-stone-400 bg-white shadow-sm" : "w-48 border-stone-200"}`}>
                    <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search notes..."
                      value={noteSearch}
                      onChange={(e) => setNoteSearch(e.target.value)}
                      className="bg-transparent text-sm text-stone-700 placeholder:text-stone-400 outline-none w-full min-w-0"
                    />
                    {noteSearch && <button onClick={() => setNoteSearch("")} className="text-stone-400 hover:text-stone-600"><X className="w-3 h-3" /></button>}
                  </div>
                </div>
              </div>
            </div>

            {/* Two-panel layout */}
            <div className="flex flex-col xl:flex-row gap-5 items-start">

              {/* LEFT: Big note form */}
              <div className="w-full xl:w-[58%] xl:flex-shrink-0">
                <div className="bg-stone-50 rounded-2xl flex flex-col overflow-hidden" style={{ height: "clamp(600px, 82vh, 788px)", boxShadow: "0 8px 40px 0 rgba(0,0,0,0.10), 0 2px 8px 0 rgba(0,0,0,0.06)" }}>

                    {/* Form header */}
                    <div className="relative flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-2">
                        {selectedNoteId !== null && (
                          <button onClick={clearSelectedNote} className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors">
                            <ChevronLeft className="w-3.5 h-3.5" /> New
                          </button>
                        )}
                      </div>
                      <span className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-stone-800">{selectedNoteId !== null ? "Edit Note" : "New Note"}</span>
                      <div className="flex items-center gap-2">

                        {/* Priority button — violet style */}
                        <div className="relative">
                          <button
                            onClick={() => { setShowPriorityPopup((v) => !v); setShowColorPopup(false); }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                              newNotePriority === "low"       ? "bg-green-50  border-green-200  text-green-600"
                              : newNotePriority === "normal" ? "bg-gray-50   border-gray-200   text-gray-600"
                              : newNotePriority === "medium" ? "bg-blue-50   border-blue-200   text-blue-600"
                              : newNotePriority === "important" ? "bg-orange-50 border-orange-200 text-orange-600"
                              : newNotePriority === "urgent" ? "bg-red-50    border-red-200    text-red-600"
                              : "bg-violet-50 border-violet-200 text-violet-500 hover:bg-violet-100"
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {newNotePriority ? newNotePriority.charAt(0).toUpperCase() + newNotePriority.slice(1) : "Priority"}
                          </button>
                          {showPriorityPopup && (
                            <div className="absolute right-0 top-9 z-50 bg-white rounded-2xl shadow-xl p-3 flex flex-col gap-1.5 w-36 border border-stone-100">
                              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide mb-1">Priority</p>
                              {([
                                ["low",       "Low",       "#dcfce7", "#22C55E"],
                                ["normal",    "Normal",    "#f3f4f6", "#6B7280"],
                                ["medium",    "Medium",    "#dbeafe", "#3B82F6"],
                                ["important", "Important", "#ffedd5", "#F97316"],
                                ["urgent",    "Urgent",    "#fee2e2", "#EF4444"],
                              ] as const).map(([val, label, bg, color]) => (
                                <button
                                  key={val}
                                  onClick={() => {
                                    const next = newNotePriority === val ? null : val;
                                    setNewNotePriority(next);
                                    setNewNoteColor(next ? color : "#f5f5f4");
                                    setShowPriorityPopup(false);
                                  }}
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors hover:bg-stone-50 text-left"
                                  style={{ backgroundColor: newNotePriority === val ? bg : undefined }}
                                >
                                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                  <span className="text-xs font-medium text-stone-700">{label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Save button */}
                        <button
                          onClick={selectedNoteId !== null ? handleSaveSelectedNote : handleCreateNote}
                          className="px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-700 transition-colors text-xs font-semibold border border-stone-900"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Title input — gray pill bg */}
                    <div className="px-5 pb-3">
                      <input
                        autoFocus
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        placeholder="Give your note a title..."
                        className="w-full bg-white rounded-xl px-4 py-2.5 text-sm font-medium text-stone-700 outline-none placeholder:text-stone-300 border border-stone-100 focus:border-violet-200 transition-colors"
                      />
                    </div>

                    {/* Body area — white card with border, images float inside */}
                    <div
                      ref={noteBodyRef}
                      className="flex-1 mx-5 mb-0 border border-stone-100 rounded-xl overflow-hidden flex flex-col relative min-h-0"
                    >
                      <textarea
                        ref={noteTextareaRef}
                        value={newNoteBody}
                        onChange={(e) => setNewNoteBody(e.target.value)}
                        placeholder="Write your note here..."
                        className="flex-1 w-full px-4 py-3 text-sm text-stone-600 outline-none bg-white resize-none placeholder:text-stone-300 leading-relaxed"
                        onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) { selectedNoteId !== null ? handleSaveSelectedNote() : handleCreateNote(); } }}
                      />
                      {/* Floating images inside body */}
                      {newNoteImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="absolute group/fi"
                          style={{ left: img.x, top: img.y, width: img.w, zIndex: draggingImg?.idx === idx ? 50 : 10, cursor: draggingImg?.idx === idx ? "grabbing" : "grab" }}
                          onMouseDown={(e) => startDragImg(e, idx)}
                        >
                          <img src={img.src} alt="" className="w-full rounded-xl border-2 border-white shadow-lg object-cover select-none" style={{ pointerEvents: "none" }} />
                          {/* Delete button */}
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={() => setNewNoteImages(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/fi:opacity-100 transition-opacity shadow-md"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                          {/* Resize handle */}
                          <div
                            className="absolute bottom-0 right-0 w-4 h-4 bg-white/80 rounded-tl-md border border-stone-300 cursor-se-resize opacity-0 group-hover/fi:opacity-100 transition-opacity flex items-center justify-center"
                            onMouseDown={(e) => {
                              e.preventDefault(); e.stopPropagation();
                              const startX = e.clientX; const startW = img.w;
                              const onMove = (me: MouseEvent) => { setNewNoteImages(prev => prev.map((im, i) => i === idx ? { ...im, w: Math.max(60, startW + me.clientX - startX) } : im)); };
                              const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
                              document.addEventListener("mousemove", onMove); document.addEventListener("mouseup", onUp);
                            }}
                          >
                            <svg className="w-2 h-2 text-stone-500" viewBox="0 0 8 8" fill="currentColor"><path d="M6 0L8 0L8 8L0 8L0 6L6 6Z"/></svg>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Voices preview */}
                    {newNoteVoices.length > 0 && (
                      <div className="mx-5 mt-3 flex flex-col gap-2">
                        {newNoteVoices.map((v, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">
                            <button
                              onClick={() => togglePlayVoice(idx, v.data)}
                              className="w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-600 text-white flex items-center justify-center flex-shrink-0 transition-colors"
                            >
                              {playingVoice === idx ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-teal-800 truncate">{v.name}</p>
                              <div className="mt-1 h-1 bg-teal-200 rounded-full overflow-hidden">
                                <div className={`h-full bg-teal-500 rounded-full transition-all duration-300 ${playingVoice === idx ? "w-1/2" : "w-0"}`} />
                              </div>
                            </div>
                            <button
                              onClick={() => { const a = audioElemsRef.current.get(idx); if (a) { a.pause(); audioElemsRef.current.delete(idx); if (playingVoice === idx) setPlayingVoice(null); } setNewNoteVoices(prev => prev.filter((_, i) => i !== idx)); }}
                              className="text-teal-400 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bottom toolbar */}
                    <div className="relative flex items-center justify-between px-5 py-3">
                      {/* Emoji picker popup */}
                      {showEmojiPicker && (
                        <div ref={emojiPickerRef} className="absolute bottom-full left-5 mb-2 z-50 bg-white rounded-2xl shadow-2xl border border-stone-100 w-80 overflow-hidden">
                          {/* Category tabs */}
                          <div className="flex gap-0.5 px-2 pt-2 pb-1 border-b border-stone-100 overflow-x-auto">
                            {EMOJI_CATEGORIES.map((cat, i) => (
                              <button
                                key={i}
                                onClick={() => setEmojiCategory(i)}
                                title={cat.name}
                                className={`flex-shrink-0 w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors ${emojiCategory === i ? "bg-stone-100" : "hover:bg-stone-50"}`}
                              >
                                {cat.icon}
                              </button>
                            ))}
                          </div>
                          {/* Emoji grid */}
                          <div className="p-2 h-48 overflow-y-auto">
                            <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-1 mb-1">{EMOJI_CATEGORIES[emojiCategory].name}</p>
                            <div className="grid grid-cols-8 gap-0.5">
                              {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji, i) => (
                                <button
                                  key={i}
                                  onClick={() => insertEmoji(emoji)}
                                  className="w-8 h-8 rounded-lg text-xl flex items-center justify-center hover:bg-stone-100 transition-colors"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setShowEmojiPicker(v => !v)}
                          className={`transition-colors ${showEmojiPicker ? "text-violet-500" : "text-stone-400 hover:text-stone-600"}`}
                          title="Emoji"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => noteImgInputRef.current?.click()}
                          className="text-stone-400 hover:text-stone-600 transition-colors"
                          title="Add image"
                        >
                          <ImageIcon className="w-4 h-4" />
                        </button>
                        <button className="text-stone-400 hover:text-stone-600 transition-colors"><Type className="w-4 h-4" /></button>
                        <button className="text-stone-400 hover:text-stone-600 transition-colors"><List className="w-4 h-4" /></button>
                        <div className="w-px h-4 bg-stone-200" />
                        {/* Voice — upload or record */}
                        <button
                          onClick={() => noteAudioInputRef.current?.click()}
                          className="text-stone-400 hover:text-teal-500 transition-colors"
                          title="Upload audio"
                        >
                          <ImageIcon className="w-4 h-4 hidden" />
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                        </button>
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`transition-colors ${isRecording ? "text-red-500 animate-pulse" : "text-stone-400 hover:text-teal-500"}`}
                          title={isRecording ? "Stop recording" : "Record voice"}
                        >
                          {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      </div>
                      <span className="text-xs text-stone-300">{newNoteBody.length} / 2000</span>

                      {/* Hidden inputs */}
                      <input ref={noteImgInputRef} type="file" accept="image/*" className="hidden" onChange={handleNoteImageUpload} />
                      <input ref={noteAudioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleNoteAudioUpload} />
                    </div>

                </div>
              </div>

              {/* RIGHT: Mini note cards — wrapped in main card */}
              <div className="flex-1 w-full min-w-0 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col" style={{ height: "clamp(600px, 82vh, 788px)" }}>
                {/* Header */}
                <div className="flex-shrink-0 px-4 py-2.5 border-b border-stone-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Notes</span>
                  <span className="text-[10px] text-stone-300">{filteredNotes.length} total</span>
                </div>
                {/* Scrollable list */}
                <div className="flex-1 overflow-y-auto px-3 py-3">
                <div className="flex flex-col gap-3">
                {filteredNotes.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-stone-300 gap-3">
                    <StickyNote className="w-10 h-10 opacity-40" />
                    <p className="text-sm text-center">{noteSearch ? `No notes for "${noteSearch}"` : "Notes will appear here"}</p>
                  </div>
                )}
                {filteredNotes.map((note) => {
                  const pColor = note.priority === "low" ? "#22C55E" : note.priority === "normal" ? "#6B7280" : note.priority === "medium" ? "#3B82F6" : note.priority === "important" ? "#F97316" : note.priority === "urgent" ? "#EF4444" : "";
                  const pBg    = note.priority === "low" ? "#dcfce7" : note.priority === "normal" ? "#f3f4f6" : note.priority === "medium" ? "#dbeafe" : note.priority === "important" ? "#ffedd5" : note.priority === "urgent" ? "#fee2e2" : "";
                  const pLabel = note.priority ? note.priority.charAt(0).toUpperCase() + note.priority.slice(1) : null;
                  const accentBar = pColor || note.color;

                  return (
                    <div key={note.id} onClick={() => handleSelectNote(note)} className={`group relative bg-white rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border overflow-hidden flex cursor-pointer ${selectedNoteId === note.id ? "border-stone-400 ring-2 ring-stone-200" : "border-stone-100"}`}>
                      {/* Left accent bar */}
                      <div className="w-[4px] flex-shrink-0 rounded-l-xl" style={{ backgroundColor: accentBar }} />

                      <div className="flex-1 px-4 py-3 flex flex-col gap-1.5 min-w-0">
                        {/* Title + priority badge */}
                        <div className="flex items-center justify-between gap-2">
                          {editingNoteId === note.id ? (
                            <input
                              autoFocus
                              value={editNoteTitle}
                              onChange={(e) => setEditNoteTitle(e.target.value)}
                              className="text-sm font-semibold text-stone-800 bg-stone-50 rounded px-2 py-0.5 outline-none flex-1 min-w-0"
                              onKeyDown={(e) => { if (e.key === "Enter") saveEditNote(); if (e.key === "Escape") setEditingNoteId(null); }}
                            />
                          ) : (
                            <h3 className="text-sm font-semibold text-stone-800 leading-snug flex-1 min-w-0 truncate">{note.title}</h3>
                          )}
                          {pLabel && (
                            <span
                              className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: pBg, color: pColor }}
                            >
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: pColor }} />
                              {pLabel}
                            </span>
                          )}
                        </div>

                        {/* Body preview */}
                        {editingNoteId === note.id ? (
                          <textarea
                            value={editNoteBody}
                            onChange={(e) => setEditNoteBody(e.target.value)}
                            rows={2}
                            className="text-xs text-stone-600 bg-stone-50 rounded px-2 py-1 outline-none w-full resize-none"
                            onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) saveEditNote(); if (e.key === "Escape") setEditingNoteId(null); }}
                          />
                        ) : (
                          note.body && <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 whitespace-pre-wrap">{note.body}</p>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-[10px] text-stone-400">
                            {new Date(note.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                          {editingNoteId === note.id ? (
                            <div className="flex gap-1.5">
                              <button onClick={saveEditNote} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-stone-800 text-white hover:bg-stone-700 transition-colors">Save</button>
                              <button onClick={() => setEditingNoteId(null)} className="text-[10px] text-stone-400 hover:text-stone-600">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEditNote(note)}
                                className="w-6 h-6 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
                              >
                                <Pencil className="w-3 h-3 text-stone-500" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteNoteId(note.id)}
                                className="w-6 h-6 rounded-full bg-stone-100 hover:bg-red-100 flex items-center justify-center transition-colors"
                              >
                                <Trash2 className="w-3 h-3 text-stone-500" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete confirmation overlay */}
                      {confirmDeleteNoteId === note.id && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10 rounded-xl">
                          <p className="text-sm font-semibold text-stone-700">Delete this note?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { handleDeleteNote(note.id); setConfirmDeleteNoteId(null); }}
                              className="px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
                            >Yes</button>
                            <button
                              onClick={() => setConfirmDeleteNoteId(null)}
                              className="px-4 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors"
                            >No</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Task view */}
        {activeView === "task" && (() => {
          const today = new Date();
          const days = get15Days(today);

          const filteredTasks = (() => {
            const tasks = selectedTypeId === "all"
              ? dayTasks
              : dayTasks.filter(t => t.typeId === selectedTypeId);
            const toMinutes = (t: DayTask) => {
              if (!t.hasTime) return Infinity;
              const h = parseInt(t.hour || "12") % 12;
              const m = parseInt(t.minute || "00");
              const offset = t.ampm === "PM" ? 12 * 60 : 0;
              return h * 60 + m + offset;
            };
            return [...tasks].sort((a, b) => toMinutes(a) - toMinutes(b));
          })();

          const saveDay = (updated: DayTask[]) => {
            saveDayTasksStore(selectedDate, updated);
            setDayTasks(updated);
          };

          const addTask = () => {
            let typeId: number | null = selectedTypeId === "all" ? null : selectedTypeId;

            if (typeId === null) {
              let unknown = dayTaskTypes.find(t => t.name === "Unknown");
              if (!unknown) {
                unknown = { id: nextTypeId(dayTaskTypes), name: "Unknown" };
                const updatedTypes = [...dayTaskTypes, unknown];
                saveDayTaskTypes(updatedTypes);
                setDayTaskTypes(updatedTypes);
              }
              typeId = unknown.id;
              setSelectedTypeId(unknown.id);
            }

            const id = nextDayTaskId(dayTasks);
            const task: DayTask = {
              id,
              title: "",
              hour: "12", minute: "00", ampm: "AM", hasTime: false,
              priority: null,
              typeId,
              done: false,
              note: "",
              progress: 0,
            };
            saveDay([...dayTasks, task]);
            setNewTaskFocusId(id);
          };

          const selectedTypeName = selectedTypeId === "all"
            ? "All Tasks"
            : (dayTaskTypes.find(t => t.id === selectedTypeId)?.name ?? "All Tasks");
          const totalTasks = filteredTasks.length;
          const completeTasks = filteredTasks.filter(t => t.done).length;
          const pendingTasks = totalTasks - completeTasks;

          const toggleDone = (id: number) => saveDay(dayTasks.map(t => t.id === id ? { ...t, done: !t.done } : t));
          const updateTask = (id: number, patch: Partial<DayTask>) => saveDay(dayTasks.map(t => t.id === id ? { ...t, ...patch } : t));
          const deleteTask = (id: number) => saveDay(dayTasks.filter(t => t.id !== id));

          const addType = () => {
            if (!newTypeName.trim()) return;
            if (dayTaskTypes.length >= 7) { setShowTypeInput(false); setNewTypeName(""); return; }
            const type: DayTaskType = { id: nextTypeId(dayTaskTypes), name: newTypeName.trim() };
            const updated = [...dayTaskTypes, type];
            saveDayTaskTypes(updated);
            setDayTaskTypes(updated);
            setNewTypeName(""); setShowTypeInput(false);
          };

          const deleteType = (id: number) => {
            const updatedTypes = dayTaskTypes.filter(t => t.id !== id);
            saveDayTaskTypes(updatedTypes);
            setDayTaskTypes(updatedTypes);
            const updatedTasks = dayTasks.filter(t => t.typeId !== id);
            saveDayTasksStore(selectedDate, updatedTasks);
            setDayTasks(updatedTasks);
            if (selectedTypeId === id) setSelectedTypeId("all");
          };


          return (
            <div className="flex flex-col flex-1 min-h-0 p-6 gap-4 bg-stone-50 overflow-hidden">

              {/* TASK header card */}
              <div className="bg-white rounded-2xl border border-stone-200 px-7 py-4 flex-shrink-0">
                <h1 className="text-lg font-bold text-stone-700 tracking-[0.25em]">TASK</h1>
              </div>

              {/* Main two-column row */}
              <div className="flex gap-4 flex-1 min-h-0 overflow-hidden p-1">

                {/* ── LEFT — task pad ── */}
                <div className="flex-[6] rounded-2xl flex flex-col overflow-hidden" style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.12)" }}>

                  {/* Card header */}
                  <div className="flex-shrink-0 flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid #d5d6de" }}>
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-semibold text-stone-700">{selectedTypeName}</span>
                      <div className="flex items-center gap-1.5">
                        {[
                          { label: "TT", value: totalTasks, color: "text-stone-600" },
                          { label: "CT", value: completeTasks, color: "text-green-600" },
                          { label: "PT", value: pendingTasks, color: "text-orange-500" },
                        ].map(({ label, value, color }) => (
                          <div key={label} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-stone-200 shadow-sm">
                            <span className="text-[9px] font-bold text-stone-400">{label}</span>
                            <span className="text-[9px] font-bold text-stone-300">:</span>
                            <span className={`text-[10px] font-bold tabular-nums ${color}`}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {(() => {
                      const ADD_COLORS = ["#1c1917","#6366f1","#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899"];
                      const bg = ADD_COLORS[addBtnColorIdx % ADD_COLORS.length];
                      return (
                        <button
                          onClick={() => { addTask(); setNotePopupId(null); setProgressMenuId(null); setPriorityMenuId(null); setTimePickerId(null); setAddBtnColorIdx(i => i + 1); }}
                          className="w-12 h-6 rounded-md text-white flex items-center justify-center text-base font-light transition-all leading-none hover:scale-110 active:scale-95"
                          style={{ backgroundColor: bg, boxShadow: `0 2px 8px ${bg}66` }}
                        >+</button>
                      );
                    })()}
                  </div>

                  {/* Task list */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 overflow-x-auto">
                    {filteredTasks.length === 0 && (
                      <div className="flex items-center justify-center h-20">
                        <p className="text-sm text-stone-300">No tasks — press + to add</p>
                      </div>
                    )}

                    {(() => {
                      const CARD_H = 48;
                      const closeAllPopups = () => { setNotePopupId(null); setTimePickerId(null); setPriorityMenuId(null); setProgressMenuId(null); setDeleteConfirmId(null); };
                      return (
                        <div className="flex flex-col gap-2" onClick={closeAllPopups}>
                          {filteredTasks.map((task, idx) => {
                            const pm = task.priority ? DAY_PRIORITY_META[task.priority] : null;
                            const isActive = editingTaskId === task.id || notePopupId === task.id || timePickerId === task.id || priorityMenuId === task.id || progressMenuId === task.id;
                            const accentColor = pm ? pm.bar : "#6366f1";
                            return (
                              <div key={task.id} className="relative w-full group/card" style={{ opacity: task.done ? 0.3 : 1, transition: "opacity 0.2s" }}>
                                {/* FlatC card */}
                                <div className="flex items-center rounded-lg w-full shadow-sm transition-all duration-200 ease-out group-hover/card:-translate-y-[3px] group-hover/card:shadow-md"
                                  style={{
                                    height: CARD_H,
                                    backgroundColor: pm ? pm.rowBg : "#ffffff",
                                    border: isActive
                                      ? `2px solid ${accentColor}`
                                      : "1px solid #e7e5e4",
                                    boxShadow: isActive
                                      ? `0 0 0 3px ${accentColor}33`
                                      : undefined,
                                  }}>

                                  {/* Left accent bar */}
                                  <div className="self-stretch flex-shrink-0 rounded-l-lg" style={{ width: 4, backgroundColor: pm ? pm.bar : "#e7e5e4" }} />

                                  {/* Num */}
                                  <div className="w-9 flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch text-[11px] font-bold text-stone-400">
                                    {idx + 1}
                                  </div>

                                  {/* Checkbox */}
                                  <div className="w-11 flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch">
                                    <button
                                      onClick={e => { e.stopPropagation(); toggleDone(task.id); }}
                                      className="w-[18px] h-[18px] rounded flex-shrink-0 flex items-center justify-center border transition-all"
                                      style={task.done
                                        ? { backgroundColor: "#78716c", borderColor: "#78716c" }
                                        : { backgroundColor: "#ffffff", borderColor: "#d6d3d1" }}>
                                      {task.done && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2L7.5 2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </button>
                                  </div>

                                  {/* Title — takes all remaining space */}
                                  <div className="flex-1 min-w-0 flex items-center border-r border-stone-200 self-stretch px-3"
                                    onClick={e => e.stopPropagation()}>
                                    <input
                                      autoFocus={task.id === newTaskFocusId}
                                      value={task.title}
                                      onChange={e => updateTask(task.id, { title: e.target.value })}
                                      onFocus={() => { setNewTaskFocusId(null); setEditingTaskId(task.id); }}
                                      onBlur={() => setEditingTaskId(null)}
                                      placeholder="Task name..."
                                      className={`text-sm w-full bg-transparent outline-none border-none placeholder-stone-300 truncate ${task.done ? "line-through text-stone-400" : "text-stone-700"}`}
                                    />
                                  </div>

                                  {/* Note */}
                                  <div className="w-12 flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch cursor-pointer select-none"
                                    onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setPopupPos({ top: r.bottom + 6, right: window.innerWidth - r.right }); setNotePopupId(notePopupId === task.id ? null : task.id); setTimePickerId(null); setPriorityMenuId(null); setProgressMenuId(null); setDeleteConfirmId(null); }}>
                                    <span className={`text-[11px] font-medium ${task.note ? "text-indigo-500" : "text-stone-400"}`}>
                                      Note{task.note && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block align-middle" />}
                                    </span>
                                  </div>
                                  {notePopupId === task.id && popupPos && ReactDOM.createPortal(
                                    <div className="bg-white border border-stone-200 rounded-xl shadow-xl p-3 flex flex-col gap-2"
                                      style={{ position: "fixed", top: popupPos.top, right: popupPos.right, width: 320, zIndex: 9999 }}
                                      onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Note</p>
                                      <textarea autoFocus value={task.note} onChange={e => updateTask(task.id, { note: e.target.value })} placeholder="Write a note..." rows={3}
                                        className="w-full text-xs text-stone-700 border border-stone-200 rounded-lg p-2 outline-none resize-none focus:border-indigo-300 placeholder-stone-300" />
                                      <button onClick={() => setNotePopupId(null)} className="text-[11px] font-bold text-white bg-stone-800 rounded-lg px-3 py-1.5 hover:bg-stone-700 w-full">Done</button>
                                    </div>,
                                    document.body
                                  )}

                                  {/* Time */}
                                  <div className="w-[70px] flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch cursor-pointer select-none"
                                    onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setPopupPos({ top: r.bottom + 6, right: window.innerWidth - r.right }); if (timePickerId !== task.id) { setTempHour(task.hour || "12"); setTempMinute(task.minute || "00"); setTempAmpm(task.ampm || "AM"); setTimePickerId(task.id); setPriorityMenuId(null); setNotePopupId(null); setProgressMenuId(null); setDeleteConfirmId(null); } else { setTimePickerId(null); } }}>
                                    <span className={`text-[11px] tabular-nums ${!task.hasTime ? "text-stone-300" : "text-stone-600"}`}>
                                      {task.hasTime ? `${task.hour}:${task.minute} ${task.ampm}` : "--:-- --"}
                                    </span>
                                  </div>
                                  {timePickerId === task.id && popupPos && ReactDOM.createPortal(
                                    <div className="bg-white border border-stone-200 rounded-xl shadow-xl p-3 flex flex-col gap-2.5"
                                      style={{ position: "fixed", top: popupPos.top, right: popupPos.right, width: 220, zIndex: 9999 }}
                                      onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Time</p>
                                      <div className="flex items-center gap-2">
                                        <select value={tempHour} onChange={e => setTempHour(e.target.value)} className="flex-1 text-sm border border-stone-200 rounded-lg px-2 py-1.5 outline-none bg-white text-stone-700">
                                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                        <span className="text-stone-400 font-bold">:</span>
                                        <select value={tempMinute} onChange={e => setTempMinute(e.target.value)} className="flex-1 text-sm border border-stone-200 rounded-lg px-2 py-1.5 outline-none bg-white text-stone-700">
                                          {["00","05","10","15","20","25","30","35","40","45","50","55"].map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                        <select value={tempAmpm} onChange={e => setTempAmpm(e.target.value as "AM" | "PM")} className="text-sm border border-stone-200 rounded-lg px-2 py-1.5 outline-none bg-white text-stone-700">
                                          <option value="AM">AM</option>
                                          <option value="PM">PM</option>
                                        </select>
                                      </div>
                                      <div className="flex gap-1.5">
                                        <button onClick={() => { updateTask(task.id, { hour: tempHour, minute: tempMinute, ampm: tempAmpm, hasTime: true }); setTimePickerId(null); }} className="flex-1 text-[11px] font-bold text-white bg-stone-800 rounded-lg py-1.5 hover:bg-stone-700">Set</button>
                                        {task.hasTime && <button onClick={() => { updateTask(task.id, { hasTime: false }); setTimePickerId(null); }} className="text-[11px] text-stone-400 border border-stone-200 rounded-lg px-3 py-1.5 hover:text-stone-600">Clear</button>}
                                      </div>
                                    </div>,
                                    document.body
                                  )}

                                  {/* Priority */}
                                  <div className="w-[70px] flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch cursor-pointer select-none"
                                    onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setPopupPos({ top: r.bottom + 6, right: window.innerWidth - r.right }); setPriorityMenuId(priorityMenuId === task.id ? null : task.id); setTimePickerId(null); setNotePopupId(null); setProgressMenuId(null); setDeleteConfirmId(null); }}>
                                    <span className="text-[11px] font-semibold" style={pm ? { color: pm.color } : { color: "#c8c4bf" }}>
                                      {pm ? pm.label : "N/A"}
                                    </span>
                                  </div>
                                  {priorityMenuId === task.id && popupPos && ReactDOM.createPortal(
                                    <div className="bg-white border border-stone-200 rounded-xl shadow-xl py-2"
                                      style={{ position: "fixed", top: popupPos.top, right: popupPos.right, width: 160, zIndex: 9999 }}
                                      onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest px-3 pb-1.5">Priority</p>
                                      {(["low", "normal", "medium", "important", "urgent"] as NonNullable<DayPriority>[]).map(p => (
                                        <button key={p} onClick={() => { updateTask(task.id, { priority: p }); setPriorityMenuId(null); }}
                                          className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-stone-50 text-left ${task.priority === p ? "bg-stone-50" : ""}`}>
                                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: DAY_PRIORITY_META[p].dot }} />
                                          <span className="text-[12px] font-medium text-stone-700">{DAY_PRIORITY_META[p].label}</span>
                                        </button>
                                      ))}
                                      {task.priority && (
                                        <button onClick={() => { updateTask(task.id, { priority: null }); setPriorityMenuId(null); }}
                                          className="w-full text-left text-[11px] text-stone-400 px-3 py-1.5 hover:bg-stone-50 border-t border-stone-100 mt-1">
                                          Clear
                                        </button>
                                      )}
                                    </div>,
                                    document.body
                                  )}

                                  {/* Progress */}
                                  <div className="w-[90px] flex items-center justify-center flex-shrink-0 border-r border-stone-200 self-stretch cursor-pointer select-none px-3"
                                    onClick={e => { e.stopPropagation(); const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setPopupPos({ top: r.bottom + 6, right: window.innerWidth - r.right }); setProgressMenuId(progressMenuId === task.id ? null : task.id); setTimePickerId(null); setNotePopupId(null); setPriorityMenuId(null); setDeleteConfirmId(null); }}>
                                    {task.progress > 0 ? (
                                      <div className="flex items-center gap-1.5 w-full">
                                        <div className="flex-1 h-[3px] bg-stone-200 rounded-full overflow-hidden">
                                          <div className="h-full rounded-full" style={{ width: `${task.progress}%`, backgroundColor: task.progress >= 50 ? "#22c55e" : "#ef4444" }} />
                                        </div>
                                        <span className="text-[10px] text-stone-500 tabular-nums flex-shrink-0">{task.progress}%</span>
                                      </div>
                                    ) : (
                                      <span className="text-[11px] text-stone-300">Progress %</span>
                                    )}
                                  </div>
                                  {progressMenuId === task.id && popupPos && ReactDOM.createPortal(
                                    <div className="bg-white border border-stone-200 rounded-xl shadow-xl py-2"
                                      style={{ position: "fixed", top: popupPos.top, right: popupPos.right, width: 110, zIndex: 9999 }}
                                      onMouseDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                                      {[0, 10, 25, 50, 75, 90, 100].map(p => (
                                        <button key={p} onClick={() => { updateTask(task.id, { progress: p }); setProgressMenuId(null); }}
                                          className={`w-full text-left px-4 py-1.5 hover:bg-stone-50 text-[12px] ${task.progress === p ? "font-bold text-stone-800" : "text-stone-600"}`}>
                                          {p}%
                                        </button>
                                      ))}
                                    </div>,
                                    document.body
                                  )}

                                  {/* Trash */}
                                  <div className="w-11 flex items-center justify-center flex-shrink-0 self-stretch cursor-pointer"
                                    onClick={e => { e.stopPropagation(); if (e.ctrlKey) { deleteTask(task.id); setDeleteConfirmId(null); } else { setNotePopupId(null); setTimePickerId(null); setPriorityMenuId(null); setProgressMenuId(null); setDeleteConfirmId(task.id); } }}>
                                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                      <path d="M1.5 3.5h10M4.5 1.5h4M3 3.5l.65 7.5h5.7L10 3.5" stroke="#f87171" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                </div>

                                {/* ── Delete confirmation overlay ── */}
                                {deleteConfirmId === task.id && (
                                  <div className="absolute inset-0 z-50 flex items-center justify-center gap-3 rounded-md border border-red-200"
                                    style={{ backgroundColor: "rgba(255,241,241,0.97)" }}
                                    onClick={e => e.stopPropagation()}>
                                    <span className="text-[9px] text-red-300 font-medium mr-1">Quick: Ctrl + Click</span>
                                    <span className="text-[12px] font-semibold text-red-600">Delete this task?</span>
                                    <button onClick={() => { deleteTask(task.id); setDeleteConfirmId(null); }}
                                      className="text-[11px] font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg px-3 py-1 transition-colors">Yes</button>
                                    <button onClick={() => setDeleteConfirmId(null)}
                                      className="text-[11px] font-medium text-stone-500 border border-stone-200 hover:border-stone-400 bg-white rounded-lg px-3 py-1 transition-colors">No</button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>

                </div>

                {/* ── RIGHT panel ── */}
                <div className="flex-[4] flex-shrink-0 flex flex-col gap-4 overflow-hidden">

                  {/* Clock card — two parts */}
                  <div className="bg-white rounded-2xl border border-stone-200 flex-shrink-0 flex" style={{ height: "280px" }}>
                    {/* Part 1 — square clock */}
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: "280px", height: "280px" }}>
                      <div className="w-[220px] h-[220px]" style={{ overflow: "visible" }}>
                        <OrbitalClock24 frozen={selectedDate !== days[0].key} />
                      </div>
                    </div>
                    {/* Part 2 — Task countdown */}
                    <div className="flex-1 border-l border-stone-100 flex flex-col overflow-hidden">
                      <p className="text-[9px] font-bold text-stone-400 tracking-widest uppercase px-3 pt-3 pb-2 flex-shrink-0">Time Left</p>
                      <div className="flex-1 overflow-y-auto px-2 pb-3 flex flex-col gap-1.5">
                        {filteredTasks.filter(t => t.hasTime).length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-[10px] text-stone-300 text-center leading-relaxed">No timed<br/>tasks</p>
                          </div>
                        ) : (
                          filteredTasks.filter(t => t.hasTime).map((task, idx) => {
                            const h12 = parseInt(task.hour || "12");
                            const taskMin = parseInt(task.minute || "00");
                            const h24 = task.ampm === "PM" ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
                            // Use clockNow as single source of truth to avoid today vs clockNow drift
                            const dayOffset = Math.max(0, days.findIndex(day => day.key === selectedDate));
                            const taskDate = new Date(clockNow.getFullYear(), clockNow.getMonth(), clockNow.getDate() + dayOffset, h24, taskMin, 0, 0);
                            const diffMs = taskDate.getTime() - clockNow.getTime();
                            const diffMin = Math.floor(diffMs / 60000);
                            const isOverdue = diffMin < 0;
                            const absMin = Math.abs(diffMin);
                            const hrs = Math.floor(absMin / 60);
                            const mins = absMin % 60;
                            const timeLabel = isOverdue ? "Time Up" : (hrs > 0 ? `${hrs} H . ${mins} M` : `${mins} M`);
                            return (
                              <div key={task.id} className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 border" style={{ backgroundColor: isOverdue ? "#fff5f5" : "#f8faf8", borderColor: isOverdue ? "#fecaca" : "#d1fae5" }}>
                                <span className="text-[11px] font-bold text-stone-400 flex-shrink-0">T{idx + 1}</span>
                                <span className="text-[11px] text-stone-400 flex-shrink-0">:</span>
                                <span className={`text-[11px] font-bold tabular-nums ${isOverdue ? "text-red-400" : "text-emerald-600"}`}>{timeLabel}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TASK TYPE section */}
                  <div className="bg-white rounded-2xl border border-stone-200 flex-[3] flex flex-col">
                    <div className="px-5 pt-5 pb-3 flex-shrink-0 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-stone-700 tracking-[0.15em]">TASK TYPE</h3>
                      <button
                        onClick={() => setSelectedTypeId("all")}
                        className={`flex-shrink-0 flex flex-row items-center justify-center gap-1 rounded-md border px-2.5 py-1 transition-all shadow-sm ${selectedTypeId === "all" ? "bg-stone-800 text-white border-transparent" : "border-stone-300 text-stone-500 bg-white hover:-translate-y-[2px] hover:shadow-md"}`}
                      >
                        <span className="text-[10px] font-bold leading-none">All</span>
                        <span className="text-[10px] font-bold leading-none">-</span>
                        <span className="text-[10px] font-bold tabular-nums leading-none">{String(dayTasks.length).padStart(2, "0")}</span>
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-4 pb-3 pt-1">
                      <div className="grid grid-cols-2 gap-2">

                        {dayTaskTypes.map(type => {
                          const typeCount = dayTasks.filter(t => t.typeId === type.id).length;
                          const isSelected = selectedTypeId === type.id;
                          return (
                            <div key={type.id} className="group/type relative">
                              <button
                                onClick={() => { setDeleteTypeConfirmId(null); setSelectedTypeId(isSelected ? "all" : type.id); }}
                                className={`w-full text-center text-xs px-2 py-3 rounded-lg border transition-all shadow-sm hover:-translate-y-[2px] hover:shadow-md relative ${isSelected ? "bg-stone-800 text-white border-transparent" : "border-stone-300 text-stone-700 bg-white"}`}
                              >
                                {typeCount > 0 && (
                                  <span className={`absolute left-1.5 top-1/2 -translate-y-1/2 text-[12px] font-bold tabular-nums leading-none ${isSelected ? "text-white/50" : "text-stone-400"}`}>
                                    {typeCount}
                                  </span>
                                )}
                                <span className="truncate block">{type.name}</span>
                              </button>
                              {deleteTypeConfirmId === type.id ? (
                                <div className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 rounded-lg"
                                  style={{ backgroundColor: isSelected ? "rgba(28,25,23,0.92)" : "rgba(255,241,241,0.97)", border: "1px solid #fca5a5" }}>
                                  <span className={`text-[10px] font-semibold ${isSelected ? "text-white/80" : "text-red-600"}`}>Delete?</span>
                                  <button onClick={e => { e.stopPropagation(); deleteType(type.id); setDeleteTypeConfirmId(null); }}
                                    className="text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 rounded px-1.5 py-0.5">Yes</button>
                                  <button onClick={e => { e.stopPropagation(); setDeleteTypeConfirmId(null); }}
                                    className="text-[10px] font-medium text-stone-500 bg-white border border-stone-200 hover:border-stone-400 rounded px-1.5 py-0.5">No</button>
                                </div>
                              ) : (
                                <button
                                  onClick={e => { e.stopPropagation(); setDeleteTypeConfirmId(type.id); }}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover/type:opacity-100 transition-opacity"
                                >
                                  <X className={`w-[13px] h-[13px] ${isSelected ? "text-white/60 hover:text-white" : "text-stone-300 hover:text-red-400"}`} />
                                </button>
                              )}
                            </div>
                          );
                        })}


                        {dayTaskTypes.length < 7 && (showTypeInput ? (
                          <div className="col-span-2 flex gap-1.5">
                            <input
                              autoFocus
                              value={newTypeName}
                              onChange={e => setNewTypeName(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") addType(); if (e.key === "Escape") { setShowTypeInput(false); setNewTypeName(""); } }}
                              placeholder="Type name..."
                              className="flex-1 text-xs border border-stone-300 rounded-lg px-2 py-2 outline-none focus:border-stone-600"
                            />
                            <button onClick={addType} className="text-xs font-bold px-2.5 rounded-lg bg-stone-800 text-white hover:bg-stone-700 flex-shrink-0">OK</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowTypeInput(true)}
                            className="w-full flex items-center justify-center py-2 rounded-lg bg-stone-100 hover:bg-stone-200 transition-colors text-stone-400 hover:text-stone-600 text-lg font-light leading-none"
                          >
                            +
                          </button>
                        ))}

                        {dayTaskTypes.length === 7 && (
                          <div className="w-full flex items-center justify-center py-2 rounded-lg border border-dashed border-stone-200 bg-stone-50">
                            <Lock className="w-3.5 h-3.5 text-stone-300" />
                          </div>
                        )}

                      </div>
                    </div>
                  </div>

                  {/* Date strip — ToDay + Next 14 Days staggered */}
                  <div className="bg-white rounded-2xl border border-stone-200 flex-shrink-0 px-4 py-4 -mt-2"
                    style={cloneMode ? { borderColor: "#3b82f6", boxShadow: "0 0 0 2px #3b82f633" } : {}}>

                    {/* Header row: ToDay label + Clone/Done buttons */}
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[9px] font-bold text-stone-400 tracking-widest uppercase">
                        {cloneMode ? (cloneTargetDates.length > 0 ? `${cloneTargetDates.length} date selected` : "Select Dates") : "ToDay"}
                      </p>
                      <div className="flex items-center gap-1.5">
                        {cloneMode && cloneTargetDates.length > 0 && (
                          <button
                            onClick={() => {
                              let mergedTypes = [...loadDayTaskTypes()];
                              const typeIdMap: Record<number, number> = {};
                              for (const t of dayTaskTypes) {
                                const existing = mergedTypes.find(et => et.name === t.name);
                                if (existing) { typeIdMap[t.id] = existing.id; }
                                else { const newId = nextTypeId(mergedTypes); mergedTypes = [...mergedTypes, { id: newId, name: t.name }]; typeIdMap[t.id] = newId; }
                              }
                              saveDayTaskTypes(mergedTypes);
                              setDayTaskTypes(mergedTypes);
                              for (const targetDate of cloneTargetDates) {
                                const existingTargetTasks = loadDayTasks(targetDate);
                                let idCounter = nextDayTaskId(existingTargetTasks);
                                const clonedTasks: DayTask[] = dayTasks.map(task => ({
                                  ...task, id: idCounter++,
                                  typeId: task.typeId != null ? (typeIdMap[task.typeId] ?? task.typeId) : null,
                                  done: false,
                                }));
                                saveDayTasksStore(targetDate, [...existingTargetTasks, ...clonedTasks]);
                              }
                              setCloneMode(false);
                              setCloneTargetDates([]);
                            }}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg text-white transition-all"
                            style={{ backgroundColor: "#22c55e", boxShadow: "0 0 8px #22c55e66" }}
                          >Done</button>
                        )}
                        <button
                          onClick={() => { setCloneMode(m => !m); setCloneTargetDates([]); }}
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all"
                          style={cloneMode
                            ? { backgroundColor: "#3b82f6", color: "#fff", borderColor: "transparent", boxShadow: "0 0 12px #3b82f688", animation: "pulse-blue 1.4s ease-in-out infinite" }
                            : { backgroundColor: "#fff", color: "#6b7280", borderColor: "#d6d3d1" }}
                        >Clone</button>
                      </div>
                    </div>

                    <style>{`@keyframes pulse-blue { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.3)} }`}</style>

                    {/* ToDay button — always normal, no clone interaction */}
                    <button
                      onClick={() => setSelectedDate(days[0].key)}
                      className={`flex flex-col items-center justify-center rounded-lg border transition-all shadow-sm hover:-translate-y-[2px] hover:shadow-md ${selectedDate === days[0].key ? "bg-stone-800 text-white border-transparent" : "border-stone-300 text-stone-600 bg-white"}`}
                      style={{ width: "calc(100% * 2 / 15 * 0.7)", aspectRatio: "1 / 1" }}
                    >
                      <span className="text-[5px] font-bold uppercase leading-none">{days[0].day}</span>
                      <span className="text-[8px] font-bold tabular-nums mt-0.5">{days[0].label}</span>
                    </button>

                    {/* Next 14 Days */}
                    <p className="text-[9px] font-bold text-stone-400 tracking-widest uppercase mt-4 mb-2 text-center">Next 14 Days</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gridTemplateRows: "1fr 1fr", gap: "4px" }}>
                      {days.slice(1).map((d, i) => {
                        const isCloneTarget = cloneMode && cloneTargetDates.includes(d.key);
                        const isSelected = !cloneMode && selectedDate === d.key;
                        return (
                          <button
                            key={d.key}
                            onClick={() => {
                              if (cloneMode) {
                                setCloneTargetDates(prev =>
                                  prev.includes(d.key) ? prev.filter(x => x !== d.key) : [...prev, d.key]
                                );
                              } else {
                                setSelectedDate(d.key);
                              }
                            }}
                            style={{
                              gridColumn: i + 1, gridRow: i % 2 === 0 ? 1 : 2, aspectRatio: "1 / 1",
                              transform: i % 2 === 0 ? "translateY(-4px)" : "none",
                              ...(isCloneTarget ? { boxShadow: "0 0 10px #3b82f688" } : {})
                            }}
                            className={`flex flex-col items-center justify-center rounded-lg border transition-all shadow-sm hover:-translate-y-[2px] hover:shadow-md ${
                              isCloneTarget
                                ? "bg-blue-500 text-white border-transparent"
                                : isSelected
                                  ? "bg-stone-800 text-white border-transparent"
                                  : "border-stone-300 text-stone-600 bg-white"
                            }`}
                          >
                            <span className="text-[6px] font-bold uppercase leading-none">{d.day}</span>
                            <span className="text-[10px] font-bold tabular-nums leading-none mt-0.5">{d.label}</span>
                          </button>
                        );
                      })}
                    </div>

                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {/* Schedule view */}
        {activeView === "schedule" && (() => {
          const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
          const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
          const selD = new Date(scheduleDate + "T00:00:00");
          const todayStr = new Date().toISOString().slice(0, 10);
          const isToday = scheduleDate === todayStr;

          const dayNotes = scheduleData[scheduleDate] ?? {};

          function formatHour(h: number) {
            if (h === 0)  return "12:00 AM";
            if (h < 12)   return `${String(h).padStart(2,"0")}:00 AM`;
            if (h === 12) return "12:00 PM";
            return `${String(h - 12).padStart(2,"0")}:00 PM`;
          }

          const amHours  = Array.from({ length: 12 }, (_, i) => i);
          const pmHours  = Array.from({ length: 12 }, (_, i) => i + 12);

          const calMonths = (() => {
            const base = new Date(selD.getFullYear(), selD.getMonth(), 1);
            return Array.from({ length: 3 }, (_, i) => {
              const d = new Date(base.getFullYear(), base.getMonth() - 1 + i, 1);
              return { year: d.getFullYear(), month: d.getMonth() };
            });
          })();

          const calMarkedDates = (() => {
            const map = new Map<string, string>();
            const priorityOrder = SLOT_COLORS.map(c => c.bg);
            const dotByBg: Record<string, string> = Object.fromEntries(SLOT_COLORS.map(c => [c.bg, c.dot]));
            Object.keys(scheduleData).forEach(date => {
              const slots = scheduleData[date];
              if (!slots || !Object.values(slots).some(v => v && v.trim() !== "")) return;
              const cellColors = Object.values(scheduleCellColors[date] ?? {});
              let borderColor = "#a8a29e";
              for (const bg of priorityOrder) {
                if (cellColors.includes(bg)) { borderColor = dotByBg[bg]; break; }
              }
              map.set(date, borderColor);
            });
            return map;
          })();

          const customTimesForDate = scheduleCustomTimes[scheduleDate] ?? {};

          const getDisplayTime = (h: number) => customTimesForDate[h] ?? formatHour(h);

          const openTimeEditor = (h: number) => {
            const custom = customTimesForDate[h];
            if (custom) {
              setEditingTimeStr(custom);
            } else {
              const hh = String(h).padStart(2, "0");
              setEditingTimeStr(`${hh}:00`);
            }
            setEditingTimeSlot(h);
          };

          const saveTimeEdit = () => {
            if (editingTimeSlot === null) return;
            if (editingTimeStr.trim()) {
              const [hhStr, mmStr] = editingTimeStr.split(":");
              const hh = parseInt(hhStr, 10);
              const mm = parseInt(mmStr ?? "0", 10);
              const ampm = hh < 12 ? "AM" : "PM";
              const displayH = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
              const label = `${String(displayH).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${ampm}`;
              updateScheduleCustomTime(scheduleDate, editingTimeSlot, label);
            }
            setEditingTimeSlot(null);
          };

          const resetTimeLabel = (h: number) => {
            setScheduleCustomTimes(prev => {
              const dateTimes = { ...(prev[scheduleDate] ?? {}) };
              delete dateTimes[h];
              const next = { ...prev, [scheduleDate]: dateTimes };
              saveScheduleCustomTimes(next);
              return next;
            });
            setEditingTimeSlot(null);
          };

          const cellColorsForDate = scheduleCellColors[scheduleDate] ?? {};

          const renderTimeColumn = (hours: number[]) => (
            <div className="flex flex-col h-full">
              {hours.map((h, idx) => {
                const cellBg = cellColorsForDate[h] ?? null;
                return (
                  <div key={h} className={`group/cell relative flex flex-col flex-1 transition-all duration-150 hover:-translate-y-px hover:shadow-md hover:z-10 ${idx < hours.length - 1 ? "border-b border-stone-200" : ""}`}
                    style={cellBg ? { backgroundColor: cellBg + "55" } : {}}>
                    <div className="relative flex items-center px-2 py-0.5 border-b border-stone-100" style={{ backgroundColor: cellBg ? cellBg + "99" : "#e3e3e3" }}>
                      <span
                        onClick={() => openTimeEditor(h)}
                        className="text-[9px] font-semibold tracking-wide cursor-pointer select-none hover:text-blue-500 transition-colors"
                        style={{ color: customTimesForDate[h] ? "#3b82f6" : undefined }}
                      >
                        {getDisplayTime(h)}
                      </span>

                      {editingTimeSlot === h && (
                        <div
                          className="absolute left-0 top-full z-50 bg-white border border-stone-200 rounded-xl shadow-xl p-3 flex flex-col gap-2"
                          style={{ minWidth: 180 }}
                          onMouseDown={e => e.stopPropagation()}
                        >
                          <p className="text-[10px] font-semibold text-stone-500 mb-0.5">Set custom time</p>
                          <input
                            type="time"
                            value={editingTimeStr}
                            onChange={e => setEditingTimeStr(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") saveTimeEdit(); if (e.key === "Escape") setEditingTimeSlot(null); }}
                            autoFocus
                            className="w-full border border-stone-200 rounded-lg px-2 py-1 text-[12px] text-stone-700 outline-none focus:border-blue-400"
                          />
                          <div className="flex gap-1.5">
                            <button onClick={saveTimeEdit} className="flex-1 bg-stone-800 text-white text-[10px] font-semibold rounded-lg py-1 hover:bg-stone-700 transition-colors">Save</button>
                            <button onClick={() => resetTimeLabel(h)} className="flex-1 bg-stone-100 text-stone-500 text-[10px] font-semibold rounded-lg py-1 hover:bg-stone-200 transition-colors">Reset</button>
                            <button onClick={() => setEditingTimeSlot(null)} className="px-2 bg-stone-100 text-stone-400 text-[10px] rounded-lg py-1 hover:bg-stone-200 transition-colors">✕</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex items-stretch">
                      <input
                        type="text"
                        value={dayNotes[h] ?? ""}
                        onChange={e => updateScheduleNote(scheduleDate, h, e.target.value)}
                        placeholder=""
                        className="flex-1 px-2 py-0.5 text-[13px] text-stone-700 outline-none bg-transparent"
                      />
                      {/* 3-dot priority button */}
                      <button
                        onMouseDown={e => e.preventDefault()}
                        onClick={e => { e.stopPropagation(); setColorPickerSlot(colorPickerSlot === h ? null : h); setEditingTimeSlot(null); }}
                        className="flex-shrink-0 w-6 flex items-center justify-center opacity-0 hover:opacity-100 group-hover/cell:opacity-100 focus:opacity-100 transition-opacity text-stone-300 hover:text-stone-500 self-stretch"
                        style={cellBg ? { opacity: 1 } : {}}
                      >
                        <span className="text-[14px] leading-none select-none">⋯</span>
                      </button>

                      {/* Color picker popup */}
                      {colorPickerSlot === h && (
                        <div
                          ref={colorPickerRef}
                          className="absolute right-0 top-full z-50 bg-white border border-stone-200 rounded-xl shadow-xl p-2.5 flex flex-col gap-1.5"
                          style={{ minWidth: 140 }}
                          onMouseDown={e => e.stopPropagation()}
                          onClick={e => e.stopPropagation()}
                        >
                          <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Priority</p>
                          {SLOT_COLORS.map(c => (
                            <button
                              key={c.label}
                              onClick={() => { updateScheduleCellColor(scheduleDate, h, c.bg); setColorPickerSlot(null); }}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-50 transition-colors w-full text-left"
                              style={cellBg === c.bg ? { backgroundColor: c.bg + "55" } : {}}
                            >
                              <span className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow-sm" style={{ backgroundColor: c.dot }} />
                              <span className="text-[11px] font-medium text-stone-600">{c.label}</span>
                            </button>
                          ))}
                          {cellBg && (
                            <button
                              onClick={() => { updateScheduleCellColor(scheduleDate, h, null); setColorPickerSlot(null); }}
                              className="text-[10px] text-stone-400 hover:text-stone-600 px-2 py-1 border-t border-stone-100 mt-0.5 text-left transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );

          return (
            <div className="flex-1 overflow-hidden flex flex-col p-[15px] gap-4 bg-stone-50 min-h-0">

              {/* Header */}
              <div className="flex-shrink-0 rounded-2xl border border-stone-200 bg-white shadow-sm px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <h1 className="text-2xl font-serif font-bold text-stone-800 leading-tight">Schedule</h1>
                  <p className="text-xs text-stone-400">
                    {DAY_NAMES[selD.getDay()]}, {MONTH_NAMES[selD.getMonth()]} {selD.getDate()}, {selD.getFullYear()}
                    {isToday && <span className="ml-2 bg-blue-100 text-blue-600 text-[9px] font-semibold rounded-full px-2 py-0.5">Today</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scheduleNavDate(-1)}
                    className="w-8 h-8 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-stone-600" />
                  </button>
                  <button
                    onClick={() => setScheduleDate(new Date().toISOString().slice(0, 10))}
                    className="px-3 h-8 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-600 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => scheduleNavDate(1)}
                    className="w-8 h-8 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-stone-600" />
                  </button>
                </div>
              </div>

              {/* Body row — stretches to fill remaining screen height */}
              <div className="flex gap-4 flex-1 min-h-0">

                {/* Main background card with two floating AM/PM cards on top */}
                <div className="rounded-2xl border border-stone-200 bg-stone-100/70 shadow-inner flex-1 min-w-0 min-h-0 flex gap-3 p-3">

                  {/* Floating AM card */}
                  <div className="flex-1 min-w-0 rounded-xl border border-stone-200 bg-white shadow-lg flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 px-3 py-2 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">AM</span>
                      {amPlanMode ? (
                        <button
                          onClick={() => {
                            setAmPlanMode(false);
                            const all = loadSchedulePlanMode();
                            saveSchedulePlanMode({ ...all, [scheduleDate]: { am: false, pm: all[scheduleDate]?.pm ?? false } });
                          }}
                          className="px-3 py-0.5 rounded-full text-[10px] font-bold text-white tracking-wide transition-all hover:scale-105 active:scale-95"
                          style={{ backgroundColor: "#06b6d4" }}
                        >
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setAmPlanMode(true);
                            const all = loadSchedulePlanMode();
                            saveSchedulePlanMode({ ...all, [scheduleDate]: { am: true, pm: all[scheduleDate]?.pm ?? false } });
                          }}
                          className="px-3 py-0.5 rounded-full text-[10px] font-bold text-white tracking-wide transition-all hover:scale-105 active:scale-95"
                          style={{ backgroundColor: "#22c55e" }}
                        >
                          Done
                        </button>
                      )}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      {amPlanMode ? (() => {
                        const entries = amHours
                          .filter(h => (dayNotes[h] ?? "").trim() !== "")
                          .map(h => ({ hour: h, time: getDisplayTime(h), text: dayNotes[h] ?? "" }));
                        if (entries.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center h-full text-stone-300 gap-2">
                              <span className="text-3xl">📋</span>
                              <span className="text-[11px] font-medium">No entries yet</span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex flex-col items-center py-4 px-3 gap-0">
                            {entries.map((entry, i) => {
                              const entryColor = cellColorsForDate[entry.hour] ?? null;
                              const slotMeta = entryColor ? SLOT_COLORS.find(c => c.bg === entryColor) : null;
                              const isDone = (schedulePlanDone[scheduleDate] ?? {})[entry.hour] ?? false;
                              return (
                                <div key={entry.hour} className="flex flex-col items-center w-full" style={{ opacity: isDone ? 0.2 : 1, transition: "opacity 0.2s" }}>
                                  <div
                                    className="relative w-full rounded-xl px-4 py-2 flex flex-col items-center gap-0.5 shadow-sm border"
                                    style={entryColor
                                      ? { backgroundColor: entryColor + "66", borderColor: entryColor }
                                      : { backgroundColor: "#f8f8f7", borderColor: "#e7e5e4" }}
                                  >
                                    {/* Tick checkbox — top right */}
                                    <button
                                      onClick={() => toggleSchedulePlanDone(scheduleDate, entry.hour)}
                                      className="absolute top-1.5 right-1.5 w-4 h-4 rounded flex items-center justify-center border transition-all"
                                      style={isDone
                                        ? { backgroundColor: "#22c55e", borderColor: "#22c55e" }
                                        : { backgroundColor: "white", borderColor: "#d6d3d1" }}
                                    >
                                      {isDone && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </button>
                                    <div className="flex items-center gap-1.5">
                                      {slotMeta && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: slotMeta.dot }} />}
                                      <span className="text-[10px] font-semibold text-stone-400 tracking-wide">{entry.time}</span>
                                      {slotMeta && <span className="text-[9px] font-bold tracking-wide" style={{ color: slotMeta.dot }}>{slotMeta.label}</span>}
                                    </div>
                                    <span className="text-[13px] font-medium text-stone-700 text-center">{entry.text}</span>
                                  </div>
                                  {i < entries.length - 1 && (
                                    <div className="flex flex-col items-center my-1">
                                      <div className="w-px h-3 bg-stone-300" />
                                      <span className="text-stone-400 text-[14px] leading-none">↓</span>
                                      <div className="w-px h-3 bg-stone-300" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })() : renderTimeColumn(amHours)}
                    </div>
                  </div>

                  {/* Floating PM card */}
                  <div className="flex-1 min-w-0 rounded-xl border border-stone-200 bg-white shadow-lg flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 px-3 py-2 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">PM</span>
                      {pmPlanMode ? (
                        <button
                          onClick={() => {
                            setPmPlanMode(false);
                            const all = loadSchedulePlanMode();
                            saveSchedulePlanMode({ ...all, [scheduleDate]: { am: all[scheduleDate]?.am ?? false, pm: false } });
                          }}
                          className="px-3 py-0.5 rounded-full text-[10px] font-bold text-white tracking-wide transition-all hover:scale-105 active:scale-95"
                          style={{ backgroundColor: "#06b6d4" }}
                        >
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setPmPlanMode(true);
                            const all = loadSchedulePlanMode();
                            saveSchedulePlanMode({ ...all, [scheduleDate]: { am: all[scheduleDate]?.am ?? false, pm: true } });
                          }}
                          className="px-3 py-0.5 rounded-full text-[10px] font-bold text-white tracking-wide transition-all hover:scale-105 active:scale-95"
                          style={{ backgroundColor: "#22c55e" }}
                        >
                          Done
                        </button>
                      )}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto">
                      {pmPlanMode ? (() => {
                        const entries = pmHours
                          .filter(h => (dayNotes[h] ?? "").trim() !== "")
                          .map(h => ({ hour: h, time: getDisplayTime(h), text: dayNotes[h] ?? "" }));
                        if (entries.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center h-full text-stone-300 gap-2">
                              <span className="text-3xl">📋</span>
                              <span className="text-[11px] font-medium">No entries yet</span>
                            </div>
                          );
                        }
                        return (
                          <div className="flex flex-col items-center py-4 px-3 gap-0">
                            {entries.map((entry, i) => {
                              const entryColor = cellColorsForDate[entry.hour] ?? null;
                              const slotMeta = entryColor ? SLOT_COLORS.find(c => c.bg === entryColor) : null;
                              const isDone = (schedulePlanDone[scheduleDate] ?? {})[entry.hour] ?? false;
                              return (
                                <div key={entry.hour} className="flex flex-col items-center w-full" style={{ opacity: isDone ? 0.2 : 1, transition: "opacity 0.2s" }}>
                                  <div
                                    className="relative w-full rounded-xl px-4 py-2 flex flex-col items-center gap-0.5 shadow-sm border"
                                    style={entryColor
                                      ? { backgroundColor: entryColor + "66", borderColor: entryColor }
                                      : { backgroundColor: "#f8f8f7", borderColor: "#e7e5e4" }}
                                  >
                                    <button
                                      onClick={() => toggleSchedulePlanDone(scheduleDate, entry.hour)}
                                      className="absolute top-1.5 right-1.5 w-4 h-4 rounded flex items-center justify-center border transition-all"
                                      style={isDone
                                        ? { backgroundColor: "#22c55e", borderColor: "#22c55e" }
                                        : { backgroundColor: "white", borderColor: "#d6d3d1" }}
                                    >
                                      {isDone && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                    </button>
                                    <div className="flex items-center gap-1.5">
                                      {slotMeta && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: slotMeta.dot }} />}
                                      <span className="text-[10px] font-semibold text-stone-400 tracking-wide">{entry.time}</span>
                                      {slotMeta && <span className="text-[9px] font-bold tracking-wide" style={{ color: slotMeta.dot }}>{slotMeta.label}</span>}
                                    </div>
                                    <span className="text-[13px] font-medium text-stone-700 text-center">{entry.text}</span>
                                  </div>
                                  {i < entries.length - 1 && (
                                    <div className="flex flex-col items-center my-1">
                                      <div className="w-px h-3 bg-stone-300" />
                                      <span className="text-stone-400 text-[14px] leading-none">↓</span>
                                      <div className="w-px h-3 bg-stone-300" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })() : renderTimeColumn(pmHours)}
                    </div>
                  </div>

                </div>

                {/* Mini calendars — outside */}
                <div className="w-[321px] flex-shrink-0 flex flex-col gap-2 overflow-hidden min-h-0">
                  {calMonths.map(({ year, month }) => (
                    <div key={`${year}-${month}`} className="flex-1 min-h-0">
                      <MiniCalendar
                        year={year}
                        month={month}
                        selectedDate={scheduleDate}
                        onSelectDate={setScheduleDate}
                        markedDates={calMarkedDates}
                      />
                    </div>
                  ))}
                </div>

              </div>
            </div>
          );
        })()}

        {/* Project view */}
        {activeView === "project" && (
          <ProjectView
            projects={projects}
            setProjects={setProjects}
            activeId={activeProjectId}
            setActiveId={setActiveProjectId}
            onNewProject={handleCreateProject}
            focusTitleSignal={focusTitleSignal}
          />
        )}

        {/* To Do view */}
        {activeView === "to-do" && (
          <TodoView />
        )}

        {/* Memory view */}
        {activeView === "memory" && (
          <MemoryView />
        )}

        {/* All other views — blank */}
        {activeView !== "my-notebook" && activeView !== "short-note" && activeView !== "task" && activeView !== "schedule" && activeView !== "project" && activeView !== "to-do" && activeView !== "memory" && (
          <div className="flex-1" />
        )}

      </div>

    </div>
  );
}
