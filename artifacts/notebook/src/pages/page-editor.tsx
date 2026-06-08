import { useParams, useLocation, Redirect } from "wouter";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { store, type Book, type Page } from "@/lib/store";

function A4Page({
  page,
  index,
  bookId,
  onDelete,
  onContentChange,
  isSaving,
}: {
  page: Page;
  index: number;
  bookId: number;
  onDelete: (pageId: number) => void;
  onContentChange: (pageId: number, html: string) => void;
  isSaving: boolean;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef(page.content);
  const isComposing = useRef(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== page.content) {
      editorRef.current.innerHTML = page.content;
      lastSaved.current = page.content;
    }
  }, [page.id]);

  const handleInput = useCallback(() => {
    if (!editorRef.current || isComposing.current) return;
    const html = editorRef.current.innerHTML;
    if (html === lastSaved.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      store.updatePage(bookId, page.id, { content: html });
      lastSaved.current = html;
      onContentChange(page.id, html);
    }, 600);
  }, [bookId, page.id, onContentChange]);

  return (
    <div className="relative flex-shrink-0 group/page" style={{ width: 794 }}>
      {/* Page number label */}
      <div className="absolute -left-14 top-6 text-zinc-500 text-xs font-medium select-none text-right w-10">
        {index + 1}
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(page.id)}
        className="absolute -right-10 top-6 opacity-0 group-hover/page:opacity-100 transition-opacity p-1.5 text-zinc-500 hover:text-red-400 rounded"
        title="Delete page"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* A4 paper */}
      <div
        className="bg-white shadow-xl"
        style={{ minHeight: 1123, padding: "96px 8px 96px 8px" }}
      >
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onInput={handleInput}
          onCompositionStart={() => { isComposing.current = true; }}
          onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
          className="outline-none w-full text-zinc-800 a4-editor"
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
  );
}

export default function PageEditor() {
  const { bookId, pageId } = useParams();
  const [, setLocation] = useLocation();
  const bId = parseInt(bookId || "0", 10);
  const pId = parseInt(pageId || "0", 10);

  const [book, setBook] = useState<Book | null>(() => store.getBook(bId) ?? null);
  const [pages, setPages] = useState<Page[]>(() => store.listPages(bId));
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const savingCountRef = useRef(0);

  const refresh = useCallback(() => {
    setBook(store.getBook(bId) ?? null);
    setPages(store.listPages(bId));
  }, [bId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
    const newPage = store.createPage(bId, { title: `Page ${pages.length + 1}`, content: "" });
    setPages(store.listPages(bId));
    // Scroll to bottom after render
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 50);
  };

  if (!book) return <Redirect to="/" />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#5a5a5a" }}>

      {/* Top bar */}
      <div
        className="sticky top-0 z-10 shrink-0 flex items-center justify-between px-4 py-2 border-b border-black/20"
        style={{ background: "#4a4a4a" }}
      >
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
          <span className="text-xs text-zinc-500">
            {saveStatus === "saving" ? "Saving…" : "Saved"}
          </span>
          <span className="text-xs text-zinc-600">
            {pages.length} {pages.length === 1 ? "page" : "pages"}
          </span>
        </div>
      </div>

      {/* All pages stacked */}
      <div className="flex-1 flex flex-col items-center py-10 px-20 gap-8">
        {pages.map((page, idx) => (
          <A4Page
            key={page.id}
            page={page}
            index={idx}
            bookId={bId}
            onDelete={handleDelete}
            onContentChange={handleContentChange}
            isSaving={saveStatus === "saving"}
          />
        ))}

        {/* Add new page button */}
        <div style={{ width: 794 }} className="flex-shrink-0 pb-10">
          <button
            onClick={handleAddPage}
            className="w-full flex items-center justify-center gap-2 py-5 border-2 border-dashed border-zinc-500 hover:border-zinc-300 text-zinc-500 hover:text-zinc-300 transition-all rounded text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Page
          </button>
        </div>
      </div>

    </div>
  );
}
