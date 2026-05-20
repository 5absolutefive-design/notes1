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

const LINE_HEIGHT = 28;
const TOTAL_LINES = 200;

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
    return <div className="h-screen bg-[#ece9e3] flex items-center justify-center text-zinc-400">Loading...</div>;
  if (!book)
    return <div className="h-screen bg-[#ece9e3] flex items-center justify-center text-zinc-400">Book not found</div>;

  return (
    <div className="h-screen bg-[#ece9e3] flex flex-col overflow-hidden">

      {/* Card 1 — EDIT card */}
      <div className="bg-[#ece9e3] px-4 pt-3 pb-2 shrink-0">
        <div className="bg-[#f5f2ee] border border-zinc-300 rounded-xl px-3 py-3 shadow-sm">
          <div className="inline-flex items-start gap-2">

            {/* Group 1 — 2×2 grid */}
            <div className="border border-zinc-400 rounded-lg p-1.5">
              <div className="grid grid-cols-2 gap-1">
                {[0,1,2,3].map(i => (
                  <button key={i} className="w-8 h-8 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors" />
                ))}
              </div>
            </div>

            {/* Group 2 — 2 rows */}
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

            {/* Group 3 — 2×2 grid */}
            <div className="border border-zinc-400 rounded-lg p-1.5">
              <div className="grid grid-cols-2 gap-1">
                {[0,1,2,3].map(i => (
                  <button key={i} className="w-8 h-8 rounded-md border border-zinc-300 bg-white hover:bg-zinc-100 active:bg-zinc-200 transition-colors" />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

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
              data-testid="btn-scroll-tabs-left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
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
            <button
              onClick={() => scrollTabs("right")}
              className="px-2 flex items-center text-zinc-400 hover:text-white transition-colors border-l border-zinc-700"
              data-testid="btn-scroll-tabs-right"
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

      {/* Card 3 — Sub-header + content + bottom bar */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#ece9e3] px-4 pb-4">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-xl border border-zinc-300 shadow-sm bg-white">

          {/* Sub-header */}
          <div className="bg-[#f5f2ee] border-b border-zinc-200 px-4 py-1 flex items-center shrink-0">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-700">
              {book.title}
            </span>
          </div>

          {/* Lined paper area */}
          <div className="flex-1 overflow-y-auto bg-white" style={{ scrollbarWidth: "thin" }}>
            <div className="flex h-full">
              <div
                className="shrink-0 bg-[#f9f7f4] border-r border-zinc-200 select-none"
                style={{ width: 40 }}
              >
                {Array.from({ length: TOTAL_LINES }).map((_, i) => (
                  <div
                    key={i}
                    className="text-zinc-400 font-mono flex items-center justify-end pr-2"
                    style={{ height: LINE_HEIGHT, fontSize: 11 }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <div className="flex-1 relative flex items-center justify-center">
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
          <div className="bg-[#f5f2ee] border-t border-zinc-200 px-4 py-1 flex items-center justify-center text-xs text-zinc-500 shrink-0">
            <span>{pages?.length ?? 0} {pages?.length === 1 ? "page" : "pages"}</span>
          </div>

        </div>
      </div>

    </div>
  );
}
