import { Link } from "wouter";
import { Plus, Trash2, Check, ImagePlus, X, Search, Download, Upload, BookOpen, FileText } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { store, type Book } from "@/lib/store";

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
    case "dots":
      return { ...base, backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`, backgroundSize: "12px 12px" };
    case "lines":
      return { ...base, backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 11px)` };
    case "grid":
      return { ...base, backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`, backgroundSize: "12px 12px" };
    case "diagonal":
      return { ...base, backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.18) 8px, rgba(255,255,255,0.18) 9px)` };
    case "waves":
      return { ...base, backgroundImage: `repeating-radial-gradient(ellipse at 0% 50%, transparent 0px, transparent 7px, rgba(255,255,255,0.18) 7px, rgba(255,255,255,0.18) 8px)` };
    case "cross":
      return { ...base, backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`, backgroundSize: "24px 24px, 24px 24px, 6px 6px, 6px 6px" };
    case "marble":
      return { ...base, backgroundImage: `repeating-linear-gradient(105deg, transparent, transparent 10px, rgba(255,255,255,0.12) 10px, rgba(255,255,255,0.12) 11px), repeating-linear-gradient(195deg, transparent, transparent 14px, rgba(255,255,255,0.08) 14px, rgba(255,255,255,0.08) 15px)` };
    default:
      return base;
  }
}

function coverStyle(pattern: string, color: string, coverImg?: string): React.CSSProperties {
  if (coverImg) return { backgroundImage: `url(${coverImg})`, backgroundSize: "cover", backgroundPosition: "center" };
  return patternStyle(pattern, color);
}

export default function Home() {
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
  const popupRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    const summary = store.getSummary();
    const allBooks = store.listBooks().map((b) => ({
      ...b,
      pageCount: summary.recentBooks.find((r) => r.id === b.id)?.pageCount ??
        store.listPages(b.id).length,
    }));
    setBooks(allBooks);
    const recent = summary.recentBooks[0];
    setRecentTitle(recent ? { id: recent.id, title: recent.title } : null);
  }, []);

  useEffect(() => {
    store.initDefaults();
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!showCreate) return;
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowCreate(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCreate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewCoverImg(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    store.createBook({ title: newTitle.trim(), color: newColor, pattern: newPattern, coverImg: newCoverImg });
    setShowCreate(false);
    setNewTitle("");
    setNewColor("#3b5bdb");
    setNewPattern("solid");
    setNewCoverImg(undefined);
    refresh();
  };

  const startEditing = (e: React.MouseEvent, book: { id: number; title: string }) => {
    e.preventDefault();
    setEditingId(book.id);
    setEditingTitle(book.title);
    setTimeout(() => { editInputRef.current?.select(); }, 30);
  };

  const saveEditing = () => {
    if (editingId === null) return;
    const trimmed = editingTitle.trim();
    if (trimmed) store.updateBook(editingId, { title: trimmed });
    setEditingId(null);
    refresh();
  };

  const cancelEditing = () => setEditingId(null);

  const handleDelete = (e: React.MouseEvent, bookId: number) => {
    e.preventDefault();
    if (confirm("Delete this notebook and all its pages?")) {
      store.deleteBook(bookId);
      refresh();
    }
  };

  const handleDownload = () => {
    const data = {
      notebooks: store.listBooks(),
      pages: store.listBooks().flatMap((b) => store.listPages(b.id).map((p) => ({ ...p, bookId: b.id }))),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-notebooks-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.notebooks) { alert("Invalid backup file."); return; }
        if (!confirm(`Import ${data.notebooks.length} notebook(s)? Existing data will be kept.`)) return;
        data.notebooks.forEach((nb: Book) => {
          const created = store.createBook({ title: nb.title, color: nb.color, pattern: nb.pattern, coverImg: nb.coverImg });
          const nbPages = (data.pages ?? []).filter((p: { bookId: number }) => p.bookId === nb.id);
          nbPages.forEach((pg: { type: string; content: string }) => {
            store.createPage(created.id, { title: "Imported page", pageType: pg.type as "blank" | "lined" | "spreadsheet", content: pg.content });
          });
        });
        refresh();
        alert("Import successful!");
      } catch { alert("Failed to read file."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const totalPages = books.reduce((sum, b) => sum + b.pageCount, 0);
  const filteredBooks = searchQuery.trim()
    ? books.filter((b) => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : books;

  return (
    <div className="min-h-screen w-full bg-background p-6 md:p-10 max-w-6xl mx-auto">

      {/* Header Card */}
      <div className="mb-10 rounded-2xl border border-stone-200 bg-white shadow-sm px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">

          {/* Left: Title + info */}
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <h1 className="text-3xl font-serif font-bold text-stone-800 leading-tight">My Notebooks</h1>
            <div className="flex items-center gap-2 text-xs text-stone-500 flex-wrap">
              <span className="flex items-center gap-1 bg-stone-100 rounded-full px-2 py-0.5"><BookOpen className="w-3 h-3" />{books.length} notebook{books.length !== 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1 bg-stone-100 rounded-full px-2 py-0.5"><FileText className="w-3 h-3" />{totalPages} page{totalPages !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Right: Search + Download + Upload */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search bar */}
            <div className={`flex items-center gap-2 border rounded-lg bg-stone-50 px-3 py-1.5 transition-all duration-300 ${searchFocused || searchQuery ? "w-72 border-stone-400 bg-white shadow-sm" : "w-52 border-stone-200"}`}>
              <Search className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="bg-transparent text-sm text-stone-700 placeholder:text-stone-400 outline-none w-full min-w-0"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-stone-400 hover:text-stone-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              title="Download backup"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 text-stone-600 text-xs font-medium transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Backup</span>
            </button>

            {/* Upload */}
            <label
              title="Import backup"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-stone-300 text-stone-600 text-xs font-medium transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
        {filteredBooks.map((book) => (
          <Link key={book.id} href={`/books/${book.id}`} className="group flex flex-col gap-3 relative">
            <div
              className="aspect-[3/4] rounded-md shadow-md transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl relative overflow-hidden"
              style={coverStyle((book as any).pattern ?? "solid", book.color || "#1e293b", (book as any).coverImg)}
            >
              {!(book as any).coverImg && <div className="absolute left-4 top-0 bottom-0 w-px bg-black/20" />}
            </div>
            <div className="px-1 flex justify-between items-start group/text">
              <div className="flex-1 min-w-0">
                {editingId === book.id ? (
                  <input
                    ref={editInputRef}
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={saveEditing}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEditing();
                      if (e.key === "Escape") cancelEditing();
                    }}
                    onClick={(e) => e.preventDefault()}
                    className="font-serif font-medium text-sm w-full bg-white border-b-2 border-stone-400 outline-none text-stone-800 px-0 py-0.5"
                    autoFocus
                  />
                ) : (
                  <h3
                    className="font-serif font-medium text-sm line-clamp-2 cursor-text hover:text-stone-500 transition-colors"
                    onClick={(e) => startEditing(e, book)}
                    title="Click to rename"
                  >{book.title}</h3>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{book.pageCount} pages</p>
              </div>
              <button
                onClick={(e) => handleDelete(e, book.id)}
                className="opacity-0 group-hover/text:opacity-100 p-1.5 text-muted-foreground hover:text-destructive transition-all shrink-0"
                title="Delete Notebook"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </Link>
        ))}

        {/* Add New Card */}
        <div className="flex flex-col gap-3 relative" ref={popupRef}>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="aspect-[3/4] rounded-md border-2 border-dashed border-stone-300 bg-[#faf6f0] hover:border-stone-400 hover:bg-[#f5efe6] transition-all flex flex-col items-center justify-center gap-2 group"
          >
            <div className="w-10 h-10 rounded-full bg-stone-200 group-hover:bg-stone-300 transition-colors flex items-center justify-center">
              <Plus className="w-5 h-5 text-stone-500" />
            </div>
            <span className="text-xs text-stone-400 font-medium">New Notebook</span>
          </button>
          <div className="px-1 h-8" />

          {/* Mini Create Popup */}
          {showCreate && (
            <div className="absolute top-0 left-[calc(100%+12px)] z-50 w-72 bg-white rounded-xl shadow-2xl border border-stone-200 p-4 flex flex-col gap-3 max-h-[90vh] overflow-y-auto">
              {/* Preview */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-14 rounded-md shadow flex-shrink-0 relative overflow-hidden"
                  style={coverStyle(newPattern, newColor, newCoverImg)}
                >
                  {!newCoverImg && <div className="absolute left-2 top-0 bottom-0 w-px bg-black/20" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-stone-400 mb-1">Preview</p>
                  <p className="font-serif text-sm font-medium truncate text-stone-700">
                    {newTitle || "Untitled"}
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreate} className="flex flex-col gap-3">
                {/* Title */}
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Title</label>
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Notebook name..."
                    className="mt-1 w-full text-sm border border-stone-200 rounded-lg px-3 py-2 outline-none focus:border-stone-400 bg-stone-50"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Cover Color</label>
                  <div className="mt-1.5 grid grid-cols-6 gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { setNewColor(c); setNewCoverImg(undefined); }}
                        className="w-8 h-8 rounded-md border-2 transition-all flex items-center justify-center"
                        style={{ backgroundColor: c, borderColor: newColor === c && !newCoverImg ? "#000" : "transparent" }}
                      >
                        {newColor === c && !newCoverImg && <Check className="w-3 h-3 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cover Design */}
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Cover Design</label>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                    {COVER_PATTERNS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setNewPattern(p.id); setNewCoverImg(undefined); }}
                        className={`h-9 rounded-md border-2 text-[10px] font-semibold transition-all relative overflow-hidden ${newPattern === p.id && !newCoverImg ? "border-stone-700 ring-1 ring-stone-700" : "border-stone-200"}`}
                        style={patternStyle(p.id, newColor)}
                      >
                        <span className="relative z-10 text-white drop-shadow-sm">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cover Image */}
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Cover Image</label>

                  {/* Default image thumbnails */}
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                    {DEFAULT_COVER_IMAGES.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setNewCoverImg(img.url)}
                        className={`relative h-14 rounded-md overflow-hidden border-2 transition-all ${newCoverImg === img.url ? "border-stone-700 ring-1 ring-stone-700" : "border-transparent hover:border-stone-400"}`}
                      >
                        <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                        {newCoverImg === img.url && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        )}
                        <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[9px] text-center py-0.5 font-medium">{img.label}</div>
                      </button>
                    ))}
                  </div>

                  {/* Upload custom image */}
                  <div className="mt-1.5">
                    {newCoverImg && !DEFAULT_COVER_IMAGES.find(i => i.url === newCoverImg) ? (
                      <div className="relative">
                        <img src={newCoverImg} alt="Cover" className="w-full h-20 object-cover rounded-lg border border-stone-200" />
                        <button
                          type="button"
                          onClick={() => setNewCoverImg(undefined)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Custom image ✓</div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => imgInputRef.current?.click()}
                        className="w-full h-10 border-2 border-dashed border-stone-300 rounded-lg flex items-center justify-center gap-2 hover:border-stone-400 hover:bg-stone-50 transition-all"
                      >
                        <ImagePlus className="w-4 h-4 text-stone-400" />
                        <span className="text-xs text-stone-400">Upload your own image</span>
                      </button>
                    )}
                    <input
                      ref={imgInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="w-full mt-1 bg-stone-800 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Create Notebook
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
