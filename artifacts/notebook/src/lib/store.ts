export interface Book {
  id: number;
  title: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: number;
  bookId: number;
  title: string;
  content: string;
  pageNumber: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const BOOKS_KEY = "nb_books";
const PAGES_KEY = "nb_pages";
let _bookIdSeq = 0;
let _pageIdSeq = 0;

function now() {
  return new Date().toISOString();
}

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveBooks(books: Book[]) {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

function loadPages(): Page[] {
  try {
    const raw = localStorage.getItem(PAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePages(pages: Page[]) {
  localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
}

function nextBookId(): number {
  const books = loadBooks();
  const max = books.reduce((m, b) => Math.max(m, b.id), _bookIdSeq);
  _bookIdSeq = max + 1;
  return _bookIdSeq;
}

function nextPageId(): number {
  const pages = loadPages();
  const max = pages.reduce((m, p) => Math.max(m, p.id), _pageIdSeq);
  _pageIdSeq = max + 1;
  return _pageIdSeq;
}

export const store = {
  listBooks(): Book[] {
    return loadBooks().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getBook(id: number): Book | undefined {
    return loadBooks().find((b) => b.id === id);
  },

  createBook(data: { title: string; color?: string }): Book {
    const books = loadBooks();
    const book: Book = {
      id: nextBookId(),
      title: data.title,
      color: data.color ?? "#1e293b",
      createdAt: now(),
      updatedAt: now(),
    };
    books.push(book);
    saveBooks(books);
    return book;
  },

  updateBook(id: number, data: Partial<Pick<Book, "title" | "color">>): Book {
    const books = loadBooks();
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error("Book not found");
    books[idx] = { ...books[idx], ...data, updatedAt: now() };
    saveBooks(books);
    return books[idx];
  },

  deleteBook(id: number) {
    const books = loadBooks().filter((b) => b.id !== id);
    saveBooks(books);
    const pages = loadPages().filter((p) => p.bookId !== id);
    savePages(pages);
  },

  listPages(bookId: number): Page[] {
    return loadPages()
      .filter((p) => p.bookId === bookId && !p.deletedAt)
      .sort((a, b) => a.pageNumber - b.pageNumber);
  },

  listTrashedPages(bookId: number): Page[] {
    return loadPages()
      .filter((p) => p.bookId === bookId && !!p.deletedAt)
      .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
  },

  getPage(bookId: number, pageId: number): Page | undefined {
    return loadPages().find((p) => p.bookId === bookId && p.id === pageId && !p.deletedAt);
  },

  createPage(bookId: number, data: { title: string; content?: string }): Page {
    const pages = loadPages();
    const existing = pages.filter((p) => p.bookId === bookId && !p.deletedAt);
    const page: Page = {
      id: nextPageId(),
      bookId,
      title: data.title,
      content: data.content ?? "",
      pageNumber: existing.length + 1,
      deletedAt: null,
      createdAt: now(),
      updatedAt: now(),
    };
    pages.push(page);
    savePages(pages);
    this._touchBook(bookId);
    return page;
  },

  updatePage(bookId: number, pageId: number, data: Partial<Pick<Page, "title" | "content">>): Page {
    const pages = loadPages();
    const idx = pages.findIndex((p) => p.bookId === bookId && p.id === pageId);
    if (idx === -1) throw new Error("Page not found");
    pages[idx] = { ...pages[idx], ...data, updatedAt: now() };
    savePages(pages);
    this._touchBook(bookId);
    return pages[idx];
  },

  deletePage(bookId: number, pageId: number) {
    const pages = loadPages();
    const idx = pages.findIndex((p) => p.bookId === bookId && p.id === pageId);
    if (idx === -1) throw new Error("Page not found");
    pages[idx] = { ...pages[idx], deletedAt: now(), updatedAt: now() };
    savePages(pages);
  },

  restorePage(bookId: number, pageId: number): Page {
    const pages = loadPages();
    const idx = pages.findIndex((p) => p.bookId === bookId && p.id === pageId);
    if (idx === -1) throw new Error("Page not found");
    const active = pages.filter((p) => p.bookId === bookId && !p.deletedAt);
    pages[idx] = { ...pages[idx], deletedAt: null, pageNumber: active.length + 1, updatedAt: now() };
    savePages(pages);
    return pages[idx];
  },

  permanentDeletePage(bookId: number, pageId: number) {
    const pages = loadPages().filter((p) => !(p.bookId === bookId && p.id === pageId));
    savePages(pages);
  },

  getSummary() {
    const books = this.listBooks();
    const pages = loadPages();
    return {
      totalBooks: books.length,
      totalPages: pages.filter((p) => !p.deletedAt).length,
      recentBooks: books.slice(0, 3).map((b) => ({
        ...b,
        pageCount: pages.filter((p) => p.bookId === b.id && !p.deletedAt).length,
      })),
    };
  },

  _touchBook(bookId: number) {
    const books = loadBooks();
    const idx = books.findIndex((b) => b.id === bookId);
    if (idx !== -1) {
      books[idx].updatedAt = now();
      saveBooks(books);
    }
  },
};
