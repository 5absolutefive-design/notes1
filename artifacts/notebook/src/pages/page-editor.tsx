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
  const initializedForId = useRef<number | null>(null);
  const lastSaved = useRef({ title: "", content: "" });
  const tabsRef = useRef<HTMLDivElement>(null);

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
    (data: { title: string; content: string }) => {
      mutateFnRef.current(
        { bookId: bId, pageId: pId, data },
        {
          onSuccess: (updatedPage) => {
            queryClient.setQueryData(getGetPageQueryKey(bId, pId), updatedPage);
            queryClient.invalidateQueries({ queryKey: getListPagesQueryKey(bId) });
          },
        }
      );
    },
    [bId, pId, queryClient]
  );

  useEffect(() => {
    if (page && initializedForId.current !== pId) {
      initializedForId.current = pId;
      setContent(page.content);
      lastSaved.current = { title: page.title, content: page.content };
    }
  }, [page, pId]);

  useEffect(() => {
    if (initializedForId.current !== pId) return;
    const timer = setTimeout(() => {
      if (content !== lastSaved.current.content) {
        const title = page?.title ?? `PAGE ${page?.pageNumber ?? 1}`;
        savePage({ title, content });
        lastSaved.current = { title, content };
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [content, pId, savePage, page]);

  const currentIndex = pages?.findIndex((p) => p.id === pId) ?? 0;
  const prevPage = pages?.[currentIndex - 1];
  const nextPage = pages?.[currentIndex + 1];

  const scrollTabs = (dir: "left" | "right") => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
    }
  };

  if (isLoading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!page) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Page not found</div>;

  const currentPageLabel = `PAGE ${page.pageNumber}`;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Dark top bar with tabs */}
      <div className="bg-[#1a1a1a] text-white flex items-stretch shrink-0" style={{ minHeight: 44 }}>
        {/* Back arrow */}
        <button
          onClick={() => setLocation("/")}
          className="px-3 flex items-center text-zinc-400 hover:text-white transition-colors border-r border-zinc-700"
          title="Back to home"
          data-testid="btn-back-home"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Scroll left */}
        <button
          onClick={() => scrollTabs("left")}
          className="px-2 flex items-center text-zinc-400 hover:text-white transition-colors"
          data-testid="btn-scroll-left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page tabs — scrollable */}
        <div
          ref={tabsRef}
          className="flex items-stretch overflow-x-auto scrollbar-none flex-1"
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

        {/* Scroll right */}
        <button
          onClick={() => scrollTabs("right")}
          className="px-2 flex items-center text-zinc-400 hover:text-white transition-colors border-l border-zinc-700"
          data-testid="btn-scroll-right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* New Page */}
        <button
          onClick={handleCreatePage}
          disabled={createPage.isPending}
          className="px-4 py-2 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors border-l border-zinc-700 whitespace-nowrap uppercase tracking-wider"
          data-testid="btn-new-page"
        >
          + NEW PAGE
        </button>
      </div>

      {/* Sub-header: page label + save status */}
      <div className="bg-[#f0ede8] border-b border-zinc-300 px-4 py-1 flex items-center justify-between shrink-0">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          Page: <span className="text-zinc-700">{currentPageLabel}</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">
            {updatePage.isPending ? "Saving..." : "Saved"}
          </span>
          <button
            onClick={handleDelete}
            disabled={deletePage.isPending}
            className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
            title="Delete this page"
            data-testid="btn-delete-page"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Lined paper — full width, no card */}
      <div className="flex-1 overflow-y-auto bg-white" style={{ scrollbarWidth: "thin" }}>
        <div className="flex h-full min-h-full">
          {/* Row numbers column */}
          <div
            className="shrink-0 bg-[#f9f7f4] border-r border-zinc-200 text-right pr-2 select-none"
            style={{ width: 40, paddingTop: 1 }}
          >
            {Array.from({ length: 200 }).map((_, i) => (
              <div
                key={i}
                className="text-zinc-400 font-mono"
                style={{ height: 28, lineHeight: "28px", fontSize: 11 }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Textarea with lines */}
          <div className="flex-1 relative">
            {/* Horizontal lines */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 27px, #e5e5e5 27px, #e5e5e5 28px)",
                backgroundPositionY: "0px",
              }}
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="relative w-full h-full min-h-full resize-none bg-transparent border-none outline-none focus:ring-0 font-mono text-[15px] text-zinc-800 placeholder:text-zinc-300 px-4"
              style={{
                lineHeight: "28px",
                paddingTop: 1,
                paddingBottom: 40,
                caretColor: "#555",
              }}
              placeholder="Start writing..."
              spellCheck={false}
              data-testid="textarea-page-content"
            />
          </div>
        </div>
      </div>

      {/* Bottom page navigation */}
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
