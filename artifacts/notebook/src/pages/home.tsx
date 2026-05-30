import { Link, useLocation } from "wouter";
import {
  Plus, Trash2, ImagePlus, X, Search, Download, Upload,
  BookOpen, FileText, Lock, LockOpen, Eye, EyeOff, User,
  Camera, Pencil, Home as HomeIcon, ChevronLeft, ChevronRight,
  Check, BookMarked, Clock, StickyNote, FolderKanban,
  CheckSquare, CalendarDays, UserRound, AlertTriangle,
  Smile, Image as ImageIcon, Type, List, Mic, Square, Play, Pause,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
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

// ── Tasks ─────────────────────────────────────────────────────
const TASKS_KEY = "nb_tasks";
const TASK_GROUPS_KEY = "nb_task_groups";

type TaskPriority = "low" | "normal" | "high" | "urgent";
type TaskStatus = "todo" | "in-progress" | "done";

interface SubTask {
  id: number;
  title: string;
  done: boolean;
}

interface Task {
  id: number;
  groupId: number;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  subtasks: SubTask[];
  createdAt: string;
  updatedAt: string;
}

interface TaskGroup {
  id: number;
  name: string;
  color: string;
}

const TASK_GROUP_COLORS = [
  "#3b5bdb", "#0ca678", "#e8590c", "#9c36b5",
  "#c2255c", "#1971c2", "#2f9e44", "#b45309",
];

const TASK_PRIORITY_META: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  low:    { label: "Low",    color: "#64748b", bg: "#f1f5f9" },
  normal: { label: "Normal", color: "#0ca678", bg: "#d1fae5" },
  high:   { label: "High",   color: "#e8590c", bg: "#ffedd5" },
  urgent: { label: "Urgent", color: "#c2255c", bg: "#fce7f3" },
};

const TASK_STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  "todo":        { label: "To Do",       color: "#64748b", bg: "#f1f5f9" },
  "in-progress": { label: "In Progress", color: "#1971c2", bg: "#dbeafe" },
  "done":        { label: "Done",        color: "#0ca678", bg: "#d1fae5" },
};

