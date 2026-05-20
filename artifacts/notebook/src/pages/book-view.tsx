import { useGetBook, getGetBookQueryKey, useListPages, getListPagesQueryKey, useCreatePage } from "@workspace/api-client-react";
import { Link, useParams, useLocation } from "wouter";
import { Plus, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function BookView() {
  const { bookId } = useParams();
  const [, setLocation] = useLocation();
  const id = parseInt(bookId || "0", 10);
  
  const { data: book, isLoading: bookLoading } = useGetBook(id, { query: { enabled: !!id, queryKey: getGetBookQueryKey(id) } });
  const { data: pages, isLoading: pagesLoading } = useListPages(id, { query: { enabled: !!id, queryKey: getListPagesQueryKey(id) } });
  
  const queryClient = useQueryClient();
  const createPage = useCreatePage({
    mutation: {
      onSuccess: (newPage) => {
        queryClient.invalidateQueries({ queryKey: getListPagesQueryKey(id) });
        setLocation(`/books/${id}/pages/${newPage.id}`);
      }
    }
  });

  const handleCreatePage = () => {
    createPage.mutate({
      bookId: id,
      data: { title: "Untitled Page", content: "" }
    });
  };

  if (bookLoading || pagesLoading) return <div className="min-h-screen p-12 bg-background">Loading...</div>;
  if (!book) return <div className="min-h-screen p-12 bg-background">Book not found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-serif text-xl font-medium">{book.title}</h1>
        </div>
        <button 
          onClick={handleCreatePage}
          disabled={createPage.isPending}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          New Page
        </button>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-12">
        <div className="flex flex-wrap gap-2 mb-8">
          {pages?.map((page, index) => (
            <Link 
              key={page.id} 
              href={`/books/${id}/pages/${page.id}`}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-t-lg transition-colors uppercase tracking-wider border-b-2 border-transparent hover:border-border"
            >
              Page {index + 1}
            </Link>
          ))}
        </div>

        {pages?.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground font-serif text-lg italic">This notebook is empty.</p>
            <button 
              onClick={handleCreatePage}
              className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              Start writing
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-border/50 p-8 min-h-[60vh] notebook-lines relative">
             <div className="absolute left-12 top-0 bottom-0 w-px bg-red-500/20" />
             <div className="pl-12 pt-4">
               <p className="font-serif text-muted-foreground italic">Select a page above to start reading or writing.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
