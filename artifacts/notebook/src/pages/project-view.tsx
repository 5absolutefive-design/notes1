import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import {
  Plus, ImagePlus, FolderKanban, X,
  Bold, Italic, Underline, Strikethrough, Highlighter,
  CheckSquare, Minus, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  ChevronRight, Link,
} from "lucide-react";

// ── Types (exported for use in home.tsx) ─────────────────────────
export interface ProjectDoc {
  id: number;
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

interface ContextMenuState {
  x: number;
  y: number;
  formatOpen: boolean;
  alignOpen: boolean;
  bulletOpen: boolean;
  highlightOpen: boolean;
  headingOpen: boolean;
  dividerOpen: boolean;
  linkOpen: boolean;
  todoOpen: boolean;
  todoCount: number;
  todoRemoveCount: number;
}

interface ImageBlock {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  locked: boolean;
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
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);
  const bannerPickerRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const bannerUploadRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [lastTodoPos, setLastTodoPos] = useState<{ top: number; left: number } | null>(null);
  const [showTodoButtons, setShowTodoButtons] = useState(false);
  const [imageBlocks, setImageBlocks] = useState<ImageBlock[]>([]);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ id: string; startMx: number; startMy: number; startBx: number; startBy: number } | null>(null);
  const resizeRef = useRef<{ id: string; startMx: number; startW: number; side: "br" | "bl" | "tr" | "tl" } | null>(null);

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

  // ── Document-level drag and resize handlers for image blocks
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const { id, startMx, startMy, startBx, startBy } = dragRef.current;
        setImageBlocks(prev => prev.map(b => b.id === id
          ? { ...b, x: startBx + e.clientX - startMx, y: startBy + e.clientY - startMy }
          : b));
      }
      if (resizeRef.current) {
        const { id, startMx, startW, side } = resizeRef.current;
        const delta = side === "br" || side === "tr" ? e.clientX - startMx : startMx - e.clientX;
        const newW = Math.max(80, startW + delta);
        setImageBlocks(prev => prev.map(b => b.id === id ? { ...b, width: newW } : b));
      }
    };
    const onUp = () => { dragRef.current = null; resizeRef.current = null; };
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
  }, [activeId, setProjects]);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(saveContent, 600);
  }, [saveContent]);

  // ── Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ctxMenu && ctxMenuRef.current && !ctxMenuRef.current.contains(e.target as Node))
        setCtxMenu(null);
      if (showBannerPicker && bannerPickerRef.current && !bannerPickerRef.current.contains(e.target as Node))
        setShowBannerPicker(false);
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node))
        setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ctxMenu, showBannerPicker, showEmojiPicker]);

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

  // ── Right-click handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, formatOpen: false, alignOpen: false, bulletOpen: false, highlightOpen: false, headingOpen: false, dividerOpen: false, linkOpen: false, todoOpen: false, todoCount: 1, todoRemoveCount: 1 });
  };

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
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    setCtxMenu(null);
    debouncedSave();
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
    editor.focus();

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
      setImageBlocks(prev => [...prev, {
        id, src, locked: false, width: blockW,
        x: (containerW - blockW) / 2,
        y: scrollTop + 120,
      }]);
    } catch { /* ignore */ }
  };

  const removeBtn = () =>
    `<button data-remove-btn="1" contenteditable="false" ` +
    `style="position:absolute;top:5px;right:6px;width:18px;height:18px;border-radius:50%;background:rgba(0,0,0,0.08);border:none;cursor:pointer;font-size:14px;color:#777;line-height:1;padding:0;display:inline-flex;align-items:center;justify-content:center;z-index:10;flex-shrink:0" ` +
    `title="Remove">&#215;</button>`;

  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Remove button clicked → delete the parent block
    const removeButton = target.closest('[data-remove-btn]');
    if (removeButton) {
      e.preventDefault();
      e.stopPropagation();
      const block = removeButton.closest('[data-quote-block],[data-link-block]');
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

  const insertBorderBlock = () => insertHTML(
    `<div contenteditable="false" data-quote-block="1" style="position:relative;border-left:4px solid #6366f1;background:#f5f3ff;padding:10px 36px 10px 16px;border-radius:0 8px 8px 0;margin:8px 0">` +
    removeBtn() +
    `<p contenteditable="true" style="margin:0;color:#4c1d95;font-style:italic;outline:none">Type your note here…</p></div><br/>`
  );

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
      `<span data-link-url="1" contenteditable="true" ` +
      `onclick="event.stopPropagation()" ` +
      `style="outline:none;color:${cfg.color};font-size:13px;text-decoration:underline;word-break:break-all;display:block;cursor:text">Paste link here…</span>` +
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
    }
  };

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
          style={{ position: "relative" }}
          onMouseMove={(e) => {
            if (!lastTodoPos) return;
            const rect = scrollContainerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top + (scrollContainerRef.current?.scrollTop ?? 0);
            const dx = mx - lastTodoPos.left;
            const dy = my - lastTodoPos.top;
            setShowTodoButtons(Math.abs(dx) < 80 && Math.abs(dy) < 40);
          }}
          onMouseLeave={() => setShowTodoButtons(false)}
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
          {/* Banner + emoji overlap wrapper */}
          <div className="relative">
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
            onContextMenu={handleContextMenu}
            onClick={handleEditorClick}
            className="outline-none text-stone-800 text-[15px] leading-relaxed"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              caretColor: "#6366f1",
              padding: "16px 48px 80px",
              minHeight: "6100px",
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

          {/* Image blocks — absolutely positioned within the scroll container */}
          {imageBlocks.map(blk => (
            <div
              key={blk.id}
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

                {/* × Delete button — top-left */}
                <button
                  data-img-btn="1"
                  onClick={() => setImageBlocks(prev => prev.filter(b => b.id !== blk.id))}
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

                {/* Lock button — top-right */}
                <button
                  data-img-btn="1"
                  onClick={() => setImageBlocks(prev => prev.map(b => b.id === blk.id ? { ...b, locked: !b.locked } : b))}
                  style={{
                    position: "absolute", top: -10, right: -10,
                    width: 22, height: 22, borderRadius: "50%",
                    background: blk.locked ? "#6366f1" : "#94a3b8",
                    border: "2px solid #fff",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.18)", zIndex: 30, padding: 0,
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
                      resizeRef.current = { id: blk.id, startMx: e.clientX, startW: blk.width, side };
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
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-stone-400">
          <FolderKanban className="w-10 h-10 text-stone-300" />
          <p className="text-sm">Select a project from the sidebar</p>
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
              onClick={() => setCtxMenu(m => m ? { ...m, formatOpen: !m.formatOpen, highlightOpen: false, headingOpen: false } : null)} />
            {ctxMenu.formatOpen && (
              <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-1.5 z-[10000] min-w-[180px]">
                <CtxItem icon={<Bold className="w-3.5 h-3.5"/>}          label="Bold"          shortcut="Ctrl+B" onClick={() => execFmt("bold")} />
                <CtxItem icon={<Italic className="w-3.5 h-3.5"/>}        label="Italic"        shortcut="Ctrl+I" onClick={() => execFmt("italic")} />
                <CtxItem icon={<Underline className="w-3.5 h-3.5"/>}     label="Underline"     shortcut="Ctrl+U" onClick={() => execFmt("underline")} />
                <CtxItem icon={<Strikethrough className="w-3.5 h-3.5"/>} label="Strikethrough" onClick={() => execFmt("strikeThrough")} />
                {/* Highlight */}
                <div className="relative">
                  <CtxItem icon={<Highlighter className="w-3.5 h-3.5"/>} label="Highlight" hasArrow
                    onClick={() => setCtxMenu(m => m ? { ...m, highlightOpen: !m.highlightOpen, headingOpen: false } : null)} />
                  {ctxMenu.highlightOpen && (
                    <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 p-2.5 flex gap-1.5 z-[10001]">
                      {HIGHLIGHT_COLORS.map(hc => (
                        <button key={hc.color} title={hc.label} onClick={() => execFmt("hiliteColor", hc.color)}
                          className="w-6 h-6 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                          style={{ backgroundColor: hc.color }} />
                      ))}
                      <button title="Remove" onClick={() => execFmt("hiliteColor", "transparent")}
                        className="w-6 h-6 rounded-full border-2 border-stone-300 flex items-center justify-center hover:scale-110 transition-transform">
                        <X className="w-3 h-3 text-stone-400" />
                      </button>
                    </div>
                  )}
                </div>
                {/* Heading */}
                <div className="relative">
                  <CtxItem icon={<Heading1 className="w-3.5 h-3.5"/>} label="Heading" hasArrow
                    onClick={() => setCtxMenu(m => m ? { ...m, headingOpen: !m.headingOpen, highlightOpen: false } : null)} />
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
          {/* Align button → side sub-card */}
          <div className="relative">
            <CtxItem icon={<AlignLeft className="w-3.5 h-3.5"/>} label="Align" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, alignOpen: !m.alignOpen, formatOpen: false } : null)} />
            {ctxMenu.alignOpen && (
              <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-1.5 z-[10000] min-w-[160px]">
                <CtxItem icon={<AlignLeft className="w-3.5 h-3.5"/>}   label="Align Left"   onClick={() => execFmt("justifyLeft")} />
                <CtxItem icon={<AlignCenter className="w-3.5 h-3.5"/>} label="Align Center" onClick={() => execFmt("justifyCenter")} />
                <CtxItem icon={<AlignRight className="w-3.5 h-3.5"/>}  label="Align Right"  onClick={() => execFmt("justifyRight")} />
              </div>
            )}
          </div>

          <div className="my-1 border-t border-stone-100" />
          <CtxSection label="Insert" />
          <CtxItem icon={<CheckSquare className="w-3.5 h-3.5"/>} label="To-Do Item" onClick={() => { insertTodo(); setCtxMenu(null); }} />
          {/* Bullet List → side sub-card with many styles */}
          <div className="relative">
            <CtxItem icon={<List className="w-3.5 h-3.5"/>} label="Bullet List" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, bulletOpen: !m.bulletOpen, formatOpen: false, alignOpen: false } : null)} />
            {ctxMenu.bulletOpen && (
              <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 px-2 z-[10000] min-w-[220px]">
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wide px-1 mb-1.5">Choose a list style</p>
                {/* Number list row */}
                <button onClick={() => insertCustomBullet("ordered")}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 text-stone-700 text-xs font-medium transition-colors text-left">
                  <span className="text-sm font-semibold text-stone-500 w-6 text-center">1.</span>
                  <span>Number List</span>
                </button>
                {/* Bullet grid */}
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
              onClick={() => setCtxMenu(m => m ? { ...m, dividerOpen: !m.dividerOpen, bulletOpen: false, formatOpen: false, alignOpen: false } : null)} />
            {ctxMenu.dividerOpen && (
              <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 px-3 z-[10000] min-w-[200px]">
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
              onClick={() => setCtxMenu(m => m ? { ...m, linkOpen: !m.linkOpen, dividerOpen: false, bulletOpen: false, formatOpen: false, alignOpen: false } : null)} />
            {ctxMenu.linkOpen && (
              <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 px-2 z-[10000] min-w-[190px]">
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
          <CtxItem icon={<ImagePlus className="w-3.5 h-3.5"/>} label="Image" onClick={() => { setCtxMenu(null); imgInputRef.current?.click(); }} />
          <CtxItem icon={<ChevronRight className="w-3.5 h-3.5"/>} label="Quote Block"   onClick={insertBorderBlock} />
        </div>
      )}

      {/* Editor styles */}
      <style>{`
        .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        [data-placeholder]:empty:before { content: attr(data-placeholder); color: #c0bdb8; pointer-events: none; }
        [contenteditable] h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0 0.25em; line-height: 1.2; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0 0.25em; line-height: 1.3; }
        [contenteditable] h3 { font-size: 1.2em; font-weight: 600; margin: 0.4em 0 0.2em; line-height: 1.4; }
        [contenteditable] ul { list-style-type: disc; padding-left: 1.5em; margin: 4px 0; }
        [contenteditable] ol { list-style-type: decimal; padding-left: 1.5em; margin: 4px 0; }
      `}</style>
    </div>
  );
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