function loadTasks(): Task[] {
  try { const r = localStorage.getItem(TASKS_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveTasks(tasks: Task[]) { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); }

function loadTaskGroups(): TaskGroup[] {
  try {
    const r = localStorage.getItem(TASK_GROUPS_KEY);
    if (r) return JSON.parse(r);
  } catch {}
  const defaults: TaskGroup[] = [
    { id: 1, name: "Personal", color: "#3b5bdb" },
    { id: 2, name: "Work",     color: "#0ca678" },
  ];
  localStorage.setItem(TASK_GROUPS_KEY, JSON.stringify(defaults));
  return defaults;
}
function saveTaskGroups(groups: TaskGroup[]) { localStorage.setItem(TASK_GROUPS_KEY, JSON.stringify(groups)); }

function nextTaskId(tasks: Task[]): number { return tasks.reduce((m, t) => Math.max(m, t.id), 0) + 1; }
function nextGroupId(groups: TaskGroup[]): number { return groups.reduce((m, g) => Math.max(m, g.id), 0) + 1; }
// ─────────────────────────────────────────────────────────────

type ActiveView = "author" | "home" | "my-notebook" | "short-note" | "project" | "task" | "schedule";

const NAV_ITEMS: { id: ActiveView; label: string; icon: React.ElementType; active: boolean }[] = [
  { id: "author",     label: "Author",      icon: UserRound,      active: false },
  { id: "home",       label: "Home",        icon: HomeIcon,       active: false },
  { id: "short-note", label: "Short Note",  icon: StickyNote,     active: true  },
  { id: "my-notebook",label: "My Notebook", icon: BookMarked,     active: true  },
  { id: "project",    label: "Project",     icon: FolderKanban,   active: false },
  { id: "task",       label: "Task",        icon: CheckSquare,    active: true  },
  { id: "schedule",   label: "Schedule",    icon: CalendarDays,   active: false },
];

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

  // Task state
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks());
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>(() => loadTaskGroups());
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState<TaskStatus | "all">("all");
  const [taskGroupFilter, setTaskGroupFilter] = useState<number | "all">("all");
  const [showTaskCreate, setShowTaskCreate] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>("normal");
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("todo");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskGroupId, setNewTaskGroupId] = useState<number>(1);
  const [newTaskSubtasks, setNewTaskSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState("");
  const [taskDetailEdit, setTaskDetailEdit] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(TASK_GROUP_COLORS[0]);
  const [taskConfirmDelete, setTaskConfirmDelete] = useState<number | null>(null);

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
    <div className="min-h-screen w-full bg-[#f8f7f4] flex">

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
              <button
                key={item.id}
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
            );
          })}

          {/* Notebook list — only shown when My Notebook is active */}
          {activeView === "my-notebook" && (
            <div className="mt-3">
              {!sidebarCollapsed && (
                <div className="px-1 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Notebooks</span>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="w-5 h-5 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all"
                    title="New notebook"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex flex-col gap-0.5">
                {books.map((book) => (
                  <Link
                    key={book.id}
                    href={`/books/${book.id}`}
                    onClick={(e) => handleBookClick(e, book)}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-all group ${sidebarCollapsed ? "justify-center" : ""}`}
                    title={book.title}
                  >
                    <div
                      className="w-4 h-4 rounded flex-shrink-0 relative overflow-hidden"
                      style={coverStyle((book as any).pattern ?? "solid", book.color || "#1e293b", (book as any).coverImg)}
                    >
                      {book.password && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Lock className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    {!sidebarCollapsed && (
                      <>
                        <span className="text-xs truncate flex-1">{book.title}</span>
                        <span className="text-[10px] text-stone-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">{book.pageCount}</span>
                      </>
                    )}
                  </Link>
                ))}
                {books.length === 0 && !sidebarCollapsed && (
                  <p className="text-xs text-stone-400 px-2 py-1">No notebooks yet</p>
                )}
              </div>
            </div>
          )}
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
      <div className="flex-1 min-w-0 overflow-y-auto">

        {/* My Notebook view */}
        {activeView === "my-notebook" && (
          <div className="p-6 md:p-10 max-w-7xl mx-auto">

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
          <div className="px-10 py-6 md:py-8 w-full flex flex-col gap-6">

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
            <div className="flex gap-5 items-start">

              {/* LEFT: Big note form */}
              <div className="w-[58%] flex-shrink-0">
                <div className="bg-stone-50 rounded-2xl flex flex-col overflow-visible" style={{ minHeight: 780, boxShadow: "0 8px 40px 0 rgba(0,0,0,0.10), 0 2px 8px 0 rgba(0,0,0,0.06)" }}>

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
                      className="flex-1 mx-5 mb-0 border border-stone-100 rounded-xl overflow-hidden flex flex-col relative"
                      style={{ minHeight: 500 }}
                    >
                      <textarea
                        ref={noteTextareaRef}
                        value={newNoteBody}
                        onChange={(e) => setNewNoteBody(e.target.value)}
                        placeholder="Write your note here..."
                        className="flex-1 w-full px-4 py-3 text-sm text-stone-600 outline-none bg-white resize-none placeholder:text-stone-300 leading-relaxed"
                        onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) { selectedNoteId !== null ? handleSaveSelectedNote() : handleCreateNote(); } }}
                        style={{ minHeight: 500 }}
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

              {/* RIGHT: Mini note cards */}
              <div className="flex-1 overflow-y-auto max-h-[780px] pr-1">
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
        )}

        {/* Task view */}
        {activeView === "task" && (() => {
          const selectedTask = tasks.find(t => t.id === selectedTaskId) ?? null;

          const filteredTasks = tasks.filter(t => {
            const matchSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase());
            const matchStatus = taskStatusFilter === "all" || t.status === taskStatusFilter;
            const matchGroup = taskGroupFilter === "all" || t.groupId === taskGroupFilter;
            return matchSearch && matchStatus && matchGroup;
          });

          const groupedTasks = taskGroups.map(g => ({
            group: g,
            tasks: filteredTasks.filter(t => t.groupId === g.id),
          })).filter(g => g.tasks.length > 0 || taskGroupFilter === "all");

          const handleAddTask = () => {
            if (!newTaskTitle.trim()) return;
            const now = new Date().toISOString();
            const task: Task = {
              id: nextTaskId(tasks),
              groupId: newTaskGroupId,
              title: newTaskTitle.trim(),
              description: newTaskDesc,
              priority: newTaskPriority,
              status: newTaskStatus,
              dueDate: newTaskDue,
              subtasks: newTaskSubtasks,
              createdAt: now,
              updatedAt: now,
            };
            const updated = [task, ...tasks];
            saveTasks(updated);
            setTasks(updated);
            setSelectedTaskId(task.id);
            setShowTaskCreate(false);
            setNewTaskTitle(""); setNewTaskDesc(""); setNewTaskPriority("normal");
            setNewTaskStatus("todo"); setNewTaskDue(""); setNewTaskGroupId(taskGroups[0]?.id ?? 1);
            setNewTaskSubtasks([]); setNewSubtaskInput("");
          };

          const handleUpdateTask = (patch: Partial<Task>) => {
            if (!selectedTask) return;
            const updated = tasks.map(t => t.id === selectedTask.id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t);
            saveTasks(updated);
            setTasks(updated);
          };

          const handleDeleteTask = (id: number) => {
            const updated = tasks.filter(t => t.id !== id);
            saveTasks(updated);
            setTasks(updated);
            if (selectedTaskId === id) setSelectedTaskId(null);
            setTaskConfirmDelete(null);
          };

          const handleAddGroup = () => {
            if (!newGroupName.trim()) return;
            const g: TaskGroup = { id: nextGroupId(taskGroups), name: newGroupName.trim(), color: newGroupColor };
            const updated = [...taskGroups, g];
            saveTaskGroups(updated);
            setTaskGroups(updated);
            setNewGroupName(""); setShowNewGroup(false);
          };

          const toggleSubtask = (stId: number) => {
            if (!selectedTask) return;
            const updated = selectedTask.subtasks.map(s => s.id === stId ? { ...s, done: !s.done } : s);
            handleUpdateTask({ subtasks: updated });
          };

          const addSubtaskToDetail = (title: string) => {
            if (!selectedTask || !title.trim()) return;
            const st: SubTask = { id: (selectedTask.subtasks.reduce((m, s) => Math.max(m, s.id), 0) + 1), title: title.trim(), done: false };
            handleUpdateTask({ subtasks: [...selectedTask.subtasks, st] });
          };

          const removeSubtaskFromDetail = (stId: number) => {
            if (!selectedTask) return;
            handleUpdateTask({ subtasks: selectedTask.subtasks.filter(s => s.id !== stId) });
          };

          const isOverdue = (due: string) => due && new Date(due) < new Date() && new Date(due).toDateString() !== new Date().toDateString();

          return (
            <div className="flex flex-1 min-h-0 overflow-hidden">

              {/* LEFT PANEL — Task list */}
              <div className="flex flex-col w-[380px] min-w-[320px] max-w-[420px] border-r border-stone-100 bg-stone-50/60 overflow-hidden">

                {/* Header */}
                <div className="px-5 pt-5 pb-3 border-b border-stone-100 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h1 className="text-xl font-serif font-bold text-stone-800">Tasks</h1>
                      <p className="text-[11px] text-stone-400">{tasks.length} task{tasks.length !== 1 ? "s" : ""} total</p>
                    </div>
                    <button
                      onClick={() => { setShowTaskCreate(true); setNewTaskGroupId(taskGroups[0]?.id ?? 1); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-semibold transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Task
                    </button>
                  </div>

                  {/* Search */}
                  <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 mb-2">
                    <Search className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={taskSearch}
                      onChange={e => setTaskSearch(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-stone-700 outline-none placeholder-stone-400"
                    />
                    {taskSearch && <button onClick={() => setTaskSearch("")}><X className="w-3 h-3 text-stone-400" /></button>}
                  </div>

                  {/* Filters */}
                  <div className="flex gap-1.5 flex-wrap">
                    {(["all","todo","in-progress","done"] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setTaskStatusFilter(s)}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors ${taskStatusFilter === s ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}
                      >
                        {s === "all" ? "All" : TASK_STATUS_META[s].label}
                      </button>
                    ))}
                    <div className="w-px h-5 bg-stone-200 self-center mx-0.5" />
                    <button
                      onClick={() => setTaskGroupFilter("all")}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors ${taskGroupFilter === "all" ? "bg-stone-800 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}
                    >All Groups</button>
                    {taskGroups.map(g => (
                      <button
                        key={g.id}
                        onClick={() => setTaskGroupFilter(g.id)}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors ${taskGroupFilter === g.id ? "text-white" : "text-stone-500 hover:bg-stone-200 bg-stone-100"}`}
                        style={taskGroupFilter === g.id ? { backgroundColor: g.color } : {}}
                      >{g.name}</button>
                    ))}
                    <button
                      onClick={() => setShowNewGroup(v => !v)}
                      className="text-[10px] px-2 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-400 transition-colors"
                      title="Add group"
                    ><Plus className="w-2.5 h-2.5" /></button>
                  </div>

                  {/* New group input */}
                  {showNewGroup && (
                    <div className="mt-2 flex gap-2 items-center">
                      <div className="flex gap-1">
                        {TASK_GROUP_COLORS.map(c => (
                          <button key={c} onClick={() => setNewGroupColor(c)}
                            className={`w-4 h-4 rounded-full flex-shrink-0 transition-transform ${newGroupColor === c ? "ring-2 ring-offset-1 ring-stone-400 scale-110" : ""}`}
                            style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <input
                        autoFocus
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleAddGroup(); if (e.key === "Escape") setShowNewGroup(false); }}
                        placeholder="Group name..."
                        className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 outline-none"
                      />
                      <button onClick={handleAddGroup} className="text-xs font-semibold px-2 py-1 rounded-lg bg-stone-800 text-white">Add</button>
                    </div>
                  )}
                </div>

                {/* Task list scroll area */}
                <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-5">
                  {groupedTasks.length === 0 && filteredTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-stone-400">
                      <CheckSquare className="w-10 h-10 opacity-30" />
                      <p className="text-sm">No tasks yet</p>
                      <button onClick={() => setShowTaskCreate(true)} className="text-xs underline text-stone-500">Create one</button>
                    </div>
                  )}

                  {taskGroups.map(group => {
                    const gTasks = filteredTasks.filter(t => t.groupId === group.id);
                    if (gTasks.length === 0 && taskGroupFilter !== "all") return null;
                    if (gTasks.length === 0) return null;
                    return (
                      <div key={group.id}>
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: group.color }} />
                          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{group.name}</span>
                          <span className="text-[10px] text-stone-400 ml-auto">{gTasks.length}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                          {gTasks.map(task => {
                            const pm = TASK_PRIORITY_META[task.priority];
                            const sm = TASK_STATUS_META[task.status];
                            const overdue = isOverdue(task.dueDate);
                            const doneCount = task.subtasks.filter(s => s.done).length;
                            const isSelected = selectedTaskId === task.id;
                            return (
                              <div
                                key={task.id}
                                onClick={() => { setSelectedTaskId(task.id); setTaskDetailEdit(false); }}
                                className={`group relative bg-white rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 overflow-hidden flex ${isSelected ? "border-stone-400 ring-2 ring-stone-200 shadow-md" : "border-stone-100 shadow-sm"}`}
                              >
                                {/* left accent */}
                                <div className="w-[4px] flex-shrink-0 rounded-l-xl" style={{ backgroundColor: group.color }} />
                                <div className="flex-1 px-3.5 py-3 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <h3 className={`text-sm font-semibold leading-snug flex-1 min-w-0 ${task.status === "done" ? "line-through text-stone-400" : "text-stone-800"}`}>
                                      {task.title}
                                    </h3>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ backgroundColor: pm.bg, color: pm.color }}>{pm.label}</span>
                                  </div>
                                  {task.description && (
                                    <p className="text-[11px] text-stone-500 line-clamp-1 mb-1.5">{task.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: sm.bg, color: sm.color }}>{sm.label}</span>
                                    {task.dueDate && (
                                      <span className={`text-[9px] flex items-center gap-0.5 ${overdue ? "text-red-500 font-semibold" : "text-stone-400"}`}>
                                        <CalendarDays className="w-2.5 h-2.5" />
                                        {new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                        {overdue && " ⚠"}
                                      </span>
                                    )}
                                    {task.subtasks.length > 0 && (
                                      <span className="text-[9px] text-stone-400 flex items-center gap-0.5">
                                        <Check className="w-2.5 h-2.5" /> {doneCount}/{task.subtasks.length}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* delete button on hover */}
                                <button
                                  onClick={e => { e.stopPropagation(); setTaskConfirmDelete(task.id); }}
                                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-stone-100 hover:bg-red-100 items-center justify-center opacity-0 group-hover:opacity-100 transition-all hidden group-hover:flex"
                                ><Trash2 className="w-2.5 h-2.5 text-stone-400 hover:text-red-500" /></button>

                                {/* delete confirm overlay */}
                                {taskConfirmDelete === task.id && (
                                  <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-2 z-10 rounded-xl">
                                    <p className="text-xs font-semibold text-stone-700">Delete this task?</p>
                                    <div className="flex gap-2">
                                      <button onClick={e => { e.stopPropagation(); handleDeleteTask(task.id); }} className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold">Yes</button>
                                      <button onClick={e => { e.stopPropagation(); setTaskConfirmDelete(null); }} className="px-3 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-semibold">No</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT PANEL — Detail / Create */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white">

                {/* CREATE FORM */}
                {showTaskCreate && (
                  <div className="flex-1 overflow-y-auto px-8 py-8">
                    <div className="max-w-lg mx-auto">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-serif font-bold text-stone-800">New Task</h2>
                        <button onClick={() => setShowTaskCreate(false)}><X className="w-5 h-5 text-stone-400 hover:text-stone-700" /></button>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="text-xs font-semibold text-stone-500 mb-1 block">Title *</label>
                          <input
                            autoFocus
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleAddTask()}
                            placeholder="Task title..."
                            className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-800 outline-none focus:border-stone-400 transition-colors bg-stone-50"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-stone-500 mb-1 block">Description</label>
                          <textarea
                            value={newTaskDesc}
                            onChange={e => setNewTaskDesc(e.target.value)}
                            placeholder="Add details..."
                            rows={3}
                            className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-600 outline-none focus:border-stone-400 transition-colors bg-stone-50 resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-stone-500 mb-1 block">Group</label>
                            <select value={newTaskGroupId} onChange={e => setNewTaskGroupId(Number(e.target.value))} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 bg-stone-50 outline-none">
                              {taskGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-stone-500 mb-1 block">Due Date</label>
                            <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 bg-stone-50 outline-none" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-stone-500 mb-1 block">Priority</label>
                            <div className="flex gap-1.5 flex-wrap">
                              {(["low","normal","high","urgent"] as TaskPriority[]).map(p => (
                                <button key={p} onClick={() => setNewTaskPriority(p)}
                                  className="text-[10px] font-bold px-2 py-1 rounded-full transition-colors"
                                  style={newTaskPriority === p ? { backgroundColor: TASK_PRIORITY_META[p].color, color: "#fff" } : { backgroundColor: TASK_PRIORITY_META[p].bg, color: TASK_PRIORITY_META[p].color }}
                                >{TASK_PRIORITY_META[p].label}</button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-stone-500 mb-1 block">Status</label>
                            <div className="flex gap-1.5 flex-wrap">
                              {(["todo","in-progress","done"] as TaskStatus[]).map(s => (
                                <button key={s} onClick={() => setNewTaskStatus(s)}
                                  className="text-[10px] font-bold px-2 py-1 rounded-full transition-colors"
                                  style={newTaskStatus === s ? { backgroundColor: TASK_STATUS_META[s].color, color: "#fff" } : { backgroundColor: TASK_STATUS_META[s].bg, color: TASK_STATUS_META[s].color }}
                                >{TASK_STATUS_META[s].label}</button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Subtasks */}
                        <div>
                          <label className="text-xs font-semibold text-stone-500 mb-2 block">Subtasks</label>
                          <div className="flex flex-col gap-1.5 mb-2">
                            {newTaskSubtasks.map(st => (
                              <div key={st.id} className="flex items-center gap-2 bg-stone-50 rounded-lg px-3 py-1.5">
                                <Check className="w-3.5 h-3.5 text-stone-300" />
                                <span className="text-xs text-stone-600 flex-1">{st.title}</span>
                                <button onClick={() => setNewTaskSubtasks(p => p.filter(s => s.id !== st.id))}><X className="w-3 h-3 text-stone-400" /></button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input
                              value={newSubtaskInput}
                              onChange={e => setNewSubtaskInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter" && newSubtaskInput.trim()) {
                                  setNewTaskSubtasks(p => [...p, { id: p.length + 1, title: newSubtaskInput.trim(), done: false }]);
                                  setNewSubtaskInput("");
                                }
                              }}
                              placeholder="Add subtask, press Enter..."
                              className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-700 bg-stone-50 outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button onClick={handleAddTask} className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-sm font-semibold transition-colors">Create Task</button>
                          <button onClick={() => setShowTaskCreate(false)} className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-semibold transition-colors">Cancel</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* DETAIL PANEL */}
                {!showTaskCreate && selectedTask && (() => {
                  const group = taskGroups.find(g => g.id === selectedTask.groupId);
                  const pm = TASK_PRIORITY_META[selectedTask.priority];
                  const sm = TASK_STATUS_META[selectedTask.status];
                  const overdue = isOverdue(selectedTask.dueDate);
                  const doneCount = selectedTask.subtasks.filter(s => s.done).length;
                  return (
                    <div className="flex-1 overflow-y-auto px-8 py-8">
                      <div className="max-w-lg mx-auto">

                        {/* Top bar */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            {group && <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.color }} />}
                            <span className="text-xs font-semibold text-stone-400">{group?.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setTaskDetailEdit(v => !v)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors flex items-center gap-1"
                            ><Pencil className="w-3 h-3" /> {taskDetailEdit ? "Done" : "Edit"}</button>
                            <button onClick={() => setTaskConfirmDelete(selectedTask.id)} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors flex items-center gap-1">
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </div>
                        </div>

                        {/* Title */}
                        {taskDetailEdit ? (
                          <input
                            value={selectedTask.title}
                            onChange={e => handleUpdateTask({ title: e.target.value })}
                            className="w-full text-2xl font-serif font-bold text-stone-800 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2 outline-none mb-4"
                          />
                        ) : (
                          <h2 className={`text-2xl font-serif font-bold mb-4 leading-snug ${selectedTask.status === "done" ? "line-through text-stone-400" : "text-stone-800"}`}>{selectedTask.title}</h2>
                        )}

                        {/* Badges */}
                        <div className="flex gap-2 flex-wrap mb-5">
                          {/* Priority */}
                          {taskDetailEdit ? (
                            <div className="flex gap-1.5">
                              {(["low","normal","high","urgent"] as TaskPriority[]).map(p => (
                                <button key={p} onClick={() => handleUpdateTask({ priority: p })}
                                  className="text-[10px] font-bold px-2 py-1 rounded-full transition-colors"
                                  style={selectedTask.priority === p ? { backgroundColor: TASK_PRIORITY_META[p].color, color: "#fff" } : { backgroundColor: TASK_PRIORITY_META[p].bg, color: TASK_PRIORITY_META[p].color }}
                                >{TASK_PRIORITY_META[p].label}</button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: pm.bg, color: pm.color }}>{pm.label}</span>
                          )}
                        </div>

                        {/* Status */}
                        <div className="mb-4">
                          <label className="text-xs font-semibold text-stone-400 mb-1.5 block">Status</label>
                          <div className="flex gap-2">
                            {(["todo","in-progress","done"] as TaskStatus[]).map(s => (
                              <button key={s} onClick={() => handleUpdateTask({ status: s })}
                                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                                style={selectedTask.status === s ? { backgroundColor: TASK_STATUS_META[s].color, color: "#fff" } : { backgroundColor: TASK_STATUS_META[s].bg, color: TASK_STATUS_META[s].color }}
                              >{TASK_STATUS_META[s].label}</button>
                            ))}
                          </div>
                        </div>

                        {/* Due date */}
                        <div className="mb-5">
                          <label className="text-xs font-semibold text-stone-400 mb-1.5 block flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" /> Due Date
                          </label>
                          {taskDetailEdit ? (
                            <input type="date" value={selectedTask.dueDate} onChange={e => handleUpdateTask({ dueDate: e.target.value })}
                              className="border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 bg-stone-50 outline-none" />
                          ) : (
                            <span className={`text-sm font-medium ${overdue ? "text-red-500" : selectedTask.dueDate ? "text-stone-700" : "text-stone-400"}`}>
                              {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) + (overdue ? " — Overdue ⚠" : "") : "No due date"}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                          <label className="text-xs font-semibold text-stone-400 mb-1.5 block">Description</label>
                          {taskDetailEdit ? (
                            <textarea value={selectedTask.description} onChange={e => handleUpdateTask({ description: e.target.value })}
                              rows={4} placeholder="Add description..."
                              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-600 bg-stone-50 outline-none resize-none focus:border-stone-400 transition-colors" />
                          ) : (
                            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{selectedTask.description || <span className="text-stone-300 italic">No description</span>}</p>
                          )}
                        </div>

                        {/* Subtasks */}
                        <div>
                          <label className="text-xs font-semibold text-stone-400 mb-2 block flex items-center gap-1">
                            <Check className="w-3 h-3" /> Subtasks {selectedTask.subtasks.length > 0 && `(${doneCount}/${selectedTask.subtasks.length})`}
                          </label>

                          {selectedTask.subtasks.length > 0 && (
                            <div className="mb-1.5 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                              <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${Math.round((doneCount / selectedTask.subtasks.length) * 100)}%` }} />
                            </div>
                          )}

                          <div className="flex flex-col gap-1.5 mb-3">
                            {selectedTask.subtasks.map(st => (
                              <div key={st.id} className="flex items-center gap-2.5 bg-stone-50 rounded-xl px-3 py-2 group/st">
                                <button onClick={() => toggleSubtask(st.id)}
                                  className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${st.done ? "bg-emerald-500 border-emerald-500" : "border-stone-300 hover:border-stone-500"}`}
                                >
                                  {st.done && <Check className="w-2.5 h-2.5 text-white" />}
                                </button>
                                <span className={`text-sm flex-1 ${st.done ? "line-through text-stone-400" : "text-stone-700"}`}>{st.title}</span>
                                {taskDetailEdit && (
                                  <button onClick={() => removeSubtaskFromDetail(st.id)} className="opacity-0 group-hover/st:opacity-100 transition-opacity">
                                    <X className="w-3 h-3 text-stone-400 hover:text-red-500" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="flex gap-2">
                            <input
                              value={newSubtaskInput}
                              onChange={e => setNewSubtaskInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter" && newSubtaskInput.trim()) {
                                  addSubtaskToDetail(newSubtaskInput);
                                  setNewSubtaskInput("");
                                }
                              }}
                              placeholder="Add subtask, press Enter..."
                              className="flex-1 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-700 bg-stone-50 outline-none focus:border-stone-400 transition-colors"
                            />
                          </div>
                        </div>

                        <p className="text-[10px] text-stone-300 mt-6">Updated {new Date(selectedTask.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>

                      {/* delete confirm overlay */}
                      {taskConfirmDelete === selectedTask.id && (
                        <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-3 z-20">
                          <p className="text-sm font-semibold text-stone-700">Delete this task?</p>
                          <div className="flex gap-2">
                            <button onClick={() => handleDeleteTask(selectedTask.id)} className="px-4 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold">Yes, delete</button>
                            <button onClick={() => setTaskConfirmDelete(null)} className="px-4 py-1.5 rounded-lg bg-stone-100 text-stone-700 text-xs font-semibold">Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* EMPTY STATE */}
                {!showTaskCreate && !selectedTask && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-stone-300">
                    <CheckSquare className="w-16 h-16 opacity-20" />
                    <p className="text-sm text-stone-400">Select a task to view details</p>
                    <button onClick={() => setShowTaskCreate(true)} className="text-xs px-4 py-2 rounded-xl bg-stone-800 text-white font-semibold hover:bg-stone-700 transition-colors">
                      + New Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* All other views — blank */}
        {activeView !== "my-notebook" && activeView !== "short-note" && activeView !== "task" && (
          <div className="flex-1" />
        )}

      </div>
    </div>
  );
}
