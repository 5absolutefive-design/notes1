import { useGetPage, getGetPageQueryKey, useUpdatePage, getGetBookQueryKey, useGetBook, useListPages, getListPagesQueryKey, useDeletePage } from "@workspace/api-client-react";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function PageEditor() {
  const { bookId, pageId } = useParams();
  const [, setLocation] = useLocation();
  const bId = parseInt(bookId || "0", 10);
  const pId = parseInt(pageId || "0", 10);

  const { data: book } = useGetBook(bId, { query: { enabled: !!bId, queryKey: getGetBookQueryKey(bId) } });
  const { data: pages } = useListPages(bId, { query: { enabled: !!bId, queryKey: getListPagesQueryKey(bId) } });
  const { data: page, isLoading } = useGetPage(bId, pId, { query: { enabled: !!(bId && pId), queryKey: getGetPageQueryKey(bId, pId) } });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const initializedForId = useRef<number | null>(null);
  const lastSaved = useRef({ title: "", content: "" });
  
  const queryClient = useQueryClient();
  const updatePage = useUpdatePage();
  const mutateFnRef = useRef(updatePage.mutate);
  mutateFnRef.current = updatePage.mutate;

  const deletePage = useDeletePage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPagesQueryKey(bId) });
        setLocation(`/books/${bId}`);
      }
    }
  });

  const handleDelete = () => {
    if (confirm("Delete this page?")) {
      deletePage.mutate({ bookId: bId, pageId: pId });
    }
  };

  const savePage = useCallback((data: { title: string, content: string }) => {
    mutateFnRef.current({
      bookId: bId,
      pageId: pId,
      data
    }, {
      onSuccess: (updatedPage) => {
        queryClient.setQueryData(getGetPageQueryKey(bId, pId), updatedPage);
        queryClient.invalidateQueries({ queryKey: getListPagesQueryKey(bId) });
      }
    });
  }, [bId, pId, queryClient]);

  useEffect(() => {
    if (page && initializedForId.current !== pId) {
      initializedForId.current = pId;
      setTitle(page.title);
      setContent(page.content);
      lastSaved.current = { title: page.title, content: page.content };
    }
  }, [page, pId]);

  useEffect(() => {
    if (initializedForId.current !== pId) return;
    
    const timer = setTimeout(() => {
      if (title !== lastSaved.current.title || content !== lastSaved.current.content) {
        savePage({ title, content });
        lastSaved.current = { title, content };
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [title, content, pId, savePage]);

  if (isLoading) return <div className="min-h-screen p-12 bg-background">Loading page...</div>;
  if (!page) return <div className="min-h-screen p-12 bg-background">Page not found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <Link href={`/books/${bId}`} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{book?.title || "Book"}</span>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-serif text-xl font-medium bg-transparent border-none outline-none p-0 m-0 focus:ring-0 w-64 text-foreground placeholder:text-muted-foreground"
              placeholder="Page Title"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <button 
            onClick={handleDelete}
            disabled={deletePage.isPending}
            className="hover:text-destructive transition-colors p-2"
            title="Delete page"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <span>{updatePage.isPending ? "Saving..." : "Saved"}</span>
        </div>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12">
        <div className="flex flex-wrap gap-2 mb-8 border-b border-border/50 pb-px">
          {pages?.map((p, index) => (
            <Link 
              key={p.id} 
              href={`/books/${bId}/pages/${p.id}`}
              className={`px-4 py-2 text-sm font-medium uppercase tracking-wider rounded-t-lg transition-colors border-b-2 -mb-[2px] ${
                p.id === pId 
                  ? "text-foreground border-primary bg-secondary/30" 
                  : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/20 hover:border-border/50"
              }`}
            >
              Page {index + 1}
            </Link>
          ))}
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-sm border border-border/50 min-h-[70vh] relative overflow-hidden flex">
           {/* Left margin row numbers and red line */}
           <div className="w-12 shrink-0 border-r border-red-500/20 flex flex-col pt-[2px] items-center text-[10px] text-muted-foreground/40 font-mono select-none bg-secondary/10">
              {Array.from({ length: 50 }).map((_, i) => (
                <div key={i} style={{ height: '32px', lineHeight: '32px' }}>{i + 1}</div>
              ))}
           </div>
           
           <textarea
             value={content}
             onChange={(e) => setContent(e.target.value)}
             className="flex-1 resize-none bg-transparent border-none p-0 pl-4 pr-8 focus:ring-0 font-serif text-lg leading-[32px] notebook-lines text-foreground placeholder:text-muted-foreground/50 placeholder:italic"
             placeholder="Start writing..."
             spellCheck={false}
           />
        </div>
      </div>
    </div>
  );
}
