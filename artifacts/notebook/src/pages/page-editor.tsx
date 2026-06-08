import { useParams, useLocation, Redirect } from "wouter";
import { ChevronLeft, ChevronRight, Plus, Trash2, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { store, type Book, type Page } from "@/lib/store";

export default function PageEditor() {
  const { bookId, pageId } = useParams();
  const [, setLocation] = useLocation();
  const bId = parseInt(bookId || "0", 10);
  const pId = parseInt(pageId || "0", 10);

  const [book, setBook] = useState<Book | null>(() => store.getBook(bId) ?? null);
  const [pages, setPages] = useState<Page[]>(() => store.listPages(bId));
  const [page, setPage] = useState<Page | null>(() => store.getPage(bId, pId) ?? null);
  const [content, setContent] = useState(() => store.getPage(bId, pId)?.content ?? "");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");

  const editorRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedContent = useRef(store.getPage(bId, pId)?.content ?? "");
  const isComposingRef = useRef(false);

  const refresh = useCallback(() => {
    setBook(store.getBook(bId) ?? null);
    const ps = store.listPages(bId);
    setPages(ps);
    const pg = store.getPage(bId, pId) ?? null;
    setPage(pg);
    setContent(pg?.content ?? "");
    lastSavedContent.current = pg?.content ?? "";
  }, [bId, pId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (editorRef.current) {
      const pg = store.getPage(bId, pId);
      const html = pg?.content ?? "";
      if (editorRef.current.innerHTML !== html) {
        editorRef.current.innerHTML = html;
      }
    }
  }, [bId, pId]);

  const saveContent = useCallback((html: string) => {
    if (html === lastSavedContent.current) return;
    setSaveStatus("saving");
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      store.updatePage(bId, pId, { content: html });
      lastSavedContent.current = html;
      setSaveStatus("saved");
    }, 600);
  }, [bId, pId]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setContent(html);
    saveContent(html);
  }, [saveContent]);

  const handleCreatePage = () => {
    const newPage = store.createPage(bId, { title: `Page ${pages.length + 1}`, content: "" });
    refresh();
    setLocation(`/books/${bId}/pages/${newPage.id}`);
  };

  const handleDeletePage = () => {
    if (!page) return;
    store.deletePage(bId, pId);
    const remaining = store.listPages(bId);
    if (remaining.length > 0) {
      setLocation(`/books/${bId}/pages/${remaining[0].id}`);
    } else {
      setLocation(`/books/${bId}`);
    }
  };

  const scrollTabs = (dir: "left" | "right") => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
    }
  };

  const currentIndex = pages.findIndex((p) => p.id === pId);
  const prevPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const nextPage = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

  if (!book) return <Redirect to="/" />;
  if (!page) return <Redirect to={`/books/${bId}`} />;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#5a5a5a" }}>

      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-black/20" style={{ background: "#4a4a4a" }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-zinc-500 text-sm">·</span>
          <span className="text-zinc-300 text-sm font-medium">{book.title}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">{saveStatus === "saving" ? "Saving…" : "Saved"}</span>
          <button
            onClick={handleDeletePage}
            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors rounded hover:bg-white/10"
            title="Delete page"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="shrink-0 flex items-stretch border-b border-black/20" style={{ background: "#3a3a3a", minHeight: 36 }}>
        <button
          onClick={() => scrollTabs("left")}
          className="px-2 text-zinc-500 hover:text-zinc-200 transition-colors border-r border-black/20"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div
          ref={tabsRef}
          className="flex items-stretch flex-1 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {pages.map((p, idx) => (
            <button
              key={p.id}
              onClick={() => setLocation(`/books/${bId}/pages/${p.id}`)}
              className={`px-4 text-xs font-semibold uppercase tracking-widest whitespace-nowrap transition-colors border-r border-black/20 ${
                p.id === pId
                  ? "text-white border-b-2 border-b-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              style={{ background: p.id === pId ? "#5a5a5a" : "transparent" }}
            >
              Page {idx + 1}
            </button>
          ))}
        </div>

        <button
          onClick={handleCreatePage}
          className="px-3 text-zinc-500 hover:text-zinc-200 transition-colors border-l border-black/20 flex items-center gap-1 text-xs font-semibold"
          title="New page"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* A4 paper area */}
      <div
        className="flex-1 overflow-y-auto overflow-x-auto flex justify-center py-10 px-6"
        style={{ background: "#5a5a5a" }}
      >
        <div
          className="relative bg-white shadow-2xl flex-shrink-0"
          style={{
            width: 794,
            minHeight: 1123,
            padding: "96px 96px 96px 96px",
          }}
        >
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            onInput={handleInput}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
              handleInput();
            }}
            className="outline-none w-full min-h-full text-zinc-800"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 15,
              lineHeight: "1.9",
              minHeight: 931,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
            data-placeholder="Start writing..."
          />
        </div>
      </div>

      {/* Bottom nav */}
      <div
        className="shrink-0 flex items-center justify-between px-6 py-2 border-t border-black/20 text-xs text-zinc-400"
        style={{ background: "#4a4a4a" }}
      >
        <button
          onClick={() => prevPage && setLocation(`/books/${bId}/pages/${prevPage.id}`)}
          disabled={!prevPage}
          className="disabled:opacity-30 hover:text-zinc-200 transition-colors flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Previous
        </button>
        <span className="text-zinc-500">
          Page {currentIndex + 1} of {pages.length}
        </span>
        <button
          onClick={() => nextPage && setLocation(`/books/${bId}/pages/${nextPage.id}`)}
          disabled={!nextPage}
          className="disabled:opacity-30 hover:text-zinc-200 transition-colors flex items-center gap-1"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
