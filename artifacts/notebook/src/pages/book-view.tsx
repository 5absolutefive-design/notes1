import {
  useGetBook,
  getGetBookQueryKey,
  useListPages,
  getListPagesQueryKey,
  useCreatePage,
} from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function BookView() {
  const { bookId } = useParams();
  const [, setLocation] = useLocation();
  const id = parseInt(bookId || "0", 10);
  const tabsRef = useRef<HTMLDivElement>(null);

  const { data: book, isLoading: bookLoading } = useGetBook(id, {
    query: { enabled: !!id, queryKey: getGetBookQueryKey(id) },
  });
  const { data: pages, isLoading: pagesLoading } = useListPages(id, {
    query: { enabled: !!id, queryKey: getListPagesQueryKey(id) },
  });

  const queryClient = useQueryClient();
  const createPage = useCreatePage({
    mutation: {
      onSuccess: (newPage) => {
        queryClient.invalidateQueries({ queryKey: getListPagesQueryKey(id) });
        setLocation(`/books/${id}/pages/${newPage.id}`);
      },
    },
  });

  const handleCreatePage = () => {
    const pageCount = pages?.length ?? 0;
    createPage.mutate({
      bookId: id,
      data: { title: `PAGE ${pageCount + 1}`, content: "" },
    });
  };

  const scrollTabs = (dir: "left" | "right") => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: dir === "left" ? -120 : 120, behavior: "smooth" });
    }
  };

  if (bookLoading || pagesLoading)
    return <div className="h-screen bg-background flex items-center justify-center text-muted-foreground">Loading...</div>;
  if (!book)
    return <div className="h-screen bg-background flex items-center justify-center text-muted-foreground">Book not found</div>;

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
          data-testid="btn-scroll-tabs-left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page tabs */}
        <div
          ref={tabsRef}
          className="flex items-stretch overflow-x-auto flex-1"
          style={{ scrollbarWidth: "none" }}
        >
          {pages?.map((page, index) => (
            <button
              key={page.id}
              onClick={() => setLocation(`/books/${id}/pages/${page.id}`)}
              data-testid={`tab-page-${page.id}`}
              className="px-5 py-2 text-sm font-semibold uppercase tracking-widest whitespace-nowrap text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors border-r border-zinc-700"
            >
              PAGE {index + 1}
            </button>
          ))}
        </div>

        {/* Scroll right */}
        <button
          onClick={() => scrollTabs("right")}
          className="px-2 flex items-center text-zinc-400 hover:text-white transition-colors border-l border-zinc-700"
          data-testid="btn-scroll-tabs-right"
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

      {/* Sub-header */}
      <div className="bg-[#f0ede8] border-b border-zinc-300 px-4 py-1 flex items-center shrink-0">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          {book.title}
        </span>
      </div>

      {/* Lined paper — full width */}
      <div className="flex-1 overflow-y-auto bg-white" style={{ scrollbarWidth: "thin" }}>
        <div className="flex h-full min-h-full">
          {/* Row numbers */}
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

          {/* Empty lines area with prompt */}
          <div className="flex-1 relative flex items-center justify-center">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 27px, #e5e5e5 27px, #e5e5e5 28px)",
              }}
            />
            <div className="relative text-center px-8">
              {pages && pages.length > 0 ? (
                <p className="text-zinc-400 text-sm italic">
                  Select a page above to start writing.
                </p>
              ) : (
                <div>
                  <p className="text-zinc-400 text-sm italic mb-4">
                    This notebook is empty.
                  </p>
                  <button
                    onClick={handleCreatePage}
                    className="px-6 py-2 bg-[#1a1a1a] text-white text-sm font-semibold rounded hover:bg-zinc-700 transition-colors"
                    data-testid="btn-start-writing"
                  >
                    Start Writing
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[#f0ede8] border-t border-zinc-300 px-4 py-1 flex items-center justify-center text-xs text-zinc-500 shrink-0">
        <span>{pages?.length ?? 0} {pages?.length === 1 ? "page" : "pages"}</span>
      </div>
    </div>
  );
}
