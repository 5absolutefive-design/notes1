import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, ImagePlus, FolderKanban, X,
  Bold, Italic, Underline, Strikethrough, Highlighter,
  Table, CheckSquare, Minus, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered,
  ChevronRight,
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
  highlightOpen: boolean;
  headingOpen: boolean;
}

// ── Props ────────────────────────────────────────────────────────
interface ProjectViewProps {
  projects: ProjectDoc[];
  setProjects: React.Dispatch<React.SetStateAction<ProjectDoc[]>>;
  activeId: number | null;
  setActiveId: (id: number | null) => void;
  onNewProject: () => void;
}

// ── Main component ───────────────────────────────────────────────
export default function ProjectView({ projects, setProjects, activeId, setActiveId, onNewProject }: ProjectViewProps) {
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const ctxMenuRef = useRef<HTMLDivElement>(null);
  const bannerPickerRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const bannerUploadRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeProject = projects.find(p => p.id === activeId) ?? null;

  // ── Load content into editor when switching projects
  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = activeProject?.content || "";
  }, [activeId]);

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

  // ── Right-click handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const x = Math.min(e.clientX, window.innerWidth - 228);
    const y = Math.min(e.clientY, window.innerHeight - 380);
    setCtxMenu({ x, y, highlightOpen: false, headingOpen: false });
  };

  // ── Formatting commands
  const execFmt = (cmd: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    setCtxMenu(null);
    debouncedSave();
  };

  const insertHTML = (html: string) => {
    editorRef.current?.focus();
    document.execCommand("insertHTML", false, html);
    setCtxMenu(null);
    debouncedSave();
  };

  const insertTable = () => insertHTML(`
    <br/>
    <table style="border-collapse:collapse;width:100%;margin:8px 0">
      <tr>
        <th style="border:1px solid #d1d5db;padding:8px 12px;background:#f9fafb;font-weight:600;text-align:left">Header 1</th>
        <th style="border:1px solid #d1d5db;padding:8px 12px;background:#f9fafb;font-weight:600;text-align:left">Header 2</th>
        <th style="border:1px solid #d1d5db;padding:8px 12px;background:#f9fafb;font-weight:600;text-align:left">Header 3</th>
      </tr>
      <tr>
        <td style="border:1px solid #d1d5db;padding:8px 12px">Cell</td>
        <td style="border:1px solid #d1d5db;padding:8px 12px">Cell</td>
        <td style="border:1px solid #d1d5db;padding:8px 12px">Cell</td>
      </tr>
      <tr>
        <td style="border:1px solid #d1d5db;padding:8px 12px">Cell</td>
        <td style="border:1px solid #d1d5db;padding:8px 12px">Cell</td>
        <td style="border:1px solid #d1d5db;padding:8px 12px">Cell</td>
      </tr>
    </table><br/>`);

  const insertTodo = () => insertHTML(
    `<div style="display:flex;align-items:flex-start;gap:8px;margin:6px 0;padding:4px 0">` +
    `<span onclick="this.style.background=this.style.background?'':'#22c55e';this.style.borderColor=this.style.borderColor==='#22c55e'?'#9ca3af':'#22c55e';this.innerHTML=this.innerHTML?'':'✓';this.style.color='white'" ` +
    `style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border:2px solid #9ca3af;border-radius:4px;cursor:pointer;flex-shrink:0;margin-top:2px;font-size:11px;font-weight:700;user-select:none;transition:all 0.15s"></span>` +
    `<span contenteditable="true" style="outline:none;flex:1">Task item</span></div><br/>`
  );

  const insertDivider = () => insertHTML(`<br/><hr style="border:none;border-top:2px solid #e7e5e4;margin:12px 0"/><br/>`);

  const insertBorderBlock = () => insertHTML(
    `<div style="border-left:4px solid #6366f1;background:#f5f3ff;padding:12px 16px;border-radius:0 8px 8px 0;margin:8px 0">` +
    `<p style="margin:0;color:#4c1d95;font-style:italic">Type your note here…</p></div><br/>`
  );

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
        <div className="flex-1 overflow-y-auto min-h-0">
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
                className="w-[100px] h-[80px] rounded-lg bg-white shadow-lg border border-stone-100 flex items-center justify-center text-4xl hover:scale-105 transition-transform"
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
          <div className="px-12 pt-12 pb-2">
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateDocTitle(activeProject.id, e.currentTarget.textContent?.trim() || "Untitled")}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); editorRef.current?.focus(); } }}
              className="text-4xl font-bold text-stone-900 outline-none w-full"
              style={{ fontFamily: "Georgia, serif", lineHeight: 1.2 }}
            >
              {activeProject.title}
            </div>
          </div>

          {/* Content editor */}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={debouncedSave}
            onKeyDown={handleEditorKeyDown}
            onContextMenu={handleContextMenu}
            className="outline-none text-stone-800 text-[15px] leading-relaxed"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              caretColor: "#6366f1",
              padding: "16px 48px 80px",
              minHeight: "600px",
            }}
            data-placeholder="Start writing your project notes…"
          />
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
          <CtxSection label="Format" />
          <CtxItem icon={<Bold className="w-3.5 h-3.5"/>}          label="Bold"          shortcut="Ctrl+B" onClick={() => execFmt("bold")} />
          <CtxItem icon={<Italic className="w-3.5 h-3.5"/>}        label="Italic"        shortcut="Ctrl+I" onClick={() => execFmt("italic")} />
          <CtxItem icon={<Underline className="w-3.5 h-3.5"/>}     label="Underline"     shortcut="Ctrl+U" onClick={() => execFmt("underline")} />
          <CtxItem icon={<Strikethrough className="w-3.5 h-3.5"/>} label="Strikethrough" onClick={() => execFmt("strikeThrough")} />

          {/* Highlight submenu */}
          <div className="relative">
            <CtxItem icon={<Highlighter className="w-3.5 h-3.5"/>} label="Highlight" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, highlightOpen: !m.highlightOpen, headingOpen: false } : null)} />
            {ctxMenu.highlightOpen && (
              <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 p-2.5 flex gap-1.5 z-[10000]">
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

          {/* Heading submenu */}
          <div className="relative">
            <CtxItem icon={<Heading1 className="w-3.5 h-3.5"/>} label="Heading" hasArrow
              onClick={() => setCtxMenu(m => m ? { ...m, headingOpen: !m.headingOpen, highlightOpen: false } : null)} />
            {ctxMenu.headingOpen && (
              <div className="absolute left-full top-0 ml-1 bg-white rounded-xl shadow-2xl border border-stone-200 py-1.5 z-[10000] min-w-[130px]">
                <CtxItem icon={<Heading1 className="w-3.5 h-3.5"/>} label="Heading 1" onClick={() => execFmt("formatBlock", "h1")} />
                <CtxItem icon={<Heading2 className="w-3.5 h-3.5"/>} label="Heading 2" onClick={() => execFmt("formatBlock", "h2")} />
                <CtxItem icon={<Heading3 className="w-3.5 h-3.5"/>} label="Heading 3" onClick={() => execFmt("formatBlock", "h3")} />
                <CtxItem icon={<AlignLeft className="w-3.5 h-3.5"/>} label="Paragraph" onClick={() => execFmt("formatBlock", "p")} />
              </div>
            )}
          </div>

          <div className="my-1 border-t border-stone-100" />
          <CtxSection label="Align" />
          <CtxItem icon={<AlignLeft className="w-3.5 h-3.5"/>}   label="Align Left"   onClick={() => execFmt("justifyLeft")} />
          <CtxItem icon={<AlignCenter className="w-3.5 h-3.5"/>} label="Align Center" onClick={() => execFmt("justifyCenter")} />
          <CtxItem icon={<AlignRight className="w-3.5 h-3.5"/>}  label="Align Right"  onClick={() => execFmt("justifyRight")} />

          <div className="my-1 border-t border-stone-100" />
          <CtxSection label="Insert" />
          <CtxItem icon={<Table className="w-3.5 h-3.5"/>}        label="Table"         onClick={insertTable} />
          <CtxItem icon={<CheckSquare className="w-3.5 h-3.5"/>}  label="To-Do Item"    onClick={insertTodo} />
          <CtxItem icon={<List className="w-3.5 h-3.5"/>}         label="Bullet List"   onClick={() => execFmt("insertUnorderedList")} />
          <CtxItem icon={<ListOrdered className="w-3.5 h-3.5"/>}  label="Numbered List" onClick={() => execFmt("insertOrderedList")} />
          <CtxItem icon={<Minus className="w-3.5 h-3.5"/>}        label="Divider Line"  onClick={insertDivider} />
          <CtxItem icon={<ChevronRight className="w-3.5 h-3.5"/>} label="Quote Block"   onClick={insertBorderBlock} />
        </div>
      )}

      {/* Editor styles */}
      <style>{`
        [data-placeholder]:empty:before { content: attr(data-placeholder); color: #c0bdb8; pointer-events: none; }
        [contenteditable] h1 { font-size: 2em; font-weight: 700; margin: 0.5em 0 0.25em; line-height: 1.2; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: 700; margin: 0.5em 0 0.25em; line-height: 1.3; }
        [contenteditable] h3 { font-size: 1.2em; font-weight: 600; margin: 0.4em 0 0.2em; line-height: 1.4; }
        [contenteditable] ul { list-style-type: disc; padding-left: 1.5em; margin: 4px 0; }
        [contenteditable] ol { list-style-type: decimal; padding-left: 1.5em; margin: 4px 0; }
        [contenteditable] table { border-collapse: collapse; }
        [contenteditable] td, [contenteditable] th { border: 1px solid #d1d5db; padding: 6px 10px; min-width: 80px; }
        [contenteditable] th { background: #f9fafb; font-weight: 600; }
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
