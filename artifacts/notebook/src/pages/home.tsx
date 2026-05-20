import { Link } from "wouter";
import { Plus, Book as BookIcon, Trash2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { store, type Book } from "@/lib/store";

export default function Home() {
  const [books, setBooks] = useState<(Book & { pageCount: number })[]>([]);
  const [recentTitle, setRecentTitle] = useState<{ id: number; title: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const refresh = useCallback(() => {
    const summary = store.getSummary();
    const allBooks = store.listBooks().map((b) => ({
      ...b,
      pageCount: summary.recentBooks.find((r) => r.id === b.id)?.pageCount ??
        store.listPages(b.id).length,
    }));
    setBooks(allBooks);
    const recent = summary.recentBooks[0];
    setRecentTitle(recent ? { id: recent.id, title: recent.title } : null);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    store.createBook({ title: newTitle.trim(), color: "#1e293b" });
    setCreateOpen(false);
    setNewTitle("");
    refresh();
  };

  const handleDelete = (e: React.MouseEvent, bookId: number) => {
    e.preventDefault();
    if (confirm("Delete this notebook and all its pages?")) {
      store.deleteBook(bookId);
      refresh();
    }
  };

  return (
    <div className="min-h-screen w-full bg-background p-6 md:p-12 max-w-6xl mx-auto">
      <header className="mb-12 flex flex-col gap-2">
        <h1 className="text-4xl font-serif font-bold text-foreground">My Notebooks</h1>
        {recentTitle && (
          <p className="text-muted-foreground">
            Recent edit:{" "}
            <Link href={`/books/${recentTitle.id}`} className="hover:text-primary transition-colors">
              {recentTitle.title}
            </Link>
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-10">
        {books.map((book) => (
          <Link key={book.id} href={`/books/${book.id}`} className="group flex flex-col gap-3 relative">
            <div
              className="aspect-[3/4] rounded-md shadow-md transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl relative overflow-hidden"
              style={{ backgroundColor: book.color || "var(--color-card)" }}
            >
              <div className="absolute left-4 top-0 bottom-0 w-px bg-black/20 shadow-[1px_0_2px_rgba(255,255,255,0.1)]" />
              <div
                className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage:
                    'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                }}
              />
            </div>
            <div className="text-center px-2 flex justify-between items-center group/text">
              <div className="flex-1 text-left">
                <h3 className="font-serif font-medium text-sm line-clamp-2">{book.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{book.pageCount} pages</p>
              </div>
              <button
                onClick={(e) => handleDelete(e, book.id)}
                className="opacity-0 group-hover/text:opacity-100 p-2 text-muted-foreground hover:text-destructive transition-all"
                title="Delete Notebook"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </Link>
        ))}
      </div>

      {books.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <BookIcon className="w-12 h-12 mb-4 opacity-20" />
          <p>No notebooks yet. Create your first one.</p>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-primary/30">
            <Plus className="w-6 h-6" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] font-sans">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">New Notebook</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-6">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Daily Journal"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!newTitle.trim()}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
