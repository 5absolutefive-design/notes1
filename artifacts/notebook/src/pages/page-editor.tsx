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
import { useState, useEffect, useRef, useCallback, KeyboardEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";

const TOTAL_LINES = 1000;
const LINE_HEIGHT = 28;

function contentToLines(content: string): string[] {
  const raw = content.split("\n");
  const lines = Array.from({ length: TOTAL_LINES }, (_, i) => raw[i] ?? "");
  return lines;
}

function linesToContent(lines: string[]): string {
  // trim trailing empty lines but keep at least 1
  let last = lines.length - 1;
  while (last > 0 && lines[last] === "") last--;
  return lines.slice(0, last + 1).join("\n");
}

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

  const [lines, setLines] = useState<string[]>(() => Array(TOTAL_LINES).fill(""));
  const initializedForId = useRef<number | null>(null);
  const lastSavedContent = useRef("");
  const lineRefs = useRef<(HTMLInputElement | null)[]>([]);
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
        queryClient.invalidateQueries({ queryKey: getListPagesQueryList(bId) });
        setLocation(`/books/${bId}`);
      },
    },
  });

  function getListPagesQueryList(id: number) {
    return getListPagesQueryKey(id);
  }

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
    (content: string) => {
      const title = page?.title ?? `PAGE ${page?.pageNumber ?? 1}`;
      mutateFnRef.current(
        { bookId: bId, pageId: pId, data: { title, content } },
        {
          onSuccess: (updatedPage) => {
            queryClient.setQueryData(getGetPageQueryKey(bId, pId), updatedPage);
            queryClient.invalidateQueries({ queryKey: getListPagesQueryKey(bId) });
          },
        }
      );
    },
    [bId, pId, queryClient, page]
  );

  // Initialize lines from page content
  useEffect(() => {
    if (page && initializedForId.current !== pId) {
      initializedForId.current = pId;
      setLines(contentToLines(page.content));
      lastSavedContent.current = page.content;
    }
  }, [page, pId]);

  // Auto-save debounce
  useEffect(() => {
    if (initializedForId.current !== pId) return;
    const content = linesToContent(lines);
    const timer = setTimeout(() => {
      if (content !== lastSavedContent.current) {
        savePage(content);
        lastSavedContent.current = content;
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [lines, pId, savePage]);

  const handleLineChange = (index: number, value: string) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleLineKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < TOTAL_LINES) {
        lineRefs.current[nextIndex]?.focus();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = index + 1;
      if (nextIndex < TOTAL_LINES) {
        lineRefs.current[nextIndex]?.focus();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = index - 1;
      if (prevIndex >= 0) {
        lineRefs.current[prevIndex]?.focus();
      }
    } else if (e.key === "Backspace" && lines[index] === "" && index > 0) {
      e.preventDefault();
      lineRefs.current[index - 1]?.focus();
    }
  };

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

  const currentPageLabel = `PAGE ${page.pageNumber}`;

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Dark top bar with tabs */}
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
            data-testid="btn-delete-page"
          >
            Delete
          </button>
        </div>
      </div>

      {/* 1000-line paper */}
      <div className="flex-1 overflow-y-auto bg-white" style={{ scrollbarWidth: "thin" }}>
        <div className="flex">
          {/* Row number column */}
          <div
            className="shrink-0 bg-[#f9f7f4] border-r border-zinc-200 text-right select-none"
            style={{ width: 40 }}
          >
            {Array.from({ length: TOTAL_LINES }).map((_, i) => (
              <div
                key={i}
                className="text-zinc-400 font-mono flex items-center justify-end pr-2"
                style={{ height: LINE_HEIGHT, fontSize: 11 }}
                onClick={() => lineRefs.current[i]?.focus()}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Lines */}
          <div className="flex-1 flex flex-col">
            {Array.from({ length: TOTAL_LINES }).map((_, i) => (
              <div
                key={i}
                className="relative border-b border-zinc-100"
                style={{ height: LINE_HEIGHT }}
              >
                <input
                  ref={(el) => { lineRefs.current[i] = el; }}
                  type="text"
                  value={lines[i] ?? ""}
                  onChange={(e) => handleLineChange(i, e.target.value)}
                  onKeyDown={(e) => handleLineKeyDown(i, e)}
                  className="absolute inset-0 w-full bg-transparent border-none outline-none focus:ring-0 px-3 text-zinc-800 font-mono"
                  style={{ fontSize: 14, lineHeight: `${LINE_HEIGHT}px`, height: LINE_HEIGHT }}
                  placeholder={i === 0 ? "Start writing..." : ""}
                  spellCheck={false}
                  data-testid={`line-input-${i}`}
                />
              </div>
            ))}
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
