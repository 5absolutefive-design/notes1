import { Link } from "wouter";
import { Plus, Trash2, Check } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { store, type Book } from "@/lib/store";

const PRESET_COLORS = [
  "#3b5bdb", "#1971c2", "#0ca678", "#2f9e44",
  "#e8590c", "#c2255c", "#9c36b5", "#1e293b",
  "#7c3aed", "#b45309", "#374151", "#be123c",
];

const COVER_PATTERNS = [
  { id: "solid", label: "Solid" },
  { id: "dots", label: "Dots" },
  { id: "lines", label: "Lines" },
  { id: "grid", label: "Grid" },
];

function patternStyle(pattern: string, color: string): React.CSSProperties {
  const base: React.CSSProperties = { backgroundColor: color };
  if (pattern === "dots") {
    return {
      ...base,
      backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)`,
      backgroundSize: "12px 12px",
    };
  }
  if (pattern === "lines") {
    return {
      ...base,
      backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 11px)`,
    };
  }
  if (pattern === "grid") {
    return {
      ...base,
      backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
      backgroundSize: "12px 12px",
    };
  }
  return base;
}

export default function Home() {
  const [books, setBooks] = useState<(Book & { pageCount: number })[]>([]);
  const [recentTitle, setRecentTitle] = useState<{ id: number; title: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState("#3b5bdb");
  const [newPattern, setNewPattern] = useState("solid");
  const popupRef = useRef<HTMLDivElement>(null);

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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    store.createBook({ title: newTitle.trim(), color: newColor, pattern: newPattern });
    setShowCreate(false);
    setNewTitle("");
    setNewColor("#3b5bdb");
    setNewPattern("solid");
    refresh();
  };

  const handleDelete = (e: React.MouseEvent, bookId: number) => {
    e.preventDefault();
    if (confirm("Delete this notebook and all its pages?")) {
      store.deleteBook(bookId);
      refresh();
    }
  };

  return (
    <div className="min-h-screen w-full bg-background p-6 md:p-12 max-w-6xl mx-auto">
      <header className="mb-12 flex flex-col gap-2">
        <h1 className="text-4xl font-serif font-bold text-foreground">My Notebooks</h1>
        {recentTitle && (
          <p className="text-muted-foreground text-sm">
            Recent edit:{" "}
            <Link href={`/books/${recentTitle.id}`} className="hover:text-primary transition-colors underline underline-offset-2">
              {recentTitle.title}
            </Link>
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
        {books.map((book) => (
          <Link key={book.id} href={`/books/${book.id}`} className="group flex flex-col gap-3 relative">
            <div
              className="aspect-[3/4] rounded-md shadow-md transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl relative overflow-hidden"
              style={patternStyle((book as any).pattern ?? "solid", book.color || "#1e293b")}
            >
              <div className="absolute left-4 top-0 bottom-0 w-px bg-black/20 shadow-[1px_0_2px_rgba(255,255,255,0.1)]" />
            </div>
            <div className="px-1 flex justify-between items-start group/text">
              <div className="flex-1">
                <h3 className="font-serif font-medium text-sm line-clamp-2">{book.title}</h3>
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
            <div className="absolute top-0 left-[calc(100%+12px)] z-50 w-64 bg-white rounded-xl shadow-2xl border border-stone-200 p-4 flex flex-col gap-3">
              {/* Preview */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-14 rounded-md shadow flex-shrink-0 relative overflow-hidden"
                  style={patternStyle(newPattern, newColor)}
                >
                  <div className="absolute left-2 top-0 bottom-0 w-px bg-black/20" />
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
                        onClick={() => setNewColor(c)}
                        className="w-7 h-7 rounded-md border-2 transition-all flex items-center justify-center"
                        style={{
                          backgroundColor: c,
                          borderColor: newColor === c ? "#000" : "transparent",
                        }}
                      >
                        {newColor === c && <Check className="w-3 h-3 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pattern */}
                <div>
                  <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Cover Design</label>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                    {COVER_PATTERNS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setNewPattern(p.id)}
                        className={`h-8 rounded-md border-2 text-[10px] font-semibold transition-all relative overflow-hidden ${newPattern === p.id ? "border-stone-700" : "border-stone-200"}`}
                        style={patternStyle(p.id, newColor)}
                      >
                        <span className="relative z-10 text-white drop-shadow-sm">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="w-full mt-1 bg-stone-800 text-white text-sm font-semibold py-2 rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
