import {
  useGetPage,
  getGetPageQueryKey,
  useUpdatePage,
  getGetBookQueryKey,
  useGetBook,
  useListPages,
  getListPagesQueryKey,
  useDeletePage,
  useCreatePage,
  useListTrashedPages,
  getListTrashedPagesQueryKey,
  useRestorePage,
  usePermanentDeletePage,
} from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Trash2, ArchiveRestore, X, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

const TOTAL_LINES = 1000;
const LINE_HEIGHT = 28;
const PAPER_HEIGHT = TOTAL_LINES * LINE_HEIGHT;

export default function PageEditor() {
  const { bookId, pageId } = useParams();
  const [, setLocation] = useLocation();
  const bId = parseInt(bookId || "0", 10);
  const pId = parseInt(pageId || "0", 10);

  const { data: book } = useGetBook(bId, { query: { enabled: !!bId, queryKey: getGetBookQueryKey(bId) } });
  const { data: pages } = useListPages(bId, { query: { enabled: !!bId, queryKey: getListPagesQueryKey(bId) } });
  const { data: page, isLoading } = useGetPage(bId, pId, {
    query: { enabled: !!(bId && pId), queryKey: getGetPageQueryKey(bId, pId) },
  });

  const [content, setContent] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const initializedForId = useRef<number | null>(null);
  const lastSavedContent = useRef("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const updatePage = useUpdatePage();
  const mutateFnRef = useRef(updatePage.mutate);
  mutateFnRef.current = updatePage.mutate;

  const createPage = useCreatePage({
    mutation: {
      onSuccess: (newPage) => {
        queryClient.invalidateQueries({ queryKey: getListPagesQueryKey(bId) });
        setLocation(`/books/${bId}/pages/${newPage.id}`);
      },
    },
  });

  const deletePage = useDeletePage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPagesQueryKey(bId) });
        queryClient.invalidateQueries({ queryKey: getListTrashedPagesQueryKey(bId) });
        setLocation(`/books/${bId}`);
      },
    },
  });

  const { data: trashedPages } = useListTrashedPages(bId, {
    query: { enabled: !!bId && showTrash, queryKey: getListTrashedPagesQueryKey(bId) },
  });

  const restorePage = useRestorePage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPagesQueryKey(bId) });
        queryClient.invalidateQueries({ queryKey: getListTrashedPagesQueryKey(bId) });
      },
    },
  });

  const permanentDeletePage = usePermanentDeletePage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTrashedPagesQueryKey(bId) });
      },
    },
  });

  const handleDelete = () => {
    deletePage.mutate({ bookId: bId, pageId: pId });
  };

  const handleCreatePage = () => {
    const pageCount = pages?.length ?? 0;
    createPage.mutate({
      bookId: bId,
      data: { title: `PAGE ${pageCount + 1}`, content: "" },
    });
  };

  const savePage = useCallback(
    (text: string, title?: string) => {
      const resolvedTitle = title ?? pageTitle ?? page?.title ?? `PAGE ${page?.pageNumber ?? 1}`;
      mutateFnRef.current(
        { bookId: bId, pageId: pId, data: { title: resolvedTitle, content: text } },
        {
          onSuccess: (updatedPage) => {
            queryClient.setQueryData(getGetPageQueryKey(bId, pId), updatedPage);
            queryClient.invalidateQueries({ queryKey: getListPagesQueryKey(bId) });
          },
        }
      );
    },
    [bId, pId, queryClient, page, pageTitle]
  );

  useEffect(() => {
    if (page && initializedForId.current !== pId) {
      initializedForId.current = pId;
      setContent(page.content);
      setPageTitle(page.title);
      lastSavedContent.current = page.content;
    }
  }, [page, pId]);

  const handleTitleSave = () => {
    setEditingTitle(false);
    if (pageTitle.trim()) {
      savePage(content, pageTitle.trim());
      lastSavedContent.current = content;
    }
  };

  useEffect(() => {
    if (initializedForId.current !== pId) return;
    const timer = setTimeout(() => {
      if (content !== lastSavedContent.current) {
        savePage(content);
        lastSavedContent.current = content;
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, pId, savePage]);

  const scrollTabs = (dir: "left" | "right") => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
    }
  };

  const currentIndex = pages?.findIndex((p) => p.id === pId) ?? 0;
  const prevPage = pages?.[currentIndex - 1];
  const nextPage = pages?.[currentIndex + 1];

  if (isLoading)
    return <div className="h-screen bg-white flex items-center justify-center text-zinc-400">Loading...</div>;
  if (!page)
    return <div className="h-screen bg-white flex items-center justify-center text-zinc-400">Page not found</div>;

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* EDIT card — full width, above dark bar */}
      <div className="bg-[#ece9e3] px-4 pt-3 pb-2 shrink-0">
        <div className="bg-[#f5f2ee] border border-zinc-300 rounded-xl px-3 py-3 shadow-sm flex items-start justify-between">
          {/* 3 button groups, each in its own rounded border box */}
          <div className="inline-flex items-start gap-2">

            {/* Group 1 — 2×2 grid, in a rounded box */}
            <div className="border border-zinc-400 rounded-lg p-1.5">
              <div className="grid grid-cols-2 gap-1">
                {[0,1,2,3].map(i => (
                  <button key={i} className="w-8 h-8 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors" />
                ))}
              </div>
            </div>

            {/* Group 2 — 2 rows, in a rounded box */}
            <div className="border border-zinc-400 rounded-lg p-1.5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <button className="w-36 h-8 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors" />
                  {[0,1,2].map(i => (
                    <button key={i} className="w-8 h-8 shrink-0 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors" />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {[0,1,2].map(i => (
                    <button key={i} className="w-8 h-8 shrink-0 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors" />
                  ))}
                  <button className="w-36 h-8 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors" />
                </div>
              </div>
            </div>

            {/* Group 3 — 2×2 grid, in a rounded box */}
            <div className="border border-zinc-400 rounded-lg p-1.5">
              <div className="grid grid-cols-2 gap-1">
                {[0,1,2,3].map(i => (
                  <button key={i} className="w-8 h-8 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors" />
                ))}
              </div>
            </div>

          </div>

          {/* Right side — Delete + Trash buttons in a bordered box */}
          <div className="border border-zinc-400 rounded-lg p-1.5 shrink-0">
            <div className="flex flex-col gap-1">
              <button
                onClick={handleDelete}
                disabled={deletePage.isPending}
                title="Move to trash"
                className="w-8 h-8 rounded-md border border-zinc-300 bg-white hover:bg-red-50 hover:border-red-400 active:bg-red-100 transition-colors flex items-center justify-center disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4 text-zinc-500 hover:text-red-500" />
              </button>
              <button
                onClick={() => setShowTrash(true)}
                title="Open trash"
                className="w-8 h-8 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors flex items-center justify-center"
              >
                <ArchiveRestore className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trash panel overlay */}
      {showTrash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-[#f5f2ee]">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-bold uppercase tracking-widest text-zinc-700">Trash</span>
              </div>
              <button
                onClick={() => setShowTrash(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-zinc-200 transition-colors"
              >
                <X className="w-4 h-4 text-zinc-500" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
              {!trashedPages || trashedPages.length === 0 ? (
                <div className="px-5 py-8 text-center text-zinc-400 text-sm italic">Trash is empty</div>
              ) : (
                trashedPages.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50">
                    <span className="text-sm text-zinc-700 font-medium">{p.title}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => restorePage.mutate({ bookId: bId, pageId: p.id })}
                        disabled={restorePage.isPending}
                        title="Restore page"
                        className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-600 border border-zinc-300 rounded-md hover:bg-green-50 hover:border-green-400 hover:text-green-700 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" /> Restore
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Permanently delete this page? This cannot be undone.")) {
                            permanentDeletePage.mutate({ bookId: bId, pageId: p.id });
                          }
                        }}
                        disabled={permanentDeletePage.isPending}
                        title="Permanently delete"
                        className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-600 border border-zinc-300 rounded-md hover:bg-red-50 hover:border-red-400 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Card 2 — Tab bar (rounded, dark) */}
      <div className="bg-[#ece9e3] px-4 pt-0 pb-2 shrink-0">
        <div className="overflow-hidden rounded-xl border border-zinc-700 shadow-sm">
          <div className="bg-[#1a1a1a] text-white flex items-stretch" style={{ minHeight: 44 }}>
            <button
              onClick={() => setLocation("/")}
              className="px-3 flex items-center text-zinc-400 hover:text-white transition-colors border-r border-zinc-700"
              data-testid="btn-back-home"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollTabs("left")}
              className="px-2 flex items-center text-zinc-400 hover:text-white transition-colors"
              data-testid="btn-scroll-left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div
              ref={tabsRef}
              className="flex items-stretch overflow-x-auto flex-1"
              style={{ scrollbarWidth: "none" }}
            >
              {pages?.map((p, index) => (
                <button
                  key={p.id}
                  onClick={() => setLocation(`/books/${bId}/pages/${p.id}`)}
                  data-testid={`tab-page-${p.id}`}
                  className={`px-5 py-2 text-sm font-semibold uppercase tracking-widest whitespace-nowrap transition-colors border-r border-zinc-700 ${
                    p.id === pId
                      ? "bg-[#2a2a2a] text-white border-b-2 border-b-white"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  PAGE {index + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => scrollTabs("right")}
              className="px-2 flex items-center text-zinc-400 hover:text-white transition-colors border-l border-zinc-700"
              data-testid="btn-scroll-right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleCreatePage}
              disabled={createPage.isPending}
              className="px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors border-l border-zinc-700 whitespace-nowrap uppercase tracking-wider"
              data-testid="btn-new-page"
            >
              + NEW PAGE
            </button>
          </div>
        </div>
      </div>

      {/* Card 3 — Sub-header + Paper + Bottom nav (one big rounded card) */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#ece9e3] px-4 pb-4">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-xl border border-zinc-300 shadow-sm bg-white">
          {/* Sub-header inside card */}
          <div className="bg-[#f5f2ee] border-b border-zinc-200 px-4 py-1 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Page: <span className="text-zinc-700">PAGE {page.pageNumber}</span>
            </span>
            <span className="text-xs text-zinc-400">
              {updatePage.isPending ? "Saving..." : "Saved"}
            </span>
          </div>

          {/* Paper area */}
          <div className="flex-1 overflow-y-auto bg-white" style={{ scrollbarWidth: "thin" }}>
            <div className="flex" style={{ minHeight: PAPER_HEIGHT }}>
              <div
                className="shrink-0 bg-[#f9f7f4] border-r border-zinc-200 select-none"
                style={{ width: 40 }}
              >
                {Array.from({ length: TOTAL_LINES }).map((_, i) => (
                  <div
                    key={i}
                    className="text-zinc-400 font-mono flex items-center justify-end pr-2 cursor-text"
                    style={{ height: LINE_HEIGHT, fontSize: 11 }}
                    onClick={() => textareaRef.current?.focus()}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="flex-1 relative" style={{ minHeight: PAPER_HEIGHT }}>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      to bottom,
                      transparent 0px,
                      transparent ${LINE_HEIGHT - 1}px,
                      #e2e2e2 ${LINE_HEIGHT - 1}px,
                      #e2e2e2 ${LINE_HEIGHT}px
                    )`,
                  }}
                />
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="absolute inset-0 w-full h-full resize-none bg-transparent border-none outline-none focus:ring-0 px-3 text-zinc-800 font-mono"
                  style={{
                    fontSize: 14,
                    lineHeight: `${LINE_HEIGHT}px`,
                    minHeight: PAPER_HEIGHT,
                    paddingTop: 0,
                    caretColor: "#333",
                  }}
                  placeholder="Start writing..."
                  spellCheck={false}
                  data-testid="textarea-page-content"
                />
              </div>
            </div>
          </div>

          {/* Bottom nav inside card */}
          <div className="bg-[#f5f2ee] border-t border-zinc-200 px-4 py-1 flex items-center justify-between text-xs text-zinc-500 shrink-0">
            <button
              onClick={() => prevPage && setLocation(`/books/${bId}/pages/${prevPage.id}`)}
              disabled={!prevPage}
              className="disabled:opacity-30 hover:text-zinc-700 transition-colors flex items-center gap-1"
              data-testid="btn-prev-page"
            >
              <ChevronLeft className="w-3 h-3" /> Prev
            </button>
            <span className="font-medium">{book?.title}</span>
            <button
              onClick={() => nextPage && setLocation(`/books/${bId}/pages/${nextPage.id}`)}
              disabled={!nextPage}
              className="disabled:opacity-30 hover:text-zinc-700 transition-colors flex items-center gap-1"
              data-testid="btn-next-page"
            >
              Next <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
