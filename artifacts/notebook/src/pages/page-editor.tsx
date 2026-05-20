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
} from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
        setLocation(`/books/${bId}`);
      },
    },
  });

  const handleDelete = () => {
    if (confirm("Delete this page?")) {
      deletePage.mutate({ bookId: bId, pageId: pId });
    }
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
        <div className="bg-[#f5f2ee] border border-zinc-300 rounded-xl px-5 py-4 shadow-sm min-h-[56px]">
          <div className="text-sm font-semibold text-zinc-700">EDIT</div>
        </div>
      </div>

      {/* Dark top bar */}
      <div className="bg-[#1a1a1a] text-white flex items-stretch shrink-0" style={{ minHeight: 44 }}>
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

      {/* Sub-header */}
      <div className="bg-[#f0ede8] border-b border-zinc-300 px-4 py-1 flex items-center justify-between shrink-0">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          Page: <span className="text-zinc-700">PAGE {page.pageNumber}</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">
            {updatePage.isPending ? "Saving..." : "Saved"}
          </span>
          <button
            onClick={handleDelete}
            disabled={deletePage.isPending}
            className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
            data-testid="btn-delete-page"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Paper area — scrollable */}
      <div className="flex-1 overflow-y-auto bg-white" style={{ scrollbarWidth: "thin" }}>
        <div className="flex" style={{ minHeight: PAPER_HEIGHT }}>
          {/* Row numbers */}
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

          {/* Textarea overlaid on lined background */}
          <div
            className="flex-1 relative"
            style={{ minHeight: PAPER_HEIGHT }}
          >
            {/* Horizontal ruled lines */}
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

      {/* Bottom nav */}
      <div className="bg-[#f0ede8] border-t border-zinc-300 px-4 py-1 flex items-center justify-between text-xs text-zinc-500 shrink-0">
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
  );
}
